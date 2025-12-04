"""
STORAGE GUARD STEP-BY-STEP TESTING SCRIPT
==========================================
This script tests each component of Storage Guard system independently

Run this to verify the complete flow before submitting.
"""

import psycopg2
from datetime import datetime, timedelta
import requests
import json

# Database connection
conn = psycopg2.connect(
    dbname="Agriculture",
    user="postgres",
    password="Mani8143",
    host="localhost",
    port="5432"
)
conn.autocommit = True
cur = conn.cursor()

BASE_URL = "http://localhost:8000/storage-guard"

print("=" * 80)
print("STORAGE GUARD COMPLETE SYSTEM TEST")
print("=" * 80)

# ============================================================================
# STEP 1: DATABASE STRUCTURE VERIFICATION
# ============================================================================
print("\n\nSTEP 1: VERIFYING DATABASE STRUCTURE")
print("-" * 80)

required_tables = [
    'storage_bookings',
    'storage_locations', 
    'market_inventory_snapshots',
    'sensor_readings',
    'iot_sensors',
    'crop_inspections',
    'vendors',
    'farmers',
    'users'
]

print("Checking required tables...")
for table in required_tables:
    cur.execute(f"""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '{table}';
    """)
    exists = cur.fetchone()[0]
    
    if exists:
        cur.execute(f"SELECT COUNT(*) FROM {table};")
        count = cur.fetchone()[0]
        print(f"   ✓ {table:35s}: {count:5d} rows")
    else:
        print(f"   ✗ {table:35s}: MISSING!")

# ============================================================================
# STEP 2: CHECK CURRENT DATA STATE
# ============================================================================
print("\n\nSTEP 2: CURRENT DATA STATE")
print("-" * 80)

# Bookings
cur.execute("""
    SELECT 
        booking_status,
        COUNT(*) as count
    FROM storage_bookings
    GROUP BY booking_status
    ORDER BY count DESC;
""")
booking_stats = cur.fetchall()
print("\nBookings by status:")
for stat in booking_stats:
    print(f"   {stat[0]:20s}: {stat[1]:3d}")

# Snapshots
cur.execute("""
    SELECT 
        status,
        COUNT(*) as count
    FROM market_inventory_snapshots
    GROUP BY status;
""")
snapshot_stats = cur.fetchall()
print("\nSnapshots by status:")
for stat in snapshot_stats:
    print(f"   {stat[0]:20s}: {stat[1]:3d}")

# Sensors and Readings
cur.execute("SELECT COUNT(*) FROM iot_sensors;")
sensor_count = cur.fetchone()[0]
cur.execute("""
    SELECT COUNT(*) 
    FROM sensor_readings 
    WHERE reading_time > NOW() - INTERVAL '1 hour';
""")
recent_readings = cur.fetchone()[0]
print(f"\nIoT Sensors: {sensor_count}")
print(f"Recent readings (last hour): {recent_readings}")

# ============================================================================
# STEP 3: TEST BOOKING CREATION FLOW
# ============================================================================
print("\n\nSTEP 3: TESTING BOOKING CREATION")
print("-" * 80)

