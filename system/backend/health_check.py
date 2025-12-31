import torch
import sys
import os
from pathlib import Path

def check_health():
    print("🧪 --- DREAM OS BACKEND HEALTH CHECK ---")
    
    # 1. Python & Platform
    print(f"🐍 Python Version: {sys.version}")
    print(f"💻 Platform: {sys.platform}")
    
    # 2. AI Accelerator (MPS/Metal)
    print("\n🚀 Checking AI Accelerator...")
    if torch.backends.mps.is_available():
        print("✅ MPS (Metal Performance Shaders) is AVAILABLE!")
        device = torch.device("mps")
        # Simple tensor test
        x = torch.ones(1, device=device)
        print(f"   Test Tensor on MPS: {x}")
    else:
        print("❌ MPS is NOT available. Falling back to CPU.")

    # 3. Dependencies
    print("\n📦 Checking Key Dependencies...")
    deps = ['fastapi', 'uvicorn', 'transformers', 'mutagen', 'PIL', 'sentence_transformers']
    for dep in deps:
        try:
            __import__(dep)
            print(f"✅ {dep}: Installed")
        except ImportError:
            print(f"❌ {dep}: MISSING")

    # 4. Path & DB
    print("\n📂 Checking Paths...")
    base_dir = Path(__file__).parent.parent.parent.resolve()
    print(f"🏠 BASE_DIR: {base_dir}")
    db_path = Path(__file__).parent / "dream_sorter.db"
    if db_path.exists():
        print(f"✅ Database found at: {db_path}")
    else:
        print(f"⚠️  Database not found (will be created on first run)")

    print("\n----------------------------------------")

if __name__ == "__main__":
    check_health()
