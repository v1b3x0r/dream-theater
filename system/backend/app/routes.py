from fastapi import APIRouter, BackgroundTasks, Body, HTTPException
from pathlib import Path
import json
import torch
import numpy as np
import os
from sentence_transformers import util
from pydantic import BaseModel
from typing import List, Optional
from urllib.parse import quote

from .config import DREAM_BOX, THUMB_DIR
from .db import get_conn
from .models import ai
from .scanner import process_scan, scan_status, thumb_name, get_backslash

router = APIRouter()

def web_path(p):
    return str(p).replace(get_backslash(), "/")

def map_asset(r, tag_map={}, id_map={}):
    try:
        rel_path = r['path']
        thumb = r['thumb_path']
        return {
            "id": r['id'],
            "path": rel_path,
            "score": r.get('score', 1.0),
            "type": r['type'],
            "ts": r['ts_real'] or r['ts_inferred'] or 0,
            "conf": r['time_confidence'] or 0.0,
            "src": r['time_source'] or "os",
            "display_path": rel_path,
            "thumb": f"/thumbs/{thumb}" if thumb else None,
            "raw_url": f"/raw/{quote(rel_path.replace(get_backslash(), '/'))}",
            "metadata": json.loads(r['metadata'] if r['metadata'] else "{}"),
            "tags": tag_map.get(rel_path, []),
            "identities": id_map.get(rel_path, []),
            "neural_metrics": {
                "coherence": r.get('coherence', 0.0) or 0.0,
                "stability": r.get('stability', 0.0) or 0.0,
                "temporal": r.get('temporal_weight', 0.0) or 0.0
            },
            "x": r['x'], "y": r['y'], "z": r['z'],
            "cluster_id": r['cluster_id']
        }
    except Exception as e: return None

class SearchResult(BaseModel):
    id: Optional[int]
    path: str
    score: float
    type: str
    display_path: str
    thumb: Optional[str]
    raw_url: Optional[str]
    metadata: Optional[dict]
    tags: Optional[List[str]]
    identities: Optional[List[str]]
    neural_metrics: Optional[dict]
    ts: Optional[int]
    conf: Optional[float]
    src: Optional[str]
    x: Optional[float]
    y: Optional[float]
    z: Optional[float]
    cluster_id: Optional[int]

# ... (Previous endpoints) ...
@router.get("/scan/progress")
async def get_progress(): return scan_status

