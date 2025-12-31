import os
import time
import json
import numpy as np
import threading
import cv2
import subprocess
import traceback
import io
from pathlib import Path
from PIL import Image, ImageOps, ImageFile
from PIL.ExifTags import TAGS
from mutagen import File as MutagenFile
import umap
import torch
from sklearn.cluster import KMeans
from rich.console import Console
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from .config import DREAM_BOX, THUMB_DIR, IMAGE_EXTS, AUDIO_EXTS, VIDEO_EXTS, IGNORE_DIRS
from .db import get_conn
from .models import ai
from .face_engine import face_ai

console = Console()
ImageFile.LOAD_TRUNCATED_IMAGES = True

scan_status = {"current": 0, "total": 0, "status": "idle", "last_event": "System Standby", "last_file": "", "dirty": False}

def get_backslash(): return os.sep
def thumb_name(p):
    clean = str(p).replace(":", "").replace(os.sep, "_").replace("/", "_")
    return os.path.splitext(clean)[0] + ".jpg"

# --- 🧱 COMPOSABLE STEPS ---

class ScanContext:
    def __init__(self, path):
        self.path = Path(path)
        self.rel_path = os.path.relpath(path, DREAM_BOX).replace(os.sep, "/")
        self.type = "unknown"
        self.meta = {}
        self.vector = None
        self.thumb_path = None
        self.ts_real = None
        self.ts_inferred = int(os.path.getmtime(path))
        self.time_confidence = 0.1
        self.time_source = "os"
        self.pil_image = None # Main Image (or Middle Frame)
        self.video_frames = [] # Additional frames for video analysis

class BaseStep:
    def process(self, ctx: ScanContext) -> bool: return True

class LoadStep(BaseStep):
    def process(self, ctx: ScanContext) -> bool:
        ext = ctx.path.suffix.lower()
        try:
            if ext in IMAGE_EXTS:
                ctx.type = "image"
                img = Image.open(ctx.path)
                ctx.pil_image = ImageOps.exif_transpose(img).convert("RGB")
            elif ext in AUDIO_EXTS:
                ctx.type = "audio"
            elif ext in VIDEO_EXTS:
                ctx.type = "video"
                cap = cv2.VideoCapture(str(ctx.path))
                if cap.isOpened():
                    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                    fps = cap.get(cv2.CAP_PROP_FPS) or 30
                    ctx.meta["duration"] = frame_count / fps
                    
                    # 🎞️ Multi-Frame Extraction (Start, Middle, End)
                    points = [frame_count // 6, frame_count // 2, (frame_count * 5) // 6]
                    for i, p in enumerate(points):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, p)
                        ret, frame = cap.read()
                        if ret:
                            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                            pil = Image.fromarray(rgb)
                            ctx.video_frames.append(pil)
                            if i == 1: ctx.pil_image = pil # Use middle frame as main thumbnail
                    
                    cap.release()
            return True
        except Exception as e:
            print(f"❌ Load Error {ctx.path.name}: {e}")
            return False

class MetadataStep(BaseStep):
    def process(self, ctx: ScanContext) -> bool:
        ctx.meta["size_kb"] = round(os.path.getsize(ctx.path)/1024, 2)
        try:
            if ctx.type == "image" and ctx.pil_image:
                ctx.meta["res"] = f"{ctx.pil_image.width}x{ctx.pil_image.height}"
                exif = ctx.pil_image.getexif()
                if exif:
                    exif_data = {}
                    for tag, val in exif.items():
                        decoded = TAGS.get(tag, tag)
                        if isinstance(val, (str, int, float)): exif_data[str(decoded)] = str(val)
                    ctx.meta["exif"] = exif_data
                    dt = exif_data.get("DateTimeOriginal") or exif_data.get("DateTime")
                    if dt:
                        ctx.ts_real = int(time.mktime(time.strptime(dt, "%Y:%m:%d %H:%M:%S")))
                        ctx.time_confidence, ctx.time_source = 1.0, "exif"
            elif ctx.type == "audio":
                audio = MutagenFile(ctx.path)
                if audio:
                    ctx.meta["title"] = str(audio.get("title", [ctx.path.name])[0])
                    ctx.meta["artist"] = str(audio.get("artist", ["Unknown Artist"])[0])
        except: pass
        return True

