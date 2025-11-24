from sqlalchemy import (
    Column, String, Integer, Numeric, Boolean, Date, DateTime, ForeignKey, Text, Float, JSON,
    ARRAY, Index, func, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
try:
    from geoalchemy2 import Geometry as GEOMETRY
except ImportError:
    raise ImportError("Missing geoalchemy2. Install with: pip install geoalchemy2")

from app.connections.postgres_connection import engine, Base
from app.core.config import settings
from sqlalchemy.orm import relationship, sessionmaker
import enum
import uuid
import os
from dotenv import load_dotenv
from sqlalchemy.sql import expression
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from datetime import datetime
from sqlalchemy import MetaData

# Ensure all tables target the configured schema (default 'public')
Base.metadata.schema = getattr(settings, "db_schema", "public")

# ---------------- ENUM Types ---------------- #
class UserRole(enum.Enum):
    vendor = "vendor"
    farmer = "farmer"
    buyer = "buyer"
    admin = "admin"
    agri_copilot = "agri_copilot"
    officer = "officer"
    landowner = "landowner"

class ServiceType(enum.Enum):
    seed_supply = "seed_supply"
    drone_spraying = "drone_spraying"
    soil_testing = "soil_testing"
    tractor_rental = "tractor_rental"
    logistics = "logistics"
    storage = "storage"
    input_supply = "input_supply"
    other = "other"

class RfqStatus(enum.Enum):
    open = "open"
    under_review = "under_review"
    awarded = "awarded"
    cancelled = "cancelled"
    expired = "expired"
    closed = "closed"

class BidStatus(enum.Enum):
    submitted = "submitted"
    withdrawn = "withdrawn"
    won = "won"
    lost = "lost"
    expired = "expired"
    countered = "countered"

class JobStatus(enum.Enum):
    new = "new"
    in_progress = "in_progress"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"
    sla_breached = "sla_breached"

class InvoiceStatus(enum.Enum):
    draft = "draft"
    issued = "issued"
    paid = "paid"
    void = "void"

class PaymentMethod(enum.Enum):
    upi = "upi"
    card = "card"
    netbanking = "netbanking"
    cash = "cash"
    wallet = "wallet"
    escrow = "escrow"
    bank_transfer = "bank_transfer"

class PaymentStatus(enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"
    disputed = "disputed"

class InventoryStatus(enum.Enum):
    active = "active"
    inactive = "inactive"
    out_of_stock = "out_of_stock"

class ApprovalStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    modified = "modified"

class LandUse(enum.Enum):
    cultivated = "cultivated"
    fallow = "fallow"
    leased = "leased"
    mixed = "mixed"

class SeedingMethod(enum.Enum):
    manual = "manual"
    tractor = "tractor"
    drone = "drone"

class IrrigationMethod(enum.Enum):
    drip = "drip"
    flood = "flood"
    sprinkler = "sprinkler"

class LandUseEnum(enum.Enum):
    cultivated = "cultivated"
    fallow = "fallow"
    leased = "leased"
    mixed = "mixed"

class BusinessTypeEnum(enum.Enum):
    equipment_supplier = "equipment_supplier"
    seed_supplier = "seed_supplier"
    fertilizer_supplier = "fertilizer_supplier"
    pesticide_supplier = "pesticide_supplier"
    service_provider = "service_provider"
    technology_provider = "technology_provider"

class BuyerBusinessTypeEnum(enum.Enum):
    retailer = "retailer"
    wholesaler = "wholesaler"
    processor = "processor"
    exporter = "exporter"

class LeaseType(enum.Enum):
    seasonal = "seasonal"
    annual = "annual"
    multi_year = "multi_year"
    sharecropping = "sharecropping"
    cash_rent = "cash_rent"

class WorkType(enum.Enum):
    land_onboarding = "land_onboarding"
    soil_test_portable = "soil_test_portable" 
    drone_lab_testing = "drone_lab_testing"

class WorkStatus(enum.Enum):
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class WorkPriority(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class LeaseStatus(enum.Enum):
    active = "active"
    pending = "pending"
    expired = "expired"
    terminated = "terminated"
    cancelled = "cancelled"

class StorageType(str, enum.Enum):
    cold_storage = "cold_storage"
    dry_storage  = "dry_storage"
    transport    = "transport"
    processing   = "processing"

class StorageJobStatus(str, enum.Enum):
    SCHEDULED  = "SCHEDULED"
    IN_STORAGE = "IN_STORAGE"
    RELEASED   = "RELEASED"
    CLOSED     = "CLOSED"
    DISPUTE    = "DISPUTE"

class StorageProofType(str, enum.Enum):
    INTAKE   = "INTAKE"
    DISPATCH = "DISPATCH"

# ---------------- User ---------------- #
class User(Base):
    __tablename__ = "users"
    
    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    custom_id = Column(String(20), unique=True, index=True)
    role = Column(String(32), nullable=False)
    
    # Authentication fields
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # Address fields
    address_line1 = Column(String(255))
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100))
    state = Column(String(100))
    mandal = Column(String(100), nullable=True)  # Mandal field added
    country = Column(String(100), default="IN")
    postal_code = Column(String(20))
    
    # Additional fields from second schema
    locale = Column(String, default="en-IN")
    subscription_status = Column(String, default="free")
    
    # Status fields
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String)
    verification_token_expires = Column(DateTime(timezone=True))
    last_login = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    farmer = relationship("Farmer", back_populates="user", uselist=False, cascade="all, delete-orphan", 
                         foreign_keys="Farmer.user_id")
    landowner = relationship("Landowner", back_populates="user", uselist=False, cascade="all, delete-orphan",
                           foreign_keys="Landowner.user_id")
    vendor = relationship("Vendor", back_populates="user", uselist=False, cascade="all, delete-orphan",
                        foreign_keys="Vendor.user_id")
    buyer = relationship("Buyer", back_populates="user", uselist=False, cascade="all, delete-orphan",
                        foreign_keys="Buyer.user_id")
    agri_copilot = relationship("AgriCopilot", 
                               back_populates="user", 
                               uselist=False, 
                               cascade="all, delete-orphan",
                               foreign_keys="AgriCopilot.user_id",  # Explicitly specify which foreign key to use
                               primaryjoin="User.id == AgriCopilot.user_id")
    admin = relationship("Admin", back_populates="user", uselist=False, cascade="all, delete-orphan",
                        foreign_keys="Admin.user_id")
    officer = relationship("Officer", back_populates="user", uselist=False, cascade="all, delete-orphan",
                          foreign_keys="Officer.user_id")
    
    # Additional relationships from second schema
    recommendations = relationship("RecommendationHistory", back_populates="user")
    soil_tests = relationship("SoilTest", back_populates="user")
    
    # Indices
    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_phone", "phone"),
        Index("idx_user_custom_id", "custom_id")
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
    def set_custom_id(self, db):
        """Set a custom ID based on user role and sequential number"""
        role_prefixes = {
            "vendor": "VD",
            "farmer": "FM",
            "buyer": "BY",
            "admin": "AD",
            "agri_copilot": "AC",
            "officer": "OF",
            "landowner": "LO"
        }
        
        # Convert role to string if it's an enum
        role_str = self.role.value if hasattr(self.role, 'value') else str(self.role)
        
        # Get prefix based on role
        prefix = role_prefixes.get(role_str, "US")
        
        # Count existing users with same role to get next number
        count = db.query(User).filter(User.role == role_str).count()
        
        # Generate custom ID (e.g., VD00001 for first vendor)
        self.custom_id = f"{prefix}{str(count + 1).zfill(5)}"
        if not self.custom_id:
            self.custom_id = generate_user_id(role_str, self.id, None)
    
    @property
    def is_authenticated(self):
        """Check if user is authenticated"""
        return True if self.is_active and self.is_verified else False
    
    @property
    def display_name(self):
        """Return the display name for the user"""
        if hasattr(self, 'full_name') and self.full_name:
            return self.full_name
        return self.email.split('@')[0]

