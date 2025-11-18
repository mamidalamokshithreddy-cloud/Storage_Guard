"""
Test certificate generation with existing booking data
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.connections.postgres_connection import get_db
from app.services.certificate_service import CertificateService
from app.schemas import postgres_base as models
import asyncio

async def test_certificate_generation():
    """Test generating certificate for an existing booking"""
    
    db = next(get_db())
    
    try:
        # Find a completed or active booking with crop inspection
        booking = db.query(models.StorageBooking).filter(
            models.StorageBooking.booking_status.in_(["confirmed", "active", "completed"])
        ).first()
        
        if not booking:
            print("❌ No suitable bookings found for testing")
            print("Creating test booking...")
            # You can create test data here if needed
            return
        
        print(f"✅ Found booking: {booking.id}")
        print(f"   Crop: {booking.crop_type}")
        print(f"   Farmer: {booking.farmer.full_name if booking.farmer else 'Unknown'}")
        print(f"   Status: {booking.booking_status}")
        print(f"   Start: {booking.start_date}")
        print(f"   End: {booking.end_date}")
        
        # Check if certificate already exists
        existing_cert = db.query(models.StorageCertificate).filter(
            models.StorageCertificate.booking_id == booking.id
        ).first()
        
        if existing_cert:
            print(f"\n📜 Certificate already exists!")
            print(f"   Certificate Number: {existing_cert.certificate_number}")
            print(f"   Overall Score: {existing_cert.overall_quality_score}")
            print(f"   Status: {existing_cert.certificate_status}")
            return
        
        # Generate certificate
        print("\n🔄 Generating certificate...")
        cert_service = CertificateService(db)
        certificate = await cert_service.generate_certificate(str(booking.id))
        
        print("\n✅ Certificate Generated Successfully!")
        print(f"   Certificate Number: {certificate.certificate_number}")
        print(f"   Crop: {certificate.crop_type}")
        print(f"   Quantity: {certificate.quantity_kg} kg")
        print(f"   Initial Grade: {certificate.initial_grade}")
        print(f"   Final Grade: {certificate.final_grade}")
        print(f"   Grade Maintained: {certificate.grade_maintained}")
        print(f"\n📊 Quality Metrics:")
        print(f"   Temperature Compliance: {certificate.temperature_compliance_percentage}%")
        print(f"   Humidity Compliance: {certificate.humidity_compliance_percentage}%")
        print(f"   Avg Temperature: {certificate.temperature_avg}°C")
        print(f"   Avg Humidity: {certificate.humidity_avg}%")
        print(f"   Sensor Readings: {certificate.total_sensor_readings}")
        print(f"   Pest Incidents: {certificate.pest_incidents_count}")
        print(f"   Quality Tests Pass Rate: {certificate.quality_test_pass_rate}%")
        print(f"   Preservation Rate: {certificate.preservation_rate}%")
        print(f"\n🎯 Overall Quality Score: {certificate.overall_quality_score}/100")
        print(f"\n🔐 Digital Signature: {certificate.digital_signature[:50]}...")
        
        # Test verification
        print(f"\n✅ Verification Test:")
        is_valid = cert_service.verify_certificate(
            certificate.certificate_number,
            certificate.digital_signature
        )
        print(f"   Certificate Valid: {is_valid}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_certificate_generation())
