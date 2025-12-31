import requests
import json
import os

class OllamaEngine:
    def __init__(self, base_url="http://localhost:11434"):
        self.base_url = base_url
        self.vision_model = None
        self.chat_model = None
        self.available = False
        self.models = []
        self.scan_models()

    def scan_models(self):
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=2)
            if res.status_code == 200:
                self.models = [m['name'] for m in res.json()['models']]
                print(f"🦙 [OLLAMA] Found models: {self.models}")
                
                # Heuristic to pick best models
                # Vision: llava > llama3.2-vision > minicpm
                for m in self.models:
                    if 'llava' in m or 'vision' in m or 'minicpm' in m:
                        self.vision_model = m
                        break
                
                # Chat: llama3 > mistral > gemma > qwen
                for m in self.models:
                    if 'llama3' in m or 'mistral' in m or 'gemma' in m or 'qwen' in m:
                        self.chat_model = m
                        break
                
                # Fallback
                if not self.chat_model and self.models: self.chat_model = self.models[0]
                if not self.vision_model: self.vision_model = self.chat_model # Risky fallback but better than None
                
                self.available = True
                print(f"✅ [OLLAMA] Active | Chat: {self.chat_model} | Vision: {self.vision_model}")
            else:
                print("⚠️ [OLLAMA] Service found but returned error.")
        except:
            print("❌ [OLLAMA] Not detected on localhost:11434")

    def list_models(self):
        return self.models

    def set_model(self, type, name):
        if name not in self.models: return False
        if type == 'chat': self.chat_model = name
        elif type == 'vision': self.vision_model = name
        return True

    def chat(self, messages):
        """
        messages: [{'role': 'user', 'content': '...'}]
        """
        if not self.available or not self.chat_model: return "Ollama not available."
        
        try:
            res = requests.post(f"{self.base_url}/api/chat", json={
                "model": self.chat_model,
                "messages": messages,
                "stream": False
            })
            return res.json()['message']['content']
        except Exception as e:
            return f"Brain Error: {e}"

    def describe(self, image_path, prompt="Describe this image in detail."):
        """
        image_path: Absolute path to image
        """
        if not self.available or not self.vision_model: return "Vision model not found."
        
        try:
            import base64
            with open(image_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode('utf-8')
            
            res = requests.post(f"{self.base_url}/api/generate", json={
                "model": self.vision_model,
                "prompt": prompt,
                "images": [b64],
                "stream": False
            })
            return res.json()['response']
        except Exception as e:
            return f"Vision Error: {e}"

# Singleton
ollama_ai = OllamaEngine()
