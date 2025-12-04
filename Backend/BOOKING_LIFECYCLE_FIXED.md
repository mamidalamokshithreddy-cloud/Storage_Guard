# ✅ Fixed: Booking Lifecycle & Certificate Generation

## Problem Identified
Previously, certificates could be generated for **pending** bookings without vendor approval, which is incorrect.

## Correct Booking Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BOOKING STATUS LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────────┘

1️⃣ PENDING
   ├─ Farmer creates booking (via Analyze & Book or Quick Book)
   ├─ Status: "PENDING"
   ├─ vendor_confirmed: False
   └─ ⏳ Waiting for vendor approval

2️⃣ VENDOR REVIEWS
   ├─ Vendor sees booking in their dashboard
   └─ Vendor decides:
       ├─ ✅ APPROVE → Status: "CONFIRMED", vendor_confirmed: True
       └─ ❌ REJECT → Status: "REJECTED", vendor_confirmed: False

3️⃣ CONFIRMED / ACTIVE
   ├─ Storage period starts
   ├─ Status: "CONFIRMED" or "ACTIVE"
   ├─ vendor_confirmed: True ✅
   ├─ IoT sensors monitor conditions
   └─ Pest detection active

4️⃣ COMPLETED
   ├─ Farmer clicks "Complete & Certificate"
   ├─ Status: "COMPLETED"
   └─ 📜 Certificate Generated (if has ai_inspection_id)

5️⃣ CERTIFICATE ISSUED
   ├─ StorageCertificate created
   ├─ Market snapshot updated with cert data
   └─ Farmer can view/share certificate
```

---

## Certificate Generation Requirements

### ✅ ALL Must Be True:

```python
1. booking.vendor_confirmed == True
   # Vendor must approve first

2. booking.booking_status in ["CONFIRMED", "ACTIVE"]
   # Cannot be PENDING, REJECTED, or CANCELLED

3. booking.ai_inspection_id != None
   # Must have AI inspection (Analyze & Book, not Quick Book)

4. booking.booking_status != "COMPLETED"
   # Cannot generate certificate twice
```

---

## What Was Fixed

### Backend Changes (`storage_guard.py`)

**Before:**
```python
@router.post("/bookings/{booking_id}/complete")
async def complete_booking(...):
    # ❌ Only checked: booking exists, not completed, has ai_inspection
    if not booking.ai_inspection_id:
        raise HTTPException(400, "Need AI inspection")
```

**After:**
```python
@router.post("/bookings/{booking_id}/complete")
async def complete_booking(...):
    # ✅ CHECK 1: Not already completed
    if booking.booking_status.upper() == "COMPLETED":
        raise HTTPException(400, "Already completed")
    
    # ✅ CHECK 2: Vendor must have confirmed
    if not booking.vendor_confirmed:
        raise HTTPException(400, "Pending vendor approval")
    
    # ✅ CHECK 3: Status must be CONFIRMED or ACTIVE
    if booking.booking_status.upper() not in ["CONFIRMED", "ACTIVE"]:
        raise HTTPException(400, "Invalid status")
    
    # ✅ CHECK 4: AI inspection required
    if not booking.ai_inspection_id:
        raise HTTPException(400, "Need AI inspection")
```

### Service Layer Fix (`booking_service.py`)

**Before:**
```python
def vendor_confirm_booking(...):
    if booking.status != "PENDING":  # ❌ Typo: booking.status
        raise HTTPException(400, "Cannot modify")
    
    if confirmed:
        booking.booking_status = "confirmed"  # ❌ Lowercase
```

**After:**
```python
def vendor_confirm_booking(...):
    if booking.booking_status.upper() != "PENDING":  # ✅ Fixed typo
        raise HTTPException(400, "Cannot modify")
    
    if confirmed:
        booking.booking_status = "CONFIRMED"  # ✅ Uppercase
        booking.vendor_confirmed = True       # ✅ Set flag
        booking.vendor_confirmed_at = now()   # ✅ Timestamp
    else:
        booking.booking_status = "REJECTED"
        booking.vendor_confirmed = False
```

### Frontend Updates (`StorageGuard.tsx`)

**Before:**
```tsx
// ❌ Only disabled if no ai_inspection_id
<Button 
  disabled={!booking.ai_inspection_id}
  onClick={completeBooking}
>
  Complete & Certificate
</Button>
```

**After:**
```tsx
// ✅ Disabled if no AI inspection OR no vendor confirmation
<Button 
  disabled={!booking.ai_inspection_id || !booking.vendor_confirmed}
  onClick={async () => {
    // Check vendor confirmation first
    if (!booking.vendor_confirmed) {
      toast({
        title: "⏳ Pending Vendor Approval",
        description: "Certificate can only be generated after vendor confirms your booking."
      });
      return;
    }
    
    // Then check AI inspection
    if (!booking.ai_inspection_id) {
      toast({
        title: "❌ Certificate Not Available",
        description: "Quick bookings don't support certificates."
      });
      return;
    }
    
    // Proceed with completion
  }}
>
  {!booking.vendor_confirmed ? '⏳ Awaiting Vendor' 
   : booking.ai_inspection_id ? 'Complete & Certificate'
   : '🔒 No Certificate'}
</Button>

{/* Show status badges */}
{booking.booking_status === 'pending' && !booking.vendor_confirmed && (
  <Badge className="bg-yellow-50 text-yellow-700">
    ⏳ Pending Vendor Approval
  </Badge>
)}

