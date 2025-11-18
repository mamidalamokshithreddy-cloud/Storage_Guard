# Add Sample Transport Data for Demo

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.connections.postgres_connection import get_db
from app.schemas.postgres_base import LogisticsProvider, TransportVehicle, TransportRoute
import uuid
from datetime import datetime

def add_sample_transport_data():
    """Add realistic transport and logistics data for demo"""
    
    db = next(get_db())
    
    try:
        # 1. Add Logistics Providers (Transport Companies)
        providers = [
            {
                "name": "FreshMove Logistics", 
                "company_type": "logistics_company",
                "service_types": ["cold_transport", "refrigerated_delivery"],
                "rating": 4.8,
                "price_per_km": 25,
                "coverage_areas": ["Hyderabad", "Bangalore", "Chennai"],
                "facilities": ["GPS_tracking", "temperature_monitoring"],
                "verification_status": "verified"
            },
            {
                "name": "AgriTransport Hub",
                "company_type": "transport_service", 
                "service_types": ["dry_cargo", "bulk_transport"],
                "rating": 4.5,
                "price_per_km": 15,
                "coverage_areas": ["Telangana", "Andhra Pradesh"],
                "facilities": ["real_time_tracking", "insurance_covered"],
                "verification_status": "verified"
            },
            {
                "name": "ColdChain Express",
                "company_type": "specialized_logistics",
                "service_types": ["cold_storage_transport", "temperature_controlled"],
                "rating": 4.9,
                "price_per_km": 35,
                "coverage_areas": ["South India", "Maharashtra"],
                "facilities": ["multi_temperature_zones", "quality_certificates"],
                "verification_status": "verified"
            }
        ]
        
        provider_ids = []
        for provider_data in providers:
            provider = LogisticsProvider(
                id=uuid.uuid4(),
                **provider_data
            )
            db.add(provider)
            provider_ids.append(provider.id)
        
        # 2. Add Transport Vehicles (Fleet)
        vehicles = [
            # FreshMove Logistics Fleet
            {"vendor_id": provider_ids[0], "vehicle_type": "refrigerated_truck", "vehicle_number": "TS09AB1234", "capacity_kg": 5000, "driver_name": "Ravi Kumar", "status": "available", "fuel_efficiency": 12.5},
            {"vendor_id": provider_ids[0], "vehicle_type": "refrigerated_truck", "vehicle_number": "TS09AB5678", "capacity_kg": 3000, "driver_name": "Suresh Reddy", "status": "available", "fuel_efficiency": 14.0},
            {"vendor_id": provider_ids[0], "vehicle_type": "temperature_controlled", "vehicle_number": "TS09CD1234", "capacity_kg": 2000, "driver_name": "Krishnan", "status": "in_transit", "fuel_efficiency": 15.0},
            
            # AgriTransport Hub Fleet  
            {"vendor_id": provider_ids[1], "vehicle_type": "dry_cargo_truck", "vehicle_number": "AP09EF1234", "capacity_kg": 10000, "driver_name": "Venkat Rao", "status": "available", "fuel_efficiency": 10.0},
            {"vendor_id": provider_ids[1], "vehicle_type": "dry_cargo_truck", "vehicle_number": "AP09EF5678", "capacity_kg": 8000, "driver_name": "Mahesh", "status": "available", "fuel_efficiency": 11.5},
            {"vendor_id": provider_ids[1], "vehicle_type": "dry_cargo_truck", "vehicle_number": "AP09GH1234", "capacity_kg": 12000, "driver_name": "Ramesh", "status": "maintenance", "fuel_efficiency": 9.5},
            
            # ColdChain Express Fleet
            {"vendor_id": provider_ids[2], "vehicle_type": "refrigerated_truck", "vehicle_number": "KA09IJ1234", "capacity_kg": 4000, "driver_name": "Prakash", "status": "available", "fuel_efficiency": 13.0},
            {"vendor_id": provider_ids[2], "vehicle_type": "temperature_controlled", "vehicle_number": "KA09IJ5678", "capacity_kg": 2500, "driver_name": "Anand", "status": "available", "fuel_efficiency": 14.5},
        ]
        
        vehicle_ids = []
        for vehicle_data in vehicles:
            vehicle = TransportVehicle(
                id=uuid.uuid4(),
                **vehicle_data
            )
            db.add(vehicle)
            vehicle_ids.append(vehicle.id)
        
        # 3. Add Active Transport Routes
        routes = [
            {
                "vehicle_id": vehicle_ids[0],
                "start_location": "Cold Storage, Secunderabad", 
                "end_location": "Wholesale Market, Bangalore",
                "start_lat": 17.4432, "start_lon": 78.4482,
                "end_lat": 12.9716, "end_lon": 77.5946,
                "distance_km": 560,
                "estimated_time_hours": 10,
                "actual_time_hours": 9.5,
                "status": "completed",
                "created_at": datetime.utcnow()
            },
            {
                "vehicle_id": vehicle_ids[1], 
                "start_location": "Grain Storage, Warangal",
                "end_location": "Processing Unit, Chennai", 
                "start_lat": 18.0011, "start_lon": 79.5319,
                "end_lat": 13.0827, "end_lon": 80.2707,
                "distance_km": 440,
                "estimated_time_hours": 8,
                "status": "in_progress", 
                "created_at": datetime.utcnow()
            },
            {
                "vehicle_id": vehicle_ids[2],
                "start_location": "Farm Storage, Nizamabad",
                "end_location": "Export Terminal, Mumbai",
                "start_lat": 18.6725, "start_lon": 78.0941, 
                "end_lat": 19.0760, "end_lon": 72.8777,
                "distance_km": 650,
                "estimated_time_hours": 12,
                "status": "scheduled",
                "created_at": datetime.utcnow()
            }
        ]
        
        for route_data in routes:
            route = TransportRoute(
                id=uuid.uuid4(),
                **route_data
            )
            db.add(route)
        
        db.commit()
        
        print("✅ Sample transport data added successfully!")
        print(f"   - {len(providers)} Logistics Providers")
        print(f"   - {len(vehicles)} Transport Vehicles") 
        print(f"   - {len(routes)} Transport Routes")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error adding transport data: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    add_sample_transport_data()