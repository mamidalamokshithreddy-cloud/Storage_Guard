# 📜 Storage Guard Certificate Issuance Process

## Complete End-to-End Workflow

### Overview
Storage Guard automatically issues quality certificates for completed bookings that meet specific criteria. Certificates include comprehensive quality metrics based on real-time IoT monitoring, AI inspections, and pest detection data.

---

## 🎯 Certificate Eligibility Requirements

### 1. **Booking Must Have AI Inspection**
- **Requirement:** Booking must be created with `ai_inspection_id`
- **How to achieve:** Use **"Analyze & Book"** feature (not "Quick Booking")
- **Why:** Certificate quality metrics are calculated from AI inspection data (crop grade, quality assessment)

### 2. **Storage Period Must Be Active**
- Booking must be in `confirmed` or `active` status
- Storage period: `start_date` → `end_date`

### 3. **Not Already Completed**
- Booking status should not already be `completed`
- Each booking can only generate one certificate

---

## 📋 Certificate Issuance Workflow

### **Step 1: Farmer Creates Booking with AI Inspection**

#### Frontend (Inventory Tab → Analyze & Book)
```typescript
// When farmer clicks "Analyze & Book" button in Inventory tab
POST /storage-guard/bookings/create
{
  crop_type: "Carrots",
  quantity_kg: 1500,
  storage_location_id: "uuid",
  start_date: "2025-01-15",
  end_date: "2025-02-15",
  ai_inspection_id: "uuid",  // ✅ THIS IS CRITICAL FOR CERTIFICATES
  grade: "A",                  // Populated from AI inspection
  storage_conditions: {...},
  booking_source: "analyzed"   // vs "quick" (no certificate)
}
```

#### Backend Processing
1. Creates `StorageBooking` record in PostgreSQL
2. Calls `market_sync.upsert_snapshot(db, booking_id, publish=True)`
3. Snapshot published immediately to MongoDB `market_listings`
4. IoT sensors auto-generate initial readings for the location

---

### **Step 2: Storage Period (Real-Time Monitoring)**

During storage period (`start_date` → `end_date`):

#### Automatic Data Collection
- **IoT Sensors**: Temperature, humidity readings every API call
  - Stored in `sensor_readings` table
  - Compliance checked against optimal ranges
  
- **Pest Detection**: Computer vision monitors for pest activity
  - Stored in `pest_detections` table
  - Tracks pest incidents and severity

- **AI Re-inspections** (optional): Update crop quality over time
  - Updates `crop_inspections` table
  - Tracks grade maintenance

#### Real-Time Snapshot Updates
```python
# Auto-triggered after sensor readings update
async_worker_thread:
  bookings = get_bookings_for_location(location_id)
  for booking in bookings:
    market_sync.upsert_snapshot(db, booking_id, publish=True)
```

**Result:** Market listings and inventory always show current IoT/pest data

---

### **Step 3: Complete Booking & Generate Certificate**

#### Frontend (My Bookings Tab)
Farmer sees **"Complete & Certificate"** button for:
- Bookings with status `confirmed` or `active`
- Bookings that have `ai_inspection_id`

If no `ai_inspection_id`:
- Button shows: 🔒 No Certificate
- Disabled with tooltip explaining AI inspection requirement

#### User Action
```typescript
// When farmer clicks "Complete & Certificate" button
onClick = async () => {
  const response = await fetch(
    `${API_BASE}/storage-guard/bookings/${booking_id}/complete`,
    { method: 'POST' }
  );
  
  // Response includes certificate summary
  const { certificate } = await response.json();
  
  // UI shows:
  // ✅ Certificate Number
  // ✅ Quality Score (0-100)
  // ✅ Grade Maintenance (Initial → Final)
  // ✅ Link to view full certificate
}
```

---

### **Step 4: Backend Certificate Generation**

