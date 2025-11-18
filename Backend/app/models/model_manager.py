

import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
import json

from app.core.config import settings, ENABLE_MODEL_LOADING

logger = logging.getLogger(__name__)

# Try to import inference engine, fallback to mock if dependencies missing
try:
    from app.models.infer import create_inference_engine, ModelInference
    INFERENCE_AVAILABLE = True
except (ImportError, RuntimeError) as e:
    logger.warning(f"Inference engine not available: {e}. Using mock implementation.")
    create_inference_engine = None
    ModelInference = None
    INFERENCE_AVAILABLE = False


class ModelManager:
    """
    Centralized manager for ML models
    """
    
    def __init__(self):
        """Initialize model manager"""
        self.models: Dict[str, Any] = {}
        self.model_configs: Dict[str, Dict[str, Any]] = {}
        self.is_loaded = False
        
        # Default model paths (can be overridden by config)
        self.models_dir = settings.MODEL_DIR
        self.weights_dir = settings.MODEL_DIR / "weights"
        self.config_file = settings.MODEL_DIR / "model_metadata.json"
        
    async def load_models(self):
        """Load all available models"""
        if not ENABLE_MODEL_LOADING:
            logger.info("📋 Model loading disabled via ENABLE_MODEL_LOADING=False")
            return
            
        if not INFERENCE_AVAILABLE:
            logger.warning("⚠️ Inference engine not available - skipping model loading")
            return
            
        try:
            logger.info("🚀 Starting model loading process")
            
            # Ensure directories exist
            self.models_dir.mkdir(exist_ok=True)
            self.weights_dir.mkdir(exist_ok=True)
            
            # Load model configurations
            await self._load_model_configs()
            
            # Load individual models
            for model_name, config in self.model_configs.items():
                try:
                    await self._load_single_model(model_name, config)
                except Exception as e:
                    logger.error(f"Failed to load model {model_name}: {e}")
                    # Continue loading other models
            
            if self.models:
                self.is_loaded = True
                logger.info(f"✅ Model loading completed. Loaded {len(self.models)} models")
            else:
                logger.warning("⚠️ No models loaded successfully")
            
        except Exception as e:
            logger.error(f"Model loading process failed: {e}")
            raise
    
    async def _load_model_configs(self):
        """Load model configuration from file or create default"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    self.model_configs = json.load(f)
                logger.info(f"📋 Loaded model configs from {self.config_file}")
            except Exception as e:
                logger.warning(f"Failed to load model config file: {e}")
                self.model_configs = self._get_default_configs()
        else:
            logger.info("📋 No model config file found, using defaults")
            self.model_configs = self._get_default_configs()
            
            # Save default config for future use
            try:
                with open(self.config_file, 'w') as f:
                    json.dump(self.model_configs, f, indent=2)
                logger.info(f"💾 Saved default config to {self.config_file}")
            except Exception as e:
                logger.warning(f"Failed to save default config: {e}")
    
    def _get_default_configs(self) -> Dict[str, Dict[str, Any]]:
        """Get default model configurations"""
        return {
            "pest_classifier": {
                "model_type": "classification",
                "model_path": str(self.weights_dir / "pest_classifier.onnx"),
                "label_map_path": str(self.models_dir / "pest_labels.json"),
                "calibration_path": str(self.models_dir / "pest_calibration.json"),
                "enabled": True,
                "description": "Main pest and disease classification model"
            },
            "disease_detector": {
                "model_type": "detection",
                "model_path": str(self.weights_dir / "disease_detector.onnx"),
                "label_map_path": str(self.models_dir / "disease_labels.json"),
                "calibration_path": str(self.models_dir / "disease_calibration.json"),
                "confidence_threshold": 0.5,
                "nms_threshold": 0.4,
                "enabled": True,  # Optional detection model
                "description": "Disease detection and localization model"
            }
        }
    
    async def _load_single_model(self, model_name: str, config: Dict[str, Any]):
        """Load a single model"""
        if not config.get("enabled", True):
            logger.info(f"⏭️ Skipping disabled model: {model_name}")
            return
        
        model_path = config["model_path"]
        if not Path(model_path).exists():
            logger.warning(f"❌ Model file not found: {model_path}")
            await self._create_placeholder_files(model_name, config)
            return
        
        try:
            # Create inference engine
            inference_kwargs = {
                "model_path": config["model_path"],
                "label_map_path": config["label_map_path"],
                "calibration_path": config.get("calibration_path")
            }
            
            # Add detection-specific parameters
            if config.get("model_type") == "detection":
                inference_kwargs.update({
                    "confidence_threshold": config.get("confidence_threshold", 0.5),
                    "nms_threshold": config.get("nms_threshold", 0.4)
                })
            
            model = create_inference_engine(
                model_type=config.get("model_type", "classification"),
                **inference_kwargs
            )
            
            # Test the model with a simple inference (if possible)
            # This will catch loading errors early
            
            self.models[model_name] = model
            logger.info(f"✅ Loaded model: {model_name}")
            
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            raise
    
    async def _create_placeholder_files(self, model_name: str, config: Dict[str, Any]):
        """Create placeholder files for missing models"""
        logger.info(f"📝 Creating placeholder files for {model_name}")
        
        # Create placeholder label map
        label_map_path = Path(config["label_map_path"])
        if not label_map_path.exists():
            placeholder_labels = {
                "0": "healthy",
                "1": "bacterial_blight",
                "2": "fungal_disease",
                "3": "viral_disease", 
                "4": "pest_damage",
                "5": "nutrient_deficiency",
                "6": "other_stress"
            }
            
            try:
                label_map_path.parent.mkdir(parents=True, exist_ok=True)
                with open(label_map_path, 'w') as f:
                    json.dump(placeholder_labels, f, indent=2)
                logger.info(f"📋 Created placeholder label map: {label_map_path}")
            except Exception as e:
                logger.warning(f"Failed to create placeholder label map: {e}")
        
        # Create placeholder calibration file
        calibration_path = config.get("calibration_path")
        if calibration_path and not Path(calibration_path).exists():
            placeholder_calibration = {
                "temperature": 1.0,
                "description": "Placeholder calibration - no scaling applied"
            }
            
            try:
                with open(calibration_path, 'w') as f:
                    json.dump(placeholder_calibration, f, indent=2)
                logger.info(f"🎯 Created placeholder calibration: {calibration_path}")
            except Exception as e:
                logger.warning(f"Failed to create placeholder calibration: {e}")

    def get_model(self, model_name: str = "pest_classifier") -> Optional[Any]:
        """Get a loaded model by name"""
        return self.models.get(model_name)
    
    def get_primary_model(self) -> Optional[Any]:
        """Get the primary classification model"""
        # Try to get the main pest classifier
        model = self.get_model("pest_classifier")
        if model:
            return model
        
        # Fall back to any available model
        if self.models:
            return list(self.models.values())[0]
        
        return None
    
    def get_detection_model(self) -> Optional[Any]:
        """Get the detection model if available"""
        return self.get_model("disease_detector")
    
    def list_models(self) -> Dict[str, Dict[str, Any]]:
        """List all available models and their status"""
        model_status = {}
        
        for name, config in self.model_configs.items():
            model_status[name] = {
                "config": config,
                "loaded": name in self.models,
                "model_file_exists": Path(config["model_path"]).exists(),
                "label_file_exists": Path(config["label_map_path"]).exists()
            }
        
        return model_status
    
    def get_performance_stats(self) -> Dict[str, Dict[str, float]]:
        """Get performance statistics for all loaded models"""
        stats = {}
        
        for name, model in self.models.items():
            stats[name] = model.get_performance_stats()
        
        return stats
    
    async def reload_model(self, model_name: str):
        """Reload a specific model"""
        if model_name not in self.model_configs:
            raise ValueError(f"Unknown model: {model_name}")
        
        # Remove existing model
        if model_name in self.models:
            del self.models[model_name]
        
        # Reload
        await self._load_single_model(model_name, self.model_configs[model_name])
        logger.info(f"🔄 Reloaded model: {model_name}")
    
    async def unload_model(self, model_name: str):
        """Unload a specific model to free memory"""
        if model_name in self.models:
            del self.models[model_name]
            logger.info(f"🗑️ Unloaded model: {model_name}")
    
    def is_ready(self) -> bool:
        """Check if at least one model is loaded and ready"""
        return self.is_loaded and len(self.models) > 0


# Global model manager instance
_model_manager = None


async def get_model_manager() -> ModelManager:
    """Get the global model manager instance"""
    global _model_manager
    
    if _model_manager is None:
        _model_manager = ModelManager()
        await _model_manager.load_models()
    
    return _model_manager


def get_model_manager_sync() -> ModelManager:
    """Get the global model manager instance (synchronous)"""
    global _model_manager
    
    if _model_manager is None:
        raise RuntimeError("Model manager not initialized. Call get_model_manager() first.")
    
    return _model_manager