# Counter dictionary to keep track of IDs for each user type
user_type_counters = {
    "farmer": 0,
    "landowner": 0,
    "vendor": 0,
    "buyer": 0,
    "agri_copilot": 0,
    "officer": 0,
    "admin": 0
}

def generate_user_id(user_type: UserRole, uuid_val: uuid.UUID, db_session=None):
    # Normalize incoming role to string (accepts enum or string)
    role_str = user_type.value if isinstance(user_type, enum.Enum) else str(user_type)
    prefix_map = {
        'farmer': 'F',
        'landowner': 'L',
        'vendor': 'V',
        'buyer': 'B',
        'agri_copilot': 'AC',
        'officer': 'OF',
        'admin': 'AD'
    }
    
    # Get the prefix for this user type
    prefix = prefix_map.get(role_str, 'U')
    
    if db_session is not None:
        try:
            # Get all custom_ids for this user type
            result = db_session.query(User.custom_id).filter(
                User.role == role_str,
                User.custom_id.like(f"{prefix}-%")
            ).all()
            
            # Extract the numeric part and find the max
            max_num = 0
            for row in result:
                if row[0]:
                    try:
                        # Extract number part after the prefix and hyphen
                        num_str = row[0].split('-', 1)[1]
                        num = int(num_str)
                        max_num = max(max_num, num)
                    except (ValueError, IndexError):
                        continue
            
            # If no existing IDs found, start from 1, else increment the max
            next_num = max_num + 1 if max_num > 0 else 1
            
            # Format the sequential number with leading zeros
            sequential_num = f"{next_num:03d}"
            return f"{prefix}-{sequential_num}"
            
        except Exception as e:
            # Log the error and fallback to counter method
            print(f"Error generating user ID: {str(e)}")
    
    # Fallback: Use the counter method if no db_session is provided or if there was an error
    user_type_counters[role_str] = user_type_counters.get(role_str, 0) + 1
    sequential_num = f"{user_type_counters[role_str]:03d}"
    return f"{prefix}-{sequential_num}"

class Admin(Base): 
    __tablename__ = "admins"
    
    # Primary and identification fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    # Admin specific fields
    is_super_admin = Column(Boolean, default=False)
    department = Column(String)
    permissions = Column(String)  # JSON string of admin permissions
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="admin")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # No need for custom_id as it will use the User model's custom_id

class Officer(Base):
    __tablename__ = "officers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    jurisdiction = Column(String)
    designation = Column(String)
    department = Column(String)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="officer")

# ---------------- Farmer ---------------- #
class Farmer(Base):
    __tablename__ = "farmers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    # Common user fields
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String, unique=True)
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    mandal = Column(String(100), nullable=True)
    postal_code = Column(String)
    country = Column(String, default="IN")
    # Farmer specific fields
    farm_size = Column(Numeric(10, 2), nullable=False)
    primary_crop_types = Column(String(500))
    years_of_experience = Column(Integer)
    farmer_location = Column(String(255))
    # Document fields
    photo_url = Column(String(500))
    aadhar_front_url = Column(String(500))
    aadhar_number = Column(String(12))
    # Verification fields
    verification_status = Column(String(32), default="pending")
    is_verified = Column(Boolean, default=False)
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    user = relationship("User", back_populates="farmer")

# ---------------- Landowner ---------------- #
class Landowner(Base):
    __tablename__ = "landowners"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    # Common user fields
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String, unique=True)
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    mandal = Column(String(100), nullable=True)
    postal_code = Column(String)
    country = Column(String, default="IN")
    # Landowner specific fields
    total_land_area = Column(Numeric(10, 2), nullable=False)
    current_land_use = Column(String(32), nullable=False)
    managing_remotely = Column(Boolean, default=False)
    # Document fields
    photo_url = Column(String(500))
    aadhar_front_url = Column(String(500))
    aadhar_number = Column(String(12))
    # Verification fields
    verification_status = Column(String(32), default="pending")
    is_verified = Column(Boolean, default=False)
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    user = relationship("User", back_populates="landowner")

# ---------------- AgriCopilot ---------------- #
class AgriCopilot(Base):
    __tablename__ = "agri_copilots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    custom_id = Column(String(20), unique=True, index=True)

    # Basic details
    full_name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)

    # Identity
    aadhar_number = Column(String(20), nullable=False, unique=True)
    password_hash = Column(String, nullable=False)

    # Address fields (required for token-based registration)
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    mandal = Column(String(100), nullable=True)  # Mandal field added
    postal_code = Column(String)
    country = Column(String, default="IN")

    # Uploaded documents
    photo_url = Column(String)
    aadhar_front_url = Column(String)

    # Verification & admin control
    is_verified = Column(Boolean, default=False)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True))
    verification_status = Column(String(32), default="pending")
    verification_notes = Column(Text)

    # User Reference
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

# Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="agri_copilot")
    verifier = relationship("User", foreign_keys=[verified_by], backref="verified_copilots")
    
    def set_custom_id(self, db_session=None):
        prefix = "AC"
        if db_session is None:
            # Fallback for tests or scenarios without a db session
            import time
            self.custom_id = f"{prefix}-{int(time.time() * 1000) % 100000:05d}"
            return

        # This logic is better but can still have race conditions.
        # For a highly concurrent system, a database sequence is best.
        result = db_session.query(AgriCopilot.custom_id).filter(AgriCopilot.custom_id.like(f"{prefix}-%")).all()
        max_num = 0
        for row in result:
            if row[0]:
                try:
                    num = int(row[0].split('-', 1)[1])
                    max_num = max(max_num, num)
                except (ValueError, IndexError):
                    continue
        next_num = max_num + 1
        self.custom_id = f"{prefix}-{next_num:04d}"

