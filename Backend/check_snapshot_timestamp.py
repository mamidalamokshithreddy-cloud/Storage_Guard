import sys
sys.path.append('.')
from database.postgres_connect import SessionLocal
from schemas.postgres_base import StorageBooking, MarketInventorySnapshot
from datetime import datetime

db = SessionLocal()

booking_id = 'fb67dc48-245a-4b7e-8e2e-064dca38aaf2'

booking = db.query(StorageBooking).filter(StorageBooking.id == booking_id).first()
snapshot = db.query(MarketInventorySnapshot).filter(MarketInventorySnapshot.booking_id == booking.id).first()

print('\n🔍 TIMESTAMP VERIFICATION:')
print('='*80)
print(f'Booking ID: {booking.id}')
print(f'Crop Type: {booking.crop_type}')
print(f'\n📅 Booking Created:  {booking.created_at}')

if snapshot:
    print(f'📸 Snapshot Created: {snapshot.created_at}')
    print(f'🔄 Snapshot Updated: {snapshot.updated_at}')
    
    diff = (snapshot.created_at - booking.created_at).total_seconds() / 60
    print(f'\n⏱️ Time Difference: {diff:.2f} minutes')
    
    if abs(diff) < 1:
        print('\n✅ SUCCESS! Timestamps are synchronized (< 1 minute difference)')
    else:
        print(f'\n❌ PROBLEM! Timestamps differ by {diff:.2f} minutes')
else:
    print('❌ NO SNAPSHOT FOUND!')

db.close()
