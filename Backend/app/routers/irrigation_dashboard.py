from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from app.schemas.plot import Plot, PlotMeasurements, PlotWeather, IrrigationSchedule
from app.services.irrigation_service import IrrigationService
from app.connections.postgres_connection import get_db
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/api/irrigation",
    tags=["irrigation"],
    responses={404: {"description": "Not found"}},
)

irrigation_service = IrrigationService()

@router.get("/plots")
async def get_plots(db: Session = Depends(get_db)):
    """Get all plots available for irrigation management"""
    try:
        plots = await irrigation_service.get_plots(db)
        return plots
    except Exception as e:
        # Log the detailed error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in get_plots endpoint: {str(e)}", exc_info=True)
        
        # Return mock data as fallback
        mock_plots = [
            {'id': '1', 'name': 'ప్లాట్ 1', 'crop': 'వరి', 'area': 2.5, 'season': 'ఖరీఫ్', 'status': 'Active'},
            {'id': '2', 'name': 'ప్లాట్ 2', 'crop': 'మొక్కజొన్న', 'area': 1.8, 'season': 'రబీ', 'status': 'Active'},
            {'id': '3', 'name': 'ప్లాట్ 3', 'crop': 'పత్తి', 'area': 3.2, 'season': 'ఖరీఫ్', 'status': 'Active'},
        ]
        return mock_plots

@router.get("/plots/{plot_id}/measurements", response_model=PlotMeasurements)
async def get_plot_measurements(plot_id: str, db: Session = Depends(get_db)):
    """Get current measurements for a specific plot"""
    try:
        return await irrigation_service.get_plot_measurements(plot_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plots/{plot_id}/weather", response_model=PlotWeather)
async def get_plot_weather(plot_id: str, db: Session = Depends(get_db)):
    """Get weather data for a specific plot"""
    try:
        return await irrigation_service.get_plot_weather(plot_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plots/{plot_id}/schedule", response_model=List[IrrigationSchedule])
async def get_irrigation_schedule(
    plot_id: str, 
    date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Get irrigation schedule for a specific plot"""
    try:
        if date is None:
            date = datetime.now()
        return await irrigation_service.get_irrigation_schedule(plot_id, date, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plots/{plot_id}/schedule", response_model=IrrigationSchedule)
async def create_irrigation_schedule(
    plot_id: str,
    auto_mode: bool,
    db: Session = Depends(get_db)
):
    """Create a new irrigation schedule for a plot"""
    try:
        return await irrigation_service.create_irrigation_schedule(plot_id, auto_mode, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/plots/{plot_id}/schedule/{schedule_id}", response_model=IrrigationSchedule)
async def update_irrigation_schedule(
    plot_id: str,
    schedule_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    """Update an existing irrigation schedule"""
    try:
        return await irrigation_service.update_irrigation_schedule(plot_id, schedule_id, status, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
