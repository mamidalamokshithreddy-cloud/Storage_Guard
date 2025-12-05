"""
STORAGE GUARD - COMPREHENSIVE STEP-BY-STEP TEST
================================================
This script tests the entire booking flow without background processes
"""

import psycopg2
from datetime import datetime, timedelta
import uuid

def test_database_connection():
    """Step 1: Test database connection"""
    print("\n" + "="*80)
    print("STEP 1: DATABASE CONNECTION TEST")
    print("="*80)
    
    try:
        conn = psycopg2.connect(
            dbname="Agriculture",
            user="postgres",
            password="Mani8143",
            host="localhost",
            port="5432"
        )
        print("✓ Database connection successful")
        return conn
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return None

def check_table_structure(conn):
    """Step 2: Check all Storage Guard tables"""
    print("\n" + "="*80)
    print("STEP 2: TABLE STRUCTURE CHECK")
    print("="*80)
    
    cur = conn.cursor()
    
    tables_to_check = [
        'users',
        'farmers',
        'vendors',
        'storage_locations',
        'storage_bookings',
        'market_inventory_snapshots',
        'crop_inspections',
        'iot_sensors',
        'sensor_readings',
        'pest_detections'
    ]
    
    for table in tables_to_check:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {table};")
            count = cur.fetchone()[0]
            print(f"✓ {table:30s} - {count:5d} rows")
        except Exception as e:
            print(f"✗ {table:30s} - ERROR: {e}")
    
    cur.close()

def check_foreign_keys(conn):
    """Step 3: Check foreign key relationships"""
    print("\n" + "="*80)
    print("STEP 3: FOREIGN KEY INTEGRITY CHECK")
    print("="*80)
    
    cur = conn.cursor()
    
    # Check storage_bookings foreign keys
    checks = [
        ("storage_bookings → users (farmer_id)", """
            SELECT COUNT(*) FROM storage_bookings sb
            LEFT JOIN users u ON sb.farmer_id = u.id
            WHERE sb.farmer_id IS NOT NULL AND u.id IS NULL;
        """),
        ("storage_bookings → storage_locations", """
            SELECT COUNT(*) FROM storage_bookings sb
            LEFT JOIN storage_locations sl ON sb.location_id = sl.id
            WHERE sl.id IS NULL;
        """),
        ("storage_bookings → vendors", """
            SELECT COUNT(*) FROM storage_bookings sb
            LEFT JOIN vendors v ON sb.vendor_id = v.id
            WHERE sb.vendor_id IS NOT NULL AND v.id IS NULL;
        """),
        ("market_inventory_snapshots → storage_bookings", """
            SELECT COUNT(*) FROM market_inventory_snapshots mis
            LEFT JOIN storage_bookings sb ON mis.booking_id = sb.id
            WHERE sb.id IS NULL;
        """)
    ]
    
    for check_name, query in checks:
        try:
            cur.execute(query)
            orphaned = cur.fetchone()[0]
            if orphaned == 0:
                print(f"✓ {check_name:50s} - OK")
            else:
                print(f"✗ {check_name:50s} - {orphaned} orphaned records!")
        except Exception as e:
            print(f"✗ {check_name:50s} - ERROR: {e}")
    
    cur.close()

def check_booking_snapshot_sync(conn):
    """Step 4: Check booking-snapshot synchronization"""
    print("\n" + "="*80)
    print("STEP 4: BOOKING-SNAPSHOT SYNCHRONIZATION")
    print("="*80)
    
    cur = conn.cursor()
    
    # Total counts
    cur.execute("SELECT COUNT(*) FROM storage_bookings WHERE booking_status != 'CANCELLED';")
    active_bookings = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM market_inventory_snapshots;")
    total_snapshots = cur.fetchone()[0]
    
    print(f"Active Bookings:  {active_bookings}")
    print(f"Total Snapshots:  {total_snapshots}")
    
    # Bookings without snapshots
    cur.execute("""
        SELECT COUNT(*) FROM storage_bookings sb
        LEFT JOIN market_inventory_snapshots mis ON mis.booking_id = sb.id
        WHERE mis.id IS NULL AND sb.booking_status != 'CANCELLED';
    """)
    missing_snapshots = cur.fetchone()[0]
    
    if missing_snapshots > 0:
        print(f"✗ {missing_snapshots} active bookings WITHOUT snapshots!")
        
        # Show which bookings are missing snapshots
        cur.execute("""
            SELECT sb.id, sb.crop_type, sb.created_at AT TIME ZONE 'Asia/Kolkata'
            FROM storage_bookings sb
            LEFT JOIN market_inventory_snapshots mis ON mis.booking_id = sb.id
            WHERE mis.id IS NULL AND sb.booking_status != 'CANCELLED'
            LIMIT 5;
        """)
        missing = cur.fetchall()
        print("\n  Missing snapshots for:")
        for m in missing:
            print(f"    - {m[1]:30s} | Created: {m[2].strftime('%Y-%m-%d %H:%M:%S')}")
    else:
        print(f"✓ All active bookings have snapshots")
    
    cur.close()

