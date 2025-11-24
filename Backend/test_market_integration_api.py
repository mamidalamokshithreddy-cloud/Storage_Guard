"""
Test script for Market Integration API
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Test data from the confirmed booking
FARMER_ID = "d6d0a380-0d91-4411-8a97-921038be226d"
BOOKING_ID = "29e85a5e-df74-4a8e-8b4c-d6ff57fc28c3"

def test_create_listing():
    """Test creating a market listing from storage booking"""
    print("\n" + "="*60)
    print("TEST 1: Create Listing from Storage Booking")
    print("="*60)
    
    url = f"{BASE_URL}/market-integration/listings/from-storage"
    params = {"farmer_id": FARMER_ID}
    payload = {
        "storage_booking_id": BOOKING_ID,
        "minimum_price": 2500,  # ₹2500/quintal
        "target_price": 3000,   # ₹3000/quintal
        "visibility": "PUBLIC",
        "auto_accept_at_target": False
    }
    
    print(f"\n📤 POST {url}")
    print(f"Params: {params}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(url, params=params, json=payload)
    
    print(f"\n📥 Response Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS!")
        print(json.dumps(data, indent=2))
        return data.get('listing_id')
    else:
        print(f"❌ FAILED!")
        print(response.text)
        return None


def test_get_listing(listing_id):
    """Test getting listing details"""
    print("\n" + "="*60)
    print("TEST 2: Get Listing Details")
    print("="*60)
    
    url = f"{BASE_URL}/market-integration/listings/{listing_id}"
    
    print(f"\n📤 GET {url}")
    
    response = requests.get(url)
    
    print(f"\n📥 Response Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS!")
        print(json.dumps(data, indent=2, default=str))
    else:
        print(f"❌ FAILED!")
        print(response.text)


def test_get_my_listings():
    """Test getting farmer's listings"""
    print("\n" + "="*60)
    print("TEST 3: Get My Listings")
    print("="*60)
    
    url = f"{BASE_URL}/market-integration/my-listings"
    params = {"farmer_id": FARMER_ID}
    
    print(f"\n📤 GET {url}")
    print(f"Params: {params}")
    
    response = requests.get(url, params=params)
    
    print(f"\n📥 Response Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS!")
        print(f"Total listings: {data['total']}")
        for listing in data['listings']:
            print(f"\n  - {listing['crop_type']}: {listing['quantity_quintals']}q @ ₹{listing['target_price']}/q")
            print(f"    Status: {listing['listing_status']}, Matched buyers: {len(listing.get('matched_buyers', []))}")
    else:
        print(f"❌ FAILED!")
        print(response.text)


def test_get_matched_buyers(listing_id):
    """Test getting matched buyers"""
    print("\n" + "="*60)
    print("TEST 4: Get Matched Buyers")
    print("="*60)
    
    url = f"{BASE_URL}/market-integration/listings/{listing_id}/matches"
    
    print(f"\n📤 GET {url}")
    
    response = requests.get(url)
    
    print(f"\n📥 Response Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS!")
        print(f"Total matched buyers: {data['total_matched']}")
        for buyer in data['matched_buyers']:
            print(f"\n  - {buyer['buyer_name']} ({buyer['buyer_type']})")
            print(f"    Match score: {buyer['match_score']}%")
            print(f"    Reasons: {', '.join(buyer['match_reasons'])}")
    else:
        print(f"❌ FAILED!")
        print(response.text)


def test_price_alerts():
    """Test getting price alerts"""
    print("\n" + "="*60)
    print("TEST 5: Get Price Alerts")
    print("="*60)
    
    url = f"{BASE_URL}/market-integration/price-alerts"
    params = {"farmer_id": FARMER_ID}
    
    print(f"\n📤 GET {url}")
    print(f"Params: {params}")
    
    response = requests.get(url, params=params)
    
    print(f"\n📥 Response Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS!")
        print(f"Total alerts: {data['total_alerts']}")
        for alert in data['alerts']:
            print(f"\n  {alert['message']}")
            print(f"  Recommendation: {alert['recommendation']}")
    else:
        print(f"❌ FAILED!")
        print(response.text)


def main():
    print("\n🚀 Starting Market Integration API Tests")
    print("="*60)
    
    # Test 1: Create listing
    listing_id = test_create_listing()
    
    if listing_id:
        # Test 2: Get listing details
        test_get_listing(listing_id)
        
        # Test 3: Get my listings
        test_get_my_listings()
        
        # Test 4: Get matched buyers
        test_get_matched_buyers(listing_id)
        
        # Test 5: Get price alerts
        test_price_alerts()
    
    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60)


if __name__ == "__main__":
    main()
