import requests
import json

def test_transport_endpoint():
    """Test the updated transport endpoint"""
    try:
        # Test the transport endpoint
        response = requests.get("http://localhost:8000/storage/transport")
        
        if response.status_code == 200:
            data = response.json()
            
            print("🚛 TRANSPORT ENDPOINT TEST - SUCCESS!")
            print("=" * 50)
            print(f"Status: {data.get('status', 'N/A')}")
            
            # Transport fleet data
            fleet = data.get('transport_fleet', {})
            print(f"\n🚚 Fleet Summary:")
            print(f"  Active Vehicles: {fleet.get('active_vehicles', 0)}")
            print(f"  Total Vehicles: {fleet.get('total_vehicles', 0)}")
            print(f"  Refrigerated: {fleet.get('refrigerated_trucks', 0)}")
            print(f"  Dry Cargo: {fleet.get('dry_cargo_trucks', 0)}")
            print(f"  Temperature Controlled: {fleet.get('temperature_controlled', 0)}")
            
            # Route optimization
            routes = data.get('route_optimization', {})
            print(f"\n🗺️ Route Optimization:")
            print(f"  Active Routes: {routes.get('active_routes', 0)}")
            print(f"  Total Routes: {routes.get('total_routes', 0)}")
            print(f"  Completed: {routes.get('completed_routes', 0)}")
            print(f"  Avg Distance: {routes.get('avg_distance', 'N/A')}")
            print(f"  Time Efficiency: {routes.get('time_efficiency', 'N/A')}")
            
            # Tracking
            tracking = data.get('tracking_monitoring', {})
            print(f"\n📍 Tracking & Monitoring:")
            print(f"  Delivery Success: {tracking.get('delivery_success', 'N/A')}")
            print(f"  Real-time Tracking: {tracking.get('real_time_tracking', 'N/A')}")
            print(f"  Quality Maintained: {tracking.get('quality_maintained', 'N/A')}")
            
            # Providers and vehicles
            providers = data.get('logistics_providers', [])
            vehicles = data.get('vehicles', [])
            
            print(f"\n📋 Data Summary:")
            print(f"  Logistics Providers: {len(providers)}")
            print(f"  Vehicles in System: {len(vehicles)}")
            
            if providers:
                print(f"\n📦 Sample Provider:")
                provider = providers[0]
                print(f"  Name: {provider.get('name', 'N/A')}")
                print(f"  Type: {provider.get('type', 'N/A')}")
                print(f"  Rating: {provider.get('rating', 'N/A')}")
                print(f"  Price: {provider.get('price_per_km', 'N/A')}")
            
            print(f"\n✅ Transport endpoint is working perfectly!")
            return True
            
        else:
            print(f"❌ Transport endpoint failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("⚠️ Backend server is not running (http://localhost:8000)")
        print("To test the endpoint:")
        print("1. Start the backend: cd Backend && python -m uvicorn app.main:app --reload")
        print("2. Then run this test again")
        return False
    except Exception as e:
        print(f"❌ Error testing transport endpoint: {e}")
        return False

if __name__ == "__main__":
    test_transport_endpoint()