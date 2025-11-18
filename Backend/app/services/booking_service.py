"""
Booking Service - Direct Booking System
Handles storage booking creation, suggestions, and management
"""

import math
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.schemas import postgres_base as models
from app.schemas import postgres_base_models as schemas


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return round(distance, 2)


def get_storage_suggestions(
    db: Session,
    farmer_lat: float,
    farmer_lon: float,
    crop_type: Optional[str] = None,
    quantity_kg: Optional[float] = None,
    max_distance_km: float = 50.0,
    limit: int = 5
) -> List[schemas.StorageSuggestion]:
    """
    Get nearby storage locations with distance and pricing
    """
    # Get all storage locations
    locations = db.query(models.StorageLocation).all()
    
    suggestions = []
    for location in locations:
        # Calculate distance
        distance = calculate_distance(farmer_lat, farmer_lon, location.lat, location.lon)
        
        if distance <= max_distance_km:
            # Parse price from price_text (e.g., "₹500/quintal" or "₹5000/month")
            price_per_day = 500.0  # Default
            try:
                import re
                price_match = re.search(r'₹?(\d+)', location.price_text or "")
                if price_match:
                    price_per_day = float(price_match.group(1)) / 30  # Convert monthly to daily
            except:
                pass
            
            # Calculate estimated cost
            estimated_total_price = price_per_day * 30  # Default 30 days
            if quantity_kg:
                # Assume price per quintal (100kg)
                estimated_total_price = (quantity_kg / 100) * (price_per_day * 30)
            
            # Get vendor name if available
            vendor_name = None
            if location.vendor and hasattr(location.vendor, 'business_name'):
                vendor_name = location.vendor.business_name
            elif location.vendor and hasattr(location.vendor, 'full_name'):
                vendor_name = location.vendor.full_name
            
            suggestion = schemas.StorageSuggestion(
                location_id=location.id,
                name=location.name,
                type=location.type,
                address=location.address,
                lat=location.lat,
                lon=location.lon,
                distance_km=distance,
                price_per_day=price_per_day,
                estimated_total_price=estimated_total_price,
                capacity_available=True,  # Assume available for now
                rating=location.rating if location.rating else 4.5,
                facilities=location.facilities if location.facilities else [],
                vendor_name=vendor_name
            )
            suggestions.append(suggestion)
    
    # Sort by distance and limit results
    suggestions.sort(key=lambda x: x.distance_km)
    return suggestions[:limit]


def create_storage_booking(
    db: Session,
    booking_data: schemas.StorageBookingCreate,
    farmer_id: UUID
) -> models.StorageBooking:
    """
    Create a direct storage booking
    """
    # Verify storage location exists
    location = db.query(models.StorageLocation).filter(
        models.StorageLocation.id == booking_data.location_id
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storage location not found"
        )
    
    # Parse price from location
    price_per_unit = 500.0
    try:
        import re
        price_match = re.search(r'₹?(\d+)', location.price_text or "")
        if price_match:
            price_per_unit = float(price_match.group(1))
    except:
        pass
    
    # Calculate total amount
    total_amount = (booking_data.quantity_kg / 100) * price_per_unit
    
    # Calculate end date
    end_date = booking_data.start_date + timedelta(days=booking_data.duration_days)
    
    # Create booking
    new_booking = models.StorageBooking(
        farmer_id=farmer_id,
        location_id=booking_data.location_id,
        vendor_id=location.vendor_id,
        ai_inspection_id=booking_data.ai_inspection_id,
        crop_type=booking_data.crop_type,
        quantity_kg=booking_data.quantity_kg,
        grade=booking_data.grade,
        duration_days=booking_data.duration_days,
        start_date=booking_data.start_date,
        end_date=end_date,
        price_per_day=price_per_unit,
        total_price=total_amount,
        booking_status="PENDING",
        payment_status="PENDING",
        transport_required=booking_data.transport_required
    )
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return new_booking


def create_transport_booking(
    db: Session,
    transport_data: schemas.TransportBookingCreate,
    farmer_id: UUID
) -> models.TransportBooking:
    """
    Create transport booking for a storage booking
    """
    # Verify storage booking exists
    storage_booking = db.query(models.StorageBooking).filter(
        models.StorageBooking.id == transport_data.storage_booking_id
    ).first()
    
    if not storage_booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storage booking not found"
        )
    
    # Calculate transport cost (₹100 base + ₹10 per km)
    transport_cost = 100.0 + (transport_data.distance_km * 10.0)
    
    new_transport = models.TransportBooking(
        storage_booking_id=transport_data.storage_booking_id,
        farmer_id=farmer_id,
        pickup_location=transport_data.pickup_location,
        pickup_lat=transport_data.pickup_lat,
        pickup_lon=transport_data.pickup_lon,
        dropoff_location=transport_data.dropoff_location,
        dropoff_lat=transport_data.dropoff_lat,
        dropoff_lon=transport_data.dropoff_lon,
        vehicle_type=transport_data.vehicle_type,
        distance_km=transport_data.distance_km,
        estimated_cost=transport_cost,
        status="PENDING"
    )
    
    db.add(new_transport)
    db.commit()
    db.refresh(new_transport)
    
    return new_transport


