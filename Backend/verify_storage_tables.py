import sqlalchemy as sa
from sqlalchemy import create_engine, text, inspect

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

print('\n🔍 STORAGE GUARD TABLES VERIFICATION')
print('='*80)

with engine.connect() as conn:
    inspector = inspect(engine)
    
    # List of Storage Guard related tables
    storage_tables = [
        'storage_bookings',
        'market_inventory_snapshots',
        'storage_locations',
        'storage_vendors',
        'crop_inspections',
        'iot_sensors',
        'sensor_readings',
        'pest_detections',
        'scheduled_inspections',
        'storage_rfq',
        'storage_bids',
        'storage_jobs'
    ]
    
    print('\n📊 TABLE STATUS:')
    print('-'*80)
    
    existing_tables = []
    for table in storage_tables:
        try:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.fetchone()[0]
            print(f'✅ {table:<35} Exists | Rows: {count}')
            existing_tables.append(table)
        except Exception as e:
            print(f'❌ {table:<35} Does not exist or error: {str(e)[:50]}')
    
    print('\n\n🔗 CHECKING KEY RELATIONSHIPS:')
    print('-'*80)
    
    # Check storage_bookings columns
    if 'storage_bookings' in existing_tables:
        print('\n📋 storage_bookings columns:')
        columns = inspector.get_columns('storage_bookings')
        for col in columns:
            col_type = str(col['type'])
            nullable = 'NULL' if col['nullable'] else 'NOT NULL'
            default = f"DEFAULT: {col.get('server_default', 'None')}" if col.get('server_default') else ''
            print(f"  - {col['name']:<25} {col_type:<20} {nullable:<10} {default}")
    
    # Check market_inventory_snapshots columns
    if 'market_inventory_snapshots' in existing_tables:
        print('\n📸 market_inventory_snapshots columns:')
        columns = inspector.get_columns('market_inventory_snapshots')
        for col in columns:
            col_type = str(col['type'])
            nullable = 'NULL' if col['nullable'] else 'NOT NULL'
            default = f"DEFAULT: {col.get('server_default', 'None')}" if col.get('server_default') else ''
            print(f"  - {col['name']:<25} {col_type:<20} {nullable:<10} {default}")
    
    # Check constraints and indexes
    print('\n\n🔐 CONSTRAINTS & INDEXES:')
    print('-'*80)
    
    if 'market_inventory_snapshots' in existing_tables:
        print('\n📸 market_inventory_snapshots constraints:')
        
        # Check unique constraints
        unique_constraints = inspector.get_unique_constraints('market_inventory_snapshots')
        if unique_constraints:
            for uc in unique_constraints:
                print(f"  ✅ UNIQUE: {uc['name']} on columns: {uc['column_names']}")
        else:
            print('  ⚠️ No unique constraints found')
        
        # Check indexes
        indexes = inspector.get_indexes('market_inventory_snapshots')
        if indexes:
            for idx in indexes:
                unique = 'UNIQUE' if idx['unique'] else 'NON-UNIQUE'
                print(f"  📌 INDEX: {idx['name']:<40} {unique} on {idx['column_names']}")
        
        # Check foreign keys
        foreign_keys = inspector.get_foreign_keys('market_inventory_snapshots')
        if foreign_keys:
            print('\n  🔗 Foreign Keys:')
            for fk in foreign_keys:
                print(f"    - {fk['constrained_columns']} → {fk['referred_table']}.{fk['referred_columns']}")
    
    # Check if triggers exist
    print('\n\n⚡ CHECKING TRIGGERS:')
    print('-'*80)
    
    result = conn.execute(text("""
        SELECT 
            trigger_name,
            event_object_table,
            action_timing,
            event_manipulation
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
        AND event_object_table IN ('storage_bookings', 'market_inventory_snapshots')
        ORDER BY event_object_table, trigger_name
    """))
    
    triggers = result.fetchall()
    if triggers:
        for trigger in triggers:
            print(f"✅ {trigger[1]:<35} {trigger[0]:<40} {trigger[2]} {trigger[3]}")
    else:
        print('⚠️ No triggers found on storage_bookings or market_inventory_snapshots')
    
    print('\n\n✅ VERIFICATION COMPLETE!')
    print('='*80)
