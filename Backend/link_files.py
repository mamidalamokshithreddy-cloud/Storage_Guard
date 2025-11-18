#!/usr/bin/env python3
"""
Script to manually link existing uploaded files to database records for testing
This simulates what should happen when users upload documents through the proper endpoints
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.connections.postgres_connection import get_db
from app.schemas.postgres_base import Farmer, Landowner, Vendor, Buyer

def link_files_to_records():
    """Link existing uploaded files to database records"""
    db = next(get_db())
    
    try:
        # Get uploaded files
        farmers_files = os.listdir("uploads/farmers") if os.path.exists("uploads/farmers") else []
        landowners_files = os.listdir("uploads/landowners") if os.path.exists("uploads/landowners") else []
        vendors_files = os.listdir("uploads/vendors") if os.path.exists("uploads/vendors") else []
        buyers_files = os.listdir("uploads/buyers") if os.path.exists("uploads/buyers") else []
        
        print(f"Found {len(farmers_files)} farmer files")
        print(f"Found {len(landowners_files)} landowner files") 
        print(f"Found {len(vendors_files)} vendor files")
        print(f"Found {len(buyers_files)} buyer files")
        
        # Update farmers
        farmers = db.query(Farmer).all()
        for i, farmer in enumerate(farmers):
            if i * 2 < len(farmers_files):
                photo_filename = farmers_files[i * 2] if i * 2 < len(farmers_files) else None
                aadhar_filename = farmers_files[i * 2 + 1] if (i * 2 + 1) < len(farmers_files) else None
                
                if photo_filename:
                    farmer.photo_url = f"/uploads/farmers/{photo_filename}"
                if aadhar_filename:
                    farmer.aadhar_front_url = f"/uploads/farmers/{aadhar_filename}"
                farmer.aadhar_number = "123456789012"  # Sample Aadhar number
                print(f"Updated farmer {farmer.full_name} with photo: {photo_filename}, aadhar: {aadhar_filename}")
        
        # Update landowners
        landowners = db.query(Landowner).all()
        for i, landowner in enumerate(landowners):
            if i * 2 < len(landowners_files):
                photo_filename = landowners_files[i * 2] if i * 2 < len(landowners_files) else None
                aadhar_filename = landowners_files[i * 2 + 1] if (i * 2 + 1) < len(landowners_files) else None
                
                if photo_filename:
                    landowner.photo_url = f"/uploads/landowners/{photo_filename}"
                if aadhar_filename:
                    landowner.aadhar_front_url = f"/uploads/landowners/{aadhar_filename}"
                landowner.aadhar_number = "123456789013"  # Sample Aadhar number
                print(f"Updated landowner {landowner.full_name} with photo: {photo_filename}, aadhar: {aadhar_filename}")
        
        # Update vendors
        vendors = db.query(Vendor).all()
        for i, vendor in enumerate(vendors):
            if i * 2 < len(vendors_files):
                photo_filename = vendors_files[i * 2] if i * 2 < len(vendors_files) else None
                aadhar_filename = vendors_files[i * 2 + 1] if (i * 2 + 1) < len(vendors_files) else None
                
                if photo_filename:
                    vendor.photo_url = f"/uploads/vendors/{photo_filename}"
                if aadhar_filename:
                    vendor.aadhar_front_url = f"/uploads/vendors/{aadhar_filename}"
                vendor.aadhar_number = "123456789014"  # Sample Aadhar number
                print(f"Updated vendor {vendor.full_name} with photo: {photo_filename}, aadhar: {aadhar_filename}")
                
        # Update buyers
        buyers = db.query(Buyer).all()
        for i, buyer in enumerate(buyers):
            if i * 2 < len(buyers_files):
                photo_filename = buyers_files[i * 2] if i * 2 < len(buyers_files) else None
                aadhar_filename = buyers_files[i * 2 + 1] if (i * 2 + 1) < len(buyers_files) else None
                
                if photo_filename:
                    buyer.photo_url = f"/uploads/buyers/{photo_filename}"
                if aadhar_filename:
                    buyer.aadhar_front_url = f"/uploads/buyers/{aadhar_filename}"
                buyer.aadhar_number = "123456789015"  # Sample Aadhar number
                print(f"Updated buyer {buyer.full_name} with photo: {photo_filename}, aadhar: {aadhar_filename}")
        
        # Commit changes
        db.commit()
        print("✅ Successfully linked files to database records")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    link_files_to_records()