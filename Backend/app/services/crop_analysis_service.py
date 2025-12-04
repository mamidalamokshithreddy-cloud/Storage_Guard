"""
Crop Analysis Service - Auto-Update IoT Sensors & Pest Detection
Automatically simulates realistic sensor changes based on crop type, storage conditions, and time
This bridges the gap between static seeded data and real-time IoT streams
"""

import logging
import threading
import random
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
from uuid import UUID

from app.schemas import postgres_base as models

logger = logging.getLogger(__name__)


# =============================================================================
# CROP-SPECIFIC SENSOR BEHAVIOR (How sensors change for each crop)
# =============================================================================

CROP_SENSOR_DYNAMICS = {
    # CEREALS: Temperature relatively stable, humidity fluctuates slightly
    "cereals": {
        "temperature": {
            "base_range": (18, 24),          # Normal operating range
            "stress_range": (25, 32),        # High stress range
            "drift_per_hour": 0.15,          # Slow drift (°C/hour)
            "variance": 0.5,                 # Random variance (±°C)
        },
        "humidity": {
            "base_range": (50, 65),
            "stress_range": (70, 85),
            "drift_per_hour": 0.3,
            "variance": 2.0,                 # Higher variance than temp
        },
        "moisture": {
            "base_range": (12, 14),
            "stress_range": (15, 20),
            "drift_per_hour": 0.02,          # Very slow drift
            "variance": 0.5,
        },
        "co2": {
            "base_range": (1, 3),
            "stress_range": (3, 6),
            "drift_per_hour": 0.05,
            "variance": 0.2,
        },
    },
    
    # LEGUMES: Similar to cereals but drier preference
    "legumes": {
        "temperature": {
            "base_range": (15, 22),
            "stress_range": (23, 28),
            "drift_per_hour": 0.12,
            "variance": 0.4,
        },
        "humidity": {
            "base_range": (40, 55),
            "stress_range": (60, 75),
            "drift_per_hour": 0.25,
            "variance": 1.5,
        },
        "moisture": {
            "base_range": (10, 12),
            "stress_range": (13, 18),
            "drift_per_hour": 0.01,
            "variance": 0.3,
        },
        "co2": {
            "base_range": (1, 2.5),
            "stress_range": (2.5, 5),
            "drift_per_hour": 0.04,
            "variance": 0.15,
        },
    },
    
    # VEGETABLES: Higher humidity preference, cooler temps
    "vegetables": {
        "temperature": {
            "base_range": (8, 14),
            "stress_range": (15, 25),
            "drift_per_hour": 0.08,
            "variance": 0.3,
        },
        "humidity": {
            "base_range": (85, 95),
            "stress_range": (70, 85),        # Too dry is stress
            "drift_per_hour": 0.5,
            "variance": 3.0,
        },
        "moisture": {
            "base_range": (15, 20),
            "stress_range": (20, 30),
            "drift_per_hour": 0.05,
            "variance": 1.0,
        },
        "co2": {
            "base_range": (2, 5),
            "stress_range": (5, 10),
            "drift_per_hour": 0.1,
            "variance": 0.5,
        },
    },
    
    # FRUITS: Cold storage, high humidity
    "fruits": {
        "temperature": {
            "base_range": (2, 8),
            "stress_range": (9, 15),
            "drift_per_hour": 0.05,
            "variance": 0.2,
        },
        "humidity": {
            "base_range": (80, 95),
            "stress_range": (70, 80),
            "drift_per_hour": 0.4,
            "variance": 2.5,
        },
        "moisture": {
            "base_range": (12, 18),
            "stress_range": (18, 25),
            "drift_per_hour": 0.03,
            "variance": 0.8,
        },
        "co2": {
            "base_range": (1, 3),
            "stress_range": (3, 6),
            "drift_per_hour": 0.06,
            "variance": 0.25,
        },
    },
    
    # OILSEEDS: Dry, stable
    "oilseeds": {
        "temperature": {
            "base_range": (18, 25),
            "stress_range": (26, 32),
            "drift_per_hour": 0.1,
            "variance": 0.4,
        },
        "humidity": {
            "base_range": (45, 65),
            "stress_range": (65, 80),
            "drift_per_hour": 0.2,
            "variance": 1.5,
        },
        "moisture": {
            "base_range": (8, 10),
            "stress_range": (10, 15),
            "drift_per_hour": 0.01,
            "variance": 0.2,
        },
        "co2": {
            "base_range": (1, 2.5),
            "stress_range": (2.5, 4),
            "drift_per_hour": 0.03,
            "variance": 0.1,
        },
    },
    
    # SPICES: Room temperature, moderate conditions
    "spices": {
        "temperature": {
            "base_range": (20, 25),
            "stress_range": (26, 30),
            "drift_per_hour": 0.1,
            "variance": 0.3,
        },
        "humidity": {
            "base_range": (40, 60),
            "stress_range": (60, 75),
            "drift_per_hour": 0.25,
            "variance": 1.5,
        },
        "moisture": {
            "base_range": (8, 12),
            "stress_range": (12, 18),
            "drift_per_hour": 0.02,
            "variance": 0.3,
        },
        "co2": {
            "base_range": (1, 2),
            "stress_range": (2, 4),
            "drift_per_hour": 0.02,
            "variance": 0.1,
        },
    },
}


