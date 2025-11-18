from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from fastapi import HTTPException, status

from app.schemas import postgres_base as models
from app.schemas import postgres_base_models as schemas

# =========================================================
# Storage Locations
# =========================================================
def create_location(db: Session, location: schemas.StorageLocationCreate, vendor_id: UUID) -> models.StorageLocation:
    new_location = models.StorageLocation(
        vendor_id=vendor_id,
        name=location.name,
        type=location.type,
        address=location.address,
        lat=location.lat,
        lon=location.lon,
        capacity_text=location.capacity_text,
        price_text=location.price_text,
        phone=location.phone,
        hours=location.hours,
        facilities=location.facilities,
    )
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location


def get_locations_near(db: Session, lat: float, lon: float, radius_km: float = 50.0) -> List[models.StorageLocation]:
    """
    Very basic 'distance' calculation (Haversine could be added for accuracy).
    """
    locations = db.query(models.StorageLocation).all()
    nearby = []
    for loc in locations:
        # simple Euclidean approximation
        dist = ((lat - loc.lat) ** 2 + (lon - loc.lon) ** 2) ** 0.5 * 111  # deg to km
        if dist <= radius_km:
            loc.distance_km = round(dist, 2)
            nearby.append(loc)
    return nearby

# =========================================================
# RFQs
# =========================================================
def create_rfq(db: Session, rfq: schemas.RFQCreate, requester_id: UUID) -> models.StorageRFQ:
    new_rfq = models.StorageRFQ(
        requester_id=requester_id,
        crop=rfq.crop,
        quantity_kg=rfq.quantity_kg,
        storage_type=rfq.storage_type,
        duration_days=rfq.duration_days,
        max_budget=rfq.max_budget,
        origin_lat=rfq.origin_lat,
        origin_lon=rfq.origin_lon,
        status="OPEN"
    )
    db.add(new_rfq)
    db.commit()
    db.refresh(new_rfq)
    return new_rfq

# =========================================================
# Bids
# =========================================================
def create_bid(db: Session, rfq_id: UUID, bid: schemas.BidCreate, vendor_id: UUID) -> models.StorageBid:
    rfq = db.query(models.StorageRFQ).filter(models.StorageRFQ.id == rfq_id).first()
    if not rfq or rfq.status != "OPEN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RFQ not open for bids")

    new_bid = models.StorageBid(
        rfq_id=rfq_id,
        location_id=bid.location_id,
        vendor_id=vendor_id,
        price_text=bid.price_text,
        eta_hours=bid.eta_hours,
        notes=bid.notes
    )
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    return new_bid

# =========================================================
# Jobs
# =========================================================
def award_job(db: Session, bid_id: UUID, landowner_id: UUID) -> models.StorageJob:
    bid = db.query(models.StorageBid).filter(models.StorageBid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bid not found")

    rfq = bid.rfq
    if rfq.status != "OPEN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RFQ already awarded or closed")

    rfq.status = "AWARDED"
    job = models.StorageJob(
        rfq_id=rfq.id,
        location_id=bid.location_id,
        awarded_bid_id=bid.id,
        vendor_id=bid.vendor_id,
        status=models.StorageJobStatus.SCHEDULED,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

# =========================================================
# Proofs
# =========================================================
def add_proof(db: Session, proof: schemas.ProofCreate, user_role: str) -> models.StorageProof:
    job = db.query(models.StorageJob).filter(models.StorageJob.id == proof.job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    new_proof = models.StorageProof(
        job_id=proof.job_id,
        proof_type=proof.proof_type,
        photo_url=proof.photo_url,
        receipt_url=proof.receipt_url,
        lat=proof.lat,
        lon=proof.lon,
        notes=proof.notes
    )

    if user_role == "farmer":
        new_proof.farmer_confirmed = True
    elif user_role == "vendor":
        new_proof.vendor_confirmed = True

    db.add(new_proof)
    db.commit()
    db.refresh(new_proof)

    # Dual confirmation → update job status
    if new_proof.farmer_confirmed and new_proof.vendor_confirmed:
        if proof.proof_type == models.StorageProofType.INTAKE:
            job.status = models.StorageJobStatus.IN_STORAGE
        elif proof.proof_type == models.StorageProofType.DISPATCH:
            job.status = models.StorageJobStatus.RELEASED
        db.commit()

    return new_proof

# =========================================================
# Inspection + Auto RFQ (AgriCopilot integration)
# =========================================================
def analyze_and_create_rfq(
    db: Session,
    inspection: schemas.InspectionCreate,
    ai_analysis: dict
) -> models.CropInspection:
    """
    - `ai_analysis` is the dict returned by StorageGuardAgent (crop, grade, defects, recommendation).
    - This function saves inspection + creates an RFQ automatically.
    """
    new_inspection = models.CropInspection(
        farmer_id=inspection.farmer_id,
        crop_detected=ai_analysis.get("crop_detected"),
        grade=ai_analysis.get("grade"),
        defects=ai_analysis.get("defects", {}),
        recommendation=ai_analysis.get("recommendation"),
        image_urls=inspection.image_urls
    )
    db.add(new_inspection)
    db.commit()
    db.refresh(new_inspection)

    # Auto-create RFQ only if grade not REJECTED
    if new_inspection.grade and new_inspection.grade != "REJECTED":
        auto_rfq = models.StorageRFQ(
            requester_id=inspection.farmer_id,
            crop=new_inspection.crop_detected,
            quantity_kg=1000,  # TODO: estimate from images or farmer input
            storage_type=models.StorageType.cold_storage,  # TODO: infer from AI rec
            duration_days=30,
            origin_lat=0.0,
            origin_lon=0.0,
            status="OPEN"
        )
        db.add(auto_rfq)
        db.commit()
        db.refresh(auto_rfq)

        new_inspection.rfq_id = auto_rfq.id
        db.commit()
        db.refresh(new_inspection)

    return new_inspection