#### API Endpoint
```python
POST /storage-guard/bookings/{booking_id}/complete

# Implementation in Backend/app/routers/storage_guard.py
@router.post("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str, db: Session):
    # 1. Fetch booking
    booking = db.query(StorageBooking).filter_by(id=booking_id).first()
    
    # 2. Validate
    if not booking:
        raise HTTPException(404, "Booking not found")
    
    if booking.booking_status == "completed":
        raise HTTPException(400, "Booking already completed")
    
    if not booking.ai_inspection_id:
        raise HTTPException(400, 
            "Certificate requires AI quality inspection. "
            "This booking was created without AI analysis (Quick Booking). "
            "Please use 'Analyze & Book' option for certificate eligibility."
        )
    
    # 3. Generate certificate
    certificate = CertificateService.generate_certificate(
        booking_id=booking_id,
        issued_by_id=booking.farmer_id
    )
    
    # 4. Update booking status
    booking.booking_status = "completed"
    db.commit()
    
    # 5. Return certificate summary
    return {
        "success": True,
        "message": "Booking completed and certificate generated",
        "booking": {...},
        "certificate": {
            "id": certificate.id,
            "certificate_number": "SG-CERT-2025-001234",
            "crop_type": "Carrots",
            "quantity_kg": 1500,
            "initial_grade": "A",
            "final_grade": "A",
            "grade_maintained": True,
            "overall_quality_score": 94.5,
            "temperature_compliance": 98.2,
            "humidity_compliance": 96.7,
            "pest_free": True,
            "issued_date": "2025-01-15T10:30:00",
            "digital_signature": "SHA256:abc123..."
        }
    }
```

---

### **Step 5: Certificate Service Calculation**

#### Quality Metrics Computed
```python
# Backend/app/services/certificate_service.py
def generate_certificate(booking_id: str, issued_by_id: str):
    booking = get_booking(booking_id)
    inspection = get_ai_inspection(booking.ai_inspection_id)
    
    # 1. Temperature Compliance (last 7 days)
    sensor_readings = get_recent_sensors(booking.storage_location_id, days=7)
    temp_compliance = calculate_compliance(
        readings=sensor_readings,
        optimal_range=(2, 8),  # Celsius for cold storage
        metric="temperature"
    )
    # Result: % of readings within optimal range
    
    # 2. Humidity Compliance (last 7 days)
    humidity_compliance = calculate_compliance(
        readings=sensor_readings,
        optimal_range=(80, 95),  # % for vegetables
        metric="humidity"
    )
    
    # 3. Pest Detection Analysis
    pest_incidents = count_pest_detections(booking.storage_location_id)
    pest_free = (pest_incidents == 0)
    
    # 4. Grade Maintenance
    initial_grade = inspection.grade or inspection.overall_quality
    final_grade = get_latest_grade(booking_id) or initial_grade
    grade_maintained = (final_grade >= initial_grade)
    
    # 5. Storage Duration
    duration_days = (booking.end_date - booking.start_date).days
    preservation_rate = calculate_preservation_rate(inspection)
    
    # 6. Overall Quality Score (0-100)
    overall_score = (
        temp_compliance * 0.30 +
        humidity_compliance * 0.30 +
        (100 if pest_free else 70) * 0.20 +
        (100 if grade_maintained else 80) * 0.20
    )
    
    # 7. Create certificate record
    certificate = StorageCertificate(
        id=generate_uuid(),
        certificate_number=generate_cert_number(),
        booking_id=booking_id,
        farmer_id=booking.farmer_id,
        crop_type=booking.crop_type,
        quantity_kg=booking.quantity_kg,
        initial_grade=initial_grade,
        final_grade=final_grade,
        grade_maintained=grade_maintained,
        overall_quality_score=overall_score,
        temperature_compliance=temp_compliance,
        humidity_compliance=humidity_compliance,
        pest_incidents=pest_incidents,
        pest_free=pest_free,
        storage_duration_days=duration_days,
        storage_conditions={
            "temperature_range": {...},
            "humidity_range": {...},
            "sensor_data": {...},
            "pest_summary": {...}
        },
        issued_date=datetime.utcnow(),
        issued_by_id=issued_by_id,
        digital_signature=generate_signature(certificate_data),
        qr_code_url=generate_qr_code(certificate_number),
        certificate_status="active"
    )
    
    db.add(certificate)
    db.commit()
    
    # 8. Update market snapshot with certificate data
    market_sync.upsert_snapshot(db, booking_id, publish=True)
    
    return certificate
```

---

### **Step 6: Market Snapshot Update**

After certificate generation:

```python
# Backend/app/services/market_sync.py
def upsert_snapshot(db, booking_id, publish=True):
    # ... build snapshot with booking, inspection, IoT, pest data
    
    # ADD CERTIFICATE DATA
    certificate = db.query(StorageCertificate).filter_by(
        booking_id=booking_id
    ).first()
    
    if certificate:
        snapshot_data["storage_certificate"] = {
            "certificate_id": certificate.id,
            "certificate_number": certificate.certificate_number,
            "issued_date": certificate.issued_date,
            "quality_score": certificate.overall_quality_score,
            "grade_maintained": certificate.grade_maintained,
            "pest_free": certificate.pest_free,
            "digital_signature": certificate.digital_signature,
            "certificate_status": certificate.certificate_status
        }
        snapshot_data["is_certified"] = True
        snapshot_data["certification_types"].append("storage_certificate")
    
    # Save to Postgres
    snapshot = MarketInventorySnapshot(**snapshot_data)
    db.merge(snapshot)
    db.commit()
    
    # Publish to MongoDB if requested
    if publish:
        publish_snapshot_to_market(db, snapshot.id)
```

