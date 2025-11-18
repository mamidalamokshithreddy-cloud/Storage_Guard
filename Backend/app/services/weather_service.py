"""
Weather Service for Pest & Disease Risk Assessment
"""

import logging
import aiohttp
import asyncio
import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

from app.schemas.postgres_base_models import WeatherRisk, WeatherRiskIndices, WeatherRiskBand
from app.core.config import STRICT_NO_FALLBACKS

logger = logging.getLogger(__name__)


@dataclass
class WeatherData:
    """Single weather observation data point"""
    timestamp: datetime
    temperature: float  # Celsius
    humidity: float  # Percentage
    rainfall: float  # mm
    wind_speed: float  # km/h
    pressure: float  # hPa
    cloud_cover: float  # Percentage


@dataclass
class WeatherForecast:
    """Weather forecast data point"""
    date: datetime
    temperature_max: float
    temperature_min: float
    humidity: float
    rainfall: float
    wind_speed: float
    conditions: str


class WeatherService:
    """
    Service for weather data integration and risk assessment
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize weather service
        
        Args:
            api_key: API key for weather service (OpenWeatherMap, etc.)
        """
        if STRICT_NO_FALLBACKS and not api_key:
            # Force explicit API key provisioning
            raise RuntimeError("WeatherService strict mode: API key required (STRICT_NO_FALLBACKS=True)")
        
        self.api_key = api_key
        # Check if we have a valid API key (not empty, not placeholder)
        self.has_valid_api_key = api_key and api_key != "your_weather_api_key_here" and api_key.strip() != ""
        
        self.postgres_base_url = "https://api.openweathermap.org/data/2.5"
        self.session: Optional[aiohttp.ClientSession] = None
        self._cache: Dict[str, Any] = {}  # Simple in-memory cache
        self._cache_ttl: Dict[str, datetime] = {}  # Cache TTL tracking
        
        if self.has_valid_api_key:
            logger.info("Weather service initialized with API key")
        else:
            logger.info("Weather service initialized in fallback mode (no API key)")

    async def close(self):
        """Close underlying HTTP session if open"""
        try:
            if self.session and not self.session.closed:
                await self.session.close()
        finally:
            self.session = None
    
    async def initialize_cache(self):
        """Initialize weather service cache"""
        try:
            # Create cache directory if it doesn't exist
            from pathlib import Path
            cache_dir = Path("data/weather_cache")
            cache_dir.mkdir(parents=True, exist_ok=True)
            
            # Test cache functionality
            test_key = "weather_cache_test"
            self._cache[test_key] = {"initialized": True, "timestamp": datetime.utcnow()}
            self._cache_ttl[test_key] = datetime.utcnow() + timedelta(minutes=5)
            
            logger.info("✅ Weather service cache initialized")
            
        except Exception as e:
            logger.warning(f"Weather cache initialization failed: {e}")
    
    def _get_from_cache(self, key: str) -> Optional[Any]:
        """Get item from cache if not expired"""
        if key in self._cache and key in self._cache_ttl:
            if datetime.utcnow() < self._cache_ttl[key]:
                return self._cache[key]
            else:
                # Remove expired item
                del self._cache[key]
                del self._cache_ttl[key]
        return None
    
    def _set_cache(self, key: str, value: Any, ttl_minutes: int = 30):
        """Set item in cache with TTL"""
        self._cache[key] = value
        self._cache_ttl[key] = datetime.utcnow() + timedelta(minutes=ttl_minutes)
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def get_current_weather(self, lat: float, lon: float) -> WeatherData:
        """
        Get current weather data for location
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Current weather data
        """
        # If no valid API key, return default weather immediately
        if not self.has_valid_api_key:
            logger.debug(f"No valid API key, using default weather for {lat}, {lon}")
            return self._get_default_weather()
        
        # Check cache first
        cache_key = f"current_weather_{lat}_{lon}"
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            logger.debug(f"Using cached weather data for {lat}, {lon}")
            return cached_data
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            url = f"{self.postgres_base_url}/weather"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    weather_data = self._parse_current_weather(data)
                    # Cache for 15 minutes
                    self._set_cache(cache_key, weather_data, 15)
                    return weather_data
                else:
                    logger.warning(f"Weather API returned status {response.status}")
                    if STRICT_NO_FALLBACKS:
                        raise RuntimeError(f"Strict mode: weather API failure status={response.status}")
                    return self._get_default_weather()
                    
        except Exception as e:
            logger.error(f"Failed to fetch current weather: {e}")
            if STRICT_NO_FALLBACKS:
                raise
            return self._get_default_weather()
    
    async def get_historical_data(self, lat: float, lon: float, 
                                from_date: datetime, to_date: datetime) -> List[WeatherData]:
        """
        Get historical weather data
        
        Args:
            lat: Latitude
            lon: Longitude
            from_date: Start date
            to_date: End date
            
        Returns:
            List of historical weather data
        """
        try:
            # For demo purposes, simulate historical data
            # In production, you would call actual historical weather API
            if STRICT_NO_FALLBACKS:
                raise RuntimeError("Strict mode: historical weather simulation disabled")
            return await self._simulate_historical_data(lat, lon, from_date, to_date)
            
        except Exception as e:
            logger.error(f"Failed to fetch historical weather: {e}")
            return []
    
    async def get_forecast_data(self, lat: float, lon: float, days: int = 7) -> List[WeatherForecast]:
        """
        Get weather forecast data
        
        Args:
            lat: Latitude
            lon: Longitude
            days: Number of forecast days
            
        Returns:
            List of forecast data
        """
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            url = f"{self.postgres_base_url}/forecast"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric"
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_forecast_data(data, days)
                else:
                    logger.warning(f"Forecast API returned status {response.status}")
                    if STRICT_NO_FALLBACKS:
                        raise RuntimeError(f"Strict mode: forecast API failure status={response.status}")
                    return self._get_default_forecast(days)
                    
        except Exception as e:
            logger.error(f"Failed to fetch forecast: {e}")
            if STRICT_NO_FALLBACKS:
                raise
            return self._get_default_forecast(days)
    
    def calculate_risk_indices(self, weather_data: List[WeatherData]) -> WeatherRiskIndices:
        """
        Calculate weather risk indices from historical and forecast data
        
        Args:
            weather_data: List of weather observations
            
        Returns:
            Weather risk indices
        """
        if not weather_data:
            return WeatherRiskIndices()
        
        indices = WeatherRiskIndices()
        
        # High humidity hours
        indices.high_humidity_hours = sum(
            1 for w in weather_data if w.humidity > 85
        )
        
        # Consecutive wet days
        wet_days = 0
        max_consecutive_wet = 0
        for weather in weather_data:
            if weather.rainfall > 1.0:  # > 1mm considered wet
                wet_days += 1
                max_consecutive_wet = max(max_consecutive_wet, wet_days)
            else:
                wet_days = 0
        indices.consecutive_wet_days = max_consecutive_wet
        
        # Temperature stress
        indices.temperature_stress = any(
            w.temperature > 35 or w.temperature < 5 
            for w in weather_data
        )
        
        # Wind risk
        indices.wind_risk = any(
            w.wind_speed > 25  # km/h
            for w in weather_data
        )
        
        # Degree days (simplified growing degree days)
        base_temp = 10  # Base temperature for pest development
        indices.degree_days = sum(
            max(0, w.temperature - base_temp) 
            for w in weather_data
        )
        
        # Leaf wetness hours (approximation)
        indices.leaf_wetness_hours = sum(
            1 for w in weather_data 
            if w.humidity > 90 or w.rainfall > 0
        )
        
        logger.debug(f"Calculated risk indices: {indices}")
        return indices
    
    def determine_risk_band(self, indices: WeatherRiskIndices) -> WeatherRiskBand:
        """
        Determine overall weather risk band
        
        Args:
            indices: Weather risk indices
            
        Returns:
            Weather risk band
        """
        risk_score = 0
        
        # High humidity contributes to fungal diseases
        if indices.high_humidity_hours > 48:  # 2+ days
            risk_score += 3
        elif indices.high_humidity_hours > 24:  # 1+ days
            risk_score += 2
        elif indices.high_humidity_hours > 12:  # 0.5+ days
            risk_score += 1
        
        # Wet conditions promote disease
        if indices.consecutive_wet_days > 4:
            risk_score += 3
        elif indices.consecutive_wet_days > 2:
            risk_score += 2
        elif indices.consecutive_wet_days > 0:
            risk_score += 1
        
        # Leaf wetness
        if indices.leaf_wetness_hours > 72:  # 3+ days
            risk_score += 2
        elif indices.leaf_wetness_hours > 36:  # 1.5+ days
            risk_score += 1
        
        # Temperature stress
        if indices.temperature_stress:
            risk_score += 2
        
        # Wind can spread diseases and damage plants
        if indices.wind_risk:
            risk_score += 1
        
        # High degree days = rapid pest development
        if indices.degree_days > 200:
            risk_score += 2
        elif indices.degree_days > 100:
            risk_score += 1
        
        # Determine band based on total score
        if risk_score <= 2:
            return WeatherRiskBand.low
        elif risk_score <= 6:
            return WeatherRiskBand.medium
        else:
            return WeatherRiskBand.high
    
    async def assess_risk_for_location(self, lat: float, lon: float) -> WeatherRisk:
        """
        Complete weather risk assessment for location
        
        Args:
            lat: Latitude
            lon: Longitude
        """
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=7)
            historical_data = await self.get_historical_data(lat, lon, start_date, end_date)
            forecast_data = await self.get_forecast_data(lat, lon, 3)
            forecast_weather = [
                WeatherData(
                    timestamp=f.date,
                    temperature=(f.temperature_max + f.temperature_min) / 2,
                    humidity=f.humidity,
                    rainfall=f.rainfall,
                    wind_speed=f.wind_speed,
                    pressure=1013.25,
                    cloud_cover=50.0
                ) for f in forecast_data
            ]
            all_weather_data = historical_data + forecast_weather
            indices = self.calculate_risk_indices(all_weather_data)
            risk_band = self.determine_risk_band(indices)
            factors = self._generate_risk_factors(indices, forecast_data)
            return WeatherRisk(indices=indices, risk_band=risk_band, factors=factors)
        except Exception as e:
            logger.error(f"Weather risk assessment failed: {e}")
            if STRICT_NO_FALLBACKS:
                raise
            return WeatherRisk(indices=WeatherRiskIndices(), risk_band=WeatherRiskBand.medium, factors=["Weather data unavailable - using default assessment"])    
    
    def _parse_current_weather(self, data: Dict[str, Any]) -> WeatherData:
        """Parse OpenWeatherMap current weather response"""
        main = data.get("main", {})
        wind = data.get("wind", {})
        clouds = data.get("clouds", {})
        rain = data.get("rain", {})
        return WeatherData(
            timestamp=datetime.utcnow(),
            temperature=main.get("temp", 20.0),
            humidity=main.get("humidity", 60.0),
            rainfall=rain.get("1h", 0.0),
            wind_speed=wind.get("speed", 0.0) * 3.6,  # m/s to km/h
            pressure=main.get("pressure", 1013.25),
            cloud_cover=clouds.get("all", 50.0)
        )
    
    def _parse_forecast_data(self, data: Dict[str, Any], days: int) -> List[WeatherForecast]:
        """Parse OpenWeatherMap forecast response"""
        forecasts = []
        forecast_list = data.get("list", [])
        
        # Group by date and take daily summaries
        daily_data = {}
        
        for item in forecast_list[:days * 8]:  # 8 forecasts per day (3-hour intervals)
            dt = datetime.fromtimestamp(item["dt"])
            date_key = dt.date()
            
            if date_key not in daily_data:
                daily_data[date_key] = []
            
            daily_data[date_key].append({
                "temp": item["main"]["temp"],
                "humidity": item["main"]["humidity"],
                "rain": item.get("rain", {}).get("3h", 0.0),
                "wind": item["wind"]["speed"] * 3.6,  # m/s to km/h
                "conditions": item["weather"][0]["description"]
            })
        
        # Create daily forecasts
        for date_key, day_data in list(daily_data.items())[:days]:
            temps = [d["temp"] for d in day_data]
            
            forecast = WeatherForecast(
                date=datetime.combine(date_key, datetime.min.time()),
                temperature_max=max(temps),
                temperature_min=min(temps),
                humidity=sum(d["humidity"] for d in day_data) / len(day_data),
                rainfall=sum(d["rain"] for d in day_data),
                wind_speed=sum(d["wind"] for d in day_data) / len(day_data),
                conditions=day_data[0]["conditions"]  # Use first condition
            )
            
            forecasts.append(forecast)
        
        return forecasts
    
    async def _simulate_historical_data(self, lat: float, lon: float, 
                                      from_date: datetime, to_date: datetime) -> List[WeatherData]:
        """Simulate historical weather data for demo purposes"""
        weather_data = []
        current_date = from_date
        
        while current_date <= to_date:
            # Generate realistic weather data based on location and season
            base_temp = self._get_seasonal_base_temp(lat, current_date)
            
            weather = WeatherData(
                timestamp=current_date,
                temperature=base_temp + (hash(str(current_date)) % 20 - 10),  # Variation
                humidity=60 + (hash(str(current_date + timedelta(hours=1))) % 40),
                rainfall=max(0, (hash(str(current_date + timedelta(hours=2))) % 20) - 15),
                wind_speed=abs(hash(str(current_date + timedelta(hours=3))) % 30),
                pressure=1013 + (hash(str(current_date + timedelta(hours=4))) % 50 - 25),
                cloud_cover=abs(hash(str(current_date + timedelta(hours=5))) % 100)
            )
            
            weather_data.append(weather)
            current_date += timedelta(hours=6)  # 4 readings per day
        
        return weather_data
    
    def _get_seasonal_base_temp(self, lat: float, date: datetime) -> float:
        """Get seasonal base temperature for location"""
        # Simple seasonal temperature model
        day_of_year = date.timetuple().tm_yday
        
        # Northern hemisphere adjustments
        if lat > 0:
            # Summer peak around day 180 (June 29)
            seasonal_factor = math.cos((day_of_year - 180) * 2 * math.pi / 365)
        else:
            # Southern hemisphere - opposite seasons
            seasonal_factor = math.cos((day_of_year - 365) * 2 * math.pi / 365)
        
        # Base temperature varies with latitude
        base_temp = 25 - abs(lat) * 0.3  # Cooler as you move from equator
        
        return base_temp + seasonal_factor * 15  # ±15°C seasonal variation
    
    def _get_default_weather(self) -> WeatherData:
        """Return default weather data when API fails"""
        return WeatherData(
            timestamp=datetime.utcnow(),
            temperature=22.0,
            humidity=65.0,
            rainfall=0.0,
            wind_speed=10.0,
            pressure=1013.25,
            cloud_cover=50.0
        )
    
    def _get_default_forecast(self, days: int) -> List[WeatherForecast]:
        """Return default forecast when API fails"""
        forecasts = []
        
        for i in range(days):
            date = datetime.utcnow() + timedelta(days=i)
            forecast = WeatherForecast(
                date=date,
                temperature_max=25.0,
                temperature_min=15.0,
                humidity=65.0,
                rainfall=0.0,
                wind_speed=10.0,
                conditions="partly cloudy"
            )
            forecasts.append(forecast)
        
        return forecasts
    
    def _generate_risk_factors(self, indices: WeatherRiskIndices, 
                             forecast_data: List[WeatherForecast]) -> List[str]:
        """Generate human-readable risk factors"""
        factors = []
        
        # High humidity factors
        if indices.high_humidity_hours > 48:
            factors.append(f"Extended high humidity period ({indices.high_humidity_hours} hours)")
        elif indices.high_humidity_hours > 24:
            factors.append(f"Prolonged high humidity ({indices.high_humidity_hours} hours)")
        elif indices.high_humidity_hours > 0:
            factors.append(f"High humidity conditions ({indices.high_humidity_hours} hours)")
        
        # Wet conditions
        if indices.consecutive_wet_days > 3:
            factors.append(f"Extended wet period ({indices.consecutive_wet_days} consecutive days)")
        elif indices.consecutive_wet_days > 1:
            factors.append(f"Consecutive wet days ({indices.consecutive_wet_days})")
        elif indices.consecutive_wet_days > 0:
            factors.append("Recent rainfall events")
        
        # Leaf wetness
        if indices.leaf_wetness_hours > 72:
            factors.append("Prolonged leaf wetness conditions")
        elif indices.leaf_wetness_hours > 36:
            factors.append("Extended leaf wetness periods")
        
        # Temperature stress
        if indices.temperature_stress:
            factors.append("Temperature stress conditions observed")
        
        # Wind conditions
        if indices.wind_risk:
            factors.append("High wind conditions present")
        
        # Pest development risk
        if indices.degree_days > 200:
            factors.append("High pest development potential (accumulated heat)")
        elif indices.degree_days > 100:
            factors.append("Moderate pest development conditions")
        
        # Forecast-based factors
        if forecast_data:
            upcoming_rain = sum(f.rainfall for f in forecast_data)
            if upcoming_rain > 20:
                factors.append("Heavy rainfall forecast - increased disease risk")
            elif upcoming_rain > 5:
                factors.append("Rainfall forecast - monitor for disease development")
            
            max_temp = max(f.temperature_max for f in forecast_data)
            if max_temp > 35:
                factors.append("High temperature forecast - heat stress risk")
            
            min_temp = min(f.temperature_min for f in forecast_data)
            if min_temp < 5:
                factors.append("Cold conditions forecast - frost risk")
        
        # Default if no specific factors
        if not factors:
            factors.append("Standard weather conditions - routine monitoring recommended")
        
        return factors
    
    def generate_weather_recommendations(self, indices: WeatherRiskIndices, 
                                      risk_band: WeatherRiskBand, 
                                      forecast_data: List[WeatherForecast]) -> List[str]:
        """
        Generate weather-based recommendations
        
        Args:
            indices: Weather risk indices
            risk_band: Overall risk band
            forecast_data: Forecast data
            
        Returns:
            List of recommendations
        """
        recommendations = []
        
        # High humidity recommendations
        if indices.high_humidity_hours > 48:
            recommendations.append("🚨 CRITICAL: Extended high humidity - immediate fungicide application recommended")
        elif indices.high_humidity_hours > 24:
            recommendations.append("⚠️ HIGH: Prolonged high humidity - monitor for fungal diseases closely")
        elif indices.high_humidity_hours > 12:
            recommendations.append("📊 MODERATE: High humidity conditions - increase monitoring frequency")
        
        # Wet conditions recommendations
        if indices.consecutive_wet_days > 4:
            recommendations.append("🚨 CRITICAL: Extended wet period - high disease pressure expected")
        elif indices.consecutive_wet_days > 2:
            recommendations.append("⚠️ HIGH: Consecutive wet days - disease risk elevated")
        elif indices.consecutive_wet_days > 0:
            recommendations.append("📊 MODERATE: Recent rainfall - monitor for disease development")
        
        # Temperature stress recommendations
        if indices.temperature_stress:
            recommendations.append("🌡️ Temperature stress detected - consider protective measures")
        
        # Wind recommendations
        if indices.wind_risk:
            recommendations.append("💨 High wind conditions - secure plants and monitor for damage")
        
        # Pest development recommendations
        if indices.degree_days > 200:
            recommendations.append("🐛 HIGH: Rapid pest development expected - increase scouting frequency")
        elif indices.degree_days > 100:
            recommendations.append("🐛 MODERATE: Pest development conditions - regular monitoring advised")
        
        # Forecast-based recommendations
        if forecast_data:
            upcoming_rain = sum(f.rainfall for f in forecast_data)
            if upcoming_rain > 20:
                recommendations.append("🌧️ Heavy rainfall forecast - apply preventive fungicide before rain")
            elif upcoming_rain > 5:
                recommendations.append("🌧️ Rainfall forecast - avoid irrigation and monitor conditions")
            
            max_temp = max(f.temperature_max for f in forecast_data)
            if max_temp > 35:
                recommendations.append("🔥 High temperature forecast - increase irrigation and provide shade")
            
            min_temp = min(f.temperature_min for f in forecast_data)
            if min_temp < 5:
                recommendations.append("❄️ Cold conditions forecast - protect sensitive plants from frost")
        
        # General recommendations based on risk band
        if risk_band == WeatherRiskBand.high:
            recommendations.append("🚨 HIGH RISK: Implement intensive monitoring and preventive measures")
        elif risk_band == WeatherRiskBand.medium:
            recommendations.append("⚠️ MEDIUM RISK: Maintain regular monitoring schedule")
        else:
            recommendations.append("✅ LOW RISK: Standard monitoring sufficient")
        
        # Default recommendation if none generated
        if not recommendations:
            recommendations.append("📊 Standard weather conditions - continue routine monitoring")
        
        return recommendations
    
    async def refresh_cache(self, lat: float, lon: float):
        """
        Refresh weather cache for a specific location
        
        Args:
            lat: Latitude
            lon: Longitude
        """
        try:
            # Clear existing cache for this location
            cache_keys_to_remove = []
            for key in self._cache.keys():
                if f"_{lat}_{lon}" in key:
                    cache_keys_to_remove.append(key)
            
            for key in cache_keys_to_remove:
                if key in self._cache:
                    del self._cache[key]
                if key in self._cache_ttl:
                    del self._cache_ttl[key]
            
            # Force fresh data fetch
            await self.get_current_weather(lat, lon)
            await self.get_forecast_data(lat, lon, 3)
            
            logger.info(f"Weather cache refreshed for location ({lat}, {lon})")
            
        except Exception as e:
            logger.error(f"Failed to refresh weather cache: {e}")
            raise


