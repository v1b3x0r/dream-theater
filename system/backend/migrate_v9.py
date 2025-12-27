import sqlite3
import os
import sys

# Define path relative to where this script is typically run (project root or backend dir)
# We assume standard structure: system/backend/app/config.py
# Database is usually at root/dream_sorter.db or similar. 
# Let's try to locate it relative to this script.

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# Correct Path based on config.py location (system/backend/app/config.py -> system/backend/dream_sorter.db)
# This script is in system/backend/
DB_PATH = os.path.join(CURRENT_DIR, 'dream_sorter.db')

def migrate():
    print(f"🔌 Connecting to database at: {DB_PATH}")
    
    if not os.path.exists(DB_PATH):
        print("❌ Database file not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 3 แกนประสาทแห่งความรู้สึก (The Rings of Confidence)
    new_columns = [
        ("coherence", "REAL DEFAULT 0.0"),       # ความเข้าพวก (เพื่อนบ้าน)
        ("stability", "REAL DEFAULT 0.0"),       # ความชัดเจนของตัวตน (Identity)
        ("temporal_weight", "REAL DEFAULT 0.0")  # ความยึดโยงกับเวลา (Time Anchor)
    ]
    
    print("🧠 Implanting neural pathways...")
    
    for col, dtype in new_columns:
        try:
            c.execute(f"ALTER TABLE assets ADD COLUMN {col} {dtype}")
            print(f"   ✅ Added neural receptor: {col}")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e):
                print(f"   ⚠️ Neural receptor '{col}' already exists (Skipping).")
            else:
                print(f"   ❌ Failed to add '{col}': {e}")
                
    conn.commit()
    conn.close()
    print("✨ Surgery complete. The mothership is ready for feelings.")

if __name__ == "__main__":
    migrate()
