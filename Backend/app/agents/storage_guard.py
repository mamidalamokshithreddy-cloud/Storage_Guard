import cv2
import numpy as np
import requests
from pathlib import Path
from ultralytics import YOLO
from app.schemas.postgres_base_models import QualityReport, Defect

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
    # Single Image Analysis
    # -------------------------
    def analyze_image(self, image_bytes: bytes) -> QualityReport:
        """Analyze a single image from bytes and detect crop type."""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Could not decode the image file.")

            # Run inference with low confidence threshold for newly trained models
            results = self.model(img, conf=0.1, iou=0.4)
            result = results[0]

            detected_defects = []
            detected_crop = "Unknown"
            crop_confidence = 0.0
            
            # Extract detections
            for i in range(len(result.boxes.cls)):
                class_id = int(result.boxes.cls[i])
                class_name = result.names.get(class_id, "unknown")
                confidence = float(result.boxes.conf[i])
                bounding_box = result.boxes.xyxyn[i].tolist()
                
                # Check if this is a crop detection (lowered threshold for trained models)
                if confidence > crop_confidence and confidence > 0.1:
                    # Could be a crop name
                    if not any(defect_word in class_name.lower() for defect_word in ['defect', 'damage', 'rot', 'spot', 'mold']):
                        detected_crop = class_name.replace("_", " ").title()
                        crop_confidence = confidence
                
                # Count as defect if labeled as such
                if any(defect_word in class_name.lower() for defect_word in ['defect', 'damage', 'rot', 'spot', 'mold']):
                    detected_defects.append(
                        Defect(
                            type=class_name.replace("_", " "),
                            confidence=round(confidence, 2),
                            bounding_box=[round(coord, 4) for coord in bounding_box],
                        )
                    )

            num_defects = len(detected_defects)
            if num_defects == 0:
                grade, shelf_life = "Grade A", 15
            elif num_defects <= 2:
                grade, shelf_life = "Grade B", 7
            else:
                grade, shelf_life = "Grade C", 2

            return QualityReport(
                overall_quality=grade,
                shelf_life_days=shelf_life,
                defects_found=num_defects,
                defects=detected_defects,
                crop_detected=detected_crop if crop_confidence > 0.1 else None,
                crop_confidence=round(crop_confidence, 2) if crop_confidence > 0.5 else None
            )

        except Exception as e:
            # Fail-safe fallback
            return QualityReport(
                overall_quality="Rejected",
                shelf_life_days=0,
                defects_found=0,
                defects=[],
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