# Weather service utilities
import math


async def get_weather_service() -> WeatherService:
    """Get weather service instance (dependency injection)"""
    return WeatherService()


def calculate_heat_stress_index(temperature: float, humidity: float) -> float:
    """
    Calculate heat stress index
    
    Args:
        temperature: Temperature in Celsius
        humidity: Relative humidity percentage
        
    Returns:
        Heat stress index
    """
    # Simplified heat index calculation
    if temperature < 27:
        return 0.0
    
    heat_index = (
        -8.784695 +
        1.61139411 * temperature +
        2.338549 * humidity +
        -0.14611605 * temperature * humidity +
        -0.012308094 * temperature**2 +
        -0.016424828 * humidity**2 +
        0.002211732 * temperature**2 * humidity +
        0.00072546 * temperature * humidity**2 +
        -0.000003582 * temperature**2 * humidity**2
    )
    
    return max(0, heat_index - temperature)


def calculate_disease_pressure_index(temperature: float, humidity: float, 
                                   leaf_wetness_hours: int) -> float:
    """
    Calculate disease pressure index
    
    Args:
        temperature: Temperature in Celsius
        humidity: Relative humidity percentage
        leaf_wetness_hours: Hours of leaf wetness
        
    Returns:
        Disease pressure index (0-100)
    """
    # Optimal conditions for most fungal diseases
    temp_factor = 0
    if 15 <= temperature <= 25:
        temp_factor = 1.0
    elif 10 <= temperature <= 30:
        temp_factor = 0.7
    else:
        temp_factor = 0.3
    
    humidity_factor = min(1.0, humidity / 80.0)
    wetness_factor = min(1.0, leaf_wetness_hours / 12.0)
    
    disease_pressure = temp_factor * humidity_factor * wetness_factor * 100
    
    return min(100, disease_pressure)


# Global weather service instance
_weather_service: Optional[WeatherService] = None


def get_global_weather_service() -> WeatherService:
    """Get global weather service instance"""
    global _weather_service
    
    if _weather_service is None:
        _weather_service = WeatherService()
    
    return _weather_service


async def cleanup_weather_service():
    """Cleanup global weather service and close any open sessions"""
    global _weather_service
    if _weather_service is not None:
        try:
            await _weather_service.close()
        except Exception as e:
            logger.warning(f"Error closing weather service session: {e}")
        _weather_service = None