class VectorStep(BaseStep):
    def process(self, ctx: ScanContext) -> bool:
        try:
            if ctx.pil_image:
                # 🖼️ Main Visual Embedding
                v_img = torch.tensor(ai.encode_image([ctx.pil_image])[0]).to(ai.device)
                ctx.vector = v_img.cpu().numpy().tobytes()

            elif ctx.type == "audio":
                # 🎵 Audio Embedding
                query = f"{ctx.meta.get('title', '')} {ctx.meta.get('artist', '')}"
                v_aud = ai.encode_text(query).squeeze(0)
                ctx.vector = v_aud.cpu().numpy().tobytes()
        except Exception as e:
            print(f"⚠️ Vector Error: {e}")
        return True

class FaceIDStep(BaseStep):
    def process(self, ctx: ScanContext) -> bool:
        # Collect frames to scan (Image: [main], Video: [frame1, frame2, frame3])
        frames_to_scan = []
        if ctx.type == "image" and ctx.pil_image: frames_to_scan = [ctx.pil_image]
        elif ctx.type == "video": frames_to_scan = ctx.video_frames

        if not frames_to_scan: return True

        try:
            with get_conn() as conn:
                id_rows = conn.execute("SELECT id, name, face_vector FROM identities WHERE face_vector IS NOT NULL").fetchall()
                known_ids = []
                for r in id_rows:
                    if r['face_vector']:
                        known_ids.append((r['id'], r['name'], np.frombuffer(r['face_vector'], dtype=np.float32)))

                total_faces_found = 0
                
                for img_frame in frames_to_scan:
                    img_np = np.array(img_frame)
                    faces = face_ai.detect(img_np)
                    if not faces: continue
                    
                    total_faces_found += len(faces)

                    for face in faces:
                        # ✂️ Crop & CLIP-Embed
                        x1, y1, x2, y2 = face['bbox']
                        if x2 > x1 and y2 > y1:
                            face_crop = img_frame.crop((x1, y1, x2, y2))
                            embedding = ai.encode_image([face_crop])[0]
                            
                            best_score = 0
                            best_match = None

                            for rid, name, id_vec in known_ids:
                                score = np.dot(embedding, id_vec) / (np.linalg.norm(embedding) * np.linalg.norm(id_vec))
                                if score > best_score:
                                    best_score = score
                                    best_match = (rid, name)
                            
                            if best_score > 0.65:
                                rid, name = best_match
                                conn.execute("INSERT OR IGNORE INTO identity_links (identity_id, asset_path) VALUES (?,?)", (rid, ctx.rel_path))
                                conn.execute("UPDATE identities SET count = count + 1 WHERE id = ?", (rid,))
                                print(f"🗿 [FACE] Matched {name} in {ctx.type} ({round(best_score*100)}%)")
                                try: subprocess.run(["say", f"Found {name}"], check=False)
                                except: pass
                
                ctx.meta["face_count"] = total_faces_found

        except Exception as e:
            print(f"⚠️ FaceID Error: {e}")
            traceback.print_exc()
        return True

class ThumbnailStep(BaseStep):
    def process(self, ctx: ScanContext) -> bool:
        thumb_img = None
        
        # 1. Image / Video Frame
        if ctx.pil_image:
            thumb_img = ctx.pil_image.copy()
        
        # 2. Audio Cover Art
        elif ctx.type == "audio":
            try:
                audio = MutagenFile(ctx.path)
                if audio:
                    # ID3 (MP3)
                    if 'APIC:' in audio.tags: 
                        data = audio.tags['APIC:'].data
                        thumb_img = Image.open(io.BytesIO(data))
                    # FLAC / Vorbis
                    elif 'pictures' in audio.tags and audio.tags['pictures']:
                        data = audio.tags['pictures'][0].data
                        thumb_img = Image.open(io.BytesIO(data))
                    elif hasattr(audio, 'pictures') and audio.pictures:
                         data = audio.pictures[0].data
                         thumb_img = Image.open(io.BytesIO(data))
            except: pass

        # Save if we have an image
        if thumb_img:
            try:
                tname = thumb_name(ctx.path)
                ctx.thumb_path = tname
                thumb_img = thumb_img.convert("RGB") # Fix RGBA issue
                thumb_img.thumbnail((400, 400))
                thumb_img.save(THUMB_DIR / tname, "JPEG", quality=60)
            except Exception as e:
                print(f"⚠️ Thumb Error: {e}")
        
        return True

