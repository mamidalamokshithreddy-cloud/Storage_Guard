"""
Migration: Add freshness and visual defect fields to crop_inspections table
Date: 2025-11-18
Purpose: Store enhanced computer vision analysis results
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "agrihub"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "123")
}

def run_migration():
    """Add freshness analysis fields to crop_inspections table"""
    
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("🔄 Starting freshness fields migration...")
        
        # Check if columns already exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'crop_inspections' 
            AND column_name IN ('freshness', 'freshness_score', 'visual_defects')
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        migrations = []
        
        # Add freshness column
        if 'freshness' not in existing_columns:
            migrations.append("""
                ALTER TABLE crop_inspections 
                ADD COLUMN freshness VARCHAR(120)
            """)
            print("  ➕ Will add 'freshness' column")
        else:
            print("  ✅ Column 'freshness' already exists")
        
        # Add freshness_score column
        if 'freshness_score' not in existing_columns:
            migrations.append("""
                ALTER TABLE crop_inspections 
                ADD COLUMN freshness_score NUMERIC(3, 2)
            """)
            print("  ➕ Will add 'freshness_score' column")
        else:
            print("  ✅ Column 'freshness_score' already exists")
        
        # Add visual_defects column
        if 'visual_defects' not in existing_columns:
            migrations.append("""
                ALTER TABLE crop_inspections 
                ADD COLUMN visual_defects TEXT
            """)
            print("  ➕ Will add 'visual_defects' column")
        else:
            print("  ✅ Column 'visual_defects' already exists")
        
        # Run migrations
        if migrations:
            for sql in migrations:
                cursor.execute(sql)
            
            conn.commit()
            print(f"\n✅ Successfully added {len(migrations)} new column(s)!")
        else:
            print("\n✅ All columns already exist - no migration needed")
        
        # Update existing records with default values
        cursor.execute("""
            UPDATE crop_inspections 
            SET freshness = 'N/A',
                freshness_score = 0.0,
                visual_defects = 'None'
            WHERE freshness IS NULL
        """)
        updated_count = cursor.rowcount
        
        if updated_count > 0:
            conn.commit()
            print(f"📝 Updated {updated_count} existing record(s) with default values")
        
        # Verify the migration
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'crop_inspections' 
            AND column_name IN ('freshness', 'freshness_score', 'visual_defects')
            ORDER BY column_name
        """)
        
        print("\n📋 Final column structure:")
        for row in cursor.fetchall():
            print(f"   {row[0]}: {row[1]}")
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("FRESHNESS FIELDS MIGRATION")
    print("=" * 60)
    run_migration()
    print("\n✅ Migration completed successfully!")
    print("=" * 60)
