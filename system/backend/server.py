import os
import sys
import json
import time
import sqlite3
from typing import List, Optional
from pathlib import Path
from contextlib import asynccontextmanager

import torch
import numpy as np
from PIL import Image, ImageFile
from PIL.ExifTags import TAGS
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util

# Allow loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True

# --- Configuration ---
ROOT_DIR = Path(__file__).parent.parent.parent
DREAM_BOX = ROOT_DIR / "DreamBox"
DB_PATH = ROOT_DIR / "system" / "backend" / "dream_sorter.db"
THUMB_DIR = DREAM_BOX / ".thumbs"

THUMB_DIR.mkdir(parents=True, exist_ok=True)
DREAM_BOX.mkdir(parents=True, exist_ok=True)

# --- Global State ---
model = None
device = "cuda" if torch.cuda.is_available() else "cpu"
scan_status = {"current": 0, "total": 0, "status": "idle", "last_file": ""}

# --- Path Helpers (The System Thinker Way - No literal backslashes) ---
def clean_path_for_web(path_str: str) -> str:
    return str(path_str).replace(chr(92), "/")

def get_safe_thumb_filename(path_str: str) -> str:
    # Replace : and \ and / with _
    return str(path_str).replace(":", "").replace(chr(92), "_").replace("/", "_") + ".jpg"

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    print(f"🎄 Awakening DreamOS on {device.upper()}...")
    try:
        model = SentenceTransformer("clip-ViT-B-32", device=device)
        print("✅ Model Online.")
    except Exception as e:
        print(f"❌ Load Error: {e}")
        sys.exit(1)
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

