"""
Test Booking Creation - Manual API Test
"""
import requests
import json
from datetime import datetime, timedelta

def test_booking_creation():
    """Test creating a booking through the API"""
    
    print("\n" + "="*80)
    print("TESTING BOOKING CREATION")
    print("="*80)
    
    # Use data from comprehensive test
    farmer_id = "251be03b-6816-4acc-8a8d-c3afb79c285e"  # mamidala mokshith reddy
    
    # Get a valid location
    print("\n1. Getting storage locations...")
    try:
        resp = requests.get("http://localhost:8000/storage-guard/storage-locations", timeout=5)
        if resp.status_code == 200:
            locations = resp.json()
            if locations and len(locations) > 0:
                location_id = locations[0]['id']
                print(f"   ✓ Using location: {locations[0]['name']}")
                print(f"   Location ID: {location_id}")
            else:
                print("   ✗ No locations returned")
                return
        else:
            print(f"   ✗ API returned status {resp.status_code}: {resp.text}")
            return
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return
    
    # Create booking data
    print("\n2. Preparing booking data...")
    booking_data = {
        "location_id": location_id,
        "crop_type": "Test Tomatoes",
        "quantity_kg": 500,
        "duration_days": 30,
        "start_date": datetime.now().isoformat()
    }
    
    print(f"   Crop: {booking_data['crop_type']}")
    print(f"   Quantity: {booking_data['quantity_kg']}kg")
    print(f"   Duration: {booking_data['duration_days']} days")
    
    # Send booking request
    print("\n3. Creating booking...")
    url = f"http://localhost:8000/storage-guard/bookings?farmer_id={farmer_id}"
    
    try:
        resp = requests.post(
            url,
            json=booking_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\n   Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            result = resp.json()
            print(f"\n   ✓ BOOKING CREATED SUCCESSFULLY!")
            print(f"   Booking ID: {result.get('id')}")
            print(f"   Crop: {result.get('crop_type')}")
            print(f"   Status: {result.get('booking_status')}")
            print(f"   Total Price: ₹{result.get('total_price')}")
            
            # Check if snapshot was created
            print("\n4. Checking if snapshot was created...")
            import psycopg2
            conn = psycopg2.connect(
                dbname="Agriculture",
                user="postgres",
                password="Mani8143",
                host="localhost",
                port="5432"
            )
            conn.autocommit = True
            cur = conn.cursor()
            
            cur.execute("""
                SELECT id, status, created_at AT TIME ZONE 'Asia/Kolkata'
                FROM market_inventory_snapshots
                WHERE booking_id = %s
            """, (result.get('id'),))
            
            snapshot = cur.fetchone()
            if snapshot:
                print(f"   ✓ Snapshot created: {snapshot[0]}")
                print(f"   Status: {snapshot[1]}")
                print(f"   Created: {snapshot[2].strftime('%Y-%m-%d %H:%M:%S')} IST")
            else:
                print(f"   ✗ NO SNAPSHOT FOUND for booking {result.get('id')}")
            
            cur.close()
            conn.close()
            
        elif resp.status_code == 422:
            print(f"\n   ✗ VALIDATION ERROR:")
            error_detail = resp.json()
            print(f"   {json.dumps(error_detail, indent=2)}")
        elif resp.status_code == 500:
            print(f"\n   ✗ SERVER ERROR:")
            print(f"   {resp.text}")
        else:
            print(f"\n   ✗ UNEXPECTED ERROR:")
            print(f"   {resp.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n   ✗ Cannot connect to backend!")
        print("   Is the backend running on http://localhost:8000?")
    except Exception as e:
        print(f"\n   ✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_booking_creation()
