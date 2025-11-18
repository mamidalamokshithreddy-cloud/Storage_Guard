#!/usr/bin/env python3
"""
Create test users specifically for Storage Guard functionality
This will create farmers, vendors, and other users needed for testing
"""
import os
import sys
from pathlib import Path
from uuid import uuid4
from datetime import datetime

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.connections.postgres_connection import get_db
from app.schemas.postgres_base import User, Farmer, Vendor, Landowner, UserRole
from app.services.auth_service import AuthService

def create_storage_test_users():
    """Create test users for Storage Guard functionality"""
    db = next(get_db())
    auth_service = AuthService()
    
    try:
        print("🌾 Creating Storage Guard Test Users...")
        
        # Test IDs for consistent referencing
        from uuid import UUID
        test_farmer_id = UUID("11111111-1111-1111-1111-111111111111")
        test_vendor1_id = UUID("22222222-2222-2222-2222-222222222222")
        test_vendor2_id = UUID("33333333-3333-3333-3333-333333333333")
        test_landowner_id = UUID("44444444-4444-4444-4444-444444444444")
        
        # 1. Create Test Farmer (Storage Requester)
        farmer_user = User(
            id=test_farmer_id,
            email="farmer.storage@test.com",
            full_name="Ravi Kumar",
            phone="9876543210",
            role=UserRole.farmer.value,
            is_active=True,
            is_verified=True,
            password_hash=auth_service.get_password_hash("password123")
        )
        
        farmer_profile = Farmer(
            id=test_farmer_id,
            user_id=test_farmer_id,
            full_name="Ravi Kumar",
            email="farmer.storage@test.com",
            phone="9876543210",
            address_line1="Village Rampur",
            city="Hyderabad", 
            state="Telangana",
            aadhar_number="123456789012",
            farm_size=5.5,
            mandal="Rangareddy"
        )
        
        db.add(farmer_user)
        db.add(farmer_profile)
        print(f"✅ Created Farmer: {farmer_user.full_name} (ID: {test_farmer_id})")
        
        # 2. Create Test Vendor 1 (Cold Storage Provider)
        vendor1_user = User(
            id=test_vendor1_id,
            email="coldstorage.vendor@test.com",
            full_name="ColdChain Solutions Pvt Ltd",
            phone="8765432109",
            role=UserRole.vendor.value,
            is_active=True,
            is_verified=True,
            password_hash=auth_service.get_password_hash("vendor123")
        )
        
        vendor1_profile = Vendor(
            id=test_vendor1_id,
            user_id=test_vendor1_id,
            full_name="ColdChain Solutions Pvt Ltd",
            business_name="ColdChain Solutions",
            legal_name="ColdChain Solutions Pvt Ltd",
            email="coldstorage.vendor@test.com",
            phone="8765432109",
            address_line1="Industrial Area",
            city="Hyderabad",
            state="Telangana",
            product_services="Cold Storage, Temperature Monitoring, Quality Testing",
            rating_avg=4.8,
            rating_count=156,
            gstin="36ABCDE1234F1Z5"
        )
        
        db.add(vendor1_user)
        db.add(vendor1_profile)
        print(f"✅ Created Vendor 1: {vendor1_profile.business_name} (ID: {test_vendor1_id})")
        
        # 3. Create Test Vendor 2 (Dry Storage + Logistics)
        vendor2_user = User(
            id=test_vendor2_id,
            email="drystorage.vendor@test.com",
            full_name="AgriStore & Logistics Hub",
            phone="7654321098",
            role=UserRole.vendor.value,
            is_active=True,
            is_verified=True,
            password_hash=auth_service.get_password_hash("vendor456")
        )
        
        vendor2_profile = Vendor(
            id=test_vendor2_id,
            user_id=test_vendor2_id,
            full_name="AgriStore & Logistics Hub Pvt Ltd",
            business_name="AgriStore & Logistics",
            legal_name="AgriStore & Logistics Hub Pvt Ltd",
            email="drystorage.vendor@test.com",
            phone="7654321098",
            address_line1="Grain Market",
            city="Secunderabad",
            state="Telangana",
            product_services="Dry Storage, Grain Warehousing, Transportation, Fumigation",
            rating_avg=4.6,
            rating_count=89,
            gstin="36FGHIJ5678K1L2"
        )
        
        db.add(vendor2_user)
        db.add(vendor2_profile)
        print(f"✅ Created Vendor 2: {vendor2_profile.business_name} (ID: {test_vendor2_id})")
        
        # 4. Create Test Landowner (for job awards)
        landowner_user = User(
            id=test_landowner_id,
            email="landowner.storage@test.com",
            full_name="Sita Devi",
            phone="6543210987",
            role=UserRole.landowner.value,
            is_active=True,
            is_verified=True,
            password_hash=auth_service.get_password_hash("landowner123")
        )
        
        landowner_profile = Landowner(
            id=test_landowner_id,
            user_id=test_landowner_id,
            full_name="Sita Devi",
            email="landowner.storage@test.com",
            phone="6543210987",
            address_line1="Village Kondapur",
            city="Hyderabad",
            state="Telangana",
            aadhar_number="987654321098",
            total_land_area=25.0,
            current_land_use="Mixed Farming and Storage",
            mandal="Serilingampally"
        )
        
        db.add(landowner_user)
        db.add(landowner_profile)
        print(f"✅ Created Landowner: {landowner_user.full_name} (ID: {test_landowner_id})")
        
        # Commit all users
        db.commit()
        
        print("\n🎉 Storage Guard Test Users Created Successfully!")
        print("\n📋 Test User Credentials:")
        print("=" * 50)
        print(f"👨‍🌾 Farmer (Storage Requester):")
        print(f"   Email: farmer.storage@test.com")
        print(f"   Password: password123")
        print(f"   ID: {test_farmer_id}")
        print()
        print(f"🏭 Cold Storage Vendor:")
        print(f"   Email: coldstorage.vendor@test.com")
        print(f"   Password: vendor123") 
        print(f"   ID: {test_vendor1_id}")
        print()
        print(f"🏬 Dry Storage Vendor:")
        print(f"   Email: drystorage.vendor@test.com")
        print(f"   Password: vendor456")
        print(f"   ID: {test_vendor2_id}")
        print()
        print(f"🏞️ Landowner:")
        print(f"   Email: landowner.storage@test.com")
        print(f"   Password: landowner123")
        print(f"   ID: {test_landowner_id}")
        print("=" * 50)
        print("\n✨ Ready to test Storage Guard workflows!")
        
        return {
            "farmer_id": test_farmer_id,
            "vendor1_id": test_vendor1_id,
            "vendor2_id": test_vendor2_id,
            "landowner_id": test_landowner_id
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test users: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    user_ids = create_storage_test_users()
    print(f"\n🔧 Use these IDs for API testing:")
    for role, user_id in user_ids.items():
        print(f"   {role}: {user_id}")