**Result:** Market Connect buyers now see certified produce with quality scores

---

## 🔍 Viewing & Verifying Certificates

### Frontend - Certificates Tab

#### Farmer's Certificate List
```typescript
// GET /storage-guard/farmer/{farmer_id}/certificates
const fetchCertificates = async () => {
  const response = await fetch(
    `${API_BASE}/storage-guard/farmer/${farmerId}/certificates`
  );
  const { certificates } = await response.json();
  
  // Display certificates with:
  // - Certificate number
  // - Crop type & quantity
  // - Issue date
  // - Quality score
  // - Download/View buttons
};
```

#### Certificate Details View
```typescript
// GET /storage-guard/certificates/{certificate_id}
const viewCertificate = async (certId) => {
  const response = await fetch(
    `${API_BASE}/storage-guard/certificates/${certId}`
  );
  const cert = await response.json();
  
  // Full certificate data:
  return {
    certificate_number: "SG-CERT-2025-001234",
    booking_details: {...},
    farmer_info: {...},
    vendor_info: {...},
    location_info: {...},
    quality_metrics: {
      overall_score: 94.5,
      temperature_compliance: 98.2,
      humidity_compliance: 96.7,
      pest_free: true,
      grade_maintained: true,
      preservation_rate: 98.0
    },
    storage_conditions: {
      temperature_data: [...],
      humidity_data: [...],
      sensor_alerts: [...],
      pest_incidents: [...]
    },
    digital_signature: "SHA256:...",
    qr_code_url: "https://..."
  };
};
```

#### Certificate Verification
```typescript
// GET /storage-guard/certificates/verify/{certificate_number}?signature=...
const verifyCertificate = async (certNumber, signature) => {
  const response = await fetch(
    `${API_BASE}/storage-guard/certificates/verify/${certNumber}?signature=${signature}`
  );
  const result = await response.json();
  
  return {
    valid: true,
    certificate: {...},
    message: "Certificate is authentic and has not been tampered with"
  };
};
```

---

## 📊 Certificate Data in Market Listings

### Buyer View (Market Connect)

When buyers browse market listings:

```json
{
  "booking_id": "uuid",
  "crop_type": "Carrots",
  "quantity_kg": 1500,
  "grade": "A",
  "price_per_kg": 45,
  
  "is_certified": true,  // ✅ Shows certification badge
  
  "storage_certificate": {
    "certificate_number": "SG-CERT-2025-001234",
    "quality_score": 94.5,
    "grade_maintained": true,
    "pest_free": true,
    "issued_date": "2025-01-15"
  },
  
  "certification_types": ["storage_certificate"],
  
  "current_storage": {
    "temperature": 4.2,
    "humidity": 88.5,
    "storage_days": 30
  }
}
```

**Buyers see:**
- 🏅 "Certified" badge on listing
- Quality score prominently displayed
- Ability to verify certificate before purchase
- Full transparency on storage conditions

---

## 🔄 Automatic vs Manual Certificate Generation

### Current Implementation (Manual)
- Farmer explicitly clicks "Complete & Certificate" button
- Certificate generated on-demand when booking is completed
- Provides control over when storage period ends

### Potential Enhancement (Automatic)
Could add scheduler task to auto-complete bookings:

```python
@scheduler.scheduled_job('interval', hours=6)
def auto_complete_bookings():
    """Auto-complete bookings past end_date and generate certificates"""
    
    now = datetime.utcnow()
    
    # Find bookings past end_date, not yet completed, with AI inspection
    bookings = db.query(StorageBooking).filter(
        StorageBooking.end_date < now,
        StorageBooking.booking_status.in_(['confirmed', 'active']),
        StorageBooking.ai_inspection_id.isnot(None)
    ).all()
    
    for booking in bookings:
        try:
            # Generate certificate
            certificate = CertificateService.generate_certificate(
                booking_id=booking.id,
                issued_by_id=booking.farmer_id
            )
            
            # Update status
            booking.booking_status = "completed"
            db.commit()
            
            # Send notification to farmer
            notify_farmer(booking.farmer_id, certificate)
            
        except Exception as e:
            logger.error(f"Auto-certificate failed for {booking.id}: {e}")
```

