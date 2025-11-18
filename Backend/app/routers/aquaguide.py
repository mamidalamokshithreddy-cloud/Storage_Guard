from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter()

# Pydantic models
class Field(BaseModel):
    id: str
    name: str
    area: float
    crop: str
    soilMoisture: float

class WaterMetrics(BaseModel):
    totalWaterUsed: float
    efficiencyRate: float
    costSavings: float
    soilMoisture: float

class WeatherPoint(BaseModel):
    temperature: float
    humidity: float
    rainProbability: float

class WeatherForecast(BaseModel):
    date: str
    temperature: float
    humidity: float
    rainProbability: float

class WeatherData(BaseModel):
    current: WeatherPoint
    forecast: List[WeatherForecast]

class Price(BaseModel):
    amount: float
    currency: str

class IrrigationService(BaseModel):
    id: str
    title: str
    titleTelugu: str
    description: str
    descriptionTelugu: str
    duration: str
    price: Price
    available: bool

class Distance(BaseModel):
    value: float
    unit: str

class ExpertInfo(BaseModel):
    count: int
    nearestDistance: Distance
    availability: bool

# Sample data - replace with database queries in production
SAMPLE_FIELDS = [
    Field(
        id="field1",
        name="North Field",
        area=5.2,
        crop="Rice",
        soilMoisture=22
    ),
    Field(
        id="field2",
        name="South Field",
        area=3.8,
        crop="Cotton",
        soilMoisture=18
    )
]

@router.get("/fields", response_model=List[Field])
async def get_fields():
    return SAMPLE_FIELDS

@router.get("/water-metrics/{field_id}", response_model=WaterMetrics)
async def get_water_metrics(field_id: str):
    # In production, fetch from database based on field_id
    return WaterMetrics(
        totalWaterUsed=1250,
        efficiencyRate=87,
        costSavings=2400,
        soilMoisture=22
    )

@router.get("/weather/{field_id}", response_model=WeatherData)
async def get_weather(field_id: str):
    # In production, fetch from weather service based on field location
    current = WeatherPoint(
        temperature=28,
        humidity=65,
        rainProbability=30
    )
    
    # Generate 5-day forecast
    forecast = []
    base_date = datetime.now()
    for i in range(5):
        date = base_date + timedelta(days=i)
        forecast.append(
            WeatherForecast(
                date=date.strftime("%Y-%m-%d"),
                temperature=27 + i,
                humidity=70 - i,
                rainProbability=max(0, 40 - i * 5)
            )
        )
    
    return WeatherData(current=current, forecast=forecast)

@router.get("/services", response_model=List[IrrigationService])
async def get_services():
    # In production, fetch from database
    return [
        IrrigationService(
            id="irr-sch",
            title="Irrigation Scheduling",
            titleTelugu="నీటిపారుదల షెడ్యూలింగ్",
            description="AI-powered irrigation scheduling based on crop needs and weather",
            descriptionTelugu="పంట అవసరాలు మరియు వాతావరణం ఆధారంగా AI-ఆధారిత నీటిపారుదల షెడ్యూలింగ్",
            duration="3 months",
            price=Price(amount=1200, currency="INR"),
            available=True
        )
    ]

@router.get("/experts/{location}", response_model=ExpertInfo)
async def get_expert_info(location: str):
    # In production, fetch based on location
    return ExpertInfo(
        count=3,
        nearestDistance=Distance(value=5, unit="km"),
        availability=True
    )