# Get a farmer and location
cur.execute("SELECT id FROM users WHERE role = 'farmer' LIMIT 1;")
farmer_result = cur.fetchone()
if farmer_result:
    farmer_id = str(farmer_result[0])
    print(f"Using farmer_id: {farmer_id}")
    
    cur.execute("SELECT id, name FROM storage_locations LIMIT 1;")
    location_result = cur.fetchone()
    if location_result:
        location_id = str(location_result[0])
        location_name = location_result[1]
        print(f"Using location: {location_name} ({location_id})")
        
        # Test data
        test_booking = {
            "location_id": location_id,
            "crop_type": "Test Tomatoes",
            "quantity_kg": 500,
            "duration_days": 30,
            "start_date": datetime.now().isoformat(),
            "transport_required": False
        }
        
        print(f"\nAttempting to create test booking...")
        print(f"Crop: {test_booking['crop_type']}")
        print(f"Quantity: {test_booking['quantity_kg']}kg")
        
        try:
            response = requests.post(
                f"{BASE_URL}/bookings",
                params={"farmer_id": farmer_id},
                json=test_booking,
                timeout=10
            )
            
            if response.status_code == 200:
                booking_data = response.json()
                booking_id = booking_data.get('id')
                print(f"   ✓ Booking created: {booking_id}")
                
                # Check if snapshot was created
                cur.execute("""
                    SELECT id, status 
                    FROM market_inventory_snapshots 
                    WHERE booking_id = %s;
                """, (booking_id,))
                snapshot = cur.fetchone()
                
                if snapshot:
                    print(f"   ✓ Snapshot created: {snapshot[0]}")
                    print(f"   Status: {snapshot[1]}")
                else:
                    print(f"   ✗ No snapshot found for booking!")
                    
            else:
                print(f"   ✗ Booking creation failed: {response.status_code}")
                print(f"   Error: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError:
            print("   ✗ Cannot connect to backend - is it running?")
        except Exception as e:
            print(f"   ✗ Error: {e}")
    else:
        print("   ✗ No storage locations found")
else:
    print("   ✗ No farmers found")

# ============================================================================
# STEP 4: TEST SENSOR DATA GENERATION
# ============================================================================
print("\n\nSTEP 4: TESTING SENSOR DATA")
print("-" * 80)

cur.execute("""
    SELECT 
        location_id,
        COUNT(*) as sensor_count
    FROM iot_sensors
    GROUP BY location_id
    LIMIT 1;
""")
sensor_loc = cur.fetchone()

if sensor_loc:
    print(f"Location {str(sensor_loc[0])[:12]}... has {sensor_loc[1]} sensors")
    
    # Check latest readings
    cur.execute("""
        SELECT 
            s.sensor_type,
            sr.value,
            sr.reading_time AT TIME ZONE 'Asia/Kolkata' as reading_time
        FROM iot_sensors s
        LEFT JOIN sensor_readings sr ON sr.sensor_id = s.id
        WHERE s.location_id = %s
        AND sr.reading_time > NOW() - INTERVAL '10 minutes'
        ORDER BY sr.reading_time DESC
        LIMIT 5;
    """, (sensor_loc[0],))
    
    recent = cur.fetchall()
    if recent:
        print(f"\nRecent sensor readings (last 10 min):")
        for r in recent:
            print(f"   {r[0]:15s}: {r[1]:6.2f} at {r[2].strftime('%H:%M:%S')}")
    else:
        print("   ⚠ No recent sensor readings in last 10 minutes")
else:
    print("   ✗ No sensors found")

# ============================================================================
# STEP 5: TEST MARKET SNAPSHOT SYNC
# ============================================================================
print("\n\nSTEP 5: TESTING MARKET SNAPSHOT SYNC")
print("-" * 80)

cur.execute("""
    SELECT 
        id,
        booking_id,
        crop_type,
        status,
        updated_at AT TIME ZONE 'Asia/Kolkata' as updated_ist
    FROM market_inventory_snapshots
    ORDER BY updated_at DESC
    LIMIT 3;
""")
snapshots = cur.fetchall()

print("Latest snapshots:")
for snap in snapshots:
    age_minutes = (datetime.now() - snap[4].replace(tzinfo=None)).total_seconds() / 60
    print(f"   {snap[2]:30s} | {snap[3]:15s} | Updated {age_minutes:.0f} min ago")

# ============================================================================
# STEP 6: CHECK FOR ERRORS/ISSUES
# ============================================================================
print("\n\nSTEP 6: CHECKING FOR ISSUES")
print("-" * 80)

# Check for bookings without snapshots
cur.execute("""
    SELECT COUNT(*)
    FROM storage_bookings sb
    LEFT JOIN market_inventory_snapshots mis ON mis.booking_id = sb.id
    WHERE mis.id IS NULL 
    AND sb.booking_status != 'CANCELLED';
""")
missing_snapshots = cur.fetchone()[0]

if missing_snapshots > 0:
    print(f"   ⚠ WARNING: {missing_snapshots} bookings without snapshots")
    
    # Show which bookings are missing snapshots
    cur.execute("""
        SELECT sb.id, sb.crop_type, sb.created_at AT TIME ZONE 'Asia/Kolkata'
        FROM storage_bookings sb
        LEFT JOIN market_inventory_snapshots mis ON mis.booking_id = sb.id
        WHERE mis.id IS NULL 
        AND sb.booking_status != 'CANCELLED'
        LIMIT 5;
    """)
    missing = cur.fetchall()
    for m in missing:
        print(f"      - {m[1]:30s} created {m[2].strftime('%Y-%m-%d %H:%M')}")
else:
    print(f"   ✓ All active bookings have snapshots")

# Check for stale snapshots
cur.execute("""
    SELECT COUNT(*)
    FROM market_inventory_snapshots
    WHERE updated_at < NOW() - INTERVAL '2 hours';
""")
stale_count = cur.fetchone()[0]

if stale_count > 0:
    print(f"   ⚠ WARNING: {stale_count} snapshots not updated in 2+ hours")
else:
    print(f"   ✓ All snapshots are fresh")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)

cur.execute("SELECT COUNT(*) FROM storage_bookings WHERE booking_status != 'CANCELLED';")
active_bookings = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM market_inventory_snapshots;")
total_snapshots = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM sensor_readings WHERE reading_time > NOW() - INTERVAL '1 hour';")
recent_sensor_data = cur.fetchone()[0]

print(f"\nActive Bookings: {active_bookings}")
print(f"Total Snapshots: {total_snapshots}")
print(f"Sensor Readings (last hour): {recent_sensor_data}")
print(f"Missing Snapshots: {missing_snapshots}")
print(f"Stale Snapshots (>2h): {stale_count}")

if missing_snapshots == 0 and stale_count == 0:
    print("\n✓ ALL TESTS PASSED - System ready for submission!")
else:
    print("\n⚠ ISSUES FOUND - Please fix before submission")

print("\n" + "=" * 80)

cur.close()
conn.close()