# Standard Robust CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# --- Database Core ---
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS assets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        path TEXT UNIQUE,
                        type TEXT,
                        vector BLOB,
                        timestamp INTEGER,
                        importance INTEGER DEFAULT 5,
                        metadata TEXT,
                        thumb_path TEXT
                    )''')

def get_exif_data(img):
    exif_data = {}
    try:
        info = img.getexif()
        if info:
            for tag, value in info.items():
                decoded = TAGS.get(tag, tag)
                if isinstance(value, bytes): value = value.decode(errors='ignore')
                exif_data[str(decoded)] = str(value)
    except: pass
    return exif_data

def generate_thumbnail(image_path: Path) -> Optional[Path]:
    thumb_name = get_safe_thumb_filename(str(image_path))
    thumb_path = THUMB_DIR / thumb_name
    if thumb_path.exists(): return thumb_path
    try:
        with Image.open(image_path) as img:
            img.thumbnail((200, 200)) 
            img.convert("RGB").save(thumb_path, "JPEG", quality=40, optimize=True)
        return thumb_path
    except: return None

# --- Background Scan Worker ---
def run_scan():
    global scan_status
    print("🚀 Background Scan Started...")
    
    with sqlite3.connect(DB_PATH) as conn:
        # 1. Ghost Cleanup
        cursor = conn.cursor()
        cursor.execute("SELECT id, path FROM assets")
        for db_id, p in cursor.fetchall():
            if not os.path.exists(p):
                conn.execute("DELETE FROM assets WHERE id=?", (db_id,))
        conn.commit()

        # 2. File Discovery
        image_exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        all_files = []
        for root, dirs, files in os.walk(DREAM_BOX):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'system' and d != 'node_modules']
            for file in files:
                if file.startswith('._') or file.startswith('.'): continue
                if os.path.splitext(file)[1].lower() in image_exts:
                    all_files.append(Path(root) / file)
        
        cursor.execute("SELECT path FROM assets")
        existing_paths = {row[0] for row in cursor.fetchall()}
        to_process = [f for f in all_files if str(f) not in existing_paths]
        
        total_to_do = len(to_process)
        scan_status.update({"current": 0, "total": total_to_do, "status": "indexing"})
        
        if total_to_do > 0:
            BATCH_SIZE = 32
            for i in range(0, total_to_do, BATCH_SIZE):
                batch = to_process[i:i + BATCH_SIZE]
                images, valid_data = [], []
                
                for p in batch:
                    try:
                        scan_status["last_file"] = p.name
                        with Image.open(p) as f:
                            images.append(f.convert("RGB"))
                            valid_data.append((p, {
                                "size_kb": round(os.path.getsize(p)/1024, 2),
                                "resolution": f"{f.width}x{f.height}",
                                "exif": get_exif_data(f)
                            }))
                    except Exception as e: print(f"Skip {p}: {e}")
                
                if not images: continue
                embeddings = model.encode(images, convert_to_tensor=True, show_progress_bar=False).cpu().numpy()
                
                for j, (p, meta) in enumerate(valid_data):
                    thumb = generate_thumbnail(p)
                    vec_blob = embeddings[j].tobytes()
                    conn.execute('''INSERT INTO assets (path, type, vector, timestamp, metadata, thumb_path) 
                                    VALUES (?, ?, ?, ?, ?, ?)''',
                                 (str(p), "image", vec_blob, p.stat().st_mtime, json.dumps(meta), str(thumb) if thumb else None))
                    scan_status["current"] += 1
                
                conn.commit()
                # TERMINAL LOG:
                print(f"   [4070 Ti] Indexed {scan_status['current']}/{scan_status['total']} - {scan_status['last_file']}")
            
    scan_status["status"] = "idle"
    print("✅ Background Scan Complete.")

# --- API Routes ---

class SearchResult(BaseModel):
    path: str
    score: float
    type: str
    display_path: str
    thumb: Optional[str] = None
    metadata: Optional[dict] = None

@app.get("/api/scan/progress")
async def get_progress():
    return scan_status

@app.get("/api/stats")
async def get_stats():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT type, count(*) FROM assets GROUP BY type")
        counts = dict(cursor.fetchall())
        cursor.execute("SELECT count(*) FROM assets")
        total = cursor.fetchone()[0]
    return {"total": total, "distribution": counts, "device": device}

@app.post("/api/scan")
async def start_scan(background_tasks: BackgroundTasks):
    if scan_status["status"] == "indexing":
        return {"status": "already_running"}
    background_tasks.add_task(run_scan)
    return {"status": "started"}

@app.get("/api/search", response_model=List[SearchResult])
async def search(q: str):
    if not q: return []
    query_vec = model.encode(q, convert_to_tensor=True)
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT path, vector, metadata FROM assets WHERE type='image'")
        rows = cursor.fetchall()
    
    if not rows: return []
    
    paths = [r[0] for r in rows]
    db_vectors = np.array([np.frombuffer(r[1], dtype=np.float32) for r in rows])
    db_tensor = torch.tensor(db_vectors).to(device)
    cos_scores = util.cos_sim(query_vec, db_tensor)[0]
    
    values, indices = torch.topk(cos_scores, k=min(500, len(paths)))
    results = []
    for score, idx in zip(values, indices):
        p_str = paths[idx.item()]
        if not os.path.exists(p_str): continue
        
        # Safe Thumbnail handling
        thumb_name = get_safe_thumb_filename(p_str)
        thumb_url = f"/thumbs/{thumb_name}" if (THUMB_DIR / thumb_name).exists() else None
        
        # Safe Web Path
        try:
            rel_p = str(Path(p_str).relative_to(DREAM_BOX))
        except:
            rel_p = Path(p_str).name
        
        results.append({
            "path": p_str,
            "score": float(score),
            "type": "image",
            "display_path": clean_path_for_web(rel_p),
            "thumb": thumb_url,
            "metadata": json.loads(rows[idx.item()][2])
        })
    return results

@app.post("/api/weave")
async def weave_story(req: dict):
    anchor_paths = req.get('anchors', [])
    with sqlite3.connect(DB_PATH) as conn:
        placeholders = ','.join(['?'] * len(anchor_paths))
        anchors = conn.execute(f"SELECT path, vector FROM assets WHERE path IN ({placeholders})", anchor_paths).fetchall()
        all_rows = conn.execute("SELECT path, vector, metadata FROM assets").fetchall()
    
    if not anchors or not all_rows: return []
    
    story_pool = set(anchor_paths)
    all_vecs = torch.tensor(np.array([np.frombuffer(r[1], dtype=np.float32) for r in all_rows])).to(device)
    
    for _, vec_blob in anchors:
        a_vec = torch.tensor(np.frombuffer(vec_blob, dtype=np.float32)).to(device)
        scores = util.cos_sim(a_vec, all_vecs)[0]
        for i, s in enumerate(scores):
            if s > 0.35: story_pool.add(all_rows[i][0])
    
    results = []
    for r in all_rows:
        if r[0] in story_pool:
            thumb_name = get_safe_thumb_filename(r[0])
            try:
                rel_p = str(Path(r[0]).relative_to(DREAM_BOX))
            except:
                rel_p = Path(r[0]).name
                
            results.append({
                "path": r[0], "score": 1.0, "type": "image",
                "display_path": clean_path_for_web(rel_p),
                "thumb": f"/thumbs/{thumb_name}",
                "metadata": json.loads(r[2])
            })
    return results

app.mount("/thumbs", StaticFiles(directory=THUMB_DIR), name="thumbs")
app.mount("/raw", StaticFiles(directory=DREAM_BOX), name="raw")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)