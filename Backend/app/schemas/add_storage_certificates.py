"""
Migration: Add storage_certificates table for quality control and certificate generation
Date: 2024-11-17
"""

from sqlalchemy import Column, String, Integer, Numeric, Boolean, Text, DateTime, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def upgrade_storage_certificates(Base):
    """
    Creates the storage_certificates table
    """
    from app.schemas.postgres_base import Base
    
    class StorageCertificate(Base):
        __tablename__ = "storage_certificates"

        id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        booking_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_bookings.id", ondelete="CASCADE"), unique=True)
        certificate_number = Column(String(64), unique=True, nullable=False)
        
        # Parties
        farmer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
        vendor_id = Column(PGUUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
        location_id = Column(PGUUID(as_uuid=True), ForeignKey("storage_locations.id", ondelete="SET NULL"))
        
        # Crop Details
        crop_type = Column(String(120), nullable=False)
        quantity_kg = Column(Integer, nullable=False)
        initial_grade = Column(String(16))  # from AI inspection
        final_grade = Column(String(16))    # after storage
        grade_maintained = Column(Boolean, default=True)
        initial_defects_count = Column(Integer, default=0)
        final_defects_count = Column(Integer, default=0)
        
        # Storage Period
        storage_start_date = Column(DateTime(timezone=True), nullable=False)
        storage_end_date = Column(DateTime(timezone=True), nullable=False)
        duration_days = Column(Integer, nullable=False)
        actual_shelf_life_days = Column(Integer)
        predicted_shelf_life_days = Column(Integer)
        
        # Quality Metrics (from IoT sensors)
        temperature_compliance_percentage = Column(Numeric(5,2), default=0.0)
        humidity_compliance_percentage = Column(Numeric(5,2), default=0.0)
        temperature_avg = Column(Numeric(5,2))
        temperature_min = Column(Numeric(5,2))
        temperature_max = Column(Numeric(5,2))
        humidity_avg = Column(Numeric(5,2))
        total_sensor_readings = Column(Integer, default=0)
        alerts_triggered = Column(Integer, default=0)
        alerts_resolved = Column(Integer, default=0)
        
        # Quality Tests & Incidents
        pest_incidents_count = Column(Integer, default=0)
        quality_tests_conducted = Column(Integer, default=0)
        quality_tests_passed = Column(Integer, default=0)
        quality_test_pass_rate = Column(Numeric(5,2), default=0.0)
        
        # Performance Metrics
        preservation_rate = Column(Numeric(5,2), default=100.0)  # % of crop preserved
        weight_loss_kg = Column(Numeric(10,2), default=0.0)
        contamination_incidents = Column(Integer, default=0)
        
        # Overall Score
        overall_quality_score = Column(Numeric(5,2), default=0.0)  # 0-100
        
        # Vendor Compliance
        vendor_certifications = Column(Text)  # JSON string of vendor certifications
        fssai_certified = Column(Boolean, default=False)
        iso_certified = Column(Boolean, default=False)
        haccp_certified = Column(Boolean, default=False)
        
        # Certificate Status
        certificate_status = Column(String(32), default='pending')  # pending, issued, revoked, expired
        issued_date = Column(DateTime(timezone=True))
        issued_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
        revoked_date = Column(DateTime(timezone=True))
        revoked_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
        revocation_reason = Column(Text)
        
        # Document Storage
        certificate_pdf_url = Column(Text)
        qr_code_url = Column(Text)
        digital_signature = Column(Text)  # SHA-256 hash for verification
        
        # Additional Info
        storage_conditions = Column(Text)  # JSON: temperature range, humidity, special conditions
        special_notes = Column(Text)
        buyer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
        buyer_verified_date = Column(DateTime(timezone=True))
        
        # Timestamps
        created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
        updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

        # Relationships
        booking = relationship("StorageBooking", foreign_keys=[booking_id])
        farmer = relationship("User", foreign_keys=[farmer_id])
        vendor = relationship("Vendor", foreign_keys=[vendor_id])
        location = relationship("StorageLocation", foreign_keys=[location_id])
        issuer = relationship("User", foreign_keys=[issued_by])
        buyer = relationship("User", foreign_keys=[buyer_id])

    return StorageCertificate


# SQL for manual migration if needed
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS storage_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE REFERENCES storage_bookings(id) ON DELETE CASCADE,
    certificate_number VARCHAR(64) UNIQUE NOT NULL,
    
    -- Parties
    farmer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
    
    -- Crop Details
    crop_type VARCHAR(120) NOT NULL,
    quantity_kg INTEGER NOT NULL,
    initial_grade VARCHAR(16),
    final_grade VARCHAR(16),
    grade_maintained BOOLEAN DEFAULT TRUE,
    initial_defects_count INTEGER DEFAULT 0,
    final_defects_count INTEGER DEFAULT 0,
    
    -- Storage Period
    storage_start_date TIMESTAMPTZ NOT NULL,
    storage_end_date TIMESTAMPTZ NOT NULL,
    duration_days INTEGER NOT NULL,
    actual_shelf_life_days INTEGER,
    predicted_shelf_life_days INTEGER,
    
    -- Quality Metrics
    temperature_compliance_percentage NUMERIC(5,2) DEFAULT 0.0,
    humidity_compliance_percentage NUMERIC(5,2) DEFAULT 0.0,
    temperature_avg NUMERIC(5,2),
    temperature_min NUMERIC(5,2),
    temperature_max NUMERIC(5,2),
    humidity_avg NUMERIC(5,2),
    total_sensor_readings INTEGER DEFAULT 0,
    alerts_triggered INTEGER DEFAULT 0,
    alerts_resolved INTEGER DEFAULT 0,
    
    -- Quality Tests & Incidents
    pest_incidents_count INTEGER DEFAULT 0,
    quality_tests_conducted INTEGER DEFAULT 0,
    quality_tests_passed INTEGER DEFAULT 0,
    quality_test_pass_rate NUMERIC(5,2) DEFAULT 0.0,
    
    -- Performance Metrics
    preservation_rate NUMERIC(5,2) DEFAULT 100.0,
    weight_loss_kg NUMERIC(10,2) DEFAULT 0.0,
    contamination_incidents INTEGER DEFAULT 0,
    
    -- Overall Score
    overall_quality_score NUMERIC(5,2) DEFAULT 0.0,
    
    -- Vendor Compliance
    vendor_certifications TEXT,
    fssai_certified BOOLEAN DEFAULT FALSE,
    iso_certified BOOLEAN DEFAULT FALSE,
    haccp_certified BOOLEAN DEFAULT FALSE,
    
    -- Certificate Status
    certificate_status VARCHAR(32) DEFAULT 'pending',
    issued_date TIMESTAMPTZ,
    issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
    revoked_date TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    revocation_reason TEXT,
    
    -- Document Storage
    certificate_pdf_url TEXT,
    qr_code_url TEXT,
    digital_signature TEXT,
    
    -- Additional Info
    storage_conditions TEXT,
    special_notes TEXT,
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    buyer_verified_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_storage_certificates_booking_id ON storage_certificates(booking_id);
CREATE INDEX idx_storage_certificates_farmer_id ON storage_certificates(farmer_id);
CREATE INDEX idx_storage_certificates_certificate_number ON storage_certificates(certificate_number);
CREATE INDEX idx_storage_certificates_status ON storage_certificates(certificate_status);
CREATE INDEX idx_storage_certificates_issued_date ON storage_certificates(issued_date);
"""