def get_booking_by_id(db: Session, booking_id: UUID) -> Optional[models.StorageBooking]:
    """Get booking by ID"""
    return db.query(models.StorageBooking).filter(
        models.StorageBooking.id == booking_id
    ).first()


def get_farmer_bookings(
    db: Session,
    farmer_id: UUID,
    status_filter: Optional[str] = None,
    limit: int = 20
) -> List[models.StorageBooking]:
    """Get all bookings for a farmer"""
    query = db.query(models.StorageBooking).filter(
        models.StorageBooking.farmer_id == farmer_id
    )
    
    if status_filter:
        query = query.filter(models.StorageBooking.booking_status == status_filter)
    
    return query.order_by(models.StorageBooking.created_at.desc()).limit(limit).all()


def vendor_confirm_booking(
    db: Session,
    booking_id: UUID,
    vendor_id: UUID,
    confirmed: bool,
    rejection_reason: Optional[str] = None
) -> models.StorageBooking:
    """
    Vendor confirms or rejects a booking
    """
    booking = db.query(models.StorageBooking).filter(
        models.StorageBooking.id == booking_id,
        models.StorageBooking.vendor_id == vendor_id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found or you don't have permission"
        )
    
    if booking.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking cannot be modified. Current status: {booking.status}"
        )
    
    if confirmed:
        booking.status = "CONFIRMED"
        booking.confirmed_at = datetime.now(timezone.utc)
    else:
        booking.status = "REJECTED"
        booking.rejection_reason = rejection_reason
    
    db.commit()
    db.refresh(booking)
    
    return booking


def cancel_booking(
    db: Session,
    booking_id: UUID,
    user_id: UUID,
    cancellation_reason: Optional[str] = None
) -> models.StorageBooking:
    """
    Cancel a booking (by farmer or vendor)
    """
    booking = db.query(models.StorageBooking).filter(
        models.StorageBooking.id == booking_id
    ).filter(
        (models.StorageBooking.farmer_id == user_id) | 
        (models.StorageBooking.vendor_id == user_id)
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found or you don't have permission"
        )
    
    if booking.booking_status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking cannot be cancelled. Current status: {booking.booking_status}"
        )
    
    booking.booking_status = "CANCELLED"
    booking.cancellation_reason = cancellation_reason
    booking.cancelled_at = datetime.now(timezone.utc)
    booking.cancelled_by = user_id
    
    db.commit()
    db.refresh(booking)
    
    return booking


def get_farmer_dashboard_data(
    db: Session,
    farmer_id: UUID
) -> schemas.FarmerDashboardResponse:
    """
    Get comprehensive dashboard data for farmer
    """
    # Get booking statistics
    total_bookings = db.query(func.count(models.StorageBooking.id)).filter(
        models.StorageBooking.farmer_id == farmer_id
    ).scalar() or 0
    
    active_bookings_count = db.query(func.count(models.StorageBooking.id)).filter(
        models.StorageBooking.farmer_id == farmer_id,
        models.StorageBooking.booking_status.in_(["PENDING", "CONFIRMED", "ACTIVE"])
    ).scalar() or 0
    
    completed_bookings = db.query(func.count(models.StorageBooking.id)).filter(
        models.StorageBooking.farmer_id == farmer_id,
        models.StorageBooking.booking_status == "COMPLETED"
    ).scalar() or 0
    
    # Get total spent
    total_spent = db.query(func.sum(models.StorageBooking.total_price)).filter(
        models.StorageBooking.farmer_id == farmer_id,
        models.StorageBooking.booking_status == "COMPLETED"
    ).scalar() or 0.0
    
    # Get active bookings
    active_bookings = db.query(models.StorageBooking).filter(
        models.StorageBooking.farmer_id == farmer_id,
        models.StorageBooking.booking_status.in_(["PENDING", "CONFIRMED", "ACTIVE"])
    ).order_by(models.StorageBooking.created_at.desc()).limit(10).all()
    
    # Get recent bookings
    recent_bookings = db.query(models.StorageBooking).filter(
        models.StorageBooking.farmer_id == farmer_id
    ).order_by(models.StorageBooking.created_at.desc()).limit(5).all()
    
    # Build summary
    summary = schemas.FarmerBookingSummary(
        total_bookings=total_bookings,
        active_bookings=active_bookings_count,
        completed_bookings=completed_bookings,
        pending_payments=0,  # TODO: Calculate from payments table
        total_spent=float(total_spent)
    )
    
    return schemas.FarmerDashboardResponse(
        summary=summary,
        active_bookings=[schemas.StorageBookingOut.model_validate(b) for b in active_bookings],
        recent_bookings=[schemas.StorageBookingOut.model_validate(b) for b in recent_bookings],
        pending_payments=[]  # TODO: Add payments
    )
