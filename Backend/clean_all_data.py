import sqlalchemy as sa
from sqlalchemy import create_engine, text

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

print('\n🗑️ COMPLETE DATABASE CLEANUP')
print('='*80)

with engine.connect() as conn:
    # Count current data
    result = conn.execute(text("SELECT COUNT(*) FROM market_inventory_snapshots"))
    snapshot_count = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM storage_bookings"))
    booking_count = result.fetchone()[0]
    
    print(f'\n📊 BEFORE CLEANUP:')
    print(f'  Storage Bookings: {booking_count}')
    print(f'  Market Snapshots: {snapshot_count}')
    
    # Delete all snapshots first (due to foreign key)
    print(f'\n🗑️ Deleting all snapshots...')
    result = conn.execute(text("DELETE FROM market_inventory_snapshots"))
    deleted_snapshots = result.rowcount
    conn.commit()
    print(f'  ✅ Deleted {deleted_snapshots} snapshots')
    
    # Delete all bookings
    print(f'\n🗑️ Deleting all bookings...')
    result = conn.execute(text("DELETE FROM storage_bookings"))
    deleted_bookings = result.rowcount
    conn.commit()
    print(f'  ✅ Deleted {deleted_bookings} bookings')
    
    # Verify cleanup
    result = conn.execute(text("SELECT COUNT(*) FROM market_inventory_snapshots"))
    snapshot_after = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM storage_bookings"))
    booking_after = result.fetchone()[0]
    
    print(f'\n📊 AFTER CLEANUP:')
    print(f'  Storage Bookings: {booking_after}')
    print(f'  Market Snapshots: {snapshot_after}')
    
    print(f'\n✅ DATABASE CLEANED - Ready for fresh start!')
