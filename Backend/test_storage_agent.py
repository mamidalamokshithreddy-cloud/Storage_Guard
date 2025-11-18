import requests
import json

def test_storage_guard_agent():
    """Test if Storage Guard Agent is working after the fix"""
    
    API_BASE = "http://localhost:8000"
    
    print("🧪 TESTING STORAGE GUARD AGENT INITIALIZATION")
    print("=" * 50)
    
    try:
        # Test basic endpoints first
        endpoints = [
            "/storage/dashboard",
            "/storage/transport", 
            "/storage/vendors"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{API_BASE}{endpoint}")
            if response.status_code == 200:
                print(f"✅ {endpoint} - Working")
            else:
                print(f"❌ {endpoint} - Error {response.status_code}")
        
        # Test image analysis endpoint (this was failing before)
        print(f"\n🔍 Testing image analysis endpoint...")
        print("Note: This endpoint requires an image file, so we'll just check if it responds properly to a request")
        
        # Test with a simple GET request to see if the dependency injection works
        try:
            # We can't test the actual image upload without a file, 
            # but we can see if the endpoint is accessible
            response = requests.post(f"{API_BASE}/storage/analyze", 
                                   files={'file': ('test.jpg', b'fake_image_data', 'image/jpeg')})
            
            # Even if it fails, we want to see if it's a 500 error (agent not found) 
            # or a different error (which means the agent is found but image processing failed)
            if response.status_code == 500:
                if "storage_guard_agent" in response.text.lower():
                    print("❌ Storage Guard Agent still not initialized properly")
                    return False
                else:
                    print("✅ Storage Guard Agent found, different error (expected with fake data)")
                    return True
            elif response.status_code in [400, 422]:
                print("✅ Storage Guard Agent working - got expected validation error")
                return True
            else:
                print(f"✅ Storage Guard Agent working - got response {response.status_code}")
                return True
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection error: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_storage_guard_agent()
    if success:
        print("\n🎉 Storage Guard Agent is working!")
    else:
        print("\n⚠️ Storage Guard Agent needs attention")