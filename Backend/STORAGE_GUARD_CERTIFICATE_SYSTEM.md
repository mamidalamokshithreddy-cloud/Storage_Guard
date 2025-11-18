# Storage Guard Quality Control & Certificate System

## 📋 SYSTEM OVERVIEW

### Current Implementation Status
✅ **Database Models** - Complete (IoT sensors, quality tests, certificates)
✅ **Storage Booking** - Operational  
✅ **Transport Integration** - Working  
🔄 **Quality Monitoring** - Partial (needs enhancement)
❌ **Certificate Generation** - Missing (needs implementation)

---

## 🔄 COMPLETE WORKFLOW

### Phase 1: Pre-Storage (AI Quality Analysis)
```
Farmer → Upload Crop Image → AI Detection (crop_detection_model.pt)
   ↓
Quality Analysis
   ├─ Crop Type Detection
   ├─ Grade Assignment (A, B, C)
   ├─ Defect Detection (spots, damage, rot)
   ├─ Shelf Life Prediction (days)
   └─ Initial Quality Score
   ↓
Create RFQ → Vendor Bids → Farmer Selects Storage
   ↓
Storage Booking Created (storage_bookings table)
```

### Phase 2: Storage Period (IoT Monitoring)
```
Crop Stored at Vendor Location
   ↓
IoT Sensors Monitor Continuously:
   ├─ Temperature Sensors (cold_storage: 2-8°C)
   ├─ Humidity Sensors (optimal: 60-80%)
   ├─ Motion Sensors (pest detection)
   ├─ Gas Sensors (ethylene, CO2 for ripening)
   └─ Weight Sensors (loss/spoilage tracking)
   ↓
sensor_readings table (real-time data)
   ↓
Quality Alerts System
   ├─ Temperature breach → Alert vendor + farmer
   ├─ Humidity spike → Adjust HVAC
   ├─ Pest detected → Immediate action
   └─ Weight loss → Investigation
   ↓
quality_alerts table (incidents tracking)
```

### Phase 3: Quality Control Tests (Periodic)
```
Scheduled Quality Tests (weekly/bi-weekly):
   ├─ Visual Inspection
   ├─ Temperature Check
   ├─ Moisture Content Test
   ├─ pH Level (if applicable)
   ├─ Contamination Test
   └─ Pest Inspection
   ↓
quality_tests table (test results)
   ↓
Quality Metrics Calculation:
   ├─ Preservation Rate (weight retained %)
   ├─ Grade Maintenance (A→B→C tracking)
   ├─ Contamination Level (ppm)
   └─ Overall Quality Score
   ↓
quality_metrics table
```

### Phase 4: Storage Completion & Certificate Generation
```
Storage Duration Complete → Calculate Final Metrics
   ↓
Certificate Generation Criteria:
   ├─ Storage Duration: ✓ Completed
   ├─ Temperature Compliance: ✓ 95% within range
   ├─ Humidity Compliance: ✓ 90% within range
   ├─ Pest Free: ✓ No incidents
   ├─ Quality Preserved: ✓ Grade A maintained
   └─ Vendor Certified: ✓ FSSAI + ISO22000
   ↓
Generate Storage Certificate:
   ├─ Certificate Number: SG-2024-000123
   ├─ Farmer Details
   ├─ Crop Type & Quantity
   ├─ Storage Period (start → end date)
   ├─ Initial Grade → Final Grade
   ├─ IoT Sensor Data Summary
   ├─ Quality Test Results
   ├─ Vendor Certifications
   ├─ Storage Conditions Maintained
   └─ Digital Signature + QR Code
   ↓
storage_certificates table
   ↓
Delivery to Buyer with Certificate
```

---

## 🏗️ DATABASE ARCHITECTURE

### Existing Tables (Already Implemented)
```sql
-- Core Storage
storage_bookings: Direct booking system
storage_locations: Vendor facilities
storage_jobs: Active storage operations

-- Quality Control
quality_tests: Manual quality inspections
quality_metrics: Performance measurements
quality_alerts: Automated alert system

-- IoT Infrastructure
iot_sensors: Sensor device registry
sensor_readings: Real-time sensor data
pest_detections: Pest monitoring

-- Compliance
compliance_certificates: Vendor certifications (HACCP, ISO22000, FSSAI)

-- AI Analysis
crop_inspections: AI-based quality analysis (Grade, defects, shelf life)
```

### New Table Needed
```sql
CREATE TABLE storage_certificates (
    id UUID PRIMARY KEY,
    booking_id UUID REFERENCES storage_bookings(id),
    certificate_number VARCHAR(64) UNIQUE NOT NULL,
    farmer_id UUID REFERENCES users(id),
    vendor_id UUID REFERENCES vendors(id),
    location_id UUID REFERENCES storage_locations(id),
    
    -- Crop Details
    crop_type VARCHAR(120) NOT NULL,
    quantity_kg INTEGER NOT NULL,
    initial_grade VARCHAR(16),  -- from AI inspection
    final_grade VARCHAR(16),    -- after storage
    grade_maintained BOOLEAN,
    
    -- Storage Period
    storage_start_date TIMESTAMP NOT NULL,
    storage_end_date TIMESTAMP NOT NULL,
    duration_days INTEGER NOT NULL,
    
    -- Quality Metrics
    temperature_compliance_percentage NUMERIC(5,2),
    humidity_compliance_percentage NUMERIC(5,2),
    pest_incidents_count INTEGER DEFAULT 0,
    quality_test_pass_rate NUMERIC(5,2),
    preservation_rate NUMERIC(5,2),
    overall_quality_score NUMERIC(5,2),
    
    -- Certificate Status
    certificate_status VARCHAR(32) DEFAULT 'pending',  -- pending, issued, revoked
    issued_date TIMESTAMP,
    issued_by UUID REFERENCES users(id),
    
    -- Document
    certificate_pdf_url TEXT,
    qr_code_url TEXT,
    digital_signature TEXT,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 IMPLEMENTATION PLAN

### Step 1: Create Certificate Generation Service
**File**: `Backend/app/services/certificate_service.py`
```python
class CertificateService:
    def generate_storage_certificate(booking_id):
        # 1. Fetch booking data
        # 2. Calculate quality metrics from IoT data
        # 3. Get compliance certificates
        # 4. Generate PDF certificate
        # 5. Create QR code
        # 6. Store in database
        # 7. Return certificate
