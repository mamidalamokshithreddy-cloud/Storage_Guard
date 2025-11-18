"""
Check what storage locations exist in the database
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.connections.postgres_connection import get_db
from app.schemas import postgres_base as models

def check_locations():
    """Check storage locations in database"""
    db = next(get_db())
    
    try:
        # Count locations
        location_count = db.query(models.StorageLocation).count()
        print(f"\n📍 Total Storage Locations: {location_count}")
        
        if location_count == 0:
            print("\n❌ No storage locations found in database!")
            print("\n💡 Creating sample locations...")
            
            # Check if vendors exist
            vendor_count = db.query(models.Vendor).count()
            print(f"   Vendors in database: {vendor_count}")
            
            if vendor_count == 0:
                print("   ⚠️  No vendors found either. Creating vendor first...")
                
                # Create a vendor
                vendor = models.Vendor(
                    business_name="AgriCold Storage Pvt Ltd",
                    owner_name="Rajesh Sharma",
                    phone="+91-9876543210",
                    email="info@agricold.com",
                    gst_number="29ABCDE1234F1Z5",
                    storage_capacity_kg=100000,
                    cold_storage=True,
                    dry_storage=True,
                    status="ACTIVE"
                )
                db.add(vendor)
                db.flush()
                print(f"   ✅ Vendor created: {vendor.business_name} (ID: {vendor.id})")
            else:
                # Get first vendor
                vendor = db.query(models.Vendor).first()
                print(f"   ✅ Using existing vendor: {vendor.business_name} (ID: {vendor.id})")
            
            # Create 3 storage locations
            locations = [
                {
                    "name": "Hyderabad Cold Storage - Unit 1",
                    "type": "COLD_STORAGE",
                    "address": "Gachibowli, Hyderabad, Telangana 500032",
                    "lat": 17.4400,
                    "lon": 78.3487,
                    "capacity_text": "5000 MT",
                    "price_text": "₹500/quintal/month",
                    "rating": 4.5,
                    "facilities": ["temperature_controlled", "24x7_monitoring", "pest_control"]
                },
                {
                    "name": "Secunderabad Warehouse",
                    "type": "DRY_STORAGE",
                    "address": "Secunderabad, Telangana 500003",
                    "lat": 17.4399,
                    "lon": 78.4983,
                    "capacity_text": "3000 MT",
                    "price_text": "₹300/quintal/month",
                    "rating": 4.2,
                    "facilities": ["ventilated", "security", "loading_dock"]
                },
                {
                    "name": "Kukatpally Storage Facility",
                    "type": "MULTI_COMMODITY",
                    "address": "Kukatpally, Hyderabad, Telangana 500072",
                    "lat": 17.4849,
                    "lon": 78.4138,
                    "capacity_text": "10000 MT",
                    "price_text": "₹400/quintal/month",
                    "rating": 4.7,
                    "facilities": ["cold_storage", "dry_storage", "iot_enabled", "insurance"]
                }
            ]
            
            for loc_data in locations:
                location = models.StorageLocation(
                    vendor_id=vendor.id,
                    **loc_data
                )
                db.add(location)
                print(f"   ✅ Created: {loc_data['name']}")
            
            db.commit()
            print(f"\n✅ Successfully created {len(locations)} storage locations!")
            
        else:
            # Show existing locations
            print("\n📋 Existing Storage Locations:")
            locations = db.query(models.StorageLocation).all()
            
            for i, loc in enumerate(locations, 1):
                print(f"\n{i}. {loc.name}")
                print(f"   ID: {loc.id}")
                print(f"   Type: {loc.type}")
                print(f"   Address: {loc.address}")
                print(f"   Vendor ID: {loc.vendor_id}")
                
                if loc.vendor:
                    print(f"   Vendor: {loc.vendor.business_name}")
                else:
                    print(f"   ⚠️  Vendor: NOT ASSIGNED")
                
                print(f"   Capacity: {loc.capacity_text}")
                print(f"   Price: {loc.price_text}")
                print(f"   Rating: {loc.rating}⭐")
        
        print("\n" + "="*60)
        print("✅ Database check complete!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_locations()
