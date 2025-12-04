"""Check existing bookings status"""
import requests

BASE_URL = "http://127.0.0.1:8000"

print("\n🔍 Checking all bookings...\n")

# Get locations
response = requests.get(f"{BASE_URL}/storage-guard/locations")
if response.status_code != 200:
    print(f"❌ Failed to get locations")
    exit(1)

locations = response.json().get('locations', [])
print(f"Found {len(locations)} storage locations\n")

total_bookings = 0
with_ai = 0
without_ai = 0
completed = 0
pending = 0

for loc in locations:
    loc_id = loc.get('id')
    resp = requests.get(f"{BASE_URL}/storage-guard/locations/{loc_id}")
    
    if resp.status_code == 200:
        data = resp.json()
        bookings = data.get('bookings', [])
        
        for booking in bookings:
            total_bookings += 1
            has_ai = booking.get('ai_inspection_id') is not None
            status = booking.get('booking_status', '').upper()
            vendor_confirmed = booking.get('vendor_confirmed', False)
            
            if has_ai:
                with_ai += 1
            else:
                without_ai += 1
            
            if status == 'COMPLETED':
                completed += 1
            elif status == 'PENDING':
                pending += 1
            
            # Print first few bookings with details
            if total_bookings <= 5:
                print(f"📦 Booking #{total_bookings}:")
                print(f"   ID: {booking['id']}")
                print(f"   Crop: {booking.get('crop_type', 'N/A')}")
                print(f"   Status: {status}")
                print(f"   Vendor Confirmed: {vendor_confirmed}")
                print(f"   AI Inspection: {'✅ Yes' if has_ai else '❌ No'}")
                print()

print("\n" + "="*60)
print("SUMMARY:")
print(f"  Total Bookings: {total_bookings}")
print(f"  With AI Inspection: {with_ai}")
print(f"  Without AI: {without_ai}")
print(f"  Completed: {completed}")
print(f"  Pending: {pending}")
print("="*60)

if with_ai > 0:
    print(f"\n✅ Found {with_ai} booking(s) with AI inspection")
else:
    print(f"\n❌ No bookings with AI inspection found")
    print(f"   You need to create a booking using 'Analyze & Book' option")
