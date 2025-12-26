import os
import time
import json
import numpy as np
import threading
from pathlib import Path
from PIL import Image, ImageOps, ImageFile
from PIL.ExifTags import TAGS
from mutagen import File as MutagenFile
import umap
import torch
from sklearn.cluster import KMeans
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn, TimeRemainingColumn
from rich.console import Console
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from .config import DREAM_BOX, THUMB_DIR, IMAGE_EXTS, AUDIO_EXTS, IGNORE_DIRS
from .db import get_conn
from .models import ai

console = Console()
ImageFile.LOAD_TRUNCATED_IMAGES = True

scan_status = {"current": 0, "total": 0, "status": "idle", "last_event": "System Standby", "last_file": ""}

def get_backslash(): return chr(92)
def thumb_name(p):
    bs = get_backslash()
    clean = str(p).replace(":", "").replace(bs, "_").replace("/", "_")
    return os.path.splitext(clean)[0] + ".jpg"

def get_metadata(p):
    meta = {"size_kb": round(os.path.getsize(p)/1024, 2), "res": "---", "exif": {}}
    ts_real, confidence, source = None, 0.1, "os"
    ext = p.suffix.lower()
    try:
        if ext in IMAGE_EXTS:
            with Image.open(p) as img:
                img = ImageOps.exif_transpose(img)
                meta["res"] = f"{img.width}x{img.height}"
                exif = img.getexif()
                if exif:
                    for tag, val in exif.items():
                        decoded = TAGS.get(tag, tag)
                        if isinstance(val, (str, int, float)): meta["exif"][str(decoded)] = str(val)
                    dt = meta["exif"].get("DateTimeOriginal") or meta["exif"].get("DateTime")
                    if dt:
                        ts_real = int(time.mktime(time.strptime(dt, "%Y:%m:%d %H:%M:%S")))
                        confidence, source = 1.0, "exif"
        elif ext in AUDIO_EXTS:
            audio = MutagenFile(p)
            if audio:
                meta["title"] = str(audio.get("title", [p.name])[0])
                meta["artist"] = str(audio.get("artist", ["Unknown Artist"])[0])
    except: pass
    return meta, ts_real, int(os.path.getmtime(p)), confidence, source

# --- 🎭 DYNAMIC THEME ENGINE ---
def generate_theme_label(centroid_vec):
    """Matches a cluster center against a diverse knowledge base of concepts."""
    # 📚 Expanded Vocabulary (The AI's worldview)
    vocab = [
        "Lush Nature", "Urban Street", "Home Sanctuary", "Gourmet Moments", 
        "Night Neon", "Creative Workspace", "Social Gathering", "Beach Vibe",
        "Mountain Peaks", "Pet Companions", "Digital Art", "Old Memories",
        "Action & Motion", "Still Life", "Bright Morning", "Moody Shadows"
    ]
    
    with torch.no_grad():
        v_centroid = torch.tensor(centroid_vec).to(ai.device)
        v_vocab = ai.encode_text(vocab)
        if len(v_vocab.shape) == 1: v_vocab = v_vocab.unsqueeze(0)
        
        # Calculate similarity
        scores = torch.nn.functional.cosine_similarity(v_centroid, v_vocab)
        best_idx = torch.argmax(scores).item()
        return vocab[best_idx]

