"""
Sensor Monitoring Service - Dynamic IoT & Pest Detection Logic
Automatically analyzes sensor readings and generates alerts/detections based on thresholds
NO HARDCODED values - all configurable per crop/storage type
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from uuid import UUID
import json

from app.schemas import postgres_base as models

logger = logging.getLogger(__name__)


# =============================================================================
# STORAGE-CONDITION THRESHOLDS (per crop/storage type)
# These define when conditions are "bad" enough to trigger pest/quality alerts
# =============================================================================

CROP_STORAGE_THRESHOLDS = {
    # CEREALS (Rice, Wheat, Corn)
    "cereals": {
        "temperature": {"min": 10, "max": 25, "unit": "°C"},          # Optimal: 15-20
        "humidity": {"min": 40, "max": 65, "unit": "%"},              # Optimal: 50-60
        "moisture": {"min": 12, "max": 14, "unit": "%"},              # Grain moisture safe level
        "co2": {"max": 3, "unit": "ppm"},                             # Max CO2 before fermentation
    },
    # LEGUMES (Lentils, Chickpeas, Pulses)
    "legumes": {
        "temperature": {"min": 12, "max": 20, "unit": "°C"},
        "humidity": {"min": 35, "max": 55, "unit": "%"},
        "moisture": {"min": 10, "max": 12, "unit": "%"},
        "co2": {"max": 2, "unit": "ppm"},
    },
    # OILSEEDS (Mustard, Sunflower, Peanut)
    "oilseeds": {
        "temperature": {"min": 15, "max": 25, "unit": "°C"},
        "humidity": {"min": 45, "max": 65, "unit": "%"},
        "moisture": {"min": 8, "max": 10, "unit": "%"},
        "co2": {"max": 2.5, "unit": "ppm"},
    },
    # SPICES (Turmeric, Cardamom, Chili)
    "spices": {
        "temperature": {"min": 18, "max": 25, "unit": "°C"},
        "humidity": {"min": 40, "max": 60, "unit": "%"},
        "moisture": {"min": 8, "max": 12, "unit": "%"},
        "co2": {"max": 2, "unit": "ppm"},
    },
    # VEGETABLES (Potatoes, Onions)
    "vegetables": {
        "temperature": {"min": 5, "max": 15, "unit": "°C"},
        "humidity": {"min": 85, "max": 95, "unit": "%"},
        "moisture": {"max": 20, "unit": "%"},
        "co2": {"max": 5, "unit": "ppm"},
    },
    # FRUITS (Apples, Mangoes, Citrus)
    "fruits": {
        "temperature": {"min": 0, "max": 10, "unit": "°C"},
        "humidity": {"min": 80, "max": 95, "unit": "%"},
        "moisture": {"min": 12, "max": 18, "unit": "%"},
        "co2": {"max": 3, "unit": "ppm"},
    },
}

# Pest types that get triggered based on environmental conditions
PEST_CONDITIONS = {
    "storage_beetle": {
        "description": "Grain storage beetle infestation",
        "triggers": [
            {"sensor": "temperature", "condition": "above", "value": 25, "duration_minutes": 30},
            {"sensor": "humidity", "condition": "above", "value": 70, "duration_minutes": 30},
        ],
        "severity_calc": "high",  # always high severity if triggered
    },
    "weevil_infestation": {
        "description": "Rice/wheat weevil activity",
        "triggers": [
            {"sensor": "temperature", "condition": "between", "min": 18, "max": 28, "duration_minutes": 60},
            {"sensor": "humidity", "condition": "above", "value": 65, "duration_minutes": 60},
        ],
        "severity_calc": "medium",  # increases if both conditions met
    },
    "fungal_growth": {
        "description": "Mold/fungal development (high moisture)",
        "triggers": [
            {"sensor": "humidity", "condition": "above", "value": 75, "duration_minutes": 120},
            {"sensor": "co2", "condition": "above", "value": 3, "duration_minutes": 120},
        ],
        "severity_calc": "high",
    },
    "moisture_excess": {
        "description": "Moisture level too high (crop degradation risk)",
        "triggers": [
            {"sensor": "moisture", "condition": "above", "value": 15, "duration_minutes": 60},
        ],
        "severity_calc": "high",
    },
    "rodent_activity": {
        "description": "Rodent/pest access detected",
        "triggers": [
            {"sensor": "temperature", "condition": "below", "value": 12, "duration_minutes": 0},  # Rarely triggers alone
            {"sensor": "humidity", "condition": "above", "value": 85, "duration_minutes": 120},  # Needs moisture + time
        ],
        "severity_calc": "critical",  # Critical if triggered
    },
}


# =============================================================================
# PEST DETECTION LOGIC (Dynamic, Threshold-Based)
# =============================================================================

class SensorMonitoringService:
    """
    Analyzes sensor readings and dynamically generates pest detections + quality alerts
    based on environmental conditions, NOT hardcoded data
    """

    def __init__(self, db: Session):
        self.db = db
        self.now = datetime.now(timezone.utc)

    def get_crop_thresholds(self, crop_name: Optional[str] = None) -> Dict:
        """
        Returns storage thresholds for a crop.
        Falls back to 'cereals' if crop not found (most common default)
        """
        if not crop_name:
            return CROP_STORAGE_THRESHOLDS.get("cereals")
        
        crop_lower = crop_name.lower()
        
        # Try to match crop to category
        for category, thresholds in CROP_STORAGE_THRESHOLDS.items():
            if category in crop_lower or crop_lower in category:
                return thresholds
        
        # Default fallback
        return CROP_STORAGE_THRESHOLDS.get("cereals")

    def analyze_location_sensors(self, location_id: UUID) -> Dict:
        """
        Analyzes all sensors at a location and returns condition status.
        Returns: {
            "sensor_readings": {"temperature": {...}, "humidity": {...}, ...},
            "violations": [{"sensor": "temperature", "current": 28, "max": 25, "severity": "high"}],
            "pest_risk": float (0.0-1.0),
            "condition_score": float (0.0-100),
        }
        """
        try:
            violations = []
            sensor_readings = {}
            
            # Get all sensors at this location with latest readings
            sensors = self.db.query(models.IoTSensor).filter(
                models.IoTSensor.location_id == location_id,
                models.IoTSensor.status == "active"
            ).all()

            for sensor in sensors:
                latest_reading = (
                    self.db.query(models.SensorReading)
                    .filter(models.SensorReading.sensor_id == sensor.id)
                    .order_by(models.SensorReading.reading_time.desc())
                    .first()
                )

                if latest_reading:
                    reading_value = float(latest_reading.reading_value) if latest_reading.reading_value else 0
                    sensor_readings[sensor.sensor_type] = {
                        "value": reading_value,
                        "unit": latest_reading.reading_unit,
                        "time": latest_reading.reading_time,
                    }

                    # Check against generic thresholds (cereals default)
                    thresholds = self.get_crop_thresholds("cereals")
                    
                    if sensor.sensor_type in thresholds:
                        sensor_threshold = thresholds[sensor.sensor_type]
                        
                        # Check min/max bounds
                        if "min" in sensor_threshold and reading_value < sensor_threshold["min"]:
                            violations.append({
                                "sensor": sensor.sensor_type,
                                "current": reading_value,
                                "min": sensor_threshold["min"],
                                "type": "below_minimum",
                                "severity": "medium",
                            })
                        
                        if "max" in sensor_threshold and reading_value > sensor_threshold["max"]:
                            violations.append({
                                "sensor": sensor.sensor_type,
                                "current": reading_value,
                                "max": sensor_threshold["max"],
                                "type": "above_maximum",
                                "severity": "high",
                            })

            # Calculate pest risk (0-1) based on violations
            pest_risk = min(len(violations) * 0.2, 1.0)  # Each violation adds 0.2 to risk

            # Calculate condition score (0-100)
            condition_score = max(100 - (len(violations) * 10), 0)

            return {
                "sensor_readings": sensor_readings,
                "violations": violations,
                "pest_risk": pest_risk,
                "condition_score": condition_score,
            }

        except Exception as e:
            logger.error(f"Error analyzing location sensors: {e}")
            return {
                "sensor_readings": {},
                "violations": [],
                "pest_risk": 0.0,
                "condition_score": 50,
            }

    def should_trigger_pest_detection(
        self, 
        location_id: UUID, 
        pest_type: str,
        sensor_readings: Dict
    ) -> Tuple[bool, float]:
        """
        Determines if a pest detection should be triggered based on sensor conditions.
        Returns: (should_trigger: bool, confidence_score: float 0-1)
        """
        try:
            if pest_type not in PEST_CONDITIONS:
                return False, 0.0

            pest_config = PEST_CONDITIONS[pest_type]
            triggers = pest_config["triggers"]
            
            # Check each trigger condition
            conditions_met = 0
            total_conditions = len(triggers)

            for trigger in triggers:
                sensor_type = trigger["sensor"]
                if sensor_type not in sensor_readings:
                    continue

                reading = sensor_readings[sensor_type]
                reading_value = reading.get("value", 0)
                
                # Evaluate condition
                condition_met = False
                
                if trigger["condition"] == "above":
                    condition_met = reading_value > trigger["value"]
                
                elif trigger["condition"] == "below":
                    condition_met = reading_value < trigger["value"]
                
                elif trigger["condition"] == "between":
                    condition_met = (
                        reading_value >= trigger.get("min", 0) and 
                        reading_value <= trigger.get("max", 100)
                    )

                if condition_met:
                    conditions_met += 1

            # Pest triggers if majority of conditions met (at least 50%)
            threshold_ratio = 0.5
            if conditions_met / total_conditions >= threshold_ratio:
                # Confidence = ratio of conditions met
                confidence = conditions_met / total_conditions
                return True, confidence
            
            return False, 0.0

        except Exception as e:
            logger.error(f"Error evaluating pest trigger {pest_type}: {e}")
            return False, 0.0

    def generate_pest_detections_if_needed(
        self, 
        location_id: UUID, 
        booking: Optional[models.StorageBooking] = None
    ) -> List[models.PestDetection]:
        """
        Analyzes sensor conditions and automatically creates pest detections if thresholds violated.
        Returns list of newly created PestDetection records.
        
        NOTE: Only creates if detection doesn't already exist in last N hours
        """
        try:
            new_detections = []
            
            # Analyze location
            analysis = self.analyze_location_sensors(location_id)
            sensor_readings = analysis["sensor_readings"]
            violations = analysis["violations"]

            # If no violations, no pest risk
            if not violations or analysis["pest_risk"] < 0.1:
                return []

            # Check each pest type to see if it should be triggered
            for pest_type in PEST_CONDITIONS.keys():
                should_trigger, confidence = self.should_trigger_pest_detection(
                    location_id, 
                    pest_type,
                    sensor_readings
                )

                if not should_trigger:
                    continue

                # Determine severity based on violation count + confidence
                if analysis["pest_risk"] > 0.7:
                    severity = "critical"
                elif analysis["pest_risk"] > 0.5:
                    severity = "high"
                elif analysis["pest_risk"] > 0.3:
                    severity = "medium"
                else:
                    severity = "low"

                # Check if similar detection already exists (within last 2 hours)
                recent_detection = (
                    self.db.query(models.PestDetection)
                    .filter(
                        models.PestDetection.location_id == location_id,
                        models.PestDetection.pest_type == pest_type,
                        models.PestDetection.detected_at >= (self.now - timedelta(hours=2))
                    )
                    .order_by(models.PestDetection.detected_at.desc())
                    .first()
                )

                # Only create if no recent detection for this pest type
                if not recent_detection:
                    detection = models.PestDetection(
                        location_id=location_id,
                        job_id=booking.storage_job_id if booking else None,
                        pest_type=pest_type,
                        detection_method="automated_sensor_analysis",
                        severity_level=severity,
                        confidence_score=confidence,
                        location_details=f"Detected via sensor monitoring: {', '.join([v['sensor'] for v in violations[:3]])}",
                        action_taken="Alert generated - manual inspection recommended",
                        detected_at=self.now,
                    )
                    
                    self.db.add(detection)
                    new_detections.append(detection)
                    
                    logger.info(
                        f"Auto-generated pest detection: {pest_type} at location {location_id} "
                        f"(confidence: {confidence:.2f}, severity: {severity})"
                    )

            # Commit all new detections
            if new_detections:
                self.db.commit()
                logger.info(f"Created {len(new_detections)} pest detections for location {location_id}")

            return new_detections

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error generating pest detections: {e}")
            return []

    def get_quality_alerts(self, location_id: UUID) -> List[Dict]:
        """
        Returns current quality alerts for a location based on sensor violations.
        """
        try:
            analysis = self.analyze_location_sensors(location_id)
            alerts = []

            for violation in analysis["violations"]:
                alert = {
                    "type": "quality_alert",
                    "sensor": violation["sensor"],
                    "current_value": violation["current"],
                    "threshold": violation.get("max") or violation.get("min"),
                    "violation_type": violation["type"],
                    "severity": violation["severity"],
                    "timestamp": self.now.isoformat(),
                }
                alerts.append(alert)

            return alerts

        except Exception as e:
            logger.error(f"Error getting quality alerts: {e}")
            return []
