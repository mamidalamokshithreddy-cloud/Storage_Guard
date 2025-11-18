#!/usr/bin/env python3
"""
Migration script to add shelf_life_days column to crop_inspections table
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_add_shelf_life_column():
    """Add shelf_life_days column to crop_inspections table"""
    
    try:
        # Build PostgreSQL URL from individual DB_ variables
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "postgres")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "agri_copilot")
        
        database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        logger.info(f"🔗 Connecting to: postgresql://{db_user}:****@{db_host}:{db_port}/{db_name}")
        
        # Create engine and session
        engine = create_engine(database_url)
        Session = sessionmaker(bind=engine)
        db = Session()
        
        logger.info("🔄 Starting migration to add shelf_life_days column...")
        
        # Check if column already exists
        check_column_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='crop_inspections' AND column_name='shelf_life_days';
        """)
        
        result = db.execute(check_column_query).fetchone()
        
        if result:
            logger.info("✅ Column 'shelf_life_days' already exists in crop_inspections table")
            return
        
        # Add the column (nullable integer)
        logger.info("➕ Adding shelf_life_days column to crop_inspections table...")
        add_column_query = text("""
            ALTER TABLE crop_inspections 
            ADD COLUMN shelf_life_days INTEGER;
        """)
        db.execute(add_column_query)
        
        # Commit the changes
        db.commit()
        
        logger.info(f"✅ Migration completed successfully!")
        logger.info(f"   - Added shelf_life_days column to crop_inspections table")
        logger.info(f"   - Column is nullable and will default to NULL for existing records")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    migrate_add_shelf_life_column()
