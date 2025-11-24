"""
Complete Storage Guard Flow Testing Script
Tests all database tables and verifies data integrity
"""

from sqlalchemy import create_engine, inspect, func
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.schemas import postgres_base as models
from datetime import datetime

# Database connection
engine = create_engine(f'postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}')
Session = sessionmaker(bind=engine)
db = Session()
inspector = inspect(engine)

print("=" * 80)
print("STORAGE GUARD - COMPLETE FLOW TEST")
print("=" * 80)

# 1. Check if all required tables exist
print("\n1. DATABASE TABLES CHECK")
print("-" * 80)
storage_tables = [
    'users', 'storage_locations', 'storage_bookings', 'crop_inspections',
    'storage_rfqs', 'booking_payments', 'compliance_certificates',
    'scheduled_inspections', 'transport_bookings'
]

all_tables = inspector.get_table_names()
for table in storage_tables:
    status = "✅ EXISTS" if table in all_tables else "❌ MISSING"
    print(f"  {table:30} {status}")

# 2. Check users and roles
print("\n2. USER AUTHENTICATION DATA")
print("-" * 80)
total_users = db.query(func.count(models.User.id)).scalar()
farmers = db.query(func.count(models.User.id)).filter(models.User.role == 'farmer').scalar()
vendors = db.query(func.count(models.User.id)).filter(models.User.role == 'vendor').scalar()
admins = db.query(func.count(models.User.id)).filter(models.User.role == 'admin').scalar()

print(f"  Total Users: {total_users}")
print(f"  Farmers: {farmers}")
print(f"  Vendors: {vendors}")
print(f"  Admins: {admins}")

# Sample farmer
sample_farmer = db.query(models.User).filter(models.User.role == 'farmer').first()
if sample_farmer:
    print(f"\n  Sample Farmer:")
    print(f"    Name: {sample_farmer.full_name}")
    print(f"    Email: {sample_farmer.email}")
    print(f"    ID: {sample_farmer.id}")

# 3. Check crop inspections (AI analysis)
print("\n3. CROP INSPECTIONS (AI ANALYSIS)")
print("-" * 80)
total_inspections = db.query(func.count(models.CropInspection.id)).scalar()
print(f"  Total Inspections: {total_inspections}")

if total_inspections > 0:
    recent = db.query(models.CropInspection).order_by(models.CropInspection.created_at.desc()).first()
    print(f"\n  Most Recent Inspection:")
    print(f"    Crop: {recent.crop_detected}")
    print(f"    Grade: {recent.grade}")
    print(f"    Shelf Life: {recent.shelf_life_days} days")
    print(f"    Freshness: {recent.freshness}")
    print(f"    Image URLs: {recent.image_urls}")
    print(f"    Defects: {len(recent.defects) if recent.defects else 0}")

# 4. Check storage locations
print("\n4. STORAGE LOCATIONS")
print("-" * 80)
total_locations = db.query(func.count(models.StorageLocation.id)).scalar()
cold_storage = db.query(func.count(models.StorageLocation.id)).filter(
    models.StorageLocation.type.in_(['cold_storage', 'cold'])
).scalar()
dry_storage = db.query(func.count(models.StorageLocation.id)).filter(
    models.StorageLocation.type.in_(['dry_storage', 'warehouse', 'dry'])
).scalar()

print(f"  Total Locations: {total_locations}")
print(f"  Cold Storage: {cold_storage}")
print(f"  Dry Storage: {dry_storage}")

# 5. Check RFQs
print("\n5. STORAGE RFQs (REQUEST FOR QUOTES)")
print("-" * 80)
total_rfqs = db.query(func.count(models.StorageRFQ.id)).scalar()
open_rfqs = db.query(func.count(models.StorageRFQ.id)).filter(
    models.StorageRFQ.status == 'open'
).scalar()

print(f"  Total RFQs: {total_rfqs}")
print(f"  Open RFQs: {open_rfqs}")

