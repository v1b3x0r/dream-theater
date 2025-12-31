import sqlite3
import os
from pathlib import Path
from .config import DB_PATH, DREAM_BOX

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    print(f"🏛️ Initializing Database at {DB_PATH}")
    with get_conn() as conn:
        # 1. Create Tables (Master Schema v2.0)
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
            is_captured INTEGER DEFAULT 0,
            face_count INTEGER DEFAULT 0
        )''')
        
        conn.execute('''CREATE TABLE IF NOT EXISTS identities (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT UNIQUE, 
            vector BLOB, 
            face_vector BLOB,
            count INTEGER DEFAULT 0, 
            cover_path TEXT
        )''')
        
        conn.execute('''CREATE TABLE IF NOT EXISTS identity_links (
            identity_id INTEGER, 
            asset_path TEXT, 
            PRIMARY KEY (identity_id, asset_path)
        )''')

        # 🚀 PATH HARMONIZATION
        print("🧼 Harmonizing Paths...")
        try:
            # Check if tables exist before querying (Double safety)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='assets'")
            if cursor.fetchone():
                rows = conn.execute("SELECT id, path, thumb_path FROM assets").fetchall()
                for r in rows:
                    r_id, old_path, old_thumb = r['id'], r['path'], r['thumb_path']
                    needs_update = False
                    
                    # 🛡️ Force Path to be Relative (Universal Separator /)
                    new_path = old_path.replace(os.sep, "/") # Force forward slash for DB consistency
                    if new_path != old_path:
                        needs_update = True
                    
                    if needs_update:
                        try:
                            conn.execute("UPDATE assets SET path = ? WHERE id = ?", (new_path, r_id))
                        except sqlite3.IntegrityError:
                            conn.execute("DELETE FROM assets WHERE id = ?", (r_id,))
        except Exception as e:
            print(f"⚠️ Path Cleanse Skipped: {e}")
        
        conn.commit()
    print("✅ Database Ready (v2.0 Schema)")
