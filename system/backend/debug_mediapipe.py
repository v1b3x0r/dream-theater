import mediapipe
import sys

print(f"🐍 Python: {sys.version}")
print(f"📦 MediaPipe Location: {mediapipe.__file__}")
print("\n--- DIR(mediapipe) ---")
print(dir(mediapipe))

try:
    import mediapipe.python.solutions
    print("\n✅ Found mediapipe.python.solutions")
except ImportError as e:
    print(f"\n❌ mediapipe.python.solutions FAILED: {e}")

try:
    import mediapipe.solutions
    print("\n✅ Found mediapipe.solutions")
except ImportError as e:
    print(f"\n❌ mediapipe.solutions FAILED: {e}")