@router.get("/stats")
async def get_stats():
    try:
        with get_conn() as conn:
            total = conn.execute("SELECT count(*) FROM assets").fetchone()[0]
            counts = dict(conn.execute("SELECT type, count(*) FROM assets GROUP BY type").fetchall())
            tagged = conn.execute("SELECT count(DISTINCT asset_path) FROM identity_links").fetchone()[0]
            mapped = conn.execute("SELECT count(*) FROM assets WHERE x IS NOT NULL").fetchone()[0]
            id_counts = conn.execute("SELECT count(*) FROM identities").fetchone()[0]
            xp = round((tagged / total * 100), 1) if total > 0 else 0
            level = int(total // 100)
        return {"total": total, "distribution": counts, "identities": id_counts, "wisdom": {"level": level, "xp_percent": xp, "mapped": mapped}, "device": ai.device}
    except: return {"total": 0, "distribution": {}}

@router.post("/scan")
async def start_scan(bt: BackgroundTasks):
    if scan_status["status"] == "idle": bt.add_task(process_scan)
    return {"status": "started"}

@router.get("/identities")
async def list_identities():
    with get_conn() as conn:
        # 🛡️ JOIN to get the REAL thumb_path (SSOT)
        rows = conn.execute("""
            SELECT i.name, i.count, a.thumb_path 
            FROM identities i 
            LEFT JOIN assets a ON i.cover_path = a.path
        """).fetchall()
    return [{"name": r[0], "count": r[1], "thumb": f"/thumbs/{r[2]}" if r[2] else None} for r in rows]

@router.get("/discovery")
async def get_discovery():
    with get_conn() as conn:
        # 🛡️ Subquery to ensure we get a non-null thumb for the cluster
        rows = conn.execute("""
            SELECT 
                cluster_id, 
                cluster_label, 
                (SELECT thumb_path FROM assets a2 WHERE a2.cluster_id = assets.cluster_id AND a2.thumb_path IS NOT NULL LIMIT 1) as best_thumb,
                count(*) as count 
            FROM assets 
            WHERE cluster_id IS NOT NULL 
            GROUP BY cluster_id 
            ORDER BY count DESC 
            LIMIT 12
        """).fetchall()
    return [{"id": r[0], "label": r[1] or f"Sector {r[0]}", "thumb": f"/thumbs/{r[2]}" if r[2] else None, "count": r[3]} for r in rows]

@router.get("/galaxy/all")
async def get_all_stars():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM assets WHERE x IS NOT NULL LIMIT 2000").fetchall()
    return [map_asset(dict(r)) for r in rows if map_asset(dict(r))]

# --- 🔱 ADAPTIVE SEARCH ENGINE ---
@router.get("/search", response_model=List[SearchResult])
async def search(q: str = "", threshold: float = 0.15):
    q_lower = (q or "").strip().lower()
    
    with get_conn() as conn:
        links = conn.execute("SELECT asset_path, name FROM identity_links JOIN identities ON identity_links.identity_id = identities.id").fetchall()
        tag_map = {}
        id_map = {}
        for p, n in links: 
            tag_map.setdefault(p, []).append(n)
            id_map.setdefault(p, []).append(n)

        # 🕒 RECENCY MODE
        if not q_lower or q_lower == "everything":
            img_rows = conn.execute("SELECT * FROM assets WHERE type='image' AND is_captured = 0 ORDER BY COALESCE(ts_real, ts_inferred) DESC LIMIT 500").fetchall()
            aud_rows = conn.execute("SELECT * FROM assets WHERE type='audio' ORDER BY ts_inferred DESC LIMIT 12").fetchall()
            return [map_asset(dict(r), tag_map, id_map) for r in aud_rows if map_asset(dict(r), tag_map, id_map)] + \
                   [map_asset(dict(r), tag_map, id_map) for r in img_rows if map_asset(dict(r), tag_map, id_map)]

        # 🧬 SEMANTIC SEARCH
        id_rows = conn.execute("SELECT name, vector FROM identities").fetchall()
        target_vec, matched_name = None, None
        for name, vec_blob in id_rows:
            if name.lower() in q_lower:
                matched_name = name
                id_v = torch.tensor(np.frombuffer(vec_blob, dtype=np.float32)).to(ai.device)
                t_v = ai.encode_text(q); target_vec = (id_v * 0.7) + (t_v * 0.3); target_vec = target_vec / target_vec.norm()
                break
        if target_vec is None: target_vec = ai.encode_text(q)
        
        all_assets = conn.execute("SELECT * FROM assets WHERE is_captured = 0").fetchall()

    if not all_assets: return []
    
    img_results, aud_results = [], []
    db_v = torch.tensor(np.array([np.frombuffer(r['vector'], dtype=np.float32) for r in all_assets])).to(ai.device)
    if len(target_vec.shape) == 1: target_vec = target_vec.unsqueeze(0)
    scores = util.cos_sim(target_vec, db_v)[0].cpu().tolist()
    
    # 📉 ADAPTIVE THRESHOLD: Start strict, loosen if needed
    current_th = 0.22 if matched_name else threshold
    
    # Debug: Print top 3 scores
    print(f"🔍 Search '{q}': Top scores = {sorted(scores, reverse=True)[:3]}")

    for idx, r in enumerate(all_assets):
        s = scores[idx] * (1.2 if r['type'] == 'image' else 1.0)
        
        # Audio logic
        if r['type'] == 'audio':
            if s >= 0.2:
                item = dict(r); item['score'] = s
                mapped = map_asset(item, tag_map, id_map)
                if mapped: aud_results.append(mapped)
        # Image logic
        else:
            if s >= current_th:
                item = dict(r); item['score'] = s
                mapped = map_asset(item, tag_map, id_map)
                if mapped: img_results.append(mapped)
    
    # 🚨 FALLBACK: If nothing found, try again with very low threshold
    if not img_results:
        print(f"⚠️ No matches for '{q}' at {current_th}. Retrying with 0.1...")
        for idx, r in enumerate(all_assets):
            if r['type'] == 'image':
                s = scores[idx] * 1.2
                if s >= 0.1: # Mercy threshold
                    item = dict(r); item['score'] = s
                    mapped = map_asset(item, tag_map, id_map)
                    if mapped: img_results.append(mapped)

    img_results.sort(key=lambda x: x['score'], reverse=True)
    aud_results.sort(key=lambda x: x['score'], reverse=True)
    
    return aud_results[:12] + img_results[:500]

@router.post("/identities/teach")
async def teach_identity(req: dict = Body(...)):
    try:
        name, anchors = req.get('name'), req.get('anchors', [])
        if not name or not anchors: return {"status": "error", "msg": "Missing name or anchors"}
        with get_conn() as conn:
            conn.execute("INSERT OR IGNORE INTO identities (name, vector, count) VALUES (?, ?, ?)", (name, b'', 0))
            row = conn.execute("SELECT id FROM identities WHERE name = ?", (name,)).fetchone()
            id_id = row['id']
            for p in anchors:
                conn.execute("INSERT OR IGNORE INTO identity_links (identity_id, asset_path) VALUES (?, ?)", (id_id, p))
            rows = conn.execute("SELECT assets.vector FROM assets JOIN identity_links ON assets.path = identity_links.asset_path WHERE identity_links.identity_id = ?", (id_id,)).fetchall()
            if rows:
                vecs = [np.frombuffer(r[0], dtype=np.float32) for r in rows]
                mv = np.mean(vecs, axis=0); mv = mv / (np.linalg.norm(mv) + 1e-10)
                conn.execute("UPDATE identities SET vector=?, count=?, cover_path=? WHERE id=?", (mv.tobytes(), len(rows), anchors[0], id_id))
            conn.commit()
        return {"status": "learned", "id": id_id}
    except Exception as e: return {"status": "error", "msg": str(e)}

@router.post("/identities/untag")
async def untag_identity(req: dict = Body(...)):
    try:
        name, path = req.get('name'), req.get('path')
        if not name or not path: return {"status": "error", "msg": "Missing name or path"}
        with get_conn() as conn:
            # Get ID
            row = conn.execute("SELECT id FROM identities WHERE name = ?", (name,)).fetchone()
            if not row: return {"status": "error", "msg": "Identity not found"}
            id_id = row['id']
            
            # Remove Link
            conn.execute("DELETE FROM identity_links WHERE identity_id = ? AND asset_path = ?", (id_id, path))
            
            # Update Count
            count = conn.execute("SELECT count(*) FROM identity_links WHERE identity_id = ?", (id_id,)).fetchone()[0]
            conn.execute("UPDATE identities SET count = ? WHERE id = ?", (count, id_id))
            conn.commit()
        return {"status": "untagged", "name": name}
    except Exception as e: return {"status": "error", "msg": str(e)}

@router.get("/search/seed")
async def search_by_seed(path: str, threshold: float = 0.22):
    with get_conn() as conn:
        seed_row = conn.execute("SELECT vector FROM assets WHERE path = ?", (path,)).fetchone()
        if not seed_row: return []
        seed_vec = torch.tensor(np.frombuffer(seed_row['vector'], dtype=np.float32)).to(ai.device)
        all_assets = conn.execute("SELECT * FROM assets WHERE is_captured = 0").fetchall()
    if not all_assets: return []
    db_v = torch.tensor(np.array([np.frombuffer(r['vector'], dtype=np.float32) for r in all_assets])).to(ai.device)
    scores = util.cos_sim(seed_vec, db_v)[0].cpu().tolist()
    results = []
    for idx, r in enumerate(all_assets):
        if scores[idx] < threshold: continue
        item = map_asset(dict(r))
        if item: item['score'] = float(scores[idx]); results.append(item)
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:200]

@router.post("/weave")
async def weave(req: dict = Body(...)): return []