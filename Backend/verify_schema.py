import sqlalchemy as sa
from sqlalchemy import create_engine, text, inspect

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

print('\n🔍 VERIFYING DATABASE SCHEMA')
print('='*80)

inspector = inspect(engine)

# Check storage_bookings table
print('\n📋 TABLE: storage_bookings')
print('-'*80)
if 'storage_bookings' in inspector.get_table_names():
    columns = inspector.get_columns('storage_bookings')
    for col in columns:
        nullable = "NULL" if col['nullable'] else "NOT NULL"
        default = f"DEFAULT: {col['default']}" if col['default'] else ""
        print(f"  ✓ {col['name']:<25} {str(col['type']):<30} {nullable:<10} {default}")
    
    # Check constraints
    pk = inspector.get_pk_constraint('storage_bookings')
    print(f"\n  Primary Key: {pk['constrained_columns']}")
    
    fks = inspector.get_foreign_keys('storage_bookings')
    print(f"  Foreign Keys: {len(fks)}")
    for fk in fks:
        print(f"    - {fk['constrained_columns']} → {fk['referred_table']}.{fk['referred_columns']}")
else:
    print("  ❌ Table does not exist!")

# Check market_inventory_snapshots table
print('\n📋 TABLE: market_inventory_snapshots')
print('-'*80)
if 'market_inventory_snapshots' in inspector.get_table_names():
    columns = inspector.get_columns('market_inventory_snapshots')
    for col in columns:
        nullable = "NULL" if col['nullable'] else "NOT NULL"
        default = f"DEFAULT: {col['default']}" if col['default'] else ""
        print(f"  ✓ {col['name']:<25} {str(col['type']):<30} {nullable:<10} {default}")
    
    # Check constraints
    pk = inspector.get_pk_constraint('market_inventory_snapshots')
    print(f"\n  Primary Key: {pk['constrained_columns']}")
    
    fks = inspector.get_foreign_keys('market_inventory_snapshots')
    print(f"  Foreign Keys: {len(fks)}")
    for fk in fks:
        print(f"    - {fk['constrained_columns']} → {fk['referred_table']}.{fk['referred_columns']}")
    
    # Check unique constraints
    unique = inspector.get_unique_constraints('market_inventory_snapshots')
    if unique:
        print(f"  Unique Constraints: {len(unique)}")
        for u in unique:
            print(f"    - {u['column_names']}")
else:
    print("  ❌ Table does not exist!")

# Check if timestamps use correct defaults
print('\n⏰ TIMESTAMP VERIFICATION')
print('-'*80)

with engine.connect() as conn:
    # Check storage_bookings timestamp defaults
    result = conn.execute(text("""
        SELECT column_name, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'storage_bookings' 
        AND column_name IN ('created_at', 'updated_at')
        ORDER BY ordinal_position
    """))
    
    print("storage_bookings timestamps:")
    for row in result:
        status = "✅" if "now()" in str(row[1]).lower() else "❌"
        print(f"  {status} {row[0]:<15} DEFAULT: {row[1]}")
    
    # Check market_inventory_snapshots timestamp defaults
    result = conn.execute(text("""
        SELECT column_name, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'market_inventory_snapshots' 
        AND column_name IN ('created_at', 'updated_at')
        ORDER BY ordinal_position
    """))
    
    print("\nmarket_inventory_snapshots timestamps:")
    for row in result:
        status = "✅" if "now()" in str(row[1]).lower() else "❌"
        print(f"  {status} {row[0]:<15} DEFAULT: {row[1]}")

print('\n✅ Schema verification complete!')
