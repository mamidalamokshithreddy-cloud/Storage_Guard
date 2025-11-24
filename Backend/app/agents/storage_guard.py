import cv2
import numpy as np
import requests
from pathlib import Path
from ultralytics import YOLO
from app.schemas.postgres_base_models import QualityReport, Defect
import sys

# Import hybrid detector for fallback
sys.path.append(str(Path(__file__).parent.parent.parent))
try:
    from hybrid_crop_detector import get_hybrid_detector
    HYBRID_AVAILABLE = True
except:
    HYBRID_AVAILABLE = False
    print("⚠️ Hybrid detector not available")

# Import AI analyzer for intelligent analysis
try:
    from app.services.ai_crop_analyzer import get_ai_analyzer
    AI_ANALYZER_AVAILABLE = True
except:
    AI_ANALYZER_AVAILABLE = False
    print("⚠️ AI analyzer not available")

class StorageGuardAgent:
    """
    An AI agent for performing quality checks on produce images.
    Supports single-image and multi-image analysis.
    Uses custom crop detection model if available.
    """

    def __init__(self, model_path: str = "yolov8n.pt"):
        # Try to use custom trained crop detection model first
        custom_model_path = Path("crop_detection_model.pt")
        if custom_model_path.exists():
            model_path = str(custom_model_path)
            print(f"🌾 Using custom crop detection model: {model_path}")
        
        try:
            self.model = YOLO(model_path)
            self.is_mock = False
            self.model_path = model_path
            print(f"✅ Successfully loaded YOLOv8 model: {model_path}")
        except Exception as e:
            print(f"⚠️ Warning: Could not load YOLOv8 model from '{model_path}'. Using a mock model. Error: {e}")
            self._create_mock_model()
            self.is_mock = True
            self.model_path = "mock"

    # -------------------------
    # Mock fallback
    # -------------------------
    def _create_mock_model(self):
        class MockModel:
            def __call__(self, *args, **kwargs): return [MockResults()]
        class MockResults:
            def __init__(self):
                self.names = {0: "mock_defect"}
                self.boxes = MockBoxes()
        class MockBoxes:
            def __init__(self):
                self.cls = np.array([0])
                self.conf = np.array([0.95])
                self.xyxyn = np.array([[0.1, 0.1, 0.2, 0.2]])
        self.model = MockModel()

    # -------------------------
    # Computer Vision Analysis
    # -------------------------
    def _analyze_freshness(self, img: np.ndarray, crop_name: str) -> tuple[str, float]:
        """
        Analyze freshness based on color, texture, and visual characteristics.
        Returns: (freshness_level, freshness_score)
        """
        try:
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Calculate color statistics
            h_mean = np.mean(hsv[:, :, 0])  # Hue
            s_mean = np.mean(hsv[:, :, 1])  # Saturation
            v_mean = np.mean(hsv[:, :, 2])  # Value/Brightness
            
            # Calculate color variance (fresh produce has consistent color)
            h_std = np.std(hsv[:, :, 0])
            s_std = np.std(hsv[:, :, 1])
            
            # Convert to grayscale for texture analysis
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Calculate sharpness (Laplacian variance - fresh produce is sharper)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Brightness consistency (fresh produce has even brightness)
            brightness_std = np.std(gray)
            
            # --- CROP-SPECIFIC FRESHNESS RULES ---
            crop_lower = crop_name.lower()
            freshness_score = 0.0
            
            if "cotton" in crop_lower:
                # Cotton: Fresh = bright white/cream (high value, low saturation)
                # Old cotton = yellowish/grayish (lower value, higher saturation)
                if v_mean > 180 and s_mean < 50:  # Bright and white
                    freshness_score = 0.9 + (v_mean - 180) / 750
                elif v_mean > 150 and s_mean < 80:  # Good condition
                    freshness_score = 0.7 + (v_mean - 150) / 300
                else:  # Degraded
                    freshness_score = 0.5
                    
            elif any(word in crop_lower for word in ["tomato", "apple", "fruit"]):
                # Fresh fruits: High saturation, consistent color, sharp edges
                if s_mean > 100 and h_std < 20 and laplacian_var > 100:
                    freshness_score = 0.9
                elif s_mean > 70 and laplacian_var > 50:
                    freshness_score = 0.75
                else:
                    freshness_score = 0.5
                    
            elif any(word in crop_lower for word in ["grain", "wheat", "rice", "maize"]):
                # Fresh grains: Golden/brown color, high sharpness, uniform
                if 15 < h_mean < 35 and laplacian_var > 80 and brightness_std < 50:
                    freshness_score = 0.9
                elif laplacian_var > 40:
                    freshness_score = 0.7
                else:
                    freshness_score = 0.5
                    
            elif any(word in crop_lower for word in ["leaf", "vegetable", "spinach", "lettuce"]):
                # Fresh greens: Vibrant green (hue 40-80), high saturation
                if 40 < h_mean < 80 and s_mean > 80 and laplacian_var > 60:
                    freshness_score = 0.95
                elif 30 < h_mean < 90 and s_mean > 60:
                    freshness_score = 0.75
                else:
                    freshness_score = 0.5
                    
            else:
                # Generic freshness: High sharpness + consistent color
                color_consistency = 100 - min(h_std + s_std, 100)
                sharpness_score = min(laplacian_var / 150, 1.0)
                freshness_score = (color_consistency / 100 * 0.5) + (sharpness_score * 0.5)
            
            # Clamp score between 0 and 1
            freshness_score = max(0.0, min(1.0, freshness_score))
            
            # Convert score to level
            if freshness_score >= 0.85:
                level = "Excellent - Very Fresh"
            elif freshness_score >= 0.70:
                level = "Good - Fresh"
            elif freshness_score >= 0.50:
                level = "Fair - Acceptable"
            else:
                level = "Poor - Degraded"
            
            print(f"🌡️ Freshness Analysis: {level} (Score: {freshness_score:.2f})")
            print(f"   Color: H={h_mean:.1f}°, S={s_mean:.1f}%, V={v_mean:.1f}%")
            print(f"   Sharpness: {laplacian_var:.1f}, Color Variance: {h_std:.1f}")
            
            return level, freshness_score
            
        except Exception as e:
            print(f"⚠️ Freshness analysis failed: {e}")
            return "N/A", 0.0

    def _detect_visual_defects(self, img: np.ndarray) -> list:
        """
        Detect visual defects using computer vision (beyond YOLO detection).
        Looks for: spots, discoloration, bruising, mold patterns
        """
        visual_defects = []
        
        try:
            # Convert to different color spaces
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # 1. SPOT DETECTION (dark spots indicate rot/damage)
            # Use adaptive thresholding to find dark regions
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            _, dark_spots = cv2.threshold(blur, 50, 255, cv2.THRESH_BINARY_INV)
            
            # Find contours of dark spots
            contours, _ = cv2.findContours(dark_spots, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter significant spots (not just noise)
            significant_spots = [c for c in contours if cv2.contourArea(c) > 100]
            
            if len(significant_spots) > 5:
                visual_defects.append({
                    "type": "Dark Spots/Bruising",
                    "count": len(significant_spots),
                    "severity": "High" if len(significant_spots) > 15 else "Medium"
                })
            elif len(significant_spots) > 0:
                visual_defects.append({
                    "type": "Minor Spots",
                    "count": len(significant_spots),
                    "severity": "Low"
                })
            
            # 2. DISCOLORATION DETECTION (color inconsistency)
            # Calculate color variance across the image
            h_channel = hsv[:, :, 0]
            h_std = np.std(h_channel)
            
            if h_std > 30:  # High color variance = discoloration
                visual_defects.append({
                    "type": "Color Inconsistency",
                    "variance": round(float(h_std), 2),
                    "severity": "High" if h_std > 50 else "Medium"
                })
            
            # 3. MOLD/TEXTURE IRREGULARITIES
            # Use edge detection to find unusual texture patterns
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.count_nonzero(edges) / edges.size
            
            if edge_density > 0.15:  # Too many edges = rough/damaged texture
                visual_defects.append({
                    "type": "Irregular Texture",
                    "edge_density": round(float(edge_density), 3),
                    "severity": "Medium"
                })
            
        except Exception as e:
            print(f"⚠️ Visual defect detection failed: {e}")
        
        return visual_defects

    # -------------------------
    # Single Image Analysis
    # -------------------------
    def analyze_image(self, image_bytes: bytes, user_crop_hint: str = None) -> QualityReport:
        """Analyze a single image from bytes and detect crop type."""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Could not decode the image file.")

            # === STEP 1: AI-POWERED ANALYSIS (Primary Method) ===
            ai_result = None
            if AI_ANALYZER_AVAILABLE:
                try:
                    ai_analyzer = get_ai_analyzer()
                    ai_result = ai_analyzer.analyze_crop_with_ai(image_bytes, user_crop_hint)
                    
                    if ai_result and ai_result.get('confidence', 0) > 0.6:
                        print(f"🤖 AI Analysis: {ai_result['crop_name']} ({ai_result['confidence']:.2f}) via {ai_result.get('provider', 'AI')}")
                        print(f"   Grade: {ai_result['quality_grade']}, Freshness: {ai_result['freshness']}")
                        print(f"   Reasoning: {ai_result['reasoning'][:100]}...")
                        
                        # Use AI results directly
                        detected_crop = ai_result['crop_name']
                        crop_confidence = ai_result['confidence']
                        detection_approach = f"ai_{ai_result.get('provider', 'unknown')}"
                        
                        # Convert AI defects to Defect objects
                        detected_defects = []
                        for defect_name in ai_result.get('defects', []):
                            detected_defects.append(
                                Defect(
                                    type=defect_name,
                                    confidence=0.85,
                                    bounding_box=[0.0, 0.0, 1.0, 1.0],  # Placeholder
                                )
                            )
                        
                        # Use AI's freshness and grade assessments
                        freshness_level = ai_result['freshness']
                        freshness_reasoning = ai_result.get('freshness_reasoning', '')
                        ai_grade = ai_result['quality_grade']
                        shelf_life = ai_result.get('shelf_life_days', 10)
                        
                        # Map AI grade to our format
                        if ai_grade == 'A':
                            grade = "Grade A"
                        elif ai_grade == 'B':
                            grade = "Grade B"
                        elif ai_grade == 'C':
                            grade = "Grade C"
                        else:
                            grade = "Grade B"
                        
                        # Calculate freshness score from level
                        freshness_score = {
                            'Excellent': 0.95,
                            'Good': 0.75,
                            'Fair': 0.55,
                            'Poor': 0.30
                        }.get(freshness_level, 0.70)
                        
                        # Get visual defects from CV
                        visual_defects_list = self._detect_visual_defects(img)
                        defects_summary = ai_result.get('detailed_analysis', 'AI-analyzed')
                        
                        print(f"✅ Using AI Analysis: {grade}, Freshness: {freshness_level} ({freshness_score:.2f})")
                        
                        return QualityReport(
                            overall_quality=grade,
                            shelf_life_days=shelf_life,
                            defects_found=len(detected_defects) + len(visual_defects_list),
                            defects=detected_defects,
                            crop_detected=detected_crop,
                            crop_confidence=round(crop_confidence, 2),
                            freshness=freshness_level,
                            freshness_score=round(freshness_score, 2),
                            visual_defects=defects_summary,
                            recommendation=ai_result.get('storage_recommendation', 'Store in cool, dry place')
                        )
                    
                except Exception as e:
                    print(f"⚠️ AI analysis failed, falling back to hybrid: {e}")
            
            # === STEP 2: HYBRID DETECTION (Fallback) ===
            detected_crop = "Unknown"
            crop_confidence = 0.0
            detection_approach = "none"
            
            # Try hybrid detector
            if HYBRID_AVAILABLE and not self.is_mock:
                try:
                    hybrid = get_hybrid_detector()
                    detected_crop, crop_confidence, detection_approach = hybrid.detect_crop(image_bytes, user_crop_hint)
                    print(f"🎯 Hybrid Detection: {detected_crop} ({crop_confidence:.2f}) via {detection_approach}")
                except Exception as e:
                    print(f"⚠️ Hybrid detection failed: {e}")
            
            # Fallback to YOLO detection if hybrid failed
            if crop_confidence < 0.5 and not self.is_mock:
                try:
                    results = self.model(img, conf=0.1, iou=0.4, verbose=False)
                    result = results[0]
                    
                    for i in range(len(result.boxes.cls)):
                        class_id = int(result.boxes.cls[i])
                        class_name = result.names.get(class_id, "unknown")
                        confidence = float(result.boxes.conf[i])
                        
                        if confidence > crop_confidence and confidence > 0.1:
                            if not any(defect_word in class_name.lower() for defect_word in ['defect', 'damage', 'rot', 'spot', 'mold']):
                                detected_crop = class_name.replace("_", " ").title()
                                crop_confidence = confidence
                                detection_approach = "yolo"
                except Exception as e:
                    print(f"⚠️ YOLO detection error: {e}")
            
            # Use user hint if nothing else worked
            if crop_confidence < 0.3 and user_crop_hint:
                detected_crop = user_crop_hint.title()
                crop_confidence = 0.9
                detection_approach = "user_hint"
            
            print(f"✅ Final Crop Detection: {detected_crop} (confidence: {crop_confidence:.2f}, method: {detection_approach})")

            # === STEP 3: DEFECT DETECTION (YOLO-based) ===
            detected_defects = []
            
            try:
                if not self.is_mock:
                    results = self.model(img, conf=0.1, iou=0.4, verbose=False)
                    result = results[0]
                    
                    for i in range(len(result.boxes.cls)):
                        class_id = int(result.boxes.cls[i])
                        class_name = result.names.get(class_id, "unknown")
                        confidence = float(result.boxes.conf[i])
                        bounding_box = result.boxes.xyxyn[i].tolist()
                        
                        # Count as defect if labeled as such
                        if any(defect_word in class_name.lower() for defect_word in ['defect', 'damage', 'rot', 'spot', 'mold']):
                            detected_defects.append(
                                Defect(
                                    type=class_name.replace("_", " "),
                                    confidence=round(confidence, 2),
                                    bounding_box=[round(coord, 4) for coord in bounding_box],
                                )
                            )
            except Exception as e:
                print(f"⚠️ Defect detection error: {e}")

            # === STEP 4: ENHANCED COMPUTER VISION ANALYSIS ===
            print(f"🔬 Running enhanced CV analysis on {detected_crop}...")
            
            # 1. Analyze FRESHNESS using color and texture
            freshness_level, freshness_score = self._analyze_freshness(img, detected_crop)
            
            # 2. Detect VISUAL DEFECTS beyond YOLO
            visual_defects = self._detect_visual_defects(img)
            
            # Combine YOLO defects with visual defects
            total_visual_issues = len(visual_defects)
            
            # Create defect descriptions
            defect_descriptions = []
            if detected_defects:
                defect_descriptions.append(f"YOLO detected {len(detected_defects)} defects")
            if visual_defects:
                for vd in visual_defects:
                    defect_descriptions.append(f"{vd['type']}: {vd.get('severity', 'Unknown')} severity")
            
            defects_summary = "; ".join(defect_descriptions) if defect_descriptions else "None"
            
            # === STEP 5: SMART GRADING: Consider YOLO defects + Visual defects + Freshness ===
            num_yolo_defects = len(detected_defects)
            total_defect_score = num_yolo_defects + (total_visual_issues * 0.5)  # Visual defects count less
            
            # Adjust grade based on freshness and defects
            if total_defect_score == 0 and freshness_score >= 0.85:
                grade, shelf_life = "Grade A", 15
            elif total_defect_score <= 1 and freshness_score >= 0.70:
                grade, shelf_life = "Grade A", 12
            elif total_defect_score <= 2 and freshness_score >= 0.50:
                grade, shelf_life = "Grade B", 7
            elif total_defect_score <= 4:
                grade, shelf_life = "Grade B", 5
            else:
                grade, shelf_life = "Grade C", 2
            
            # Downgrade if freshness is poor
            if freshness_score < 0.50 and grade == "Grade A":
                grade = "Grade B"
                shelf_life = 7
            elif freshness_score < 0.30:
                grade = "Grade C"
                shelf_life = 2

            print(f"✅ Quality Assessment: {grade}, Freshness: {freshness_level}, Defects: {defects_summary}")

            return QualityReport(
                overall_quality=grade,
                shelf_life_days=shelf_life,
                defects_found=num_yolo_defects + total_visual_issues,
                defects=detected_defects,
                crop_detected=detected_crop if crop_confidence > 0.1 else None,
                crop_confidence=round(crop_confidence, 2) if crop_confidence > 0.5 else None,
                freshness=freshness_level,  # NEW FIELD
                freshness_score=round(freshness_score, 2),  # NEW FIELD
                visual_defects=defects_summary  # NEW FIELD
            )

        except Exception as e:
            print(f"❌ Analysis error: {e}")
            # Fail-safe fallback
            return QualityReport(
                overall_quality="Rejected",
                shelf_life_days=0,
                defects_found=0,
                defects=[],
                freshness="N/A",
                freshness_score=0.0,
                visual_defects="Analysis failed"
            )

    # -------------------------
    # Multi-Image Analysis
    # -------------------------
    def analyze_images(self, image_urls: list[str]) -> dict:
        """
        Analyze multiple images from URLs.
        Aggregates reports and returns summary.
        """
        reports = []
        for url in image_urls:
            try:
                resp = requests.get(url, timeout=5)
                if resp.status_code != 200:
                    continue
                report = self.analyze_image(resp.content)
                reports.append(report)
            except Exception as e:
                print(f"⚠️ Skipping image {url}: {e}")
                continue

        if not reports:
            return {
                "crop_detected": None,
                "grade": "Rejected",
                "defects": {},
                "recommendation": "No valid images processed",
            }

        # Simple aggregation: take "worst" grade
        grades = [r.overall_quality for r in reports]
        final_grade = min(grades)  # Grade A > B > C > Rejected
        defects = sum(r.defects_found for r in reports)

        return {
            "crop_detected": "Wheat",  # TODO: link to a crop classifier
            "grade": final_grade,
            "defects": defects,
            "recommendation": f"Processed {len(reports)} images. Final grade: {final_grade}",
        }

    # -------------------------
    # Model Info
    # -------------------------
    def get_model_info(self) -> dict:
        crop_classes = []
        if hasattr(self.model, 'names') and not self.is_mock:
            crop_classes = list(self.model.names.values())
        
        return {
            "model_type": "YOLOv8",
            "model_path": self.model_path,
            "is_mock": self.is_mock,
            "status": "loaded" if self.model else "not loaded",
            "num_classes": len(crop_classes),
            "crop_classes": crop_classes[:10] if len(crop_classes) > 10 else crop_classes,  # Show first 10
        }
