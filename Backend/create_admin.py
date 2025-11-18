#!/usr/bin/env python3
"""
Database initialization script for AgriHub
Creates all database tables and sets up initial data
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables from .env file (look in parent directory)
env_path = backend_dir.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Verify .env file was found
if env_path.exists():
    print(f"✅ Found .env file at: {env_path}")
else:
    print(f"⚠️  .env file not found at: {env_path}")
    print("   Looking for .env in current directory...")
    load_dotenv()  # Fallback to current directory

# Now, import application modules after .env is loaded
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.schemas.postgres_base import Base, User, UserRole, Admin
from app.services.auth_service import AuthService
import logging
from datetime import datetime
from uuid import uuid4

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection from environment variables
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# Validate that all required variables are loaded
if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
    logger.error("❌ Missing required database environment variables!")
    logger.error("   Please ensure .env file contains: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME")
    sys.exit(1)

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Log connection details (without password for security)
logger.info(f"🔗 Database connection configured:")
logger.info(f"   Host: {DB_HOST}:{DB_PORT}")
logger.info(f"   Database: {DB_NAME}")
logger.info(f"   User: {DB_USER}")

def validate_environment():
    """Validate that all required environment variables are set"""
    required_vars = ["DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_NAME"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("   Please check your .env file in the project root")
        return False
    
    logger.info("✅ All required environment variables are set")
    return True

def test_database_connection():
    """Test database connection before proceeding"""
    try:
        logger.info("🔌 Testing database connection...")
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).fetchone()
            if result[0] == 1:
                logger.info("✅ Database connection successful")
                engine.dispose()
                return True
            else:
                logger.error("❌ Database connection test failed")
                engine.dispose()
                return False
                
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def create_database_if_not_exists():
    """Create the database if it doesn't exist"""
    try:
        # Connect to postgres database to create agrihub database
        postgres_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"
        engine = create_engine(postgres_url)
        
        with engine.connect() as conn:
            # Set autocommit mode
            conn.execute(text("COMMIT;"))
            
            # Check if database exists
            result = conn.execute(text(
                "SELECT 1 FROM pg_database WHERE datname = :db_name"
            ), {"db_name": DB_NAME}).fetchone()
            
            if not result:
                logger.info(f"Creating {DB_NAME} database...")
                conn.execute(text(f'CREATE DATABASE "{DB_NAME}"'))
                logger.info(f"✅ {DB_NAME} database created successfully")
            else:
                logger.info(f"📋 {DB_NAME} database already exists")
                
        engine.dispose()
        
    except Exception as e:
        logger.error(f"❌ Error creating database: {e}")
        raise

def create_all_tables():
    """Create all database tables"""
    try:
        logger.info("🔧 Creating database tables...")
        
        engine = create_engine(DATABASE_URL)
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        logger.info("✅ All database tables created successfully")
        engine.dispose()
        
    except Exception as e:
        logger.error(f"❌ Error creating tables: {e}")
        raise

def create_admin_user():
    """Create initial admin user"""
    try:
        logger.info("👤 Creating admin user...")
        
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        admin_email = "nbnaik@kisaanparivar.com"
        admin_password = "Nbnaik@1234"
        
        # Ensure password is not too long for bcrypt (max 72 bytes)
        if len(admin_password.encode('utf-8')) > 72:
            logger.warning(f"⚠️  Password is too long for bcrypt, truncating to 72 bytes")
            admin_password = admin_password.encode('utf-8')[:72].decode('utf-8')
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            logger.info(f"📋 Admin user already exists: {admin_email}")
            # Update password in case it changed
            existing_admin.password_hash = AuthService.get_password_hash(admin_password)
            db.commit()
            logger.info("🔄 Admin password updated")
            return existing_admin

        # Create new admin user
        logger.info(f"📝 Creating admin user with role: {UserRole.admin.value}")
        
        # Hash the password
        password_hash = AuthService.get_password_hash(admin_password)
        logger.info(f"🔐 Password hashed successfully")
        
        admin_user = User(
            email=admin_email,
            full_name="BPNaik",
            phone="9515592007",
            role=UserRole.admin.value,  # Use .value to get the string value
            password_hash=password_hash,
            is_active=True,
            is_verified=True,
            address_line1="AgriHub HQ",
            city="HYDERABAD",
            state="TELANGANA",
            country="IN",
            postal_code="500081"
        )
        
        logger.info(f"👤 Adding user to database...")
        db.add(admin_user)
        db.flush()  # Get the user ID
        logger.info(f"✅ User created with ID: {admin_user.id}")
        
        # Create admin profile
        logger.info(f"🔧 Creating admin profile...")
        admin_profile = Admin(
            user_id=admin_user.id,
            is_super_admin=True,
            department="Administration",
            permissions='["all"]'  # JSON string format to match create_admin.py
        )
        
        db.add(admin_profile)
        logger.info(f"💾 Committing changes to database...")
        db.commit()
        logger.info(f"✅ Admin profile created successfully")
        
        logger.info(f"✅ Admin user created successfully:")
        logger.info(f"   📧 Email: {admin_email}")
        logger.info(f"   🔑 Password: {admin_password}")
        logger.info(f"   🆔 User ID: {admin_user.custom_id}")
        
        db.close()
        engine.dispose()
        
        return admin_user
        
    except Exception as e:
        logger.error(f"❌ Error creating admin user: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        raise

def verify_tables():
    """Verify that all required tables exist"""
    try:
        logger.info("🔍 Verifying database tables...")
        
        engine = create_engine(DATABASE_URL)
        
        # List of required tables
        required_tables = [
            'users', 'admins', 'farmers', 'landowners', 
            'vendors', 'buyers', 'agri_copilots'
        ]
        
        with engine.connect() as conn:
            for table in required_tables:
                result = conn.execute(text(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = :table_name)"
                ), {"table_name": table}).fetchone()
                
                if result[0]:
                    logger.info(f"   ✅ Table '{table}' exists")
                else:
                    logger.warning(f"   ⚠️  Table '{table}' is missing")
        
        engine.dispose()
        
    except Exception as e:
        logger.error(f"❌ Error verifying tables: {e}")
        raise

def main():
    """Main initialization function"""
    try:
        logger.info("🚀 Starting AgriHub database initialization...")
        logger.info("=" * 60)
        
        # Step 1: Validate environment variables
        if not validate_environment():
            return False
        
        # Step 2: Test database connection
        if not test_database_connection():
            return False
        
        # Step 3: Create database if it doesn't exist
        create_database_if_not_exists()
        
        # Step 4: Create all tables
        create_all_tables()
        
        # Step 5: Verify tables were created
        verify_tables()
        
        # Step 6: Create admin user
        create_admin_user()
        
        logger.info("=" * 60)
        logger.info("🎉 Database initialization completed successfully!")
        logger.info("🔗 You can now start the FastAPI server")
        
        return True
        
    except Exception as e:
        logger.error(f"💥 Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)