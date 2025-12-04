"""
Market Inventory Snapshot Service
Aggregates crop inspection, IoT sensors, pest detection, and certificates
into unified snapshots for Market Connect listings.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from sqlalchemy.dialects.postgresql import insert as pg_insert
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List, Any
import logging
import uuid

from app.schemas.postgres_base import (
    MarketInventorySnapshot,
    StorageBooking,
    CropInspection,
    SensorReading,
    IoTSensor,
        PestDetection,
        ComplianceCertificate,
        StorageCertificate,
)
from app.connections.mongo_connection import get_mongo_db

logger = logging.getLogger(__name__)


def upsert_snapshot(db: Session, booking_id: str, publish: bool = False) -> Optional[Dict[str, Any]]:
    """
    Create or update a market inventory snapshot for a booking.
    Aggregates: inspection results, IoT sensors, pest events, certificates.
    
    Idempotent: calling multiple times with same booking_id updates existing snapshot.
    
    Args:
        db: SQLAlchemy session
        booking_id: UUID of StorageBooking
        
    Returns:
        Dictionary with snapshot data, or None if booking not found
    """
    try:
        logger.info(f"🔄 [SNAPSHOT] Starting upsert for booking: {booking_id}")
        
        # 1. Fetch booking
        booking = db.query(StorageBooking).filter(
            StorageBooking.id == uuid.UUID(booking_id)
        ).first()
        
        if not booking:
            logger.error(f"❌ [SNAPSHOT] Booking not found: {booking_id}")
            return None
        
        logger.info(f"✅ [SNAPSHOT] Booking found: {booking.crop_type}, {booking.quantity_kg}kg")
        
        # 2. Fetch inspection data
        inspection_data = {}
        inspection_id = booking.ai_inspection_id
        
        if inspection_id:
            inspection = db.query(CropInspection).filter(
                CropInspection.id == inspection_id
            ).first()
            
            if inspection:
                inspection_data = {
                    "inspection_id": str(inspection.id),
                    "status": "completed",
                    "quality_score": float(inspection.freshness_score or 0),
                    "freshness": inspection.freshness or "unknown",
                    "defects": inspection.visual_defects or "",
                    "shelf_life_days": inspection.shelf_life_days,
                    "grade": inspection.grade or "ungraded",
                    "crop_detected": inspection.crop_detected,
                    "created_at": inspection.created_at.isoformat() if inspection.created_at else None
                }
                logger.info(f"✅ [SNAPSHOT] Inspection found: score={inspection_data['quality_score']}")
        
        # 3. Fetch latest IoT sensor readings for this location
        sensors_data = {}
        sensor_summary = {}
        
        if booking.location_id:
            iot_sensors = db.query(IoTSensor).filter(
                IoTSensor.location_id == booking.location_id
            ).all()
            
            if iot_sensors:
                sensor_values = {}
                
                for sensor in iot_sensors:
                    # Get latest reading for this sensor
                    latest_reading = db.query(SensorReading).filter(
                        SensorReading.sensor_id == sensor.id
                    ).order_by(desc(SensorReading.reading_time)).first()
                    
                    if latest_reading:
                        sensor_type = sensor.sensor_type or "unknown"
                        sensors_data[sensor_type] = {
                            "value": float(latest_reading.reading_value),
                            "unit": latest_reading.reading_unit or "",
                            "reading_time": latest_reading.reading_time.isoformat() if latest_reading.reading_time else None,
                            "status": "active",
                            "alert_triggered": latest_reading.alert_triggered or False
                        }
                        
                        # Aggregate for summary
                        if sensor_type not in sensor_values:
                            sensor_values[sensor_type] = []
                        sensor_values[sensor_type].append(float(latest_reading.reading_value))
                
                # Calculate averages for summary
                for sensor_type, values in sensor_values.items():
                    sensor_summary[f"{sensor_type}_avg"] = sum(values) / len(values)
                    sensor_summary[f"{sensor_type}_min"] = min(values)
                    sensor_summary[f"{sensor_type}_max"] = max(values)
                    sensor_summary[f"{sensor_type}_count"] = len(values)
                
                logger.info(f"✅ [SNAPSHOT] IoT sensors collected: {len(sensors_data)} sensor types")
        
        # 4. Fetch recent pest detection events for this location (last 7 days)
        pest_events = []
        pest_count = 0
        has_pest_alerts = False
        
        if booking.location_id:
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            pest_detections = db.query(PestDetection).filter(
                and_(
                    PestDetection.location_id == booking.location_id,
                    PestDetection.detected_at >= seven_days_ago
                )
            ).order_by(desc(PestDetection.detected_at)).all()
            
            if pest_detections:
                for detection in pest_detections:
                    pest_event = {
                        "pest_type": detection.pest_type or "unknown",
                        "severity": detection.severity_level or "low",
                        "confidence": float(detection.confidence_score or 0),
                        "detected_at": detection.detected_at.isoformat() if detection.detected_at else None,
                        "action_taken": detection.action_taken or "monitoring",
                        "resolved": detection.resolved_at is not None
                    }
                    pest_events.append(pest_event)
                    pest_count += 1
                    
                    # Flag high severity or critical pests
                    if detection.severity_level in ["high", "critical"]:
                        has_pest_alerts = True
                
                logger.info(f"✅ [SNAPSHOT] Pest events collected: {pest_count} events, alerts={has_pest_alerts}")
        
        # 5. Fetch certificates from vendor (linked via inspection or directly from vendor)
        certificates_list = []
        certification_types = []
        is_certified = False
        
        if booking.vendor_id:
            vendor_certs = db.query(ComplianceCertificate).filter(
                and_(
                    ComplianceCertificate.vendor_id == booking.vendor_id,
                    ComplianceCertificate.status == "valid"
                )
            ).all()
            
            if vendor_certs:
                for cert in vendor_certs:
                    cert_obj = {
                        "id": str(cert.id),
                        "type": cert.certificate_type or "unknown",
                        "issuer": cert.issuing_authority or "unknown",
                        "certificate_number": cert.certificate_number or "",
                        "issue_date": cert.issue_date.isoformat() if cert.issue_date else None,
                        "expiry_date": cert.expiry_date.isoformat() if cert.expiry_date else None,
                        "status": cert.status or "unknown",
                        "document_url": cert.document_url or "",
                        "score": cert.score or 0
                    }
                    certificates_list.append(cert_obj)
                    certification_types.append(cert.certificate_type or "unknown")
                
                is_certified = len(certificates_list) > 0
                logger.info(f"✅ [SNAPSHOT] Certificates collected: {len(certificates_list)} certs, types={set(certification_types)}")

        # 5b. Fetch storage-level certificate (issued for this booking)
        storage_cert_obj = None
        try:
            storage_cert = db.query(StorageCertificate).filter(
                StorageCertificate.booking_id == booking.id
            ).first()
            if storage_cert:
                storage_cert_obj = {
                    "id": str(storage_cert.id),
                    "type": "storage_certificate",
                    "certificate_number": storage_cert.certificate_number,
                    "issued_date": storage_cert.issued_date.isoformat() if storage_cert.issued_date else None,
                    "status": storage_cert.certificate_status or 'issued',
                    "digital_signature": storage_cert.digital_signature,
                    "issued_by": str(storage_cert.issued_by) if getattr(storage_cert, 'issued_by', None) else None
                }
                # Add storage certificate to certificates list
                certificates_list.append(storage_cert_obj)
                # Treat storage certificate as a positive certification for market listing
                is_certified = True
                certification_types.append('storage_certificate')
                logger.info(f"✅ [SNAPSHOT] Storage certificate found for booking: {booking.id}")
        except Exception:
            logger.debug("No storage certificate found or error reading storage certificate")
        
        # 6. Build metadata
        snap_metadata = {
            "is_certified": is_certified,
            "certification_types": list(set(certification_types)),
            "pest_alert_active": has_pest_alerts,
            "sensor_health": "good" if not sensor_summary else "monitoring",
            "last_updated": datetime.utcnow().isoformat(),
            "buyer_contacts": [],
            "special_notes": ""
        }
        
        # 7. Prepare snapshot payload
        snapshot_payload = {
            "booking_id": uuid.UUID(booking_id),
            "farmer_id": booking.farmer_id,
            "vendor_id": booking.vendor_id,
            "location_id": booking.location_id,
            "crop_type": booking.crop_type,
            "grade": booking.grade,
            "quantity_kg": booking.quantity_kg,
            "start_date": booking.start_date,
            "end_date": booking.end_date,
            "duration_days": booking.duration_days,
            "inspection_id": inspection_id,
            "inspection_status": inspection_data.get("status", "pending"),
            "quality_score": inspection_data.get("quality_score", 0),
            "freshness": inspection_data.get("freshness", "unknown"),
            "visual_defects": inspection_data.get("defects", ""),
            "shelf_life_days": inspection_data.get("shelf_life_days"),
            "sensors": sensors_data,
            "sensor_summary": sensor_summary,
            "pest_events": pest_events,
            "has_pest_alerts": has_pest_alerts,
            "pest_count": pest_count,
            "certificates": certificates_list,
            "is_certified": is_certified,
            "certification_types": list(set(certification_types)),
            "status": "ready_to_publish",
            "snap_metadata": snap_metadata,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        logger.info(f"📦 [SNAPSHOT] Payload built: sensors={len(sensors_data)}, pests={pest_count}, certs={len(certificates_list)}")
        
        # 8. ORM-based upsert (no reserved attribute access)
        existing = db.query(MarketInventorySnapshot).filter(
            MarketInventorySnapshot.booking_id == uuid.UUID(booking_id)
        ).first()
        
        if existing:
            for key, value in snapshot_payload.items():
                if key != 'booking_id' and hasattr(existing, key):
                    setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            existing.last_synced_at = datetime.utcnow()
            db.commit()
            logger.info(f"[SNAPSHOT] Snapshot UPDATED for booking: {booking_id}")
            # Optionally publish immediately to Market Connect
            if publish:
                try:
                    logger.info(f"[SNAPSHOT] Publishing updated snapshot for booking: {booking_id}")
                    publish_result = publish_snapshot_to_market(db, str(existing.id))
                    logger.info(f"[SNAPSHOT] Publish result: {publish_result}")
                except Exception as e:
                    logger.error(f"[SNAPSHOT] Error publishing updated snapshot: {e}", exc_info=True)
        else:
            new_snap = MarketInventorySnapshot(**snapshot_payload)
            db.add(new_snap)
            db.commit()
            db.refresh(new_snap)
            logger.info(f"[SNAPSHOT] Snapshot CREATED for booking: {booking_id}")
            # Optionally publish immediately to Market Connect
            if publish:
                try:
                    logger.info(f"[SNAPSHOT] Publishing new snapshot for booking: {booking_id}")
                    publish_result = publish_snapshot_to_market(db, str(new_snap.id))
                    logger.info(f"[SNAPSHOT] Publish result: {publish_result}")
                except Exception as e:
                    logger.error(f"[SNAPSHOT] Error publishing new snapshot: {e}", exc_info=True)
        
        return snapshot_payload

    except Exception as e:
        logger.error(f"[SNAPSHOT] Error during upsert: {str(e)}", exc_info=True)
        db.rollback()
        return None



def list_snapshots_by_status(db: Session, status: str, limit: int = 100) -> List[MarketInventorySnapshot]:
    """List snapshots by status for scheduler."""
    try:
        snapshots = db.query(MarketInventorySnapshot).filter(
            MarketInventorySnapshot.status == status
        ).order_by(MarketInventorySnapshot.created_at.desc()).limit(limit).all()
        return snapshots
    except Exception as e:
        logger.error(f"❌ [SNAPSHOT] Error listing snapshots: {str(e)}")
        return []


def update_snapshot_status(db: Session, snapshot_id: str, new_status: str, 
                          market_listing_id: Optional[str] = None) -> bool:
    """Update snapshot status after publishing to Market Connect."""
    try:
        snapshot = db.query(MarketInventorySnapshot).filter(
            MarketInventorySnapshot.id == uuid.UUID(snapshot_id)
        ).first()
        
        if not snapshot:
            logger.warning(f"⚠️ [SNAPSHOT] Snapshot not found: {snapshot_id}")
            return False
        
        snapshot.status = new_status
        if market_listing_id:
            snapshot.market_listing_id = market_listing_id
            snapshot.published_at = datetime.utcnow()
        
        snapshot.updated_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"✅ [SNAPSHOT] Status updated: {snapshot_id} → {new_status}")
        return True
        
    except Exception as e:
        logger.error(f"❌ [SNAPSHOT] Error updating snapshot status: {str(e)}")
        db.rollback()
        return False


def build_listing_from_snapshot(snapshot: MarketInventorySnapshot) -> Dict[str, Any]:
    """Transform a snapshot to Market Connect listing document."""
    listing = {
        "booking_id": str(snapshot.booking_id),
        "farmer_id": str(snapshot.farmer_id) if snapshot.farmer_id else None,
        "crop_type": snapshot.crop_type,
        "quantity_kg": snapshot.quantity_kg,
        "grade": snapshot.grade,
        "duration_days": snapshot.duration_days,
        "start_date": snapshot.start_date.isoformat() if snapshot.start_date else None,
        "end_date": snapshot.end_date.isoformat() if snapshot.end_date else None,
        "quality_score": float(snapshot.quality_score) if snapshot.quality_score else 0,
        "freshness": snapshot.freshness,
        "shelf_life_days": snapshot.shelf_life_days,
        "sensors": snapshot.sensors,
        "pest_events": snapshot.pest_events,
        "certificates": snapshot.certificates,
        "is_certified": snapshot.is_certified,
        "certification_types": snapshot.certification_types,
        "has_pest_alerts": snapshot.has_pest_alerts,
        "status": "published",
        "published_at": datetime.now(timezone.utc).isoformat()
    }
    return listing


def publish_snapshot_to_market(db: Session, snapshot_id: str) -> Dict[str, Any]:
    """Publish a snapshot to Market Connect (MongoDB)."""
    try:
        snapshot = db.query(MarketInventorySnapshot).filter(
            MarketInventorySnapshot.id == uuid.UUID(snapshot_id)
        ).first()
        
        if not snapshot:
            logger.error(f"❌ [PUBLISH] Snapshot not found: {snapshot_id}")
            return {"ok": False, "error": "Snapshot not found"}
        
        # Build listing from snapshot
        listing = build_listing_from_snapshot(snapshot)
        
        # Upsert to MongoDB
        try:
            mongo_db = get_mongo_db()
            col = mongo_db.get_collection("market_listings")
            filter_q = {"booking_id": str(snapshot.booking_id)}
            result = col.update_one(filter_q, {"$set": listing}, upsert=True)
            
            if result.upserted_id:
                market_listing_id = str(result.upserted_id)
                logger.info(f"✅ [PUBLISH] Inserted Market listing: {market_listing_id}")
            else:
                market_listing_id = str(result.matched_count)
                logger.info(f"✅ [PUBLISH] Updated Market listing for booking: {snapshot.booking_id}")
            
            # Update snapshot status in Postgres
            update_snapshot_status(db, snapshot_id, "published", market_listing_id)
            
            return {"ok": True, "listing_id": market_listing_id}
        except Exception as e:
            logger.error(f"❌ [PUBLISH] MongoDB error: {str(e)}")
            return {"ok": False, "error": f"MongoDB error: {str(e)}"}
        
    except Exception as e:
        logger.error(f"❌ [PUBLISH] Error publishing snapshot: {str(e)}")
        return {"ok": False, "error": str(e)}
