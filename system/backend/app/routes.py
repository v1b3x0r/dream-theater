from fastapi import APIRouter, BackgroundTasks, Body, HTTPException
from pathlib import Path
import json
import torch
import numpy as np
import os
from sentence_transformers import util

from .config import DREAM_BOX, THUMB_DIR
from .db import get_conn
from .models import ai
from .scanner import process_scan, scan_status, thumb_name, get_backslash

router = APIRouter()

def web_path(p): return str(p).replace(get_backslash(), "/")

@router.get("/scan/progress")
async def get_progress(): return scan_status

@router.get("/stats")
async def get_stats():
    with get_conn() as conn:
        counts = dict(conn.execute("SELECT type, count(*) FROM assets GROUP BY type").fetchall())
        id_counts = conn.execute("SELECT count(*) FROM identities").fetchone()[0]
        total = conn.execute("SELECT count(*) FROM assets").fetchone()[0]
    return {"total": total, "distribution": counts, "identities": id_counts, "device": ai.device}

@router.post("/scan")
async def start_scan(bt: BackgroundTasks):
    if scan_status["status"] == "idle": bt.add_task(process_scan)
    return {"status": "started"}

@router.get("/identities")
async def list_identities():
    with get_conn() as conn:
        rows = conn.execute("SELECT name, count, cover_path FROM identities").fetchall()
    return [{"name": r[0], "count": r[1], "thumb": f"/thumbs/{thumb_name(r[2])}" if r[2] else None} for r in rows]

@router.post("/identities/teach")
async def teach_identity(req: dict = Body(...)):
    name, anchors = req.get('name'), req.get('anchors', [])
    with get_conn() as conn:
        conn.execute("INSERT OR IGNORE INTO identities (name, vector, count) VALUES (?, ?, ?)", (name, b'', 0))
        id_id = conn.execute("SELECT id FROM identities WHERE name = ?", (name,)).fetchone()[0]
        for p in anchors: conn.execute("INSERT OR IGNORE INTO identity_links (identity_id, asset_path) VALUES (?, ?)", (id_id, p))
        rows = conn.execute("SELECT assets.vector, assets.path FROM assets JOIN identity_links ON assets.path = identity_links.asset_path WHERE identity_links.identity_id = ?", (id_id,)).fetchall()
        if rows:
            vecs = [np.frombuffer(r[0], dtype=np.float32) for r in rows]
            mv = np.mean(vecs, axis=0); mv = mv / np.linalg.norm(mv)
            conn.execute("UPDATE identities SET vector=?, count=?, cover_path=? WHERE id=?", (mv.tobytes(), len(rows), rows[0][1], id_id))
        conn.commit()
    return {"status": "learned"}

@router.delete("/identities/{name}")
async def delete_identity(name: str):
    with get_conn() as conn:
        id_row = conn.execute("SELECT id FROM identities WHERE name = ?", (name,)).fetchone()
        if id_row:
            conn.execute("DELETE FROM identity_links WHERE identity_id = ?", (id_row[0],))
            conn.execute("DELETE FROM identities WHERE id = ?", (id_row[0],))
            conn.commit()
    return {"status": "deleted"}