if total_rfqs > 0:
    recent_rfq = db.query(models.StorageRFQ).order_by(models.StorageRFQ.created_at.desc()).first()
    print(f"\n  Most Recent RFQ:")
    print(f"    Crop: {recent_rfq.crop}")
    print(f"    Quantity: {recent_rfq.quantity_kg} kg")
    print(f"    Duration: {recent_rfq.duration_days} days")
    print(f"    Budget: ₹{recent_rfq.max_budget}")
    print(f"    Status: {recent_rfq.status}")

# 6. Check bookings
print("\n6. STORAGE BOOKINGS")
print("-" * 80)
total_bookings = db.query(func.count(models.StorageBooking.id)).scalar()
pending = db.query(func.count(models.StorageBooking.id)).filter(
    models.StorageBooking.booking_status == 'PENDING'
).scalar()
confirmed = db.query(func.count(models.StorageBooking.id)).filter(
    models.StorageBooking.booking_status == 'CONFIRMED'
).scalar()
completed = db.query(func.count(models.StorageBooking.id)).filter(
    models.StorageBooking.booking_status == 'COMPLETED'
).scalar()

print(f"  Total Bookings: {total_bookings}")
print(f"  Pending: {pending}")
print(f"  Confirmed: {confirmed}")
print(f"  Completed: {completed}")

if total_bookings > 0:
    recent_booking = db.query(models.StorageBooking).order_by(
        models.StorageBooking.created_at.desc()
    ).first()
    print(f"\n  Most Recent Booking:")
    print(f"    Crop: {recent_booking.crop_type}")
    print(f"    Quantity: {recent_booking.quantity_kg} kg")
    print(f"    Duration: {recent_booking.duration_days} days")
    print(f"    Status: {recent_booking.booking_status}")
    print(f"    Price: ₹{recent_booking.price_per_day}/day")
    print(f"    Has AI Inspection: {'Yes' if recent_booking.ai_inspection_id else 'No'}")

# 7. Check payments
print("\n7. BOOKING PAYMENTS")
print("-" * 80)
total_payments = db.query(func.count(models.BookingPayment.id)).scalar()
paid = db.query(func.count(models.BookingPayment.id)).filter(
    models.BookingPayment.payment_status == 'paid'
).scalar()
pending_payments = db.query(func.count(models.BookingPayment.id)).filter(
    models.BookingPayment.payment_status == 'pending'
).scalar()

print(f"  Total Payment Records: {total_payments}")
print(f"  Paid: {paid}")
print(f"  Pending: {pending_payments}")

if total_payments > 0:
    total_amount = db.query(func.sum(models.BookingPayment.total_amount)).scalar() or 0
    print(f"  Total Amount: ₹{total_amount:.2f}")

# 8. Check certificates
print("\n8. COMPLIANCE CERTIFICATES")
print("-" * 80)
total_certificates = db.query(func.count(models.ComplianceCertificate.id)).scalar()
verified = db.query(func.count(models.ComplianceCertificate.id)).filter(
    models.ComplianceCertificate.status == 'verified'
).scalar()

print(f"  Total Certificates: {total_certificates}")
print(f"  Verified: {verified}")

if total_certificates > 0:
    recent_cert = db.query(models.ComplianceCertificate).order_by(
        models.ComplianceCertificate.created_at.desc()
    ).first()
    print(f"\n  Most Recent Certificate:")
    print(f"    Number: {recent_cert.certificate_number}")
    print(f"    Type: {recent_cert.certificate_type}")
    print(f"    Status: {recent_cert.status}")
    print(f"    Score: {recent_cert.score}")
    print(f"    Has QR Code: {'Yes' if recent_cert.qr_code_url else 'No'}")

