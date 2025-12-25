from sentence_transformers import SentenceTransformer
import torch

class NeuralCore:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.vision_model = None
        self.text_model = None
        print(f"⚙️  AI Accelerator: {self.device.upper()}")

    def load(self):
        try:
            print("📦 Loading Vision Engine (CLIP)...")
            self.vision_model = SentenceTransformer("clip-ViT-B-32", device=self.device)
            print("📦 Loading Thai Intelligence (Multilingual)...")
            self.text_model = SentenceTransformer("clip-ViT-B-32-multilingual-v1", device=self.device)
            print("✅ Neural Cores Online")
        except Exception as e:
            print(f"❌ AI Load Error: {e}")

    def encode_image(self, images):
        # Vision model handles images directly
        return self.vision_model.encode(images, batch_size=len(images), convert_to_tensor=True, show_progress_bar=False).cpu().numpy()

    def encode_text(self, text):
        # Text model handles multilingual queries
        return self.text_model.encode(text, convert_to_tensor=True)

# Global Instance
ai = NeuralCore()
