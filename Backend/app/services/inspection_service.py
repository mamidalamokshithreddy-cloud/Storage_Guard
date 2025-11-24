"""
Inspection Service - Handle scheduled on-site quality inspections
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from app.schemas import postgres_base as models
from app.schemas import postgres_base_models as schemas


def create_inspection_request(
    db: Session,
    farmer_id: UUID,
    inspection_data: schemas.InspectionScheduleCreate
) -> models.ScheduledInspection:
    """
    Create a new inspection request from farmer
    """
    # Validate booking if provided
    if inspection_data.booking_id:
        booking = db.query(models.StorageBooking).filter(
            models.StorageBooking.id == inspection_data.booking_id,
            models.StorageBooking.farmer_id == farmer_id
        ).first()
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found or you don't have permission"
            )
    
    # Create inspection request
    inspection = models.ScheduledInspection(
        farmer_id=farmer_id,
        booking_id=inspection_data.booking_id,
        inspection_type=inspection_data.inspection_type.value,
        crop_type=inspection_data.crop_type,
        quantity_kg=inspection_data.quantity_kg,
        location_address=inspection_data.location_address,
        location_lat=inspection_data.location_lat,
        location_lon=inspection_data.location_lon,
        requested_date=inspection_data.requested_date,
        preferred_time_slot=inspection_data.preferred_time_slot.value if inspection_data.preferred_time_slot else None,
        farmer_notes=inspection_data.farmer_notes,
        status="pending"
    )
    
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    
    return inspection


def get_farmer_inspections(
    db: Session,
    farmer_id: UUID,
    status_filter: Optional[str] = None,
    limit: int = 50
) -> schemas.InspectionList:
    """
    Get all inspections for a farmer with optional status filter
    """
    query = db.query(models.ScheduledInspection).filter(
        models.ScheduledInspection.farmer_id == farmer_id
    )
    
    if status_filter:
        query = query.filter(models.ScheduledInspection.status == status_filter)
    
    inspections = query.order_by(
        models.ScheduledInspection.requested_date.desc()
    ).limit(limit).all()
    
    # Calculate status counts
    all_inspections = db.query(models.ScheduledInspection).filter(
        models.ScheduledInspection.farmer_id == farmer_id
    ).all()
    
    pending_count = sum(1 for i in all_inspections if i.status == "pending")
    confirmed_count = sum(1 for i in all_inspections if i.status == "confirmed")
    completed_count = sum(1 for i in all_inspections if i.status == "completed")
    
    return schemas.InspectionList(
        inspections=inspections,
        total=len(all_inspections),
        pending=pending_count,
        confirmed=confirmed_count,
        completed=completed_count
    )


def get_vendor_inspections(
    db: Session,
    vendor_id: UUID,
    status_filter: Optional[str] = None,
    limit: int = 50
) -> List[models.ScheduledInspection]:
    """
    Get all inspections assigned to a vendor
    """
    query = db.query(models.ScheduledInspection).filter(
        models.ScheduledInspection.vendor_id == vendor_id
    )
    
    if status_filter:
        query = query.filter(models.ScheduledInspection.status == status_filter)
    
    return query.order_by(
        models.ScheduledInspection.scheduled_date.desc()
    ).limit(limit).all()


def assign_vendor_to_inspection(
    db: Session,
    inspection_id: UUID,
    vendor_id: UUID
) -> models.ScheduledInspection:
    """
    Assign a vendor/inspector to a pending inspection (admin/system function)
    """
    inspection = db.query(models.ScheduledInspection).filter(
        models.ScheduledInspection.id == inspection_id
    ).first()
    
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    if inspection.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot assign vendor. Inspection status: {inspection.status}"
        )
    
    # Verify vendor exists
    vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    inspection.vendor_id = vendor_id
    db.commit()
    db.refresh(inspection)
    
    return inspection


def vendor_confirm_inspection(
    db: Session,
    inspection_id: UUID,
    vendor_id: UUID,
    confirm_data: schemas.InspectionConfirm
) -> models.ScheduledInspection:
    """
    Vendor confirms inspection schedule
    """
    inspection = db.query(models.ScheduledInspection).filter(
        models.ScheduledInspection.id == inspection_id,
        models.ScheduledInspection.vendor_id == vendor_id
    ).first()
    
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found or you're not assigned to it"
        )
    
    if inspection.status not in ["pending", "confirmed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm. Current status: {inspection.status}"
        )
    
    inspection.scheduled_date = confirm_data.scheduled_date
    inspection.inspector_notes = confirm_data.inspector_notes
    inspection.status = "confirmed"
    inspection.confirmed_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(inspection)
    
    return inspection


def complete_inspection(
    db: Session,
    inspection_id: UUID,
    vendor_id: UUID,
    completion_data: schemas.InspectionComplete
) -> models.ScheduledInspection:
    """
    Complete inspection and create crop inspection record
    """
    inspection = db.query(models.ScheduledInspection).filter(
        models.ScheduledInspection.id == inspection_id,
        models.ScheduledInspection.vendor_id == vendor_id
    ).first()
    
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found or you're not assigned to it"
        )
    
    if inspection.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inspection already completed"
        )
    
    # Create crop inspection record with results
    crop_inspection = models.CropInspection(
        farmer_id=inspection.farmer_id,
        crop_detected=completion_data.crop_detected,
        grade=completion_data.grade,
        defects=completion_data.defects,
        recommendation=completion_data.recommendation or completion_data.inspector_notes,
        image_urls=[],  # Can be added later if vendor uploads photos
        shelf_life_days=completion_data.shelf_life_days,
        freshness=completion_data.freshness,
        freshness_score=_calculate_freshness_score(completion_data.freshness),
        visual_defects=", ".join(completion_data.defects) if completion_data.defects else "None"
    )
    
    db.add(crop_inspection)
    db.flush()  # Get the ID
    
    # Update scheduled inspection
    inspection.inspection_result_id = crop_inspection.id
    inspection.inspector_notes = completion_data.inspector_notes
    inspection.completed_date = datetime.now(timezone.utc)
    inspection.status = "completed"
    
    # If linked to booking, update booking with inspection ID
    if inspection.booking_id:
        booking = db.query(models.StorageBooking).filter(
            models.StorageBooking.id == inspection.booking_id
        ).first()
        if booking and not booking.ai_inspection_id:
            booking.ai_inspection_id = crop_inspection.id
    
    db.commit()
    db.refresh(inspection)
    
    return inspection


def cancel_inspection(
    db: Session,
    inspection_id: UUID,
    user_id: UUID,
    cancel_data: schemas.InspectionCancel
) -> models.ScheduledInspection:
    """
    Cancel an inspection (by farmer or vendor)
    """
    inspection = db.query(models.ScheduledInspection).filter(
        models.ScheduledInspection.id == inspection_id
    ).first()
    
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    # Check permission (farmer or assigned vendor)
    if str(inspection.farmer_id) != str(user_id) and str(inspection.vendor_id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to cancel this inspection"
        )
    
    if inspection.status in ["completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel. Current status: {inspection.status}"
        )
    
    inspection.status = "cancelled"
    inspection.cancellation_reason = cancel_data.cancellation_reason
    
    db.commit()
    db.refresh(inspection)
    
    return inspection


def get_inspection_by_id(
    db: Session,
    inspection_id: UUID
) -> Optional[models.ScheduledInspection]:
    """Get inspection by ID"""
    return db.query(models.ScheduledInspection).filter(
        models.ScheduledInspection.id == inspection_id
    ).first()


def _calculate_freshness_score(freshness: str) -> float:
    """Convert freshness text to numerical score"""
    freshness_map = {
        "excellent": 1.0,
        "good": 0.75,
        "fair": 0.5,
        "poor": 0.25
    }
    return freshness_map.get(freshness.lower(), 0.5)
