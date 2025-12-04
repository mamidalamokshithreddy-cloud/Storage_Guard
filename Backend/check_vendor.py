"""Check location vendor_id"""
import requests

BASE_URL = "http://127.0.0.1:8000"

response = requests.get(f"{BASE_URL}/storage-guard/locations")
locations = response.json().get('locations', [])

for loc in locations[:3]:
    print(f"\nLocation: {loc.get('location_name', 'N/A')}")
    print(f"  ID: {loc['id']}")
    print(f"  Vendor ID: {loc.get('vendor_id', 'None')}")
    print(f"  Type: {loc.get('storage_type', 'N/A')}")