# ---------------- Vendor ---------------- #
class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    # Common user fields
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String, unique=True)
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    mandal = Column(String(100), nullable=True)  # Mandal field added
    postal_code = Column(String)
    country = Column(String, default="IN")
    # Vendor specific fields
    legal_name = Column(String)
    business_name = Column(String)
    gstin = Column(String)
    pan = Column(String)
    business_type = Column(String(64))
    product_services = Column(String)
    years_in_business = Column(Integer)
    service_area = Column(String)
    rating_avg = Column(Numeric(3, 2), default=0.0)
    rating_count = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    certification_status = Column(String, default="PENDING")
    # Document fields
    photo_url = Column(String(500))
    aadhar_front_url = Column(String(500))
    aadhar_number = Column(String(12))
    # Verification fields
    verification_status = Column(String(32), default="pending")
    is_verified = Column(Boolean, default=False)
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="vendor")
    
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

# ---------------- Buyer ---------------- #
class Buyer(Base):
    __tablename__ = "buyers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    # Common user fields
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String, unique=True)
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    mandal = Column(String(100), nullable=True)
    postal_code = Column(String)
    country = Column(String, default="IN")
    # Buyer specific fields
    organization_name = Column(String)
    buyer_type = Column(String)
    interested_crop_types = Column(Text)
    preferred_products = Column(String)
    monthly_purchase_volume = Column(Numeric(10, 2))
    business_license_number = Column(String)
    gst_number = Column(String)
    reliability_score = Column(Numeric(3, 2), default=0.0)
    # Document fields
    photo_url = Column(String(500))
    aadhar_front_url = Column(String(500))
    aadhar_number = Column(String(12))
    # Verification fields
    verification_status = Column(String(32), default="pending")
    is_verified = Column(Boolean, default=False)
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="buyer")


# ---------------- BuyerPreferences ---------------- #
class BuyerPreferences(Base):
    __tablename__ = "buyer_preferences"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("buyers.user_id", ondelete="CASCADE"), unique=True)
    crop_types = Column(ARRAY(String), nullable=True)  # e.g., ["rice", "wheat"]
    quality_grades = Column(ARRAY(String), nullable=True)  # e.g., ["A", "B"]
    min_quantity_kg = Column(Numeric(10, 2), nullable=True)
    max_quantity_kg = Column(Numeric(10, 2), nullable=True)
    preferred_locations = Column(ARRAY(String), nullable=True)  # Districts/states
    max_distance_km = Column(Integer, nullable=True)
    payment_terms = Column(String(100), nullable=True)  # e.g., "50% advance, 50% on delivery"
    delivery_preference = Column(String(50), nullable=True)  # "PICKUP", "DELIVERY", "BOTH"
    auto_match_enabled = Column(Boolean, default=True)
    notification_enabled = Column(Boolean, default=True)
    price_alert_threshold = Column(Numeric(10, 2), nullable=True)  # Alert when price drops below this
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ---------------- PasswordResetToken ---------------- #
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    token = Column(String(255), nullable=False, unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User")

class LandParcel(Base):
    __tablename__ = "land_parcels"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    # geometry = Column(GEOMETRY(geometry_type="MULTIPOLYGON", srid=4326))  # Commented out until PostGIS is enabled
    acreage = Column(Numeric(10, 2), nullable=False)
    water_source = Column(String)
    soil_type = Column(String)
    current_land_use = Column(String(32), default="mixed")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    owner = relationship("User")
    # __table_args__ = (Index("idx_land_parcels_geometry", "geometry", postgresql_using="gist"),)  # Commented out until PostGIS is enabled

class Plot(Base):
    __tablename__ = "plots"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("land_parcels.id", ondelete="CASCADE"))
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    plot_name = Column(String)
    area = Column(Numeric(10, 2))
    crop = Column(String)
    season = Column(String)
    status = Column(String, default="ACTIVE")
    crop_history = Column(String)
    # Additional fields from second schema
    landowner_name = Column(String(255), nullable=True)
    survey_no = Column(String(100), nullable=True)
    village = Column(String(100), nullable=True)
    mandal = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    parcel = relationship("LandParcel")
    farmer = relationship("User")
    weather_data = relationship("WeatherData", back_populates="plot")

class SoilThreshold(Base):
    __tablename__ = "soil_thresholds"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parameter = Column(String, nullable=False, unique=True)  # e.g., "nitrogen"
    min_value = Column(Numeric(10, 2))
    max_value = Column(Numeric(10, 2))
    ideal_description = Column(String)
    recommendation_action = Column(String)
    recommendation_impact = Column(String)
    priority = Column(String)  # e.g., "high", "medium", "low"
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

class SoilHealth(Base):
    __tablename__ = "soil_health"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="SET NULL"))
    parameter = Column(String, nullable=False)
    value = Column(Numeric(10, 2))
    ideal = Column(String)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    plot = relationship("Plot")

class LabReport(Base):
    __tablename__ = "lab_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="CASCADE"))
    report_date = Column(Date)
    summary = Column(Text)
    attachment_url = Column(String)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    plot = relationship("Plot")

class LandLease(Base):
    __tablename__ = "land_leases"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="CASCADE"))
    lessor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))  # Plot owner
    lessee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))  # Farmer/Lessee
    
    # Lease details
    lessee_name = Column(String, nullable=False)
    lessee_contact = Column(String, nullable=False)
    lease_type = Column(String(32), nullable=False)
    lease_duration = Column(String)  # e.g., "6 months", "1 year"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Terms & Conditions
    standard_terms = Column(Text)
    special_conditions = Column(Text)
    
    # Agreement & Status
    agreement_generated = Column(Boolean, default=False)
    agreement_document_id = Column(String)  # MongoDB document ID
    status = Column(String(32), default="pending")
    
    # Financial terms (optional)
    rent_amount = Column(Numeric(10, 2))
    rent_frequency = Column(String)  # monthly, quarterly, annually
    security_deposit = Column(Numeric(10, 2))
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    plot = relationship("Plot")
    lessor = relationship("User", foreign_keys=[lessor_id])
    lessee = relationship("User", foreign_keys=[lessee_id])

class WorkAssignment(Base):
    __tablename__ = "work_assignments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    landowner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    agri_pilot_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="CASCADE"), nullable=False)
    work_type = Column(String(32), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    priority = Column(String(32), default="medium")
    status = Column(String(32), default="assigned")
    assigned_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    due_date = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    landowner = relationship("User", foreign_keys=[landowner_id])
    agri_pilot = relationship("User", foreign_keys=[agri_pilot_id])
    plot = relationship("Plot")

class Seed(Base):
    __tablename__ = "seeds"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    seed_type = Column(String, nullable=False)
    variety = Column(String)
    quantity_available = Column(Numeric(10, 2))
    price_per_unit = Column(Numeric(10, 2))
    unit = Column(String, default="kg")
    status = Column(String(32), default="active")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    vendor = relationship("Vendor")

class Sowing(Base):
    __tablename__ = "sowing"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="CASCADE"))
    seed_id = Column(UUID(as_uuid=True), ForeignKey("seeds.id", ondelete="SET NULL"))
    sowing_date = Column(Date, nullable=False)
    seed_variety = Column(String)
    seed_batch_number = Column(String)
    seeding_method = Column(String(32), default="manual")
    quantity_used = Column(Numeric(10, 2))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    plot = relationship("Plot")
    seed = relationship("Seed")
    vendor = relationship("Vendor")

