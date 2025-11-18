#!/usr/bin/env python3

from app.connections.postgres_connection import engine
import sqlalchemy as sa

try:
    with engine.connect() as conn:
        # Get all tables
        result = conn.execute(sa.text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"))
        tables = [row[0] for row in result]
        
        print("=== ALL POSTGRESQL TABLES ===")
        for i, table in enumerate(tables, 1):
            print(f"{i:2d}. {table}")

        # Filter Storage Guard related tables
        storage_keywords = ['storage', 'quality', 'iot', 'sensor', 'pest', 'compliance', 'crop_inspection', 'transport', 'logistics', 'delivery', 'route']
        storage_tables = [t for t in tables if any(keyword in t.lower() for keyword in storage_keywords)]

        print(f"\n=== STORAGE GUARD RELATED TABLES ({len(storage_tables)}) ===")
        for i, table in enumerate(storage_tables, 1):
            print(f"{i:2d}. {table}")
            
        # Check each Storage Guard table structure
        print(f"\n=== STORAGE GUARD TABLE DETAILS ===")
        for table in storage_tables:
            try:
                result = conn.execute(sa.text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}' ORDER BY ordinal_position;"))
                columns = list(result)
                print(f"\n{table.upper()} ({len(columns)} columns):")
                for col_name, col_type in columns:
                    print(f"  - {col_name}: {col_type}")
            except Exception as e:
                print(f"  Error getting columns for {table}: {e}")

except Exception as e:
    print(f"Database connection error: {e}")