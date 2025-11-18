#!/usr/bin/env python3
"""
Test script to verify that new farmer registration with images works properly
"""

import requests
import os

# Test farmer registration with files
def test_farmer_registration():
    url = "http://localhost:8000/admin/register/farmer"
    
    # Test data
    data = {
        "full_name": "Test Farmer With Images",
        "email": "testfarmer@example.com",
        "phone": "+1234567890",
        "password": "testpassword123",
        "city": "Test City",
        "state": "Test State",
        "country": "IN",
        "farm_size": 5.0,
        "primary_crop_types": "Rice, Wheat",
        "years_of_experience": 3,
        "farmer_location": "Test Location",
        "aadhar_number": "123456789000"
    }
    
    # Find an existing image to use for testing
    uploads_dir = "C:\\Users\\Mani\\OneDrive\\Desktop\\Agri_hub project\\Backend\\uploads\\farmers"
    if os.path.exists(uploads_dir):
        files = os.listdir(uploads_dir)
        if files:
            test_image = os.path.join(uploads_dir, files[0])
            print(f"Using test image: {test_image}")
            
            # Open the file for testing
            with open(test_image, 'rb') as f:
                files_data = {
                    'photo_file': ('test_photo.jpg', f, 'image/jpeg'),
                    'aadhar_front_file': ('test_aadhar.jpg', f, 'image/jpeg')
                }
                
                try:
                    response = requests.post(url, data=data, files=files_data, timeout=30)
                    
                    if response.status_code == 200:
                        print("✅ Registration successful!")
                        print(f"Response: {response.json()}")
                        return True
                    else:
                        print(f"❌ Registration failed: {response.status_code}")
                        print(f"Error: {response.text}")
                        return False
                        
                except requests.exceptions.RequestException as e:
                    print(f"❌ Request failed: {e}")
                    return False
    else:
        print("❌ No test images found in uploads directory")
        return False

if __name__ == "__main__":
    print("🧪 Testing farmer registration with images...")
    success = test_farmer_registration()
    if success:
        print("✅ Test passed! New registrations with images should work.")
    else:
        print("❌ Test failed! There might be an issue with registration.")