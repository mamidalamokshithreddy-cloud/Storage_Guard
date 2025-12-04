# Market Inventory Snapshot Implementation Guide

## Overview
This document explains the Market Inventory Snapshot system - a unified data aggregation layer that combines crop inspection results, IoT sensor data, pest detection events, and compliance certificates into coherent snapshots for Market Connect listings.

## Architecture

### Data Flow
```
Booking Created
    ↓
[auto-trigger] upsert_snapshot() called
    ↓
Fetch Latest Data:
    • Crop Inspection (AI quality analysis)
    • IoT Sensors (temperature, humidity, etc)
    • Pest Detection (recent events, severity)
    • Compliance Certificates (vendor certifications)
    ↓
Aggregate into JSONB Payload
    ↓
Idempotent Upsert to DB (unique on booking_id)
    ↓
Status: "ready_to_publish"
    ↓
[Scheduler] Every 5 minutes, publish ready snapshots
    ↓
Snapshot → MongoDB (Market Connect)
    ↓
Status: "published", market_listing_id set
    ↓
[Scheduler] Every 30 minutes, reconcile published snapshots
    ↓
Update sensors/pest with latest data
    ↓
Published listing stays current 🔄
```

## Database Schema

### MarketInventorySnapshot Table
```sql
CREATE TABLE market_inventory_snapshots (
    id UUID PRIMARY KEY,
    booking_id UUID UNIQUE NOT NULL,  -- Links to storage_bookings
    
    -- Parties
    farmer_id UUID,
    vendor_id UUID,
    location_id UUID,
    
    -- Booking Details (denormalized)
    crop_type VARCHAR(120),
    grade VARCHAR(16),
    quantity_kg INTEGER,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    duration_days INTEGER,
    
    -- Quality Data
    inspection_id UUID,
    inspection_status VARCHAR(32),
    quality_score NUMERIC(5,2),
    freshness VARCHAR(32),
    visual_defects TEXT,
    shelf_life_days INTEGER,
    
    -- IoT Sensors (JSONB)
    sensors JSONB,  -- {sensor_type: {value, unit, reading_time, status}}
    sensor_summary JSONB,  -- {temp_avg, humidity_avg, etc}
    
    -- Pest Detection (JSONB)
    pest_events JSONB,  -- [{pest_type, severity, confidence, detected_at}]
    has_pest_alerts BOOLEAN,
    pest_count INTEGER,
    
    -- Certificates (JSONB)
    certificates JSONB,  -- [{id, type, issuer, status, document_url}]
    is_certified BOOLEAN,
    certification_types TEXT[],
    
    -- Market Status
    status VARCHAR(32),  -- ready_to_publish, publishing, published, withdrawn, completed
    market_listing_id VARCHAR(64),  -- MongoDB ObjectId
    published_at TIMESTAMP,
    last_synced_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB,  -- {is_certified, pest_alert_active, sensor_health, etc}
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Indexes
    UNIQUE INDEX idx_booking_id (booking_id),
    INDEX idx_farmer_id (farmer_id),
    INDEX idx_location_id (location_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

## API Endpoints

### 1. Get Snapshot for Booking
```
GET /storage-guard/snapshots/{booking_id}

Response:
{
  "success": true,
  "snapshot": {
    "id": "uuid",
    "booking_id": "uuid",
    "crop_type": "Tomato",
    "quantity_kg": 5000,
    "grade": "A",
    "quality_score": 92.5,
    "freshness": "excellent",
    "shelf_life_days": 30,
    "sensors": {
      "temperature": {
        "value": 18.5,
        "unit": "°C",
        "reading_time": "2025-12-01T10:30:00Z",
        "status": "active"
      }
    },
    "pest_events": [
      {
        "pest_type": "insects",
        "severity": "low",
        "confidence": 0.85,
        "detected_at": "2025-12-01T08:15:00Z"
      }
    ],
    "certificates": [
      {
        "id": "cert-uuid",
        "type": "FSSAI",
        "issuer": "FSSAI Authority",
        "expiry_date": "2026-12-01",
        "status": "valid",
        "score": 95
      }
    ],
    "is_certified": true,
    "status": "published",
    "published_at": "2025-12-01T09:00:00Z"
  }
}
```

### 2. Publish Snapshot to Market Connect
```
POST /storage-guard/snapshots/{booking_id}/publish

