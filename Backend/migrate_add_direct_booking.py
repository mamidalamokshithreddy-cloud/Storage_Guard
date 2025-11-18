#!/usr/bin/env python3
"""
Migration script to add direct booking tables:
- storage_bookings
- transport_bookings
- payments
"""

import os
from pathlib import Path
import sys

# Add the Backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging
from dotenv import load_dotenv

# Load .env from repo root (one level up from Backend)
env_path = backend_dir.parent / ".env"
load_dotenv(env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_add_direct_booking_tables():
    """Add direct booking tables to database"""
    
    try:
        # Build PostgreSQL URL from individual DB_ variables
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "postgres")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "agri_copilot")
        
        database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        logger.info(f"🔗 Connecting to: postgresql://{db_user}:****@{db_host}:{db_port}/{db_name}")
        
        # Create engine and session
        engine = create_engine(database_url)
        Session = sessionmaker(bind=engine)
        db = Session()
        
        logger.info("🔄 Starting migration to add direct booking tables...")
        
        # Check if tables already exist
        check_table_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('storage_bookings', 'transport_bookings', 'booking_payments');
        """)
        
        existing_tables = db.execute(check_table_query).fetchall()
        existing_table_names = [row[0] for row in existing_tables]
        
        if 'storage_bookings' in existing_table_names:
            logger.info("✅ Table 'storage_bookings' already exists")
        else:
            logger.info("➕ Creating storage_bookings table...")
            create_storage_bookings = text("""
                CREATE TABLE storage_bookings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    farmer_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL NOT NULL,
                    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
                    
                    crop_type VARCHAR(120) NOT NULL,
                    quantity_kg INTEGER NOT NULL,
                    grade VARCHAR(16),
                    
                    duration_days INTEGER NOT NULL,
                    start_date TIMESTAMPTZ NOT NULL,
                    end_date TIMESTAMPTZ NOT NULL,
                    
                    price_per_day NUMERIC(12, 2) NOT NULL,
                    total_price NUMERIC(12, 2) NOT NULL,
                    
                    booking_status VARCHAR(32) DEFAULT 'pending',
                    payment_status VARCHAR(32) DEFAULT 'pending',
                    
                    ai_inspection_id UUID REFERENCES crop_inspections(id) ON DELETE SET NULL,
                    transport_required BOOLEAN DEFAULT FALSE,
                    transport_booking_id UUID,
                    
                    vendor_confirmed BOOLEAN DEFAULT FALSE,
                    vendor_confirmed_at TIMESTAMPTZ,
                    vendor_notes TEXT,
                    
                    cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
                    cancelled_at TIMESTAMPTZ,
                    cancellation_reason TEXT,
                    
                    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
                );
                
                CREATE INDEX idx_storage_bookings_farmer ON storage_bookings(farmer_id);
                CREATE INDEX idx_storage_bookings_location ON storage_bookings(location_id);
                CREATE INDEX idx_storage_bookings_status ON storage_bookings(booking_status);
                CREATE INDEX idx_storage_bookings_dates ON storage_bookings(start_date, end_date);
            """)
            db.execute(create_storage_bookings)
            logger.info("✅ Created storage_bookings table with indexes")
        
        if 'transport_bookings' in existing_table_names:
            logger.info("✅ Table 'transport_bookings' already exists")
        else:
            logger.info("➕ Creating transport_bookings table...")
            create_transport_bookings = text("""
                CREATE TABLE transport_bookings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    farmer_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
                    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
                    vehicle_id UUID REFERENCES transport_vehicles(id) ON DELETE SET NULL,
                    
                    pickup_location VARCHAR(256) NOT NULL,
                    pickup_lat FLOAT NOT NULL,
                    pickup_lon FLOAT NOT NULL,
                    delivery_location VARCHAR(256) NOT NULL,
                    delivery_lat FLOAT NOT NULL,
                    delivery_lon FLOAT NOT NULL,
                    
                    cargo_type VARCHAR(120) NOT NULL,
                    cargo_weight_kg INTEGER NOT NULL,
                    special_requirements TEXT,
                    
                    pickup_time TIMESTAMPTZ NOT NULL,
                    estimated_delivery_time TIMESTAMPTZ NOT NULL,
                    actual_delivery_time TIMESTAMPTZ,
                    
                    distance_km FLOAT,
                    transport_cost NUMERIC(12, 2) NOT NULL,
                    
                    booking_status VARCHAR(32) DEFAULT 'pending',
                    payment_status VARCHAR(32) DEFAULT 'pending',
                    
                    current_lat FLOAT,
                    current_lon FLOAT,
                    last_location_update TIMESTAMPTZ,
                    
                    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
                );
                
                CREATE INDEX idx_transport_bookings_farmer ON transport_bookings(farmer_id);
                CREATE INDEX idx_transport_bookings_status ON transport_bookings(booking_status);
                CREATE INDEX idx_transport_bookings_pickup_time ON transport_bookings(pickup_time);
            """)
            db.execute(create_transport_bookings)
            logger.info("✅ Created transport_bookings table with indexes")
        
        # Add foreign key constraint for transport_booking_id in storage_bookings
        if 'storage_bookings' not in existing_table_names and 'transport_bookings' not in existing_table_names:
            logger.info("➕ Adding foreign key constraint for transport_booking_id...")
            add_fk = text("""
                ALTER TABLE storage_bookings 
                ADD CONSTRAINT fk_storage_bookings_transport 
                FOREIGN KEY (transport_booking_id) 
                REFERENCES transport_bookings(id) ON DELETE SET NULL;
            """)
            db.execute(add_fk)
            logger.info("✅ Added foreign key constraint")
        
        if 'booking_payments' in existing_table_names:
            logger.info("✅ Table 'booking_payments' already exists")
        else:
            logger.info("➕ Creating booking_payments table...")
            create_payments = text("""
                CREATE TABLE booking_payments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    booking_id UUID REFERENCES storage_bookings(id) ON DELETE CASCADE,
                    transport_booking_id UUID REFERENCES transport_bookings(id) ON DELETE CASCADE,
                    
                    payer_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
                    payee_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
                    
                    amount NUMERIC(12, 2) NOT NULL,
                    payment_type VARCHAR(32) NOT NULL,
                    payment_method VARCHAR(32),
                    
                    payment_gateway VARCHAR(32),
                    transaction_id VARCHAR(120) UNIQUE,
                    gateway_order_id VARCHAR(120),
                    gateway_payment_id VARCHAR(120),
                    gateway_signature VARCHAR(256),
                    
                    status VARCHAR(32) DEFAULT 'pending',
                    
                    initiated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
                    completed_at TIMESTAMPTZ,
                    failed_at TIMESTAMPTZ,
                    refunded_at TIMESTAMPTZ,
                    
                    failure_reason TEXT,
                    refund_amount NUMERIC(12, 2),
                    refund_reason TEXT,
                    notes TEXT,
                    
                    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
                );
                
                CREATE INDEX idx_payments_booking ON booking_payments(booking_id);
                CREATE INDEX idx_payments_transport ON booking_payments(transport_booking_id);
                CREATE INDEX idx_payments_payer ON booking_payments(payer_id);
                CREATE INDEX idx_payments_status ON booking_payments(status);
                CREATE INDEX idx_payments_transaction ON booking_payments(transaction_id);
            """)
            db.execute(create_payments)
            logger.info("✅ Created booking_payments table with indexes")
        
        # Commit all changes
        db.commit()
        
        logger.info("✅ Migration completed successfully!")
        logger.info("   - storage_bookings table ready")
        logger.info("   - transport_bookings table ready")
        logger.info("   - booking_payments table ready")
        logger.info("   - All indexes and foreign keys created")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    migrate_add_direct_booking_tables()
