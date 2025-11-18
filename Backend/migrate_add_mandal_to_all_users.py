#!/usr/bin/env python3
"""
Migration script to add mandal column to farmers, landowners, and buyers tables.
This extends the mandal field functionality to all user types that have address fields.
"""

import sys
import os
from sqlalchemy import text, MetaData

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.connections.postgres_connection import get_db

def main():
    print("🔄 Starting migration: Adding mandal column to farmers, landowners, and buyers tables...")
    
    # Get database connection
    db = next(get_db())
    
    try:
        # Tables to update
        tables_to_update = ['farmers', 'landowners', 'buyers']
        
        for table_name in tables_to_update:
            print(f"\n📋 Processing table: {table_name}")
            
            # Check if mandal column already exists
            check_query = text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = 'mandal'
                AND table_schema = 'public';
            """)
            
            result = db.execute(check_query)
            existing_columns = result.fetchall()
            
            if existing_columns:
                print(f"✅ mandal column already exists in {table_name} table")
                continue
            
            # Add mandal column
            print(f"➕ Adding mandal column to {table_name} table...")
            alter_query = text(f"ALTER TABLE {table_name} ADD COLUMN mandal VARCHAR(100);")
            db.execute(alter_query)
            print(f"✅ Successfully added mandal column to {table_name}")
        
        # Commit all changes
        db.commit()
        print(f"\n🎉 Migration completed successfully!")
        print(f"✅ Added mandal column to: {', '.join(tables_to_update)}")
        
        # Verify the changes
        print(f"\n🔍 Verifying changes...")
        for table_name in tables_to_update:
            verify_query = text(f"""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = 'mandal'
                AND table_schema = 'public';
            """)
            
            result = db.execute(verify_query)
            columns = result.fetchall()
            
            if columns:
                col = columns[0]
                print(f"✅ {table_name}.mandal: {col[1]} (nullable: {col[2]})")
            else:
                print(f"❌ mandal column not found in {table_name}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()