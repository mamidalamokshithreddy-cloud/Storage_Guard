"""
Booking Service - Direct Booking System
Handles storage booking creation, suggestions, and management
"""

import math
import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.schemas import postgres_base as models
from app.schemas import postgres_base_models as schemas
from app.services import market_sync

logger = logging.getLogger(__name__)


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
    storage_type: Optional[str] = None,
    max_distance_km: float = 50.0,
    limit: int = 5
) -> List[schemas.StorageSuggestion]:
    """
    Get nearby storage locations with distance and pricing
    Filter by storage_type if provided (COLD/DRY)
    """
    # Get all storage locations
    query = db.query(models.StorageLocation)
    
    # Filter by storage type if specified
    if storage_type:
        storage_type_lower = storage_type.lower()
        if storage_type_lower == "cold":
            query = query.filter(models.StorageLocation.type.in_(['cold_storage', 'cold']))
            print(f"🔍 Filtering for COLD storage locations only")
        elif storage_type_lower == "dry":
            query = query.filter(models.StorageLocation.type.in_(['dry_storage', 'warehouse', 'dry']))
            print(f"🔍 Filtering for DRY storage locations only")
    
    locations = query.all()
    print(f"📍 Found {len(locations)} storage location(s) within {max_distance_km}km (filtered by {storage_type or 'ANY'} type)")
    
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
    
    # Parse price from location and calculate total
    # Standard format: ₹X/quintal/month (where 1 quintal = 100 kg)
    # Default realistic rates based on storage type
    
    # Determine realistic default based on storage type
    storage_type = (location.type or "").upper()
    if "COLD" in storage_type:
        default_price = 400.0  # ₹400/quintal/month for cold storage
    elif "DRY" in storage_type or "WAREHOUSE" in storage_type:
        default_price = 300.0  # ₹300/quintal/month for dry storage
    else:
        default_price = 350.0  # ₹350/quintal/month for others
    
    price_per_quintal_per_month = default_price
    
    try:
        import re
        price_text_lower = (location.price_text or "").lower()
        price_match = re.search(r'₹?(\d+(?:\.\d+)?)', location.price_text or "")
        
        if price_match:
            price_value = float(price_match.group(1))
            
            # Only use parsed price if it's reasonable (₹100-₹15000 per quintal per month)
            # This prevents absurd prices while allowing realistic conversions
            if '/kg/day' in price_text_lower:
                # ₹X/kg/day - Convert to per quintal per month
                # ₹2.5/kg/day = ₹250/quintal/day = ₹7,500/quintal/month
                # ₹5/kg/day = ₹500/quintal/day = ₹15,000/quintal/month
                # Realistic range: ₹100-₹15,000/quintal/month
                calculated = price_value * 100 * 30
                if 100 <= calculated <= 15000:
                    price_per_quintal_per_month = calculated
                    print(f"✅ Converted ₹{price_value}/kg/day → ₹{calculated}/quintal/month")
                else:
                    print(f"⚠️ Unrealistic price {calculated}, using default {default_price}")
                    price_per_quintal_per_month = default_price
                    
            elif '/quintal/month' in price_text_lower or '/quintal' in price_text_lower:
                # Direct format: ₹X/quintal/month
                if 100 <= price_value <= 1000:
                    price_per_quintal_per_month = price_value
                else:
                    print(f"⚠️ Unrealistic price {price_value}, using default {default_price}")
                    price_per_quintal_per_month = default_price
                    
            elif '/month' in price_text_lower:
                # Assume per quintal if reasonable
                if 100 <= price_value <= 1000:
                    price_per_quintal_per_month = price_value
                else:
                    print(f"⚠️ Unrealistic price {price_value}, using default {default_price}")
                    price_per_quintal_per_month = default_price
            else:
                # No format specified - validate range
                if 100 <= price_value <= 1000:
                    price_per_quintal_per_month = price_value
                else:
                    print(f"⚠️ Unrealistic price {price_value}, using default {default_price}")
                    price_per_quintal_per_month = default_price
                    
    except Exception as e:
        print(f"⚠️ Price parsing error: {e}, using default ₹{default_price}/quintal/month")
    
    # Calculate total: (quintals) × (price per quintal per month) × (months)
    quintals = booking_data.quantity_kg / 100.0
    months = booking_data.duration_days / 30.0
    total_amount = quintals * price_per_quintal_per_month * months
    
    # Log calculation for debugging
    print(f"\n💰 PRICE CALCULATION:")
    print(f"   Location: {location.name}")
    print(f"   Type: {storage_type}")
    print(f"   Price text: '{location.price_text}'")
    print(f"   Using: ₹{price_per_quintal_per_month}/quintal/month")
    print(f"   Quantity: {booking_data.quantity_kg} kg = {quintals} quintals")
    print(f"   Duration: {booking_data.duration_days} days = {months:.2f} months")
    print(f"   TOTAL: {quintals} × ₹{price_per_quintal_per_month} × {months:.2f} = ₹{total_amount:.2f}\n")
    
    # Calculate price per day for the entire quantity
    price_per_day = (quintals * price_per_quintal_per_month) / 30.0
    
    # Calculate end date
    end_date = booking_data.start_date + timedelta(days=booking_data.duration_days)
    
    # 🚚 SMART TRANSPORT LOGIC: Auto-determine if transport is needed
    # If not explicitly set, default based on crop type and quantity
    transport_required = booking_data.transport_required
    
    if transport_required is None:
        # Auto-enable transport for:
        # 1. Perishable crops (need quick delivery)
        # 2. Large quantities (>1000kg)
        # 3. Long distances (if we had farmer location, we'd calculate)
        crop_lower = booking_data.crop_type.lower()
        perishables = ['tomato', 'potato', 'onion', 'cauliflower', 'cabbage', 'carrot',
                      'brinjal', 'capsicum', 'cucumber', 'vegetable', 'fruit', 'leafy']
        
        is_perishable = any(p in crop_lower for p in perishables)
        is_large_quantity = booking_data.quantity_kg >= 1000
        
        # Default: Enable transport for perishables OR large quantities
        transport_required = is_perishable or is_large_quantity
        
        print(f"🚚 Auto-Transport Logic:")
        print(f"   Crop: {booking_data.crop_type}")
        print(f"   Perishable: {is_perishable}")
        print(f"   Large Qty (≥1000kg): {is_large_quantity}")
        print(f"   → Transport Required: {transport_required}")
    
    # Populate grade from AI inspection if not provided
    grade_value = booking_data.grade
    ai_inspection_id = booking_data.ai_inspection_id
    
    try:
        if not grade_value and ai_inspection_id:
            # Use provided inspection ID
            insp = db.query(models.CropInspection).filter(
                models.CropInspection.id == ai_inspection_id
            ).first()
            if insp:
                grade_value = insp.grade or insp.overall_quality or "ungraded"
        elif not grade_value:
            # Try to find most recent inspection for this farmer
            insp = db.query(models.CropInspection).filter(
                models.CropInspection.farmer_id == farmer_id,
            ).order_by(models.CropInspection.created_at.desc()).first()
            if insp:
                grade_value = insp.grade or insp.overall_quality or "ungraded"
                ai_inspection_id = insp.id
    except Exception as e:
        logger.warning(f"Could not populate grade from inspection: {e}")
        grade_value = "ungraded"

    # Create booking
    try:
        new_booking = models.StorageBooking(
            farmer_id=farmer_id,
            location_id=booking_data.location_id,
            vendor_id=location.vendor_id,
            ai_inspection_id=ai_inspection_id,
            crop_type=booking_data.crop_type,
            quantity_kg=booking_data.quantity_kg,
            grade=grade_value or "ungraded",
            duration_days=booking_data.duration_days,
            start_date=booking_data.start_date,
            end_date=end_date,
            price_per_day=price_per_day,
            total_price=total_amount,
            booking_status="PENDING",
            payment_status="PENDING",
            transport_required=transport_required
        )
        
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        print(f"✅ Booking created successfully: {new_booking.id}")
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR creating booking: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create booking: {str(e)}")
    
    # 🔄 [MARKET] Auto-create snapshot for Market Connect and publish immediately
    logger.info(f"📸 [MARKET] Creating snapshot for booking: {new_booking.id} (publish immediate)")
    try:
        snapshot = market_sync.upsert_snapshot(db, str(new_booking.id), publish=True)
        if snapshot:
            logger.info(f"✅ [MARKET] Snapshot created and publish triggered: {new_booking.id}")
        else:
            logger.warning(f"⚠️ [MARKET] Snapshot creation returned None for booking: {new_booking.id}")
    except Exception as e:
        logger.error(f"❌ [MARKET] Error creating/publishing snapshot: {str(e)}")
    
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
    rejection_reason: Optional[str] = None,
    notes: Optional[str] = None
) -> models.StorageBooking:
    """
    Vendor confirms or rejects a booking
    """
    booking = db.query(models.StorageBooking).filter(
        models.StorageBooking.id == booking_id
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check if this vendor has permission (either booking's vendor or location's vendor)
    if booking.vendor_id and booking.vendor_id != vendor_id:
        # Get location's vendor
        location = db.query(models.StorageLocation).filter(
            models.StorageLocation.id == booking.location_id
        ).first()
        
        if location and location.vendor_id != vendor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to confirm this booking"
            )
    
    if booking.booking_status.upper() != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking cannot be modified. Current status: {booking.booking_status}"
        )
    
    if confirmed:
        booking.booking_status = "CONFIRMED"
        booking.vendor_confirmed = True
        booking.vendor_confirmed_at = datetime.now(timezone.utc)
    else:
        booking.booking_status = "REJECTED"
        booking.vendor_confirmed = False
        booking.rejection_reason = rejection_reason or notes
    
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