---

## 📝 Summary: Key Points

### ✅ What Works Now
1. **Manual Certificate Generation**: Farmers click button to complete & certify
2. **Eligibility Check**: Only bookings with AI inspections can get certificates
3. **Real-Time Data**: Certificates include latest IoT, pest, and inspection data
4. **Market Integration**: Certificates displayed in market listings
5. **Verification**: Buyers can verify certificate authenticity
6. **Immediate Publishing**: Snapshots updated and published after cert issued

### 🎯 Requirements for Certificate
- ✅ Booking created with AI inspection (`ai_inspection_id`)
- ✅ Booking status: `confirmed` or `active`
- ✅ Not already completed
- ✅ IoT data available for quality metrics
- ✅ Storage location has sensor readings

### 🔐 Certificate Contains
1. **Identification**
   - Unique certificate number
   - QR code for verification
   - Digital signature

2. **Quality Metrics**
   - Overall quality score (0-100)
   - Temperature compliance (%)
   - Humidity compliance (%)
   - Pest-free status
   - Grade maintenance (initial → final)
   - Preservation rate (%)

3. **Storage Details**
   - Duration (days)
   - Location information
   - Sensor data summary
   - Alert/incident history

4. **Stakeholder Info**
   - Farmer details
   - Storage vendor details
   - Issue date & issuer

---

## 🚀 Next Steps (Optional Enhancements)

### 1. **Automatic Certificate Generation**
Add scheduler to auto-complete bookings past `end_date`

### 2. **Certificate Templates**
PDF/printable certificate with official branding

### 3. **Email Notifications**
Email certificate to farmer automatically when issued

### 4. **Blockchain Integration**
Store certificate hash on blockchain for immutable verification

### 5. **Certificate Expiry**
Add expiry date (e.g., 6 months from issue) for time-sensitive quality claims

### 6. **Bulk Certificate Export**
Allow farmers to download all certificates as ZIP

### 7. **Certificate Analytics**
Dashboard showing certificate issuance trends, average quality scores, etc.

---

## 📞 API Reference Quick Links

### Certificate Endpoints

```
POST   /storage-guard/bookings/{booking_id}/complete
       → Complete booking & generate certificate

GET    /storage-guard/certificates/{certificate_id}
       → Get full certificate details

GET    /storage-guard/certificates/verify/{certificate_number}?signature=...
       → Verify certificate authenticity

GET    /storage-guard/farmer/{farmer_id}/certificates
       → List all certificates for farmer
```

### Related Endpoints

```
POST   /storage-guard/bookings/create
       → Create booking (must include ai_inspection_id)

GET    /storage-guard/inventory
       → View inventory with certificate badges

GET    /market-connect/listings
       → Browse certified produce (MongoDB)
```

---

## 🎓 Farmer Instructions

### How to Get a Storage Certificate

1. **Create Booking with AI Analysis**
   - Go to Inventory tab
   - Click **"Analyze & Book"** (NOT "Quick Book")
   - AI will inspect crop quality
   - Complete booking form

2. **Wait for Storage Period**
   - Storage period runs from start_date to end_date
   - IoT sensors automatically monitor conditions
   - Check "My Bookings" tab for booking status

3. **Complete Booking & Get Certificate**
   - When storage period is done, go to "My Bookings"
   - Find your booking (status: confirmed/active)
   - Click **"Complete & Certificate"** button
   - Certificate generated instantly!

4. **View Certificate**
   - Go to "Certificates" tab
   - See all your quality certificates
   - Download, print, or share with buyers
   - QR code for instant verification

5. **Share with Buyers**
   - Certificate automatically shown in Market Connect
   - Buyers see quality score and certification badge
   - Increases trust and selling price!

---

## 🏆 Benefits

### For Farmers
- ✅ Official quality certification
- ✅ Higher selling price (certified produce)
- ✅ Proof of proper storage conditions
- ✅ Competitive advantage in market

### For Buyers
- ✅ Trust in quality claims
- ✅ Verifiable storage conditions
- ✅ Transparent quality metrics
- ✅ Risk reduction

### For Storage Vendors
- ✅ Demonstrate facility quality
- ✅ Attract more farmers
- ✅ Premium pricing for certified storage
- ✅ Quality assurance proof

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Storage Guard Development Team