class SoilTest(Base):
    __tablename__ = "soil_tests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="CASCADE"))
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    lab_vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    status = Column(String, default="PENDING")
    test_date = Column(Date)
    ph_level = Column(Numeric(4, 2))
    nitrogen_content = Column(Numeric(10, 2))
    phosphorus_content = Column(Numeric(10, 2))
    potassium_content = Column(Numeric(10, 2))
    
    # ML-Enhanced fields for seed planner integration from second schema
    temperature = Column(Numeric(5, 2), nullable=True)  # Environmental data for ML
    humidity = Column(Numeric(5, 2), nullable=True)
    rainfall = Column(Numeric(10, 2), nullable=True)
    latitude = Column(Numeric(8, 5), nullable=True)
    longitude = Column(Numeric(8, 5), nullable=True)
    region = Column(String(100), nullable=True)
    field_size = Column(Numeric(10, 2), nullable=True)
    season_type = Column(String(20), nullable=True)  # kharif, rabi, etc.
    
    # ML Processing metadata
    ml_processed = Column(Boolean, default=False)
    ml_confidence = Column(Numeric(5, 2), nullable=True)
    data_quality_score = Column(Numeric(5, 2), nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    requester = relationship("User", back_populates="soil_tests")
    lab_vendor = relationship("Vendor")
    
    # Additional relationships from second schema
    user = relationship("User", foreign_keys=[requested_by], back_populates="soil_tests")
    recommendation_history = relationship("RecommendationHistory", back_populates="soil_test")
    crop_recommendations = relationship("CropRecommendation", back_populates="soil_test")
    weather_data = relationship("WeatherData", back_populates="soil_test")

class CropPlan(Base):
    __tablename__ = "crop_plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="CASCADE"))
    season = Column(String)
    year = Column(Integer)
    primary_crop = Column(String, nullable=False)
    intercrop = Column(String)
    sowing_date = Column(Date)
    yield_forecast = Column(Numeric(10, 2))
    approval_status = Column(String(32), default="pending")
    approved_by = Column(UUID(as_uuid=True), ForeignKey("agri_copilots.id", ondelete="SET NULL"))
    
    # ML Recommendation Integration from second schema
    ml_recommended = Column(Boolean, default=False)  # Was this generated by ML?
    ml_confidence = Column(Numeric(5, 2), nullable=True)  # ML model confidence
    suitability_grade = Column(String(5), nullable=True)  # A, B, C grade
    alternative_crops = Column(JSONB, nullable=True)  # Alternative crop suggestions
    soil_improvements = Column(JSONB, nullable=True)  # Soil improvement recommendations
    resource_requirements = Column(JSONB, nullable=True)  # Resource needs analysis
    weather_risk_assessment = Column(JSONB, nullable=True)  # Weather-based risk analysis
    
    # Source tracking
    recommendation_source = Column(String(50), nullable=True)  # 'ML_MODEL', 'MANUAL', 'EXPERT'
    source_soil_test_id = Column(UUID(as_uuid=True), ForeignKey("soil_tests.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    plot = relationship("Plot")
    agri_copilot = relationship("AgriCopilot")
    source_soil_test = relationship("SoilTest", foreign_keys=[source_soil_test_id])

class Irrigation(Base):
    __tablename__ = "irrigation"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="CASCADE"))
    method = Column(String(32), default="drip")
    schedule_date = Column(Date)
    duration_minutes = Column(Integer)
    water_quantity_liters = Column(Numeric(10, 2))
    cost_incurred = Column(Numeric(10, 2))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    plot = relationship("Plot")

class VendorSchedule(Base):
    __tablename__ = "vendor_schedules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="CASCADE"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    service_type = Column(String(64), nullable=False)
    task_details = Column(String)
    scheduled_date = Column(Date)
    sla_terms = Column(String)
    status = Column(String(32), default="new")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    plot = relationship("Plot")
    vendor = relationship("Vendor")

class Rfq(Base):
    __tablename__ = "rfqs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="SET NULL"))
    crop_type = Column(String, nullable=False)
    service_needed = Column(String(64), nullable=False)
    description = Column(String)
    location_text = Column(String)
    sla_due_at = Column(DateTime(timezone=True))
    budget_min = Column(Numeric(10, 2))
    budget_max = Column(Numeric(10, 2))
    status = Column(String(32), default="open")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    requester = relationship("User")
    plot = relationship("Plot")

class Bid(Base):
    __tablename__ = "bids"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="CASCADE"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="INR")
    timeline_days = Column(Integer)
    notes = Column(String)
    counter_offer = Column(Numeric(10, 2))
    status = Column(String(32), default="submitted")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    rfq = relationship("Rfq")
    vendor = relationship("Vendor")

class JobAward(Base):
    __tablename__ = "job_awards"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="CASCADE"), unique=True)
    winning_bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id", ondelete="CASCADE"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    awarded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    rfq = relationship("Rfq")
    bid = relationship("Bid")
    vendor = relationship("Vendor")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="CASCADE"))
    awarded_bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id", ondelete="CASCADE"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="SET NULL"))
    title = Column(String)
    details = Column(String)
    status = Column(String(32), default="new")
    sla_due_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    rfq = relationship("Rfq")
    bid = relationship("Bid")
    vendor = relationship("Vendor")
    requester = relationship("User")
    plot = relationship("Plot")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="SET NULL"))
    crop_sale_id = Column(UUID(as_uuid=True))
    order_id = Column(UUID(as_uuid=True))
    invoice_number = Column(String, nullable=False, unique=True)
    currency = Column(String, default="INR")
    subtotal_amount = Column(Numeric(10, 2), default=0.0)
    tax_amount = Column(Numeric(10, 2), default=0.0)
    total_amount = Column(Numeric(10, 2), default=0.0)
    status = Column(String(32), default="draft")
    issued_at = Column(DateTime(timezone=True))
    due_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    vendor = relationship("Vendor")
    job = relationship("Job")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"))
    description = Column(String, nullable=False)
    quantity = Column(Numeric(10, 2), default=1.0)
    unit_price = Column(Numeric(10, 2), default=0.0)
    amount = Column(Numeric(10, 2), default=0.0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    invoice = relationship("Invoice")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"))
    order_id = Column(UUID(as_uuid=True))
    method = Column(String(32), nullable=False)
    status = Column(String(32), default="pending")
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="INR")
    transaction_ref = Column(String)
    paid_at = Column(DateTime(timezone=True))
    days_remaining = Column(Integer)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    invoice = relationship("Invoice")

