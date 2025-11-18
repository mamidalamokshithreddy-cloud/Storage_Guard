"""
Storage Guard Router - Comprehensive Storage & Logistics Management
Organized into logical sections for easy navigation
"""

import time
from typing import List, Optional
import re
from uuid import UUID
from datetime import datetime, timezone, timedelta
from pathlib import Path
import shutil
from fastapi import (
    APIRouter, File, UploadFile, HTTPException, Depends, Request, status, Form
)
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.schemas import postgres_base_models as schemas
from app.schemas import postgres_base as models
from pydantic import BaseModel
from app.core.config import settings
from app.agents.storage_guard import StorageGuardAgent
from app.models.llm_manager import LLMManager
from app.connections.postgres_connection import get_db
from app.services import storage_guard_service as service
from app.services import booking_service


storage_guard_router = APIRouter()


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_storage_guard_agent(request: Request) -> StorageGuardAgent:
    """Get Storage Guard Agent with fallback initialization"""
    agent = getattr(request.app.state, 'storage_guard_agent', None)
    if agent is None:
        agent = StorageGuardAgent()
        request.app.state.storage_guard_agent = agent
    return agent


def get_llm_manager(request: Request) -> LLMManager:
    """Get LLM Manager with fallback initialization"""
    manager = getattr(request.app.state, 'llm_manager', None)
    if manager is None:
        from app.models.llm_manager import get_llm_manager as create_llm_manager
        manager = create_llm_manager()
        request.app.state.llm_manager = manager
    return manager


# =============================================================================
# SECTION 1: HEALTH & DASHBOARD
# =============================================================================

@storage_guard_router.get("/health")
async def health_check(request: Request):
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "storage_guard_agent": hasattr(request.app.state, 'storage_guard_agent') and request.app.state.storage_guard_agent is not None,
            "llm_manager": hasattr(request.app.state, 'llm_manager') and request.app.state.llm_manager is not None,
        },
    }


@storage_guard_router.get("/dashboard")
def get_storage_dashboard(db: Session = Depends(get_db)):
    """
    Main dashboard - Overall storage operations summary
    Shows: bookings, RFQs, jobs, recent activities
    """
    try:
        # Get direct bookings
        total_bookings = db.query(models.StorageBooking).count()
        active_bookings = db.query(models.StorageBooking).filter(
            models.StorageBooking.booking_status.in_(['confirmed', 'active'])
        ).count()
        
        # Get RFQs
        storage_rfqs = db.query(models.StorageRFQ).all()
        rfq_count_by_status = {}
        for rfq in storage_rfqs:
            status = rfq.status
            rfq_count_by_status[status] = rfq_count_by_status.get(status, 0) + 1
        
        # Get recent activities
        recent_bookings = db.query(models.StorageBooking).order_by(
            models.StorageBooking.created_at.desc()
        ).limit(5).all()
        
        return {
            "status": "success",
            "summary": {
                "total_direct_bookings": total_bookings,
                "active_bookings": active_bookings,
                "total_rfqs": len(storage_rfqs),
                "rfq_by_status": rfq_count_by_status
            },
            "recent_bookings": [
                {
                    "id": str(b.id),
                    "crop_type": b.crop_type,
                    "quantity_kg": b.quantity_kg,
                    "status": b.booking_status,
                    "created_at": b.created_at.isoformat() if b.created_at else None
                }
                for b in recent_bookings
            ]
        }
    except Exception as e:
        print(f"Dashboard error: {e}")
        return {
            "status": "error",
            "message": str(e),
            "summary": {}
        }


# =============================================================================
# SECTION 2: AI ANALYSIS & RECOMMENDATIONS
# =============================================================================

