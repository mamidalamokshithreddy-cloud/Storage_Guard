"""
Computer Vision Inference Pipeline
ONNX model loading, image preprocessing, inference, and confidence scoring
"""

import logging
import time
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import json

import numpy as np
import cv2
from PIL import Image
try:
    import onnxruntime as ort
    import torch
    import torchvision.transforms as transforms
    INFERENCE_DEPENDENCIES_AVAILABLE = True
except (ImportError, RuntimeError, AttributeError) as e:
    # Handle torch/torchvision compatibility issues
    ort = None
    torch = None
    transforms = None
    INFERENCE_DEPENDENCIES_AVAILABLE = False
    import logging
    logging.getLogger(__name__).warning(f"Inference dependencies not available: {e}")

from app.schemas.postgres_base_models import Alternative


logger = logging.getLogger(__name__)



class ModelInference:
    """
    ONNX-based computer vision inference for pest and disease detection
    """
    
    def __init__(self, model_path: str, label_map_path: str, calibration_path: Optional[str] = None):
        """
        Initialize inference pipeline
        
        Args:
            model_path: Path to ONNX model file
            label_map_path: Path to label mapping JSON
            calibration_path: Optional path to calibration parameters
        """
        if not INFERENCE_DEPENDENCIES_AVAILABLE:
            raise RuntimeError("Inference dependencies not available. Cannot initialize ModelInference.")
        
        self.model_path = Path(model_path)
        self.label_map_path = Path(label_map_path)
        self.calibration_path = Path(calibration_path) if calibration_path else None
        
        # Model components
        self.session = None
        self.label_map = {}
        self.calibration_params = {}
        self.input_name = None
        self.output_names = []
        self.input_shape = None
        
        # Performance tracking
        self.inference_times = []
        self.preprocessing_times = []
        
        # Load components
        self._load_model()
        self._load_label_map()
        self._load_calibration()
        
        logger.info(
            f"✅ Model inference initialized",
            extra={
                "model_path": str(self.model_path),
                "input_shape": self.input_shape,
                "num_classes": len(self.label_map),
                "calibrated": self.calibration_path is not None
            }
        )
    
    def _load_model(self):
        """Load ONNX model and get input/output information"""
        try:
            # Configure ONNX Runtime for optimal performance
            providers = []
            
            # Use GPU if available
            if ort.get_device() == 'GPU':
                providers.append('CUDAExecutionProvider')
            providers.append('CPUExecutionProvider')
            
            # Create inference session
            self.session = ort.InferenceSession(
                str(self.model_path),
                providers=providers
            )
            
            # Get input/output metadata
            self.input_name = self.session.get_inputs()[0].name
            self.output_names = [output.name for output in self.session.get_outputs()]
            self.input_shape = self.session.get_inputs()[0].shape
            
            logger.info(
                f"📦 ONNX model loaded",
                extra={
                    "providers": providers,
                    "input_name": self.input_name,
                    "output_names": self.output_names,
                    "input_shape": self.input_shape
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to load ONNX model: {e}")
            raise RuntimeError(f"Model loading failed: {e}")
    
    def _load_label_map(self):
        """Load class label mapping"""
        try:
            with open(self.label_map_path, 'r', encoding='utf-8') as f:
                self.label_map = json.load(f)
            
            logger.info(f"📋 Label map loaded: {len(self.label_map)} classes")
            
        except Exception as e:
            logger.error(f"Failed to load label map: {e}")
            raise RuntimeError(f"Label map loading failed: {e}")
    
    def _load_calibration(self):
        """Load probability calibration parameters"""
        if not self.calibration_path or not self.calibration_path.exists():
            logger.info("🎯 No calibration file found, using raw probabilities")
            return
        
        try:
            with open(self.calibration_path, 'r', encoding='utf-8') as f:
                self.calibration_params = json.load(f)
            
            logger.info("🎯 Calibration parameters loaded")
            
        except Exception as e:
            logger.warning(f"Failed to load calibration: {e}")
            self.calibration_params = {}
    
    def preprocess_image(self, image_path: str, target_size: Tuple[int, int] = None) -> np.ndarray:
        """
        Preprocess image for model inference
        
        Args:
            image_path: Path to input image
            target_size: Target size (height, width), uses model input size if None
            
        Returns:
            Preprocessed image array ready for inference
        """
        start_time = time.time()
        
        try:
            # Determine target size
            if target_size is None:
                if len(self.input_shape) == 4:  # NCHW format
                    target_size = (self.input_shape[2], self.input_shape[3])
                else:
                    target_size = (224, 224)  # Default
            
            # Load image
            image = cv2.imread(str(image_path))
            if image is None:
                raise ValueError(f"Failed to load image: {image_path}")
            
            # Convert BGR to RGB
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Resize image
            image = cv2.resize(image, target_size, interpolation=cv2.INTER_LINEAR)
            
            # Normalize to [0, 1]
            image = image.astype(np.float32) / 255.0
            
            # Apply ImageNet normalization
            mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
            std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
            image = (image - mean) / std
            
            # Convert to NCHW format for ONNX
            image = np.transpose(image, (2, 0, 1))  # HWC -> CHW
            image = np.expand_dims(image, axis=0)   # Add batch dimension
            
            preprocessing_time = time.time() - start_time
            self.preprocessing_times.append(preprocessing_time)
            
            logger.debug(
                f"🖼️ Image preprocessed",
                extra={
                    "image_path": image_path,
                    "target_size": target_size,
                    "output_shape": image.shape,
                    "preprocessing_time": preprocessing_time
                }
            )
            
            return image
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise RuntimeError(f"Preprocessing failed: {e}")
    
    def run_inference(self, image_array: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Run model inference on preprocessed image
        
        Args:
            image_array: Preprocessed image array
            
        Returns:
            Dictionary of model outputs
        """
        start_time = time.time()
        
        try:
            # Run inference
            outputs = self.session.run(
                self.output_names,
                {self.input_name: image_array}
            )
            
            # Convert to dictionary
            output_dict = {
                name: output for name, output in zip(self.output_names, outputs)
            }
            
            inference_time = time.time() - start_time
            self.inference_times.append(inference_time)
            
            logger.debug(
                f"🧠 Inference completed",
                extra={
                    "inference_time": inference_time,
                    "output_shapes": {name: output.shape for name, output in output_dict.items()}
                }
            )
            
            return output_dict
            
        except Exception as e:
            logger.error(f"Model inference failed: {e}")
            raise RuntimeError(f"Inference failed: {e}")
    
    def postprocess_outputs(self, outputs: Dict[str, np.ndarray], top_k: int = 5) -> Tuple[str, float, List[Alternative]]:
        """
        Post-process model outputs to get predictions
        
        Args:
            outputs: Raw model outputs
            top_k: Number of top predictions to return
            
        Returns:
            Tuple of (primary_label, confidence, alternatives)
        """
        try:
            # Get prediction probabilities (assuming classification model)
            # Adapt this based on your actual model output format
            if 'logits' in outputs:
                logits = outputs['logits'][0]  # Remove batch dimension
            elif 'output' in outputs:
                logits = outputs['output'][0]
            else:
                # Use first output if naming is unclear
                logits = list(outputs.values())[0][0]
            
            # Apply softmax to get probabilities
            exp_logits = np.exp(logits - np.max(logits))  # Numerical stability
            probabilities = exp_logits / np.sum(exp_logits)
            
            # Apply calibration if available
            if self.calibration_params:
                probabilities = self._apply_calibration(probabilities)
            
            # Get top-k predictions
            top_indices = np.argsort(probabilities)[-top_k:][::-1]
            
            # Create result objects
            primary_idx = top_indices[0]
            primary_label = self.label_map.get(str(primary_idx), f"class_{primary_idx}")
            primary_confidence = float(probabilities[primary_idx])
            
            alternatives = []
            for idx in top_indices[1:]:
                alt_label = self.label_map.get(str(idx), f"class_{idx}")
                alt_confidence = float(probabilities[idx])
                alternatives.append(Alternative(
                    label=alt_label,
                    confidence=alt_confidence
                ))
            
            logger.debug(
                f"🎯 Predictions generated",
                extra={
                    "primary_label": primary_label,
                    "primary_confidence": primary_confidence,
                    "alternatives_count": len(alternatives)
                }
            )
            
            return primary_label, primary_confidence, alternatives
            
        except Exception as e:
            logger.error(f"Output postprocessing failed: {e}")
            raise RuntimeError(f"Postprocessing failed: {e}")
    
    def _apply_calibration(self, probabilities: np.ndarray) -> np.ndarray:
        """Apply temperature scaling or Platt scaling calibration"""
        try:
            if 'temperature' in self.calibration_params:
                # Temperature scaling
                temperature = self.calibration_params['temperature']
                logits = np.log(probabilities + 1e-8)  # Convert back to logits
                calibrated_logits = logits / temperature
                
                # Apply softmax
                exp_logits = np.exp(calibrated_logits - np.max(calibrated_logits))
                return exp_logits / np.sum(exp_logits)
            
            elif 'platt_a' in self.calibration_params and 'platt_b' in self.calibration_params:
                # Platt scaling (simplified for multiclass)
                a = self.calibration_params['platt_a']
                b = self.calibration_params['platt_b']
                
                # Apply Platt scaling to max probability
                max_prob = np.max(probabilities)
                calibrated_max = 1 / (1 + np.exp(a * max_prob + b))
                
                # Scale all probabilities proportionally
                scale_factor = calibrated_max / max_prob
                return probabilities * scale_factor
            
            else:
                logger.warning("Unknown calibration format, using raw probabilities")
                return probabilities
                
        except Exception as e:
            logger.warning(f"Calibration failed, using raw probabilities: {e}")
            return probabilities
    
    def predict(self, image_path: str, top_k: int = 5) -> Tuple[str, float, List[Alternative]]:
        """
        Complete inference pipeline: preprocess -> inference -> postprocess
        
        Args:
            image_path: Path to input image
            top_k: Number of top predictions to return
            
        Returns:
            Tuple of (primary_label, confidence, alternatives)
        """
        try:
            # Preprocess image
            image_array = self.preprocess_image(image_path)
            
            # Run inference
            outputs = self.run_inference(image_array)
            
            # Postprocess outputs
            return self.postprocess_outputs(outputs, top_k)
            
        except Exception as e:
            logger.error(f"Prediction failed for {image_path}: {e}")
            raise
    
    def get_performance_stats(self) -> Dict[str, float]:
        """Get performance statistics"""
        stats = {
            "total_inferences": len(self.inference_times),
            "avg_inference_time": np.mean(self.inference_times) if self.inference_times else 0,
            "avg_preprocessing_time": np.mean(self.preprocessing_times) if self.preprocessing_times else 0,
            "total_time": sum(self.inference_times) + sum(self.preprocessing_times)
        }
        
        if self.inference_times:
            stats.update({
                "min_inference_time": np.min(self.inference_times),
                "max_inference_time": np.max(self.inference_times),
                "p95_inference_time": np.percentile(self.inference_times, 95)
            })
        
        return stats


class DetectionInference(ModelInference):
    """
    Extended inference class for object detection models (YOLO, etc.)
    """
    
    def __init__(self, model_path: str, label_map_path: str, calibration_path: Optional[str] = None,
                 confidence_threshold: float = 0.5, nms_threshold: float = 0.4):
        """
        Initialize detection inference
        
        Args:
            model_path: Path to ONNX detection model
            label_map_path: Path to label mapping JSON
            calibration_path: Optional calibration parameters
            confidence_threshold: Minimum confidence for detections
            nms_threshold: NMS IoU threshold
        """
        super().__init__(model_path, label_map_path, calibration_path)
        self.confidence_threshold = confidence_threshold
        self.nms_threshold = nms_threshold
    
    def postprocess_detections(self, outputs: Dict[str, np.ndarray], 
                             image_shape: Tuple[int, int]) -> Tuple[str, float, List[Alternative], List[Dict]]:
        """
        Post-process detection model outputs
        
        Args:
            outputs: Raw detection outputs
            image_shape: Original image shape (height, width)
            
        Returns:
            Tuple of (primary_label, confidence, alternatives, bounding_boxes)
        """
        try:
            # Extract detection data (adapt based on your model format)
            # Assuming YOLO-style output: [batch, detections, (x, y, w, h, conf, class_probs...)]
            if 'detections' in outputs:
                detections = outputs['detections'][0]  # Remove batch dimension
            else:
                detections = list(outputs.values())[0][0]
            
            # Filter by confidence
            confidences = detections[:, 4]  # Assuming confidence is at index 4
            valid_detections = detections[confidences > self.confidence_threshold]
            
            if len(valid_detections) == 0:
                return "healthy", 0.0, [], []
            
            # Extract bounding boxes and class predictions
            boxes = valid_detections[:, :4]  # x, y, w, h
            confidences = valid_detections[:, 4]
            class_probs = valid_detections[:, 5:]  # Class probabilities
            
            # Get class predictions
            class_ids = np.argmax(class_probs, axis=1)
            class_confidences = np.max(class_probs, axis=1)
            final_confidences = confidences * class_confidences
            
            # Apply Non-Maximum Suppression
            indices = cv2.dnn.NMSBoxes(
                boxes.tolist(),
                final_confidences.tolist(),
                self.confidence_threshold,
                self.nms_threshold
            )
            
            if len(indices) == 0:
                return "healthy", 0.0, [], []
            
            # Process final detections
            final_detections = []
            class_counts = {}
            
            for i in indices.flatten():
                box = boxes[i]
                class_id = class_ids[i]
                confidence = final_confidences[i]
                
                # Convert to absolute coordinates
                x, y, w, h = box
                x1 = max(0, int(x - w/2))
                y1 = max(0, int(y - h/2))
                x2 = min(image_shape[1], int(x + w/2))
                y2 = min(image_shape[0], int(y + h/2))
                
                class_name = self.label_map.get(str(class_id), f"class_{class_id}")
                
                final_detections.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": float(confidence),
                    "class": class_name
                })
                
                # Count classes
                class_counts[class_name] = class_counts.get(class_name, 0) + 1
            
            # Determine primary class and alternatives
            if class_counts:
                primary_class = max(class_counts.keys(), key=lambda k: class_counts[k])
                primary_confidence = max(d["confidence"] for d in final_detections if d["class"] == primary_class)
                
                alternatives = []
                for class_name, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True)[1:]:
                    max_conf = max(d["confidence"] for d in final_detections if d["class"] == class_name)
                    alternatives.append(Alternative(
                        label=class_name,
                        confidence=max_conf,
                        description=f"{count} detections"
                    ))
            else:
                primary_class = "healthy"
                primary_confidence = 0.0
                alternatives = []
            
            logger.debug(
                f"🎯 Detection postprocessing completed",
                extra={
                    "detections": len(final_detections),
                    "primary_class": primary_class,
                    "confidence": primary_confidence
                }
            )
            
            return primary_class, primary_confidence, alternatives, final_detections
            
        except Exception as e:
            logger.error(f"Detection postprocessing failed: {e}")
            raise RuntimeError(f"Detection postprocessing failed: {e}")


# Factory function to create appropriate inference class
def create_inference_engine(model_type: str = "classification", **kwargs) -> Optional[ModelInference]:
    """
    Factory function to create inference engine
    
    Args:
        model_type: "classification" or "detection"
        **kwargs: Arguments for inference class
        
    Returns:
        Inference engine instance or None if dependencies unavailable
    """
    if not INFERENCE_DEPENDENCIES_AVAILABLE:
        logger.warning("Cannot create inference engine: dependencies not available")
        return None
    
    try:
        if model_type == "detection":
            return DetectionInference(**kwargs)
        else:
            return ModelInference(**kwargs)
    except Exception as e:
        logger.error(f"Failed to create inference engine: {e}")
        return None
