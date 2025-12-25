import os
import time
import json
import numpy as np
from pathlib import Path
from PIL import Image, ImageOps, ImageFile
from PIL.ExifTags import TAGS
from mutagen import File as MutagenFile
import umap

from .config import DREAM_BOX, THUMB_DIR, IMAGE_EXTS, AUDIO_EXTS
from .db import get_conn
from .models import ai

ImageFile.LOAD_TRUNCATED_IMAGES = True

scan_status = {"current": 0, "total": 0, "status": "idle", "last_file": ""}

def get_backslash(): return chr(92)
def thumb_name(p):
    # Hash path to keep it short and safe (or just clean it strictly)
    clean = str(p).replace(":", "").replace(get_backslash(), "_").replace("/", "_")
    if clean.lower().endswith(".jpg"): return clean
    return clean + ".jpg"

def gen_thumb(p):
    if p.suffix.lower() in AUDIO_EXTS: return None # Skip audio for now
    
    t_name = thumb_name(p)
    path = THUMB_DIR / t_name
    if path.exists(): return str(t_name)
    try:
        with Image.open(p) as img:
            img = ImageOps.exif_transpose(img)
            img.thumbnail((250, 250))
            img.convert("RGB").save(path, "JPEG", quality=50, optimize=True)
        return str(t_name)
    except: return None

def get_metadata(p):
    meta = {"size_kb": round(os.path.getsize(p)/1024, 2), "res": "---", "exif": {}}
    ts_real, confidence, source = None, 0.1, "os"
    
    if p.suffix.lower() in IMAGE_EXTS:
        try:
            with Image.open(p) as img:
                img_rot = ImageOps.exif_transpose(img)
                meta["res"] = f"{img_rot.width}x{img_rot.height}"
                exif = img.getexif()
                if exif:
                    for tag, val in exif.items():
                        decoded = TAGS.get(tag, tag)
                        if str(decoded) not in {"PrintImageMatching", "MakerNote"}:
                            if isinstance(val, (str, int, float)): meta["exif"][str(decoded)] = str(val)
                    
                    dt = meta["exif"].get("DateTimeOriginal")
                    if dt:
                        try:
                            ts_real = int(time.mktime(time.strptime(dt, "%Y:%m:%d %H:%M:%S")))
                            confidence, source = 1.0, "exif"
                        except: pass
        except: pass
    
    elif p.suffix.lower() in AUDIO_EXTS:
        try:
            a = MutagenFile(p)
            if a:
                meta.update({"title": str(a.get("title", [p.name])[0]), "artist": str(a.get("artist", ["Unknown"])[0])})
        except: pass

    ts_os = int(os.path.getmtime(p))
    return meta, ts_real, ts_os, confidence, source

def recalculate_galaxy():
    print("🌌 [UMAP] Organizing Galaxy...")
    with get_conn() as conn:
        rows = conn.execute("SELECT id, vector FROM assets").fetchall()
        if len(rows) < 5: return
        ids = [r[0] for r in rows]
        vecs = np.array([np.frombuffer(r[1], dtype=np.float32) for r in rows])
        proj = umap.UMAP(n_components=3, min_dist=0.1).fit_transform(vecs)
        for i, db_id in enumerate(ids):
            x, y, z = proj[i]
            conn.execute("UPDATE assets SET x=?, y=?, z=? WHERE id=?", (float(x)*8, float(y)*8, float(z)*8, db_id))
        conn.commit()

def process_scan():
    global scan_status
    print("🚀 Scan Started...")
    
    with get_conn() as conn:
        all_db = {r[0] for r in conn.execute("SELECT path FROM assets").fetchall()}
        
        all_files = []
        for root, _, files in os.walk(DREAM_BOX):
            for f in files:
                if f.startswith('.'): continue
                if f.lower().endswith(tuple(IMAGE_EXTS | AUDIO_EXTS)):
                    all_files.append(Path(root) / f)
        
        # Separate Missing Thumbs Check
        missing_thumbs = []
        for p in all_db:
            if p.lower().endswith(tuple(IMAGE_EXTS)):
                t_name = thumb_name(p)
                if not (THUMB_DIR / t_name).exists() and os.path.exists(p):
                    missing_thumbs.append(Path(p))

        # Add missing thumbs to process list (or handle separately)
        # Better strategy: Add to 'to_process' but handle logic carefully to avoid double insert
        # For simplicity in this structure: Just regen thumbs in a separate loop
        if missing_thumbs:
            print(f"⚠️ Found {len(missing_thumbs)} missing thumbnails. Regenerating...")
            for p in missing_thumbs:
                gen_thumb(p)

        to_process = [f for f in all_files if str(f) not in all_db]
        
        # Cleanup Ghosts
        
        for p in all_db:
            if not os.path.exists(p): conn.execute("DELETE FROM assets WHERE path=?", (p,))
        conn.commit()

        scan_status.update({"current": 0, "total": len(to_process), "status": "indexing"})
        
        to_process.sort(key=lambda p: 0 if p.suffix.lower() in IMAGE_EXTS else 1)
        BATCH = 32
        
        for i in range(0, len(to_process), BATCH):
            batch = to_process[i:i+BATCH]
            imgs, auds = [], []
            
            for p in batch:
                meta, tr, to, c, s = get_metadata(p)
                if p.suffix.lower() in IMAGE_EXTS:
                    try:
                        with Image.open(p) as f: imgs.append((f.convert("RGB"), p, meta, tr, to, c, s))
                    except: pass
                else:
                    auds.append((p, meta, to, c, s))

            if imgs:
                vecs = ai.encode_image([x[0] for x in imgs])
                for j, (_, p, meta, tr, to, c, s) in enumerate(imgs):
                    conn.execute('''INSERT INTO assets (path, type, vector, ts_real, ts_inferred, time_confidence, time_source, metadata, thumb_path) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                                 (str(p), "image", vecs[j].tobytes(), tr, to, c, s, json.dumps(meta), gen_thumb(p)))
                    scan_status["current"] += 1

            if auds:
                dummy = np.zeros(512, dtype=np.float32).tobytes()
                for p, meta, to, c, s in auds:
                    conn.execute('''INSERT INTO assets (path, type, vector, ts_inferred, time_confidence, time_source, metadata) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?)''',
                                 (str(p), "audio", dummy, to, c, s, json.dumps(meta)))
                    scan_status["current"] += 1
            
            conn.commit()
            print(f"🔥 Processed {scan_status['current']}/{scan_status['total']}")
            
        recalculate_galaxy()
    
    scan_status["status"] = "idle"
    print("✅ Scan Complete.")