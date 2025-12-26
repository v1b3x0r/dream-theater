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

def get_web_urls(rel_path, thumb_file):
    # 🛡️ THE MASTER WIRING: Pre-encode URLs for the frontend
    full_url = f"/raw/{quote(str(rel_path).replace(get_backslash(), '/'))}"
    thumb_url = f"/thumbs/{quote(thumb_file)}" if thumb_file else None
    return full_url, thumb_url

class SearchResult(BaseModel):
    id: Optional[int] = None
    path: str
    score: float
    type: str
    display_path: str
    thumb: Optional[str] = None # This will be the full URL
    raw_url: Optional[str] = None # Added for convenience
    metadata: Optional[dict] = {}
    tags: Optional[List[str]] = []
    ts: Optional[int] = 0
    conf: Optional[float] = 0.0
    src: Optional[str] = "os"
    x: Optional[float] = 0.0
    y: Optional[float] = 0.0
    z: Optional[float] = 0.0
    cluster_id: Optional[int] = None

def map_row(r, tag_map={}):
    try:
        full_url, thumb_url = get_web_urls(r['path'], r['thumb_path'])
        return {
            "id": r['id'], "path": r['path'], "score": 1.0, "type": r['type'],
            "ts": r['ts_real'] or r['ts_inferred'] or 0,
            "conf": r['time_confidence'] or 0.0, "src": r['time_source'] or "os",
            "display_path": r['path'],
            "thumb": thumb_url,
            "raw_url": full_url,
            "metadata": json.loads(r['metadata'] if r['metadata'] else "{}"),
            "tags": tag_map.get(r['path'], []),
            "x": r['x'], "y": r['y'], "z": r['z'],
            "cluster_id": r['cluster_id']
        }
    except: return None

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
        return {"total": total, "distribution": counts, "identities": id_counts, "wisdom": {"level": level, "xp_percent": xp, "mapped": mapped, "rank": "Explorer"}, "device": ai.device}
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
    try:
        with get_conn() as conn:
            rows = conn.execute("SELECT cluster_id, cluster_label, thumb_path, count(*) FROM assets WHERE cluster_id IS NOT NULL GROUP BY cluster_id ORDER BY count(*) DESC").fetchall()
        return [{"id": r[0], "label": r[1] or f"Sector {r[0]}", "thumb": f"/thumbs/{r[2]}" if r[2] else None, "count": r[3]} for r in rows]
    except: return []

@router.get("/galaxy/all")
async def get_all_stars():
    try:
        with get_conn() as conn:
            rows = conn.execute("SELECT * FROM assets WHERE x IS NOT NULL LIMIT 5000").fetchall()
            links = conn.execute("SELECT asset_path, name FROM identity_links JOIN identities ON identity_links.identity_id = identities.id").fetchall()
            tag_map = {}
            for p, n in links: tag_map.setdefault(p, []).append(n)
        return [map_row(r, tag_map) for r in rows if map_row(r, tag_map)]
    except: return []

@router.get("/search", response_model=List[SearchResult])
async def search(q: str = "", threshold: float = 0.15):
    q_lower = (q or "").strip().lower()
    with get_conn() as conn:
        links = conn.execute("SELECT asset_path, name FROM identity_links JOIN identities ON identity_links.identity_id = identities.id").fetchall()
        tag_map = {}
        for p, n in links: tag_map.setdefault(p, []).append(n)
        if not q_lower or q_lower == "everything":
            rows = conn.execute("SELECT * FROM assets WHERE type='image' AND is_captured = 0 ORDER BY COALESCE(ts_real, ts_inferred) DESC LIMIT 500").fetchall()
            return [map_row(r, tag_map) for r in rows if map_row(r, tag_map)]
        
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
    results = []
    try:
        db_v = torch.tensor(np.array([np.frombuffer(r['vector'], dtype=np.float32) for r in all_assets])).to(ai.device)
        if len(target_vec.shape) == 1: target_vec = target_vec.unsqueeze(0)
        scores = (util.cos_sim(target_vec, db_v)[0] * (2.0 if matched_name else 1.0)).cpu().tolist()
        for idx, r in enumerate(all_assets):
            s = scores[idx]
            if s < (0.22 if matched_name else threshold): continue
            if r['type'] == 'audio' and s < 0.25: continue
            item = map_row(r, tag_map)
            if item: item['score'] = float(s); results.append(item)
    except: pass
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:500]

@router.post("/identities/teach")
async def teach_identity(req: dict = Body(...)):
    try:
        name, anchors = req.get('name'), req.get('anchors', [])
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

@router.post("/weave")
async def weave(req: dict = Body(...)): return []