"""
Simple Irrigation Regression Model
Uses existing scikit-learn infrastructure to predict water needs
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
from typing import Dict, Any, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class IrrigationRegressor:
    """Simple irrigation prediction using regression"""
    
    def __init__(self, model_type: str = "random_forest"):
        self.model_type = model_type
        self.model = None
        self.is_trained = False
        
        # Simple feature set that we can reliably calculate
        self.features = [
            'soil_moisture_percent',
            'temperature_celsius', 
            'humidity_percent',
            'days_since_planting',
            'crop_stage_numeric'  # 1-5 scale
        ]
        
    def prepare_training_data(self, historical_data: list) -> tuple:
        """Convert historical irrigation data to training format"""
        try:
            df = pd.DataFrame(historical_data)
            
            # Feature engineering
            X = df[self.features].fillna(0)
            y = df['water_used_liters'].fillna(0)
            
            return X.values, y.values
            
        except Exception as e:
            logger.error(f"Data preparation failed: {e}")
            return np.array([]), np.array([])
    
    def train(self, historical_data: list) -> Dict[str, Any]:
        """Train the irrigation prediction model"""
        
        try:
            X, y = self.prepare_training_data(historical_data)
            
            if len(X) == 0 or len(y) == 0:
                logger.warning("No training data available")
                return {'status': 'failed', 'reason': 'No training data'}
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Initialize model
            if self.model_type == "random_forest":
                self.model = RandomForestRegressor(
                    n_estimators=100,
                    random_state=42,
                    n_jobs=-1
                )
            else:
                self.model = LinearRegression()
            
            # Train
            self.model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            self.is_trained = True
            
            return {
                'status': 'success',
                'mse': float(mse),
                'r2_score': float(r2),
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            return {'status': 'failed', 'reason': str(e)}
    
    def predict(self, conditions: Dict[str, Any]) -> Dict[str, Any]:
        """Predict irrigation water needs"""
        
        try:
            if not self.is_trained:
                # Use simple heuristic if model not trained
                return self._fallback_prediction(conditions)
            
            # Prepare input
            features = self._conditions_to_features(conditions)
            X = np.array([features])
            
            # Make prediction
            water_liters = self.model.predict(X)[0]
            
            # Post-process prediction
            water_liters = max(0, water_liters)  # No negative water
            
            # Calculate confidence based on feature reasonableness
            confidence = self._calculate_confidence(conditions, water_liters)
            
            # Generate reasoning
            reasoning = self._generate_reasoning(conditions, water_liters)
            
            return {
                'water_liters': float(water_liters),
                'confidence': float(confidence),
                'reasoning': reasoning,
                'method': f'{self.model_type}_regression'
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return self._fallback_prediction(conditions)
    
    def _conditions_to_features(self, conditions: Dict[str, Any]) -> list:
        """Convert conditions to feature vector"""
        
        # Map crop stage to numeric
        stage_map = {
            'seedling': 1, 'vegetative': 2, 'flowering': 3, 
            'fruiting': 4, 'maturity': 5
        }
        
        features = [
            float(conditions.get('soil_moisture', 50)),
            float(conditions.get('temperature', 25)),
            float(conditions.get('humidity', 60)),
            float(conditions.get('days_since_planting', 30)),
            float(stage_map.get(conditions.get('crop_stage', 'vegetative'), 2))
        ]
        
        return features
    
    def _fallback_prediction(self, conditions: Dict[str, Any]) -> Dict[str, Any]:
        """Simple heuristic when ML model not available"""
        
        soil_moisture = conditions.get('soil_moisture', 50)
        temperature = conditions.get('temperature', 25)
        stage = conditions.get('crop_stage', 'vegetative')
        
        # Simple rules
        base_water = 5  # Base 5 liters
        
        # Adjust for soil moisture
        if soil_moisture < 30:
            moisture_factor = 2.0
        elif soil_moisture < 50:
            moisture_factor = 1.5
        else:
            moisture_factor = 1.0
        
        # Adjust for temperature
        if temperature > 30:
            temp_factor = 1.5
        elif temperature > 25:
            temp_factor = 1.2
        else:
            temp_factor = 1.0
        
        # Adjust for crop stage
        stage_factors = {
            'seedling': 0.5, 'vegetative': 1.0, 'flowering': 1.3,
            'fruiting': 1.2, 'maturity': 0.8
        }
        stage_factor = stage_factors.get(stage, 1.0)
        
        water_needed = base_water * moisture_factor * temp_factor * stage_factor
        
        return {
            'water_liters': float(water_needed),
            'confidence': 0.6,  # Medium confidence for heuristic
            'reasoning': f"Heuristic based on moisture ({soil_moisture}%), temp ({temperature}°C), stage ({stage})",
            'method': 'heuristic_fallback'
        }
    
    def _calculate_confidence(self, conditions: Dict[str, Any], 
                            prediction: float) -> float:
        """Calculate confidence in prediction"""
        
        confidence = 0.8  # Base confidence
        
        # Reduce confidence for extreme values
        soil_moisture = conditions.get('soil_moisture', 50)
        if soil_moisture < 10 or soil_moisture > 90:
            confidence -= 0.2
        
        temperature = conditions.get('temperature', 25)
        if temperature < 5 or temperature > 45:
            confidence -= 0.2
        
        # Reduce confidence for extreme predictions
        if prediction > 50:  # Very high water need
            confidence -= 0.1
        elif prediction < 0.1:  # Very low water need
            confidence -= 0.1
        
        return max(0.1, confidence)
    
    def _generate_reasoning(self, conditions: Dict[str, Any], 
                          prediction: float) -> str:
        """Generate explanation for prediction"""
        
        reasons = []
        
        soil_moisture = conditions.get('soil_moisture', 50)
        if soil_moisture < 30:
            reasons.append("Low soil moisture detected")
        elif soil_moisture > 70:
            reasons.append("High soil moisture detected")
        
        temperature = conditions.get('temperature', 25)
        if temperature > 30:
            reasons.append("High temperature increases water need")
        elif temperature < 15:
            reasons.append("Cool temperature reduces water need")
        
        stage = conditions.get('crop_stage', 'vegetative')
        if stage in ['flowering', 'fruiting']:
            reasons.append("Critical growth stage requires adequate water")
        
        if prediction > 20:
            reasons.append("High water requirement predicted")
        elif prediction < 2:
            reasons.append("Minimal watering needed")
        
        return " | ".join(reasons) if reasons else "Standard irrigation recommended"

# Global instance
irrigation_regressor = IrrigationRegressor()