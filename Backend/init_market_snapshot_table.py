"""
Database Migration Script - Create Market Inventory Snapshot Table
This script creates the market_inventory_snapshots table if it doesn't exist.
Run this after updating postgres_base.py with the MarketInventorySnapshot model.
"""

import logging
import sys
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_migration():
    """Run database migration"""
    try:
        logger.info("🔄 [MIGRATION] Starting database migration...")
        
        # Import after configuring logging
        from app.connections.postgres_connection import engine, Base, SessionLocal
        from app.schemas.postgres_base import MarketInventorySnapshot
        
        logger.info("✅ [MIGRATION] Imported models successfully")
        
        # Create all tables defined in Base.metadata
        logger.info("📝 [MIGRATION] Creating tables in database...")
        Base.metadata.create_all(bind=engine)
        
        logger.info("✅ [MIGRATION] Tables created successfully")
        
        # Verify the table exists
        with engine.connect() as conn:
            # Check if market_inventory_snapshots table exists
            inspector = conn.connection.cursor()
            try:
                # Try to query from the table to verify it exists
                inspector.execute("SELECT 1 FROM market_inventory_snapshots LIMIT 1")
                logger.info("✅ [MIGRATION] Verified: market_inventory_snapshots table exists")
            except Exception as e:
                if "does not exist" in str(e) or "no such table" in str(e):
                    logger.warning("⚠️ [MIGRATION] Table still doesn't exist - may need manual creation")
                    raise
        
        logger.info("🎉 [MIGRATION] Database migration completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ [MIGRATION] Migration failed: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
