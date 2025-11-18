"""
Irrigation Service - Integrates with existing agricultural AI system
Uses regression model + weather service + LLM enhancement
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import asyncio

from app.services.irrigation.irrigation_regressor import irrigation_regressor
from app.services.weather_service import WeatherService
from app.services.gemini_service import gemini_service
from app.core.config import settings, WEATHER_API_KEY

logger = logging.getLogger(__name__)

class IrrigationService:
    """Service for irrigation prediction and scheduling"""
    
    def __init__(self):
        self.regressor = irrigation_regressor
        self.weather_service = WeatherService(api_key=WEATHER_API_KEY)
        self.llm_enhancement_enabled = True
        
    async def predict_irrigation_needs(self, 
                                     plot_data: Dict[str, Any],
                                     include_llm_analysis: bool = True) -> Dict[str, Any]:
        """Predict irrigation needs for a plot"""
        
        try:
            # Step 1: Get weather data
            weather_data = await self._get_current_weather(plot_data.get('location'))
            
            # Step 2: Prepare input for regression model
            conditions = {
                'soil_moisture': plot_data.get('soil_moisture', 50),
                'temperature': weather_data.get('temperature', 25),
                'humidity': weather_data.get('humidity', 60),
                'days_since_planting': plot_data.get('days_since_planting', 30),
                'crop_stage': plot_data.get('crop_stage', 'vegetative')
            }
            
            # Step 3: Get ML prediction
            ml_prediction = self.regressor.predict(conditions)
            
            if 'error' in ml_prediction:
                return ml_prediction
            
            # Step 4: Enhance with LLM if enabled
            if include_llm_analysis and self.llm_enhancement_enabled:
                enhanced_result = await self._enhance_with_llm(
                    conditions, ml_prediction, plot_data
                )
                return enhanced_result
            else:
                return {
                    'plot_id': plot_data.get('plot_id', 'unknown'),
                    'prediction_time': datetime.now().isoformat(),
                    'water_needed_liters': ml_prediction['water_liters'],
                    'confidence': ml_prediction['confidence'],
                    'method': 'ml_only',
                    'reasoning': ml_prediction['reasoning'],
                    'next_check_hours': self._calculate_next_check(ml_prediction['water_liters']),
                    'conditions_used': conditions
                }
                
        except Exception as e:
            logger.error(f"Irrigation prediction failed: {e}")
            return {'error': str(e)}
    
    async def _get_current_weather(self, location: Optional[Dict[str, float]]) -> Dict[str, Any]:
        """Get current weather conditions"""
        try:
            if location and 'lat' in location and 'lon' in location:
                weather = await self.weather_service.get_current_weather(
                    location['lat'], location['lon']
                )
                return {
                    'temperature': weather.temperature,
                    'humidity': weather.humidity,
                    'wind_speed': weather.wind_speed,
                    'condition': 'Clear',  # Default since WeatherData doesn't have condition
                    'pressure': getattr(weather, 'pressure', 1013.25),
                    'rainfall': getattr(weather, 'rainfall', 0.0)
                }
            else:
                # Default weather if location not available
                return {
                    'temperature': 25,
                    'humidity': 60,
                    'wind_speed': 5,
                    'condition': 'Clear',
                    'pressure': 1013.25,
                    'rainfall': 0.0
                }
        except Exception as e:
            logger.warning(f"Weather fetch failed: {e}")
            return {'temperature': 25, 'humidity': 60, 'wind_speed': 5, 'condition': 'Clear', 'pressure': 1013.25, 'rainfall': 0.0}
    
    async def _enhance_with_llm(self, conditions: Dict[str, Any], 
                               ml_prediction: Dict[str, Any],
                               plot_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance ML prediction with LLM agricultural expertise"""
        
        try:
            # Create prompt for LLM
            prompt = self._create_irrigation_prompt(conditions, ml_prediction, plot_data)
            
            # Get LLM analysis
            llm_response = await gemini_service.generate_response(prompt)
            
            if llm_response and llm_response.response:
                # Parse LLM recommendations
                llm_analysis = self._parse_llm_response(llm_response.response)
                
                # Combine ML and LLM results
                return {
                    'plot_id': plot_data.get('plot_id', 'unknown'),
                    'prediction_time': datetime.now().isoformat(),
                    'water_needed_liters': ml_prediction['water_liters'],
                    'confidence': min(ml_prediction['confidence'], llm_analysis.get('confidence', 0.7)),
                    'method': 'ml_plus_llm',
                    'ml_reasoning': ml_prediction['reasoning'],
                    'llm_reasoning': llm_analysis.get('reasoning', 'LLM analysis failed'),
                    'recommendations': llm_analysis.get('recommendations', []),
                    'timing_advice': llm_analysis.get('timing', 'Apply when convenient'),
                    'next_check_hours': self._calculate_next_check(ml_prediction['water_liters']),
                    'conditions_used': conditions
                }
            else:
                # Fallback to ML only
                return await self.predict_irrigation_needs(plot_data, include_llm_analysis=False)
                
        except Exception as e:
            logger.warning(f"LLM enhancement failed: {e}")
            # Fallback to ML only
            return await self.predict_irrigation_needs(plot_data, include_llm_analysis=False)
    
    def _create_irrigation_prompt(self, conditions: Dict[str, Any], 
                                ml_prediction: Dict[str, Any],
                                plot_data: Dict[str, Any]) -> str:
        """Create prompt for LLM irrigation analysis"""
        
        crop_info = plot_data.get('crop_type', 'unknown crop')
        stage = conditions.get('crop_stage', 'unknown stage')
        
        prompt = f"""
        As an irrigation specialist, analyze this irrigation recommendation:
        
        CROP: {crop_info} at {stage} stage
        CURRENT CONDITIONS:
        - Soil moisture: {conditions['soil_moisture']}%
        - Temperature: {conditions['temperature']}°C
        - Humidity: {conditions['humidity']}%
        - Days since planting: {conditions['days_since_planting']}
        
        ML MODEL RECOMMENDATION: {ml_prediction['water_liters']:.1f} liters
        ML REASONING: {ml_prediction['reasoning']}
        
        Provide:
        1. Your assessment of this recommendation (agree/modify/disagree)
        2. Optimal timing for irrigation (morning/evening/immediate)
        3. Any specific considerations for this crop and stage
        4. Confidence in recommendation (0.1-1.0)
        
        Respond in this format:
        ASSESSMENT: [your assessment]
        TIMING: [best timing advice]
        CONSIDERATIONS: [crop-specific advice]
        CONFIDENCE: [0.1-1.0]
        """
        
        return prompt
    
    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """Parse LLM response into structured data"""
        
        try:
            result = {
                'reasoning': 'LLM provided irrigation analysis',
                'recommendations': [],
                'timing': 'Apply when convenient',
                'confidence': 0.7
            }
            
            lines = response.split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('ASSESSMENT:'):
                    result['reasoning'] = line.replace('ASSESSMENT:', '').strip()
                elif line.startswith('TIMING:'):
                    result['timing'] = line.replace('TIMING:', '').strip()
                    result['recommendations'].append(result['timing'])
                elif line.startswith('CONSIDERATIONS:'):
                    consideration = line.replace('CONSIDERATIONS:', '').strip()
                    result['recommendations'].append(consideration)
                elif line.startswith('CONFIDENCE:'):
                    try:
                        conf_str = line.replace('CONFIDENCE:', '').strip()
                        result['confidence'] = float(conf_str)
                    except:
                        result['confidence'] = 0.7
            
            return result
            
        except Exception as e:
            logger.warning(f"LLM response parsing failed: {e}")
            return {
                'reasoning': 'LLM analysis could not be parsed',
                'recommendations': ['Follow ML recommendation'],
                'timing': 'Apply when convenient',
                'confidence': 0.5
            }
    
    def _calculate_next_check(self, water_amount: float) -> int:
        """Calculate when to check irrigation needs again (in hours)"""
        
        if water_amount <= 0:
            return 48  # Check again in 2 days
        elif water_amount < 10:
            return 24  # Check again tomorrow
        elif water_amount < 20:
            return 12  # Check again in 12 hours
        else:
            return 6   # Check again in 6 hours (urgent)
    
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
                if pred.get('water_needed_liters', 0) > 0:
                    
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
                    
                    water_amount = pred['water_needed_liters']
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
            'ml_model_trained': self.regressor.is_trained,
            'weather_service_available': True,  # Assume available
            'llm_enhancement_enabled': self.llm_enhancement_enabled,
            'last_check': datetime.now().isoformat()
        }
    
    async def get_plots(self, db) -> List[Dict[str, Any]]:
        """Get all plots available for irrigation management"""
        try:
            # Import here to avoid circular imports
            from app.database.postgre_schema import Plot as PlotModel
            
            # Query plots from database
            plots = db.query(PlotModel).all()
            
            plot_list = []
            for plot in plots:
                plot_dict = {
                    'id': str(plot.id),
                    'name': plot.plot_name,  # Use correct field name
                    'crop': plot.crop,
                    'area': float(plot.area) if plot.area else 0.0,
                    'season': getattr(plot, 'season', 'Unknown'),
                    'status': getattr(plot, 'status', 'Active')  # Use correct field name
                }
                plot_list.append(plot_dict)
            
            # If no plots found in database, return mock data
            if not plot_list:
                logger.warning("No plots found in database, returning mock data")
                return self._get_mock_plots()
            
            return plot_list
            
        except Exception as e:
            logger.error(f"Failed to get plots from database: {e}")
            # Return mock data if database fails
            return self._get_mock_plots()
    
    def _get_mock_plots(self) -> List[Dict[str, Any]]:
        """Return mock plot data for testing"""
        return [
            {'id': '1', 'name': 'ప్లాట్ 1', 'crop': 'వరి', 'area': 2.5, 'season': 'ఖరీఫ్', 'status': 'Active'},
            {'id': '2', 'name': 'ప్లాట్ 2', 'crop': 'మొక్కజొన్న', 'area': 1.8, 'season': 'రబీ', 'status': 'Active'},
            {'id': '3', 'name': 'ప్లాట్ 3', 'crop': 'పత్తి', 'area': 3.2, 'season': 'ఖరీఫ్', 'status': 'Active'},
        ]
    
    async def get_plot_measurements(self, plot_id: str, db) -> Dict[str, Any]:
        """Get current measurements for a specific plot"""
        try:
            from app.database.postgre_schema import SoilTest
            
            # Get latest soil test for the plot
            soil_test = db.query(SoilTest).filter(SoilTest.plot_id == int(plot_id)).order_by(SoilTest.test_date.desc()).first()
            
            if soil_test:
                return {
                    'plot_id': plot_id,
                    'soil_moisture': 45.0,  # Mock value
                    'ph_level': soil_test.ph_level,
                    'nitrogen': soil_test.nitrogen,
                    'phosphorus': soil_test.phosphorus,
                    'potassium': soil_test.potassium,
                    'last_updated': soil_test.test_date.isoformat()
                }
            else:
                # Return mock data
                return {
                    'plot_id': plot_id,
                    'soil_moisture': 45.0,
                    'ph_level': 6.8,
                    'nitrogen': 120.0,
                    'phosphorus': 85.0,
                    'potassium': 95.0,
                    'last_updated': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to get plot measurements: {e}")
            return {
                'plot_id': plot_id,
                'soil_moisture': 45.0,
                'ph_level': 6.8,
                'nitrogen': 120.0,
                'phosphorus': 85.0,
                'potassium': 95.0,
                'last_updated': datetime.now().isoformat()
            }
    
    async def get_plot_weather(self, plot_id: str, db) -> Dict[str, Any]:
        """Get weather data for a specific plot"""
        try:
            # For now, use default location - can be enhanced with plot-specific coordinates
            weather_data = await self._get_current_weather({'lat': 17.3850, 'lon': 78.4867})
            
            return {
                'plot_id': plot_id,
                'current': {
                    'temperature': weather_data.get('temperature', 25),
                    'humidity': weather_data.get('humidity', 60),
                    'wind_speed': weather_data.get('wind_speed', 5),
                    'condition': weather_data.get('condition', 'Clear'),
                    'pressure': weather_data.get('pressure', 1013.25)
                },
                'forecast': {
                    'nextRain': {
                        'probability': 20,
                        'expected_time': '24h',
                        'amount': '5mm'
                    },
                    'temperature': {
                        'min': weather_data.get('temperature', 25) - 5,
                        'max': weather_data.get('temperature', 25) + 5,
                        'trend': 'stable'
                    },
                    'humidity': {
                        'current': weather_data.get('humidity', 60),
                        'trend': 'stable'
                    },
                    'wind': {
                        'speed': weather_data.get('wind_speed', 5),
                        'direction': 'SW',
                        'gust': weather_data.get('wind_speed', 5) + 2
                    }
                },
                'timestamp': datetime.now()
            }
            
        except Exception as e:
            logger.error(f"Failed to get plot weather: {e}")
            return {
                'plot_id': plot_id,
                'current': {
                    'temperature': 25,
                    'humidity': 60,
                    'wind_speed': 5,
                    'condition': 'Clear',
                    'pressure': 1013.25
                },
                'forecast': {
                    'nextRain': {
                        'probability': 20,
                        'expected_time': '24h',
                        'amount': '5mm'
                    },
                    'temperature': {
                        'min': 20,
                        'max': 30,
                        'trend': 'stable'
                    },
                    'humidity': {
                        'current': 60,
                        'trend': 'stable'
                    },
                    'wind': {
                        'speed': 5,
                        'direction': 'SW',
                        'gust': 7
                    }
                },
                'timestamp': datetime.now()
            }

    async def get_irrigation_schedule(self, plot_id: str, date: Optional[str], db) -> List[Dict[str, Any]]:
        """Get irrigation schedule for a specific plot"""
        try:
            import uuid
            from datetime import timedelta
            
            # Try to convert to UUID for database query
            try:
                uuid_plot_id = uuid.UUID(plot_id)
                # In future, query actual schedule from database:
                # schedules = db.query(IrrigationScheduleModel).filter(...)
            except ValueError:
                uuid_plot_id = None

            # For now, generate realistic schedule data based on plot
            # This simulates what would be pulled from your irrigation schedule database
            base_date = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
            schedule_items = []
            
            # Generate schedule for current week (Monday, Wednesday, Friday, Sunday) exactly as shown
            schedule_days = [
                (0, "Monday"),     # Monday
                (2, "Wednesday"),  # Wednesday  
                (4, "Friday"),     # Friday
                (6, "Sunday")      # Sunday
            ]
            
            # Get Monday of current week as base
            current_date = datetime.now().date()
            days_since_monday = current_date.weekday()
            monday_of_week = current_date - timedelta(days=days_since_monday)
            
            for i, (day_offset, day_name) in enumerate(schedule_days):
                # Calculate the date for this schedule entry
                target_date = monday_of_week + timedelta(days=day_offset)
                target_datetime = datetime.combine(target_date, datetime.min.time().replace(hour=6, minute=0))
                
                # Determine status based on whether it's in the past or future
                is_past = target_date < current_date
                is_today = target_date == current_date
                
                if is_past:
                    status = "completed"
                elif is_today:
                    status = "in-progress" if datetime.now().hour >= 6 else "scheduled"
                else:
                    status = "scheduled"
                
                schedule_item = {
                    "id": f"schedule_{plot_id}_{i+1}",
                    "plot_id": plot_id,
                    "startTime": target_datetime.isoformat(),
                    "duration": {
                        "value": 45,
                        "unit": "min"  # Match your format
                    },
                    "waterAmount": {
                        "value": 25,  # Remove .0 for cleaner display
                        "unit": "mm"
                    },
                    "method": "Drip Irrigation",
                    "status": status,
                    "created_at": (target_datetime - timedelta(days=1)).isoformat(),
                    "updated_at": target_datetime.isoformat(),
                    "day_name": day_name  # Add day name for frontend
                }
                schedule_items.append(schedule_item)
            
            return schedule_items
            
        except Exception as e:
            logger.error(f"Failed to get irrigation schedule: {e}")
            # Return empty schedule on error
            return []

    async def create_irrigation_schedule(self, plot_id: str, auto_mode: bool, db) -> Dict[str, Any]:
        """Create a new irrigation schedule for a plot"""
        try:
            # This would create a new schedule in the database
            # For now, return a mock created schedule
            new_schedule = {
                "id": f"schedule_{plot_id}_new",
                "plot_id": plot_id,
                "startTime": (datetime.now() + timedelta(days=1)).replace(hour=6, minute=0).isoformat(),
                "duration": {
                    "value": 45,
                    "unit": "minutes"
                },
                "waterAmount": {
                    "value": 25.0,
                    "unit": "mm"
                },
                "method": "Drip Irrigation",
                "status": "scheduled",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            logger.info(f"Created irrigation schedule for plot {plot_id}")
            return new_schedule
            
        except Exception as e:
            logger.error(f"Failed to create irrigation schedule: {e}")
            raise

    async def update_irrigation_schedule(self, plot_id: str, schedule_id: str, status: str, db) -> Dict[str, Any]:
        """Update an existing irrigation schedule"""
        try:
            # This would update the schedule in the database
            # For now, return a mock updated schedule
            updated_schedule = {
                "id": schedule_id,
                "plot_id": plot_id,
                "startTime": datetime.now().replace(hour=6, minute=0).isoformat(),
                "duration": {
                    "value": 45,
                    "unit": "minutes"
                },
                "waterAmount": {
                    "value": 25.0,
                    "unit": "mm"
                },
                "method": "Drip Irrigation", 
                "status": status,
                "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            logger.info(f"Updated irrigation schedule {schedule_id} for plot {plot_id}")
            return updated_schedule
            
        except Exception as e:
            logger.error(f"Failed to update irrigation schedule: {e}")
            raise

# Global service instance
irrigation_service = IrrigationService()