import requests
import json

def test_all_storage_guard_endpoints():
    """Test all Storage Guard API endpoints to verify they work for frontend"""
    
    API_BASE = "http://localhost:8000"
    
    endpoints = [
        "/storage/dashboard",
        "/storage/transport", 
        "/storage/quality-analysis",
        "/storage/iot-sensors",
        "/storage/pest-detection",
        "/storage/compliance-advanced",
        "/storage/vendors"
    ]
    
    print("🔍 TESTING ALL STORAGE GUARD API ENDPOINTS")
    print("=" * 60)
    
    results = {}
    
    for endpoint in endpoints:
        try:
            print(f"\n🌐 Testing: {endpoint}")
            response = requests.get(f"{API_BASE}{endpoint}")
            
            if response.status_code == 200:
                data = response.json()
                results[endpoint] = {
                    "status": "✅ SUCCESS",
                    "response_size": len(json.dumps(data)),
                    "has_data": len(str(data)) > 50
                }
                print(f"   Status: ✅ 200 OK")
                print(f"   Data size: {len(json.dumps(data))} characters")
                
                # Show sample data structure
                if isinstance(data, dict):
                    print(f"   Keys: {list(data.keys())}")
                
            else:
                results[endpoint] = {
                    "status": f"❌ ERROR {response.status_code}",
                    "response_size": 0,
                    "has_data": False
                }
                print(f"   Status: ❌ {response.status_code}")
                print(f"   Error: {response.text[:100]}...")
                
        except requests.exceptions.ConnectionError:
            results[endpoint] = {
                "status": "❌ CONNECTION ERROR",
                "response_size": 0,
                "has_data": False
            }
            print(f"   Status: ❌ Cannot connect to {API_BASE}")
            break
        except Exception as e:
            results[endpoint] = {
                "status": f"❌ EXCEPTION: {str(e)[:50]}",
                "response_size": 0,
                "has_data": False
            }
            print(f"   Status: ❌ {str(e)[:50]}")
    
    print(f"\n📊 SUMMARY REPORT")
    print("=" * 40)
    
    success_count = 0
    for endpoint, result in results.items():
        status_icon = "✅" if "SUCCESS" in result["status"] else "❌"
        print(f"{status_icon} {endpoint:25} {result['status']}")
        if "SUCCESS" in result["status"]:
            success_count += 1
    
    print(f"\n🎯 Results: {success_count}/{len(endpoints)} endpoints working")
    
    if success_count == len(endpoints):
        print("🎉 ALL ENDPOINTS READY FOR FRONTEND!")
        print("\nFrontend can now use:")
        print("- Real-time transport data from /storage/transport")
        print("- Quality control data from /storage/quality-analysis")
        print("- IoT sensor data from /storage/iot-sensors") 
        print("- Pest detection from /storage/pest-detection")
        print("- Compliance data from /storage/compliance-advanced")
        print("- Vendor information from /storage/vendors")
    else:
        print("⚠️  Some endpoints need attention before frontend integration")
    
    return success_count == len(endpoints)

if __name__ == "__main__":
    test_all_storage_guard_endpoints()