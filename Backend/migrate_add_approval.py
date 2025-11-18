#!/usr/bin/env python3
"""
Migration script to add is_approved column to users table
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

def migrate_add_approval_column():
    """Add is_approved column to users table and set appropriate defaults"""
    
    try:
        # Get database session
        db = next(get_db())
        
        logger.info("🔄 Starting migration to add is_approved column...")
        
        # Check if column already exists
        check_column_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='is_approved';
        """)
        
        result = db.execute(check_column_query).fetchone()
        
        if result:
            logger.info("✅ Column 'is_approved' already exists in users table")
            return
        
        # Add the column with default value False
        logger.info("➕ Adding is_approved column to users table...")
        add_column_query = text("""
            ALTER TABLE users 
            ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
        """)
        db.execute(add_column_query)
        
        # Set admin users as approved
        logger.info("🔧 Setting admin users as approved...")
        update_admin_query = text("""
            UPDATE users 
            SET is_approved = TRUE 
            WHERE role = 'admin';
        """)
        result = db.execute(update_admin_query)
        admin_count = result.rowcount
        
        # Commit the changes
        db.commit()
        
        logger.info(f"✅ Migration completed successfully!")
        logger.info(f"   - Added is_approved column to users table")
        logger.info(f"   - Set {admin_count} admin user(s) as approved")
        logger.info(f"   - All other users set as not approved (pending approval)")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    migrate_add_approval_column()