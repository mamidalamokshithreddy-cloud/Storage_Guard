import sqlalchemy as sa
from sqlalchemy import create_engine, text

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

print('\n🗑️ FINAL COMPLETE CLEANUP')
print('='*80)

with engine.connect() as conn:
    # Count everything
    counts = {}
    tables = [
        'storage_bookings',
        'market_inventory_snapshots', 
        'crop_inspections',
        'quality_analysis',
        'rfqs',
        'storage_rfq',
        'iot_sensors',
        'sensor_readings',
        'pest_detections',
        'scheduled_inspections'
    ]
    
    print('📊 BEFORE CLEANUP:')
    for table in tables:
        try:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            counts[table] = result.fetchone()[0]
            if counts[table] > 0:
                print(f'  {table}: {counts[table]}')
        except Exception as e:
            print(f'  {table}: N/A (table may not exist)')
            counts[table] = 0
    
    print('\n🗑️ Deleting all data...')
    
    # Delete in correct order (children first, parents last)
    delete_order = [
        'sensor_readings',          # Child of iot_sensors
        'iot_sensors',
        'pest_detections',
        'market_inventory_snapshots', # Child of storage_bookings
        'quality_analysis',
        'crop_inspections',
        'scheduled_inspections',
        'storage_bookings',
        'storage_rfq',
        'rfqs'
    ]
    
    for table in delete_order:
        if counts.get(table, 0) > 0:
            try:
                conn.execute(text(f"DELETE FROM {table}"))
                conn.commit()  # Commit after each table
                print(f'  ✅ Deleted {counts[table]} rows from {table}')
            except Exception as e:
                conn.rollback()  # Rollback if error
                print(f'  ⚠️ Error deleting from {table}: {e}')
    
    # Verify all tables are empty
    print('\n📊 AFTER CLEANUP:')
    all_clean = True
    for table in tables:
        try:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            after_count = result.fetchone()[0]
            if after_count > 0:
                print(f'  ❌ {table}: {after_count} (still has data!)')
                all_clean = False
            else:
                print(f'  ✅ {table}: 0')
        except Exception as e:
            print(f'  ⚠️ {table}: N/A')
    
    total_deleted = sum(counts.values())
    print(f'\n📊 Total records deleted: {total_deleted}')
    
    if all_clean:
        print('\n✅ DATABASE COMPLETELY CLEAN - Ready for fresh bookings!')
    else:
        print('\n⚠️ Some tables still have data - please check!')
