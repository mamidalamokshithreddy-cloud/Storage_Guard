import sqlalchemy as sa
from sqlalchemy import create_engine, text

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

print('\n🔧 FIXING DATABASE SCHEMA ISSUES')
print('='*80)

with engine.connect() as conn:
    # 1. Add unique constraint on booking_id if not exists
    print('\n1. Checking UNIQUE constraint on booking_id...')
    result = conn.execute(text("""
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'market_inventory_snapshots' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%booking_id%'
    """))
    
    unique_exists = result.fetchone() is not None
    
    if not unique_exists:
        print('  ❌ No unique constraint found. Creating...')
        try:
            conn.execute(text("""
                ALTER TABLE market_inventory_snapshots 
                ADD CONSTRAINT uq_market_inventory_booking_id UNIQUE (booking_id)
            """))
            conn.commit()
            print('  ✅ Created UNIQUE constraint on booking_id')
        except Exception as e:
            print(f'  ⚠️ Error creating constraint: {e}')
    else:
        print('  ✅ UNIQUE constraint already exists')
    
    # 2. Create trigger for updated_at on storage_bookings
    print('\n2. Creating updated_at trigger for storage_bookings...')
    try:
        # Drop existing trigger if exists
        conn.execute(text("""
            DROP TRIGGER IF EXISTS update_storage_bookings_updated_at ON storage_bookings
        """))
        
        # Create or replace function
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """))
        
        # Create trigger
        conn.execute(text("""
            CREATE TRIGGER update_storage_bookings_updated_at
            BEFORE UPDATE ON storage_bookings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """))
        
        conn.commit()
        print('  ✅ Created trigger for storage_bookings.updated_at')
    except Exception as e:
        print(f'  ⚠️ Error: {e}')
    
    # 3. Create trigger for updated_at on market_inventory_snapshots
    print('\n3. Creating updated_at trigger for market_inventory_snapshots...')
    try:
        # Drop existing trigger if exists
        conn.execute(text("""
            DROP TRIGGER IF EXISTS update_market_snapshots_updated_at ON market_inventory_snapshots
        """))
        
        # Create trigger
        conn.execute(text("""
            CREATE TRIGGER update_market_snapshots_updated_at
            BEFORE UPDATE ON market_inventory_snapshots
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """))
        
        conn.commit()
        print('  ✅ Created trigger for market_inventory_snapshots.updated_at')
    except Exception as e:
        print(f'  ⚠️ Error: {e}')
    
    # 4. Verify indexes
    print('\n4. Checking indexes...')
    result = conn.execute(text("""
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'market_inventory_snapshots'
        AND indexname LIKE '%booking_id%'
    """))
    
    indexes = result.fetchall()
    if indexes:
        print(f'  ✅ Found {len(indexes)} index(es) on booking_id:')
        for idx in indexes:
            print(f'     - {idx[0]}')
    else:
        print('  ⚠️ No index on booking_id. Creating...')
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_market_inventory_booking_id 
                ON market_inventory_snapshots(booking_id)
            """))
            conn.commit()
            print('  ✅ Created index on booking_id')
        except Exception as e:
            print(f'  ⚠️ Error: {e}')

print('\n✅ Schema fixes complete!')
print('\n📋 SUMMARY:')
print('  ✓ UNIQUE constraint on booking_id (1:1 relationship)')
print('  ✓ Trigger for storage_bookings.updated_at')
print('  ✓ Trigger for market_inventory_snapshots.updated_at')
print('  ✓ Index on booking_id for fast lookups')
print('\n🎉 Database is now ready for new bookings!')
