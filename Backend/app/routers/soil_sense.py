"""
SoilSense API endpoints for soil health monitoring and analysis.

This module provides endpoints for:
- Plot-based soil health monitoring
- Lab report management  
- Soil parameter analysis and recommendations
- Health trends and insights
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session,joinedload
from sqlalchemy import func
from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional
import uuid

from app.connections.postgres_connection import get_db
from app.schemas.postgres_base import (
    SoilHealth,
    SoilTest,
    LabReport,
    Plot,
    ServiceType,
    Vendor,
    SoilThreshold,
)

soil_sense_router = APIRouter()

# Helper to parse UUIDs that may come with quotes from the client (e.g., "%22...%22")
def _parse_uuid_like(value: str) -> uuid.UUID:
    if value is None:
        raise ValueError("Missing UUID value")
    cleaned = value.strip().strip('"').strip("'")
    return uuid.UUID(cleaned)

# ========================
# Response Models
# ========================
class SoilHealthParameter(BaseModel):
    parameter: str
    value: Optional[float]
    ideal: Optional[str]
    status: Optional[str]

    class Config:
        orm_mode = True


# VendorScheduleResponse removed as it's not used in active endpoints




def _compute_overall_health(parameters: List[dict]) -> dict:
    """Compute an overall health score and status from individual parameter statuses.

    The function maps status strings to numeric scores and returns an average-based
    overall score, a simplified status label, and a convenience boolean that
    indicates if the overall status is "excellent".
    """
    if not parameters:
        return {"score": None, "status": None, "is_overall_excellent": False}

    status_to_score = {
        "excellent": 100,
        "good": 80,
        "warning": 60,
        "poor": 40,
    }

    scores: List[int] = []
    for p in parameters:
        status = (p.get("status") or "").strip().lower()
        if status in status_to_score:
            scores.append(status_to_score[status])
        else:
            # Unknown statuses get a neutral score
            scores.append(60)

    if not scores:
        return {"score": None, "status": None, "is_overall_excellent": False}

    avg_score = round(sum(scores) / len(scores))

    if avg_score >= 90:
        overall_status = "excellent"
    elif avg_score >= 75:
        overall_status = "good"
    elif avg_score >= 55:
        overall_status = "warning"
    else:
        overall_status = "poor"

    return {
        "score": avg_score,
        "status": overall_status,
        "is_overall_excellent": overall_status == "excellent",
    }

def _latest_by_parameter(rows: List[SoilHealth]) -> dict:
    """Return latest SoilHealth row per parameter name (case-insensitive)."""
    latest: dict = {}
    for r in sorted(rows, key=lambda x: x.created_at or datetime.min, reverse=True):
        key = (r.parameter or "").strip().lower()
        if key and key not in latest:
            latest[key] = r
    return latest

def _get_default_status(parameter: str, value: Optional[float]) -> Optional[str]:
    """Get default status for common soil parameters based on typical ranges."""
    if value is None:
        return None
    
    param = parameter.lower().strip()
    
    # Default ranges for common parameters
    if "ph" in param:
        if 6.0 <= value <= 7.5:
            return "excellent"
        elif 5.5 <= value < 6.0 or 7.5 < value <= 8.0:
            return "good"
        else:
            return "warning"
    elif "nitrogen" in param or param == "n":
        if value >= 60:
            return "excellent"
        elif value >= 40:
            return "good"
        else:
            return "warning"
    elif "phosphorus" in param or param == "p":
        if value >= 20:
            return "excellent"
        elif value >= 10:
            return "good"
        else:
            return "warning"
    elif "potassium" in param or param == "k":
        if value >= 150:
            return "excellent"
        elif value >= 100:
            return "good"
        else:
            return "warning"
    elif "organic" in param:
        if value >= 3.0:
            return "excellent"
        elif value >= 2.0:
            return "good"
        else:
            return "warning"
    elif "moisture" in param:
        if 40 <= value <= 60:
            return "excellent"
        elif 30 <= value < 40 or 60 < value <= 70:
            return "good"
        else:
            return "warning"
    
    return None

def _build_parameters_for_plot(db: Session, plot_id: uuid.UUID) -> List[dict]:
    """Build parameter list from SoilTest data for the plot.

    - Use latest reading from SoilTest for the plot
    - Infer status from default ranges for pH, nitrogen, phosphorus, potassium
    """
    # Get the latest soil test for this plot
    latest_test = (
        db.query(SoilTest)
        .filter(SoilTest.plot_id == plot_id)
        .order_by(SoilTest.test_date.desc(), SoilTest.created_at.desc())
        .first()
    )

    if not latest_test:
        return []

    result: List[dict] = []

    # Map soil test columns to parameters
    parameters = [
        ("pH", latest_test.ph_level, "6.0-7.5"),
        ("Nitrogen", latest_test.nitrogen_content, "40-60 ppm"),
        ("Phosphorus", latest_test.phosphorus_content, "20-30 ppm"),
        ("Potassium", latest_test.potassium_content, "150-200 ppm"),
    ]

    for param_name, value, ideal_range in parameters:
        if value is not None:
            float_value = float(value)
            status = _get_default_status(param_name, float_value)
            
            result.append({
                "parameter": param_name,
                "value": float_value,
                "ideal": ideal_range,
                "status": status,
            })

    return result





# ========================
# Plot-scoped endpoints
# ========================
@soil_sense_router.get("/plots")
def list_plots(db: Session = Depends(get_db)):
    plots = db.query(Plot).order_by(Plot.created_at.desc()).all()
    return [
        {
            "id": str(p.id),
            "plot_name": p.plot_name,
            "crop": p.crop,
            "season": p.season,
            "area": float(p.area) if p.area is not None else None,
            "status": p.status,
        }
        for p in plots
    ]


@soil_sense_router.get("/plots/{plot_id}/health-card")
def get_plot_health_card(plot_id: str, db: Session = Depends(get_db)):
    try:
        pid = _parse_uuid_like(plot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plot_id")

    # Ensure plot exists
    plot = db.query(Plot).filter(Plot.id == pid).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    # Get latest soil test date instead of SoilHealth
    latest_update = db.query(func.max(SoilTest.test_date)).filter(SoilTest.plot_id == pid).scalar()
    parameters = _build_parameters_for_plot(db, pid)

    overall = _compute_overall_health(parameters)

    return {
        "plot": {
            "id": str(plot.id),
            "plot_name": plot.plot_name,
            "crop": plot.crop,
            "season": plot.season,
        },
        "last_updated": latest_update.isoformat() if latest_update else None,
        "parameters": parameters,
        "overall": overall,
    }


@soil_sense_router.get("/plots/{plot_id}/lab-reports")
def get_plot_lab_reports(plot_id: str, db: Session = Depends(get_db)):
    try:
        pid = _parse_uuid_like(plot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plot_id")

    # Ensure plot exists
    plot = db.query(Plot).filter(Plot.id == pid).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    reports = (
        db.query(LabReport)
        .filter(LabReport.plot_id == pid)
        .order_by(LabReport.report_date.desc().nullslast())
        .all()
    )
    return [
        {
            "id": str(r.id),
            "plot_id": str(r.plot_id) if r.plot_id else None,
            "report_date": r.report_date.isoformat() if r.report_date else None,
            "summary": r.summary,
            "attachment_url": r.attachment_url,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


@soil_sense_router.get("/plots/{plot_id}/overview")
def get_plot_overview(plot_id: str, db: Session = Depends(get_db)):
    try:
        pid = _parse_uuid_like(plot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plot_id")

    plot = db.query(Plot).filter(Plot.id == pid).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    latest_update = db.query(func.max(SoilHealth.created_at)).filter(SoilHealth.plot_id == pid).scalar()
    reports = (
        db.query(LabReport)
        .filter(LabReport.plot_id == pid)
        .order_by(LabReport.report_date.desc().nullslast())
        .all()
    )

    parameters = _build_parameters_for_plot(db, pid)

    overall = _compute_overall_health(parameters)

    return {
        "plot": {
            "id": str(plot.id),
            "plot_name": plot.plot_name,
            "crop": plot.crop,
            "season": plot.season,
            "area": float(plot.area) if plot.area is not None else None,
            "status": plot.status,
        },
        "health_card": {
            "last_updated": latest_update.date().isoformat() if latest_update else None,
            "parameters": parameters,
            "overall": overall,
        },
        "lab_reports": [
            {
                "id": str(r.id),
                "plot_id": str(r.plot_id) if r.plot_id else None,
                "report_date": r.report_date.isoformat() if r.report_date else None,
                "summary": r.summary,
                "attachment_url": r.attachment_url,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reports
        ],
    }


@soil_sense_router.get("/plots/{plot_id}/soil-insights")
def get_plot_soil_insights(plot_id: str, period: str = "6months", db: Session = Depends(get_db)):
    # """Single endpoint providing trends, detailed analysis, and recommendations for a plot.

    # - trends: monthly averages for last 6 months (pH, nitrogen, phosphorus, potassium, organic, moisture)
    # - analysis: latest parameter values with ideal ranges and computed overall health
    # - recommendations: simple rule-based suggestions from latest readings
    # """
    try:
        pid = _parse_uuid_like(plot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plot_id")

    plot = db.query(Plot).filter(Plot.id == pid).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    # Detailed analysis
    latest_update = (
        db.query(func.max(SoilTest.test_date)).filter(SoilTest.plot_id == pid).scalar()
    )
    parameters = _build_parameters_for_plot(db, pid)
    overall = _compute_overall_health(parameters)

    # Historical trends (group by month) - use SoilTest data
    rows: List[SoilTest] = (
        db.query(SoilTest)
        .filter(SoilTest.plot_id == pid)
        .order_by(SoilTest.test_date.desc(), SoilTest.created_at.desc())
        .limit(500)
        .all()
    )

    def month_key(dt: Optional[date]) -> str:
        if not dt:
            return ""
        return dt.strftime("%Y-%m")

    buckets: dict = {}
    for r in rows:
        key = month_key(r.test_date)
        if not key:
            continue
        if key not in buckets:
            buckets[key] = {
                "ph": [],
                "nitrogen": [],
                "phosphorus": [],
                "potassium": [],
                "organic": [],
                "moisture": [],
            }
        
        # Add SoilTest values to the appropriate buckets
        if r.ph_level is not None:
            buckets[key]["ph"].append(float(r.ph_level))
        if r.nitrogen_content is not None:
            buckets[key]["nitrogen"].append(float(r.nitrogen_content))
        if r.phosphorus_content is not None:
            buckets[key]["phosphorus"].append(float(r.phosphorus_content))
        if r.potassium_content is not None:
            buckets[key]["potassium"].append(float(r.potassium_content))
        # Note: SoilTest doesn't have organic or moisture, so they'll remain empty

    def avg(arr: List[float]) -> Optional[float]:
        return round(sum(arr) / len(arr), 2) if arr else None

    # Sort by month and shape for frontend; include both 'ph' and 'pH' for compatibility
    month_names = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]
    trends = []
    for k in sorted(buckets.keys()):
        year, month = k.split("-")
        month_label = f"{month_names[int(month)-1]} {year}"
        v = buckets[k]
        ph_val = avg(v["ph"]) if v else None
        trends.append({
            "month": month_label,
            "ph": ph_val,
            "pH": ph_val,
            "nitrogen": avg(v["nitrogen"]) if v else None,
            "phosphorus": avg(v["phosphorus"]) if v else None,
            "potassium": avg(v["potassium"]) if v else None,
            "organic": avg(v["organic"]) if v else None,
            "moisture": avg(v["moisture"]) if v else None,
        })
    if period == "6months" and len(trends) > 6:
        trends = trends[-6:]

    # Recommendations (rule-based from latest soil test)
    latest_test = (
        db.query(SoilTest)
        .filter(SoilTest.plot_id == pid)
        .order_by(SoilTest.test_date.desc(), SoilTest.created_at.desc())
        .first()
    )

    ph_v = float(latest_test.ph_level) if latest_test and latest_test.ph_level else None
    n_v = float(latest_test.nitrogen_content) if latest_test and latest_test.nitrogen_content else None
    p_v = float(latest_test.phosphorus_content) if latest_test and latest_test.phosphorus_content else None
    k_v = float(latest_test.potassium_content) if latest_test and latest_test.potassium_content else None
    recs: List[dict] = []
    if ph_v is not None and 6.0 <= ph_v <= 7.5:
        recs.append({
            "priority": "high",
            "title": "Maintain Current pH Levels",
            "description": "pH is optimal.",
            "action": "Maintain current practices",
            "impact": "Excellent nutrient availability",
        })
    if n_v is not None and n_v < 40:
        recs.append({
            "priority": "medium",
            "title": "Increase Nitrogen",
            "description": "Nitrogen content is low.",
            "action": "Apply nitrogen-rich fertilizer",
            "impact": "Improved plant growth",
        })
    if p_v is not None and p_v < 20:
        recs.append({
            "priority": "medium",
            "title": "Increase Phosphorus",
            "description": "Phosphorus content is low.",
            "action": "Apply phosphorus fertilizer",
            "impact": "Better root development",
        })
    if k_v is not None and k_v < 150:
        recs.append({
            "priority": "medium",
            "title": "Increase Potassium",
            "description": "Potassium content is low.",
            "action": "Apply potassium fertilizer",
            "impact": "Improved disease resistance",
        })
    if not recs:
        recs = [{
            "priority": "low",
            "title": "Monitor Soil",
            "description": "No critical issues detected.",
            "action": "Regular monitoring",
            "impact": "Stable performance",
        }]

    return {
        "plot": {
            "id": str(plot.id),
            "plot_name": plot.plot_name,
            "crop": plot.crop,
            "season": plot.season,
        },
        "analysis": {
            "last_updated": latest_update.isoformat() if latest_update else None,
            "parameters": parameters,
            "overall": overall,
        },
        "trends": trends,
        "recommendations": recs,
    }


