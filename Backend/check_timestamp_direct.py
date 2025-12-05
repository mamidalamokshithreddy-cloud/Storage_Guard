import sqlalchemy as sa
from sqlalchemy import create_engine, text

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

booking_id = '905b5e06-5701-4128-a512-8f98efd2dbe1'

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT 
            b.id,
            b.crop_type,
            b.created_at AT TIME ZONE 'Asia/Kolkata' as booking_created_ist,
            s.id as snapshot_id,
            s.created_at AT TIME ZONE 'Asia/Kolkata' as snapshot_created_ist,
            s.updated_at AT TIME ZONE 'Asia/Kolkata' as snapshot_updated_ist
        FROM storage_bookings b
        LEFT JOIN market_inventory_snapshots s ON b.id = s.booking_id
        WHERE b.id = :booking_id
    """), {"booking_id": booking_id})
    
    row = result.fetchone()
    
    if row:
        print('\n🔍 TIMESTAMP VERIFICATION:')
        print('='*80)
        print(f'Booking ID: {row[0]}')
        print(f'Crop Type: {row[1]}')
        print(f'\n📅 Booking Created (IST):  {row[2]}')
        
        if row[3]:  # snapshot exists
            print(f'📸 Snapshot Created (IST): {row[4]}')
            print(f'🔄 Snapshot Updated (IST): {row[5]}')
            
            diff = (row[4] - row[2]).total_seconds() / 60
            print(f'\n⏱️ Time Difference: {diff:.2f} minutes')
            
            if abs(diff) < 1:
                print('\n✅ SUCCESS! Timestamps are synchronized (< 1 minute difference)')
            else:
                print(f'\n❌ PROBLEM! Timestamps differ by {diff:.2f} minutes')
        else:
            print('\n❌ NO SNAPSHOT FOUND!')
    else:
        print('❌ Booking not found!')