@storage_guard_router.post("/analyze", response_model=schemas.AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    farmer_id: Optional[UUID] = None,
    crop_type: Optional[str] = Form(None),  # Accept crop type from user
    storage_guard: StorageGuardAgent = Depends(get_storage_guard_agent),
    db: Session = Depends(get_db),
):
    """
    AI-powered crop quality analysis
    Returns: crop type, grade, defects, shelf life
    Auto-creates RFQ for storage bidding
    
    crop_type: User-specified crop name (overrides AI detection)
    """
    start_time = time.time()

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_data = await file.read()
    quality_report = storage_guard.analyze_image(image_data)
    
    # Override AI detection with user input if provided
    if crop_type:
        quality_report.crop_detected = crop_type.strip().title()
        print(f"🌾 Using user-specified crop: {crop_type}")
    processing_time = time.time() - start_time

    # Store analysis
    inspection_id = None
    try:
        defects_json = []
        if hasattr(quality_report, 'defects') and quality_report.defects:
            for defect in quality_report.defects:
                if hasattr(defect, '__dict__'):
                    defect_dict = {
                        'type': getattr(defect, 'type', 'unknown'),
                        'confidence': getattr(defect, 'confidence', 0),
                        'bounding_box': getattr(defect, 'bounding_box', [])
                    }
                    defects_json.append(defect_dict)
                else:
                    defects_json.append(defect)
        
        crop_inspection = models.CropInspection(
            farmer_id=farmer_id,
            crop_detected=quality_report.crop_detected if hasattr(quality_report, 'crop_detected') and quality_report.crop_detected else 'unknown',
            grade=getattr(quality_report, 'overall_quality', getattr(quality_report, 'grade', 'ungraded')),
            defects=defects_json,
            recommendation=getattr(quality_report, 'recommendation', 'No specific recommendations'),
            image_urls=[file.filename],
            shelf_life_days=getattr(quality_report, 'shelf_life_days', None)
        )
        db.add(crop_inspection)
        db.commit()
        db.refresh(crop_inspection)
        inspection_id = crop_inspection.id
        
        # Auto-create RFQ for vendor bidding
        if farmer_id:
            try:
                # Use correct crop name from quality report
                detected_crop = quality_report.crop_detected if hasattr(quality_report, 'crop_detected') and quality_report.crop_detected else 'unknown'
                shelf_life = getattr(quality_report, 'shelf_life_days', 30)
                
                auto_rfq = models.StorageRFQ(
                    requester_id=farmer_id,
                    crop=detected_crop,
                    quantity_kg=500,
                    storage_type="COLD" if "cold" in getattr(quality_report, 'recommendation', '').lower() else "DRY",
                    duration_days=shelf_life if shelf_life else 30,
                    max_budget=25000.0,
                    origin_lat=17.385,
                    origin_lon=78.486,
                    status="OPEN"
                )
                db.add(auto_rfq)
                db.commit()
                print(f"✅ Auto-created RFQ for farmer {farmer_id} - {detected_crop}")
            except Exception as rfq_error:
                print(f"⚠️ Failed to auto-create RFQ: {rfq_error}")
                db.rollback()
    except Exception as e:
        print(f"⚠️ Failed to save analysis: {e}")
        db.rollback()

    return schemas.AnalysisResponse(
        success=True,
        message="Analysis completed successfully. RFQ created for vendor bidding.",
        report=quality_report,
        processing_time=round(processing_time, 3),
    )


@storage_guard_router.post("/analyze-and-suggest")
async def analyze_and_suggest_storage(
    file: UploadFile = File(...),
    farmer_id: UUID = None,
    farmer_lat: float = None,
    farmer_lon: float = None,
    crop_type: Optional[str] = Form(None),  # Accept crop type from user
    quantity_kg: Optional[float] = Form(500),  # Default quantity
    duration_days: Optional[int] = Form(None),  # Storage duration
    max_distance_km: float = 50.0,
    max_results: int = 5,
    storage_guard: StorageGuardAgent = Depends(get_storage_guard_agent),
    db: Session = Depends(get_db)
):
    """
    🎯 MAIN BOOKING FLOW - AI analysis + storage suggestions
    
    1. Analyze crop image quality (with optional user-specified crop type)
    2. Get nearby storage locations with accurate pricing
    3. Auto-create RFQ for vendor bidding
    4. Return suggestions sorted by distance & rating
    
    crop_type: User-specified crop name (overrides AI detection)
    quantity_kg: Amount to store (default: 500 kg)
    duration_days: Storage duration (default: based on shelf life)
    """
    start_time = time.time()
    
    if not farmer_lat or not farmer_lon:
        raise HTTPException(status_code=400, detail="Farmer location (lat, lon) required")
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # AI Analysis
    image_data = await file.read()
    quality_report = storage_guard.analyze_image(image_data)
    
    # Override AI detection with user input if provided
    if crop_type:
        quality_report.crop_detected = crop_type.strip().title()
        print(f"🌾 Using user-specified crop: {crop_type}")
    
    # Store analysis
    inspection_id = None
    try:
        defects_json = []
        if hasattr(quality_report, 'defects') and quality_report.defects:
            for defect in quality_report.defects:
                if hasattr(defect, '__dict__'):
                    defect_dict = {
                        'type': getattr(defect, 'type', 'unknown'),
                        'confidence': getattr(defect, 'confidence', 0),
                        'bounding_box': getattr(defect, 'bounding_box', [])
                    }
                    defects_json.append(defect_dict)
                else:
                    defects_json.append(defect)
        
        # Use correct crop name from quality report
        detected_crop = quality_report.crop_detected if hasattr(quality_report, 'crop_detected') and quality_report.crop_detected else 'unknown'
        
        crop_inspection = models.CropInspection(
            farmer_id=farmer_id,
            crop_detected=detected_crop,
            grade=getattr(quality_report, 'overall_quality', getattr(quality_report, 'grade', 'ungraded')),
            defects=defects_json,
            recommendation=getattr(quality_report, 'recommendation', 'No specific recommendations'),
            image_urls=[file.filename],
            shelf_life_days=getattr(quality_report, 'shelf_life_days', None)
        )
        db.add(crop_inspection)
        db.commit()
        db.refresh(crop_inspection)
        inspection_id = crop_inspection.id
        
        # Auto-create RFQ from quality analysis
        if farmer_id:
            try:
                shelf_life = getattr(quality_report, 'shelf_life_days', 30)
                storage_duration = duration_days if duration_days else (shelf_life if shelf_life else 30)
                
                # Determine storage type based on crop and recommendation
                storage_type = "COLD"
                if "cold" in getattr(quality_report, 'recommendation', '').lower():
                    storage_type = "COLD"
                elif "dry" in getattr(quality_report, 'recommendation', '').lower():
                    storage_type = "DRY"
                
                auto_rfq = models.StorageRFQ(
                    requester_id=farmer_id,
                    crop=detected_crop,
                    quantity_kg=quantity_kg,
                    storage_type=storage_type,
                    duration_days=storage_duration,
                    max_budget=25000.0,
                    origin_lat=farmer_lat,
                    origin_lon=farmer_lon,
                    status="OPEN"
                )
                db.add(auto_rfq)
                db.commit()
                print(f"✅ Auto-created RFQ: {detected_crop}, {quantity_kg}kg, {storage_duration} days")
            except Exception as rfq_error:
                print(f"⚠️ Failed to auto-create RFQ: {rfq_error}")
                db.rollback()
    except Exception as e:
        print(f"⚠️ Failed to save analysis: {e}")
        db.rollback()
    
    # Get storage suggestions with correct crop and quantity
    detected_crop = quality_report.crop_detected if hasattr(quality_report, 'crop_detected') and quality_report.crop_detected else 'unknown'
    suggestions = booking_service.get_storage_suggestions(
        db=db,
        farmer_lat=farmer_lat,
        farmer_lon=farmer_lon,
        crop_type=detected_crop,
        quantity_kg=quantity_kg,
        max_distance_km=max_distance_km,
        limit=max_results
    )
    
    processing_time = time.time() - start_time
    
    return {
        "success": True,
        "analysis": quality_report.model_dump() if hasattr(quality_report, 'model_dump') else quality_report.__dict__,
        "inspection_id": str(inspection_id) if inspection_id else None,
        "suggestions": [s.model_dump() for s in suggestions],
        "total_suggestions": len(suggestions),
        "processing_time": round(processing_time, 3)
    }