{booking.vendor_confirmed && booking.booking_status !== 'completed' && (
  <Badge className="bg-green-50 text-green-700">
    ✅ Vendor Confirmed
  </Badge>
)}
```

---

## User Experience Flow

### For Farmers

#### Scenario 1: Pending Booking (No Vendor Approval)
```
Status: PENDING
Button State: Disabled
Button Text: "⏳ Awaiting Vendor"
Badge: "⏳ Pending Vendor Approval"
Action: Click "Learn More" → See explanation of next steps
```

#### Scenario 2: Vendor Confirmed
```
Status: CONFIRMED or ACTIVE
Button State: Enabled (if has AI inspection)
Button Text: "Complete & Certificate"
Badge: "✅ Vendor Confirmed"
Action: Click → Generate certificate
```

#### Scenario 3: Vendor Rejected
```
Status: REJECTED
Button State: Hidden
Badge: "❌ Booking Rejected"
Message: Reason displayed (if provided by vendor)
```

#### Scenario 4: Quick Booking (No AI Inspection)
```
Status: CONFIRMED
Button State: Disabled
Button Text: "🔒 No Certificate"
Badge: "⚠️ No AI Inspection"
Tooltip: "Certificates require AI analysis"
```

### For Vendors

Vendors need a dashboard to review pending bookings:

```
POST /storage-guard/bookings/{booking_id}/vendor-confirm
{
  "confirmed": true,
  "notes": "Approved. Storage slot #12 assigned."
}
```

---

## API Error Messages

Clear error messages guide users through requirements:

### Error 1: No Vendor Approval
```json
{
  "detail": "Booking pending vendor approval. Certificate can only be generated after vendor confirms the booking."
}
```

### Error 2: Invalid Status
```json
{
  "detail": "Booking status is 'PENDING'. Certificate can only be generated for confirmed or active bookings."
}
```

### Error 3: No AI Inspection
```json
{
  "detail": "Certificate requires AI quality inspection. This booking was created without AI analysis (Quick Booking). Please use 'Analyze & Book' option for certificate eligibility."
}
```

### Error 4: Already Completed
```json
{
  "detail": "Booking already completed. Certificate may already exist."
}
```

---

## Database Schema (Relevant Fields)

```sql
CREATE TABLE storage_bookings (
    id UUID PRIMARY KEY,
    farmer_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    location_id UUID NOT NULL,
    ai_inspection_id UUID,           -- Required for certificate
    
    booking_status VARCHAR(50),      -- PENDING → CONFIRMED → COMPLETED
    vendor_confirmed BOOLEAN,        -- Must be TRUE for certificate
    vendor_confirmed_at TIMESTAMP,   -- When vendor approved
    
    rejection_reason TEXT,           -- If vendor rejects
    
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## Testing Scenarios

### Test 1: Pending Booking → Certificate (Should Fail)
```bash
# Create booking
POST /storage-guard/bookings/create
# Status: PENDING, vendor_confirmed: False

# Try to complete (should fail)
POST /storage-guard/bookings/{id}/complete
# Expected: 400 "Pending vendor approval"
```

### Test 2: Vendor Confirms → Certificate (Should Work)
```bash
# Vendor confirms
POST /storage-guard/bookings/{id}/vendor-confirm
{
  "confirmed": true
}
# Status: CONFIRMED, vendor_confirmed: True

# Complete booking
POST /storage-guard/bookings/{id}/complete
# Expected: 200 + Certificate generated ✅
```

### Test 3: Vendor Rejects → Certificate (Should Fail)
```bash
# Vendor rejects
POST /storage-guard/bookings/{id}/vendor-confirm
{
  "confirmed": false,
  "rejection_reason": "Storage full"
}
# Status: REJECTED, vendor_confirmed: False

# Try to complete (should fail)
POST /storage-guard/bookings/{id}/complete
# Expected: 400 "Invalid status"
```

### Test 4: Quick Booking → Certificate (Should Fail)
```bash
# Create quick booking (no AI inspection)
POST /storage-guard/bookings/create
{
  "ai_inspection_id": null,  # No AI
  ...
}

# Vendor confirms
POST /storage-guard/bookings/{id}/vendor-confirm
{"confirmed": true}

# Try to complete (should fail)
POST /storage-guard/bookings/{id}/complete
# Expected: 400 "Need AI inspection"
```

---

## Next Steps / Enhancements

### 1. Vendor Dashboard (Priority)
Create vendor UI to review/approve bookings:
```
/vendor/bookings/pending
- List all pending bookings
- Approve/Reject buttons
- Add notes for rejection reasons
```

### 2. Auto-Status Transition
```python
# When start_date arrives
if booking.start_date <= today and booking.booking_status == "CONFIRMED":
    booking.booking_status = "ACTIVE"
```

### 3. Notifications
```python
# When vendor confirms
notify_farmer(farmer_id, "Your booking was confirmed!")

# When vendor rejects
notify_farmer(farmer_id, f"Booking rejected: {reason}")

# When storage period ends
notify_farmer(farmer_id, "Storage period complete. Generate certificate now!")
```

### 4. Expiry Logic
```python
# If booking not completed within X days after end_date
if today > booking.end_date + timedelta(days=7):
    booking.booking_status = "EXPIRED"
```

---

## Summary

✅ **Fixed Issues:**
1. Certificate generation now requires vendor approval
2. Proper status validation (CONFIRMED/ACTIVE only)
3. Clear error messages for each validation
4. Frontend UI shows booking status clearly
5. Fixed typo in booking_service (booking.status → booking.booking_status)

✅ **Booking Lifecycle:**
```
PENDING → (Vendor Approves) → CONFIRMED → (Storage Done) → COMPLETED → CERTIFICATE
```

✅ **Certificate Requirements:**
- Vendor confirmed ✅
- Status: CONFIRMED or ACTIVE ✅
- Has AI inspection ✅
- Not already completed ✅

---

**Last Updated:** December 2, 2025  
**Status:** ✅ Fixed and Deployed
