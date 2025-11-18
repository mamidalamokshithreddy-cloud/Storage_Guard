#!/usr/bin/env python3
"""
Test script to verify user approval functionality
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
from app.schemas.postgres_base import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_user_approval():
    """Test the user approval functionality"""
    
    try:
        # Get database session
        db = next(get_db())
        
        logger.info("🔄 Testing user approval functionality...")
        
        # Get all non-admin users who are not approved
        unapproved_users = db.query(User).filter(
            User.role != "admin",
            User.is_approved == False
        ).all()
        
        logger.info(f"Found {len(unapproved_users)} unapproved users:")
        for user in unapproved_users:
            logger.info(f"  - {user.email} ({user.role}): is_approved={user.is_approved}")
        
        # Get all admin users
        admin_users = db.query(User).filter(User.role == "admin").all()
        logger.info(f"Found {len(admin_users)} admin users:")
        for user in admin_users:
            logger.info(f"  - {user.email}: is_approved={user.is_approved}")
        
        # Test manual approval of first unapproved user (if any)
        if unapproved_users:
            test_user = unapproved_users[0]
            logger.info(f"Testing approval of user: {test_user.email}")
            
            # Update approval status
            test_user.is_approved = True
            test_user.is_verified = True
            
            # Commit and refresh
            db.commit()
            db.refresh(test_user)
            
            logger.info(f"After update: {test_user.email} is_approved={test_user.is_approved}")
            
            # Verify the change persisted
            db.close()
            db = next(get_db())
            
            verified_user = db.query(User).filter(User.id == test_user.id).first()
            logger.info(f"After refresh: {verified_user.email} is_approved={verified_user.is_approved}")
            
            if verified_user.is_approved:
                logger.info("✅ Test PASSED: User approval persisted to database")
            else:
                logger.error("❌ Test FAILED: User approval did NOT persist to database")
                
            # Revert the change for testing
            verified_user.is_approved = False
            verified_user.is_verified = False
            db.commit()
            logger.info("🔄 Reverted test change")
        else:
            logger.info("No unapproved users found to test with")
        
    except Exception as e:
        logger.error(f"❌ Test failed: {str(e)}")
        if 'db' in locals():
            db.rollback()
        raise
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    test_user_approval()