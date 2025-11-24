"""Simple Storage Guard Flow Test - Windows Compatible"""
import sys
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Direct database connection without importing app modules
DB_URL = "postgresql://postgres:Mani8143@localhost:5432/Agriculture"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
db = Session()

print("=" * 80)
print("STORAGE GUARD - COMPLETE FLOW TEST")
print("=" * 80)

# Test 1: Check tables
print("\n1. DATABASE TABLES")
print("-" * 80)
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()

storage_tables = ['users', 'storage_locations', 'storage_bookings', 'crop_inspections',
                  'storage_rfqs', 'booking_payments', 'compliance_certificates',
                  'scheduled_inspections', 'transport_bookings']

for table in storage_tables:
    status = "EXISTS" if table in tables else "MISSING"
    print(f"  {table:30} {status}")

# Test 2: Count records
print("\n2. RECORD COUNTS")
print("-" * 80)

try:
    result = db.execute("SELECT COUNT(*) FROM users WHERE role='farmer'")
    farmers = result.scalar()
    print(f"  Farmers: {farmers}")
except Exception as e:
    print(f"  Users table error: {e}")

try:
    result = db.execute("SELECT COUNT(*) FROM crop_inspections")
    inspections = result.scalar()
    print(f"  Crop Inspections: {inspections}")
except Exception as e:
    print(f"  Inspections error: {e}")

try:
    result = db.execute("SELECT COUNT(*) FROM storage_locations")
    locations = result.scalar()
    print(f"  Storage Locations: {locations}")
except Exception as e:
    print(f"  Locations error: {e}")

try:
    result = db.execute("SELECT COUNT(*) FROM storage_rfqs")
    rfqs = result.scalar()
    print(f"  Storage RFQs: {rfqs}")
except Exception as e:
    print(f"  RFQs error: {e}")

try:
    result = db.execute("SELECT COUNT(*) FROM storage_bookings")
    bookings = result.scalar()
    print(f"  Storage Bookings: {bookings}")
    
    # Booking statuses
    result = db.execute("SELECT booking_status, COUNT(*) FROM storage_bookings GROUP BY booking_status")
    print("\n  Booking Status Breakdown:")
    for row in result:
        print(f"    {row[0]}: {row[1]}")
except Exception as e:
    print(f"  Bookings error: {e}")

try:
    result = db.execute("SELECT COUNT(*) FROM booking_payments")
    payments = result.scalar()
    print(f"\n  Booking Payments: {payments}")
except Exception as e:
    print(f"  Payments error: {e}")

try:
    result = db.execute("SELECT COUNT(*) FROM scheduled_inspections")
    scheduled = result.scalar()
    print(f"  Scheduled Inspections: {scheduled}")
    
    # Inspection statuses
    if scheduled > 0:
        result = db.execute("SELECT status, COUNT(*) FROM scheduled_inspections GROUP BY status")
        print("\n  Inspection Status Breakdown:")
        for row in result:
            print(f"    {row[0]}: {row[1]}")
except Exception as e:
    print(f"  Scheduled Inspections error: {e}")

# Test 3: Sample data
print("\n3. SAMPLE DATA")
print("-" * 80)

try:
    result = db.execute("""
        SELECT id, full_name, email, role 
        FROM users 
        WHERE role = 'farmer' 
        LIMIT 1
    """)
    farmer = result.first()
    if farmer:
        print(f"\n  Sample Farmer:")
        print(f"    Name: {farmer[1]}")
        print(f"    Email: {farmer[2]}")
        print(f"    ID: {farmer[0]}")
except Exception as e:
    print(f"  Farmer query error: {e}")

try:
    result = db.execute("""
        SELECT crop_detected, grade, shelf_life_days, freshness, image_urls
        FROM crop_inspections
        ORDER BY created_at DESC
        LIMIT 1
    """)
    inspection = result.first()
    if inspection:
        print(f"\n  Latest AI Inspection:")
        print(f"    Crop: {inspection[0]}")
        print(f"    Grade: {inspection[1]}")
        print(f"    Shelf Life: {inspection[2]} days")
        print(f"    Freshness: {inspection[3]}")
        print(f"    Images: {inspection[4]}")
except Exception as e:
    print(f"  Inspection query error: {e}")

try:
    result = db.execute("""
        SELECT crop_type, quantity_kg, duration_days, booking_status, price_per_day
        FROM storage_bookings
        ORDER BY created_at DESC
        LIMIT 1
    """)
    booking = result.first()
    if booking:
        print(f"\n  Latest Booking:")
        print(f"    Crop: {booking[0]}")
        print(f"    Quantity: {booking[1]} kg")
        print(f"    Duration: {booking[2]} days")
        print(f"    Status: {booking[3]}")
        print(f"    Price/Day: Rs.{booking[4]}")
except Exception as e:
    print(f"  Booking query error: {e}")

try:
    result = db.execute("""
        SELECT crop, quantity_kg, duration_days, max_budget, status
        FROM storage_rfqs
        ORDER BY created_at DESC
        LIMIT 1
    """)
    rfq = result.first()
    if rfq:
        print(f"\n  Latest RFQ:")
        print(f"    Crop: {rfq[0]}")
        print(f"    Quantity: {rfq[1]} kg")
        print(f"    Duration: {rfq[2]} days")
        print(f"    Budget: Rs.{rfq[3]}")
        print(f"    Status: {rfq[4]}")
except Exception as e:
    print(f"  RFQ query error: {e}")

# Test 4: Data relationships
print("\n4. DATA RELATIONSHIPS")
print("-" * 80)

try:
    result = db.execute("""
        SELECT COUNT(*) FROM storage_bookings 
        WHERE ai_inspection_id IS NOT NULL
    """)
    bookings_with_inspection = result.scalar()
    print(f"  Bookings with AI Inspection: {bookings_with_inspection}")
except Exception as e:
    print(f"  Relationship query error: {e}")

try:
    result = db.execute("""
        SELECT COUNT(DISTINCT farmer_id) FROM storage_bookings
    """)
    unique_farmers = result.scalar()
    print(f"  Unique Farmers with Bookings: {unique_farmers}")
except Exception as e:
    print(f"  Unique farmers error: {e}")

print("\n" + "=" * 80)
print("TEST COMPLETE!")
print("=" * 80)

db.close()
