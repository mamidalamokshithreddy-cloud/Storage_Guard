from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from pymongo import MongoClient, ASCENDING, DESCENDING, GEOSPHERE
from app.core.config import settings
from app.connections.mongo_connection import get_mongo_db

# Enums for validation
class UserRole(str, Enum):
    vendor = "vendor"
    farmer = "farmer"
    buyer = "buyer"
    admin = "admin"
    officer = "officer"
    landowner = "landowner"

class ServiceType(str, Enum):
    seed_supply = "seed_supply"
    drone_spraying = "drone_spraying"
    soil_testing = "soil_testing"
    tractor_rental = "tractor_rental"
    logistics = "logistics"
    storage = "storage"
    input_supply = "input_supply"
    other = "other"

class RfqStatus(str, Enum):
    open = "open"
    under_review = "under_review"
    awarded = "awarded"
    cancelled = "cancelled"
    expired = "expired"
    closed = "closed"

class BidStatus(str, Enum):
    submitted = "submitted"
    withdrawn = "withdrawn"
    won = "won"
    lost = "lost"
    expired = "expired"
    countered = "countered"

class JobStatus(str, Enum):
    new = "new"
    in_progress = "in_progress"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"
    sla_breached = "sla_breached"

class InvoiceStatus(str, Enum):
    draft = "draft"
    issued = "issued"
    paid = "paid"
    void = "void"

class PaymentMethod(str, Enum):
    upi = "upi"
    card = "card"
    netbanking = "netbanking"
    cash = "cash"
    wallet = "wallet"
    escrow = "escrow"
    bank_transfer = "bank_transfer"

class PaymentStatus(str, Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"
    disputed = "disputed"

class InventoryStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    out_of_stock = "out_of_stock"

class TelemetryReading(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    plot_id: str
    metric: str
    value: float
    ts: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NegotiationThread(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    bid_id: str
    buyer_id: str
    seller_id: str
    status: str = "active"
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NegotiationMessage(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    thread_id: str
    sender_id: str
    message: Optional[str]
    voice_recording_url: Optional[str]
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MarketInsight(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    crop_type: str
    region: Optional[str]
    current_price: Optional[float]
    price_change_percentage: Optional[float]
    week_high: Optional[float]
    week_low: Optional[float]
    volume: Optional[float]
    trend: Optional[str]
    ai_recommendations: Optional[Dict[str, Any]]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class CropSale(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    harvest_id: str
    farm_id: Optional[str]
    crop_batch_id: Optional[str]
    ai_suggested_price: Optional[float]
    market_option: Optional[str]
    listing_details: Optional[Dict[str, Any]]
    buyer_id: Optional[str]
    buyer_offers: Optional[Dict[str, Any]]
    contract_terms: Optional[str]
    logistics_required: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ConsumerDelivery(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    buyer_coordination_id: str
    farm_id: Optional[str]
    crop_id: Optional[str]
    gps_tracking_data: Optional[Dict[str, Any]]
    proof_of_delivery: Optional[str]
    current_location_text: Optional[str]
    progress_percentage: Optional[int]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class VendorLocation(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    vendor_id: str
    location: Optional[Dict[str, Any]]
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class BuyerDetail(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    buyer_id: str
    billing_address: Optional[Dict[str, Any]]
    payment_methods: Optional[List[Dict[str, Any]]]
    location: Optional[Dict[str, Any]]
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SowingDocument(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    sowing_id: str
    proof_of_sowing: Optional[str]
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class VendorScheduleDocument(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    schedule_id: str
    proof_of_delivery: Optional[str]
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class InvoiceDocument(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    invoice_id: str
    pdf_attachment_id: Optional[str]
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SeedDetail(BaseModel):
    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    seed_id: str
    certifications: Optional[List[str]]
    image_url: Optional[str]
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

def setup_mongodb():
    # Use central connection configured via app.core.config + connections.mongo_connection
    db = get_mongo_db(settings.mongodb_name)

    collections = [
        ("telemetry_readings", [
            ([("plot_id", ASCENDING), ("ts", DESCENDING)], {})
        ]),
        ("negotiation_threads", [({"bid_id": ASCENDING}, {})]),
        ("negotiation_messages", [({"thread_id": ASCENDING}, {})]),
        ("market_insights", [({"crop_type": ASCENDING, "region": ASCENDING}, {})]),
        ("crop_sales", [({"harvest_id": ASCENDING}, {}), ({"buyer_id": ASCENDING}, {})]),
        ("consumer_delivery", [({"buyer_coordination_id": ASCENDING}, {})]),
        ("vendor_locations", [({"vendor_id": ASCENDING}, {}), ({"location": GEOSPHERE}, {})]),
        ("buyer_details", [({"buyer_id": ASCENDING}, {})]),
        ("sowing_documents", [({"sowing_id": ASCENDING}, {})]),
        ("vendor_schedule_documents", [({"schedule_id": ASCENDING}, {})]),
        ("invoice_documents", [({"invoice_id": ASCENDING}, {})]),
        ("seed_details", [({"seed_id": ASCENDING}, {})]),
    ]

    # Get existing collections
    existing_collections = db.list_collection_names()
    
    # Create telemetry_readings collection with timeseries if it doesn't exist
    if "telemetry_readings" not in existing_collections:
        db.create_collection(
            "telemetry_readings",
            timeseries={"timeField": "ts", "metaField": "plot_id", "granularity": "seconds"}
        )
        print("Created collection: telemetry_readings (timeseries)")
    else:
        print("Collection already exists: telemetry_readings")
    
    # Create index for telemetry_readings (this is safe to run multiple times)
    db.telemetry_readings.create_index([("plot_id", ASCENDING), ("ts", DESCENDING)])

    # Create other collections and indexes
    collections_created = 0
    collections_skipped = 0
    
    for collection_name, indexes in collections:
        if collection_name not in existing_collections:
            # Create collection implicitly by creating indexes
            collection = db[collection_name]
            print(f"Created collection: {collection_name}")
            collections_created += 1
        else:
            collection = db[collection_name]
            print(f"Collection already exists: {collection_name}")
            collections_skipped += 1
            
        # Create indexes (safe to run multiple times)
        for index_keys, index_options in indexes:
            collection.create_index(index_keys, **index_options)
    
    print(f"\nSummary: {collections_created} collections created, {collections_skipped} collections already existed")

    return db
