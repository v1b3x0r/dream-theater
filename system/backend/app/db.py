import sqlite3
import os
from pathlib import Path
from .config import DB_PATH, DREAM_BOX

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_conn() as conn:
        # 1. Create Tables (Standard Schema)
        conn.execute('''CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE,
            type TEXT,
            vector BLOB,
            ts_real INTEGER,
            ts_inferred INTEGER,
            time_confidence REAL,
            time_source TEXT,
            metadata TEXT,
            thumb_path TEXT,
            x REAL,
            y REAL,
            z REAL,
            cluster_id INTEGER,
            cluster_label TEXT,
            is_captured INTEGER DEFAULT 0
        )''')
        
        conn.execute("CREATE TABLE IF NOT EXISTS identities (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, vector BLOB, count INTEGER DEFAULT 0, cover_path TEXT)")
        conn.execute("CREATE TABLE IF NOT EXISTS identity_links (identity_id INTEGER, asset_path TEXT, PRIMARY KEY (identity_id, asset_path))")

        # 🚀 SATOSHI'S CLEANSE v3: THE ULTIMATE HARMONY
        print("🧼 Satoshi's Cleanse: Forcing Relative Paths...")
        bs = chr(92)
        rows = conn.execute("SELECT id, path, thumb_path FROM assets").fetchall()
        
        for r in rows:
            r_id, old_path, old_thumb = r['id'], r['path'], r['thumb_path']
            needs_update = False
            
            # 🛡️ Force Path to be Relative to DreamBox
            new_path = old_path
            if os.path.isabs(old_path) or "DreamBox" in old_path:
                try:
                    # Clean up absolute path mess
                    if str(DREAM_BOX) in old_path:
                        new_path = os.path.relpath(old_path, DREAM_BOX).replace(bs, "/")
                    else:
                        # If it contains DreamBox but not the current absolute path, 
                        # it might be from a different session. Try to find the part after DreamBox.
                        parts = old_path.replace(bs, "/").split("/DreamBox/")
                        new_path = parts[-1] if len(parts) > 1 else os.path.basename(old_path)
                    needs_update = True
                except: pass
            
            # Standardize Thumb Path
            new_thumb = old_thumb
            if old_thumb and ("DreamBox" in old_thumb or bs in old_thumb):
                new_thumb = os.path.basename(old_thumb)
                needs_update = True

            if needs_update:
                try:
                    conn.execute("UPDATE assets SET path = ?, thumb_path = ? WHERE id = ?", (new_path, new_thumb, r_id))
                except sqlite3.IntegrityError:
                    conn.execute("DELETE FROM assets WHERE id = ?", (r_id,))
        
        conn.commit()
    print("🏛️ Database Pyramid: RELATIVE & ALIGNED")