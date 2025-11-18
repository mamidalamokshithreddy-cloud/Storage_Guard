import logging
from typing import Dict, Any
from app.agents.base_agent import BaseAgent, AgentResponse
from app.ml.ultra_models import DynamicCropRecommendationModel

logger = logging.getLogger(__name__)

class DynamicMLAgent(BaseAgent):
    """ML Agent with proper input handling."""
    
    def __init__(self, model_path: str, data_path: str, use_gpu: bool = True):
        self.model_path = model_path
        self.data_path = data_path
        self.use_gpu = use_gpu
        self.model = DynamicCropRecommendationModel(model_path, data_path, use_gpu=use_gpu)
        logger.info(f"DynamicMLAgent initialized with model_path: {model_path}, use_gpu: {use_gpu}")
    
    async def execute(self, request_data: Dict[str, Any]) -> AgentResponse:
        """Execute ML prediction with comprehensive debugging."""
        try:
            logger.info("🚀 ML Agent: Starting execution...")
            logger.info(f"📥 Received request_data: {request_data}")
            
            # Train/load model
            metrics = self.model.train()
            logger.info(f"✅ Model loaded. Accuracy: {metrics.get('accuracy', 0)}")
            
            # Extract features
            features = self._extract_features_properly(request_data)
            logger.info(f"🎯 Extracted features for prediction: {features}")
            
            # Get market data for prediction
            market_insights = request_data.get("market_insights", {})
            market_data_for_prediction = self._prepare_market_data_for_prediction(market_insights)
            
            # Make prediction with market data
            logger.info("🔮 Making market-integrated prediction...")
            prediction_result = self.model.predict(features, top_k=5, market_data=market_data_for_prediction)
            logger.info(f"📊 Market-integrated prediction result: {prediction_result}")
            
            # Check prediction quality
            primary_crop = prediction_result.get("primary_recommendation", "Unknown")
            primary_confidence = prediction_result.get("primary_confidence", 0)
            
            logger.info(f"🎯 Primary prediction: {primary_crop} (confidence: {primary_confidence})")
            
            if primary_crop == "Unknown" or primary_confidence == 0:
                logger.error("🚨 PREDICTION FAILED - Getting Unknown/0 confidence!")
                logger.error(f"Full prediction result: {prediction_result}")
            
            # Prepare response
            response_data = {
                "prediction": prediction_result,
                "model_metrics": metrics,
                "features_used": features,
                "timestamp": self._get_timestamp(),
                "debug_info": {
                    "primary_crop": primary_crop,
                    "primary_confidence": primary_confidence,
                    "prediction_successful": primary_crop != "Unknown" and primary_confidence > 0
                }
            }
            
            return AgentResponse(
                status="success",
                message="ML prediction completed",
                data=response_data
            )
            
        except Exception as e:
            logger.error(f"🚨 ML Agent execution failed: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            return AgentResponse(
                status="error",
                message=f"ML prediction failed: {str(e)}",
                data={"error": str(e)}
            )

    def _extract_features_properly(self, request_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract features with comprehensive key mapping."""
        features = {}
        
        # ✅ COMPREHENSIVE feature mapping
        feature_mappings = {
            'nitrogen': ['nitrogen', 'n', 'N'],
            'phosphorus': ['phosphorus', 'p', 'P'], 
            'potassium': ['potassium', 'k', 'K'],
            'temperature': ['temperature', 'temp', 'Temperature'],
            'humidity': ['humidity', 'humid', 'Humidity'],
            'ph': ['ph', 'pH', 'PH'],
            'rainfall': ['rainfall', 'rain', 'Rainfall']
        }
        
        logger.info(f"🔍 Processing request data keys: {list(request_data.keys())}")
        
        for standard_name, possible_keys in feature_mappings.items():
            value = None
            found_key = None
            
            # Search for the value in all possible keys
            for key in possible_keys:
                if key in request_data and request_data[key] is not None:
                    value = float(request_data[key])
                    found_key = key
                    break
            
            if value is not None:
                features[standard_name] = value
                logger.info(f"✅ Found {standard_name}: {value} (from key: {found_key})")
            else:
                # Use reasonable defaults
                defaults = {
                    'nitrogen': 40,
                    'phosphorus': 30, 
                    'potassium': 20,
                    'temperature': 25,
                    'humidity': 60,
                    'ph': 6.5,
                    'rainfall': 100
                }
                features[standard_name] = defaults[standard_name]
                logger.warning(f"⚠️ Using default for {standard_name}: {defaults[standard_name]}")
        
        return features
    
    def _prepare_market_data_for_prediction(self, market_insights: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare market data for ML prediction."""
        try:
            if not market_insights or not market_insights.get("market_data"):
                logger.warning("No market insights available, using default values")
                return {
                    "current_price": 2000,
                    "price_trend": "stable",
                    "profitability": {"profitability_score": 0.5}
                }
            
            # Get market data for the most profitable crop
            market_data = market_insights.get("market_data", {})
            best_crop = None
            best_profitability = 0
            
            for crop, data in market_data.items():
                profitability = data.get("profitability", {})
                profit_score = profitability.get("profitability_score", 0)
                if profit_score > best_profitability:
                    best_profitability = profit_score
                    best_crop = crop
            
            if best_crop and best_crop in market_data:
                crop_data = market_data[best_crop]
                market_info = crop_data.get("market_data", {})
                profitability_info = crop_data.get("profitability", {})
                
                return {
                    "current_price": market_info.get("current_price", 2000),
                    "price_trend": market_info.get("price_trend", "stable"),
                    "profitability": profitability_info
                }
            else:
                # Use average market data
                all_prices = []
                all_trends = []
                all_profits = []

                for crop, data in market_data.items():
                    market_info = data.get("market_data", {})
                    profitability_info = data.get("profitability", {})

                    # Only include numeric prices
                    mp = market_info.get("current_price")
                    if mp is not None and isinstance(mp, (int, float)) and mp > 0:
                        all_prices.append(mp)

                    pt = market_info.get("price_trend")
                    if pt:
                        all_trends.append(pt)

                    if profitability_info.get("profitability_score", 0) > 0:
                        all_profits.append(profitability_info["profitability_score"])

                avg_price = sum(all_prices) / len(all_prices) if all_prices else 2000
                most_common_trend = max(set(all_trends), key=all_trends.count) if all_trends else "stable"
                avg_profit = sum(all_profits) / len(all_profits) if all_profits else 0.5

                return {
                    "current_price": avg_price,
                    "price_trend": most_common_trend,
                    "profitability": {"profitability_score": avg_profit}
                }
                
        except Exception as e:
            logger.error(f"Error preparing market data: {e}")
            return {
                "current_price": 2000,
                "price_trend": "stable", 
                "profitability": {"profitability_score": 0.5}
            }
    
    async def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        try:
            if hasattr(self.model, 'recommendation_system') and self.model.recommendation_system:
                metrics = self.model.recommendation_system.model_metrics
                return {
                    "model_type": "Ultra High Accuracy Ensemble",
                    "accuracy": metrics.get('test_accuracy', 0),
                    "algorithms": ["Random Forest", "Extra Trees", "Gradient Boosting", "SVM", "Neural Network"],
                    "status": "trained"
                }
            else:
                return {
                    "model_type": "Ultra High Accuracy Ensemble", 
                    "status": "not_trained"
                }
        except Exception as e:
            return {
                "model_type": "Ultra High Accuracy Ensemble",
                "status": "error",
                "error": str(e)
            }
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()
