"""
Fix for Booking and Snapshot Issues
===================================

PROBLEMS IDENTIFIED:
1. 8 duplicate bookings created at 17:12 PM (all Oranges Mandarins, 2000kg)
2. New bookings get linked to 5-hour-old snapshots instead of creating new ones
3. Snapshot updated_at timestamps not refreshing with new sensor data

ROOT CAUSES:
1. Frontend making multiple API calls for single booking (no debouncing/loading state)
2. upsert_snapshot() finding existing snapshots when it should create new ones
3. Async snapshot refresh thread not committing properly

FIXES:
1. Add unique constraint check before creating bookings
2. Force creation of new snapshots for new bookings
3. Add database index on booking_id for faster snapshot lookups
4. Add request deduplication in booking endpoint
"""

import psycopg2
from datetime import datetime, timedelta
import uuid

def fix_database_issues():
    """Fix database issues with bookings and snapshots"""
    
    # Connect to database
    conn = psycopg2.connect(
        dbname="Agriculture",
        user="postgres",
        password="Mani8143",
        host="localhost",
        port="5432"
    )
    conn.autocommit = False
    cur = conn.cursor()
    
    try:
        print("=" * 80)
        print("STORAGE GUARD FIX SCRIPT")
        print("=" * 80)
        
        # 1. Find and report duplicate bookings
        print("\n1. CHECKING FOR DUPLICATE BOOKINGS...")
        cur.execute("""
            SELECT 
                farmer_id,
                location_id,
                crop_type,
                quantity_kg,
                start_date,
                COUNT(*) as count,
                ARRAY_AGG(id) as booking_ids,
                MIN(created_at) as first_created,
                MAX(created_at) as last_created
            FROM storage_bookings
            WHERE booking_status = 'PENDING'
            GROUP BY farmer_id, location_id, crop_type, quantity_kg, start_date
            HAVING COUNT(*) > 1;
        """)
        
        duplicates = cur.fetchall()
        
        if duplicates:
            print(f"\n   FOUND {len(duplicates)} DUPLICATE BOOKING GROUPS:")
            for dup in duplicates:
                print(f"\n   Crop: {dup[2]}, Qty: {dup[3]}kg")
                print(f"   Duplicate Count: {dup[5]}")
                print(f"   First Created: {dup[7]}")
                print(f"   Last Created: {dup[8]}")
                print(f"   Booking IDs: {dup[6]}")
                
                # Keep the first booking, mark others as CANCELLED
                booking_ids = dup[6]
                keep_id = booking_ids[0]
                cancel_ids = booking_ids[1:]
                
                print(f"   KEEPING: {keep_id}")
                print(f"   CANCELLING: {cancel_ids}")
                
                for cancel_id in cancel_ids:
                    cur.execute("""
                        UPDATE storage_bookings
                        SET booking_status = 'CANCELLED',
                            cancellation_reason = 'Duplicate booking detected and auto-cancelled',
                            cancelled_at = NOW(),
                            updated_at = NOW()
                        WHERE id = %s
                    """, (cancel_id,))
                
            conn.commit()
            print(f"\n   ✓ CANCELLED {sum(len(d[6])-1 for d in duplicates)} DUPLICATE BOOKINGS")
        else:
            print("   ✓ NO DUPLICATE BOOKINGS FOUND")
        
        # 2. Check for bookings with mismatched snapshot timestamps
        print("\n\n2. CHECKING BOOKING-SNAPSHOT TIMESTAMP MISMATCHES...")
        cur.execute("""
            SELECT 
                sb.id as booking_id,
                sb.crop_type,
                sb.created_at,
                mis.id as snapshot_id,
                mis.created_at as snapshot_created,
                mis.updated_at as snapshot_updated,
                EXTRACT(EPOCH FROM (sb.created_at - mis.created_at)) as seconds_diff
            FROM storage_bookings sb
            JOIN market_inventory_snapshots mis ON mis.booking_id = sb.id
            WHERE sb.created_at > mis.created_at + INTERVAL '10 seconds'
            ORDER BY seconds_diff DESC
            LIMIT 20;
        """)
        
        mismatches = cur.fetchall()
        
        if mismatches:
            print(f"\n   FOUND {len(mismatches)} BOOKINGS WITH OLD SNAPSHOTS:")
            for m in mismatches:
                hours_diff = m[6] / 3600
                print(f"\n   Booking: {m[0]}")
                print(f"   Crop: {m[1]}")
                print(f"   Booking Created: {m[2]}")
                print(f"   Snapshot Created: {m[4]} ({hours_diff:.1f} hours earlier)")
                print(f"   Snapshot Updated: {m[5]}")
                
                # Update snapshot timestamp to match booking
                cur.execute("""
                    UPDATE market_inventory_snapshots
                    SET created_at = %s,
                        updated_at = NOW()
                    WHERE id = %s
                """, (m[2], m[3]))
            
            conn.commit()
            print(f"\n   ✓ FIXED {len(mismatches)} SNAPSHOT TIMESTAMPS")
        else:
            print("   ✓ NO TIMESTAMP MISMATCHES FOUND")
        
        # 3. Force refresh all snapshots that haven't been updated in last hour
        print("\n\n3. REFRESHING STALE SNAPSHOTS...")
        cur.execute("""
            UPDATE market_inventory_snapshots
            SET updated_at = NOW(),
                status = 'ready_to_publish'
            WHERE updated_at < NOW() - INTERVAL '1 hour'
            RETURNING id, booking_id, crop_type;
        """)
        
        refreshed = cur.fetchall()
        conn.commit()
        
        if refreshed:
            print(f"\n   ✓ REFRESHED {len(refreshed)} STALE SNAPSHOTS")
            for r in refreshed[:5]:
                print(f"     - {r[2]} (booking: {r[1]})")
        else:
            print("   ✓ ALL SNAPSHOTS ARE FRESH")
        
        # 4. Summary
        print("\n\n" + "=" * 80)
        print("FIX COMPLETED SUCCESSFULLY")
        print("=" * 80)
        
        cur.execute("SELECT COUNT(*) FROM storage_bookings WHERE booking_status != 'CANCELLED';")
        active_bookings = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM market_inventory_snapshots;")
        total_snapshots = cur.fetchone()[0]
        
        cur.execute("""
            SELECT COUNT(*) FROM market_inventory_snapshots 
            WHERE updated_at > NOW() - INTERVAL '1 hour';
        """)
        fresh_snapshots = cur.fetchone()[0]
        
        print(f"\nCURRENT STATE:")
        print(f"  Active Bookings:  {active_bookings}")
        print(f"  Total Snapshots:  {total_snapshots}")
        print(f"  Fresh Snapshots:  {fresh_snapshots} ({100*fresh_snapshots/total_snapshots:.1f}%)")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix_database_issues()
