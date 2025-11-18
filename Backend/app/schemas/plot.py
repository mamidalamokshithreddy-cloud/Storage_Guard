from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Area(BaseModel):
    value: float
    unit: str

class Location(BaseModel):
    village: str
    district: str
    coordinates: Optional[dict] = None

class CropStage(str, Enum):
    INITIAL = "initial"
    DEVELOPMENT = "development"
    MID = "mid"
    LATE = "late"

class Crop(BaseModel):
    name: str
    stage: CropStage
    planting_date: Optional[datetime] = None
    variety: Optional[str] = None

class Plot(BaseModel):
    id: str
    name: str
    area: Area
    location: Location
    crop: Crop
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class Measurement(BaseModel):
    value: float
    unit: str
    status: Optional[str] = None
    trend: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class WaterUsage(BaseModel):
    today: Measurement
    weekly: Measurement
    monthly: Measurement

class PlotMeasurements(BaseModel):
    soilMoisture: Measurement
    temperature: Measurement
    humidity: Measurement
    evapotranspiration: Measurement
    waterUsage: WaterUsage
    plot_id: str
    timestamp: datetime = Field(default_factory=datetime.now)

class WeatherForecast(BaseModel):
    nextRain: dict
    temperature: dict
    humidity: dict
    wind: dict

class PlotWeather(BaseModel):
    current: dict
    forecast: WeatherForecast
    plot_id: str
    timestamp: datetime = Field(default_factory=datetime.now)

class IrrigationScheduleStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Duration(BaseModel):
    value: int
    unit: str

class WaterAmount(BaseModel):
    value: float
    unit: str

class IrrigationSchedule(BaseModel):
    id: str
    plot_id: str
    startTime: datetime
    duration: Duration
    waterAmount: WaterAmount
    method: str
    status: IrrigationScheduleStatus
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class IrrigationScheduleCreate(BaseModel):
    plot_id: str
    autoMode: bool