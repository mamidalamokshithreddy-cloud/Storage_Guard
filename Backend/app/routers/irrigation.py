from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.services.irrigation_service import irrigation_service

router = APIRouter(prefix="/api/irrigation", tags=["irrigation"])

class IrrigationRequest(BaseModel):
    plot_id: str
    soil_moisture: float = 50
    crop_type: str = "wheat"
    crop_stage: str = "vegetative"
    days_since_planting: int = 30
    location: Dict[str, float] = {"lat": 0.0, "lon": 0.0}
    include_llm_analysis: bool = True

@router.post("/predict")
async def predict_irrigation_needs(request: IrrigationRequest):
    """Predict irrigation needs for a specific plot"""
    try:
        plot_data = request.dict()
        result = await irrigation_service.predict_irrigation_needs(
            plot_data, request.include_llm_analysis
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_service_status():
    """Get irrigation service status"""
    try:
        return irrigation_service.get_service_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
