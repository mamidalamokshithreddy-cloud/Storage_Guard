from typing import Dict, Any, Optional, List, Tuple  # ← FIXED: Added Tuple
import httpx
import pandas as pd
import numpy as np
from app.agents.base_agent import BaseAgent, AgentResponse
from app.core.config import settings
from app.ml.data_loader import CropRecommendationSystem

class DynamicDataAgent(BaseAgent):
    """Dynamic data processing agent using real agricultural data."""
    
    def __init__(self, data_path: str = "./data/"):
        super().__init__("DynamicDataAgent")
        self.crop_system = CropRecommendationSystem(data_path)
        self.initialized = False
    
    async def execute(self, data: Dict[str, Any]) -> AgentResponse:
        """Process and enrich input data dynamically."""
        try:
            # Initialize system if needed
            if not self.initialized:
                self.logger.info("Initializing crop recommendation system...")
                success = self.crop_system.initialize()
                if not success:
                    return AgentResponse(
                        status="error",
                        message="Failed to initialize crop recommendation system"
                    )
                self.initialized = True
            
            # Clean and validate input data
            clean_data = await self._clean_input_data(data)
            
            # Fetch weather data if needed
            if "latitude" in clean_data and "longitude" in clean_data:
                weather_data = await self._fetch_weather_data(
                    clean_data["latitude"], 
                    clean_data["longitude"]
                )
                clean_data.update(weather_data)
            
            # Engineer features using dynamic ranges
            features = await self._engineer_features(clean_data)
            
            # Add derived features based on crop database
            derived_features = await self._calculate_dynamic_features(features)
            features.update(derived_features)
            
            # Calculate data quality score
            quality_score = await self._assess_data_quality(features)
            
            processed_data = {
                "raw_data": clean_data,
                "engineered_features": features,
                "data_quality_score": quality_score,
                "dynamic_analysis": await self._analyze_against_database(features),
                "timestamp": pd.Timestamp.now().isoformat()
            }
            
            return AgentResponse(
                status="success",
                data=processed_data,
                message="Dynamic data processing completed successfully"
            )
            
        except Exception as e:
            self.logger.error(f"Data processing failed: {str(e)}")
            return AgentResponse(
                status="error",
                message=f"Data processing failed: {str(e)}"
            )
    
    async def _clean_input_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Clean and validate input data using dynamic ranges."""
        cleaned = {}
        
        # Get dynamic ranges from crop database
        nutrient_ranges = self._get_dynamic_ranges(['N', 'P', 'K'])
        env_ranges = self._get_dynamic_ranges(['temperature', 'humidity', 'ph', 'rainfall'])
        
        # Clean nutrients with dynamic bounds
        for nutrient in ['nitrogen', 'phosphorus', 'potassium']:
            key = nutrient[0].upper()  # N, P, K
            if nutrient in data:
                value = float(data[nutrient])
                if key in nutrient_ranges:
                    min_val, max_val = nutrient_ranges[key]
                    cleaned[key.lower()] = max(min_val, min(max_val, value))
                else:
                    cleaned[key.lower()] = value
            else:
                # Use mean value from database
                if key in nutrient_ranges:
                    range_vals = nutrient_ranges[key]
                    cleaned[key.lower()] = range_vals[0] + (range_vals[1] - range_vals[0]) / 2
                else:
                    # Fallback defaults
                    defaults = {'n': 40, 'p': 30, 'k': 20}
                    cleaned[key.lower()] = defaults.get(key.lower(), 0)
        
        # Clean environmental parameters
        env_mapping = {
            'temperature': ('temperature', (-10, 50)),
            'humidity': ('humidity', (0, 100)),
            'ph': ('ph', (3, 10)),
            'rainfall': ('rainfall', (0, 500))
        }
        
        for param, (key, default_range) in env_mapping.items():
            if param in data:
                value = float(data[param])
                range_vals = env_ranges.get(key, default_range)
                cleaned[key] = max(range_vals[0], min(range_vals[1], value))
            else:
                range_vals = env_ranges.get(key, default_range)
                cleaned[key] = range_vals[0] + (range_vals[1] - range_vals[0]) / 2
        
        # Location
        cleaned["latitude"] = max(-90, min(90, float(data.get("latitude", 0))))
        cleaned["longitude"] = max(-180, min(180, float(data.get("longitude", 0))))
        
        # Optional parameters
        cleaned["field_size"] = float(data.get("field_size", 1.0)) if data.get("field_size") else 1.0
        cleaned["season"] = data.get("season", "kharif")
        
        return cleaned
    
    def _get_dynamic_ranges(self, features: List[str]) -> Dict[str, Tuple[float, float]]:  # ← FIXED: Now Tuple is imported
        """Get dynamic value ranges from crop database."""
        ranges = {}
        
        if not self.initialized:
            return ranges
        
        for feature in features:
            values = []
            for crop_profile in self.crop_system.crop_profiles.values():
                if feature.upper() in crop_profile.get('nutrients', {}):
                    nutrient_data = crop_profile['nutrients'][feature.upper()]
                    values.extend([nutrient_data['min'], nutrient_data['max']])
                elif feature.lower() in crop_profile.get('environment', {}):
                    env_data = crop_profile['environment'][feature.lower()]
                    values.extend([env_data['min'], env_data['max']])
            
            if values:
                ranges[feature] = (min(values), max(values))
        
        return ranges
    
    async def _fetch_weather_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """Fetch real-time weather data."""
        if not settings.weather_api_key:
            self.logger.warning("No weather API key configured, using dynamic defaults")
            # Use dynamic defaults from crop database
            env_ranges = self._get_dynamic_ranges(['temperature', 'humidity', 'rainfall'])
            return {
                "temperature": env_ranges.get('temperature', (25.0, 25.0))[0] + 
                              (env_ranges.get('temperature', (25.0, 25.0))[1] - env_ranges.get('temperature', (25.0, 25.0))[0]) / 2,
                "humidity": env_ranges.get('humidity', (60.0, 60.0))[0] + 
                           (env_ranges.get('humidity', (60.0, 60.0))[1] - env_ranges.get('humidity', (60.0, 60.0))[0]) / 2,
                "rainfall": env_ranges.get('rainfall', (100.0, 100.0))[0] + 
                           (env_ranges.get('rainfall', (100.0, 100.0))[1] - env_ranges.get('rainfall', (100.0, 100.0))[0]) / 2,
                "pressure": 1013.25,
                "wind_speed": 5.0
            }
        
        # Use real weather API
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "http://api.openweathermap.org/data/2.5/weather",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": settings.weather_api_key,
                        "units": "metric"
                    }
                )
                
                if response.status_code == 200:
                    weather = response.json()
                    return {
                        "temperature": weather["main"]["temp"],
                        "humidity": weather["main"]["humidity"],
                        "pressure": weather["main"]["pressure"],
                        "wind_speed": weather.get("wind", {}).get("speed", 0),
                        "weather_description": weather["weather"][0]["description"]
                    }
        except Exception as e:
            self.logger.error(f"Weather API error: {e}")
        
        # Return dynamic defaults on API failure
        env_ranges = self._get_dynamic_ranges(['temperature', 'humidity', 'rainfall'])
        return {
            "temperature": np.mean(env_ranges.get('temperature', (25.0, 25.0))),
            "humidity": np.mean(env_ranges.get('humidity', (60.0, 60.0))),
            "rainfall": np.mean(env_ranges.get('rainfall', (100.0, 100.0))),
            "pressure": 1013.25,
            "wind_speed": 5.0
        }
    
    async def _engineer_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Engineer features for ML model."""
        features = {}
        
        # Map to standard feature names
        feature_mapping = {
            'n': data.get('n', data.get('nitrogen', 0)),
            'p': data.get('p', data.get('phosphorus', 0)),
            'k': data.get('k', data.get('potassium', 0)),
            'temperature': data.get('temperature', 25),
            'humidity': data.get('humidity', 60),
            'ph': data.get('ph', 7),
            'rainfall': data.get('rainfall', 100)
        }
        
        for key, value in feature_mapping.items():
            features[key] = float(value)
        
        return features
    
    async def _calculate_dynamic_features(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate derived features using dynamic analysis."""
        derived = {}
        
        # NPK ratio features - FIX DIVISION BY ZERO
        n_val = features.get('n', 0)
        p_val = features.get('p', 0)
        k_val = features.get('k', 0)
        
        total_npk = n_val + p_val + k_val
        
        if total_npk > 0:  # ← Check for zero division
            derived["n_ratio"] = n_val / total_npk
            derived["p_ratio"] = p_val / total_npk
            derived["k_ratio"] = k_val / total_npk
        else:
            # Handle zero case
            derived["n_ratio"] = 0.33  # Equal ratios if all are zero
            derived["p_ratio"] = 0.33
            derived["k_ratio"] = 0.34
        
        # Dynamic soil fertility index using crop database ranges
        if self.initialized:
            fertility_components = []
            nutrient_ranges = self._get_dynamic_ranges(['N', 'P', 'K'])
            
            for nutrient in ['n', 'p', 'k']:
                value = features.get(nutrient, 0)
                range_key = nutrient.upper()
                if range_key in nutrient_ranges:
                    min_val, max_val = nutrient_ranges[range_key]
                    # FIX DIVISION BY ZERO
                    if max_val > min_val:
                        normalized = (value - min_val) / (max_val - min_val)
                        fertility_components.append(max(0, min(1, normalized)))
                    else:
                        fertility_components.append(0.5)  # Neutral if range is zero
            
            if fertility_components:
                derived["soil_fertility"] = np.mean(fertility_components)
            else:
                derived["soil_fertility"] = 0.5  # Default value
        
        # pH category based on dynamic data
        ph_value = features.get('ph', 7)
        if ph_value < 6:
            derived["ph_category"] = "acidic"
        elif ph_value > 8:
            derived["ph_category"] = "alkaline"
        else:
            derived["ph_category"] = "neutral"
        
        # Dynamic weather suitability index
        if self.initialized:
            env_ranges = self._get_dynamic_ranges(['temperature', 'humidity'])
            temp_range = env_ranges.get('temperature', (15, 35))
            humidity_range = env_ranges.get('humidity', (40, 80))
            
            temp = features.get('temperature', 25)
            humidity = features.get('humidity', 60)
            
            # FIX DIVISION BY ZERO
            temp_range_diff = temp_range[1] - temp_range[0]
            humidity_range_diff = humidity_range[1] - humidity_range[0]
            
            if temp_range_diff > 0:
                temp_optimal = 1 - abs(temp - np.mean(temp_range)) / temp_range_diff
            else:
                temp_optimal = 1.0  # Perfect if no range variation
            
            if humidity_range_diff > 0:
                humidity_optimal = 1 - abs(humidity - np.mean(humidity_range)) / humidity_range_diff
            else:
                humidity_optimal = 1.0  # Perfect if no range variation
            
            derived["weather_index"] = (max(0, temp_optimal) + max(0, humidity_optimal)) / 2
        else:
            derived["weather_index"] = 0.5  # Default value
        
        return derived
 
    async def _analyze_against_database(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze input features against crop database."""
        if not self.initialized:
            return {}
        
        analysis = {}
        
        # Find best matching crops based on current conditions
        matching_crops = []
        for crop_name, profile in self.crop_system.crop_profiles.items():
            match_score = 0
            total_checks = 0
            
            # Check nutrients
            for nutrient in ['N', 'P', 'K']:
                if nutrient.lower() in features and nutrient in profile.get('nutrients', {}):
                    value = features[nutrient.lower()]
                    optimal_range = profile['nutrients'][nutrient]['optimal_range']
                    
                    if optimal_range[0] <= value <= optimal_range[1]:
                        match_score += 1
                    total_checks += 1
            
            # Check environmental factors
            for factor in ['temperature', 'humidity', 'ph', 'rainfall']:
                if factor in features and factor in profile.get('environment', {}):
                    value = features[factor]
                    optimal_range = profile['environment'][factor]['optimal_range']
                    
                    if optimal_range[0] <= value <= optimal_range[1]:
                        match_score += 1
                    total_checks += 1
            
            if total_checks > 0:
                match_percentage = match_score / total_checks
                if match_percentage > 0.5:  # Only include crops with >50% match
                    matching_crops.append({
                        'crop': crop_name,
                        'match_score': match_percentage,
                        'sample_count': profile.get('sample_count', 0)
                    })
        
        # Sort by match score
        matching_crops.sort(key=lambda x: x['match_score'], reverse=True)
        
        analysis['matching_crops'] = matching_crops[:5]  # Top 5 matches
        analysis['total_database_crops'] = len(self.crop_system.crop_profiles)
        
        return analysis
    
    async def _assess_data_quality(self, features: Dict[str, Any]) -> float:
        """Assess overall data quality score."""
        required_features = ["n", "p", "k", "ph", "temperature", "humidity", "rainfall"]
        available_features = sum(1 for feature in required_features 
                               if feature in features and features[feature] is not None)
        return available_features / len(required_features)