class InputRequest(Base):
    __tablename__ = "input_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="SET NULL"))
    input_type = Column(String)
    product_name = Column(String)
    risk_level = Column(String)
    approval_status = Column(String(32), default="pending")
    approved_by = Column(UUID(as_uuid=True), ForeignKey("agri_copilots.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    farmer = relationship("User")
    plot = relationship("Plot")
    agri_copilot = relationship("AgriCopilot")

class Subsidy(Base):
    __tablename__ = "subsidies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id", ondelete="SET NULL"))
    scheme_name = Column(String)
    amount = Column(Numeric(10, 2))
    status = Column(String(32), default="pending")
    approved_by = Column(UUID(as_uuid=True), ForeignKey("agri_copilots.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    farmer = relationship("User")
    plot = relationship("Plot")
    agri_copilot = relationship("AgriCopilot")

# --- Consolidated Weather & ML Tracking Tables ---
class WeatherData(Base):
    __tablename__ = "weather_data"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign keys
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id"), nullable=True)
    soil_test_id = Column(UUID(as_uuid=True), ForeignKey("soil_tests.id"), nullable=True)
    
    # Weather data
    latitude = Column(Numeric(8, 5), nullable=False)
    longitude = Column(Numeric(8, 5), nullable=False)
    temperature = Column(Numeric(5, 2), nullable=True)
    humidity = Column(Numeric(5, 2), nullable=True)
    pressure = Column(Numeric(8, 2), nullable=True)
    wind_speed = Column(Numeric(8, 2), nullable=True)
    weather_description = Column(String(100), nullable=True)
    api_source = Column(String(50), default="accuweather")
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    plot = relationship("Plot", back_populates="weather_data")
    soil_test = relationship("SoilTest", back_populates="weather_data")

class CropRecommendation(Base):
    """Model for storing crop recommendation details."""
    __tablename__ = "crop_recommendations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to SoilTest
    source_soil_test_id = Column(UUID(as_uuid=True), ForeignKey("soil_tests.id"), nullable=True)
    
    # Recommendation details
    primary_crop = Column(String(50), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    suitability_grade = Column(String(5), nullable=True)
    
    # Alternative recommendations (stored as JSON)
    alternatives = Column(JSON, nullable=True)
    
    # Soil management recommendations
    soil_improvements = Column(JSON, nullable=True)
    
    # Resource requirements
    resource_requirements = Column(JSON, nullable=True)
    
    # Data quality and processing info
    data_quality_score = Column(Float, nullable=True)
    processing_info = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship with SoilTest - bidirectional
    soil_test = relationship("SoilTest", back_populates="crop_recommendations")

class RecommendationHistory(Base):
    """Model for tracking recommendation history."""
    __tablename__ = "recommendation_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    soil_test_id = Column(UUID(as_uuid=True), ForeignKey("soil_tests.id"), nullable=True)
    recommendation_id = Column(UUID(as_uuid=True), ForeignKey("crop_recommendations.id"), nullable=True)

    # Store raw request and recommendation payloads for audit and UI
    input_data = Column(JSONB, nullable=True)
    recommendations = Column(JSONB, nullable=True)
    accuracy_score = Column(Float, nullable=True)
    processing_time = Column(Float, nullable=True)
    api_version = Column(String(50), nullable=True)
    
    # Request metadata
    session_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Performance metrics
    api_calls_made = Column(Integer, default=0)
    
    # Feedback (for future ML improvement)
    user_rating = Column(Integer, nullable=True)  # 1-5 stars
    user_feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="recommendations")
    soil_test = relationship("SoilTest", back_populates="recommendation_history")
    crop_recommendation = relationship("CropRecommendation")

class CropProfile(Base):
    """
    Crop profile master data for varieties, seed rates, BOM, and cultivation details.
    Currently using hardcoded data in recommendations.py, will migrate to DB later.
    """
    __tablename__ = "crop_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_name = Column(String(100), index=True, nullable=False)
    variety = Column(String(200), nullable=True)  # e.g., "BPT 5204 (Samba Mahsuri)"
    typical_duration_days = Column(Integer, nullable=True)
    typical_seed_rate_per_ha = Column(Numeric(10, 2), nullable=True)
    baseline_yield_quintal_per_ha = Column(Numeric(10, 2), nullable=True)
    base_investment_per_ha = Column(Numeric(12, 2), nullable=True)
    expected_price_per_quintal = Column(Numeric(10, 2), nullable=True)
    risk_level = Column(String(20), nullable=True)  # Low, Medium, High
    cultivation_notes = Column(JSONB, nullable=True)  # {sowing_window, labor_days, etc.}
    default_bom = Column(JSONB, nullable=True)  # list of {item, qty, unit, unit_cost}
    crop_calendar = Column(JSONB, nullable=True)  # {sowing, irrigation, fertilizer, pest_spray}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())



class StorageLocation(Base):
    __tablename__ = "storage_locations"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    name = Column(String(200), nullable=False)
    type = Column(String(32), nullable=False)
    address = Column(Text, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    capacity_text = Column(String(50), nullable=False)
    price_text = Column(String(50), nullable=False)
    rating = Column(Float, default=4.0)
    phone = Column(String(32))
    hours = Column(String(100))
    facilities = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    vendor = relationship("Vendor")
    __table_args__ = (Index("ix_storage_locations_lat_lon", "lat", "lon"),)


class StorageRFQ(Base):
    __tablename__ = "storage_rfq"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    crop = Column(String(120), nullable=False)
    quantity_kg = Column(Integer, nullable=False)
    storage_type = Column(String(32), nullable=False)
    duration_days = Column(Integer, nullable=False)
    max_budget = Column(Numeric(12, 2))
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    status = Column(String(24), default="OPEN")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    bids = relationship("StorageBid", back_populates="rfq", cascade="all, delete-orphan", passive_deletes=True)
    inspection = relationship("CropInspection", back_populates="rfq", uselist=False)


class StorageBid(Base):
    __tablename__ = "storage_bids"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_rfq.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_locations.id"), nullable=False)
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    price_text = Column(String(64), nullable=False)
    eta_hours = Column(Integer, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    rfq = relationship("StorageRFQ", back_populates="bids")
    location = relationship("StorageLocation")
    vendor = relationship("Vendor")

    __table_args__ = (UniqueConstraint("rfq_id", "location_id", name="uq_storage_bid_rfq_location"),)


class StorageJob(Base):
    __tablename__ = "storage_jobs"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_rfq.id", ondelete="SET NULL"))
    location_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_locations.id", ondelete="SET NULL"))
    awarded_bid_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_bids.id", ondelete="SET NULL"))
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    status = Column(String(32), default="SCHEDULED", nullable=False)
    dsr_number = Column(String(64))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    rfq = relationship("StorageRFQ")
    location = relationship("StorageLocation")
    vendor = relationship("Vendor")
    proofs = relationship("StorageProof", back_populates="job", cascade="all, delete-orphan", passive_deletes=True)


class StorageProof(Base):
    __tablename__ = "storage_proofs"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_jobs.id", ondelete="CASCADE"), nullable=False)
    proof_type = Column(String(32), nullable=False)
    photo_url = Column(Text)
    receipt_url = Column(Text)
    farmer_confirmed = Column(Boolean, default=False)
    vendor_confirmed = Column(Boolean, default=False)
    lat = Column(Float)
    lon = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    job = relationship("StorageJob", back_populates="proofs")


class SLABreach(Base):
    __tablename__ = "storage_sla_breaches"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_jobs.id", ondelete="CASCADE"))
    breach_type = Column(String(64))
    value = Column(Float)
    threshold = Column(Float)
    occurred_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime(timezone=True))
    resolution_notes = Column(Text)


class CropInspection(Base):
    __tablename__ = "crop_inspections"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    crop_detected = Column(String(120))
    grade = Column(String(16))
    defects = Column(JSON, default=dict)
    recommendation = Column(Text)
    image_urls = Column(JSON, default=list)
    shelf_life_days = Column(Integer, nullable=True)
    freshness = Column(String(120), nullable=True)  # NEW: Freshness level
    freshness_score = Column(Numeric(3, 2), nullable=True)  # NEW: 0.00-1.00
    visual_defects = Column(Text, nullable=True)  # NEW: Visual defect summary
    rfq_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_rfq.id", ondelete="SET NULL"))
    rfq = relationship("StorageRFQ", back_populates="inspection", uselist=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


# =========================================================
# DIRECT BOOKING SYSTEM (NEW)
# =========================================================

class StorageBooking(Base):
    """Direct storage booking without RFQ/bid process"""
    __tablename__ = "storage_bookings"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    location_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_locations.id", ondelete="SET NULL"), nullable=False)
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    
    # Crop details
    crop_type = Column(String(120), nullable=False)
    quantity_kg = Column(Integer, nullable=False)
    grade = Column(String(16))
    
    # Storage period
    duration_days = Column(Integer, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    
    # Pricing
    price_per_day = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    
    # Status tracking
    booking_status = Column(String(32), default="pending")  # pending, confirmed, active, completed, cancelled
    payment_status = Column(String(32), default="pending")  # pending, paid, refunded, failed
    
    # References
    ai_inspection_id = Column(PGUUID(as_uuid=True), ForeignKey("crop_inspections.id", ondelete="SET NULL"))
    transport_required = Column(Boolean, default=False)
    transport_booking_id = Column(PGUUID(as_uuid=True), ForeignKey("transport_bookings.id", ondelete="SET NULL"))
    
    # Vendor confirmation
    vendor_confirmed = Column(Boolean, default=False)
    vendor_confirmed_at = Column(DateTime(timezone=True))
    vendor_notes = Column(Text)
    
    # Cancellation
    cancelled_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    cancelled_at = Column(DateTime(timezone=True))
    cancellation_reason = Column(Text)
    
    # Market Integration (Storage → Market Connect)
    listed_for_sale = Column(Boolean, default=False)
    market_listing_id = Column(String(64))  # MongoDB ObjectId
    target_sale_price = Column(Numeric(12, 2))  # Price per quintal
    minimum_sale_price = Column(Numeric(12, 2))  # Minimum acceptable price
    sale_status = Column(String(32))  # LISTED, NEGOTIATING, SOLD, WITHDRAWN
    listed_at = Column(DateTime(timezone=True))
    sold_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_id])
    location = relationship("StorageLocation")
    vendor = relationship("Vendor")
    inspection = relationship("CropInspection")
    payments = relationship("BookingPayment", back_populates="booking", cascade="all, delete-orphan")


class TransportBooking(Base):
    """Transport booking for storage deliveries"""
    __tablename__ = "transport_bookings"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    vehicle_id = Column(PGUUID(as_uuid=True), ForeignKey("transport_vehicles.id", ondelete="SET NULL"))
    
    # Route details
    pickup_location = Column(String(256), nullable=False)
    pickup_lat = Column(Float, nullable=False)
    pickup_lon = Column(Float, nullable=False)
    delivery_location = Column(String(256), nullable=False)
    delivery_lat = Column(Float, nullable=False)
    delivery_lon = Column(Float, nullable=False)
    
    # Cargo details
    cargo_type = Column(String(120), nullable=False)
    cargo_weight_kg = Column(Integer, nullable=False)
    special_requirements = Column(Text)  # refrigerated, sealed, etc.
    
    # Scheduling
    pickup_time = Column(DateTime(timezone=True), nullable=False)
    estimated_delivery_time = Column(DateTime(timezone=True), nullable=False)
    actual_delivery_time = Column(DateTime(timezone=True))
    
    # Pricing
    distance_km = Column(Float)
    transport_cost = Column(Numeric(12, 2), nullable=False)
    
    # Status
    booking_status = Column(String(32), default="pending")  # pending, confirmed, in_transit, delivered, cancelled
    payment_status = Column(String(32), default="pending")
    
    # Tracking
    current_lat = Column(Float)
    current_lon = Column(Float)
    last_location_update = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_id])
    vendor = relationship("Vendor")
    vehicle = relationship("TransportVehicle")
    storage_bookings = relationship("StorageBooking", foreign_keys="StorageBooking.transport_booking_id")
    payments = relationship("BookingPayment", back_populates="transport_booking", cascade="all, delete-orphan")


class ScheduledInspection(Base):
    """On-site quality inspection scheduling for farmers"""
    __tablename__ = "scheduled_inspections"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_bookings.id", ondelete="SET NULL"), nullable=True)
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    
    # Inspection details
    inspection_type = Column(String(32), nullable=False)  # pre_storage, during_storage, final, dispute
    crop_type = Column(String(120), nullable=False)
    quantity_kg = Column(Integer, nullable=False)
    
    # Location
    location_address = Column(Text, nullable=False)
    location_lat = Column(Numeric(10, 8))
    location_lon = Column(Numeric(11, 8))
    
    # Scheduling
    requested_date = Column(DateTime(timezone=True), nullable=False)
    preferred_time_slot = Column(String(32))  # morning, afternoon, evening
    scheduled_date = Column(DateTime(timezone=True))
    completed_date = Column(DateTime(timezone=True))
    
    # Status tracking
    status = Column(String(32), default="pending", nullable=False)  # pending, confirmed, in_progress, completed, cancelled
    
    # Notes and communication
    farmer_notes = Column(Text)
    inspector_notes = Column(Text)
    cancellation_reason = Column(Text)
    
    # Results (linked after completion)
    inspection_result_id = Column(PGUUID(as_uuid=True), ForeignKey("crop_inspections.id", ondelete="SET NULL"))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime(timezone=True))
    
    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_id])
    booking = relationship("StorageBooking", foreign_keys=[booking_id])
    vendor = relationship("Vendor", foreign_keys=[vendor_id])
    inspection_result = relationship("CropInspection", foreign_keys=[inspection_result_id])


