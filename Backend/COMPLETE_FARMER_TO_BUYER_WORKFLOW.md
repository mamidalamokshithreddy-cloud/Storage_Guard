# Complete Farmer-to-Buyer Workflow Design 🌾➡️🏪

## 📋 PROCESS OVERVIEW

### Stage 1: Farmer → Storage Request
1. **Farmer harvests produce** and needs storage
2. **Creates Storage RFQ** (Request for Quote)
   - Crop type, quantity, quality grade
   - Storage duration needed  
   - Origin location, preferred storage type
3. **Storage vendors bid** on the RFQ
4. **Farmer selects best bid** → Creates `StorageJob`

### Stage 2: Storage → Quality Testing
1. **Production arrives at storage facility**
2. **Mandatory quality testing** performed
   - Moisture content, purity, grade assessment
   - Pest detection, contamination check
   - IoT sensors monitor storage conditions
3. **Quality certificates generated** automatically
4. **Production status**: `STORED_VERIFIED` with quality score

### Stage 3: Market Connection → Pricing
1. **Farmer lists produce for sale** via MarketConnect
2. **Market pricing data** from mandi/wholesale markets
3. **Buyers browse available produce** with quality certificates
4. **Price negotiation** or acceptance of market rates

### Stage 4: Buyer → Purchase Order
1. **Buyer places order** for specific quantity
2. **Payment escrow** system (optional)
3. **Farmer receives purchase notification**
4. **Order status**: `PENDING_FARMER_APPROVAL`

### Stage 5: Farmer → Release Authorization
1. **Farmer reviews buyer order**
2. **Approves release** of specific quantity from storage
3. **Transport arrangement** triggered automatically
4. **Storage facility receives release instruction**

### Stage 6: Storage → Buyer Delivery
1. **Storage facility prepares shipment**
2. **Quality certificates attached** to delivery
3. **Transport tracking** with GPS and condition monitoring
4. **Real-time delivery updates** to all parties

### Stage 7: Delivery → Certificate Handover
1. **Buyer receives produce** with quality documentation
2. **Digital certificates** include:
   - Original quality test results
   - Storage condition history
   - Transport temperature logs
   - Compliance certifications (HACCP, ISO, etc.)
3. **Delivery confirmation** and payment release

## 🗃️ DATABASE TABLES NEEDED

### New Tables Required:

#### 1. `production_listings` (Market Integration)
- `id` (UUID, Primary Key)
- `storage_job_id` (UUID, FK to storage_jobs)
- `farmer_id` (UUID, FK to farmers)
- `crop_type` (String)
- `quantity_available_kg` (Integer)
- `quality_grade` (String) 
- `asking_price_per_kg` (Decimal)
- `storage_location_id` (UUID, FK to storage_locations)
- `listing_status` (Enum: ACTIVE, SOLD, WITHDRAWN)
- `created_at`, `updated_at`

#### 2. `purchase_orders` (Buyer Orders)
- `id` (UUID, Primary Key)
- `listing_id` (UUID, FK to production_listings)
- `buyer_id` (UUID, FK to buyers)
- `quantity_ordered_kg` (Integer)
- `agreed_price_per_kg` (Decimal)
- `total_amount` (Decimal)
- `delivery_address` (Text)
- `order_status` (Enum: PENDING_APPROVAL, APPROVED, IN_TRANSIT, DELIVERED, CANCELLED)
- `created_at`, `updated_at`

#### 3. `release_authorizations` (Farmer Approvals)
- `id` (UUID, Primary Key)
- `purchase_order_id` (UUID, FK to purchase_orders)
- `farmer_id` (UUID, FK to farmers)
- `storage_job_id` (UUID, FK to storage_jobs)
- `authorized_quantity_kg` (Integer)
- `authorization_status` (Enum: PENDING, APPROVED, REJECTED)
- `release_instructions` (Text)
- `authorized_at` (DateTime)

#### 4. `quality_certificates` (Generated Documentation)
- `id` (UUID, Primary Key)
- `storage_job_id` (UUID, FK to storage_jobs)
- `purchase_order_id` (UUID, FK to purchase_orders)
- `certificate_type` (Enum: QUALITY_TEST, STORAGE_CONDITION, TRANSPORT_LOG, COMPLIANCE)
- `certificate_data` (JSON) # Test results, sensor data, etc.
- `issued_by` (String) # Testing lab, storage facility
- `issue_date` (DateTime)
- `certificate_hash` (String) # For verification
- `pdf_path` (String) # Generated PDF certificate

#### 5. `delivery_jobs` (End-to-end Tracking)
- `id` (UUID, Primary Key)
- `purchase_order_id` (UUID, FK to purchase_orders)
- `transport_route_id` (UUID, FK to transport_routes)
- `pickup_location_id` (UUID, FK to storage_locations)
- `delivery_address` (Text)
- `estimated_delivery` (DateTime)
- `actual_delivery` (DateTime)
- `delivery_status` (Enum: SCHEDULED, IN_TRANSIT, DELIVERED, FAILED)
- `certificate_bundle` (JSON) # All attached certificates

## 🔄 WORKFLOW STATES

### Storage Job Enhanced States:
- `SCHEDULED` → `IN_PROGRESS` → `STORED` → `QUALITY_TESTED` → `LISTED_FOR_SALE` → `PARTIALLY_SOLD` → `SOLD_OUT` → `COMPLETED`

### Purchase Order States:
- `PENDING_APPROVAL` → `FARMER_APPROVED` → `TRANSPORT_SCHEDULED` → `IN_TRANSIT` → `DELIVERED` → `CONFIRMED`

### Quality Certificate States:
- `GENERATED` → `ATTACHED_TO_ORDER` → `IN_TRANSIT` → `DELIVERED_TO_BUYER`

## 📱 API ENDPOINTS NEEDED

### Market Integration:
- `POST /market/list-production` - Farmer lists stored produce for sale
- `GET /market/browse-produce` - Buyers browse available produce
- `GET /market/production/{id}/certificates` - View quality certificates

### Purchase Orders:
- `POST /orders/create` - Buyer creates purchase order
- `GET /orders/farmer/{farmer_id}` - Farmer sees pending orders
- `POST /orders/{id}/approve` - Farmer approves/rejects order
- `GET /orders/buyer/{buyer_id}` - Buyer tracks orders

### Release & Delivery:
- `POST /storage/release-authorization` - Farmer authorizes release
- `GET /delivery/{order_id}/tracking` - Real-time delivery tracking
- `GET /delivery/{order_id}/certificates` - Download delivery certificates

### Certificate Generation:
- `POST /certificates/generate-quality` - Auto-generate quality certificate
- `GET /certificates/bundle/{order_id}` - Complete certificate bundle for delivery

## 🎯 INTEGRATION POINTS

### With Existing Systems:
1. **Storage Guard** → Enhanced to track produce through sale
2. **Quality Control** → Automatic certificate generation
3. **Transport** → Connects to buyer delivery
4. **IoT Sensors** → Continuous monitoring data in certificates

### With External Systems:
1. **MarketConnect** → Real-time pricing data
2. **Payment Gateway** → Escrow and settlements  
3. **SMS/Email** → Notifications at each stage
4. **Digital Signatures** → Certificate authenticity

This creates a **complete traceability system** from farm to consumer with quality assurance at every step! 🌾📋✅