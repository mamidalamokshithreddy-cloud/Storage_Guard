from pathlib import Path
import joblib
import logging
from typing import Dict, Any, Optional, Union
from app.ml.data_loader import UltraHighAccuracyCropRecommendationSystem

logger = logging.getLogger(__name__)

class ProperUltraModel:
    """Ultra model with WORKING caching and correct ml/ path resolution."""

    def __init__(self, models_path: Optional[Union[str, Path]] = None, data_path: Optional[Union[str, Path]] = None, use_gpu: bool = True):
        base_dir = Path(__file__).parent  # <repo>/AgriHub-backend/ml
        # Resolve relative paths against the ml/ package so './models' -> ml/models
        def _resolve(p: Union[str, Path], default: Path) -> Path:
            if p is None:
                return default
            pth = Path(p)
            return pth if pth.is_absolute() else (base_dir / pth)

        # Default to ml/models and ml/data inside this package
        self.model_path = _resolve(models_path, base_dir / "models")
        self.data_path = _resolve(data_path, base_dir / "data")
        self.use_gpu = use_gpu  # Store GPU preference

        # Debug logging
        logger.info(f"🔍 ProperUltraModel initialized:")
        logger.info(f"🔍   base_dir: {base_dir}")
        logger.info(f"🔍   model_path: {self.model_path}")
        logger.info(f"🔍   data_path: {self.data_path}")
        logger.info(f"🔍   data_path exists: {self.data_path.exists()}")

        self.model_path.mkdir(parents=True, exist_ok=True)

        self.ultra_cache_file = self.model_path / "ultra_complete_system.pkl"

        self.recommendation_system = None
        self.is_trained = False
    
    def force_retrain(self) -> Dict[str, Any]:
        """Force retrain by clearing cache and training fresh models."""
        logger.info("🔄 Forcing model retraining by clearing cache...")
        
        # Remove cached model if it exists
        if self.ultra_cache_file.exists():
            try:
                self.ultra_cache_file.unlink()
                logger.info("🗑️ Cleared cached model file")
            except Exception as e:
                logger.warning(f"Failed to remove cache file: {e}")
        
        # Clear in-memory model
        self.recommendation_system = None
        self.is_trained = False
        
        # Train fresh model
        return self.train()
    
    def train(self) -> Dict[str, Any]:
        """Train ultra system with PROPER caching."""
        
        # Check for cached model FIRST
        if self.ultra_cache_file.exists():
            try:
                logger.info("🚀 Loading cached Ultra model (skip 5-7 min training)...")
                
                # Load complete system
                cached_data = joblib.load(self.ultra_cache_file)
                self.recommendation_system = cached_data
                self.is_trained = True
                
                metrics = self.recommendation_system.model_metrics
                logger.info(f"✅ Ultra model loaded: {metrics['test_accuracy']:.4f} accuracy")
                
                return {
                    "accuracy": metrics['test_accuracy'],
                    "cv_mean": metrics['cv_mean'],
                    "cv_std": metrics['cv_std'],
                    "test_accuracy": metrics['test_accuracy'],
                    "model_type": "ultra_5_model_ensemble"
                }
                
            except Exception as e:
                logger.error(f"Failed to load cached model: {e}")
                logger.info("Will retrain ultra model...")
        
        # Train new ultra system
        logger.info("🚀 Training NEW Ultra model (2-5 minutes with 5-model ensemble)...")
        logger.info("⏱️  This is a ONE-TIME training - subsequent requests will be instant!")
        logger.info(f"🎮 GPU acceleration: {'Enabled' if self.use_gpu else 'Disabled'}")

        # Use the resolved ml/data directory
        self.recommendation_system = UltraHighAccuracyCropRecommendationSystem(str(self.data_path))
        success = self.recommendation_system.initialize()

        if not success:
            raise Exception("Ultra model training failed")

        # Save complete system
        try:
            logger.info("💾 Saving Ultra model for future use...")
            joblib.dump(self.recommendation_system, self.ultra_cache_file)
            logger.info("✅ Ultra model cached successfully!")
        except Exception as e:
            logger.error(f"Failed to cache model: {e}")

        self.is_trained = True
        metrics = self.recommendation_system.model_metrics

        logger.info(f"🎉 Ultra training complete: {metrics['test_accuracy']:.4f} accuracy")
        return {
            "accuracy": metrics['test_accuracy'],
            "cv_mean": metrics['cv_mean'],
            "cv_std": metrics['cv_std'],
            "test_accuracy": metrics['test_accuracy'],
            "model_type": "ultra_5_model_ensemble"
        }
    
    def predict(self, input_data: Dict[str, float], top_k: int = 5, market_data: Dict = None) -> Dict[str, Any]:
        """Prediction with agricultural intelligence.

        Accepts optional `market_data` and forwards it to the underlying
        recommendation system if supported. Falls back to older signatures
        if the underlying method does not accept the keyword.
        """
        if not self.is_trained:
            self.train()

        # Prefer the tolerance-aware predictor if available and forward market_data
        if hasattr(self.recommendation_system, 'predict_with_tolerance'):
            try:
                return self.recommendation_system.predict_with_tolerance(input_data, top_k, market_data)
            except TypeError:
                # Underlying implementation might not accept market_data keyword
                return self.recommendation_system.predict_with_tolerance(input_data, top_k)
        else:
            try:
                return self.recommendation_system.predict(input_data, top_k, market_data)
            except TypeError:
                return self.recommendation_system.predict(input_data, top_k)

# Use the proper ultra model
DynamicCropRecommendationModel = ProperUltraModel
EnhancedDynamicCropRecommendationModel = ProperUltraModel
