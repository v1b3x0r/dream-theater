from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).parent.parent.parent.parent
DREAM_BOX = BASE_DIR / "DreamBox"
DB_PATH = Path(__file__).parent.parent / "dream_sorter.db"
THUMB_DIR = DREAM_BOX / ".thumbs"

# Create Dirs
DREAM_BOX.mkdir(parents=True, exist_ok=True)
THUMB_DIR.mkdir(parents=True, exist_ok=True)

# Settings
BATCH_SIZE = 32
IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
AUDIO_EXTS = {'.mp3', '.wav', '.flac', '.m4a'}