@soil_sense_router.post("/plots/{plot_id}/seed-sample-data")
def seed_sample_soil_data(plot_id: str, db: Session = Depends(get_db)):
    """Add sample soil health data for testing purposes."""
    try:
        pid = _parse_uuid_like(plot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plot_id")

    plot = db.query(Plot).filter(Plot.id == pid).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")

    # Sample soil parameters with realistic values
    sample_data = [
        {"parameter": "pH", "value": 6.8, "ideal": "6.0-7.5", "status": "excellent"},
        {"parameter": "Nitrogen", "value": 45, "ideal": "40-60 ppm", "status": "good"},
        {"parameter": "Phosphorus", "value": 25, "ideal": "20-30 ppm", "status": "excellent"},
        {"parameter": "Potassium", "value": 180, "ideal": "150-200 ppm", "status": "excellent"},
        {"parameter": "Organic Matter", "value": 2.5, "ideal": "2.0-4.0%", "status": "good"},
        {"parameter": "Moisture", "value": 15.2, "ideal": "12-18%", "status": "excellent"},
    ]

    # Add sample data
    for data in sample_data:
        # Check if this parameter already exists for this plot
        existing = db.query(SoilHealth).filter(
            SoilHealth.plot_id == pid,
            SoilHealth.parameter == data["parameter"]
        ).first()
        
        if not existing:
            soil_health = SoilHealth(
                plot_id=pid,
                parameter=data["parameter"],
                value=data["value"],
                ideal=data["ideal"],
                status=data["status"]
            )
            db.add(soil_health)

    db.commit()
    return {"message": f"Sample soil data added for plot {plot.plot_name}", "plot_id": str(pid)}


@soil_sense_router.get("/debug/orphaned-soil-tests")
def debug_orphaned_soil_tests(db: Session = Depends(get_db)):
    """Debug endpoint to find soil tests without corresponding plots."""
    # Get all unique plot_ids from soil_tests
    soil_test_plot_ids = db.query(SoilTest.plot_id).distinct().all()
    soil_test_ids = [str(row[0]) for row in soil_test_plot_ids if row[0]]
    
    # Get all plot_ids from plots table
    plot_ids = db.query(Plot.id).all()
    existing_plot_ids = [str(row[0]) for row in plot_ids]
    
    # Find orphaned soil tests (plot_id exists in soil_tests but not in plots)
    orphaned = [pid for pid in soil_test_ids if pid not in existing_plot_ids]
    
    # Get sample soil test data for each orphaned plot_id
    orphaned_data = []
    for pid in orphaned[:5]:  # Limit to first 5 for debugging
        test = db.query(SoilTest).filter(SoilTest.plot_id == pid).first()
        if test:
            orphaned_data.append({
                "plot_id": pid,
                "ph_level": float(test.ph_level) if test.ph_level else None,
                "nitrogen": float(test.nitrogen_content) if test.nitrogen_content else None,
                "phosphorus": float(test.phosphorus_content) if test.phosphorus_content else None,
                "potassium": float(test.potassium_content) if test.potassium_content else None,
                "test_date": test.test_date.isoformat() if test.test_date else None,
            })
    
    return {
        "total_soil_tests": len(soil_test_ids),
        "total_plots": len(existing_plot_ids),
        "orphaned_count": len(orphaned),
        "orphaned_sample": orphaned_data,
        "existing_plots": existing_plot_ids
    }


@soil_sense_router.post("/debug/create-missing-plot/{plot_id}")
def create_missing_plot(plot_id: str, db: Session = Depends(get_db)):
    """Create a missing plot record for an orphaned soil test."""
    try:
        pid = _parse_uuid_like(plot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plot_id")

    # Check if plot already exists
    existing_plot = db.query(Plot).filter(Plot.id == pid).first()
    if existing_plot:
        return {"message": "Plot already exists", "plot_id": str(pid)}

    # Check if there's a soil test for this plot_id
    soil_test = db.query(SoilTest).filter(SoilTest.plot_id == pid).first()
    if not soil_test:
        raise HTTPException(status_code=404, detail="No soil test found for this plot_id")

    # Create the missing plot record
    new_plot = Plot(
        id=pid,
        plot_name=f"Plot {str(pid)[:8]}",  # Use first 8 chars of UUID as name
        area=1.0,  # Default area
        status="ACTIVE"
    )
    
    db.add(new_plot)
    db.commit()
    
    return {
        "message": "Plot created successfully", 
        "plot_id": str(pid),
        "plot_name": new_plot.plot_name
    }

@soil_sense_router.get("/reports")
def get_recent_lab_reports(db: Session = Depends(get_db)):
   
    reports = (
        db.query(LabReport)
        .options(joinedload(LabReport.plot))
        .order_by(LabReport.created_at.desc())
        .limit(10)
        .all()
    )

    if not reports:
        return []

    data = []
    for r in reports:
        plot_name = r.plot.plot_name if r.plot else "Unknown Plot"
        data.append({
            "id": str(r.id),
            "labName": "AgroTech Laboratories",  # Placeholder lab name
            "testType": r.summary.split("\n")[0] if r.summary else "Comprehensive Soil Analysis",
            "sampleDate": str(r.created_at.date()) if r.created_at else "N/A",
            "reportDate": str(r.report_date) if r.report_date else "Pending",
            "status": "completed" if r.report_date else "in-progress",
            "cost": "₹1,200",
            "plots": [plot_name]
        })
    return data
@soil_sense_router.get("/integration-status")
def get_integration_status(db: Session = Depends(get_db)):
  
    total_tests = db.query(SoilTest).count()
    completed_tests = db.query(SoilTest).filter(SoilTest.status == "COMPLETED").count()
    connected_labs = db.query(Vendor).filter(Vendor.business_type == ServiceType.soil_testing).count()

    avg_accuracy = "99.4%"
    avg_turnaround = "32 hours"

    return {
        "total_tests": total_tests,
        "completed_tests": completed_tests,
        "connected_labs": connected_labs,
        "avg_accuracy": avg_accuracy,
        "avg_turnaround": avg_turnaround,
        "data_integration": "Automated"
    }


@soil_sense_router.get("/download/{report_id}")
def download_lab_report(report_id: str, db: Session = Depends(get_db)):
    """Download a lab report by ID."""
    try:
        rid = _parse_uuid_like(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report_id")

    report = db.query(LabReport).filter(LabReport.id == rid).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not report.attachment_url:
        raise HTTPException(status_code=404, detail="No attachment available for this report")

    # For now, return the attachment URL for redirect
    # In production, you might want to serve the actual file
    return {"download_url": report.attachment_url, "filename": f"soil_report_{report_id[:8]}.pdf"}

@soil_sense_router.get("/recommendations")
def get_soil_recommendations(plot_id: str, db: Session = Depends(get_db)):
    """
    Dynamic route for frontend Recommendations section.
    Combines soil health, irrigation, and fertilizer advice.
    """

    # 1️⃣ Fetch recent soil health records
    soil_records = (
        db.query(SoilHealth)
        .filter(SoilHealth.plot_id == plot_id)
        .order_by(SoilHealth.created_at.desc())
        .limit(5)
        .all()
    )
    if not soil_records:
        raise HTTPException(status_code=404, detail="No soil data found for this plot.")

    # 2️⃣ Fetch soil thresholds
    thresholds = {t.parameter.lower(): t for t in db.query(SoilThreshold).all()}

    # 3️⃣ Analyze data → build recommendations
    avg_values = [float(r.value or 0) for r in soil_records]
    avg_score = sum(avg_values) / len(avg_values)
    quality_status = "Excellent" if avg_score >= 8 else "Good" if avg_score >= 5 else "Poor"

    recommendations = [
        {
            "title": f"✓ Soil Quality: {quality_status}",
            "message": f"Your soil condition is {quality_status.lower()} for cultivation.",
            "type": "success",
        },
        {
            "title": "💧 Irrigation Recommendation",
            "message": "Apply drip irrigation. Current moisture level is optimal."
            if avg_score >= 5
            else "Use controlled irrigation to improve soil moisture.",
            "type": "primary",
        },
        {
            "title": "🌱 Fertilizer Advice",
            "message": thresholds.get("nitrogen").recommendation_action
            if "nitrogen" in thresholds and thresholds["nitrogen"].recommendation_action
            else "Apply organic compost before sowing. NPK levels are balanced.",
            "type": "accent",
        },
    ]

    # 4️⃣ Include last lab report summary (if available)
    lab_report = (
        db.query(LabReport)
        .filter(LabReport.plot_id == plot_id)
        .order_by(LabReport.report_date.desc())
        .first()
    )
    if lab_report:
        recommendations.append(
            {
                "title": "🧪 Latest Lab Report Summary",
                "message": lab_report.summary or "No summary provided.",
                "type": "muted",
            }
        )

    return {
        "plot_id": plot_id,
        "date": str(date.today()),
        "recommendations": recommendations,
    }