# 9. Check scheduled inspections
print("\n9. SCHEDULED INSPECTIONS")
print("-" * 80)
total_scheduled = db.query(func.count(models.ScheduledInspection.id)).scalar()
pending_scheduled = db.query(func.count(models.ScheduledInspection.id)).filter(
    models.ScheduledInspection.status == 'pending'
).scalar()
confirmed_scheduled = db.query(func.count(models.ScheduledInspection.id)).filter(
    models.ScheduledInspection.status == 'confirmed'
).scalar()
completed_scheduled = db.query(func.count(models.ScheduledInspection.id)).filter(
    models.ScheduledInspection.status == 'completed'
).scalar()

print(f"  Total Scheduled Inspections: {total_scheduled}")
print(f"  Pending: {pending_scheduled}")
print(f"  Confirmed: {confirmed_scheduled}")
print(f"  Completed: {completed_scheduled}")

if total_scheduled > 0:
    recent_inspection = db.query(models.ScheduledInspection).order_by(
        models.ScheduledInspection.created_at.desc()
    ).first()
    print(f"\n  Most Recent Scheduled Inspection:")
    print(f"    Type: {recent_inspection.inspection_type}")
    print(f"    Crop: {recent_inspection.crop_type}")
    print(f"    Quantity: {recent_inspection.quantity_kg} kg")
    print(f"    Status: {recent_inspection.status}")
    print(f"    Requested Date: {recent_inspection.requested_date}")
    print(f"    Vendor Assigned: {'Yes' if recent_inspection.vendor_id else 'No'}")

# 10. Check transport bookings
print("\n10. TRANSPORT BOOKINGS")
print("-" * 80)
total_transport = db.query(func.count(models.TransportBooking.id)).scalar()
print(f"  Total Transport Bookings: {total_transport}")

# Final Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ Total Users: {total_users} (Farmers: {farmers}, Vendors: {vendors})")
print(f"✅ Total Inspections: {total_inspections}")
print(f"✅ Total Locations: {total_locations}")
print(f"✅ Total RFQs: {total_rfqs}")
print(f"✅ Total Bookings: {total_bookings} (Pending: {pending}, Confirmed: {confirmed}, Completed: {completed})")
print(f"✅ Total Payments: {total_payments}")
print(f"✅ Total Certificates: {total_certificates}")
print(f"✅ Total Scheduled Inspections: {total_scheduled}")
print(f"✅ Total Transport Bookings: {total_transport}")

# Data integrity checks
print("\n" + "=" * 80)
print("DATA INTEGRITY CHECKS")
print("=" * 80)

# Check bookings with missing farmers
bookings_no_farmer = db.query(func.count(models.StorageBooking.id)).filter(
    models.StorageBooking.farmer_id == None
).scalar()
print(f"  Bookings without Farmer ID: {bookings_no_farmer} {'❌' if bookings_no_farmer > 0 else '✅'}")

# Check bookings with payments
bookings_with_payments = db.query(func.count(models.StorageBooking.id)).filter(
    models.StorageBooking.id.in_(
        db.query(models.BookingPayment.booking_id).distinct()
    )
).scalar() if total_payments > 0 else 0
print(f"  Bookings with Payment Records: {bookings_with_payments}/{total_bookings}")

# Check bookings with certificates
bookings_with_certs = db.query(func.count(models.StorageBooking.id)).filter(
    models.StorageBooking.id.in_(
        db.query(models.ComplianceCertificate.booking_id).distinct()
    )
).scalar() if total_certificates > 0 else 0
print(f"  Bookings with Certificates: {bookings_with_certs}/{completed}")

# Check inspections linked to bookings
inspections_linked = db.query(func.count(models.CropInspection.id)).filter(
    models.CropInspection.id.in_(
        db.query(models.StorageBooking.ai_inspection_id).filter(
            models.StorageBooking.ai_inspection_id != None
        )
    )
).scalar()
print(f"  Inspections Linked to Bookings: {inspections_linked}/{total_inspections}")

print("\n" + "=" * 80)
print("TEST COMPLETE!")
print("=" * 80)

db.close()
