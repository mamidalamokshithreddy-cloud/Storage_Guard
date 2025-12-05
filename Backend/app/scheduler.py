"""
Background Scheduler for Market Connect Integration
Periodically publishes market inventory snapshots to Market Connect.
"""

import logging
import threading
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)


class MarketSnapshotScheduler:
    """Manages background publishing of market inventory snapshots"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False
    
    def sync_ready_snapshots(self):
        """Publish all ready-to-publish snapshots to Market Connect"""
        try:
            from app.connections.postgres_connection import SessionLocal
            from app.services.market_sync import (
                list_snapshots_by_status,
                publish_snapshot_to_market
            )
            
            logger.info("🔄 [SCHEDULER] Checking for ready snapshots...")
            
            db = SessionLocal()
            try:
                # Get snapshots ready to publish
                snapshots = list_snapshots_by_status(db, "ready_to_publish", limit=50)
                
                if not snapshots:
                    logger.debug("ℹ️ [SCHEDULER] No snapshots ready to publish")
                    return
                
                logger.info(f"📦 [SCHEDULER] Found {len(snapshots)} snapshots to publish")
                
                published_count = 0
                failed_count = 0
                
                for snapshot in snapshots:
                    try:
                        result = publish_snapshot_to_market(db, str(snapshot.id))
                        if result["ok"]:
                            published_count += 1
                            logger.info(f"✅ [SCHEDULER] Published snapshot: {snapshot.booking_id}")
                        else:
                            failed_count += 1
                            logger.warning(f"⚠️ [SCHEDULER] Failed to publish: {result.get('error')}")
                    except Exception as e:
                        failed_count += 1
                        logger.error(f"❌ [SCHEDULER] Error publishing snapshot: {str(e)}")
                
                logger.info(f"📊 [SCHEDULER] Sync complete: {published_count} published, {failed_count} failed")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ [SCHEDULER] Error in sync task: {str(e)}", exc_info=True)
    
    def reconcile_published_snapshots(self):
        """Periodically re-sync published snapshots with latest IoT/pest data"""
        try:
            from app.connections.postgres_connection import SessionLocal
            from app.services.market_sync import (
                list_snapshots_by_status,
                reconcile_snapshot_with_latest_data
            )
            
            logger.info("🔄 [SCHEDULER] Reconciling published snapshots with latest data...")
            
            db = SessionLocal()
            try:
                # Get published snapshots
                snapshots = list_snapshots_by_status(db, "published", limit=50)
                
                if not snapshots:
                    logger.debug("ℹ️ [SCHEDULER] No published snapshots to reconcile")
                    return
                
                logger.info(f"📦 [SCHEDULER] Reconciling {len(snapshots)} published snapshots")
                
                reconciled_count = 0
                
                for snapshot in snapshots:
                    try:
                        success = reconcile_snapshot_with_latest_data(db, str(snapshot.booking_id))
                        if success:
                            reconciled_count += 1
                            logger.debug(f"✅ [SCHEDULER] Reconciled: {snapshot.booking_id}")
                    except Exception as e:
                        logger.warning(f"⚠️ [SCHEDULER] Error reconciling {snapshot.booking_id}: {str(e)}")
                
                logger.info(f"✅ [SCHEDULER] Reconciliation complete: {reconciled_count}/{len(snapshots)} updated")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ [SCHEDULER] Error in reconcile task: {str(e)}", exc_info=True)
    
    def cleanup_old_snapshots(self):
        """Periodically delete completed snapshots older than 90 days"""
        try:
            from app.connections.postgres_connection import SessionLocal
            from app.services.market_sync import delete_old_snapshots
            
            logger.info("🗑️ [SCHEDULER] Cleaning up old snapshots...")
            
            db = SessionLocal()
            try:
                deleted_count = delete_old_snapshots(db, days_old=90)
                logger.info(f"🗑️ [SCHEDULER] Deleted {deleted_count} old snapshots")
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ [SCHEDULER] Error in cleanup task: {str(e)}", exc_info=True)
    
    def start(self, sync_interval_seconds: int = 300, reconcile_interval_minutes: int = 30):
        """
        Start the scheduler with configured intervals
        
        Args:
            sync_interval_seconds: How often to publish ready snapshots (default: 5 minutes)
            reconcile_interval_minutes: How often to reconcile published snapshots (default: 30 minutes)
        """
        if self.is_running:
            logger.warning("⚠️ [SCHEDULER] Scheduler already running")
            return
        
        try:
            # Schedule snapshot publishing (every 5 minutes)
            self.scheduler.add_job(
                self.sync_ready_snapshots,
                trigger=IntervalTrigger(seconds=sync_interval_seconds),
                id="sync_ready_snapshots",
                name="Sync ready snapshots to Market Connect",
                replace_existing=True,
                misfire_grace_time=60
            )
            logger.info(f"⏱️ [SCHEDULER] Snapshot sync scheduled: every {sync_interval_seconds}s")
            
            # Schedule reconciliation (every 30 minutes)
            self.scheduler.add_job(
                self.reconcile_published_snapshots,
                trigger=IntervalTrigger(minutes=reconcile_interval_minutes),
                id="reconcile_published_snapshots",
                name="Reconcile published snapshots with latest data",
                replace_existing=True,
                misfire_grace_time=60
            )
            logger.info(f"⏱️ [SCHEDULER] Snapshot reconciliation scheduled: every {reconcile_interval_minutes}m")
            
            # Schedule cleanup (every 24 hours)
            self.scheduler.add_job(
                self.cleanup_old_snapshots,
                trigger=IntervalTrigger(hours=24),
                id="cleanup_old_snapshots",
                name="Clean up old completed snapshots",
                replace_existing=True,
                misfire_grace_time=60
            )
            logger.info("⏱️ [SCHEDULER] Snapshot cleanup scheduled: every 24h")
            
            # Start the scheduler
            self.scheduler.start()
            self.is_running = True
            logger.info("✅ [SCHEDULER] Market Snapshot Scheduler started successfully")
            
        except Exception as e:
            logger.error(f"❌ [SCHEDULER] Failed to start scheduler: {str(e)}", exc_info=True)
            raise
    
    def stop(self):
        """Stop the scheduler"""
        if not self.is_running:
            logger.warning("⚠️ [SCHEDULER] Scheduler not running")
            return
        
        try:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("✅ [SCHEDULER] Market Snapshot Scheduler stopped")
        except Exception as e:
            logger.error(f"❌ [SCHEDULER] Error stopping scheduler: {str(e)}", exc_info=True)


# Global instance
market_scheduler = MarketSnapshotScheduler()


def init_market_scheduler():
    """Initialize the market snapshot scheduler (call during app startup)"""
    try:
        # Check if APScheduler is installed
        import apscheduler
        market_scheduler.start(
            sync_interval_seconds=3600,     # Publish every 1 hour
            reconcile_interval_minutes=60   # Reconcile every 1 hour
        )
        return True
    except ImportError:
        logger.warning("⚠️ [SCHEDULER] APScheduler not installed. Install with: pip install apscheduler")
        return False
    except Exception as e:
        logger.error(f"❌ [SCHEDULER] Failed to initialize scheduler: {str(e)}")
        return False


def shutdown_market_scheduler():
    """Shutdown the market snapshot scheduler (call during app shutdown)"""
    market_scheduler.stop()
