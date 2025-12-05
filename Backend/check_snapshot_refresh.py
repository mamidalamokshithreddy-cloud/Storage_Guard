import sqlalchemy as sa
from sqlalchemy import create_engine, text
from datetime import datetime

engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture', isolation_level="AUTOCOMMIT")

print('\n🔍 CHECKING SNAPSHOT REFRESH STATUS')
print('='*80)

with engine.connect() as conn:
    
    # Check snapshot update times
    print('\n📸 SNAPSHOT LAST UPDATED:')
    print('-'*80)
    result = conn.execute(text("""
        SELECT 
            crop_type,
            created_at AT TIME ZONE 'Asia/Kolkata' as created,
            updated_at AT TIME ZONE 'Asia/Kolkata' as updated,
            last_synced_at AT TIME ZONE 'Asia/Kolkata' as last_sync,
            status,
            EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_since_update
        FROM market_inventory_snapshots
        ORDER BY created_at DESC
    """))
    
    for row in result.fetchall():
        print(f'\n  Crop: {row[0]}')
        print(f'    Created: {row[1]}')
        print(f'    Updated: {row[2]}')
        print(f'    Last Sync: {row[3]}')
        print(f'    Status: {row[4]}')
        print(f'    Minutes Since Update: {row[5]:.1f}')
        
        if row[5] > 10:
            print(f'    ⚠️ NOT REFRESHING - Last update was {row[5]:.0f} minutes ago!')
        else:
            print(f'    ✅ Recently updated')
    
    # Check sensor readings update times
    print('\n\n📡 SENSOR READINGS LAST UPDATED:')
    print('-'*80)
    result = conn.execute(text("""
        SELECT 
            sensor_type,
            device_id,
            last_reading AT TIME ZONE 'Asia/Kolkata' as last_reading,
            EXTRACT(EPOCH FROM (NOW() - last_reading))/60 as minutes_ago
        FROM iot_sensors
        ORDER BY last_reading DESC
        LIMIT 5
    """))
    
    for row in result.fetchall():
        print(f'  {row[0]}: Last reading {row[3]:.1f} minutes ago ({row[2]})')
    
    # Check if sensors data is in snapshots
    print('\n\n📊 SENSOR DATA IN SNAPSHOTS:')
    print('-'*80)
    result = conn.execute(text("""
        SELECT 
            crop_type,
            sensors::text as sensor_data,
            sensor_summary::text as sensor_summary
        FROM market_inventory_snapshots
    """))
    
    for row in result.fetchall():
        print(f'\n  Crop: {row[0]}')
        if row[1] and row[1] != '{}' and row[1] != 'null':
            print(f'    Sensors: {row[1][:200]}...')
        else:
            print(f'    ⚠️ Sensors: EMPTY - No sensor data!')
        
        if row[2] and row[2] != '{}' and row[2] != 'null':
            print(f'    Summary: {row[2][:200]}...')
        else:
            print(f'    ⚠️ Summary: EMPTY - No sensor summary!')
    
    # Check scheduler status
    print('\n\n⏰ SCHEDULER STATUS:')
    print('-'*80)
    
    # Check .env for scheduler setting
    import os
    env_path = 'C:/Users/ee/Desktop/Storage_Guard/.env'
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            env_content = f.read()
            if 'ENABLE_SCHEDULER=true' in env_content.lower():
                print('  ✅ ENABLE_SCHEDULER=true (Scheduler should be running)')
            elif 'ENABLE_SCHEDULER=false' in env_content.lower():
                print('  ⚠️ ENABLE_SCHEDULER=false (Scheduler is DISABLED!)')
            else:
                print('  ℹ️ ENABLE_SCHEDULER not set (Default: depends on code)')
    
    print('\n\n' + '='*80)
    print('🔍 DIAGNOSIS:')
    print('='*80)
    
    result = conn.execute(text("""
        SELECT 
            MAX(EXTRACT(EPOCH FROM (NOW() - updated_at))/60) as max_minutes,
            AVG(EXTRACT(EPOCH FROM (NOW() - updated_at))/60) as avg_minutes
        FROM market_inventory_snapshots
    """))
    
    max_min, avg_min = result.fetchone()
    
    print(f'  Max time since snapshot update: {max_min:.1f} minutes')
    print(f'  Avg time since snapshot update: {avg_min:.1f} minutes')
    
    if max_min > 10:
        print('\n  ❌ PROBLEM: Snapshots are NOT being refreshed!')
        print('  📋 Possible causes:')
        print('     1. Scheduler is disabled in .env')
        print('     2. Scheduler not running in main.py')
        print('     3. Sync function has errors')
        print('\n  🔧 Solution:')
        print('     1. Enable scheduler: ENABLE_SCHEDULER=true in .env')
        print('     2. Restart backend server')
        print('     3. Check logs for errors')
    else:
        print('\n  ✅ Snapshots are being updated regularly!')
    
    print('\n' + '='*80)
