from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:Mani8143@localhost:5432/Agriculture')

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'storage_bookings'
        ORDER BY ordinal_position
    """))
    
    print("storage_bookings table columns:")
    for row in result:
        print(f"  {row[0]:<30} {row[1]}")