def check_sensor_data_flow(conn):
    """Step 5: Check sensor data flow"""
    print("\n" + "="*80)
    print("STEP 5: SENSOR DATA FLOW CHECK")
    print("="*80)
    
    cur = conn.cursor()
    
    # Check recent sensor readings
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            MAX(reading_time AT TIME ZONE 'Asia/Kolkata') as latest_reading,
            EXTRACT(EPOCH FROM (NOW() - MAX(reading_time)))/60 as minutes_ago
        FROM sensor_readings;
    """)
    sensor_info = cur.fetchone()
    
    print(f"Total Sensor Readings: {sensor_info[0]}")
    if sensor_info[1]:
        print(f"Latest Reading: {sensor_info[1].strftime('%Y-%m-%d %H:%M:%S')} IST")
        print(f"Minutes Ago: {int(sensor_info[2])}")
        
        if sensor_info[2] < 10:
            print("✓ Sensor data is FRESH (< 10 minutes old)")
        elif sensor_info[2] < 60:
            print("⚠ Sensor data is recent but not fresh (< 1 hour old)")
        else:
            print("✗ Sensor data is STALE (> 1 hour old)")
    
    # Check sensors per location
    cur.execute("""
        SELECT 
            sl.name,
            COUNT(s.id) as sensor_count,
            COUNT(sr.id) as reading_count
        FROM storage_locations sl
        LEFT JOIN iot_sensors s ON s.location_id = sl.id
        LEFT JOIN sensor_readings sr ON sr.sensor_id = s.id
        GROUP BY sl.id, sl.name
        ORDER BY reading_count DESC
        LIMIT 5;
    """)
    locations = cur.fetchall()
    
    print("\nTop 5 Locations by Sensor Activity:")
    for loc in locations:
        print(f"  {loc[0]:40s} - {loc[1]} sensors, {loc[2]} readings")
    
    cur.close()

def test_booking_creation_requirements(conn):
    """Step 6: Test if we have all required data for booking creation"""
    print("\n" + "="*80)
    print("STEP 6: BOOKING CREATION REQUIREMENTS")
    print("="*80)
    
    cur = conn.cursor()
    
    # Check for at least one farmer
    cur.execute("SELECT id, full_name FROM farmers LIMIT 1;")
    farmer = cur.fetchone()
    if farmer:
        print(f"✓ Farmer available: {farmer[1]} ({farmer[0]})")
    else:
        print("✗ No farmers available!")
    
    # Check for at least one location
    cur.execute("SELECT id, name, capacity_text FROM storage_locations LIMIT 1;")
    location = cur.fetchone()
    if location:
        capacity = location[2] if location[2] else "Unknown"
        print(f"✓ Location available: {location[1]} (Capacity: {capacity})")
    else:
        print("✗ No storage locations!")
    
    # Check for vendor
    cur.execute("SELECT id, business_name FROM vendors LIMIT 1;")
    vendor = cur.fetchone()
    if vendor:
        print(f"✓ Vendor available: {vendor[1]}")
    else:
        print("✗ No vendors available!")
    
    cur.close()
    
    return farmer, location, vendor

def check_recent_booking_errors(conn):
    """Step 7: Check for recent booking attempts and errors"""
    print("\n" + "="*80)
    print("STEP 7: RECENT BOOKING ACTIVITY")
    print("="*80)
    
    cur = conn.cursor()
    
    # Get recent bookings (last 24 hours)
    cur.execute("""
        SELECT 
            id,
            crop_type,
            quantity_kg,
            booking_status,
            created_at AT TIME ZONE 'Asia/Kolkata' as created_ist,
            EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago
        FROM storage_bookings
        WHERE created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 10;
    """)
    recent = cur.fetchall()
    
    if recent:
        print(f"\nFound {len(recent)} bookings in last 24 hours:")
        for r in recent:
            print(f"  {r[1]:30s} | {r[2]:6d}kg | {r[3]:10s} | {r[5]:.1f}h ago")
    else:
        print("⚠ No bookings created in last 24 hours!")
    
    # Check for duplicate bookings
    cur.execute("""
        SELECT 
            crop_type,
            quantity_kg,
            COUNT(*) as dup_count
        FROM storage_bookings
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY crop_type, quantity_kg, farmer_id, location_id
        HAVING COUNT(*) > 1;
    """)
    duplicates = cur.fetchall()
    
    if duplicates:
        print(f"\n✗ Found {len(duplicates)} duplicate booking groups in last hour:")
        for dup in duplicates:
            print(f"  {dup[0]:30s} | {dup[1]}kg | {dup[2]} duplicates")
    else:
        print("\n✓ No duplicate bookings detected")
    
    cur.close()

def check_market_connect_readiness(conn):
    """Step 8: Check if data is ready for Market Connect"""
    print("\n" + "="*80)
    print("STEP 8: MARKET CONNECT READINESS")
    print("="*80)
    
    cur = conn.cursor()
    
    # Check snapshot status distribution
    cur.execute("""
        SELECT 
            status,
            COUNT(*) as count
        FROM market_inventory_snapshots
        GROUP BY status
        ORDER BY count DESC;
    """)
    statuses = cur.fetchall()
    
    print("\nSnapshot Status Distribution:")
    for s in statuses:
        print(f"  {s[0]:20s}: {s[1]} snapshots")
    
    # Check snapshot freshness
    cur.execute("""
        SELECT 
            COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 hour') as fresh,
            COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '1 hour') as stale,
            COUNT(*) as total
        FROM market_inventory_snapshots;
    """)
    freshness = cur.fetchone()
    
    print(f"\nSnapshot Freshness:")
    print(f"  Fresh (< 1 hour):  {freshness[0]} ({100*freshness[0]/freshness[2]:.1f}%)")
    print(f"  Stale (> 1 hour):  {freshness[1]} ({100*freshness[1]/freshness[2]:.1f}%)")
    
    # Check required fields for Market Connect
    cur.execute("""
        SELECT 
            COUNT(*) FILTER (WHERE farmer_id IS NULL) as missing_farmer,
            COUNT(*) FILTER (WHERE location_id IS NULL) as missing_location,
            COUNT(*) FILTER (WHERE crop_type IS NULL OR crop_type = '') as missing_crop,
            COUNT(*) FILTER (WHERE quantity_kg IS NULL OR quantity_kg = 0) as missing_qty,
            COUNT(*) as total
        FROM market_inventory_snapshots;
    """)
    validation = cur.fetchone()
    
    print(f"\nData Validation:")
    if validation[0] > 0:
        print(f"  ✗ {validation[0]} snapshots missing farmer_id")
    if validation[1] > 0:
        print(f"  ✗ {validation[1]} snapshots missing location_id")
    if validation[2] > 0:
        print(f"  ✗ {validation[2]} snapshots missing crop_type")
    if validation[3] > 0:
        print(f"  ✗ {validation[3]} snapshots missing quantity")
    
    if sum(validation[0:4]) == 0:
        print(f"  ✓ All {validation[4]} snapshots have required fields")
    
    cur.close()

def main():
    """Run all tests"""
    print("\n")
    print("╔" + "═"*78 + "╗")
    print("║" + " "*20 + "STORAGE GUARD COMPREHENSIVE TEST" + " "*26 + "║")
    print("║" + " "*30 + "Step-by-Step Analysis" + " "*28 + "║")
    print("╚" + "═"*78 + "╝")
    
    # Step 1: Connect to database
    conn = test_database_connection()
    if not conn:
        print("\n❌ CRITICAL: Cannot proceed without database connection")
        return
    
    conn.autocommit = True
    
    # Step 2: Check table structure
    check_table_structure(conn)
    
    # Step 3: Check foreign keys
    check_foreign_keys(conn)
    
    # Step 4: Check booking-snapshot sync
    check_booking_snapshot_sync(conn)
    
    # Step 5: Check sensor data
    check_sensor_data_flow(conn)
    
    # Step 6: Check booking requirements
    farmer, location, vendor = test_booking_creation_requirements(conn)
    
    # Step 7: Check recent activity
    check_recent_booking_errors(conn)
    
    # Step 8: Check Market Connect readiness
    check_market_connect_readiness(conn)
    
    # Final summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    if farmer and location and vendor:
        print("✓ System has all required data for booking creation")
        print("✓ Ready to test booking flow")
    else:
        print("✗ System missing required data:")
        if not farmer:
            print("  - Need at least one farmer")
        if not location:
            print("  - Need at least one active storage location")
        if not vendor:
            print("  - Need at least one vendor")
    
    conn.close()
    
    print("\n" + "="*80)
    print("Next Steps:")
    print("  1. Review the test results above")
    print("  2. Fix any issues marked with ✗")
    print("  3. Test manual booking creation through API")
    print("  4. Check backend logs for detailed errors")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
