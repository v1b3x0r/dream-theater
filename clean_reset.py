import os
import shutil

def clean_slate():
    print("🧹 Cleaning DreamOS Data...")
    
    # 1. Delete DB
    if os.path.exists("dream_sorter.db"):
        os.remove("dream_sorter.db")
        print("✅ Database deleted.")
    
    # 2. Delete Thumbs
    thumbs_path = os.path.join("DreamBox", ".thumbs")
    if os.path.exists(thumbs_path):
        shutil.rmtree(thumbs_path)
        print("✅ Thumbnails cleared.")

    print("✨ Ready for A7X Rebirth!")

if __name__ == "__main__":
    clean_slate()
