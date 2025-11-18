"""
Create test storage locations with valid coordinates for Hyderabad area
"""
import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from app.schemas.postgres_base import Base, StorageLocation
from app.connections.postgres_connection import get_db

# Get database session
db = next(get_db())

# Test storage locations around Hyderabad
test_locations = [
    {
        "name": "Hyderabad Cold Storage Center",
        "type": "Cold Storage",
        "address": "Gachibowli, Hyderabad, Telangana 500032",
        "lat": 17.4400,
        "lon": 78.3489,
        "capacity_text": "500 MT",
        "price_text": "₹5000/month/MT",
        "phone": "+91-9876543210",
        "hours": "24/7 Operations",
        "facilities": ["Temperature Control", "24/7 Security", "CCTV", "Loading Dock"]
    },
    {
        "name": "Secunderabad Grain Storage",
        "type": "Dry Storage",
        "address": "Secunderabad, Hyderabad, Telangana 500003",
        "lat": 17.4399,
        "lon": 78.4983,
        "capacity_text": "1000 MT",
        "price_text": "₹2500/month/MT",
        "phone": "+91-9876543211",
        "hours": "6 AM - 10 PM",
        "facilities": ["Pest Control", "Fumigation", "Quality Testing", "Insurance Available"]
    },
    {
        "name": "Kondapur Multi-Commodity Storage",
        "type": "Multi-Purpose",
        "address": "Kondapur, Hyderabad, Telangana 500084",
        "lat": 17.4646,
        "lon": 78.3649,
        "capacity_text": "750 MT",
        "price_text": "₹3500/month/MT",
        "phone": "+91-9876543212",
        "hours": "24/7 Operations",
        "facilities": ["Cold Storage", "Dry Storage", "Processing Unit", "Transport Available"]
    },
    {
        "name": "Shamshabad Agricultural Warehouse",
        "type": "Warehouse",
        "address": "Shamshabad, Hyderabad, Telangana 501218",
        "lat": 17.2403,
        "lon": 78.4294,
        "capacity_text": "2000 MT",
        "price_text": "₹2000/month/MT",
        "phone": "+91-9876543213",
        "hours": "7 AM - 9 PM",
        "facilities": ["Large Capacity", "Rail Access", "Truck Loading", "Covered Storage"]
    },
    {
        "name": "Kukatpally Fresh Produce Hub",
        "type": "Cold Storage",
        "address": "Kukatpally, Hyderabad, Telangana 500072",
        "lat": 17.4948,
        "lon": 78.4138,
        "capacity_text": "300 MT",
        "price_text": "₹6000/month/MT",
        "phone": "+91-9876543214",
        "hours": "24/7 Operations",
        "facilities": ["Ultra Cold Storage", "Pre-cooling", "Ripening Chambers", "Quality Lab"]
    }
]

try:
    print("Creating test storage locations...")
    
    for loc_data in test_locations:
        # Check if location already exists
        existing = db.query(StorageLocation).filter(
            StorageLocation.name == loc_data["name"]
        ).first()
        
        if existing:
            print(f"SKIP: Location already exists: {loc_data['name']}")
            continue
        
        location = StorageLocation(
            id=uuid.uuid4(),
            vendor_id=None,  # Set to None or link to existing vendor
            name=loc_data["name"],
            type=loc_data["type"],
            address=loc_data["address"],
            lat=loc_data["lat"],
            lon=loc_data["lon"],
            capacity_text=loc_data["capacity_text"],
            price_text=loc_data["price_text"],
            rating=4.5,
            phone=loc_data["phone"],
            hours=loc_data["hours"],
            facilities=loc_data["facilities"]
        )
        
        db.add(location)
        print(f"CREATED: {loc_data['name']} at ({loc_data['lat']}, {loc_data['lon']})")
    
    db.commit()
    print("\nSuccessfully created test storage locations!")
    print(f"Total locations: {db.query(StorageLocation).count()}")
    
except Exception as e:
    print(f"ERROR: {e}")
    db.rollback()
finally:
    db.close()
