"""
Market Integration Router
Connects Storage Guard with Market Connect for automated crop selling
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

from app.connections.postgres_connection import get_db
from app.connections.mongo_connection import get_mongo_db
from app.schemas import postgres_base as models
from app.services.mandi_service import create_mandi_service

market_router = APIRouter(prefix="/market-integration", tags=["Market Integration"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class CreateListingRequest(BaseModel):
    storage_booking_id: UUID
    minimum_price: float = Field(..., gt=0, description="Minimum acceptable price per quintal")
    target_price: float = Field(..., gt=0, description="Target sale price per quintal")
    visibility: str = Field(default="PUBLIC", description="PUBLIC, VERIFIED_BUYERS, PRIVATE")
    auto_accept_at_target: bool = Field(default=False, description="Auto-accept offers at target price")

class BuyerOfferRequest(BaseModel):
    buyer_id: UUID
    price_per_quintal: float = Field(..., gt=0)
    quantity_quintals: int = Field(..., gt=0)
    payment_terms: str
    pickup_timeline: str
    notes: Optional[str] = None

class OfferActionRequest(BaseModel):
    listing_id: str
    farmer_id: UUID
    action: str = Field(..., description="ACCEPT, REJECT, COUNTER")
    counter_price: Optional[float] = None
    rejection_reason: Optional[str] = None

# ============================================================================
# API ENDPOINTS
# ============================================================================

@market_router.post("/listings/from-storage")
async def create_listing_from_storage(
    request: CreateListingRequest,
    farmer_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Create market listing from a storage booking
    Links Storage Guard → Market Connect
    """
    try:
        # 1. Get storage booking
        booking = db.query(models.StorageBooking).filter(
            models.StorageBooking.id == request.storage_booking_id,
            models.StorageBooking.farmer_id == farmer_id
        ).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Storage booking not found")
        
        if booking.booking_status not in ["PENDING", "CONFIRMED", "ACTIVE"]:
            raise HTTPException(status_code=400, detail="Booking must be pending, confirmed, or active to list")
        
        if booking.listed_for_sale:
            raise HTTPException(status_code=400, detail="Booking already listed for sale")
        
        # 2. Get AI inspection data
        inspection = None
        if booking.ai_inspection_id:
            inspection = db.query(models.CropInspection).filter(
                models.CropInspection.id == booking.ai_inspection_id
            ).first()
        
        # 3. Get storage location
        location = db.query(models.StorageLocation).filter(
            models.StorageLocation.id == booking.location_id
        ).first()
        
        # 4. Get farmer details
        farmer = db.query(models.User).filter(models.User.id == farmer_id).first()
        
        # 5. Get current market price
        mandi_service = create_mandi_service()
        try:
            market_data = await mandi_service.get_crop_market_data(
                booking.crop_type,
                state=getattr(farmer, 'state', 'Telangana'),
                district=None
            )
            current_market_price = float(market_data.get('current_price', 0)) if market_data and market_data.get('current_price') else 0
        except Exception as e:
            print(f"Error fetching market price: {e}")
            current_market_price = 0
        
        ai_suggested_price = current_market_price if current_market_price > 0 else float(request.target_price)
        
        # 6. Create MongoDB listing
        mongo_db = get_mongo_db()
        crop_sales = mongo_db['crop_sales']
        
        listing_doc = {
            "storage_booking_id": str(request.storage_booking_id),
            "ai_inspection_id": str(booking.ai_inspection_id) if booking.ai_inspection_id else None,
            "storage_location_id": str(booking.location_id),
            "storage_location_name": location.name if location else "Unknown",
            "storage_address": f"{getattr(location, 'address', '')}, {getattr(location, 'district', '')}, {getattr(location, 'state', '')}" if location else "",
            
            "crop_type": booking.crop_type,
            "crop_variety": booking.crop_type,  # Can enhance later
            "quality_grade": booking.grade or (inspection.grade if inspection else "Ungraded"),
            "quantity_quintals": booking.quantity_kg / 100,
            "quantity_kg": booking.quantity_kg,
            
            "quality_details": {
                "overall_grade": booking.grade or (inspection.grade if inspection else "Ungraded"),
                "freshness_score": float(inspection.freshness_score) if inspection and inspection.freshness_score else None,
                "defects": inspection.defects if inspection else [],
                "shelf_life_days": int(inspection.shelf_life_days) if inspection and inspection.shelf_life_days else None,
                "ai_report_urls": inspection.image_urls if inspection else [],
                "inspection_date": inspection.created_at.isoformat() if inspection else None
            },
            
            "farmer_id": str(farmer_id),
            "farmer_name": farmer.full_name if hasattr(farmer, 'full_name') else "Farmer",
            "farmer_phone": farmer.phone if hasattr(farmer, 'phone') else "",
            "farmer_location": f"{farmer.city}, {farmer.state}" if hasattr(farmer, 'city') else "",
            
            "stored_since": booking.start_date.isoformat() if booking.start_date else None,
            "available_until": booking.end_date.isoformat() if booking.end_date else None,
            "storage_cost_paid": float(booking.total_price) if booking.total_price else 0,
            
            "ai_suggested_price": float(ai_suggested_price),
            "minimum_price": float(request.minimum_price),
            "target_price": float(request.target_price),
            "current_market_price": float(current_market_price) if current_market_price else 0,
            "last_price_update": datetime.now(timezone.utc).isoformat(),
            
            "listing_status": "LISTED",
            "listed_at": datetime.now(timezone.utc).isoformat(),
            "visibility": request.visibility,
            "auto_accept_at_target": request.auto_accept_at_target,
            
            "matched_buyers": [],
            "offers": [],
            "sale_contract": None,
            "logistics": None,
            "payments": [],
            "price_monitoring": [{
                "date": datetime.now(timezone.utc).isoformat(),
                "market_price": float(current_market_price) if current_market_price else 0,
                "trend": "stable",
                "alert_sent": False
            }],
            
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = crop_sales.insert_one(listing_doc)
        listing_id = str(result.inserted_id)
        
        # 7. Update PostgreSQL booking
        booking.listed_for_sale = True
        booking.market_listing_id = listing_id
        booking.target_sale_price = request.target_price
        booking.minimum_sale_price = request.minimum_price
        booking.sale_status = "LISTED"
        booking.listed_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(booking)
        
        # 8. Match buyers (if any exist)
        try:
            matched_count = await match_buyers_for_listing(listing_id, db, mongo_db)
        except Exception as match_error:
            print(f"Buyer matching failed (non-critical): {match_error}")
            matched_count = 0
        
        return {
            "success": True,
            "message": "Crop listed for sale successfully",
            "listing_id": str(listing_id),
            "storage_booking_id": str(request.storage_booking_id),
            "crop_type": str(booking.crop_type),
            "quantity_quintals": float(booking.quantity_kg / 100),
            "ai_suggested_price": float(ai_suggested_price),
            "your_minimum_price": float(request.minimum_price),
            "your_target_price": float(request.target_price),
            "current_market_price": float(current_market_price),
            "matched_buyers": int(matched_count),
            "listing_status": "LISTED",
            "visibility": str(request.visibility),
            "profit_projection": {
                "if_sold_at_target": float((request.target_price * (booking.quantity_kg / 100)) - float(booking.total_price or 0)),
                "if_sold_at_market": float((current_market_price * (booking.quantity_kg / 100)) - float(booking.total_price or 0)) if current_market_price else 0.0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error creating listing: {error_detail}")
        # Try to rollback if possible
        try:
            db.rollback()
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to create listing: {str(e)}")


@market_router.get("/listings/{listing_id}")
async def get_listing_details(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed listing information"""
    try:
        mongo_db = get_mongo_db()
        crop_sales = mongo_db['crop_sales']
        
        from bson import ObjectId
        listing = crop_sales.find_one({"_id": ObjectId(listing_id)})
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Convert ObjectId to string
        listing['_id'] = str(listing['_id'])
        
        return {
            "success": True,
            "listing": listing
        }
        
    except Exception as e:
        print(f"Error getting listing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@market_router.get("/my-listings")
async def get_my_listings(
    farmer_id: UUID,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all listings for a farmer"""
    try:
        mongo_db = get_mongo_db()
        crop_sales = mongo_db['crop_sales']
        
        query = {"farmer_id": str(farmer_id)}
        if status:
            query["listing_status"] = status
        
        listings = list(crop_sales.find(query).sort("created_at", -1))
        
        # Convert ObjectIds
        for listing in listings:
            listing['_id'] = str(listing['_id'])
        
        return {
            "success": True,
            "total": len(listings),
            "listings": listings
        }
        
    except Exception as e:
        print(f"Error getting listings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@market_router.get("/listings/{listing_id}/matches")
async def get_matched_buyers(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """Get matched buyers for a listing"""
    try:
        mongo_db = get_mongo_db()
        crop_sales = mongo_db['crop_sales']
        
        from bson import ObjectId
        listing = crop_sales.find_one({"_id": ObjectId(listing_id)})
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Re-run matching algorithm
        matched_count = await match_buyers_for_listing(listing_id, db, mongo_db)
        
        # Get updated listing
        listing = crop_sales.find_one({"_id": ObjectId(listing_id)})
        matched_buyers = listing.get('matched_buyers', [])
        
        return {
            "success": True,
            "listing_id": listing_id,
            "crop_type": listing.get('crop_type'),
            "quantity_quintals": listing.get('quantity_quintals'),
            "total_matched": len(matched_buyers),
            "matched_buyers": matched_buyers
        }
        
    except Exception as e:
        print(f"Error getting matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def match_buyers_for_listing(listing_id: str, db: Session, mongo_db) -> int:
    """
    AI-powered buyer matching algorithm
    Returns number of matched buyers
    """
    try:
        from bson import ObjectId
        crop_sales = mongo_db['crop_sales']
        
        listing = crop_sales.find_one({"_id": ObjectId(listing_id)})
        if not listing:
            return 0
        
        crop_type = listing.get('crop_type', '').lower()
        quality_grade = listing.get('quality_grade', '')
        quantity_kg = listing.get('quantity_kg', 0)
        
        # Get buyers with preferences matching this listing
        buyer_prefs = db.query(models.BuyerPreferences).filter(
            models.BuyerPreferences.auto_match_enabled == True
        ).all()
        
        matched_buyers = []
        
        for pref in buyer_prefs:
            match_score = 0
            reasons = []
            
            # Check crop type match
            if pref.crop_types and any(crop.lower() in crop_type for crop in pref.crop_types):
                match_score += 40
                reasons.append(f"Interested in {crop_type}")
            else:
                continue  # Skip if crop doesn't match
            
            # Check quality grade
            if pref.quality_grades and quality_grade in pref.quality_grades:
                match_score += 20
                reasons.append(f"Grade {quality_grade} preference")
            elif not pref.quality_grades:
                match_score += 10
            
            # Check quantity
            if pref.min_quantity_kg and pref.max_quantity_kg:
                if pref.min_quantity_kg <= quantity_kg <= pref.max_quantity_kg:
                    match_score += 20
                    reasons.append(f"Quantity matches ({quantity_kg}kg)")
                elif quantity_kg >= pref.min_quantity_kg:
                    match_score += 10
                    reasons.append("Sufficient quantity")
            else:
                match_score += 10
            
            # Get buyer details
            buyer = db.query(models.Buyer).filter(
                models.Buyer.user_id == pref.buyer_id
            ).first()
            
            if buyer and match_score >= 40:  # Minimum 40% match
                matched_buyers.append({
                    "buyer_id": str(pref.buyer_id),
                    "buyer_name": buyer.organization_name or buyer.full_name,
                    "buyer_type": buyer.buyer_type,
                    "match_score": match_score,
                    "match_reasons": reasons,
                    "buyer_contact": buyer.phone,
                    "notified_at": datetime.now(timezone.utc).isoformat()
                })
        
        # Sort by match score
        matched_buyers.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Update listing
        crop_sales.update_one(
            {"_id": ObjectId(listing_id)},
            {"$set": {
                "matched_buyers": matched_buyers,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return len(matched_buyers)
        
    except Exception as e:
        print(f"Error matching buyers: {e}")
        return 0


# ============================================================================
# OFFER MANAGEMENT ENDPOINTS
# ============================================================================

@market_router.post("/listings/{listing_id}/offers")
async def submit_buyer_offer(
    listing_id: str,
    offer_data: BuyerOfferRequest,
    db: Session = Depends(get_db)
):
    """Buyer submits an offer on a listing"""
    try:
        mongo_db = get_mongo_db()
        crop_sales = mongo_db['crop_sales']
        
        from bson import ObjectId
        listing = crop_sales.find_one({"_id": ObjectId(listing_id)})
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.get('listing_status') not in ["LISTED", "NEGOTIATING"]:
            raise HTTPException(status_code=400, detail="Listing not available for offers")
        
        # Get buyer details
        buyer = db.query(models.Buyer).filter(models.Buyer.user_id == offer_data.buyer_id).first()
        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")
        
        # Create offer
        import uuid
        offer_id = str(uuid.uuid4())
        
        total_amount = offer_data.price_per_quintal * offer_data.quantity_quintals
        
        offer = {
            "offer_id": offer_id,
            "buyer_id": str(offer_data.buyer_id),
            "buyer_name": buyer.organization_name or buyer.full_name,
            "buyer_type": buyer.buyer_type,
            "buyer_contact": buyer.phone,
            "offered_price": offer_data.price_per_quintal,
            "quantity_quintals": offer_data.quantity_quintals,
            "total_amount": total_amount,
            "payment_terms": offer_data.payment_terms,
            "pickup_timeline": offer_data.pickup_timeline,
            "offer_status": "PENDING",
            "notes": offer_data.notes,
            "offer_date": datetime.now(timezone.utc).isoformat(),
            "valid_until": None
        }
        
        # Add offer to listing
        crop_sales.update_one(
            {"_id": ObjectId(listing_id)},
            {
                "$push": {"offers": offer},
                "$set": {
                    "listing_status": "NEGOTIATING",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Update PostgreSQL booking status
        booking_id = listing.get('storage_booking_id')
        if booking_id:
            booking = db.query(models.StorageBooking).filter(
                models.StorageBooking.id == UUID(booking_id)
            ).first()
            if booking:
                booking.sale_status = "NEGOTIATING"
                db.commit()
        
        return {
            "success": True,
            "message": "Offer submitted successfully",
            "offer_id": offer_id,
            "offer_details": offer
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@market_router.get("/listings/{listing_id}/offers")
async def get_listing_offers(
    listing_id: str,
    farmer_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    """Get all offers for a listing"""
    try:
        mongo_db = get_mongo_db()
        crop_sales = mongo_db['crop_sales']
        
        from bson import ObjectId
        listing = crop_sales.find_one({"_id": ObjectId(listing_id)})
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Verify farmer ownership if farmer_id provided
        if farmer_id and listing.get('farmer_id') != str(farmer_id):
            raise HTTPException(status_code=403, detail="Not authorized")
        
        offers = listing.get('offers', [])
        
        return {
            "success": True,
            "listing_id": listing_id,
            "total_offers": len(offers),
            "offers": offers
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting offers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@market_router.post("/offers/{offer_id}/action")
async def handle_offer_action(
    offer_id: str,
    action_data: OfferActionRequest,
    db: Session = Depends(get_db)
):
    """Farmer accepts, rejects, or counters an offer"""
    try:
        mongo_db = get_mongo_db()
        crop_sales = mongo_db['crop_sales']
        
        from bson import ObjectId
        listing = crop_sales.find_one({"_id": ObjectId(action_data.listing_id)})
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.get('farmer_id') != str(action_data.farmer_id):
            raise HTTPException(status_code=403, detail="Not authorized")
        
        offers = listing.get('offers', [])
        offer = next((o for o in offers if o['offer_id'] == offer_id), None)
        
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        
        if offer['offer_status'] != "PENDING":
            raise HTTPException(status_code=400, detail="Offer already processed")
        
        # Handle action
        if action_data.action == "ACCEPT":
            # Accept offer - create sale contract
            import uuid
            offer['offer_status'] = "ACCEPTED"
            offer['accepted_at'] = datetime.now(timezone.utc).isoformat()
            
            # Create sale contract
            sale_contract = {
                "contract_id": str(uuid.uuid4()),
                "buyer_id": offer['buyer_id'],
                "buyer_name": offer['buyer_name'],
                "final_price_per_quintal": offer['offered_price'],
                "total_amount": offer['total_amount'],
                "payment_schedule": [
                    {
                        "milestone": "Contract Signed",
                        "amount": offer['total_amount'] * 0.5,
                        "status": "PENDING",
                        "due_date": datetime.now(timezone.utc).isoformat()
                    },
                    {
                        "milestone": "Delivery Completed",
                        "amount": offer['total_amount'] * 0.5,
                        "status": "PENDING",
                        "due_on_delivery": True
                    }
                ],
                "delivery_terms": {
                    "pickup_location": listing.get('storage_location_name'),
                    "pickup_timeline": offer['pickup_timeline'],
                    "transport_responsibility": "Buyer"
                },
                "quality_guarantee": "As per AI inspection report",
                "signed_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Update listing
            crop_sales.update_one(
                {"_id": ObjectId(action_data.listing_id), "offers.offer_id": offer_id},
                {
                    "$set": {
                        "offers.$": offer,
                        "sale_contract": sale_contract,
                        "listing_status": "SOLD",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Update PostgreSQL
            booking_id = listing.get('storage_booking_id')
            if booking_id:
                booking = db.query(models.StorageBooking).filter(
                    models.StorageBooking.id == UUID(booking_id)
                ).first()
                if booking:
                    booking.sale_status = "SOLD"
                    booking.sold_at = datetime.now(timezone.utc)
                    db.commit()
            
            return {
                "success": True,
                "message": "Offer accepted! Sale contract created",
                "action": "ACCEPTED",
                "sale_contract": sale_contract
            }
            
        elif action_data.action == "REJECT":
            # Reject offer
            offer['offer_status'] = "REJECTED"
            offer['rejection_reason'] = action_data.rejection_reason
            offer['rejected_at'] = datetime.now(timezone.utc).isoformat()
            
            crop_sales.update_one(
                {"_id": ObjectId(action_data.listing_id), "offers.offer_id": offer_id},
                {
                    "$set": {
                        "offers.$": offer,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            return {
                "success": True,
                "message": "Offer rejected",
                "action": "REJECTED"
            }
            
        elif action_data.action == "COUNTER":
            if not action_data.counter_price:
                raise HTTPException(status_code=400, detail="Counter price required")
            
            # Create counter offer
            offer['offer_status'] = "COUNTERED"
            offer['counter_price'] = action_data.counter_price
            offer['countered_at'] = datetime.now(timezone.utc).isoformat()
            
            crop_sales.update_one(
                {"_id": ObjectId(action_data.listing_id), "offers.offer_id": offer_id},
                {
                    "$set": {
                        "offers.$": offer,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            return {
                "success": True,
                "message": f"Counter offer sent: ₹{action_data.counter_price}/quintal",
                "action": "COUNTERED",
                "counter_price": action_data.counter_price
            }
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error handling offer action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@market_router.get("/price-alerts")
async def get_price_alerts(
    farmer_id: UUID,
    db: Session = Depends(get_db)
):
    """Get price alerts for farmer's stored crops"""
    try:
        mongo_db = get_mongo_db()
        crop_sales = mongo_db['crop_sales']
        
        # Get all active listings for farmer
        listings = list(crop_sales.find({
            "farmer_id": str(farmer_id),
            "listing_status": {"$in": ["LISTED", "NEGOTIATING"]}
        }))
        
        alerts = []
        mandi_service = create_mandi_service()
        
        for listing in listings:
            crop_type = listing.get('crop_type')
            target_price = listing.get('target_price', 0) or 0
            current_market_price = listing.get('current_market_price', 0) or 0
            
            # Fetch latest market price
            try:
                market_data = await mandi_service.get_crop_market_data(crop_type)
                latest_price = float(market_data.get('current_price', current_market_price)) if market_data and market_data.get('current_price') else current_market_price
            except Exception as e:
                print(f"Error fetching market price for {crop_type}: {e}")
                latest_price = current_market_price
            
            price_trend = "stable"
            if latest_price and current_market_price:
                if latest_price > current_market_price:
                    price_trend = "rising"
                elif latest_price < current_market_price:
                    price_trend = "falling"
            
            # Check if target reached
            alert_type = None
            if latest_price and target_price and latest_price >= target_price:
                alert_type = "TARGET_REACHED"
            elif price_trend == "rising" and latest_price and target_price and latest_price >= target_price * 0.95:
                alert_type = "APPROACHING_TARGET"
            
            if alert_type:
                alerts.append({
                    "listing_id": str(listing['_id']),
                    "crop_type": crop_type,
                    "quantity_quintals": listing.get('quantity_quintals'),
                    "target_price": target_price,
                    "current_price": latest_price,
                    "price_change": latest_price - current_market_price,
                    "trend": price_trend,
                    "alert_type": alert_type,
                    "message": f"{'✓ Target reached!' if alert_type == 'TARGET_REACHED' else '⚠ Approaching target'} {crop_type} at ₹{latest_price}/quintal",
                    "recommendation": "Good time to review offers" if alert_type == "TARGET_REACHED" else "Monitor closely"
                })
        
        return {
            "success": True,
            "total_alerts": len(alerts),
            "alerts": alerts
        }
        
    except Exception as e:
        print(f"Error getting price alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