Response:
{
  "success": true,
  "message": "Snapshot published to Market Connect",
  "listing_id": "mongodb-object-id"
}
```

### 3. Batch Sync Ready Snapshots
```
POST /storage-guard/snapshots/sync-all

Response:
{
  "success": true,
  "total": 25,
  "published": 24,
  "results": [
    {
      "booking_id": "uuid",
      "status": "published",
      "listing_id": "mongodb-object-id"
    }
  ]
}
```

### 4. Reconcile Snapshot with Latest Data
```
POST /storage-guard/snapshots/{booking_id}/reconcile

Response:
{
  "success": true,
  "message": "Snapshot reconciled with latest data"
}
```

## Service Functions

### upsert_snapshot(db, booking_id)
**Purpose:** Create or update a snapshot with latest aggregated data

**Flow:**
1. Fetch booking
2. Query latest inspection (quality score, freshness, defects)
3. Query latest IoT sensors for location
4. Query recent pest detections (7 days)
5. Query vendor certificates
6. Aggregate all into JSONB payload
7. Idempotent upsert (unique on booking_id)

**Returns:** Snapshot payload dict or None

### publish_snapshot_to_market(db, snapshot_id)
**Purpose:** Publish a snapshot to MongoDB for Market Connect

**Flow:**
1. Fetch snapshot from Postgres
2. Transform to listing document
3. Upsert to MongoDB market_listings collection
4. Update snapshot status to "published"
5. Store market_listing_id

**Returns:** Result dict with listing_id

### list_snapshots_by_status(db, status, limit)
**Purpose:** Find snapshots in specific status (for scheduler)

**Returns:** List of MarketInventorySnapshot objects

### reconcile_snapshot_with_latest_data(db, booking_id)
**Purpose:** Re-sync snapshot with fresh sensor/pest/cert data

**When to call:**
- Periodically (scheduler: every 30 minutes)
- On demand to update published listings
- After sensor data arrives

## Scheduler

### Background Jobs

1. **Sync Ready Snapshots** (every 5 minutes)
   - Find snapshots with status="ready_to_publish"
   - Publish to MongoDB
   - Update status to "published"

2. **Reconcile Published Snapshots** (every 30 minutes)
   - Find all published snapshots
   - Fetch latest sensor/pest/cert data
   - Update JSONB fields in snapshot
   - Keeps Market Connect listings current

3. **Cleanup Old Snapshots** (daily)
   - Delete completed snapshots older than 90 days
   - Maintains database performance

### Configuration
```python
# In app/__init__.py lifespan:
from app.scheduler import init_market_scheduler
init_market_scheduler()  # Starts all background jobs
```

## Integration Flow

### Step 1: Booking Creation (Auto)
```python
# Backend: booking_service.py
def create_storage_booking(...):
    booking = StorageBooking(...)
    db.add(booking)
    db.commit()
    
    # AUTO-TRIGGER: Create snapshot
    from app.services.market_sync import upsert_snapshot
    snapshot = upsert_snapshot(db, str(booking.id))
    # ✅ Snapshot created with status="ready_to_publish"
```

### Step 2: Snapshot Ready (DB)
```
market_inventory_snapshots:
  booking_id: "abc123"
  status: "ready_to_publish"  ← Ready for publishing
  sensors: {...}
  pest_events: [...]
  certificates: [...]
  created_at: 2025-12-01T10:00:00Z
```

### Step 3: Scheduler Publishing (Automatic)
```python
# Scheduler runs every 5 minutes
def sync_ready_snapshots():
    snapshots = list_snapshots_by_status(db, "ready_to_publish")
    for snapshot in snapshots:
        result = publish_snapshot_to_market(db, snapshot.id)
        if result["ok"]:
            snapshot.status = "published"
            snapshot.market_listing_id = result["listing_id"]
```

### Step 4: Listed on Market Connect (MongoDB)
```json
// MongoDB: market_listings
{
  "_id": "mongodb-object-id",
  "booking_id": "abc123",
  "crop_type": "Tomato",
  "quantity_kg": 5000,
  "quality_score": 92.5,
  "is_certified": true,
  "sensors": {...},
  "pest_events": [...],
  "certificates": [...],
  "published_at": "2025-12-01T10:05:00Z"
}
```

### Step 5: Continuous Updates (Reconciliation)
```python
# Scheduler runs every 30 minutes
def reconcile_published_snapshots():
    published = list_snapshots_by_status(db, "published")
    for snapshot in published:
        # Fetch latest sensor data
        latest_sensors = query_latest_sensors(snapshot.location_id)
        # Update in snapshot
        snapshot.sensors = latest_sensors
        snapshot.sensor_summary = calculate_summary(latest_sensors)
        snapshot.last_synced_at = now()
        db.commit()