@router.get("/search")
async def search(q: str, threshold: float = 0.15):
    if not q: return []
    q_lower = q.lower()
    
    target_vec = None
    matched_id_name = None
    
    try:
        with get_conn() as conn:
            # Check Identities
            id_rows = conn.execute("SELECT name, vector FROM identities").fetchall()
            for name, vec_blob in id_rows:
                if name.lower() in q_lower:
                    matched_id_name = name
                    matched_id_vec = torch.tensor(np.frombuffer(vec_blob, dtype=np.float32)).to(ai.device)
                    break
            
            # Text Vector
            text_vec = ai.encode_text(q)
            
            # Blend Logic
            if matched_id_name:
                print(f"🎯 Identity Hit: {matched_id_name}")
                target_vec = (matched_id_vec * 0.7) + (text_vec * 0.3)
                target_vec = target_vec / target_vec.norm()
            else:
                target_vec = text_vec

            # Get Tags
            links = conn.execute("SELECT asset_path, name FROM identity_links JOIN identities ON identity_links.identity_id = identities.id").fetchall()
            tag_map = {}
            for p, n in links: tag_map.setdefault(p, []).append(n)
            
            # Fetch Rows
            img_rows = conn.execute("SELECT path, type, vector, ts_real, ts_inferred, time_confidence, time_source, metadata, x, y, z FROM assets WHERE type='image'").fetchall()
            aud_rows = conn.execute("SELECT path, type, vector, ts_real, ts_inferred, time_confidence, time_source, metadata, x, y, z FROM assets WHERE type='audio'").fetchall()

        results = []
        
        # Process Images
        if img_rows:
            db_vecs = torch.tensor(np.array([np.frombuffer(r[2], dtype=np.float32) for r in img_rows])).to(ai.device)
            scores = util.cos_sim(target_vec, db_vecs)[0]
            vals, idxs = torch.topk(scores, k=min(len(img_rows), 500))
            for s, i in zip(vals, idxs):
                if float(s) < threshold: continue
                r = img_rows[i.item()]
                if not os.path.exists(r[0]): continue
                results.append({
                    "path": r[0], "score": float(s), "type": r[1],
                    "ts": r[3] or r[4], "conf": r[5], "src": r[6],
                    "display_path": web_path(Path(r[0]).relative_to(DREAM_BOX) if str(r[0]).startswith(str(DREAM_BOX)) else Path(r[0]).name),
                    "thumb": f"/thumbs/{thumb_name(r[0])}",
                    "metadata": json.loads(r[7]), "tags": tag_map.get(r[0], []), "x": r[8], "y": r[9], "z": r[10]
                })

        # Process Audio (Strict Limit 20)
        if aud_rows:
            db_vecs = torch.tensor(np.array([np.frombuffer(r[2], dtype=np.float32) for r in aud_rows])).to(ai.device)
            scores = util.cos_sim(target_vec, db_vecs)[0]
            vals, idxs = torch.topk(scores, k=min(len(aud_rows), 20))
            for s, i in zip(vals, idxs):
                if float(s) < threshold: continue
                r = aud_rows[i.item()]
                results.append({
                    "path": r[0], "score": float(s), "type": r[1],
                    "ts": r[3] or r[4], "conf": r[5], "src": r[6],
                    "display_path": web_path(Path(r[0]).relative_to(DREAM_BOX) if str(r[0]).startswith(str(DREAM_BOX)) else Path(r[0]).name),
                    "thumb": None,
                    "metadata": json.loads(r[7]), "tags": tag_map.get(r[0], []), "x": r[8], "y": r[9], "z": r[10]
                })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:500]

    except Exception as e:
        print(f"❌ Search Error: {e}")
        # Return empty list on error instead of 500 to keep UI alive
        return []

@router.post("/weave")
async def weave(req: dict = Body(...)):
    anchors = req.get('anchors', [])
    with get_conn() as conn:
        rows = conn.execute("SELECT path, type, ts_real, ts_inferred, time_confidence, time_source, metadata, thumb_path, x, y, z FROM assets WHERE type='image'").fetchall()
    pool = [r for r in rows if r[0] in anchors] # Simple logic
    pool.sort(key=lambda x: (x[2] or x[3] or 0))
    return [{"path": r[0], "score": 1.0, "type": r[1], "ts": r[2] or r[3], "conf": r[4], "src": r[5], "display_path": web_path(Path(r[0]).relative_to(DREAM_BOX) if str(r[0]).startswith(str(DREAM_BOX)) else Path(r[0]).name), "thumb": f"/thumbs/{thumb_name(r[0])}", "metadata": json.loads(r[6]), "x": r[8], "y": r[9], "z": r[10]} for r in pool]