class BookingPayment(Base):
    """Payment tracking for storage and transport bookings"""
    __tablename__ = "booking_payments"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_bookings.id", ondelete="CASCADE"))
    transport_booking_id = Column(PGUUID(as_uuid=True), ForeignKey("transport_bookings.id", ondelete="CASCADE"))
    
    # Parties
    payer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=False)  # farmer
    payee_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=False)  # vendor
    
    # Payment details
    amount = Column(Numeric(12, 2), nullable=False)
    payment_type = Column(String(32), nullable=False)  # storage, transport, combined
    payment_method = Column(String(32))  # card, upi, net_banking, wallet
    
    # Gateway integration
    payment_gateway = Column(String(32))  # razorpay, stripe, paytm
    transaction_id = Column(String(120), unique=True)
    gateway_order_id = Column(String(120))
    gateway_payment_id = Column(String(120))
    gateway_signature = Column(String(256))
    
    # Status
    status = Column(String(32), default="pending")  # pending, processing, completed, failed, refunded
    
    # Timestamps
    initiated_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True))
    failed_at = Column(DateTime(timezone=True))
    refunded_at = Column(DateTime(timezone=True))
    
    # Additional info
    failure_reason = Column(Text)
    refund_amount = Column(Numeric(12, 2))
    refund_reason = Column(Text)
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    booking = relationship("StorageBooking", back_populates="payments")
    transport_booking = relationship("TransportBooking", back_populates="payments")
    payer = relationship("User", foreign_keys=[payer_id])
    payee = relationship("User", foreign_keys=[payee_id])
    payee = relationship("User", foreign_keys=[payee_id])


