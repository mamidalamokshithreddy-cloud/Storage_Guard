# ====== ADD THIS ENDPOINT TO storage_guard.py BEFORE LINE 2331 ======

@storage_guard_router.get("/location-utilization")
async def get_location_utilization(db: Session = Depends(get_db)):
    """Get real booking-based utilization for each storage location"""
    try:
        locations = db.query(models.StorageLocation).all()
        location_utilization = []
        
        for location in locations:
            # Get active bookings at this location
            active_bookings = db.query(models.StorageBooking).filter(
                models.StorageBooking.location_id == location.id,
                models.StorageBooking.booking_status.in_(["confirmed", "active"])
            ).all()
            
            # Calculate total quantity booked (in kg)
            total_quantity_kg = sum(b.quantity_kg for b in active_bookings)
            
            # Get capacity in MT
            capacity_mt = 0
            try:
                if hasattr(location, 'capacity_text') and location.capacity_text:
                    capacity_str = location.capacity_text.split()[0]
                    capacity_mt = float(capacity_str)
                elif hasattr(location, 'capacity_mt') and location.capacity_mt:
                    capacity_mt = float(location.capacity_mt)
            except (ValueError, IndexError, AttributeError):
                pass
            
            # Convert MT to kg (1 MT = 1000 kg)
            capacity_kg = capacity_mt * 1000
            
            # Calculate utilization percentage
            utilization_percent = 0.0
            if capacity_kg > 0:
                utilization_percent = min(100, (total_quantity_kg / capacity_kg) * 100)
            
            location_utilization.append({
                "location_id": str(location.id),
                "location_name": location.name,
                "utilization_percent": round(utilization_percent, 1),
                "active_bookings_count": len(active_bookings),
                "capacity_mt": capacity_mt,
                "total_booked_qty_kg": total_quantity_kg
            })
        
        print(f"🏢 Location utilization calculated for {len(location_utilization)} locations")
        return {"success": True, "locations": location_utilization}
    except Exception as e:
        print(f"❌ Error calculating location utilization: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "locations": [], "error": str(e)}