```

## Error Handling

### Booking Not Found
- upsert_snapshot returns None
- Endpoint returns 404: "Booking not found"

### Sensor Data Missing
- sensors: {} (empty dict)
- sensor_summary: {} (empty dict)
- No error, graceful degradation

### Certificate Fetch Failed
- certificates: [] (empty list)
- is_certified: false
- Continues without blocking

### MongoDB Connection Fails
- Scheduler logs warning
- Snapshot stays in "ready_to_publish"
- Retries next cycle (5 minutes)

## Verification Steps

### 1. Initialize Database
```bash
cd Backend
python init_market_snapshot_table.py
# ✅ Should create market_inventory_snapshots table
```

### 2. Create Booking (Auto-creates Snapshot)
```bash
# Via frontend: Click "Analyze & Book"
# Or via API:
POST /storage-guard/bookings?farmer_id=...
{
  "location_id": "...",
  "crop_type": "Tomato",
  "quantity_kg": 5000,
  "duration_days": 30,
  "ai_inspection_id": "..."
}

# ✅ Response includes booking ID
```

### 3. Verify Snapshot Created
```bash
# Check Postgres
SELECT * FROM market_inventory_snapshots 
WHERE booking_id = '...';

# Should have:
#   status: "ready_to_publish"
#   sensors: {...}
#   certificates: [...]
```

### 4. Check Scheduler Running
```bash
# Look at logs
[2025-12-01 10:05:00] [SCHEDULER] Checking for ready snapshots...
[2025-12-01 10:05:01] [SCHEDULER] Found 5 snapshots to publish
[2025-12-01 10:05:02] ✅ Published snapshot: abc123
[2025-12-01 10:05:03] 📊 Sync complete: 5 published, 0 failed
```

### 5. Verify MongoDB Entry
```bash
# Check MongoDB
db.market_listings.find({booking_id: "..."})

# Should show listing with all details and sensors
```

## Troubleshooting

### Snapshot Not Creating
1. Check logs for error in `create_storage_booking`
2. Verify booking has `ai_inspection_id`
3. Check database connection

### Snapshots Not Publishing
1. Check if APScheduler installed: `pip install apscheduler`
2. Look for scheduler startup message in logs
3. Verify MongoDB connection
4. Check market_listings collection exists

### Old Sensor Data in Published Listing
1. Reconciliation may be running slowly
2. Manually call: `POST /storage-guard/snapshots/{booking_id}/reconcile`
3. Or adjust scheduler interval in `app/scheduler.py`

### Database Table Missing
1. Run: `python init_market_snapshot_table.py`
2. Or restart backend (triggers create_tables in lifespan)

## Configuration

### Scheduler Intervals (in app/scheduler.py)
```python
market_scheduler.start(
    sync_interval_seconds=300,       # Publish every 5 minutes
    reconcile_interval_minutes=30    # Reconcile every 30 minutes
)
```

### Pest Events Window (in market_sync.py)
```python
seven_days_ago = datetime.utcnow() - timedelta(days=7)
# Change to adjust how far back to look for pest events
```

### Cleanup Policy (in market_sync.py)
```python
delete_old_snapshots(db, days_old=90)
# Completed snapshots deleted after 90 days
```

## Performance Notes

- Snapshot creation: ~500ms (queries 4 tables)
- Publishing to MongoDB: ~200ms
- Reconciliation: ~300ms
- Total overhead per booking: Negligible
- Scheduler uses background thread, doesn't block API

## Future Enhancements

1. **WebSockets for Real-Time Updates**
   - Push snapshot changes to Market Connect in real-time
   - Replace 5-minute polling

2. **TTL Indexes on MongoDB**
   - Auto-delete old published listings after 180 days
   - Reduce storage costs

3. **Snapshot Versioning**
   - Keep history of all snapshot versions
   - Track how quality/sensors changed over time

4. **Buyer Notifications**
   - Notify buyers when crop updates (sensors, pest events)
   - Push to buyer app

5. **Advanced Analytics**
   - Quality trend analysis per location
   - Pest prediction models
   - Optimal storage duration recommendations
