"""
Weather Context Node - Fetch weather data and calculate risk indices
"""

import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.schemas.postgres_base_models import WorkflowState, WeatherRisk, WeatherRiskIndices, WeatherRiskBand
from app.services.weather_service import WeatherService

logger = logging.getLogger(__name__)


async def weather_context_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Get weather context and calculate risk indices
    
    Args:
        state: Current workflow state
        
    Returns:
        Updated state with weather risk assessment
    """
    start_time = time.time()
    node_name = "weather_context"
    
    logger.info(
        f"🌤️ Starting weather context analysis",
        extra={"trace_id": state.trace_id}
    )
    
    try:
        # Ensure aiohttp session is closed properly
        async with WeatherService() as weather_service:
            # Extract commonly used payload fields up-front
            location = getattr(state.payload, 'location', None) if state.payload else None
            # Prefer provided current weather from payload when available
            provided_weather = getattr(state.payload, 'weather', None) if state.payload else None
            if provided_weather:
                weather_risk = await _get_weather_risk_without_location(
                    provided_weather,
                    state.trace_id
                )
            else:
                # Otherwise, try location-based lookup
                if location:
                    weather_risk = await _get_weather_risk_with_location(
                        weather_service, location, state.trace_id
                    )
                else:
                    # No weather and no location; use defaults
                    weather_risk = await _get_weather_risk_without_location(
                        None,
                        state.trace_id
                    )
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"✅ Weather context analysis completed",
            extra={
                "trace_id": state.trace_id,
                "weather_risk_band": weather_risk.risk_band.value,
                "has_location": location is not None,
                "processing_time": processing_time
            }
        )
        
        return {
            "weather_context": weather_risk,
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        # Don't fail the entire workflow for weather issues
        error_msg = f"Weather context analysis failed: {str(e)}"
        logger.warning(
            error_msg,
            extra={"trace_id": state.trace_id},
            exc_info=True
        )
        
        # Create default weather risk
        default_risk = WeatherRisk(
            indices=WeatherRiskIndices(),
            risk_band=WeatherRiskBand.medium,
            factors=["Weather data unavailable"]
        )
        
        processing_time = time.time() - start_time
        
        return {
            "weather_context": default_risk,
            "errors": state.errors + [error_msg],
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }


async def _get_weather_risk_with_location(weather_service: WeatherService, 
                                        location, trace_id: str) -> WeatherRisk:
    """
    Get weather risk assessment using location data
    
    Args:
        weather_service: Weather service instance
        location: Location object with lat/lon
        trace_id: Workflow trace ID
        
    Returns:
        Weather risk assessment
    """
    try:
        # Get historical data (last 7 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)
        
        historical_data = await weather_service.get_historical_data(
            lat=location.lat,
            lon=location.lon,
            from_date=start_date,
            to_date=end_date
        )
        
        # Get forecast data (next 3 days)
        forecast_data = await weather_service.get_forecast_data(
            lat=location.lat,
            lon=location.lon,
            days=3
        )
        
        # Calculate risk indices
        all_weather_data = historical_data + forecast_data
        risk_indices = weather_service.calculate_risk_indices(all_weather_data)
        
        # Determine risk band
        risk_band = weather_service.determine_risk_band(risk_indices)
        
        # Generate risk factors
        factors = _generate_risk_factors(risk_indices, forecast_data)
        
        logger.debug(
            f"🌤️ Weather risk calculated with location data",
            extra={
                "trace_id": trace_id,
                "risk_band": risk_band.value,
                "high_humidity_hours": risk_indices.high_humidity_hours
            }
        )
        
        return WeatherRisk(
            indices=risk_indices,
            risk_band=risk_band,
            factors=factors
        )
        
    except Exception as e:
        logger.warning(f"Failed to get weather data for location: {e}")
        # Fall back to medium risk
        return WeatherRisk(
            indices=WeatherRiskIndices(),
            risk_band=WeatherRiskBand.medium,
            factors=["Location-based weather data unavailable"]
        )


async def _get_weather_risk_without_location(weather_data, trace_id: str) -> WeatherRisk:
    """
    Get weather risk assessment using provided weather data or defaults
    
    Args:
        weather_data: Provided weather data (if any)
        trace_id: Workflow trace ID
        
    Returns:
        Weather risk assessment
    """
    try:
        if weather_data:
            # Calculate risk based on provided data
            risk_indices = _calculate_risk_from_current_weather(weather_data)
            risk_band = _determine_risk_band_from_indices(risk_indices)
            factors = _generate_risk_factors_from_current(weather_data)
            
            logger.debug(
                f"🌤️ Weather risk calculated from provided data",
                extra={
                    "trace_id": trace_id,
                    "temperature": weather_data.temperature,
                    "humidity": weather_data.humidity,
                    "risk_band": risk_band.value
                }
            )
        else:
            # Default to medium risk when no weather data available
            risk_indices = WeatherRiskIndices()
            risk_band = WeatherRiskBand.medium
            factors = ["No weather data provided - using default risk assessment"]
            
            logger.debug(
                f"🌤️ Using default weather risk assessment",
                extra={"trace_id": trace_id}
            )
        
        return WeatherRisk(
            indices=risk_indices,
            risk_band=risk_band,
            factors=factors
        )
        
    except Exception as e:
        logger.warning(f"Failed to assess weather risk: {e}")
        return WeatherRisk(
            indices=WeatherRiskIndices(),
            risk_band=WeatherRiskBand.medium,
            factors=["Weather risk assessment failed"]
        )


def _calculate_risk_from_current_weather(weather_data) -> WeatherRiskIndices:
    """
    Calculate risk indices from current weather data
    
    Args:
        weather_data: Current weather data
        
    Returns:
        Weather risk indices
    """
    indices = WeatherRiskIndices()
    
    # High humidity assessment
    if weather_data.humidity > 85:
        indices.high_humidity_hours = 12  # Assume current conditions persist
    elif weather_data.humidity > 75:
        indices.high_humidity_hours = 6
    
    # Rainfall assessment
    if weather_data.rainfall > 0:
        indices.consecutive_wet_days = 1
    
    # Temperature stress
    if weather_data.temperature > 35 or weather_data.temperature < 5:
        indices.temperature_stress = True
    
    # Wind assessment
    if weather_data.wind_speed > 20:  # km/h
        indices.wind_risk = True
    
    # Simple degree day calculation (simplified)
    if weather_data.temperature > 10:
        indices.degree_days = max(0, weather_data.temperature - 10)
    
    return indices


def _determine_risk_band_from_indices(indices: WeatherRiskIndices) -> WeatherRiskBand:
    """
    Determine risk band from weather indices
    
    Args:
        indices: Weather risk indices
        
    Returns:
        Weather risk band
    """
    risk_score = 0
    
    # High humidity contributes to fungal risk
    if indices.high_humidity_hours > 12:
        risk_score += 3
    elif indices.high_humidity_hours > 6:
        risk_score += 2
    elif indices.high_humidity_hours > 0:
        risk_score += 1
    
    # Wet conditions
    if indices.consecutive_wet_days > 3:
        risk_score += 3
    elif indices.consecutive_wet_days > 1:
        risk_score += 2
    elif indices.consecutive_wet_days > 0:
        risk_score += 1
    
    # Temperature stress
    if indices.temperature_stress:
        risk_score += 2
    
    # Wind risk
    if indices.wind_risk:
        risk_score += 1
    
    # Determine band
    if risk_score <= 2:
        return WeatherRiskBand.low
    elif risk_score <= 5:
        return WeatherRiskBand.medium
    else:
        return WeatherRiskBand.high


def _generate_risk_factors(indices: WeatherRiskIndices, forecast_data) -> list:
    """
    Generate list of weather risk factors
    
    Args:
        indices: Weather risk indices
        forecast_data: Forecast data
        
    Returns:
        List of risk factors
    """
    factors = []
    
    if indices.high_humidity_hours > 12:
        factors.append(f"Extended high humidity ({indices.high_humidity_hours} hours)")
    elif indices.high_humidity_hours > 0:
        factors.append(f"High humidity periods ({indices.high_humidity_hours} hours)")
    
    if indices.consecutive_wet_days > 1:
        factors.append(f"Consecutive wet days ({indices.consecutive_wet_days})")
    elif indices.consecutive_wet_days > 0:
        factors.append("Recent rainfall")
    
    if indices.temperature_stress:
        factors.append("Temperature stress conditions")
    
    if indices.wind_risk:
        factors.append("High wind conditions")
    
    if indices.degree_days > 100:
        factors.append("High pest development potential")
    
    # Add forecast-based factors
    if forecast_data:
        upcoming_rain = any(day.rainfall > 5 for day in forecast_data)
        if upcoming_rain:
            factors.append("Rain forecast - increased disease risk")
        
        high_temp_forecast = any(day.temperature > 30 for day in forecast_data)
        if high_temp_forecast:
            factors.append("High temperature forecast")
    
    if not factors:
        factors.append("Standard weather conditions")
    
    return factors


def _generate_risk_factors_from_current(weather_data) -> list:
    """
    Generate risk factors from current weather data only
    
    Args:
        weather_data: Current weather data
        
    Returns:
        List of risk factors
    """
    factors = []
    
    if weather_data.humidity > 85:
        factors.append(f"Very high humidity ({weather_data.humidity}%)")
    elif weather_data.humidity > 75:
        factors.append(f"High humidity ({weather_data.humidity}%)")
    
    if weather_data.rainfall > 10:
        factors.append(f"Heavy rainfall ({weather_data.rainfall}mm)")
    elif weather_data.rainfall > 0:
        factors.append(f"Light rainfall ({weather_data.rainfall}mm)")
    
    if weather_data.temperature > 35:
        factors.append(f"Very high temperature ({weather_data.temperature}°C)")
    elif weather_data.temperature < 5:
        factors.append(f"Very low temperature ({weather_data.temperature}°C)")
    
    if weather_data.wind_speed > 25:
        factors.append(f"Strong winds ({weather_data.wind_speed} km/h)")
    elif weather_data.wind_speed > 15:
        factors.append(f"Moderate winds ({weather_data.wind_speed} km/h)")
    
    if not factors:
        factors.append("Current weather conditions analyzed")
    
    return factors
