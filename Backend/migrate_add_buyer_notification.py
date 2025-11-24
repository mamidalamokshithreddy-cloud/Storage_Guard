"""
Add notification_enabled column to buyer_preferences table
"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

def add_notification_column():
    """Add notification_enabled and price_alert_threshold columns if they don't exist"""
    with engine.connect() as conn:
        # Check if notification_enabled column exists
        check_sql = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='buyer_preferences' 
            AND column_name='notification_enabled';
        """)
        
        result = conn.execute(check_sql)
        exists = result.fetchone() is not None
        
        if not exists:
            print("Adding notification_enabled column to buyer_preferences table...")
            add_column_sql = text("""
                ALTER TABLE buyer_preferences 
                ADD COLUMN notification_enabled BOOLEAN DEFAULT TRUE;
            """)
            conn.execute(add_column_sql)
            conn.commit()
            print("✅ notification_enabled column added successfully!")
        else:
            print("✅ notification_enabled column already exists, skipping.")
        
        # Check if price_alert_threshold column exists
        check_sql2 = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='buyer_preferences' 
            AND column_name='price_alert_threshold';
        """)
        
        result2 = conn.execute(check_sql2)
        exists2 = result2.fetchone() is not None
        
        if not exists2:
            print("Adding price_alert_threshold column to buyer_preferences table...")
            add_column_sql2 = text("""
                ALTER TABLE buyer_preferences 
                ADD COLUMN price_alert_threshold NUMERIC(10, 2);
            """)
            conn.execute(add_column_sql2)
            conn.commit()
            print("✅ price_alert_threshold column added successfully!")
        else:
            print("✅ price_alert_threshold column already exists, skipping.")

if __name__ == "__main__":
    print("=" * 60)
    print("BUYER PREFERENCES NOTIFICATION MIGRATION")
    print("=" * 60)
    
    try:
        add_notification_column()
        print("\n✅ Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
