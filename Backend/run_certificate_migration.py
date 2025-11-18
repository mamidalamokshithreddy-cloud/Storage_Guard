"""
Run migration to create storage_certificates table
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.connections.postgres_connection import get_db, engine
from sqlalchemy import text

def run_migration():
    """Create storage_certificates table"""
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS storage_certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID UNIQUE REFERENCES storage_bookings(id) ON DELETE CASCADE,
        certificate_number VARCHAR(64) UNIQUE NOT NULL,
        
        -- Parties
        farmer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
        location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
        
        -- Crop Details
        crop_type VARCHAR(120) NOT NULL,
        quantity_kg INTEGER NOT NULL,
        initial_grade VARCHAR(16),
        final_grade VARCHAR(16),
        grade_maintained BOOLEAN DEFAULT TRUE,
        initial_defects_count INTEGER DEFAULT 0,
        final_defects_count INTEGER DEFAULT 0,
        
        -- Storage Period
        storage_start_date TIMESTAMPTZ NOT NULL,
        storage_end_date TIMESTAMPTZ NOT NULL,
        duration_days INTEGER NOT NULL,
        actual_shelf_life_days INTEGER,
        predicted_shelf_life_days INTEGER,
        
        -- Quality Metrics
        temperature_compliance_percentage NUMERIC(5,2) DEFAULT 0.0,
        humidity_compliance_percentage NUMERIC(5,2) DEFAULT 0.0,
        temperature_avg NUMERIC(5,2),
        temperature_min NUMERIC(5,2),
        temperature_max NUMERIC(5,2),
        humidity_avg NUMERIC(5,2),
        total_sensor_readings INTEGER DEFAULT 0,
        alerts_triggered INTEGER DEFAULT 0,
        alerts_resolved INTEGER DEFAULT 0,
        
        -- Quality Tests & Incidents
        pest_incidents_count INTEGER DEFAULT 0,
        quality_tests_conducted INTEGER DEFAULT 0,
        quality_tests_passed INTEGER DEFAULT 0,
        quality_test_pass_rate NUMERIC(5,2) DEFAULT 0.0,
        
        -- Performance Metrics
        preservation_rate NUMERIC(5,2) DEFAULT 100.0,
        weight_loss_kg NUMERIC(10,2) DEFAULT 0.0,
        contamination_incidents INTEGER DEFAULT 0,
        
        -- Overall Score
        overall_quality_score NUMERIC(5,2) DEFAULT 0.0,
        
        -- Vendor Compliance
        vendor_certifications TEXT,
        fssai_certified BOOLEAN DEFAULT FALSE,
        iso_certified BOOLEAN DEFAULT FALSE,
        haccp_certified BOOLEAN DEFAULT FALSE,
        
        -- Certificate Status
        certificate_status VARCHAR(32) DEFAULT 'pending',
        issued_date TIMESTAMPTZ,
        issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
        revoked_date TIMESTAMPTZ,
        revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
        revocation_reason TEXT,
        
        -- Document Storage
        certificate_pdf_url TEXT,
        qr_code_url TEXT,
        digital_signature TEXT,
        
        -- Additional Info
        storage_conditions TEXT,
        special_notes TEXT,
        buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        buyer_verified_date TIMESTAMPTZ,
        
        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    """
    
    create_indexes_sql = """
    CREATE INDEX IF NOT EXISTS idx_storage_certificates_booking_id ON storage_certificates(booking_id);
    CREATE INDEX IF NOT EXISTS idx_storage_certificates_farmer_id ON storage_certificates(farmer_id);
    CREATE INDEX IF NOT EXISTS idx_storage_certificates_certificate_number ON storage_certificates(certificate_number);
    CREATE INDEX IF NOT EXISTS idx_storage_certificates_status ON storage_certificates(certificate_status);
    CREATE INDEX IF NOT EXISTS idx_storage_certificates_issued_date ON storage_certificates(issued_date);
    """
    
    try:
        with engine.connect() as conn:
            print("Creating storage_certificates table...")
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✅ Table created successfully")
            
            print("Creating indexes...")
            conn.execute(text(create_indexes_sql))
            conn.commit()
            print("✅ Indexes created successfully")
            
            print("\n✅ Migration completed successfully!")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration()