class DatabaseStep(BaseStep):
    def process(self, ctx: ScanContext) -> bool:
        try:
            with get_conn() as conn:
                conn.execute("""
                    INSERT INTO assets 
                    (path, type, vector, ts_real, ts_inferred, time_confidence, time_source, metadata, thumb_path, is_captured, face_count) 
                    VALUES (?,?,?,?,?,?,?,?,?,0,?)
                """, (
                    ctx.rel_path, ctx.type, ctx.vector, ctx.ts_real, ctx.ts_inferred, 
                    ctx.time_confidence, ctx.time_source, json.dumps(ctx.meta), ctx.thumb_path, ctx.meta.get("face_count", 0)
                ))
                conn.commit()
        except Exception as e:
            print(f"❌ DB Error: {e}")
            return False
        return True

# --- 🏭 THE FACTORY ---
class AssetPipeline:
    def __init__(self):
        self.steps = [LoadStep(), MetadataStep(), VectorStep(), FaceIDStep(), ThumbnailStep(), DatabaseStep()]

    def run(self, path):
        ctx = ScanContext(path)
        for step in self.steps:
            if not step.process(ctx): return False
        return True

# --- 🌌 GALAXY ENGINE ---
def recalculate_galaxy():
    global scan_status
    scan_status["last_event"] = "🌌 Re-mapping Spacetime..."
    try:
        with get_conn() as conn:
            rows = conn.execute("SELECT id, vector FROM assets WHERE vector IS NOT NULL").fetchall()
            if len(rows) < 10: return
            ids, vecs = [r['id'] for r in rows], np.array([np.frombuffer(r['vector'], dtype=np.float32) for r in rows])
            reducer = umap.UMAP(n_components=3, n_neighbors=min(len(rows)-1, 15), min_dist=0.1, metric='cosine')
            projs = reducer.fit_transform(vecs)
            kmeans = KMeans(n_clusters=min(12, len(rows) // 20), n_init='auto').fit(vecs)
            for i, db_id in enumerate(ids):
                conn.execute("UPDATE assets SET x=?, y=?, z=?, cluster_id=? WHERE id=?", 
                             (float(projs[i][0])*15, float(projs[i][1])*15, float(projs[i][2])*15, int(kmeans.labels_[i]), db_id))
            conn.commit()
            print(f"✅ [GALAXY] Mapped {len(ids)} stars.")
    except Exception as e: print(f"Galaxy Error: {e}")

# --- 🧠 DREAM LOOP ---
def dream_loop():
    pass

# --- 🚀 MAIN PROCESS ---
def process_scan():
    global scan_status
    if scan_status["status"] == "indexing": scan_status["dirty"] = True; return

    pipeline = AssetPipeline()

    while True:
        scan_status["dirty"] = False
        scan_status["status"] = "indexing"
        print("🚀 [SCAN] Factory Started...")
        THUMB_DIR.mkdir(parents=True, exist_ok=True)
        
        try:
            with get_conn() as conn:
                all_db = {r['path'] for r in conn.execute("SELECT path FROM assets").fetchall()}
            
            all_files = []
            for root, dirs, files in os.walk(DREAM_BOX):
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                for f in files:
                    if f.startswith('.'): continue
                    p = Path(root) / f
                    rel = os.path.relpath(p, DREAM_BOX).replace(os.sep, "/")
                    if rel not in all_db: all_files.append(p)
            
            scan_status.update({"current": 0, "total": len(all_files)})
            
            for p in all_files:
                scan_status["last_file"] = p.name
                pipeline.run(p)
                scan_status["current"] += 1
            
            if len(all_files) > 0: recalculate_galaxy()

        except Exception as e: print(f"Scan Crash: {e}"); traceback.print_exc()
        
        if not scan_status["dirty"]:
            scan_status["status"] = "idle"
            scan_status["last_event"] = "System Standby"
            break
        else: print("🔄 Factory Reloading...")

# --- 👀 WATCHER ---
class DreamHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        if event.is_directory: return
        print(f"👀 [WATCHER] Change: {event.src_path}")
        scan_status["dirty"] = True
        if scan_status["status"] == "idle": threading.Thread(target=process_scan, daemon=True).start()

def start_watcher():
    observer = Observer()
    observer.schedule(DreamHandler(), str(DREAM_BOX), recursive=True)
    observer.start()
    threading.Thread(target=dream_loop, daemon=True).start()
    return observer
