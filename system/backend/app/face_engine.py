import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import threading
import os

class FaceEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(FaceEngine, cls).__new__(cls)
                cls._instance.detector = None
        return cls._instance

    def load(self):
        if self.detector is None:
            print("🗿 [FACE] Awakening MediaPipe (Tasks API)...")
            
            # Need to download the model file first!
            model_path = 'blaze_face_short_range.tflite'
            if not os.path.exists(model_path):
                print("📥 Downloading BlazeFace model...")
                os.system(f"curl -L -o {model_path} https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite")

            base_options = python.BaseOptions(model_asset_path=model_path)
            options = vision.FaceDetectorOptions(base_options=base_options, min_detection_confidence=0.5)
            self.detector = vision.FaceDetector.create_from_options(options)
            print("✅ [FACE] Eyes Open (MediaPipe Tasks).")

    def detect(self, img_numpy):
        """
        Input: RGB numpy array
        """
        if self.detector is None: self.load()
        
        # Convert numpy to MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_numpy)
        
        detection_result = self.detector.detect(mp_image)
        faces = []
        
        h, w, _ = img_numpy.shape
        for detection in detection_result.detections:
            bbox = detection.bounding_box
            # MP Tasks returns absolute pixel coords directly! (x, y, w, h)
            x1 = int(bbox.origin_x)
            y1 = int(bbox.origin_y)
            x2 = int(bbox.origin_x + bbox.width)
            y2 = int(bbox.origin_y + bbox.height)
            
            # Padding
            pad_x = int(bbox.width * 0.2)
            pad_y = int(bbox.height * 0.2)
            x1 = max(0, x1 - pad_x)
            y1 = max(0, y1 - pad_y)
            x2 = min(w, x2 + pad_x)
            y2 = min(h, y2 + pad_y)

            faces.append({
                "embedding": None, 
                "bbox": [x1, y1, x2, y2],
                "score": detection.categories[0].score if detection.categories else 0.5
            })
        
        return faces

face_ai = FaceEngine()
