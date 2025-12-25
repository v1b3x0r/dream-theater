import sqlite3
import json
from .config import DB_PATH

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_conn() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS assets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        path TEXT UNIQUE, type TEXT, vector BLOB,
                        ts_real INTEGER, ts_inferred INTEGER,
                        time_confidence REAL, time_source TEXT,
                        metadata TEXT, thumb_path TEXT,
                        x REAL, y REAL, z REAL
                    )''')
        conn.execute('''CREATE TABLE IF NOT EXISTS identities (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT UNIQUE, vector BLOB, count INTEGER,
                        cover_path TEXT
                    )''')
        conn.execute('''CREATE TABLE IF NOT EXISTS identity_links (
                        identity_id INTEGER, asset_path TEXT,
                        PRIMARY KEY(identity_id, asset_path)
                    )''')
        # Check Migrations
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(assets)")
        cols = [c[1] for c in cursor.fetchall()]
        if "x" not in cols:
            conn.execute("ALTER TABLE assets ADD COLUMN x REAL")
            conn.execute("ALTER TABLE assets ADD COLUMN y REAL")
            conn.execute("ALTER TABLE assets ADD COLUMN z REAL")