# =============================================================================
# SECTION 3: DIRECT BOOKING (NEW - INSTANT BOOKING)
# =============================================================================

@storage_guard_router.post("/bookings", response_model=schemas.StorageBookingOut)
def create_direct_booking(
    booking_data: schemas.StorageBookingCreate,
    farmer_id: UUID,
    db: Session = Depends(get_db)
):
    """
    📦 Create direct storage booking (no RFQ/bidding)
    Instant booking with fixed pricing
    """
    try:
        booking = booking_service.create_storage_booking(
            db=db,
            farmer_id=farmer_id,
            booking_data=booking_data
        )
        return booking
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating booking: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@storage_guard_router.get("/bookings/{booking_id}", response_model=schemas.StorageBookingOut)
def get_booking_details(
    booking_id: UUID,
    db: Session = Depends(get_db)
):
    """Get booking details by ID"""
    booking = db.query(models.StorageBooking).filter(
        models.StorageBooking.id == booking_id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return booking


@storage_guard_router.get("/my-bookings")
def get_my_bookings(
    farmer_id: UUID,
    status: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get all bookings for a farmer"""
    bookings = booking_service.get_farmer_bookings(
        db=db,
        farmer_id=farmer_id,
        status_filter=status,
        limit=limit
    )
    
    return {
        "success": True,
        "total": len(bookings),
        "bookings": bookings
    }


@storage_guard_router.post("/bookings/{booking_id}/vendor-confirm")
def vendor_confirm(
    booking_id: UUID,
    vendor_id: UUID,
    confirmation: schemas.VendorConfirmBooking,
    db: Session = Depends(get_db)
):
    """Vendor confirms or rejects a booking"""
    booking = booking_service.vendor_confirm_booking(
        db=db,
        booking_id=booking_id,
        vendor_id=vendor_id,
        confirmed=confirmation.confirmed,
        notes=confirmation.notes
    )
    
    return {
        "success": True,
        "message": "Booking confirmed" if confirmation.confirmed else "Booking rejected",
        "booking": booking
    }


class CancelBookingRequest(BaseModel):
    user_id: UUID
    cancellation_reason: Optional[str] = None


@storage_guard_router.post("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: UUID,
    request: CancelBookingRequest,
    db: Session = Depends(get_db)
):
    """Cancel a booking"""
    booking = booking_service.cancel_booking(
        db=db,
        booking_id=booking_id,
        user_id=request.user_id,
        cancellation_reason=request.cancellation_reason
    )
    
    return {
        "success": True,
        "message": "Booking cancelled",
        "booking": booking
    }


# =============================================================================
# SECTION 3.5: CERTIFICATE GENERATION & QUALITY CONTROL
# =============================================================================

@storage_guard_router.post("/bookings/{booking_id}/complete")
async def complete_booking_and_generate_certificate(
    booking_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Mark booking as completed and generate storage quality certificate
    Calculates all quality metrics from IoT sensors and quality tests
    """
    from app.services.certificate_service import CertificateService
    
    try:
        # Check if booking exists and is active
        booking = db.query(models.StorageBooking).filter(
            models.StorageBooking.id == booking_id
        ).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking.booking_status == "completed":
            raise HTTPException(status_code=400, detail="Booking already completed")
        
        # Generate certificate
        cert_service = CertificateService(db)
        certificate = await cert_service.generate_certificate(str(booking_id))
        
        # Update booking status
        booking.booking_status = "completed"
        db.commit()
        
        return {
            "success": True,
            "message": "Storage completed successfully",
            "certificate": {
                "id": str(certificate.id),
                "certificate_number": certificate.certificate_number,
                "crop_type": certificate.crop_type,
                "quantity_kg": certificate.quantity_kg,
                "initial_grade": certificate.initial_grade,
                "final_grade": certificate.final_grade,
                "grade_maintained": certificate.grade_maintained,
                "overall_quality_score": float(certificate.overall_quality_score),
                "temperature_compliance": float(certificate.temperature_compliance_percentage),
                "humidity_compliance": float(certificate.humidity_compliance_percentage),
                "pest_free": certificate.pest_incidents_count == 0,
                "issued_date": certificate.issued_date.isoformat() if certificate.issued_date else None,
                "digital_signature": certificate.digital_signature
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error completing booking: {str(e)}")


@storage_guard_router.get("/certificates/{certificate_id}")
def get_certificate(
    certificate_id: UUID,
    db: Session = Depends(get_db)
):
    """Get certificate details by ID"""
    from app.services.certificate_service import CertificateService
    
    cert_service = CertificateService(db)
    certificate = cert_service.get_certificate_by_id(str(certificate_id))
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Get related data
    booking = db.query(models.StorageBooking).filter(
        models.StorageBooking.id == certificate.booking_id
    ).first()
    
    farmer = db.query(models.User).filter(
        models.User.id == certificate.farmer_id
    ).first()
    
    vendor = db.query(models.Vendor).filter(
        models.Vendor.id == certificate.vendor_id
    ).first()
    
    location = db.query(models.StorageLocation).filter(
        models.StorageLocation.id == certificate.location_id
    ).first()
    
    import json
    
    return {
        "success": True,
        "certificate": {
            "id": str(certificate.id),
            "certificate_number": certificate.certificate_number,
            "status": certificate.certificate_status,
            "issued_date": certificate.issued_date.isoformat() if certificate.issued_date else None,
            
            # Parties
            "farmer": {
                "id": str(farmer.id) if farmer else None,
                "name": farmer.full_name if farmer else None,
                "phone": farmer.phone if farmer else None
            } if farmer else None,
            
            "vendor": {
                "id": str(vendor.id) if vendor else None,
                "name": vendor.business_name if vendor else None,
                "certifications": {
                    "fssai": certificate.fssai_certified,
                    "iso22000": certificate.iso_certified,
                    "haccp": certificate.haccp_certified
                }
            } if vendor else None,
            
            "location": {
                "name": location.name if location else None,
                "address": location.address if location else None,
                "type": location.type if location else None
            } if location else None,
            
            # Crop details
            "crop_type": certificate.crop_type,
            "quantity_kg": certificate.quantity_kg,
            "initial_grade": certificate.initial_grade,
            "final_grade": certificate.final_grade,
            "grade_maintained": certificate.grade_maintained,
            
            # Storage period
            "storage_start_date": certificate.storage_start_date.isoformat(),
            "storage_end_date": certificate.storage_end_date.isoformat(),
            "duration_days": certificate.duration_days,
            
            # Quality metrics
            "quality_metrics": {
                "overall_score": float(certificate.overall_quality_score),
                "temperature_compliance": float(certificate.temperature_compliance_percentage),
                "humidity_compliance": float(certificate.humidity_compliance_percentage),
                "temperature_avg": float(certificate.temperature_avg) if certificate.temperature_avg else None,
                "humidity_avg": float(certificate.humidity_avg) if certificate.humidity_avg else None,
                "total_sensor_readings": certificate.total_sensor_readings,
                "alerts_triggered": certificate.alerts_triggered,
                "alerts_resolved": certificate.alerts_resolved,
                "pest_incidents": certificate.pest_incidents_count,
                "quality_tests_pass_rate": float(certificate.quality_test_pass_rate),
                "preservation_rate": float(certificate.preservation_rate),
            },
            
            # Storage conditions
            "storage_conditions": json.loads(certificate.storage_conditions) if certificate.storage_conditions else {},
            
            # Verification
            "digital_signature": certificate.digital_signature,
            "qr_code_url": certificate.qr_code_url
        }
    }


@storage_guard_router.get("/certificates/verify/{certificate_number}")
def verify_certificate(
    certificate_number: str,
    signature: str,
    db: Session = Depends(get_db)
):
    """Verify certificate authenticity using certificate number and signature"""
    from app.services.certificate_service import CertificateService
    
    cert_service = CertificateService(db)
    is_valid = cert_service.verify_certificate(certificate_number, signature)
    
    if is_valid:
        certificate = cert_service.get_certificate_by_number(certificate_number)
        return {
            "success": True,
            "valid": True,
            "message": "Certificate is authentic",
            "certificate": {
                "certificate_number": certificate.certificate_number,
                "farmer_name": certificate.farmer.full_name if certificate.farmer else "Unknown",
                "crop_type": certificate.crop_type,
                "quantity_kg": certificate.quantity_kg,
                "issued_date": certificate.issued_date.isoformat() if certificate.issued_date else None,
                "overall_score": float(certificate.overall_quality_score)
            }
        }
    else:
        return {
            "success": False,
            "valid": False,
            "message": "Invalid certificate or signature"
        }


@storage_guard_router.get("/farmer/{farmer_id}/certificates")
def get_farmer_certificates(
    farmer_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all certificates for a farmer"""
    from app.services.certificate_service import CertificateService
    
    cert_service = CertificateService(db)
    certificates = cert_service.get_farmer_certificates(str(farmer_id))
    
    return {
        "success": True,
        "total": len(certificates),
        "certificates": [
            {
                "id": str(cert.id),
                "certificate_number": cert.certificate_number,
                "crop_type": cert.crop_type,
                "quantity_kg": cert.quantity_kg,
                "initial_grade": cert.initial_grade,
                "final_grade": cert.final_grade,
                "grade_maintained": cert.grade_maintained,
                "overall_quality_score": float(cert.overall_quality_score),
                "storage_start_date": cert.storage_start_date.isoformat(),
                "storage_end_date": cert.storage_end_date.isoformat(),
                "duration_days": cert.duration_days,
                "issued_date": cert.issued_date.isoformat() if cert.issued_date else None,
                "status": cert.certificate_status
            }
            for cert in certificates
        ]
    }


@storage_guard_router.get("/farmer-dashboard", response_model=schemas.FarmerDashboardResponse)
def get_farmer_dashboard(
    farmer_id: UUID,
    db: Session = Depends(get_db)
):
    """Comprehensive farmer dashboard with bookings, payments, stats"""
    return booking_service.get_farmer_dashboard_data(
        db=db,
        farmer_id=farmer_id
    )


# =============================================================================
# SECTION 4: STORAGE LOCATIONS & VENDORS
# =============================================================================

@storage_guard_router.get("/locations")
def get_storage_locations(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all available storage locations with vendor info"""
    try:
        locations = db.query(models.StorageLocation).limit(limit).all()
        
        result = []
        for loc in locations:
            location_data = {
                "id": str(loc.id),
                "name": loc.name,
                "type": loc.type,
                "address": loc.address,
                "lat": loc.lat,
                "lon": loc.lon,
                "capacity_text": loc.capacity_text,
                "price_text": loc.price_text,
                "rating": loc.rating,
                "facilities": loc.facilities or [],
                "vendor_id": str(loc.vendor_id) if loc.vendor_id else None
            }
            
            # Add vendor details if available
            if loc.vendor:
                location_data["vendor"] = {
                    "id": str(loc.vendor.id),
                    "business_name": loc.vendor.business_name,
                    "full_name": loc.vendor.full_name,
                    "phone": loc.vendor.phone
                }
            
            result.append(location_data)
        
        return {
            "success": True,
            "total": len(result),
            "locations": result
        }
    except Exception as e:
        print(f"Error fetching locations: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "locations": [], "error": str(e)}


@storage_guard_router.get("/vendors")
def get_vendors(db: Session = Depends(get_db)):
    """Get all registered vendors"""
    try:
        vendors = db.query(models.Vendor).limit(50).all()
        return {
            "success": True,
            "total": len(vendors),
            "vendors": vendors
        }
    except Exception as e:
        print(f"Error fetching vendors: {e}")
        return {"success": False, "vendors": []}


# =============================================================================
# SECTION 5: RFQ & BIDDING (EXISTING - COMPETITIVE QUOTES)
# =============================================================================

@storage_guard_router.post("/rfqs")
def create_rfq(
    rfq_data: schemas.RFQCreate,
    db: Session = Depends(get_db)
):
    """
    🏷️ Create Request for Quote (RFQ)
    Use for: Bulk orders, competitive bidding, special requirements
    """
    try:
        rfq = models.StorageRFQ(
            requester_id=rfq_data.requester_id,
            crop=rfq_data.crop,
            quantity_kg=rfq_data.quantity_kg,
            storage_type=rfq_data.storage_type,
            duration_days=rfq_data.duration_days,
            max_budget=rfq_data.max_budget,
            origin_lat=rfq_data.origin_lat,
            origin_lon=rfq_data.origin_lon,
            status="OPEN"
        )
        db.add(rfq)
        db.commit()
        db.refresh(rfq)
        
        return {
            "success": True,
            "message": "RFQ created",
            "rfq_id": str(rfq.id)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@storage_guard_router.get("/rfqs")
def get_rfqs(
    requester_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get RFQs with optional filters"""
    query = db.query(models.StorageRFQ)
    
    if requester_id:
        query = query.filter(models.StorageRFQ.requester_id == requester_id)
    if status:
        query = query.filter(models.StorageRFQ.status == status)
    
    # Get total count before limiting
    total_count = query.count()
    
    # Get limited results
    rfqs = query.order_by(models.StorageRFQ.created_at.desc()).limit(20).all()
    
    return {"success": True, "total": total_count, "displayed": len(rfqs), "rfqs": rfqs}


@storage_guard_router.post("/rfqs/{rfq_id}/bids")
def submit_bid(
    rfq_id: UUID,
    bid_data: schemas.BidCreate,
    db: Session = Depends(get_db)
):
    """Vendor submits bid on RFQ"""
    rfq = db.query(models.StorageRFQ).filter(
        models.StorageRFQ.id == rfq_id,
        models.StorageRFQ.status == "OPEN"
    ).first()
    
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found or closed")
    
    try:
        bid = models.StorageBid(
            rfq_id=rfq_id,
            location_id=bid_data.location_id,
            vendor_id=bid_data.vendor_id,
            price_text=bid_data.price_text,
            eta_hours=bid_data.eta_hours,
            notes=bid_data.notes
        )
        db.add(bid)
        db.commit()
        
        return {"success": True, "bid_id": str(bid.id)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@storage_guard_router.get("/rfqs/{rfq_id}/bids")
def get_rfq_bids(rfq_id: UUID, db: Session = Depends(get_db)):
    """Get all bids for an RFQ"""
    bids = db.query(models.StorageBid).filter(
        models.StorageBid.rfq_id == rfq_id
    ).all()
    
    return {"success": True, "total": len(bids), "bids": bids}


# =============================================================================
# SECTION 6: MONITORING & IOT
# =============================================================================

@storage_guard_router.get("/iot-sensors")  
def get_iot_sensors(db: Session = Depends(get_db)):
    """Get IoT sensor dashboard data"""
    try:
        sensors = db.query(models.IoTSensor).limit(20).all()
        
        sensor_data = []
        for sensor in sensors:
            recent_reading = db.query(models.SensorReading).filter(
                models.SensorReading.sensor_id == sensor.id
            ).order_by(models.SensorReading.reading_time.desc()).first()
            
            sensor_data.append({
                "sensor_id": str(sensor.id),
                "sensor_type": sensor.sensor_type,
                "status": sensor.status,
                "last_value": recent_reading.reading_value if recent_reading else None,
                "last_reading": recent_reading.reading_time.isoformat() if recent_reading else None,
                "battery_level": sensor.battery_level
            })
        
        return {"success": True, "sensors": sensor_data}
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "sensors": []}


@storage_guard_router.get("/quality-analysis")
def get_quality_analysis_data(db: Session = Depends(get_db)):
    """Get quality analysis data for dashboard"""
    try:
        crop_inspections = db.query(models.CropInspection).order_by(
            models.CropInspection.created_at.desc()
        ).limit(20).all()

        quality_analysis = []
        for inspection in crop_inspections:
            shelf_life = f"{inspection.shelf_life_days} days" if inspection.shelf_life_days else "N/A"
            quality_analysis.append({
                "product": inspection.crop_detected or "Unknown",
                "quality": inspection.grade or "Ungraded",
                "defects": inspection.defects if inspection.defects else "None",
                "shelfLife": shelf_life,
                "recommendation": inspection.recommendation,
                "image": inspection.image_urls[0] if inspection.image_urls else None,
                "created_at": inspection.created_at.isoformat() if inspection.created_at else None
            })

        return {"quality_tests": quality_analysis}
    except Exception as e:
        print(f"Error in get_quality_analysis_data: {e}")
        return {"quality_tests": []}


@storage_guard_router.get("/pest-detection")
def get_pest_detection_data(db: Session = Depends(get_db)):
    """Get pest detection records"""
    try:
        pest_detections = db.query(models.PestDetection).order_by(
            models.PestDetection.detected_at.desc()
        ).limit(20).all()

        pest_data = []
        for detection in pest_detections:
            pest_data.append({
                "id": str(detection.id),
                "pest_type": detection.pest_type,
                "severity_level": detection.severity_level,
                "location_details": detection.location_details,
                "confidence_score": detection.confidence_score,
                "detected_at": detection.detected_at.isoformat() if detection.detected_at else None,
                "resolved": detection.resolved_at is not None
            })

        return {"success": True, "pest_detections": pest_data}
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "pest_detections": []}


# =============================================================================
# SECTION 7: TRANSPORT & LOGISTICS
# =============================================================================

@storage_guard_router.get("/transport")
def get_transport_data(db: Session = Depends(get_db)):
    """Get transport tracking data"""
    try:
        transport_bookings = db.query(models.TransportBooking).order_by(
            models.TransportBooking.created_at.desc()
        ).limit(20).all()

        transport_data = []
        for booking in transport_bookings:
            transport_data.append({
                "id": str(booking.id),
                "cargo_type": booking.cargo_type,
                "pickup_location": booking.pickup_location,
                "delivery_location": booking.delivery_location,
                "status": booking.booking_status,
                "distance_km": booking.distance_km,
                "pickup_time": booking.pickup_time.isoformat() if booking.pickup_time else None
            })

        return {"success": True, "transport_bookings": transport_data}
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "transport_bookings": []}


# =============================================================================
# SECTION 8: COMPLIANCE & CERTIFICATIONS
# =============================================================================

@storage_guard_router.get("/compliance")
def get_compliance_data(db: Session = Depends(get_db)):
    """Get compliance certificates and status"""
    try:
        certificates = db.query(models.ComplianceCertificate).limit(20).all()

        compliance_data = []
        for cert in certificates:
            compliance_data.append({
                "id": str(cert.id),
                "certificate_type": cert.certificate_type,
                "certificate_number": cert.certificate_number,
                "status": cert.status,
                "expiry_date": cert.expiry_date.isoformat() if cert.expiry_date else None,
                "score": cert.score
            })

        return {"success": True, "certificates": compliance_data}
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "certificates": []}


# =============================================================================
# SECTION 9: ADDITIONAL ENDPOINTS (Jobs, Metrics, Proof of Delivery)
# =============================================================================

@storage_guard_router.get("/jobs")
async def get_storage_jobs(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get storage jobs (awarded RFQs)"""
    try:
        query = db.query(models.StorageJob)
        
        if status:
            query = query.filter(models.StorageJob.status == status)
        
        jobs = query.order_by(models.StorageJob.created_at.desc()).limit(50).all()
        
        jobs_data = []
        for job in jobs:
            jobs_data.append({
                "id": str(job.id),
                "rfq_id": str(job.rfq_id) if job.rfq_id else None,
                "bid_id": str(job.bid_id) if job.bid_id else None,
                "vendor_id": str(job.vendor_id) if job.vendor_id else None,
                "location_id": str(job.location_id) if job.location_id else None,
                "status": job.status,
                "start_date": job.start_date.isoformat() if job.start_date else None,
                "end_date": job.end_date.isoformat() if job.end_date else None,
                "actual_cost": float(job.actual_cost) if job.actual_cost else None,
                "created_at": job.created_at.isoformat() if job.created_at else None
            })
        
        return {"success": True, "jobs": jobs_data, "total": len(jobs_data)}
    except Exception as e:
        print(f"Error fetching jobs: {e}")
        return {"success": False, "jobs": [], "total": 0}


@storage_guard_router.get("/metrics")
async def get_storage_metrics(db: Session = Depends(get_db)):
    """Get storage system metrics and analytics"""
    try:
        # Calculate various metrics
        total_bookings = db.query(func.count(models.StorageBooking.id)).scalar() or 0
        total_rfqs = db.query(func.count(models.StorageRFQ.id)).scalar() or 0
        total_jobs = db.query(func.count(models.StorageJob.id)).scalar() or 0
        total_locations = db.query(func.count(models.StorageLocation.id)).scalar() or 0
        
        # Active bookings
        active_bookings = db.query(func.count(models.StorageBooking.id)).filter(
            models.StorageBooking.status.in_(["PENDING", "CONFIRMED", "IN_PROGRESS"])
        ).scalar() or 0
        
        # Revenue metrics
        total_revenue = db.query(func.sum(models.StorageBooking.total_amount)).filter(
            models.StorageBooking.status == "COMPLETED"
        ).scalar() or 0.0
        
        # Utilization rate (active bookings vs total capacity)
        utilization_rate = (active_bookings / total_locations * 100) if total_locations > 0 else 0
        
        metrics = [
            {
                "metric": "Total Bookings",
                "value": total_bookings,
                "trend": "up" if total_bookings > 0 else "neutral",
                "change": "+12%"
            },
            {
                "metric": "Active Storage",
                "value": active_bookings,
                "trend": "up" if active_bookings > 0 else "neutral",
                "change": "+8%"
            },
            {
                "metric": "Total Revenue",
                "value": f"₹{total_revenue:,.2f}",
                "trend": "up" if total_revenue > 0 else "neutral",
                "change": "+15%"
            },
            {
                "metric": "Utilization Rate",
                "value": f"{utilization_rate:.1f}%",
                "trend": "up" if utilization_rate > 50 else "neutral",
                "change": "+5%"
            },
            {
                "metric": "RFQs Created",
                "value": total_rfqs,
                "trend": "up" if total_rfqs > 0 else "neutral",
                "change": "+10%"
            },
            {
                "metric": "Jobs Completed",
                "value": total_jobs,
                "trend": "up" if total_jobs > 0 else "neutral",
                "change": "+18%"
            }
        ]
        
        return {"success": True, "metrics": metrics}
    except Exception as e:
        print(f"Error calculating metrics: {e}")
        return {"success": False, "metrics": []}


@storage_guard_router.get("/compliance-advanced")
async def get_compliance_advanced(db: Session = Depends(get_db)):
    """Get advanced compliance standards and certifications"""
    try:
        certificates = db.query(models.ComplianceCertificate).order_by(
            models.ComplianceCertificate.expiry_date.desc()
        ).limit(50).all()
        
        compliance_standards = []
        for cert in certificates:
            days_to_expiry = None
            if cert.expiry_date:
                days_to_expiry = (cert.expiry_date - datetime.now().date()).days
            
            compliance_standards.append({
                "id": str(cert.id),
                "standard": cert.certificate_type,
                "certificate_number": cert.certificate_number,
                "status": cert.status,
                "compliance_level": "High" if cert.score and cert.score >= 90 else "Medium" if cert.score and cert.score >= 70 else "Low",
                "last_audit": cert.issue_date.isoformat() if cert.issue_date else None,
                "expiry_date": cert.expiry_date.isoformat() if cert.expiry_date else None,
                "days_to_expiry": days_to_expiry,
                "score": cert.score,
                "requirements": "All standards met" if cert.status == "active" else "Pending renewal"
            })
        
        return {
            "success": True,
            "compliance_standards": compliance_standards,
            "total": len(compliance_standards),
            "summary": {
                "active": len([c for c in compliance_standards if c["status"] == "active"]),
                "expiring_soon": len([c for c in compliance_standards if c["days_to_expiry"] and c["days_to_expiry"] < 30]),
                "expired": len([c for c in compliance_standards if c["days_to_expiry"] and c["days_to_expiry"] < 0])
            }
        }
    except Exception as e:
        print(f"Error fetching compliance data: {e}")
        return {"success": False, "compliance_standards": [], "total": 0}


@storage_guard_router.get("/proof-of-delivery")
async def get_proof_of_delivery(
    job_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get proof of delivery records"""
    try:
        query = db.query(models.StorageJob).filter(
            models.StorageJob.status.in_(["COMPLETED", "IN_PROGRESS"])
        )
        
        if job_id:
            query = query.filter(models.StorageJob.id == UUID(job_id))
        
        jobs = query.order_by(models.StorageJob.created_at.desc()).limit(20).all()
        
        delivery_proofs = []
        for job in jobs:
            delivery_proofs.append({
                "job_id": str(job.id),
                "vendor_id": str(job.vendor_id) if job.vendor_id else None,
                "location_id": str(job.location_id) if job.location_id else None,
                "delivery_status": job.status,
                "delivery_date": job.end_date.isoformat() if job.end_date else None,
                "proof_type": "Digital Signature" if job.status == "COMPLETED" else "Pending",
                "verified": job.status == "COMPLETED",
                "verification_date": job.end_date.isoformat() if job.end_date and job.status == "COMPLETED" else None,
                "notes": f"Job {job.status.lower()}"
            })
        
        return {
            "success": True,
            "delivery_proofs": delivery_proofs,
            "total": len(delivery_proofs),
            "verified_count": len([p for p in delivery_proofs if p["verified"]])
        }
    except Exception as e:
        print(f"Error fetching proof of delivery: {e}")
        return {"success": False, "delivery_proofs": [], "total": 0}


@storage_guard_router.post("/upload-proof")
async def upload_proof_image(
    file: UploadFile = File(...),
    proof_type: str = Form(...),  # "loading", "transport", "delivery"
    booking_id: str = Form(...),
    farmer_id: str = Form(...),
    timestamp: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Upload proof images for storage delivery tracking
    - Loading: Photo when crop is loaded at farm
    - Transport: Photo during transport
    - Delivery: Photo when arriving at storage facility
    """
    try:
        # Validate booking exists
        booking = db.query(models.StorageBooking).filter(
            models.StorageBooking.id == UUID(booking_id)
        ).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Verify farmer owns this booking
        if str(booking.farmer_id) != farmer_id:
            raise HTTPException(status_code=403, detail="Not authorized for this booking")
        
        # Save uploaded file
        upload_dir = Path("uploads/proof_images")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"proof_{proof_type}_{booking_id}_{int(time.time())}.{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create proof record in database (you may want to create a DeliveryProof table)
        # For now, we'll store in booking notes or create a simple JSON record
        
        # Update booking with proof information
        if not booking.vendor_notes:
            booking.vendor_notes = ""
        
        proof_entry = f"\n[{proof_type.upper()} PROOF] Uploaded: {timestamp}, File: {unique_filename}"
        booking.vendor_notes = (booking.vendor_notes or "") + proof_entry
        db.commit()
        
        return {
            "success": True,
            "message": f"{proof_type.capitalize()} proof uploaded successfully",
            "file_name": unique_filename,
            "file_path": str(file_path),
            "proof_type": proof_type,
            "booking_id": booking_id,
            "timestamp": timestamp
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error uploading proof: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload proof: {str(e)}")


# =============================================================================
