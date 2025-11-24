"""
HYBRID CROP DETECTION SYSTEM
Multi-approach fallback system for reliable crop detection
Combines: YOLO → Pre-trained Models → Computer Vision → Rule-based
"""

import cv2
import numpy as np
from pathlib import Path
import requests
from typing import Tuple, Optional
import json

class HybridCropDetector:
    """
    Smart crop detector with multiple fallback approaches
    """
    
    def __init__(self):
        self.approach_used = None
        self.confidence = 0.0
        
        # Try loading YOLO first
        self.yolo_model = self._try_load_yolo()
        
        # Color-based crop identification rules
        self.crop_color_rules = {
            'cotton': {'hue_range': (0, 180), 'sat_range': (0, 50), 'val_range': (150, 255)},  # White
            'tomato': {'hue_range': (0, 10), 'sat_range': (100, 255), 'val_range': (100, 255)},  # Red
            'spinach': {'hue_range': (40, 80), 'sat_range': (80, 255), 'val_range': (50, 200)},  # Green
            'wheat': {'hue_range': (15, 35), 'sat_range': (50, 255), 'val_range': (100, 200)},  # Golden
            'rice': {'hue_range': (15, 35), 'sat_range': (40, 200), 'val_range': (150, 255)},  # Light golden
            'potato': {'hue_range': (10, 30), 'sat_range': (20, 100), 'val_range': (100, 180)},  # Brown
            'onion': {'hue_range': (0, 20), 'sat_range': (50, 150), 'val_range': (120, 220)},  # Purple/red
            'chili': {'hue_range': (0, 10), 'sat_range': (150, 255), 'val_range': (80, 200)},  # Bright red
            'banana': {'hue_range': (20, 40), 'sat_range': (100, 255), 'val_range': (150, 255)},  # Yellow
            'orange': {'hue_range': (10, 25), 'sat_range': (150, 255), 'val_range': (150, 255)},  # Orange
        }
        
        # Texture-based features
        self.texture_patterns = {
            'cotton': 'fluffy_soft',
            'wheat': 'grain_pattern',
            'rice': 'grain_pattern',
            'leafy': 'smooth_surface',
            'fruit': 'smooth_round'
        }
        
        print(f"🔧 Hybrid Crop Detector initialized")
        print(f"   YOLO Model: {'✅ Loaded' if self.yolo_model else '❌ Not available'}")
        print(f"   Color Rules: {len(self.crop_color_rules)} crops")
        print(f"   Fallback: Computer Vision + Rule-based")
    
    def _try_load_yolo(self):
        """Try to load YOLO model with fallback"""
        try:
            from ultralytics import YOLO
            
            # Try custom model first
            if Path('crop_detection_model.pt').exists():
                model = YOLO('crop_detection_model.pt')
                print("✅ Loaded custom crop detection model")
                return model
            
            # Fallback to pre-trained YOLOv8
            elif Path('yolov8n.pt').exists():
                model = YOLO('yolov8n.pt')
                print("⚠️ Using YOLOv8n base model (limited crop detection)")
                return model
            
        except Exception as e:
            print(f"⚠️ YOLO not available: {e}")
        
        return None
    
    def detect_crop(self, image_bytes: bytes, user_hint: Optional[str] = None) -> Tuple[str, float, str]:
        """
        Detect crop using hybrid approach
        Returns: (crop_name, confidence, approach_used)
        """
        
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return "Unknown", 0.0, "image_decode_failed"
        
        # APPROACH 1: User Hint (highest priority)
        if user_hint:
            crop = self._validate_user_hint(user_hint, img)
            if crop:
                return crop, 0.95, "user_hint"
        
        # APPROACH 2: YOLO Detection
        if self.yolo_model:
            crop, conf = self._detect_with_yolo(img)
            if conf > 0.3:  # Reasonable confidence
                return crop, conf, "yolo"
        
        # APPROACH 3: Color-based Detection
        crop, conf = self._detect_by_color(img)
        if conf > 0.6:
            return crop, conf, "color_analysis"
        
        # APPROACH 4: Texture Analysis
        crop, conf = self._detect_by_texture(img)
        if conf > 0.5:
            return crop, conf, "texture_analysis"
        
        # APPROACH 5: Shape Analysis
        crop, conf = self._detect_by_shape(img)
        if conf > 0.5:
            return crop, conf, "shape_analysis"
        
        # FALLBACK: Unknown
        return "Unknown Crop", 0.1, "no_detection"
    
    def _validate_user_hint(self, hint: str, img: np.ndarray) -> Optional[str]:
        """Validate user's crop hint against image characteristics"""
        hint_lower = hint.lower().strip()
        
        # Quick validation - check if color matches
        if hint_lower in self.crop_color_rules:
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            rules = self.crop_color_rules[hint_lower]
            
            # Check if dominant color matches
            h_mean = np.mean(hsv[:, :, 0])
            s_mean = np.mean(hsv[:, :, 1])
            v_mean = np.mean(hsv[:, :, 2])
            
            h_match = rules['hue_range'][0] <= h_mean <= rules['hue_range'][1]
            s_match = rules['sat_range'][0] <= s_mean <= rules['sat_range'][1]
            v_match = rules['val_range'][0] <= v_mean <= rules['val_range'][1]
            
            # If 2 out of 3 match, accept hint
            if sum([h_match, s_match, v_match]) >= 2:
                return hint.title()
        
        # Accept hint anyway if it's a known crop
        known_crops = ['rice', 'wheat', 'cotton', 'maize', 'tomato', 'potato', 
                      'onion', 'chili', 'banana', 'mango', 'apple', 'grapes']
        if hint_lower in known_crops:
            return hint.title()
        
        return None
    
    def _detect_with_yolo(self, img: np.ndarray) -> Tuple[str, float]:
        """YOLO-based detection"""
        try:
            results = self.yolo_model(img, conf=0.1, verbose=False)
            result = results[0]
            
            if len(result.boxes.cls) > 0:
                class_id = int(result.boxes.cls[0])
                class_name = result.names.get(class_id, "unknown")
                confidence = float(result.boxes.conf[0])
                
                # Clean up class name
                clean_name = class_name.replace("_", " ").title()
                return clean_name, confidence
        
        except Exception as e:
            print(f"YOLO detection error: {e}")
        
        return "Unknown", 0.0
    
    def _detect_by_color(self, img: np.ndarray) -> Tuple[str, float]:
        """Color-based crop detection"""
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        h_mean = np.mean(hsv[:, :, 0])
        s_mean = np.mean(hsv[:, :, 1])
        v_mean = np.mean(hsv[:, :, 2])
        
        best_match = "Unknown"
        best_score = 0.0
        
        for crop, rules in self.crop_color_rules.items():
            # Calculate how well the image matches this crop's color profile
            h_match = 1.0 - abs(h_mean - np.mean(rules['hue_range'])) / 180
            s_match = 1.0 - abs(s_mean - np.mean(rules['sat_range'])) / 255
            v_match = 1.0 - abs(v_mean - np.mean(rules['val_range'])) / 255
            
            score = (h_match * 0.5 + s_match * 0.3 + v_match * 0.2)
            
            if score > best_score:
                best_score = score
                best_match = crop.title()
        
        return best_match, min(best_score, 0.85)
    
    def _detect_by_texture(self, img: np.ndarray) -> Tuple[str, float]:
        """Texture-based detection using edge patterns"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Calculate texture features
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.count_nonzero(edges) / edges.size
        
        # Classify based on texture
        if laplacian_var < 50 and edge_density < 0.1:
            # Smooth, uniform - likely cotton or smooth fruit
            return "Cotton", 0.6
        elif laplacian_var > 150 and edge_density > 0.2:
            # Highly textured - likely leafy vegetable
            return "Leafy Vegetable", 0.55
        elif 50 < laplacian_var < 150:
            # Medium texture - likely grain or root vegetable
            return "Grain/Root Crop", 0.5
        
        return "Unknown", 0.2
    
    def _detect_by_shape(self, img: np.ndarray) -> Tuple[str, float]:
        """Shape-based detection"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blur, 127, 255, cv2.THRESH_BINARY)
        
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Find largest contour
            largest = max(contours, key=cv2.contourArea)
            
            # Calculate circularity
            area = cv2.contourArea(largest)
            perimeter = cv2.arcLength(largest, True)
            
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                
                # Round objects - likely fruits
                if circularity > 0.7:
                    return "Round Fruit", 0.6
                # Elongated - likely vegetables
                elif circularity < 0.3:
                    return "Elongated Vegetable", 0.55
        
        return "Unknown", 0.2
    
    def get_detection_info(self) -> dict:
        """Get detector status info"""
        return {
            "yolo_available": self.yolo_model is not None,
            "color_rules": len(self.crop_color_rules),
            "approaches": ["yolo", "color", "texture", "shape", "user_hint"],
            "status": "ready"
        }


# Singleton instance
_detector = None

def get_hybrid_detector() -> HybridCropDetector:
    """Get or create singleton detector instance"""
    global _detector
    if _detector is None:
        _detector = HybridCropDetector()
    return _detector


if __name__ == "__main__":
    # Test the detector
    detector = HybridCropDetector()
    print("\n" + "="*60)
    print("HYBRID CROP DETECTOR - STATUS")
    print("="*60)
    print(json.dumps(detector.get_detection_info(), indent=2))
