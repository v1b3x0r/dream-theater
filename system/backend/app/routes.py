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

def map_asset(r, tag_map={}):
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
    ts: Optional[int]
    conf: Optional[float]
    src: Optional[str]
    x: Optional[float]
    y: Optional[float]
    z: Optional[float]
    cluster_id: Optional[int]

# ... (Previous endpoints stats, identities, discovery, scan remain the same) ...
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
        rows = conn.execute("SELECT name, count, cover_path FROM identities").fetchall()
    return [{"name": r[0], "count": r[1], "thumb": f"/thumbs/{thumb_name(r[2])}" if r[2] else None} for r in rows]

@router.get("/discovery")
async def get_discovery():
    with get_conn() as conn:
        rows = conn.execute("SELECT cluster_id, cluster_label, thumb_path, count(*) as count FROM assets WHERE cluster_id IS NOT NULL GROUP BY cluster_id ORDER BY count DESC LIMIT 12").fetchall()
    return [{"id": r[0], "label": r[1] or f"Sector {r[0]}", "thumb": f"/thumbs/{r[2]}" if r[2] else None, "count": r[3]} for r in rows]

@router.get("/galaxy/all")
async def get_all_stars():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM assets WHERE x IS NOT NULL LIMIT 2000").fetchall()
    return [map_asset(dict(r)) for r in rows if map_asset(dict(r))]

# --- 🔱 THE ORACLE'S SEARCH LOGIC ---
@router.get("/search", response_model=List[SearchResult])
async def search(q: str = "", threshold: float = 0.15):
    q_lower = (q or "").strip().lower()
    
    with get_conn() as conn:
        # Load Tags
        links = conn.execute("SELECT asset_path, name FROM identity_links JOIN identities ON identity_links.identity_id = identities.id").fetchall()
        tag_map = {}
        for p, n in links: tag_map.setdefault(p, []).append(n)

        # 🕒 AUTO-RECENCY (Default View)
        if not q_lower or q_lower == "everything" or q_lower == "null":
            # Just images for the grid
            img_rows = conn.execute("SELECT * FROM assets WHERE type='image' AND is_captured = 0 ORDER BY COALESCE(ts_real, ts_inferred) DESC LIMIT 500").fetchall()
            # Just a few recent tracks for vibe
            aud_rows = conn.execute("SELECT * FROM assets WHERE type='audio' ORDER BY ts_inferred DESC LIMIT 12").fetchall()
            
            # 🛡️ MERGE WITHOUT SORTING (Audio first as Context)
            return [map_asset(dict(r), tag_map) for r in aud_rows if map_asset(dict(r))] + \
                   [map_asset(dict(r), tag_map) for r in img_rows if map_asset(dict(r))]

        # 🧬 SEMANTIC SEARCH (Intent-Gated)
        id_rows = conn.execute("SELECT name, vector FROM identities").fetchall()
        target_vec, matched_name = None, None
        for name, vec_blob in id_rows:
            if name.lower() in q_lower:
                matched_name = name
                id_v = torch.tensor(np.frombuffer(vec_blob, dtype=np.float32)).to(ai.device)
                t_v = ai.encode_text(q); target_vec = (id_v * 0.7) + (t_v * 0.3); target_vec = target_vec / target_vec.norm()
                break
        if target_vec is None: target_vec = ai.encode_text(q)
        
        # 🛡️ SEPARATE QUERIES (Index Separation)
        img_candidates = conn.execute("SELECT * FROM assets WHERE type='image' AND is_captured = 0").fetchall()
        aud_candidates = conn.execute("SELECT * FROM assets WHERE type='audio'").fetchall()

    # 1. Process Images (The Content)
    img_results = []
    if img_candidates:
        db_v = torch.tensor(np.array([np.frombuffer(r['vector'], dtype=np.float32) for r in img_candidates])).to(ai.device)
        if len(target_vec.shape) == 1: target_vec = target_vec.unsqueeze(0)
        scores = util.cos_sim(target_vec, db_v)[0].cpu().tolist()
        
        for idx, r in enumerate(img_candidates):
            s = scores[idx]
            min_th = 0.22 if matched_name else threshold
            if s < min_th: continue
            
            item = dict(r); item['score'] = s
            mapped = map_asset(item, tag_map)
            if mapped: img_results.append(mapped)
    
    img_results.sort(key=lambda x: x['score'], reverse=True)
    img_results = img_results[:500] # Hard limit for visuals

    # 2. Process Audio (The Context)
    aud_results = []
    if aud_candidates:
        db_v = torch.tensor(np.array([np.frombuffer(r['vector'], dtype=np.float32) for r in aud_candidates])).to(ai.device)
        scores = util.cos_sim(target_vec, db_v)[0].cpu().tolist()
        
        for idx, r in enumerate(aud_candidates):
            s = scores[idx]
            if s < 0.2: continue # Audio needs reasonable relevance
            
            item = dict(r); item['score'] = s
            mapped = map_asset(item, tag_map)
            if mapped: aud_results.append(mapped)
            
    aud_results.sort(key=lambda x: x['score'], reverse=True)
    aud_results = aud_results[:12] # Hard limit for context

    # 🛡️ FINAL MERGE: Context First, Content Second (No Re-sort!)
    return aud_results + img_results

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

@router.get("/search/seed")
async def search_by_seed(path: str, threshold: float = 0.22):
    with get_conn() as conn:
        seed_row = conn.execute("SELECT vector FROM assets WHERE path = ?", (path,)).fetchone()
        if not seed_row: return []
        seed_vec = torch.tensor(np.frombuffer(seed_row['vector'], dtype=np.float32)).to(ai.device)
        
        # Fetch separately
        img_candidates = conn.execute("SELECT * FROM assets WHERE type='image' AND is_captured = 0").fetchall()
        aud_candidates = conn.execute("SELECT * FROM assets WHERE type='audio'").fetchall()

    # Images
    img_results = []
    if img_candidates:
        db_v = torch.tensor(np.array([np.frombuffer(r['vector'], dtype=np.float32) for r in img_candidates])).to(ai.device)
        scores = util.cos_sim(seed_vec, db_v)[0].cpu().tolist()
        for idx, r in enumerate(img_candidates):
            if scores[idx] < threshold: continue
            item = dict(r); item['score'] = scores[idx]
            mapped = map_asset(item)
            if mapped: img_results.append(mapped)
    img_results.sort(key=lambda x: x['score'], reverse=True)
    img_results = img_results[:200]

    # Audio
    aud_results = []
    if aud_candidates:
        db_v = torch.tensor(np.array([np.frombuffer(r['vector'], dtype=np.float32) for r in aud_candidates])).to(ai.device)
        scores = util.cos_sim(seed_vec, db_v)[0].cpu().tolist()
        for idx, r in enumerate(aud_candidates):
            if scores[idx] < 0.2: continue
            item = dict(r); item['score'] = scores[idx]
            mapped = map_asset(item)
            if mapped: aud_results.append(mapped)
    aud_results.sort(key=lambda x: x['score'], reverse=True)
    aud_results = aud_results[:12]

    return aud_results + img_results

@router.post("/weave")
async def weave(req: dict = Body(...)): return []
