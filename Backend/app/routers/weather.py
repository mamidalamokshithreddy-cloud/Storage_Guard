from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import logging
import os
from app.services.accuweather_service import create_weather_service
from app.connections.postgres_connection import get_db
from app.schemas.postgres_base import WeatherData

logger = logging.getLogger(__name__)
weather_router = APIRouter()

class WeatherRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    include_forecast: bool = Field(True)
    agricultural_insights: bool = Field(True)

class LocationWeatherRequest(BaseModel):
    location: str = Field(..., min_length=2)
    include_forecast: bool = Field(True)
    agricultural_insights: bool = Field(True)

@weather_router.get("/current")
async def get_current_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    include_forecast: bool = Query(True),
    agricultural_insights: bool = Query(True)
) -> Dict[str, Any]:
    try:
        api_key = os.getenv("WEATHER_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="AccuWeather API key not found")

        weather_service = create_weather_service(api_key, "accuweather")
        if include_forecast and agricultural_insights:
            weather_data = await weather_service.get_agricultural_weather(latitude, longitude)
        else:
            location_key = await weather_service._get_location_key(latitude, longitude)
            if location_key:
                current_conditions = await weather_service._get_current_conditions(location_key)
                weather_data = {
                    "current": {
                        "temperature": current_conditions.get("Temperature", {}).get("Metric", {}).get("Value", 25) if current_conditions else 25,
                        "humidity": current_conditions.get("RelativeHumidity", 65) if current_conditions else 65,
                        "weather_description": current_conditions.get("WeatherText", "Clear") if current_conditions else "Clear",
                        "timestamp": current_conditions.get("LocalObservationDateTime", "") if current_conditions else ""
                    },
                    "provider": "AccuWeather",
                    "location": f"{latitude}, {longitude}"
                }
            else:
                raise HTTPException(status_code=404, detail="Location not found")

        if not weather_data:
            raise HTTPException(status_code=503, detail="Weather data unavailable")

        response = {
            "status": "success",
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "weather_data": weather_data,
            "api_info": {"provider": weather_data.get("provider", "AccuWeather")}
        }
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@weather_router.post("/coordinates")
async def get_weather_by_coordinates(request: WeatherRequest) -> Dict[str, Any]:
    return await get_current_weather(
        latitude=request.latitude,
        longitude=request.longitude,
        include_forecast=request.include_forecast,
        agricultural_insights=request.agricultural_insights
    )

@weather_router.get("/agricultural-insights")
async def get_agricultural_weather_insights(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180)
) -> Dict[str, Any]:
    try:
        api_key = os.getenv("WEATHER_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="Weather service not configured")
        weather_service = create_weather_service(api_key, "accuweather")
        weather_data = await weather_service.get_agricultural_weather(latitude, longitude)
        if not weather_data or weather_data.get("provider") == "Fallback":
            raise HTTPException(status_code=503, detail="Weather data unavailable")
        agricultural_data = weather_data.get("agricultural_insights", {})
        current_conditions = weather_data.get("current", {})
        forecast_summary = weather_data.get("forecast", {}).get("summary", {})
        response = {
            "status": "success",
            "location": {"latitude": latitude, "longitude": longitude},
            "current_conditions": {"temperature": current_conditions.get("temperature", 25), "humidity": current_conditions.get("humidity", 65)},
            "agricultural_assessment": {"growing_conditions": agricultural_data.get("growing_conditions", "Unknown")},
            "forecast_summary": {"avg_temperature": forecast_summary.get("avg_temperature", current_conditions.get("temperature", 25))},
            "recommendations": {}
        }
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agricultural insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@weather_router.get("/test-locations")
async def get_test_locations() -> Dict[str, Any]:
    return {"test_locations": {"mumbai": {"latitude": 19.0760, "longitude": 72.8777}}}

@weather_router.get("/status")
async def get_weather_service_status() -> Dict[str, Any]:
    api_key = os.getenv("WEATHER_API_KEY", "")
    status = {"service": "AccuWeather", "integration_status": "Not configured", "api_key_status": "Missing"}
    if api_key:
        if api_key == "your-accuweather-api-key":
            status["integration_status"] = "Placeholder key detected"
            status["api_key_status"] = "Needs replacement"
        else:
            status["integration_status"] = "Configured"
            status["api_key_status"] = "Valid"
    return status

@weather_router.get("/db/latest")
async def get_latest_weather_from_db(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get latest weather data from database for a given location."""
    try:
        # Build query
        query = select(WeatherData).order_by(desc(WeatherData.fetched_at))
        
        # Add location filter if provided
        if latitude is not None and longitude is not None:
            # Add a small radius for floating point comparison
            query = query.filter(
                WeatherData.latitude >= latitude - 0.01,
                WeatherData.latitude <= latitude + 0.01,
                WeatherData.longitude >= longitude - 0.01,
                WeatherData.longitude <= longitude + 0.01
            )
        
        # Execute query
        result = await db.execute(query.limit(1))
        weather = result.scalar_one_or_none()
        
        if not weather:
            return {
                "status": "no_data",
                "message": "No weather data found for the specified location"
            }
        
        # Format response
        response = {
            "status": "success",
            "data": {
                "location": {
                    "latitude": float(weather.latitude),
                    "longitude": float(weather.longitude)
                },
                "conditions": {
                    "temperature": float(weather.temperature) if weather.temperature else None,
                    "humidity": float(weather.humidity) if weather.humidity else None,
                    "pressure": float(weather.pressure) if weather.pressure else None,
                    "wind_speed": float(weather.wind_speed) if weather.wind_speed else None,
                    "weather_description": weather.weather_description
                },
                "metadata": {
                    "source": weather.api_source,
                    "fetched_at": weather.fetched_at.isoformat() if weather.fetched_at else None,
                    "expires_at": weather.expires_at.isoformat() if weather.expires_at else None
                }
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to fetch weather data: {e}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to fetch weather data", "error": str(e)}
        )

@weather_router.get("/db/history")
async def get_weather_history_from_db(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get historical weather data from database for a given location."""
    try:
        # Build query
        query = select(WeatherData).order_by(desc(WeatherData.fetched_at))
        
        # Add location filter if provided
        if latitude is not None and longitude is not None:
            query = query.filter(
                WeatherData.latitude >= latitude - 0.01,
                WeatherData.latitude <= latitude + 0.01,
                WeatherData.longitude >= longitude - 0.01,
                WeatherData.longitude <= longitude + 0.01
            )
        
        # Add pagination
        query = query.offset(offset).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        weather_records = result.scalars().all()
        
        # Format response
        weather_history = []
        for weather in weather_records:
            weather_history.append({
                "location": {
                    "latitude": float(weather.latitude),
                    "longitude": float(weather.longitude)
                },
                "conditions": {
                    "temperature": float(weather.temperature) if weather.temperature else None,
                    "humidity": float(weather.humidity) if weather.humidity else None,
                    "pressure": float(weather.pressure) if weather.pressure else None,
                    "wind_speed": float(weather.wind_speed) if weather.wind_speed else None,
                    "weather_description": weather.weather_description
                },
                "metadata": {
                    "source": weather.api_source,
                    "fetched_at": weather.fetched_at.isoformat() if weather.fetched_at else None,
                    "expires_at": weather.expires_at.isoformat() if weather.expires_at else None
                }
            })
        
        return {
            "status": "success",
            "count": len(weather_history),
            "data": weather_history,
            "pagination": {
                "limit": limit,
                "offset": offset
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch weather history: {e}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to fetch weather history", "error": str(e)}
        )
