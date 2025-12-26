from sentence_transformers import SentenceTransformer
import torch
from rich.console import Console
from rich.status import Status

console = Console()

class NeuralCore:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.vision_model = None
        self.text_model = None
        console.print(f"[bold cyan]⚙️  AI Accelerator:[/bold cyan] [green]{self.device.upper()}[/green]")

    def load(self):
        with Status("[bold yellow]🚀 Initializing Neural Cores...", spinner="dots") as status:
            try:
                status.update("[bold blue]📦 Loading Vision Engine (CLIP)...[/bold blue]")
                self.vision_model = SentenceTransformer("clip-ViT-B-32", device=self.device)
                
                status.update("[bold magenta]🇹🇭 Loading Thai Intelligence (Multilingual)...[/bold magenta]")
                self.text_model = SentenceTransformer("clip-ViT-B-32-multilingual-v1", device=self.device)
                
                console.print("✅ [bold green]Neural Cores Online[/bold green]")
            except Exception as e:
                console.print(f"❌ [bold red]AI Load Error:[/bold red] {e}")

    def encode_image(self, images):
        if not self.vision_model: return None
        return self.vision_model.encode(images, batch_size=len(images), convert_to_tensor=True, show_progress_bar=False).cpu().numpy()

    def encode_text(self, text):
        if not self.text_model: return None
        # Handles both single string (query) and list of strings (batch text files)
        return self.text_model.encode(text, convert_to_tensor=True, show_progress_bar=False)

ai = NeuralCore()
