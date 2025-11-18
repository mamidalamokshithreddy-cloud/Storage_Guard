#!/usr/bin/env python3
"""
Migration script to add mandal column to users, agri_copilots, and vendors tables
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Import after path setup
from app.core.config import settings
from app.connections.postgres_connection import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_add_mandal_column():
    """Add mandal column to users, agri_copilots, and vendors tables"""
    
    try:
        # Get database session
        db = next(get_db())
        
        logger.info("🔄 Starting migration to add mandal column...")
        
        # Tables to update
        tables = ['users', 'agri_copilots', 'vendors']
        
        for table in tables:
            logger.info(f"📋 Processing table: {table}")
            
            # Check if column already exists
            check_column_query = text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='{table}' AND column_name='mandal';
            """)
            
            result = db.execute(check_column_query).fetchone()
            
            if result:
                logger.info(f"✅ Column 'mandal' already exists in {table} table")
                continue
            
            # Add the mandal column
            logger.info(f"➕ Adding mandal column to {table} table...")
            add_column_query = text(f"""
                ALTER TABLE {table} 
                ADD COLUMN mandal VARCHAR(100);
            """)
            
            db.execute(add_column_query)
            logger.info(f"✅ Successfully added mandal column to {table} table")
        
        # Commit all changes
        db.commit()
        logger.info("✅ Migration completed successfully! Mandal columns added to all tables.")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main migration function"""
    try:
        migrate_add_mandal_column()
        logger.info("🎉 Migration script completed successfully!")
    except Exception as e:
        logger.error(f"💥 Migration script failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()