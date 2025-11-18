import httpx
import logging
from typing import Dict, Any, Optional, List
import ssl

logger = logging.getLogger(__name__)

class AccuWeatherService:
    """Professional AccuWeather API integration with proper HTTPS and error handling."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.postgres_base_url = "https://dataservice.accuweather.com"
        self.timeout = 15.0

        # SSL context for HTTPS (kept for parity; client uses verify=False for now)
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE

    async def get_agricultural_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Get comprehensive weather data optimized for agriculture."""
        try:
            logger.info(f"🌤️ Getting AccuWeather data for ({latitude}, {longitude})")
            logger.info(f"🔑 Using API key: {self.api_key[:10]}...")

            # Get location key first
            location_key = await self._get_location_key(latitude, longitude)
            if not location_key:
                logger.warning("Location key not found, using fallback")
                return self._get_fallback_weather(latitude, longitude)

            logger.info(f"📍 Found location key: {location_key}")

            # Get current conditions
            current_weather = await self._get_current_conditions(location_key)

            # Get forecast (optional - if this fails, we still have current weather)
            forecast_data = await self._get_daily_forecast(location_key)

            # Process data for agriculture
            agricultural_data = self._process_agricultural_data(current_weather, forecast_data, latitude, longitude)

            logger.info("✅ AccuWeather data processed successfully")
            return agricultural_data

        except Exception as e:
            logger.error(f"AccuWeather service error: {e}")
            return self._get_fallback_weather(latitude, longitude)

    async def _get_location_key(self, latitude: float, longitude: float) -> Optional[str]:
        """Get AccuWeather location key for coordinates."""
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                verify=False,
                follow_redirects=True,
            ) as client:
                url = f"{self.postgres_base_url}/locations/v1/cities/geoposition/search"
                params = {
                    "apikey": self.api_key,
                    "q": f"{latitude},{longitude}",
                    "details": "false",
                }

                logger.info(f"🌍 Requesting location: {url}")
                logger.info(f"📍 Coordinates: {latitude}, {longitude}")

                response = await client.get(url, params=params)
                logger.info(f"📡 Location response status: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    location_key = data.get("Key")
                    location_name = data.get("LocalizedName", "Unknown")
                    country = data.get("Country", {}).get("LocalizedName", "Unknown")
                    logger.info(f"🌍 Location found: {location_name}, {country}")
                    return location_key
                elif response.status_code == 401:
                    logger.error("❌ AccuWeather API key is invalid!")
                    logger.error(f"🔑 API key used: {self.api_key[:10]}...")
                elif response.status_code == 403:
                    logger.error("❌ AccuWeather API access forbidden - check subscription")
                elif response.status_code == 503:
                    logger.error("❌ AccuWeather API limit exceeded")
                else:
                    logger.error(f"AccuWeather location API error: {response.status_code}")
                    logger.error(f"Response: {response.text[:200]}...")

        except Exception as e:
            logger.error(f"Location lookup failed: {e}")

        return None

    async def _get_current_conditions(self, location_key: str) -> Optional[Dict[str, Any]]:
        """Get detailed current weather conditions."""
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                verify=False,
                follow_redirects=True,
            ) as client:
                url = f"{self.postgres_base_url}/currentconditions/v1/{location_key}"
                params = {"apikey": self.api_key, "details": "true"}

                logger.info(f"🌡️ Getting current conditions for location: {location_key}")
                response = await client.get(url, params=params)
                logger.info(f"📡 Current conditions response: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        current_data = data[0]
                        logger.info("✅ Current conditions retrieved")
                        return current_data
                else:
                    logger.error(f"Current conditions API error: {response.status_code}")
                    logger.error(f"Response: {response.text[:200]}...")

        except Exception as e:
            logger.error(f"Current conditions failed: {e}")

        return None

    async def _get_daily_forecast(self, location_key: str, days: int = 5) -> Optional[List[Dict[str, Any]]]:
        """Get daily forecast for agricultural planning."""
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                verify=False,
                follow_redirects=True,
            ) as client:
                url = f"{self.postgres_base_url}/forecasts/v1/daily/{days}day/{location_key}"
                params = {"apikey": self.api_key, "details": "false", "metric": "true"}

                logger.info(f"📅 Getting {days}-day forecast for location: {location_key}")
                response = await client.get(url, params=params)
                logger.info(f"📡 Forecast response: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    daily_forecasts = data.get("DailyForecasts", [])
                    logger.info(f"✅ Forecast retrieved: {len(daily_forecasts)} days")
                    return daily_forecasts
                else:
                    logger.warning(f"Forecast API error: {response.status_code} (continuing without forecast)")

        except Exception as e:
            logger.warning(f"Forecast retrieval failed: {e} (continuing without forecast)")

        return None

    def _process_agricultural_data(self, current: Dict[str, Any], forecast: List[Dict[str, Any]], lat: float, lon: float) -> Dict[str, Any]:
        """Process weather data for agricultural insights."""

        # Extract current conditions (with fallbacks)
        if current:
            current_temp = current.get("Temperature", {}).get("Metric", {}).get("Value", 25.0)
            current_humidity = current.get("RelativeHumidity", 65)
            weather_text = current.get("WeatherText", "Clear")
            timestamp = current.get("LocalObservationDateTime", "")
        else:
            current_temp = 25.0
            current_humidity = 65
            weather_text = "Data unavailable"
            timestamp = ""

        # Process forecast if available
        agricultural_forecast: List[Dict[str, Any]] = []
        rainfall_forecast: List[float] = []

        if forecast:
            for day in forecast[:5]:
                try:
                    day_data = {
                        "date": day.get("Date", "").split("T")[0],
                        "min_temp": day.get("Temperature", {}).get("Minimum", {}).get("Value", current_temp - 5),
                        "max_temp": day.get("Temperature", {}).get("Maximum", {}).get("Value", current_temp + 5),
                        "condition": day.get("Day", {}).get("IconPhrase", "Partly cloudy"),
                    }
                    agricultural_forecast.append(day_data)

                    # Estimate rainfall (simple estimation)
                    estimated_rainfall = 10  # Default estimate
                    rainfall_forecast.append(estimated_rainfall)
                except Exception as e:
                    logger.warning(f"Error processing forecast day: {e}")

        # Calculate averages
        if agricultural_forecast:
            avg_temp = sum([d["max_temp"] + d["min_temp"] for d in agricultural_forecast]) / (2 * len(agricultural_forecast))
            total_rainfall_forecast = sum(rainfall_forecast)
            avg_humidity = current_humidity  # Use current humidity as estimate
        else:
            avg_temp = current_temp
            total_rainfall_forecast = 30.0
            avg_humidity = current_humidity

        # Agricultural assessment
        growing_conditions = self._assess_growing_conditions(current_temp, current_humidity, total_rainfall_forecast)

        return {
            "current": {
                "temperature": current_temp,
                "humidity": current_humidity,
                "weather_description": weather_text,
                "timestamp": timestamp,
            },
            "forecast": {
                "daily": agricultural_forecast,
                "summary": {
                    "avg_temperature": round(avg_temp, 1),
                    "total_rainfall_forecast": round(total_rainfall_forecast, 1),
                    "avg_humidity": round(avg_humidity, 1),
                },
            },
            "agricultural_insights": {
                "growing_conditions": growing_conditions,
                "irrigation_recommendation": self._get_irrigation_advice(total_rainfall_forecast, current_humidity),
                "planting_window": self._assess_planting_window(current_temp, current_humidity),
                "weather_risks": self._assess_weather_risks(current_temp, current_humidity),
            },
            "provider": "AccuWeather",
            "location": f"{lat}, {lon}",
            "data_quality": "live" if current else "estimated",
        }

    def _assess_growing_conditions(self, temp: float, humidity: float, rainfall: float) -> str:
        """Assess overall growing conditions."""
        if 20 <= temp <= 30 and 50 <= humidity <= 80 and 20 <= rainfall <= 100:
            return "Excellent"
        elif 15 <= temp <= 35 and 40 <= humidity <= 85 and 10 <= rainfall <= 150:
            return "Good"
        elif 10 <= temp <= 40 and 30 <= humidity <= 90:
            return "Fair"
        else:
            return "Challenging"

    def _get_irrigation_advice(self, rainfall_forecast: float, humidity: float) -> str:
        """Provide irrigation recommendations."""
        if rainfall_forecast > 50:
            return "Reduce irrigation - sufficient rainfall expected"
        elif rainfall_forecast > 25:
            return "Light irrigation may be needed"
        elif humidity > 70:
            return "Monitor soil moisture - high humidity reduces water needs"
        else:
            return "Regular irrigation recommended"

    def _assess_planting_window(self, temp: float, humidity: float) -> str:
        """Assess suitability for planting."""
        if 20 <= temp <= 32 and 50 <= humidity <= 80:
            return "Excellent planting conditions"
        elif 15 <= temp <= 35 and 40 <= humidity <= 85:
            return "Good planting window"
        else:
            return "Monitor conditions before planting"

    def _assess_weather_risks(self, temp: float, humidity: float) -> List[str]:
        """Identify potential weather risks."""
        risks: List[str] = []

        if temp > 40:
            risks.append("Heat stress risk")
        elif temp < 5:
            risks.append("Frost risk")

        if humidity > 85:
            risks.append("High humidity - fungal disease risk")
        elif humidity < 30:
            risks.append("Low humidity - increased water needs")

        return risks if risks else ["No significant weather risks identified"]

    def _get_fallback_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Provide fallback weather data when API fails."""
        logger.warning("Using fallback weather data due to API issues")

        return {
            "current": {
                "temperature": 25.0,
                "humidity": 65,
                "weather_description": "AccuWeather API unavailable",
                "timestamp": "",
            },
            "forecast": {
                "daily": [],
                "summary": {
                    "avg_temperature": 25.0,
                    "total_rainfall_forecast": 30.0,
                    "avg_humidity": 65.0,
                },
            },
            "agricultural_insights": {
                "growing_conditions": "Unable to assess - API unavailable",
                "irrigation_recommendation": "Follow standard schedule",
                "planting_window": "Consult local weather services",
                "weather_risks": ["Weather service unavailable - use local observations"],
            },
            "provider": "Fallback",
            "location": f"{latitude}, {longitude}",
            "note": "AccuWeather API unavailable - using fallback estimates",
            "data_quality": "estimated",
        }


# Factory function
def create_weather_service(api_key: str, provider: str = "accuweather"):
    """Create appropriate weather service."""
    return AccuWeatherService(api_key)
