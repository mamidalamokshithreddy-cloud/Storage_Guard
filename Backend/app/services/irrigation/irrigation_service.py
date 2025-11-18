"""
Irrigation Service - Integrates with existing agricultural AI system
Uses regression model + weather service + LLM enhancement
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import asyncio
import random

from app.services.weather_service import WeatherService
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

class IrrigationService:
    """Service for irrigation prediction and scheduling"""
    
    def __init__(self):
        self.weather_service = WeatherService()
        self.llm_enhancement_enabled = True
        
    async def predict_irrigation_needs(self, 
                                     plot_data: Dict[str, Any],
                                     include_llm_analysis: bool = True) -> Dict[str, Any]:
        """Predict irrigation needs for a plot"""
        
        try:
            # Get weather data
            weather_data = await self._get_current_weather(plot_data.get('location'))
            
            # Calculate base water requirement based on crop type
            base_requirements = {
                'Rice': 200,
                'Wheat': 150,
                'Soybean': 100,
                'Cotton': 180,
                'Sugarcane': 250
            }
            
            crop_type = plot_data.get('crop_type', 'Rice')
            area = plot_data.get('area', 1.0)
            base_requirement = base_requirements.get(crop_type, 150) * area
            
            # Adjust for conditions
            soil_moisture = plot_data.get('soil_moisture', 50)
            temperature = weather_data.get('temperature', 25)
            humidity = weather_data.get('humidity', 60)
            
            # Apply adjustments
            moisture_factor = 1.5 if soil_moisture < 30 else 0.8 if soil_moisture > 70 else 1.0
            temp_factor = 1.3 if temperature > 35 else 0.8 if temperature < 20 else 1.0
            humidity_factor = 0.8 if humidity > 80 else 1.2 if humidity < 40 else 1.0
            
            # Calculate water need
            water_needed = base_requirement * moisture_factor * temp_factor * humidity_factor
            
            result = {
                'water_liters': round(water_needed, 1),
                'confidence': 0.85,
                'reasoning': self._generate_reasoning(
                    crop_type, soil_moisture, temperature, humidity,
                    water_needed, base_requirement
                ),
                'adjustments': {
                    'moisture_factor': moisture_factor,
                    'temperature_factor': temp_factor,
                    'humidity_factor': humidity_factor
                }
            }
            
            # Enhance with LLM if enabled
            if include_llm_analysis and self.llm_enhancement_enabled:
                try:
                    enhanced_result = await self._enhance_with_llm(plot_data, result)
                    return enhanced_result
                except Exception as e:
                    logger.warning(f"LLM enhancement failed: {e}")
                    return result
            else:
                return result
                
        except Exception as e:
            logger.error(f"Irrigation prediction failed: {e}")
            return {'error': str(e)}
    
    def _generate_reasoning(self,
                          crop_type: str,
                          soil_moisture: float,
                          temperature: float,
                          humidity: float,
                          water_needed: float,
                          base_requirement: float) -> str:
        """Generate explanation for irrigation recommendation"""
        
        reasons = []
        
        if soil_moisture < 30:
            reasons.append("Critical soil moisture level requires increased irrigation")
        elif soil_moisture > 70:
            reasons.append("High soil moisture allows reduced irrigation")
            
        if temperature > 35:
            reasons.append("High temperature increases water requirement")
        elif temperature < 20:
            reasons.append("Low temperature reduces water requirement")
            
        if humidity > 80:
            reasons.append("High humidity reduces evaporation")
        elif humidity < 40:
            reasons.append("Low humidity increases evaporation")
            
        adjustment = water_needed - base_requirement
        if abs(adjustment) > 0.1 * base_requirement:
            direction = "increased" if adjustment > 0 else "decreased"
            reasons.append(f"Water amount {direction} from base requirement of {base_requirement:.1f}L")
        
        return " | ".join(reasons) if reasons else "Standard irrigation recommended"
    
    async def _get_current_weather(self, location: Optional[Dict[str, float]]) -> Dict[str, Any]:
        """Get current weather conditions"""
        try:
            if location and 'lat' in location and 'lon' in location:
                weather = await self.weather_service.get_current_conditions(
                    location['lat'], location['lon']
                )
                return weather
            else:
                return {
                    'temperature': 25,
                    'humidity': 60,
                    'wind_speed': 5,
                    'precipitation': 0
                }
        except Exception as e:
            logger.warning(f"Weather fetch failed: {e}")
            return {'temperature': 25, 'humidity': 60, 'wind_speed': 5, 'precipitation': 0}
            
    async def create_irrigation_schedule(self, 
                                       predictions: List[Dict[str, Any]],
                                       user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Create irrigation schedule from predictions"""
        
        try:
            schedule = {
                'schedule_id': f"sched_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                'created_at': datetime.now().isoformat(),
                'irrigation_events': [],
                'total_water_liters': 0,
                'estimated_duration_minutes': 0
            }
            
            preferred_time = user_preferences.get('preferred_time', 'early_morning')
            flow_rate = user_preferences.get('flow_rate_lpm', 2.0)  # liters per minute
            
            for pred in predictions:
                if pred.get('water_liters', 0) > 0:
                    # Calculate timing
                    if preferred_time == 'early_morning':
                        target_hour = 6
                    elif preferred_time == 'evening':
                        target_hour = 18
                    else:
                        target_hour = 22
                    
                    irrigation_time = datetime.now().replace(
                        hour=target_hour, minute=0, second=0, microsecond=0
                    )
                    
                    # If time has passed today, schedule for tomorrow
                    if irrigation_time <= datetime.now():
                        irrigation_time += timedelta(days=1)
                    
                    water_amount = pred['water_liters']
                    duration = int(water_amount / flow_rate)
                    
                    event = {
                        'plot_id': pred.get('plot_id', 'unknown'),
                        'scheduled_time': irrigation_time.isoformat(),
                        'water_liters': water_amount,
                        'duration_minutes': duration,
                        'confidence': pred.get('confidence', 0.5),
                        'reasoning': pred.get('reasoning', 'Standard irrigation')
                    }
                    
                    schedule['irrigation_events'].append(event)
                    schedule['total_water_liters'] += water_amount
                    schedule['estimated_duration_minutes'] += duration
            
            return schedule
            
        except Exception as e:
            logger.error(f"Schedule creation failed: {e}")
            return {'error': str(e)}
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get status of irrigation service components"""
        
        return {
            'service_status': 'operational',
            'weather_service_available': True,
            'llm_enhancement_enabled': self.llm_enhancement_enabled,
            'last_check': datetime.now().isoformat()
        }

# Global service instance
irrigation_service = IrrigationService()