```

### Step 2: Enhance Quality Monitoring
**File**: `Backend/app/services/quality_monitoring_service.py`
```python
class QualityMonitoringService:
    def calculate_temperature_compliance(booking_id):
        # Get all sensor readings during storage
        # Calculate % within threshold
    
    def calculate_preservation_rate(booking_id):
        # Initial weight vs final weight
        # Grade maintenance tracking
    
    def get_quality_summary(booking_id):
        # Comprehensive quality report
```

### Step 3: Add Certificate Endpoints
**File**: `Backend/app/routers/storage_guard.py`
```python
@router.post("/storage/bookings/{booking_id}/complete")
def complete_storage_and_generate_certificate():
    # Mark booking as completed
    # Generate certificate
    # Notify farmer & buyer
    # Return certificate URL

@router.get("/storage/certificates/{certificate_id}")
def get_certificate():
    # Download PDF certificate

@router.get("/storage/certificates/{certificate_id}/verify")
def verify_certificate():
    # QR code verification endpoint
```

### Step 4: Frontend Certificate Display
**File**: `frontend/src/app/farmer/storageguard/StorageGuard.tsx`
```tsx
// Add new tab: "Quality & Certificates"
<TabsContent value="certificates">
  <CertificatesList />
  <CertificateViewer certificateId={selected} />
  <DownloadButton />
  <ShareButton />
</TabsContent>
```

---

## 📊 CERTIFICATE CONTENT

### Certificate Template
```
╔════════════════════════════════════════════════╗
║    STORAGE GUARD QUALITY CERTIFICATE          ║
║    Certificate No: SG-2024-000123             ║
╚════════════════════════════════════════════════╝

FARMER DETAILS
Name: [Farmer Name]
ID: FM00123
Contact: [Phone]

CROP DETAILS
Type: Cotton
Quantity: 500 kg
Initial Grade: A (AI Inspection Date: 01-Jan-2024)
Final Grade: A (maintained ✓)

STORAGE DETAILS
Vendor: [Vendor Name] (FSSAI Certified)
Location: [Address]
Period: 01-Jan-2024 to 31-Jan-2024 (30 days)

QUALITY METRICS
✓ Temperature Compliance: 98.5% (Target: 2-8°C)
✓ Humidity Compliance: 95.2% (Target: 60-80%)
✓ Pest Free Storage: Zero incidents
✓ Quality Tests Passed: 4/4 (100%)
✓ Preservation Rate: 99.1%
✓ Overall Score: 97.2/100

IOT SENSOR DATA SUMMARY
Average Temperature: 4.2°C (±0.5°C)
Average Humidity: 72% (±3%)
Total Sensor Readings: 8,640 (1 reading/5min)
Alerts Triggered: 2 (resolved within 30min)

COMPLIANCE CERTIFICATIONS
✓ FSSAI License: [Number] (Valid until: [Date])
✓ ISO 22000:2018 Food Safety (Valid)
✓ HACCP Certified (Valid)

CERTIFICATE STATUS: VALID
Issued Date: 31-Jan-2024
Digital Signature: [Hash]
[QR Code for Verification]

Verified by: AgriHub Storage Guard System
www.agrihub.com/verify/SG-2024-000123
```

---

## 🚀 NEXT STEPS

1. **Immediate** (Today):
   - Create `storage_certificates` table migration
   - Implement `certificate_service.py`
   - Add certificate generation endpoint

2. **Short-term** (This Week):
   - Build PDF generation (reportlab/weasyprint)
   - QR code generation
   - Frontend certificate viewer

3. **Medium-term** (Next Week):
   - IoT sensor dashboard
   - Real-time quality monitoring alerts
   - Automated certificate issuance

4. **Long-term** (Next Month):
   - Blockchain integration for certificate verification
   - Buyer access to certificates
   - Certificate NFT for premium storage

---

## 🔐 SECURITY & VERIFICATION

### Certificate Authenticity
- **Digital Signature**: SHA-256 hash of certificate data
- **QR Code**: Contains certificate ID + verification URL
- **Blockchain**: (Future) Immutable certificate record

### Verification Process
```
Buyer scans QR → Redirects to verify endpoint
   ↓
Backend checks certificate_id in database
   ↓
Returns: ✓ Valid or ✗ Invalid/Expired
   ↓
Shows full certificate details
```

---

## 💡 KEY BENEFITS

### For Farmers
✅ Proof of quality storage
✅ Higher crop value (certified storage)
✅ Trust with buyers
✅ Transparent IoT monitoring

### For Vendors
✅ Quality service proof
✅ Reduced disputes
✅ Premium pricing for certified storage
✅ Better reputation

### For Buyers
✅ Verified storage conditions
✅ Quality assurance
✅ Traceability
✅ Risk mitigation

---

**Ready to implement? Let me know which component to start with!**