# =========================================================
# QUALITY CONTROL & IOT SENSOR TABLES  
# =========================================================

class QualityTest(Base):
    __tablename__ = "quality_tests"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_jobs.id", ondelete="CASCADE"))
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    test_type = Column(String(64), nullable=False)  # moisture, temperature, pH, contamination
    test_result = Column(Float)
    result_unit = Column(String(16))  # %, °C, pH, ppm
    pass_status = Column(Boolean, default=True)
    threshold_min = Column(Float)
    threshold_max = Column(Float)
    test_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    job = relationship("StorageJob")
    vendor = relationship("Vendor")


class IoTSensor(Base):
    __tablename__ = "iot_sensors"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_locations.id", ondelete="CASCADE"))
    sensor_type = Column(String(64), nullable=False)  # temperature, humidity, motion, gas, weight
    device_id = Column(String(120), nullable=False, unique=True)
    status = Column(String(24), default="active")  # active, inactive, maintenance
    last_reading = Column(DateTime(timezone=True))
    battery_level = Column(Float)  # percentage
    installation_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    location = relationship("StorageLocation")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("iot_sensors.id", ondelete="CASCADE"))
    reading_value = Column(Float, nullable=False)
    reading_unit = Column(String(16))  # °C, %, g, ppm
    reading_time = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    alert_triggered = Column(Boolean, default=False)
    alert_reason = Column(String(120))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    sensor = relationship("IoTSensor", back_populates="readings")


class PestDetection(Base):
    __tablename__ = "pest_detections"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_locations.id", ondelete="SET NULL"))
    job_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_jobs.id", ondelete="SET NULL"))
    pest_type = Column(String(120))  # rodents, insects, birds
    detection_method = Column(String(64))  # camera, trap, manual_inspection
    severity_level = Column(String(24))  # low, medium, high, critical
    confidence_score = Column(Float)  # AI detection confidence 0-1
    image_url = Column(Text)
    location_details = Column(String(256))  # specific area within storage
    action_taken = Column(Text)
    detected_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    location = relationship("StorageLocation")
    job = relationship("StorageJob")


class QualityAlert(Base):
    __tablename__ = "quality_alerts"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_jobs.id", ondelete="CASCADE"))
    alert_type = Column(String(64), nullable=False)  # temperature, humidity, contamination, pest
    severity = Column(String(24), default="medium")  # low, medium, high, critical
    message = Column(Text)
    current_value = Column(Float)
    threshold_value = Column(Float)
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("iot_sensors.id", ondelete="SET NULL"))
    acknowledged = Column(Boolean, default=False)
    resolved = Column(Boolean, default=False)
    triggered_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    acknowledged_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    job = relationship("StorageJob")
    sensor = relationship("IoTSensor")


class ComplianceCertificate(Base):
    __tablename__ = "compliance_certificates"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    certificate_type = Column(String(64), nullable=False)  # HACCP, ISO22000, FSSAI, Organic_NOP
    certificate_number = Column(String(120))
    issuing_authority = Column(String(120))
    issue_date = Column(Date)
    expiry_date = Column(Date)
    status = Column(String(24), default="valid")  # valid, expired, revoked, pending
    document_url = Column(Text)
    score = Column(Integer)  # compliance score 0-100
    audit_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    vendor = relationship("Vendor")


class QualityMetric(Base):
    __tablename__ = "quality_metrics"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_locations.id", ondelete="SET NULL"))
    job_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_jobs.id", ondelete="SET NULL"))
    metric_name = Column(String(64), nullable=False)  # preservation_rate, contamination_level
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String(16))
    benchmark_value = Column(Float)
    performance_rating = Column(String(16))  # excellent, good, fair, poor
    measurement_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    location = relationship("StorageLocation") 
    job = relationship("StorageJob")


# =========================================================
# TRANSPORT & LOGISTICS TABLES
# =========================================================

class TransportVehicle(Base):
    __tablename__ = "transport_vehicles"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    vehicle_type = Column(String(64), nullable=False)  # refrigerated_truck, dry_cargo_truck, temperature_controlled
    vehicle_number = Column(String(32), unique=True)
    capacity_kg = Column(Integer)
    gps_device_id = Column(String(120))
    status = Column(String(24), default="available")  # available, in_transit, maintenance, out_of_service
    last_maintenance = Column(Date)
    driver_name = Column(String(120))
    driver_phone = Column(String(20))
    fuel_efficiency = Column(Float)  # km per liter
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    vendor = relationship("Vendor")
    transport_routes = relationship("TransportRoute", back_populates="vehicle")