# =============================================================================
# SENSOR STATE TRACKING (Memory of recent conditions)
# =============================================================================

LOCATION_SENSOR_STATE = {}  # Track current state per location
PEST_STRESS_LEVEL = {}      # Track cumulative stress per location


class CropAnalysisService:
    """
    Analyzes crop type and storage conditions to automatically update sensors.
    Simulates realistic sensor behavior based on:
    - Crop type (different crops have different sensor dynamics)
    - Time elapsed (drift and gradual changes)
    - Recent stress (violates thresholds accumulate stress)
    - Location characteristics
    """

    def __init__(self, db: Session):
        self.db = db
        self.now = datetime.now(timezone.utc)

    def get_crop_category(self, crop_name: Optional[str] = None) -> str:
        """
        Map crop name to category (cereals, legumes, vegetables, fruits, oilseeds, spices)
        """
        if not crop_name:
            return "cereals"
        
        crop_lower = crop_name.lower()
        
        # Map crops to categories
        mappings = {
            "cereals": ["wheat", "rice", "corn", "maize", "barley", "oat"],
            "legumes": ["lentil", "chickpea", "pulse", "bean", "pea", "peanut"],
            "vegetables": ["potato", "onion", "tomato", "cauliflower", "cabbage", "carrot"],
            "fruits": ["apple", "mango", "banana", "orange", "grape", "citrus"],
            "oilseeds": ["mustard", "sunflower", "sesame", "soybean", "canola"],
            "spices": ["turmeric", "cardamom", "chili", "pepper", "cumin", "coriander"],
        }
        
        for category, crops in mappings.items():
            if any(c in crop_lower for c in crops):
                return category
        
        return "cereals"  # Default fallback

    def calculate_dynamic_sensor_value(
        self,
        location_id: UUID,
        sensor_type: str,
        crop_category: str,
        is_stressed: bool = False,
    ) -> float:
        """
        Calculate realistic sensor value based on:
        - Crop category (different crops have different dynamics)
        - Time drift (values change slowly over time)
        - Stress level (stressed storage = outside ranges)
        - Random variance (natural sensor fluctuations)
        
        Returns: Realistic sensor reading for the crop type
        """
        
        loc_key = str(location_id)
        
        # Initialize state if not exists
        if loc_key not in LOCATION_SENSOR_STATE:
            LOCATION_SENSOR_STATE[loc_key] = {
                "initialized_at": self.now,
                "values": {},
            }
        
        state = LOCATION_SENSOR_STATE[loc_key]
        
        # Get crop dynamics
        dynamics = CROP_SENSOR_DYNAMICS.get(crop_category, CROP_SENSOR_DYNAMICS["cereals"])
        sensor_dynamics = dynamics.get(sensor_type, {})
        
        if not sensor_dynamics:
            return 0.0
        
        # Calculate time-based drift
        time_since_init = (self.now - state["initialized_at"]).total_seconds() / 3600  # hours
        drift = sensor_dynamics.get("drift_per_hour", 0) * time_since_init
        
        # Get previous value or start from base range
        if sensor_type not in state["values"]:
            base_min, base_max = sensor_dynamics.get("base_range", (0, 100))
            state["values"][sensor_type] = random.uniform(base_min, base_max)
        
        previous_value = state["values"][sensor_type]
        
        # Determine target range (normal or stress)
        if is_stressed:
            target_min, target_max = sensor_dynamics.get("stress_range", (0, 100))
        else:
            target_min, target_max = sensor_dynamics.get("base_range", (0, 100))
        
        # Apply drift towards target
        target = random.uniform(target_min, target_max)
        new_value = previous_value + drift
        
        # Add random variance
        variance = sensor_dynamics.get("variance", 1.0)
        new_value += random.gauss(0, variance)
        
        # Clamp to reasonable bounds (avoid unrealistic extremes)
        absolute_min = min(target_min, sensor_dynamics.get("base_range", (0, 100))[0]) - 5
        absolute_max = max(target_max, sensor_dynamics.get("base_range", (0, 100))[1]) + 5
        new_value = max(absolute_min, min(absolute_max, new_value))
        
        # Store for next call
        state["values"][sensor_type] = new_value
        
        return round(new_value, 1)

    def simulate_sensor_updates(
        self,
        location_id: UUID,
        crop_type: Optional[str] = None,
    ) -> Dict:
        """
        Simulate sensor updates for a location based on crop type.
        Returns dictionary of updated sensor values.
        
        This is called on EVERY INVENTORY QUERY to create the illusion of
        real-time sensor updates without requiring actual hardware.
        """
        try:
            crop_category = self.get_crop_category(crop_type)
            
            # Calculate stress level (cumulative violations)
            loc_key = str(location_id)
            if loc_key not in PEST_STRESS_LEVEL:
                PEST_STRESS_LEVEL[loc_key] = 0.0
            
            stress_level = PEST_STRESS_LEVEL[loc_key]
            is_stressed = stress_level > 0.5  # Stressed if violations exceed threshold
            
            # Generate sensor readings for this location
            sensor_updates = {}
            
            for sensor_type in ["temperature", "humidity", "moisture", "co2"]:
                value = self.calculate_dynamic_sensor_value(
                    location_id=location_id,
                    sensor_type=sensor_type,
                    crop_category=crop_category,
                    is_stressed=is_stressed,
                )
                sensor_updates[sensor_type] = value
            
            return sensor_updates

        except Exception as e:
            logger.error(f"Error simulating sensor updates: {e}")
            return {}

    def update_location_sensors_in_db(
        self,
        location_id: UUID,
        crop_type: Optional[str] = None,
    ) -> bool:
        """
        Update ALL sensors at a location with new simulated readings.
        This creates the "real-time" illusion by updating readings each time
        inventory is queried.
        
        Returns: True if updated, False if failed
        """
        try:
            # Generate new sensor values
            sensor_updates = self.simulate_sensor_updates(location_id, crop_type)
            
            if not sensor_updates:
                return False
            
            # Fetch all sensors at this location
            sensors = self.db.query(models.IoTSensor).filter(
                models.IoTSensor.location_id == location_id,
                models.IoTSensor.status == "active"
            ).all()
            
            # Create new readings for each sensor
            for sensor in sensors:
                if sensor.sensor_type in sensor_updates:
                    new_value = sensor_updates[sensor.sensor_type]
                    
                    # Create new reading
                    reading = models.SensorReading(
                        sensor_id=sensor.id,
                        reading_value=new_value,
                        reading_unit=self._get_unit_for_sensor(sensor.sensor_type),
                        reading_time=self.now,
                        alert_triggered=False,  # Will be determined by monitoring service
                    )
                    
                    self.db.add(reading)
                    
                    # Update sensor's last_reading timestamp
                    sensor.last_reading = self.now
            
            # Commit changes
            self.db.flush()  # Flush to commit within transaction
            logger.info(f"Updated sensors at location {location_id}: {sensor_updates}")
            return True

        except Exception as e:
            logger.error(f"Error updating location sensors: {e}")
            # Don't rollback - let the caller decide
            return False

    def _get_unit_for_sensor(self, sensor_type: str) -> str:
        """Get unit of measurement for sensor type"""
        units = {
            "temperature": "C",
            "humidity": "%",
            "moisture": "%",
            "co2": "ppm",
            "weight": "kg",
            "motion": "binary",
        }
        return units.get(sensor_type, "")

    def update_pest_stress_level(
        self,
        location_id: UUID,
        violations_count: int,
    ) -> None:
        """
        Update stress level based on violations.
        Higher stress = sensors drift towards stress ranges.
        """
        loc_key = str(location_id)
        PEST_STRESS_LEVEL[loc_key] = min(violations_count * 0.2, 1.0)
        logger.info(f"Updated stress level for {location_id}: {PEST_STRESS_LEVEL[loc_key]:.2f}")


