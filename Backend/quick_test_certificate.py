"""
Simple Certificate Test
Find any booking with AI inspection and test the workflow
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("\n" + "="*80)
print("  CERTIFICATE WORKFLOW TEST")
print("="*80)

# Step 1: Get all storage locations (they have bookings)
print("\n📍 Getting storage locations with bookings...")
response = requests.get(f"{BASE_URL}/storage-guard/locations")

if response.status_code != 200:
    print(f"❌ Failed: {response.status_code}")
    exit(1)

data = response.json()
locations = data.get('locations', [])
print(f"✅ Found {len(locations)} locations")

# Find a booking with AI inspection
test_booking_id = None
test_location = None

for loc in locations[:10]:  # Check first 10 locations
    loc_id = loc.get('id')
    # Get bookings for this location
    resp = requests.get(f"{BASE_URL}/storage-guard/locations/{loc_id}")
    if resp.status_code == 200:
        loc_data = resp.json()
        bookings = loc_data.get('bookings', [])
        
        for booking in bookings:
            if (booking.get('ai_inspection_id') and 
                booking.get('booking_status', '').upper() not in ['COMPLETED']):
                test_booking_id = booking['id']
                test_location = loc
                print(f"\n✅ Found test booking:")
                print(f"   Booking ID: {test_booking_id}")
                print(f"   Crop: {booking.get('crop_type')}")
                print(f"   Status: {booking.get('booking_status')}")
                print(f"   Vendor Confirmed: {booking.get('vendor_confirmed', False)}")
                break
    
    if test_booking_id:
        break

if not test_booking_id:
    print("\n❌ No suitable booking found. Creating one...")
    # You can add booking creation logic here if needed
    exit(1)

# Step 2: Test WITHOUT vendor approval (should fail)
print("\n" + "="*80)
print("  TEST 1: Try Certificate WITHOUT Vendor Approval")
print("="*80)

response = requests.post(f"{BASE_URL}/storage-guard/bookings/{test_booking_id}/complete")
print(f"Status: {response.status_code}")
if response.status_code == 400:
    error = response.json().get('detail', '')
    print(f"✅ Correctly blocked: {error}")
elif response.status_code == 200:
    print(f"⚠️ Certificate generated (might already be approved)")
else:
    print(f"⚠️ Unexpected: {response.text}")

# Step 3: Vendor confirms booking
print("\n" + "="*80)
print("  TEST 2: Vendor Confirms Booking")
print("="*80)

response = requests.post(
    f"{BASE_URL}/storage-guard/bookings/{test_booking_id}/vendor-confirm",
    json={
        "vendor_id": "test-vendor-123",
        "confirmed": True,
        "notes": "Testing certificate workflow"
    }
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"✅ Booking confirmed!")
    print(f"   Status: {result.get('booking_status')}")
    print(f"   Vendor Confirmed: {result.get('vendor_confirmed')}")
else:
    print(f"❌ Failed: {response.text}")

# Step 4: Generate certificate (should work now)
print("\n" + "="*80)
print("  TEST 3: Generate Certificate After Approval")
print("="*80)

response = requests.post(f"{BASE_URL}/storage-guard/bookings/{test_booking_id}/complete")
print(f"Status: {response.status_code}")

if response.status_code == 200:
    cert = response.json()
    print(f"✅ CERTIFICATE GENERATED!")
    print(f"\n📜 Certificate Details:")
    print(f"   Certificate ID: {cert.get('certificate_id')}")
    print(f"   Certificate #: {cert.get('certificate_number')}")
    print(f"   Quality Score: {cert.get('quality_score')}")
    print(f"   Issue Date: {cert.get('issue_date')}")
    
    if 'metrics' in cert:
        m = cert['metrics']
        print(f"\n📊 Quality Metrics:")
        print(f"   Temperature: {m.get('temperature_avg')}°C")
        print(f"   Humidity: {m.get('humidity_avg')}%")
        print(f"   Moisture: {m.get('moisture_avg')}%")
        print(f"   Compliance: {m.get('storage_compliance')}%")
else:
    print(f"❌ Failed: {response.json().get('detail', response.text)}")

# Step 5: Try again (should fail - already completed)
print("\n" + "="*80)
print("  TEST 4: Prevent Duplicate Certificate")
print("="*80)

response = requests.post(f"{BASE_URL}/storage-guard/bookings/{test_booking_id}/complete")
print(f"Status: {response.status_code}")
if response.status_code == 400:
    error = response.json().get('detail', '')
    print(f"✅ Correctly blocked: {error}")
else:
    print(f"⚠️ Unexpected: {response.status_code}")

print("\n" + "="*80)
print("  ✅ TEST COMPLETE")
print("="*80)
