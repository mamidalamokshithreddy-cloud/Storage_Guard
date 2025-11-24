"""
Migration: Add Market Connect Integration
Adds columns to storage_bookings and creates buyer_preferences table
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
sys.path.insert(0, '.')

from app.schemas import postgres_base as models

# Database connection
DATABASE_URL = "postgresql://postgres:Mani8143@localhost:5432/Agriculture"

def add_market_columns_to_storage_bookings():
    """Add market integration columns to storage_bookings table"""
    engine = create_engine(DATABASE_URL)
    
    print("🔄 Adding market integration columns to storage_bookings...")
    
    try:
        with engine.connect() as conn:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'storage_bookings' 
                AND column_name IN ('listed_for_sale', 'market_listing_id', 'target_sale_price', 
                                    'minimum_sale_price', 'sale_status', 'listed_at', 'sold_at')
            """))
            existing_columns = [row[0] for row in result]
            
            if 'listed_for_sale' in existing_columns:
                print("⚠️  Columns already exist, skipping...")
                return
            
            # Add new columns
            conn.execute(text("""
                ALTER TABLE storage_bookings 
                ADD COLUMN IF NOT EXISTS listed_for_sale BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS market_listing_id VARCHAR(255),
                ADD COLUMN IF NOT EXISTS target_sale_price NUMERIC(12,2),
                ADD COLUMN IF NOT EXISTS minimum_sale_price NUMERIC(12,2),
                ADD COLUMN IF NOT EXISTS sale_status VARCHAR(50) DEFAULT 'STORED',
                ADD COLUMN IF NOT EXISTS listed_at TIMESTAMP,
                ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP
            """))
            conn.commit()
            
            print("✅ Added 7 columns to storage_bookings:")
            print("   - listed_for_sale (BOOLEAN)")
            print("   - market_listing_id (VARCHAR)")
            print("   - target_sale_price (NUMERIC)")
            print("   - minimum_sale_price (NUMERIC)")
            print("   - sale_status (VARCHAR) - Values: STORED, LISTED, NEGOTIATING, SOLD, DELIVERED")
            print("   - listed_at (TIMESTAMP)")
            print("   - sold_at (TIMESTAMP)")
            
    except Exception as e:
        print(f"❌ Error adding columns: {e}")
        raise

def create_buyer_preferences_table():
    """Create buyer_preferences table"""
    engine = create_engine(DATABASE_URL)
    
    print("\n🔄 Creating buyer_preferences table...")
    
    try:
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'buyer_preferences'
                )
            """))
            if result.fetchone()[0]:
                print("⚠️  Table already exists, skipping...")
                return
            
            # Create table
            conn.execute(text("""
                CREATE TABLE buyer_preferences (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    crop_types TEXT[] NOT NULL,
                    quality_grades TEXT[],
                    min_quantity_kg INTEGER,
                    max_quantity_kg INTEGER,
                    preferred_locations TEXT[],
                    max_distance_km INTEGER DEFAULT 100,
                    payment_terms TEXT,
                    delivery_preference TEXT,
                    price_range_min NUMERIC(10,2),
                    price_range_max NUMERIC(10,2),
                    auto_match_enabled BOOLEAN DEFAULT TRUE,
                    notification_email BOOLEAN DEFAULT TRUE,
                    notification_sms BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """))
            
            # Create indexes
            conn.execute(text("""
                CREATE INDEX idx_buyer_prefs_buyer ON buyer_preferences(buyer_id)
            """))
            
            conn.commit()
            
            print("✅ buyer_preferences table created with columns:")
            print("   - id (UUID, PRIMARY KEY)")
            print("   - buyer_id (UUID, FOREIGN KEY → users)")
            print("   - crop_types (TEXT[] - Array of crops)")
            print("   - quality_grades (TEXT[] - Array like ['A', 'B'])")
            print("   - min_quantity_kg, max_quantity_kg (INTEGER)")
            print("   - preferred_locations (TEXT[])")
            print("   - max_distance_km (INTEGER, default 100)")
            print("   - payment_terms, delivery_preference (TEXT)")
            print("   - price_range_min, price_range_max (NUMERIC)")
            print("   - auto_match_enabled (BOOLEAN)")
            print("   - notification_email, notification_sms (BOOLEAN)")
            print("   - created_at, updated_at (TIMESTAMP)")
            print("\n✅ Created index on buyer_id")
            
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        raise

def verify_migration():
    """Verify migration completed successfully"""
    engine = create_engine(DATABASE_URL)
    
    print("\n🔍 Verifying migration...")
    
    try:
        with engine.connect() as conn:
            # Check storage_bookings columns
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'storage_bookings' 
                AND column_name IN ('listed_for_sale', 'market_listing_id', 'sale_status')
            """))
            booking_cols = result.fetchall()
            
            # Check buyer_preferences table
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'buyer_preferences'
                )
            """))
            buyer_table_exists = result.fetchone()[0]
            
            if len(booking_cols) >= 3 and buyer_table_exists:
                print("✅ Migration verified successfully!")
                print(f"   - storage_bookings: {len(booking_cols)} new columns added")
                print("   - buyer_preferences: table created")
                return True
            else:
                print("❌ Migration incomplete!")
                return False
                
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False

def main():
    print("=" * 80)
    print("MARKET CONNECT INTEGRATION - DATABASE MIGRATION")
    print("=" * 80)
    
    try:
        # Step 1: Add columns to storage_bookings
        add_market_columns_to_storage_bookings()
        
        # Step 2: Create buyer_preferences table
        create_buyer_preferences_table()
        
        # Step 3: Verify
        success = verify_migration()
        
        if success:
            print("\n" + "=" * 80)
            print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
            print("=" * 80)
            print("\nNext Steps:")
            print("1. Create backend APIs in app/routers/market_integration.py")
            print("2. Add frontend components for listing creation")
            print("3. Build buyer matching algorithm")
            print("4. Test with existing 22 storage bookings")
        else:
            print("\n❌ Migration failed, please check errors above")
            
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    main()
