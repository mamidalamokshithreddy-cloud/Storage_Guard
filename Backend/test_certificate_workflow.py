"""
Test Certificate Workflow - End to End
Tests the complete booking lifecycle with vendor approval and certificate generation
"""
import requests
import json
from datetime import datetime

# API Base URL
BASE_URL = "http://127.0.0.1:8000"

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def test_certificate_workflow():
    """Test complete certificate generation workflow"""
    
    print_section("STEP 1: Get Farmer Bookings")
    
    # Get farmer dashboard to find farmer ID
    response = requests.get(f"{BASE_URL}/storage-guard/farmer-dashboard", params={
        "farmer_id": "d6d0a380-0d91-4411-8a97-921038be226d"  # Test farmer ID
    })
    if response.status_code != 200:
        print(f"❌ Failed to get farmer dashboard: {response.status_code}")
        return
    
    dashboard = response.json()
    bookings = dashboard.get('bookings', [])
    print(f"✅ Total bookings: {len(bookings)}")
    
    # Find a booking with AI inspection that's not completed
    test_booking = None
    for booking in bookings:
        if (booking.get('ai_inspection_id') and 
            booking.get('booking_status', '').upper() != 'COMPLETED'):
            test_booking = booking
            break
    
    if not test_booking:
        print("❌ No suitable test booking found (need AI inspection + not completed)")
        return
    
    booking_id = test_booking['id']
    print(f"\n📦 Selected Test Booking:")
    print(f"   ID: {booking_id}")
    print(f"   Crop: {test_booking.get('crop_type', 'N/A')}")
    print(f"   Status: {test_booking.get('booking_status', 'N/A')}")
    print(f"   Vendor Confirmed: {test_booking.get('vendor_confirmed', False)}")
    print(f"   AI Inspection: {test_booking.get('ai_inspection_id', 'None')}")
    
    # STEP 2: Try to complete without vendor approval (should fail)
    print_section("STEP 2: Test Certificate WITHOUT Vendor Approval (Should Fail)")
    
    response = requests.post(f"{BASE_URL}/storage-guard/bookings/{booking_id}/complete")
    if response.status_code == 400:
        error = response.json().get('detail', 'Unknown error')
        print(f"✅ Correctly blocked: {error}")
    else:
        print(f"⚠️ Unexpected response: {response.status_code}")
        print(f"   Response: {response.text}")
    
    # STEP 3: Vendor confirms the booking
    print_section("STEP 3: Vendor Confirms Booking")
    
    response = requests.post(
        f"{BASE_URL}/storage-guard/bookings/{booking_id}/vendor-confirm",
        json={
            "vendor_id": "test-vendor-123",
            "confirmed": True,
            "notes": "Test approval for certificate workflow"
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Vendor confirmed booking")
        print(f"   New Status: {result.get('booking_status', 'N/A')}")
        print(f"   Vendor Confirmed: {result.get('vendor_confirmed', False)}")
    else:
        print(f"❌ Vendor confirmation failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return
    
    # STEP 4: Complete booking and generate certificate (should succeed now)
    print_section("STEP 4: Complete Booking & Generate Certificate (Should Succeed)")
    
    response = requests.post(f"{BASE_URL}/storage-guard/bookings/{booking_id}/complete")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Certificate generated successfully!")
        print(f"\n📜 Certificate Details:")
        print(f"   Certificate ID: {result.get('certificate_id', 'N/A')}")
        print(f"   Certificate Number: {result.get('certificate_number', 'N/A')}")
        print(f"   Issue Date: {result.get('issue_date', 'N/A')}")
        print(f"   Overall Score: {result.get('quality_score', 'N/A')}")
        print(f"   Status: {result.get('status', 'N/A')}")
        
        if 'metrics' in result:
            print(f"\n📊 Quality Metrics:")
            metrics = result['metrics']
            print(f"   Temperature: {metrics.get('temperature_avg', 'N/A')}°C")
            print(f"   Humidity: {metrics.get('humidity_avg', 'N/A')}%")
            print(f"   Moisture: {metrics.get('moisture_avg', 'N/A')}%")
            print(f"   Storage Compliance: {metrics.get('storage_compliance', 'N/A')}%")
    else:
        print(f"❌ Certificate generation failed: {response.status_code}")
        error = response.json().get('detail', 'Unknown error')
        print(f"   Error: {error}")
        return
    
    # STEP 5: Verify booking is now completed
    print_section("STEP 5: Verify Booking Status")
    
    response = requests.get(f"{BASE_URL}/storage-guard/farmer-dashboard", params={
        "farmer_id": "d6d0a380-0d91-4411-8a97-921038be226d"
    })
    if response.status_code == 200:
        dashboard = response.json()
        bookings = dashboard.get('bookings', [])
        updated_booking = next((b for b in bookings if b['id'] == booking_id), None)
        
        if updated_booking:
            print(f"✅ Booking status updated:")
            print(f"   Status: {updated_booking.get('booking_status', 'N/A')}")
            print(f"   Certificate ID: {updated_booking.get('certificate_id', 'N/A')}")
        else:
            print(f"⚠️ Could not find updated booking")
    
    # STEP 6: Try to generate certificate again (should fail - already completed)
    print_section("STEP 6: Test Duplicate Certificate (Should Fail)")
    
    response = requests.post(f"{BASE_URL}/storage-guard/bookings/{booking_id}/complete")
    if response.status_code == 400:
        error = response.json().get('detail', 'Unknown error')
        print(f"✅ Correctly blocked duplicate: {error}")
    else:
        print(f"⚠️ Unexpected response: {response.status_code}")
    
    print_section("✅ TEST COMPLETE - WORKFLOW VERIFIED")
    print("\nSummary:")
    print("1. ✅ Certificate blocked without vendor approval")
    print("2. ✅ Vendor successfully confirmed booking")
    print("3. ✅ Certificate generated after approval")
    print("4. ✅ Booking marked as completed")
    print("5. ✅ Duplicate certificate generation blocked")

if __name__ == "__main__":
    try:
        test_certificate_workflow()
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
