import os
from pathlib import Path

# 🛡️ RESOLVE ABSOLUTE PATHS TO PREVENT WINDOWS GHOSTING
BASE_DIR = Path(__file__).parent.parent.parent.parent.resolve()
DREAM_BOX = (BASE_DIR / "DreamBox").resolve()
DB_PATH = (Path(__file__).parent.parent / "dream_sorter.db").resolve()
THUMB_DIR = (DREAM_BOX / ".thumbs").resolve()

# Create Dirs
DREAM_BOX.mkdir(parents=True, exist_ok=True)
THUMB_DIR.mkdir(parents=True, exist_ok=True)

# Settings
BATCH_SIZE = 32
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'}
AUDIO_EXTS = {'.mp3', '.wav', '.flac', '.m4a', '.ogg'}
VIDEO_EXTS = {'.mp4', '.mov', '.webm', '.mkv'}
TEXT_EXTS = {'.txt', '.md', '.log'}
IGNORE_DIRS = {'.thumbs', '.git', 'node_modules', 'system', '__pycache__'}