def recalculate_galaxy():
    global scan_status
    scan_status["last_event"] = "🌌 Re-mapping Spacetime..."
    print("🌌 [GALAXY] Calculating UMAP and Themes...")
    try:
        with get_conn() as conn:
            rows = conn.execute("SELECT id, vector FROM assets WHERE vector IS NOT NULL").fetchall()
            if len(rows) < 10: return
            
            ids, vecs = [r['id'] for r in rows], np.array([np.frombuffer(r['vector'], dtype=np.float32) for r in rows])
            
            # 1. Spatial Mapping
            reducer = umap.UMAP(n_components=3, n_neighbors=min(len(rows)-1, 15), min_dist=0.1, metric='cosine')
            projs = reducer.fit_transform(vecs)
            
            # 2. Dynamic Clustering
            num_clusters = min(12, len(rows) // 20)
            kmeans = KMeans(n_clusters=num_clusters, n_init='auto').fit(vecs)
            labels = kmeans.labels_
            centroids = kmeans.cluster_centers_
            
            # 3. Label Generation
            theme_map = {}
            for i in range(num_clusters):
                theme_map[i] = generate_theme_label(centroids[i])
            
            # 💾 Save back to DB
            for i, db_id in enumerate(ids):
                c_id = int(labels[i])
                conn.execute("UPDATE assets SET x=?, y=?, z=?, cluster_id=?, cluster_label=? WHERE id=?", 
                             (float(projs[i][0])*15, float(projs[i][1])*15, float(projs[i][2])*15, c_id, theme_map[c_id], db_id))
            conn.commit()
            print(f"✅ [GALAXY] Mapped {len(ids)} stars into {num_clusters} Themes.")
    except Exception as e: print(f"❌ Galaxy Error: {e}")

def dream_loop():
    while True:
        if scan_status["status"] == "idle":
            try:
                with get_conn() as conn:
                    unlinked = conn.execute("SELECT path, vector FROM assets WHERE type='image' AND path NOT IN (SELECT asset_path FROM identity_links) ORDER BY RANDOM() LIMIT 5").fetchall()
                    if unlinked:
                        scan_status["status"] = "dreaming"
                        id_rows = conn.execute("SELECT id, name, vector FROM identities WHERE vector IS NOT NULL").fetchall()
                        known_ids = [(r['id'], r['name'], torch.tensor(np.frombuffer(r['vector'], dtype=np.float32)).to(ai.device)) for r in id_rows]
                        for r in unlinked:
                            path, v_blob = r['path'], r['vector']
                            v_tensor = torch.tensor(np.frombuffer(v_blob, dtype=np.float32)).to(ai.device)
                            for id_id, name, id_vec in known_ids:
                                if torch.nn.functional.cosine_similarity(v_tensor, id_vec, dim=0) > 0.48:
                                    scan_status["last_event"] = f"✨ Dream: Recognized {name}!"
                                    conn.execute("INSERT OR IGNORE INTO identity_links (identity_id, asset_path) VALUES (?,?)", (id_id, path))
                                    conn.execute("UPDATE identities SET count = count + 1 WHERE id = ?", (id_id,))
                                    break
                        conn.commit(); time.sleep(3)
            except: pass
            scan_status["status"] = "idle"
            scan_status["last_event"] = "System Standby"
        time.sleep(30)

def process_scan():
    global scan_status
    if scan_status["status"] == "indexing": return
    scan_status["status"] = "indexing"
    print("🚀 [SCAN] Initiating Deep Scan...")
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    bs = get_backslash()
    try:
        with get_conn() as conn:
            id_rows = conn.execute("SELECT name, vector FROM identities WHERE vector IS NOT NULL").fetchall()
            known_ids = [(r['name'], torch.tensor(np.frombuffer(r['vector'], dtype=np.float32)).to(ai.device)) for r in id_rows]
            all_db = {r['path'] for r in conn.execute("SELECT path FROM assets").fetchall()}
            all_files = []
            for root, dirs, files in os.walk(DREAM_BOX):
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                for f in files:
                    if f.startswith('.') or f.startswith('._') or f.lower() == 'thumbs.db': continue
                    p = Path(root) / f
                    rel_path = os.path.relpath(p, DREAM_BOX).replace(bs, "/")
                    if rel_path not in all_db: all_files.append(p)
            scan_status.update({"current": 0, "total": len(all_files)})
            for i in range(0, len(all_files), 16):
                batch = all_files[i:i+16]
                for p in batch:
                    try:
                        scan_status["last_file"] = p.name
                        meta, tr, to, c, s = get_metadata(p)
                        ext = p.suffix.lower()
                        rel_path = os.path.relpath(p, DREAM_BOX).replace(bs, "/")
                        if ext in IMAGE_EXTS:
                            with Image.open(p) as f:
                                img_t = ImageOps.exif_transpose(f).convert("RGB")
                                v_img = torch.tensor(ai.encode_image([img_t])[0]).to(ai.device)
                                found = [n for n, iv in known_ids if torch.nn.functional.cosine_similarity(v_img, iv, dim=0) > 0.45]
                                if found:
                                    v_txt = ai.encode_text(f"Photo of {found[0]}").squeeze(0)
                                    v_img = (v_img * 0.6) + (v_txt * 0.4); v_img = v_img / v_img.norm()
                                tname = thumb_name(p)
                                img_t.thumbnail((400, 400)); img_t.save(THUMB_DIR / tname, "JPEG", quality=60)
                                conn.execute("INSERT INTO assets (path, type, vector, ts_real, ts_inferred, time_confidence, time_source, metadata, thumb_path, is_captured) VALUES (?,?,?,?,?,?,?,?,?,0)",
                                             (rel_path, "image", v_img.cpu().numpy().tobytes(), tr, to, c, s, json.dumps(meta), tname))
                                for n in found:
                                    row = conn.execute("SELECT id FROM identities WHERE name=?", (n,)).fetchone()
                                    if row: conn.execute("INSERT OR IGNORE INTO identity_links (identity_id, asset_path) VALUES (?,?)", (row['id'], rel_path))
                        elif ext in AUDIO_EXTS:
                            v_aud = ai.encode_text(f"{meta.get('title', p.name)} {meta.get('artist', '')}").squeeze(0)
                            conn.execute("INSERT INTO assets (path, type, vector, ts_real, ts_inferred, time_confidence, time_source, metadata, is_captured) VALUES (?,?,?,?,?,?,?,?,0)",
                                         (rel_path, "audio", v_aud.cpu().numpy().tobytes(), None, to, 0.1, "os", json.dumps(meta)))
                        scan_status["current"] += 1
                    except Exception as e: print(f"Error {p.name}: {e}")
                conn.commit()
            recalculate_galaxy()
    except Exception as e: print(f"Scan Error: {e}")
    scan_status["status"] = "idle"
    scan_status["last_event"] = "System Standby"

def start_watcher():
    observer = Observer()
    observer.schedule(FileSystemEventHandler(), str(DREAM_BOX), recursive=True)
    observer.start()
    threading.Thread(target=dream_loop, daemon=True).start()
    return observer