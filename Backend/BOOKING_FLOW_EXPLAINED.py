"""
STORAGE GUARD BOOKING FLOW - STEP BY STEP
==========================================

This document explains the complete flow when a farmer creates a booking.

STEP 1: FARMER CREATES BOOKING REQUEST
---------------------------------------
Frontend → POST /storage-guard/bookings?farmer_id={uuid}

Request Body:
{
  "location_id": "uuid",
  "crop_type": "Tomatoes",
  "quantity_kg": 1000,
  "duration_days": 30,
  "start_date": "2025-12-04",
  "transport_required": true
}

File: frontend/src/pages/StorageGuard.tsx (or similar)


STEP 2: API ENDPOINT RECEIVES REQUEST
--------------------------------------
File: Backend/app/routers/storage_guard.py
Function: create_direct_booking()

Actions:
1. Validates farmer_id exists
2. Calls booking_service.create_storage_booking()
3. Returns booking details


STEP 3: BOOKING SERVICE CREATES BOOKING
----------------------------------------
File: Backend/app/services/booking_service.py
Function: create_storage_booking()

Actions:
1. Validates location exists
2. Gets vendor_id from location
3. Calculates pricing:
   - Converts kg to quintals (kg / 100)
   - Gets price per quintal per month from location
   - Calculates total: quintals × price × (days/30)
4. Creates StorageBooking record in database
   - PostgreSQL automatically sets created_at = NOW()
5. Commits to database
6. Calls market_sync.upsert_snapshot()


STEP 4: SNAPSHOT CREATION
--------------------------
File: Backend/app/services/market_sync.py
Function: upsert_snapshot()

Actions:
1. Builds snapshot payload with:
   - Booking details (crop, quantity, dates)
   - IoT sensor data (temperature, humidity)
   - Pest detection events
   - Quality inspection data
   - Vendor certificates

2. Checks if snapshot exists for this booking_id:
   - If EXISTS: Updates existing snapshot
   - If NEW: Creates new MarketInventorySnapshot
   
3. PostgreSQL automatically sets:
   - created_at = NOW()
   - Trigger sets updated_at = NOW() on UPDATE

4. Commits snapshot to database

5. If publish=True:
   - Calls publish_snapshot_to_market()


STEP 5: PUBLISH TO MARKET CONNECT
----------------------------------
File: Backend/app/services/market_sync.py
Function: publish_snapshot_to_market()

Actions:
1. Fetches complete snapshot data
2. Sends to Market Connect MongoDB
3. Updates snapshot status to "published"
4. Sets published_at timestamp


STEP 6: RESPONSE SENT TO FRONTEND
----------------------------------
Returns:
{
  "id": "booking-uuid",
  "farmer_id": "farmer-uuid",
  "location_id": "location-uuid",
  "vendor_id": "vendor-uuid",
  "crop_type": "Tomatoes",
  "quantity_kg": 1000,
  "duration_days": 30,
  "start_date": "2025-12-04T00:00:00",
  "end_date": "2025-01-03T00:00:00",
  "price_per_day": 66.5,
  "total_price": 1995.0,
  "booking_status": "PENDING",
  "created_at": "2025-12-04T13:19:08.900412+05:30",
  "updated_at": null
}


ONGOING PROCESSES
=================

SCHEDULER (if enabled):
-----------------------
File: Backend/app/main.py
Function: sync_market_snapshots()

Runs every 5 minutes:
1. Fetches all active bookings
2. Calls upsert_snapshot() for each
3. Updates sensor data, pest alerts
4. Publishes changes to Market Connect


IOT SENSOR DATA COLLECTION:
----------------------------
File: Backend/app/services/iot_service.py

Continuous process:
1. Sensors send telemetry to MongoDB
2. Latest readings aggregated
3. Included in snapshot updates
4. Alerts triggered if thresholds exceeded


PEST DETECTION:
---------------
File: Backend/app/services/pest_detection.py

When triggered:
1. AI model analyzes images
2. Detects pests and severity
3. Creates PestDetection record
4. Added to snapshot pest_events


DATABASE TABLES INVOLVED
========================

1. storage_bookings
   - Primary booking record
   - created_at: Auto-set by PostgreSQL
   - updated_at: Auto-updated by trigger

2. market_inventory_snapshots
   - One snapshot per booking (UNIQUE constraint)
   - created_at: Auto-set by PostgreSQL
   - updated_at: Auto-updated by trigger
   - Contains aggregated data

3. storage_locations
   - Storage facility details
   - Pricing information

4. iot_sensors
   - Sensor device registrations

5. sensor_readings
   - Real-time telemetry data

6. pest_detections
   - Pest alert records

7. crop_inspections
   - Quality inspection results


KEY VERIFICATION POINTS
=======================

✅ Timestamp Accuracy:
   - created_at uses server_default=func.now()
   - updated_at uses onupdate trigger
   - Times match between booking and snapshot

✅ Data Integrity:
   - UNIQUE constraint on booking_id
   - Foreign key to storage_bookings.id
   - Cascade delete if booking removed

✅ Real-time Updates:
   - Snapshot created immediately with booking
   - Scheduler updates every 5 minutes
   - IoT data refreshed continuously

✅ Publishing:
   - Automatic if publish=True
   - Manual via scheduler
   - Status tracked in snapshot
"""

print(__doc__)