# =============================================================================
# INTEGRATION WITH INVENTORY (AUTO-UPDATE SENSORS)
# =============================================================================

def auto_update_sensors_before_inventory(location_id: UUID, crop_type: str, db: Session) -> None:
    """
    Call this BEFORE fetching inventory for a location.
    It will:
    1. Generate new realistic sensor readings
    2. Update database with new readings
    3. This makes sensors appear to change in real-time
    
    Perfect for demo purposes and testing before real IoT integration.
    
    NOTE: This adds to the current transaction but does NOT commit
          The caller handles transaction management
    """
    try:
        service = CropAnalysisService(db)
        # Generate new sensor values
        sensor_updates = service.simulate_sensor_updates(location_id, crop_type)
        
        if not sensor_updates:
            return
        
        # Fetch all sensors at this location
        sensors = db.query(models.IoTSensor).filter(
            models.IoTSensor.location_id == location_id,
            models.IoTSensor.status == "active"
        ).all()
        
        # Create new readings for each sensor
        for sensor in sensors:
            if sensor.sensor_type in sensor_updates:
                new_value = sensor_updates[sensor.sensor_type]
                
                # Create new reading
                reading = models.SensorReading(
                    sensor_id=sensor.id,
                    reading_value=new_value,
                    reading_unit=service._get_unit_for_sensor(sensor.sensor_type),
                    reading_time=service.now,
                    alert_triggered=False,
                )
                
                db.add(reading)
                
                # Update sensor's last_reading timestamp
                sensor.last_reading = service.now
        
        # Flush to current transaction (but don't commit)
        db.flush()
        logger.info(f"Queued sensor updates for location {location_id}: {sensor_updates}")
        try:
            # Async: trigger snapshot upsert/publish in a separate DB session so
            # snapshots reflect the new sensor readings without blocking inventory.
            def _publish_snapshots_for_location(loc_id: UUID):
                try:
                    from app.connections.postgres_connection import SessionLocal
                    from app.services import market_sync

                    sess = SessionLocal()
                    try:
                        # Find all bookings for this location and upsert their snapshots
                        bookings = sess.query(models.StorageBooking).filter(
                            models.StorageBooking.location_id == loc_id
                        ).all()

                        for b in bookings:
                            try:
                                market_sync.upsert_snapshot(sess, str(b.id), publish=True)
                            except Exception as e:
                                logger.warning(f"Failed to upsert/publish snapshot for booking {b.id}: {e}")
                    finally:
                        sess.close()
                except Exception as e:
                    logger.warning(f"Async publish worker failed: {e}")

            threading.Thread(target=_publish_snapshots_for_location, args=(location_id,), daemon=True).start()
        except Exception:
            # Non-fatal: sensor updates should not break inventory
            logger.debug("Failed to schedule async snapshot publish for sensor updates")
        
    except Exception as e:
        logger.warning(f"Failed to queue sensor updates: {e}")
        # Don't raise - let inventory endpoint continue without sensor updates


# =============================================================================
# USAGE IN INVENTORY ENDPOINT
# =============================================================================

"""
In storage_guard.py inventory endpoint, add this at the START:

    for loc in location_ids:
        # AUTO-UPDATE: Generate fresh sensor readings for this location
        # This creates the illusion of real-time data without hardware
        booking = next((b for b in bookings if str(b.location_id) == loc), None)
        if booking:
            auto_update_sensors_before_inventory(loc, booking.crop_type, db)
        
        # Then fetch the updated sensors (will have new values)
        sensors_at_loc = db.query(models.IoTSensor).filter(...)
        # ... rest of code
"""
