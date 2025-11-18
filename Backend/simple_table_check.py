import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

# Database configuration
POSTGRES_USER = os.getenv('DB_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('DB_PASSWORD', 'Mani8143')
POSTGRES_HOST = os.getenv('DB_HOST', 'localhost')
POSTGRES_PORT = os.getenv('DB_PORT', '5432')
POSTGRES_DB = os.getenv('DB_NAME', 'Agriculture')

# Create PostgreSQL connection
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

def check_transport_tables():
    """Check if transport and logistics tables exist"""
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Get all table names
            query = text("""
                SELECT table_name, column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name IN (
                    'transport_vehicles',
                    'transport_routes', 
                    'route_tracking',
                    'logistics_providers',
                    'delivery_tracking'
                )
                ORDER BY table_name, ordinal_position
            """)
            
            result = connection.execute(query)
            tables_data = {}
            
            for row in result:
                table_name = row[0]
                column_name = row[1]
                data_type = row[2]
                is_nullable = row[3]
                
                if table_name not in tables_data:
                    tables_data[table_name] = []
                
                tables_data[table_name].append({
                    'column': column_name,
                    'type': data_type,
                    'nullable': is_nullable
                })
            
            print("TRANSPORT & LOGISTICS TABLES:")
            print("=" * 50)
            
            for table_name, columns in tables_data.items():
                print(f"\nTable: {table_name}")
                print(f"Columns: {len(columns)}")
                print("-" * 30)
                for col in columns[:5]:  # Show first 5 columns
                    nullable = "NULL" if col['nullable'] == 'YES' else "NOT NULL"
                    print(f"  {col['column']:20} {col['type']:15} {nullable}")
                if len(columns) > 5:
                    print(f"  ... and {len(columns) - 5} more columns")
            
            # Check total table count
            total_query = text("SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public'")
            total_result = connection.execute(total_query)
            total_count = total_result.fetchone()[0]
            
            print(f"\nSUMMARY:")
            print(f"Transport tables found: {len(tables_data)}/5")
            print(f"Total database tables: {total_count}")
            
            return len(tables_data) == 5
            
    except Exception as e:
        print(f"Error checking tables: {e}")
        return False

if __name__ == "__main__":
    success = check_transport_tables()
    if success:
        print("\n✅ All transport tables are properly created!")
    else:
        print("\n❌ Some transport tables are missing!")