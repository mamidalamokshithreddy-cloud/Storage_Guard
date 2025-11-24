"""
Migration: Add compliance_certificates table
For vendor certification tracking (HACCP, ISO22000, FSSAI, etc.)
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
sys.path.insert(0, '.')

from app.schemas import postgres_base as models

# Database connection
DATABASE_URL = "postgresql://postgres:Mani8143@localhost:5432/Agriculture"

def create_compliance_certificates_table():
    """Create compliance_certificates table"""
    engine = create_engine(DATABASE_URL)
    
    print("🔄 Creating compliance_certificates table...")
    
    # Create table using SQLAlchemy models
    try:
        # This will create the table if it doesn't exist
        models.Base.metadata.create_all(
            bind=engine,
            tables=[models.ComplianceCertificate.__table__],
            checkfirst=True
        )
        print("✅ compliance_certificates table created successfully!")
        
        # Verify table exists
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'compliance_certificates'
            """))
            if result.fetchone():
                print("✅ Table verified in database")
            else:
                print("❌ Table creation failed - not found in database")
                
            # Show table structure
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'compliance_certificates'
                ORDER BY ordinal_position
            """))
            
            print("\n📋 Table Structure:")
            for row in result:
                nullable = "NULL" if row[2] == 'YES' else "NOT NULL"
                print(f"   {row[0]:<30} {row[1]:<20} {nullable}")
                
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        raise

if __name__ == "__main__":
    create_compliance_certificates_table()
    print("\n✅ Migration completed!")
