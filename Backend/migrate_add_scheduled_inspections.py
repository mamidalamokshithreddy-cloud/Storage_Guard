"""
Migration: Add scheduled_inspections table for on-site quality inspections
"""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """Create scheduled_inspections table"""
    # Build DATABASE_URL from individual settings
    database_url = f"postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    engine = create_engine(database_url)
    
    migration_sql = """
    -- Create scheduled_inspections table
    CREATE TABLE IF NOT EXISTS scheduled_inspections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        booking_id UUID REFERENCES storage_bookings(id) ON DELETE SET NULL,
        vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
        
        -- Inspection details
        inspection_type VARCHAR(32) NOT NULL CHECK (inspection_type IN ('pre_storage', 'during_storage', 'final', 'dispute')),
        crop_type VARCHAR(120) NOT NULL,
        quantity_kg INTEGER NOT NULL CHECK (quantity_kg > 0),
        
        -- Location
        location_address TEXT NOT NULL,
        location_lat NUMERIC(10, 8),
        location_lon NUMERIC(11, 8),
        
        -- Scheduling
        requested_date TIMESTAMP WITH TIME ZONE NOT NULL,
        preferred_time_slot VARCHAR(32) CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening')),
        scheduled_date TIMESTAMP WITH TIME ZONE,
        completed_date TIMESTAMP WITH TIME ZONE,
        
        -- Status tracking
        status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
        
        -- Notes and communication
        farmer_notes TEXT,
        inspector_notes TEXT,
        cancellation_reason TEXT,
        
        -- Results (linked after completion)
        inspection_result_id UUID REFERENCES crop_inspections(id) ON DELETE SET NULL,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        confirmed_at TIMESTAMP WITH TIME ZONE
    );
    
    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_scheduled_inspections_farmer_id ON scheduled_inspections(farmer_id);
    CREATE INDEX IF NOT EXISTS idx_scheduled_inspections_vendor_id ON scheduled_inspections(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_scheduled_inspections_booking_id ON scheduled_inspections(booking_id);
    CREATE INDEX IF NOT EXISTS idx_scheduled_inspections_status ON scheduled_inspections(status);
    CREATE INDEX IF NOT EXISTS idx_scheduled_inspections_requested_date ON scheduled_inspections(requested_date);
    CREATE INDEX IF NOT EXISTS idx_scheduled_inspections_scheduled_date ON scheduled_inspections(scheduled_date);
    
    -- Create trigger for updated_at
    CREATE OR REPLACE FUNCTION update_scheduled_inspections_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER trigger_update_scheduled_inspections_updated_at
        BEFORE UPDATE ON scheduled_inspections
        FOR EACH ROW
        EXECUTE FUNCTION update_scheduled_inspections_updated_at();
    
    -- Add comments for documentation
    COMMENT ON TABLE scheduled_inspections IS 'On-site quality inspections scheduled by farmers';
    COMMENT ON COLUMN scheduled_inspections.inspection_type IS 'Type: pre_storage, during_storage, final, dispute';
    COMMENT ON COLUMN scheduled_inspections.status IS 'Status: pending, confirmed, in_progress, completed, cancelled';
    COMMENT ON COLUMN scheduled_inspections.preferred_time_slot IS 'Preferred time: morning (8-12), afternoon (12-4), evening (4-7)';
    """
    
    with engine.connect() as conn:
        print("🚀 Running migration: Add scheduled_inspections table...")
        conn.execute(text(migration_sql))
        conn.commit()
        print("✅ Migration completed successfully!")
        
        # Verify table creation
        result = conn.execute(text("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name = 'scheduled_inspections'
        """))
        count = result.scalar()
        
        if count > 0:
            print("✅ Table 'scheduled_inspections' created successfully!")
            
            # Show table structure
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'scheduled_inspections'
                ORDER BY ordinal_position
            """))
            
            print("\n📋 Table Structure:")
            print("-" * 60)
            for row in result:
                nullable = "NULL" if row[2] == "YES" else "NOT NULL"
                print(f"  {row[0]:<30} {row[1]:<20} {nullable}")
            print("-" * 60)
        else:
            print("❌ Table creation verification failed!")

if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
