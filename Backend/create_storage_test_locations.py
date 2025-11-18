"""
Create test storage locations for testing booking and certificate system
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.connections.postgres_connection import get_db
from app.schemas import postgres_base as models
from uuid import uuid4
from datetime import datetime

def create_test_locations():
    """Create test storage locations and vendors"""
    db = next(get_db())
    
    try:
        # Check if locations already exist
        existing = db.query(models.StorageLocation).count()
        if existing > 0:
            print(f"✅ {existing} storage location(s) already exist")
            
            # Show existing locations
            locations = db.query(models.StorageLocation).limit(5).all()
            for loc in locations:
                print(f"   - {loc.name} (ID: {loc.id})")
            return
        
        print("Creating test storage locations...")
        
        # Create test vendors first
        vendors = []
        
        vendor1 = models.Vendor(
            id=uuid4(),
            business_name="Premium Cold Storage Pvt Ltd",
            business_type="cold_storage",
            contact_person="Ramesh Kumar",
            phone="+91 9876543210",
            email="ramesh@premiumstorage.com",
            address="Gachibowli, Hyderabad, Telangana",
            city="Hyderabad",
            state="Telangana",
            pincode="500032",
            gstin="36AAACP1234A1Z5",
            registration_date=datetime.utcnow(),
            verification_status="verified",
            is_active=True
        )
        vendors.append(vendor1)
        
        vendor2 = models.Vendor(
            id=uuid4(),
            business_name="Green Valley Warehousing",
            business_type="warehouse",
            contact_person="Suresh Reddy",
            phone="+91 9876543211",
            email="suresh@greenvalley.com",
            address="Kukatpally, Hyderabad, Telangana",
            city="Hyderabad",
            state="Telangana",
            pincode="500072",
            gstin="36BBBCP5678B2Z6",
            registration_date=datetime.utcnow(),
            verification_status="verified",
            is_active=True
        )
        vendors.append(vendor2)
        
        db.add_all(vendors)
        db.flush()
        
        print(f"✅ Created {len(vendors)} test vendors")
        
        # Create storage locations
        locations = []
        
        location1 = models.StorageLocation(
            id=uuid4(),
            vendor_id=vendor1.id,
            name="Hyderabad Premium Cold Storage - Unit 1",
            type="cold_storage",
            address="Plot No. 123, Gachibowli, Hyderabad",
            city="Hyderabad",
            state="Telangana",
            pincode="500032",
            latitude=17.4400,
            longitude=78.3489,
            capacity_kg=500000,  # 500 tons
            available_capacity_kg=450000,
            temperature_min=2.0,
            temperature_max=8.0,
            humidity_min=60.0,
            humidity_max=80.0,
            price_per_kg_per_day=5.0,
            facilities=["temperature_controlled", "24x7_monitoring", "iot_sensors", "pest_control"],
            certifications=["fssai", "iso22000", "haccp"],
            is_active=True,
            created_at=datetime.utcnow()
        )
        locations.append(location1)
        
        location2 = models.StorageLocation(
            id=uuid4(),
            vendor_id=vendor2.id,
            name="Green Valley Dry Storage Warehouse",
            type="warehouse",
            address="Survey No. 456, Kukatpally, Hyderabad",
            city="Hyderabad",
            state="Telangana",
            pincode="500072",
            latitude=17.4947,
            longitude=78.3997,
            capacity_kg=1000000,  # 1000 tons
            available_capacity_kg=800000,
            temperature_min=15.0,
            temperature_max=30.0,
            humidity_min=40.0,
            humidity_max=60.0,
            price_per_kg_per_day=2.5,
            facilities=["dry_storage", "ventilation", "security", "loading_dock"],
            certifications=["fssai"],
            is_active=True,
            created_at=datetime.utcnow()
        )
        locations.append(location2)
        
        location3 = models.StorageLocation(
            id=uuid4(),
            vendor_id=vendor1.id,
            name="Hyderabad Premium Cold Storage - Unit 2",
            type="cold_storage",
            address="Plot No. 789, Madhapur, Hyderabad",
            city="Hyderabad",
            state="Telangana",
            pincode="500081",
            latitude=17.4485,
            longitude=78.3908,
            capacity_kg=300000,  # 300 tons
            available_capacity_kg=250000,
            temperature_min=0.0,
            temperature_max=5.0,
            humidity_min=65.0,
            humidity_max=75.0,
            price_per_kg_per_day=6.0,
            facilities=["ultra_cold_storage", "24x7_monitoring", "backup_power", "iot_sensors"],
            certifications=["fssai", "iso22000", "haccp", "organic"],
            is_active=True,
            created_at=datetime.utcnow()
        )
        locations.append(location3)
        
        db.add_all(locations)
        db.commit()
        
        print(f"✅ Created {len(locations)} test storage locations:")
        for loc in locations:
            print(f"   - {loc.name}")
            print(f"     ID: {loc.id}")
            print(f"     Type: {loc.type}")
            print(f"     Capacity: {loc.capacity_kg:,} kg")
            print(f"     Price: ₹{loc.price_per_kg_per_day}/kg/day")
            print()
        
        print("✅ Test data creation complete!")
        print("\n🎉 You can now create bookings using the Quick Book Storage button!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_locations()