class TransportRoute(Base):
    __tablename__ = "transport_routes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_jobs.id", ondelete="CASCADE"))
    vehicle_id = Column(PGUUID(as_uuid=True), ForeignKey("transport_vehicles.id", ondelete="SET NULL"))
    start_location = Column(String(256))
    start_lat = Column(Float)
    start_lon = Column(Float)
    end_location = Column(String(256))
    end_lat = Column(Float)
    end_lon = Column(Float)
    distance_km = Column(Float)
    estimated_time_hours = Column(Float)
    actual_time_hours = Column(Float)
    status = Column(String(24), default="planned")  # planned, in_progress, completed, delayed
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    fuel_consumed = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    job = relationship("StorageJob")
    vehicle = relationship("TransportVehicle", back_populates="transport_routes")
    tracking_updates = relationship("RouteTracking", back_populates="route", cascade="all, delete-orphan")


class RouteTracking(Base):
    __tablename__ = "route_tracking"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(PGUUID(as_uuid=True), ForeignKey("transport_routes.id", ondelete="CASCADE"))
    current_lat = Column(Float, nullable=False)
    current_lon = Column(Float, nullable=False)
    speed_kmh = Column(Float)
    temperature = Column(Float)  # for refrigerated transport
    humidity = Column(Float)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    alert_triggered = Column(Boolean, default=False)
    alert_reason = Column(String(120))

    route = relationship("TransportRoute", back_populates="tracking_updates")


class LogisticsProvider(Base):
    __tablename__ = "logistics_providers"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    company_type = Column(String(64))  # cold_transport, dry_cargo, processing, warehousing
    address = Column(Text)
    city = Column(String(80))
    state = Column(String(80))
    coordinates = Column(JSON)  # [longitude, latitude] for Mapbox
    phone = Column(String(20))
    email = Column(String(120))
    hours = Column(String(120))  # operating hours
    capacity_description = Column(String(256))
    price_per_km = Column(Numeric(8, 2))
    rating = Column(Float, default=4.0)
    facilities = Column(JSON, default=list)  # ['GPS Tracking', 'Temperature Control', 'Insurance']
    service_types = Column(JSON, default=list)  # ['Cold Transport', 'Last Mile Delivery']
    coverage_areas = Column(JSON, default=list)  # areas they serve
    verification_status = Column(String(24), default="pending")  # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    vehicles = relationship("TransportVehicle", foreign_keys="TransportVehicle.vendor_id", 
                           primaryjoin="LogisticsProvider.id == foreign(TransportVehicle.vendor_id)")


class DeliveryTracking(Base):
    __tablename__ = "delivery_tracking"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_jobs.id", ondelete="CASCADE"))
    route_id = Column(PGUUID(as_uuid=True), ForeignKey("transport_routes.id", ondelete="SET NULL"))
    delivery_stage = Column(String(64))  # pickup, loading, in_transit, unloading, delivered
    stage_timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)
    location_lat = Column(Float)
    location_lon = Column(Float)
    photo_url = Column(Text)
    notes = Column(Text)
    quality_maintained = Column(Boolean, default=True)
    temperature_log = Column(JSON)  # temperature readings during transport
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    job = relationship("StorageJob")
    route = relationship("TransportRoute")


class StorageCertificate(Base):
    """
    Storage Quality Certificate - Generated after storage completion
    Tracks quality metrics, IoT data, and generates verifiable certificates
    """
    __tablename__ = "storage_certificates"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_bookings.id", ondelete="CASCADE"), unique=True)
    certificate_number = Column(String(64), unique=True, nullable=False)
    
    # Parties
    farmer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    location_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_locations.id", ondelete="SET NULL"))
    
    # Crop Details
    crop_type = Column(String(120), nullable=False)
    quantity_kg = Column(Integer, nullable=False)
    initial_grade = Column(String(16))  # from AI inspection
    final_grade = Column(String(16))    # after storage
    grade_maintained = Column(Boolean, default=True)
    initial_defects_count = Column(Integer, default=0)
    final_defects_count = Column(Integer, default=0)
    
    # Storage Period
    storage_start_date = Column(DateTime(timezone=True), nullable=False)
    storage_end_date = Column(DateTime(timezone=True), nullable=False)
    duration_days = Column(Integer, nullable=False)
    actual_shelf_life_days = Column(Integer)
    predicted_shelf_life_days = Column(Integer)
    
    # Quality Metrics (from IoT sensors)
    temperature_compliance_percentage = Column(Numeric(5,2), default=0.0)
    humidity_compliance_percentage = Column(Numeric(5,2), default=0.0)
    temperature_avg = Column(Numeric(5,2))
    temperature_min = Column(Numeric(5,2))
    temperature_max = Column(Numeric(5,2))
    humidity_avg = Column(Numeric(5,2))
    total_sensor_readings = Column(Integer, default=0)
    alerts_triggered = Column(Integer, default=0)
    alerts_resolved = Column(Integer, default=0)
    
    # Quality Tests & Incidents
    pest_incidents_count = Column(Integer, default=0)
    quality_tests_conducted = Column(Integer, default=0)
    quality_tests_passed = Column(Integer, default=0)
    quality_test_pass_rate = Column(Numeric(5,2), default=0.0)
    
    # Performance Metrics
    preservation_rate = Column(Numeric(5,2), default=100.0)  # % of crop preserved
    weight_loss_kg = Column(Numeric(10,2), default=0.0)
    contamination_incidents = Column(Integer, default=0)
    
    # Overall Score
    overall_quality_score = Column(Numeric(5,2), default=0.0)  # 0-100
    
    # Vendor Compliance
    vendor_certifications = Column(Text)  # JSON string of vendor certifications
    fssai_certified = Column(Boolean, default=False)
    iso_certified = Column(Boolean, default=False)
    haccp_certified = Column(Boolean, default=False)
    
    # Certificate Status
    certificate_status = Column(String(32), default='pending')  # pending, issued, revoked, expired
    issued_date = Column(DateTime(timezone=True))
    issued_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    revoked_date = Column(DateTime(timezone=True))
    revoked_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    revocation_reason = Column(Text)
    
    # Document Storage
    certificate_pdf_url = Column(Text)
    qr_code_url = Column(Text)
    digital_signature = Column(Text)  # SHA-256 hash for verification
    
    # Additional Info
    storage_conditions = Column(Text)  # JSON: temperature range, humidity, special conditions
    special_notes = Column(Text)
    buyer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    buyer_verified_date = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    booking = relationship("StorageBooking", foreign_keys=[booking_id])
    farmer = relationship("User", foreign_keys=[farmer_id])
    vendor = relationship("Vendor", foreign_keys=[vendor_id])
    location = relationship("StorageLocation", foreign_keys=[location_id])
    issuer = relationship("User", foreign_keys=[issued_by])
    buyer = relationship("User", foreign_keys=[buyer_id])


# Database initialization function - called explicitly, not during import
def create_tables():
    """Create all database tables. Call this during application startup."""
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        raise