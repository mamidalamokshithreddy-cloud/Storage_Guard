#!/usr/bin/env python3
"""
Create sample RFQs, jobs, and other test data for Storage Guard
This script creates realistic storage-related RFQs and jobs for testing
"""
import os
import sys
from pathlib import Path
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from decimal import Decimal

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.connections.postgres_connection import get_db
from app.schemas.postgres_base import StorageRFQ, StorageJob, StorageBid

def create_storage_test_data():
    """Create sample RFQs and Jobs for Storage Guard testing"""
    
    db = next(get_db())
    
    try:
        print("🗂️ Creating Storage Guard Test Data...")
        
        # Test user IDs (created by previous script)
        farmer_id = UUID("11111111-1111-1111-1111-111111111111")
        vendor1_id = UUID("22222222-2222-2222-2222-222222222222")  # Cold Storage
        vendor2_id = UUID("33333333-3333-3333-3333-333333333333")  # Dry Storage
        landowner_id = UUID("44444444-4444-4444-4444-444444444444")
        
        # 1. Create Storage RFQs
        rfqs = [
            StorageRFQ(
                id=UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                requester_id=farmer_id,
                crop="Tomatoes",
                quantity_kg=500,
                storage_type="COLD",
                duration_days=15,
                max_budget=Decimal("5000"),
                origin_lat=17.3850,  # Hyderabad coordinates
                origin_lon=78.4867,
                status="OPEN",
                created_at=datetime.now() - timedelta(hours=2)
            ),
            StorageRFQ(
                id=UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                requester_id=farmer_id,
                crop="Wheat",
                quantity_kg=2000,
                storage_type="DRY",
                duration_days=90,
                max_budget=Decimal("15000"),
                origin_lat=17.4399,  # Secunderabad coordinates
                origin_lon=78.4983,
                status="BIDDING",
                created_at=datetime.now() - timedelta(hours=6)
            ),
            StorageRFQ(
                id=UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                requester_id=farmer_id,
                crop="Potato",
                quantity_kg=1000,
                storage_type="COLD",
                duration_days=45,
                max_budget=Decimal("10000"),
                origin_lat=17.3616,  # Rangareddy coordinates
                origin_lon=78.4747,
                status="AWARDED",
                created_at=datetime.now() - timedelta(days=1)
            )
        ]
        
        # Add RFQs to database
        for rfq in rfqs:
            db.add(rfq)
        
        print(f"✅ Created {len(rfqs)} Storage RFQs")
        
        print(f"✅ Created {len(rfqs)} Storage RFQs")
        
        # Commit all test data
        db.commit()
        
        print("\n🎉 Storage Guard Test Data Created Successfully!")
        print("\n📊 Test Data Summary:")
        print("=" * 50)
        print(f"📋 RFQs Created: {len(rfqs)}")
        print(f"   • Open: 1 (Tomato Cold Storage)")
        print(f"   • Bidding: 1 (Wheat Dry Storage)")  
        print(f"   • Awarded: 1 (Potato Cold Storage)")
        
        print("\n🔗 Test Data IDs for Reference:")
        print("=" * 50)
        print("RFQs:")
        print(f"   • Tomato Cold Storage: {rfqs[0].id}")
        print(f"   • Wheat Dry Storage: {rfqs[1].id}")
        print(f"   • Potato Cold Storage: {rfqs[2].id}")
        
        return {
            "rfqs": [str(rfq.id) for rfq in rfqs]
        }
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    try:
        data_ids = create_storage_test_data()
        print(f"\n✨ All Storage Guard test data ready for frontend testing!")
    except Exception as e:
        print(f"\nFailed to create test data: {e}")
        sys.exit(1)