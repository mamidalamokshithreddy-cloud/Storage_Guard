"""
Dynamic PyTorch Vision Classifier for Plant Disease/Pest Detection
Supports dynamic model loading, inference, and asynchronous retraining
"""

import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
import json
import logging
from pathlib import Path
from PIL import Image
import asyncio
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import hashlib
import os

logger = logging.getLogger(__name__)

class PlantClassifier:
    """Dynamic plant disease/pest classifier with retraining capabilities"""
    
    def __init__(self, model_dir: str = "app/models(ml)/vision", num_classes: int = 50):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.num_classes = num_classes
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.class_names = []
        self.training_queue = []
        # Detection and classification backbones (configurable via ENV)
        self.detection_backbone = os.getenv("DETECTION_BACKBONE", "fasterrcnn_resnet50_fpn")
        self.classification_backbone = os.getenv("CLASSIFICATION_BACKBONE", "efficientnet_b4")
        self.detector = None
        # ---- Training hyperparameters (configurable) ----
        self.min_samples_per_class = 2         # classes below this not weighted (weight=0)
        self.learning_rate = 7e-4              # base LR
        self.batch_size = 8                    # batch size for mini-batching
        self.epochs = 3                        # max epochs per training trigger
        self.early_stopping_patience = 2       # epochs without improvement before stop
        self.shuffle_each_epoch = True         # reshuffle stratified index order each epoch
        self.weighted_loss = True              # whether to apply class weighting
        self.bias_correction = True            # whether to log-prior init head bias each training run
        self.save_best_only = True             # save just best epoch weights
        self.validation_split = 0.15           # fraction per class for validation set
        self.class_sample_counts = {}
        self.executor = ThreadPoolExecutor(max_workers=1)  # Single training thread
        
        # Image transforms
        # Use larger size when using EfficientNet-B4/B5
        if self.classification_backbone in ("efficientnet_b4", "efficientnet_b5"):
            resize_sz = (380, 380) if self.classification_backbone == "efficientnet_b4" else (456, 456)
        else:
            resize_sz = (224, 224)
        self.transform = transforms.Compose([
            transforms.Resize(resize_sz),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        # Load detector if requested
        self._load_detector()
        # Load classification model on initialization
        self.load_latest_model()
        # Load persisted training configuration if available
        self._load_training_config()
        
    def get_latest_model_path(self) -> Optional[Path]:
        """Find the latest versioned model file"""
        model_files = list(self.model_dir.glob("plant_classifier_v*.pt"))
        if not model_files:
            base_model = self.model_dir / "plant_classifier.pt"
            return base_model if base_model.exists() else None
        
        # Sort by version number
        model_files.sort(key=lambda x: int(x.stem.split('_v')[-1]), reverse=True)
        return model_files[0]
    
    def _load_detector(self):
        """Load detection backbone (EfficientDet/DETR/Deformable DETR or fallback to torchvision Faster R-CNN).
        Prefers GPU if available. For Deformable DETR, this attempts to use MMDetection if installed
        and requires DEFORMABLE_DETR_CONFIG and DEFORMABLE_DETR_CHECKPOINT env vars to be set.
        """
        try:
            # 1) EfficientDet via effdet
            if self.detection_backbone.startswith("efficientdet") or self.detection_backbone.startswith("tf_efficientdet"):
                try:
                    from effdet import create_model
                    logger.info(f"Attempting to load EfficientDet model: {self.detection_backbone}")
                    self.detector = create_model(self.detection_backbone, bench_task='predict')
                    self.detector.eval()
                    self.detector.to(self.device)
                    logger.info("EfficientDet detector loaded")
                    return
                except Exception as e:
                    logger.warning(f"EfficientDet not available or failed to load: {e}")
            # 2) Deformable DETR via MMDetection (optional, heavy dependency)
            if "deformable" in self.detection_backbone or self.detection_backbone.lower().startswith("deformable"):
                try:
                    # Requires MMDetection and MMCV installed and configured
                    import mmdet
                    from mmdet.apis import init_detector
                    cfg_path = os.getenv("DEFORMABLE_DETR_CONFIG")
                except Exception as e:
                    logger.warning(f"DETR fallback failed: {e}")
            # Fallback to torchvision Faster R-CNN
            try:
                from torchvision.models.detection import fasterrcnn_resnet50_fpn
                logger.info("Loading torchvision Faster R-CNN as detection fallback")
                # Use the new weights enum API when available to avoid deprecated 'pretrained' warnings
                try:
                    from torchvision.models.detection import FasterRCNN_ResNet50_FPN_Weights
                    weights = FasterRCNN_ResNet50_FPN_Weights.DEFAULT
                    self.detector = fasterrcnn_resnet50_fpn(weights=weights)
                except Exception:
                    # Older torchvision versions: fall back to pretrained arg
                    self.detector = fasterrcnn_resnet50_fpn(pretrained=True)
                self.detector.eval()
                self.detector.to(self.device)
            except Exception as e:
                logger.warning(f"Failed to load any detector: {e}")
                self.detector = None
        except Exception:
            # Surrounding try in case insert placed outside class scope
            pass

    def create_model(self) -> nn.Module:
        """Create classification model according to `self.classification_backbone`"""
        try:
            if self.classification_backbone == 'efficientnet_b4':
                model = models.efficientnet_b4(weights='DEFAULT')
            elif self.classification_backbone == 'efficientnet_b5':
                model = models.efficientnet_b5(weights='DEFAULT')
            elif self.classification_backbone == 'resnet18' or self.classification_backbone.startswith('resnet'):
                model = models.resnet18(weights='DEFAULT')
            else:
                # default to b0 for compatibility
                try:
                    model = models.efficientnet_b0(weights='DEFAULT')
                except Exception:
                    model = models.resnet18(weights='DEFAULT')

            # Replace classifier head in a robust way depending on model structure
            if hasattr(model, 'classifier') and isinstance(model.classifier, nn.Sequential):
                # EfficientNet style: classifier usually a Sequential with (Dropout, Linear)
                try:
                    # find last linear layer
                    last_linear = None
                    for m in reversed(list(model.classifier)):
                        if isinstance(m, nn.Linear):
                            last_linear = m
                            break
                    in_features = last_linear.in_features if last_linear is not None else model.classifier[-1].in_features
                except Exception:
                    in_features = model.classifier[-1].in_features
                model.classifier = nn.Sequential(
                    nn.Dropout(0.3),
                    nn.Linear(in_features, self.num_classes)
                )
            elif hasattr(model, 'fc'):
                # ResNet style
                in_features = model.fc.in_features
                model.fc = nn.Linear(in_features, self.num_classes)
            else:
                # As a last resort, try to attach a simple head
                try:
                    model.fc = nn.Linear(1024, self.num_classes)
                except Exception:
                    pass
            return model
        except Exception as e:
            logger.error(f"Error creating classification model ({self.classification_backbone}): {e}")
            # Fallback to a simple resnet
            m = models.resnet18(weights='DEFAULT')
            m.fc = nn.Linear(m.fc.in_features, self.num_classes)
            return m

    def _class_names_file(self) -> Path:
        return self.model_dir / "class_names.json"

    def _load_class_names(self) -> None:
        try:
            fpath = self._class_names_file()
            if fpath.exists():
                with open(fpath, 'r') as f:
                    names = json.load(f)
                if isinstance(names, list) and all(isinstance(x, str) for x in names):
                    self.class_names = names
                    self.num_classes = len(self.class_names)
                    logger.info(f"Loaded {len(self.class_names)} class names from {fpath}")
        except Exception as e:
            logger.error(f"Failed to load class names: {e}")

    def _save_class_names(self) -> None:
        try:
            fpath = self._class_names_file()
            fpath.parent.mkdir(parents=True, exist_ok=True)
            with open(fpath, 'w') as f:
                json.dump(self.class_names, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save class names: {e}")
    
    def load_latest_model(self) -> bool:
        """Load the latest available model"""
        try:
            model_path = self.get_latest_model_path()
            
            if model_path and model_path.exists():
                logger.info(f"Loading model from {model_path}")
                # Secure checkpoint loading: prefer weights_only to reduce pickle attack surface.
                checkpoint = None
                loaded_state_dict = None
                try:
                    checkpoint = torch.load(model_path, map_location=self.device, weights_only=True)
                    # If we only got a raw state_dict (common for weights_only mode), store it
                    if isinstance(checkpoint, dict) and 'model_state_dict' not in checkpoint:
                        loaded_state_dict = checkpoint
                        checkpoint = None
                except TypeError:
                    # Torch version without weights_only parameter
                    checkpoint = torch.load(model_path, map_location=self.device)
                except Exception as e:
                    logger.warning(f"weights_only load failed ({e}); falling back to standard torch.load")
                    checkpoint = torch.load(model_path, map_location=self.device)

                # Sync class metadata from checkpoint BEFORE building the model
                ckpt_class_names = []
                ckpt_num_classes = None
                ckpt_classification_backbone = None
                if checkpoint is not None:
                    ckpt_class_names = checkpoint.get('class_names', [])
                    ckpt_num_classes = checkpoint.get('num_classes')
                    ckpt_classification_backbone = checkpoint.get('classification_backbone')
                if ckpt_class_names:
                    self.class_names = ckpt_class_names
                target_num_classes = ckpt_num_classes or (len(self.class_names) if self.class_names else self.num_classes)
                if target_num_classes and target_num_classes != self.num_classes:
                    self.num_classes = target_num_classes

                # If the checkpoint contains a classification_backbone entry, use it so we
                # instantiate the exact architecture variant (avoids head/feature size mismatches)
                if ckpt_classification_backbone:
                    logger.info(f"Checkpoint specifies classification_backbone={ckpt_classification_backbone}; using it")
                    self.classification_backbone = ckpt_classification_backbone
                else:
                    # Attempt to infer the backbone from state_dict key patterns if metadata missing
                    inferred = None
                    sd_probe = None
                    if checkpoint is not None:
                        sd_probe = checkpoint.get('model_state_dict')
                    if sd_probe is None and loaded_state_dict is not None:
                        sd_probe = loaded_state_dict
                    if isinstance(sd_probe, dict):
                        keys = list(sd_probe.keys())[:50]
                        joined = ' '.join(keys)
                        # heuristics based on typical torchvision effnet key names
                        if any(k.startswith('features.') for k in keys) or 'conv_stem' in joined:
                            # could be EfficientNet; choose B4 by default if image size suggests larger head
                            inferred = 'efficientnet_b4' if self.transform.transforms[0].size[0] >= 380 else 'efficientnet_b0'
                        elif any('layer1.' in k or k.startswith('conv1.') for k in keys):
                            inferred = 'resnet18'
                    if inferred:
                        logger.info(f"Inferred classification_backbone={inferred} from checkpoint keys")
                        self.classification_backbone = inferred

                # Build model with correct head size and load weights
                self.model = self.create_model()
                try:
                    # Determine source state_dict
                    if loaded_state_dict is not None:
                        sd_to_load = loaded_state_dict
                    else:
                        sd_to_load = checkpoint.get('model_state_dict') if checkpoint is not None else None

                    if sd_to_load is None:
                        logger.info('No model_state_dict found in checkpoint; using new model weights')
                    else:
                        # Partial safe-loading: keep only keys that exist in current model and have the same shape
                        model_sd = self.model.state_dict()
                        matched = {}
                        skipped = []
                        for k, v in sd_to_load.items():
                            if k in model_sd:
                                try:
                                    if hasattr(v, 'shape') and v.shape == model_sd[k].shape:
                                        matched[k] = v
                                    else:
                                        skipped.append(k)
                                except Exception:
                                    skipped.append(k)
                            else:
                                skipped.append(k)

                        # Update current state dict with matched tensors and load
                        model_sd.update(matched)
                        try:
                            self.model.load_state_dict(model_sd)
                            logger.info(f"Loaded {len(matched)} params from checkpoint; skipped {len(skipped)} incompatible params")
                        except Exception as e:
                            # As a last resort attempt non-strict load
                            logger.warning(f"load_state_dict failed, attempting non-strict load: {e}")
                            try:
                                # Prepare a dict with only matched keys for non-strict loading
                                self.model.load_state_dict(matched, strict=False)
                                logger.info(f"Non-strict load succeeded with {len(matched)} params")
                            except Exception as e2:
                                logger.error(f"Failed to load checkpoint parameters: {e2}")

                except RuntimeError as e:
                    # Fallback to non-strict load in case of other runtime issues
                    logger.warning(f"Non-strict state_dict load due to: {e}")
                    try:
                        if loaded_state_dict is not None:
                            self.model.load_state_dict(loaded_state_dict, strict=False)
                        else:
                            self.model.load_state_dict(checkpoint['model_state_dict'], strict=False)
                    except Exception as e2:
                        logger.error(f"Final fallback load also failed: {e2}")
                self.model.to(self.device)
                self.model.eval()
                
                # Ensure num_classes aligns with class_names length
                if self.class_names and self.num_classes != len(self.class_names):
                    self.num_classes = len(self.class_names)
                
                logger.info(f"Model loaded successfully with {self.num_classes} classes")
                return True
            else:
                logger.warning("No pretrained model found, creating new model")
                self.model = self.create_model()
                self.model.to(self.device)
                self.class_names = [f"class_{i}" for i in range(self.num_classes)]
                return False
                
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = self.create_model()
            self.model.to(self.device)
            self.class_names = [f"class_{i}" for i in range(self.num_classes)]
            return False
    
    async def predict(self, image: Image.Image) -> Dict[str, any]:
        """Predict disease/pest from image. Runs detector (if available) then classifier on crops.
        Returns structured JSON suitable to pass into SLM for reasoning."""
        try:
            # If detector is available, run detection and classify each crop
            if self.detector is not None:
                return await self.detect_and_classify(image)
            # Otherwise fallback to single-image classification
            return await self._classify_whole_image(image)
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                "predictions": [],
                "error": str(e),
                "model_info": {}
            }

    async def _classify_whole_image(self, image: Image.Image) -> Dict[str, any]:
        """Classify the entire image (no detection); keeps backwards compatibility."""
        try:
            if self.model is None:
                raise RuntimeError("No model loaded")
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
                predicted_class_idx = predicted.item()
                confidence_score = confidence.item()
                if predicted_class_idx < len(self.class_names):
                    predicted_class = self.class_names[predicted_class_idx]
                else:
                    self._load_class_names()
                    predicted_class = self.class_names[predicted_class_idx] if predicted_class_idx < len(self.class_names) else f"class_{predicted_class_idx}"
                top3_prob, top3_idx = torch.topk(probabilities, min(3, len(self.class_names)))
                top3_predictions = []
                for i in range(len(top3_idx[0])):
                    idx = top3_idx[0][i].item()
                    prob = top3_prob[0][i].item()
                    class_name = self.class_names[idx] if idx < len(self.class_names) else f"class_{idx}"
                    top3_predictions.append({"class": class_name, "confidence": float(prob)})
                return {
                    "predictions": [{
                        "label": predicted_class,
                        "leaf": predicted_class.split('_')[0] if '_' in predicted_class else predicted_class,
                        "condition": predicted_class.replace('_', ' '),
                        "confidence": float(confidence_score),
                        "bbox": None
                    }],
                    "top3_predictions": top3_predictions,
                    "model_info": {
                        "device": str(self.device),
                        "model_path": str(self.get_latest_model_path()),
                        "num_classes": len(self.class_names),
                        "classification_backbone": self.classification_backbone,
                        "detection_backbone": self.detection_backbone
                    }
                }
        except Exception as e:
            logger.error(f"Classification error: {e}")
            return {"predictions": [], "error": str(e)}

    async def detect_and_classify(self, image: Image.Image, score_threshold: float = 0.3) -> Dict[str, any]:
        """Run detector to get object boxes, crop and classify each region."""
        try:
            # Prepare image tensor for detector (use simple ToTensor)
            to_tensor = transforms.Compose([transforms.ToTensor()])
            img_t = to_tensor(image).to(self.device)
            # Detectors expect batch dimension
            with torch.no_grad():
                det_outputs = self.detector([img_t])
            # Fix tensor boolean evaluation error
            if det_outputs is None or (hasattr(det_outputs, '__len__') and len(det_outputs) == 0):
                return await self._classify_whole_image(image)
            det = det_outputs[0]
            # Normalize detector outputs; avoid boolean checks on tensors
            boxes = det.get('boxes', det.get('pred_boxes', None))
            if boxes is None:
                boxes_list = []
            elif torch.is_tensor(boxes):
                boxes_list = boxes.detach().cpu().numpy()
            else:
                boxes_list = boxes

            scores_val = det.get('scores', None)
            if scores_val is None:
                scores_list = []
            elif torch.is_tensor(scores_val):
                scores_list = scores_val.detach().cpu().numpy()
            else:
                scores_list = scores_val

            labels_val = det.get('labels', None)
            if labels_val is None:
                labels_list = []
            elif torch.is_tensor(labels_val):
                labels_list = labels_val.detach().cpu().numpy()
            else:
                labels_list = labels_val
            predictions = []
            for i, box in enumerate(boxes_list):
                score = float(scores_list[i]) if i < len(scores_list) else 0.0
                if score < score_threshold:
                    continue
                # box is tensor on device
                if torch.is_tensor(box):
                    x1, y1, x2, y2 = [int(float(v)) for v in box.detach().cpu().numpy()]
                else:
                    # box may already be a list/np array
                    x1, y1, x2, y2 = [int(float(v)) for v in list(box)]
                # Crop PIL image
                crop = image.crop((x1, y1, x2, y2))
                # Classify crop
                crop_result = await self._classify_whole_image(crop)
                pred = crop_result.get('predictions', [{}])[0]
                pred_entry = {
                    "label": pred.get('label', 'unknown'),
                    "leaf": pred.get('leaf', 'unknown'),
                    "condition": pred.get('condition', 'unknown'),
                    "confidence": pred.get('confidence', 0.0),
                    "bbox": [x1, y1, x2, y2],
                    "score": score,
                    "source": "detector+classifier"
                }
                predictions.append(pred_entry)
            # If no predictions passed threshold, fallback to whole-image
            if not predictions:
                return await self._classify_whole_image(image)
            return {
                "predictions": predictions,
                "top3_predictions": None,
                "model_info": {
                    "device": str(self.device),
                    "detector": self.detection_backbone,
                    "classification_backbone": self.classification_backbone,
                    "model_path": str(self.get_latest_model_path())
                }
            }
        except Exception as e:
            logger.error(f"Detect+Classify error: {e}")
            return await self._classify_whole_image(image)
    
    def get_model_info(self) -> Dict[str, any]:
        """Get current model information"""
        return {
            "model_path": str(self.get_latest_model_path()),
            "num_classes": len(self.class_names),
            "class_names": self.class_names.copy(),
            "device": str(self.device),
            "training_queue_size": len(self.training_queue),
            "current_version": self._get_current_version()
        }

    async def add_training_sample(self, image: Image.Image, label: str, user_provided: bool = False) -> Dict[str, any]:
        """Persist an incoming training sample (image) and enqueue it for future training.

        Stores images under model_dir/training/{label}/ with a timestamped filename and records
        minimal metadata. Returns a small dict with saved path and status.
        """
        try:
            # Sanitize label and ensure class exists
            safe_label = str(label).strip().replace(' ', '_') or 'unknown'
            label_dir = self.model_dir / 'training' / safe_label
            label_dir.mkdir(parents=True, exist_ok=True)

            # Create filename
            ts = int(datetime.utcnow().timestamp())
            # use a short hash to avoid collisions
            digest = hashlib.sha1(f"{ts}-{safe_label}".encode()).hexdigest()[:8]
            fname = label_dir / f"{safe_label}_{ts}_{digest}.jpg"

            # Save image as JPEG
            image.save(str(fname), format='JPEG', quality=90)

            # Update class names list if new
            if safe_label not in self.class_names:
                self.class_names.append(safe_label)
                self.num_classes = len(self.class_names)
                self._save_class_names()

            # Enqueue for training (store minimal record)
            sample_record = {
                'path': str(fname),
                'label': safe_label,
                'user_provided': bool(user_provided),
                'timestamp': ts
            }
            self.training_queue.append(sample_record)

            # Persist a small queue file for durability
            try:
                qfile = self.model_dir / 'training_queue.json'
                with open(qfile, 'w') as f:
                    json.dump(self.training_queue, f, indent=2)
            except Exception:
                logger.warning('Failed to persist training queue to disk')

            logger.info(f"Queued training sample {fname} as label={safe_label} (user_provided={user_provided})")
            return {'status': 'queued', 'path': str(fname), 'label': safe_label}
        except Exception as e:
            logger.error(f"Failed to add training sample: {e}")
            raise

    # ------- Training configuration management -------
    def get_training_config(self) -> Dict[str, any]:
        return {
            "min_samples_per_class": self.min_samples_per_class,
            "learning_rate": self.learning_rate,
            "batch_size": self.batch_size,
            "epochs": self.epochs,
            "early_stopping_patience": self.early_stopping_patience,
            "shuffle_each_epoch": self.shuffle_each_epoch,
            "weighted_loss": self.weighted_loss,
            "bias_correction": self.bias_correction,
            "save_best_only": self.save_best_only,
            "validation_split": self.validation_split
        }

    def update_training_config(self, **kwargs) -> Dict[str, any]:
        allowed = set(self.get_training_config().keys())
        updated = {}
        for k,v in kwargs.items():
            if k in allowed and v is not None:
                # Basic validation
                if k in {"min_samples_per_class", "batch_size", "epochs", "early_stopping_patience"}:
                    try:
                        iv = int(v)
                        if iv <= 0:
                            continue
                        setattr(self, k, iv)
                        updated[k] = iv
                    except Exception:
                        continue
                elif k == "learning_rate":
                    try:
                        fv = float(v)
                        if fv <= 0:
                            continue
                        setattr(self, k, fv)
                        updated[k] = fv
                    except Exception:
                        continue
                elif k == "validation_split":
                    try:
                        fv = float(v)
                        if fv < 0 or fv >= 0.9:
                            continue
                        setattr(self, k, fv)
                        updated[k] = fv
                    except Exception:
                        continue
                else:
                    setattr(self, k, v)
                    updated[k] = v
        if updated:
            self._save_training_config()
        return {"updated": updated, "current": self.get_training_config()}

    # ---- Config persistence helpers ----
    def _training_config_path(self) -> Path:
        return self.model_dir / "training_config.json"

    def _save_training_config(self):
        try:
            with open(self._training_config_path(), 'w') as f:
                json.dump(self.get_training_config(), f, indent=2)
        except Exception as e:
            logger.error(f"Failed saving training config: {e}")

    def _load_training_config(self):
        try:
            p = self._training_config_path()
            if p.exists():
                with open(p, 'r') as f:
                    cfg = json.load(f)
                for k,v in cfg.items():
                    if hasattr(self, k):
                        try:
                            setattr(self, k, v)
                        except Exception:
                            continue
                logger.info("Loaded persisted training config")
        except Exception as e:
            logger.error(f"Failed loading training config: {e}")

    def _get_current_version(self) -> int:
        """Return highest numeric version from files named plant_classifier_v{N}.pt"""
        files = list(self.model_dir.glob('plant_classifier_v*.pt'))
        if not files:
            return 0
        try:
            versions = [int(p.stem.split('_v')[-1]) for p in files]
            return max(versions)
        except Exception:
            return 0

    def _get_latest_detector_path(self) -> Optional[Path]:
        files = list(self.model_dir.glob('plant_detector_v*.pt'))
        if not files:
            base_detector = self.model_dir / 'plant_detector.pt'
            return base_detector if base_detector.exists() else None
        files.sort(key=lambda x: int(x.stem.split('_v')[-1]), reverse=True)
        return files[0]

    def _save_model(self, version: Optional[int] = None) -> Path:
        """Save classification model (and class metadata) as a versioned .pt file in model_dir."""
        try:
            if version is None:
                version = self._get_current_version() + 1
            fname = self.model_dir / f'plant_classifier_v{version}.pt'
            payload = {
                'model_state_dict': self.model.state_dict() if self.model is not None else {},
                'class_names': self.class_names,
                'num_classes': self.num_classes,
                'classification_backbone': self.classification_backbone,
                'version': version,
                'timestamp': datetime.utcnow().timestamp(),
                'device': str(self.device)
            }
            torch.save(payload, str(fname))
            logger.info(f"Saved classifier checkpoint: {fname}")
            return fname
        except Exception as e:
            logger.error(f"Failed to save classifier checkpoint: {e}")
            raise

    def _save_detector(self, version: Optional[int] = None) -> Optional[Path]:
        """Save detector state_dict to a versioned .pt file if detector is present."""
        try:
            if self.detector is None:
                logger.info("No detector to save")
                return None
            if version is None:
                version = self._get_current_version() + 1
            fname = self.model_dir / f'plant_detector_v{version}.pt'
            payload = {
                'detector_state_dict': self.detector.state_dict(),
                'detector_meta': {
                    'detector_name': self.detection_backbone,
                    'saved_at': datetime.utcnow().timestamp()
                }
            }
            torch.save(payload, str(fname))
            logger.info(f"Saved detector checkpoint: {fname}")
            return fname
        except Exception as e:
            logger.error(f"Failed to save detector checkpoint: {e}")
            return None

    def _load_latest_detector(self) -> bool:
        """Attempt to load a detector checkpoint if present (separate file or inside classifier checkpoint)."""
        try:
            # 1) Look for dedicated detector file
            dpath = self._get_latest_detector_path()
            if dpath and dpath.exists():
                logger.info(f"Loading detector from {dpath}")
                ck = torch.load(dpath, map_location=self.device)
                det_sd = ck.get('detector_state_dict') if isinstance(ck, dict) else None
                if det_sd is not None and self.detector is not None:
                    self.detector.load_state_dict(det_sd)
                    self.detector.to(self.device)
                    self.detector.eval()
                    logger.info("Detector loaded from dedicated file")
                    return True
            # 2) Check if classifier checkpoint contains a detector embedded
            model_path = self.get_latest_model_path()
            if model_path and model_path.exists():
                ck = torch.load(model_path, map_location=self.device)
                det_sd = ck.get('detector_state_dict') if isinstance(ck, dict) else None
                if det_sd is not None and self.detector is not None:
                    self.detector.load_state_dict(det_sd)
                    self.detector.to(self.device)
                    self.detector.eval()
                    logger.info("Detector loaded from classifier checkpoint")
                    return True
            logger.info("No detector checkpoint found to load")
            return False
        except Exception as e:
            logger.error(f"Failed to load detector checkpoint: {e}")
            return False

    def trigger_training(self, background: bool = True):
        """Trigger parallel training for classifier and detector.

        - Classifier training uses existing `scripts/train.py` and runs in background via ThreadPoolExecutor.
        - Detector training is best-effort: if a detection training dataset is present under
          `self.model_dir / 'detection_training'` it will attempt a short finetune using torchvision; otherwise
          it will log a placeholder and skip.

        This method schedules both tasks and returns immediately if `background=True`.
        """
        def _run_classifier_training():
            try:
                # Use subprocess to call the existing training script so we reuse the established pipeline
                import subprocess
                cfg_path = Path('training_config.json')
                cmd = ['python', str(Path('scripts') / 'train.py')]
                logger.info(f"Starting classifier training via subprocess: {' '.join(cmd)}")
                subprocess.run(cmd, check=True, cwd=str(Path.cwd()))
                logger.info('Classifier training subprocess finished')
            except Exception as e:
                logger.error(f'Classifier training failed: {e}')

        def _run_detector_training():
            try:
                det_dir = self.model_dir / 'detection_training'
                if not det_dir.exists() or not any(det_dir.iterdir()):
                    logger.info('No detection training data found; skipping detector training (placeholder)')
                    return
                # Minimal training loop placeholder for detector (1 epoch) - implement only if dataset provided
                logger.info('Starting minimal detector finetune (1 epoch)')
                import torchvision
                from torchvision.models.detection import fasterrcnn_resnet50_fpn
                from torch.utils.data import DataLoader
                # Build a tiny dataset assuming VOC-style folders per-class with full images and bbox annotations is complex.
                # For safety and to avoid silently mis-training, we skip real detector training here and recommend using
                # a proper detection training pipeline (MMDetection or a dedicated script).
                logger.info('Detector training placeholder: please run a dedicated detection training pipeline (MMDetection)')
            except Exception as e:
                logger.error(f'Detector training failed: {e}')

        # Submit both tasks to executor
        logger.info('Scheduling training tasks (classifier + detector)')
        if background:
            # allow executor to run two workers for parallelism
            try:
                # If current executor has only 1 worker, create a temporary one for parallel tasks
                from concurrent.futures import ThreadPoolExecutor
                executor = ThreadPoolExecutor(max_workers=2)
                executor.submit(_run_classifier_training)
                executor.submit(_run_detector_training)
                logger.info('Training tasks submitted')
            except Exception as e:
                logger.error(f'Failed to schedule training tasks: {e}')
        else:
            _run_classifier_training()
            _run_detector_training()

# Global classifier instance
        """If the latest classifier checkpoint contains an embedded detector_state_dict, split it into two files:
        - classifier-only: plant_classifier_v{N}.pt (model_state_dict + metadata)
        - detector-only: plant_detector_v{N}.pt (detector_state_dict + detector_meta)
        Returns tuple (classifier_path, detector_path) or (None, None) if nothing to split.
        """
        try:
            model_path = self.get_latest_model_path()
            if not model_path or not model_path.exists():
                logger.info('No latest classifier checkpoint to split')
                return None, None
            ck = torch.load(model_path, map_location='cpu')
            if not isinstance(ck, dict):
                logger.info('Checkpoint is not dict; nothing to split')
                return None, None
            if 'detector_state_dict' not in ck:
                logger.info('No embedded detector found in checkpoint')
                return None, None

            # Backup original
            backup = model_path.with_suffix('.merged_backup.pt')
            if not backup.exists():
                import shutil
                shutil.copy2(model_path, backup)
                logger.info(f'Backed up merged checkpoint to {backup}')

            # Determine version
            stem = model_path.stem
            version = 0
            if '_v' in stem:
                try:
                    version = int(stem.split('_v')[-1])
                except Exception:
                    version = self._get_current_version()
            else:
                version = self._get_current_version()

            # Save classifier-only (overwrite original filename)
            classifier_payload = {
                'model_state_dict': ck.get('model_state_dict', {}),
                'class_names': ck.get('class_names', []),
                'num_classes': ck.get('num_classes', self.num_classes),
                'version': version,
                'timestamp': ck.get('timestamp', datetime.utcnow().timestamp()),
                'device': ck.get('device', str(self.device))
            }
            classifier_path = self.model_dir / f'plant_classifier_v{version}.pt'
            torch.save(classifier_payload, str(classifier_path))
            logger.info(f'Saved classifier-only checkpoint to {classifier_path}')

            # Save detector-only
            detector_payload = {
                'detector_state_dict': ck.get('detector_state_dict'),
                'detector_meta': ck.get('detector_meta', {'detector_name': self.detection_backbone})
            }
            detector_path = self.model_dir / f'plant_detector_v{version}.pt'
            torch.save(detector_payload, str(detector_path))
            logger.info(f'Saved detector-only checkpoint to {detector_path}')

            return classifier_path, detector_path
        except Exception as e:
            logger.error(f'Failed to split embedded checkpoint: {e}')
            return None, None

# Global classifier instance
_classifier_instance = None

def get_classifier() -> PlantClassifier:
    """Get or create global classifier instance"""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = PlantClassifier()
    return _classifier_instance
