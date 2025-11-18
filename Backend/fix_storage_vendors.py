"""
Fix storage locations by assigning vendors to all locations
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.connections.postgres_connection import get_db
from app.schemas import postgres_base as models
from uuid import UUID

def fix_locations():
    """Assign vendors to storage locations"""
    db = next(get_db())
    
    try:
        # Get or create vendors
        vendor = db.query(models.Vendor).filter(
            models.Vendor.id == UUID("f5e93a44-8592-40b8-b72a-126278dc6135")
        ).first()
        
        if not vendor:
            print("❌ Vendor not found. Creating new vendor...")
            vendor = models.Vendor(
                business_name="Premium Storage Solutions",
                owner_name="Srinivas Reddy",
                phone="+91-9876543210",
                email="info@premiumstorage.com",
                gst_number="36ABCDE5678F1Z9",
                storage_capacity_kg=50000,
                cold_storage=True,
                dry_storage=True,
                status="ACTIVE"
            )
            db.add(vendor)
            db.flush()
        
        print(f"✅ Using vendor: {vendor.business_name} (ID: {vendor.id})")
        
        # Get all locations without vendors
        locations_without_vendor = db.query(models.StorageLocation).filter(
            models.StorageLocation.vendor_id == None
        ).all()
        
        print(f"\n📍 Found {len(locations_without_vendor)} locations without vendors")
        
        # Assign vendor to each location
        for loc in locations_without_vendor:
            loc.vendor_id = vendor.id
            print(f"   ✅ Assigned vendor to: {loc.name}")
        
        db.commit()
        
        print(f"\n✅ Successfully assigned vendors to all locations!")
        
        # Verify
        print("\n📋 Final Status:")
        all_locations = db.query(models.StorageLocation).all()
        for loc in all_locations:
            status = "✅" if loc.vendor_id else "❌"
            vendor_name = loc.vendor.business_name if loc.vendor else "NO VENDOR"
            print(f"{status} {loc.name} → {vendor_name}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    fix_locations()
