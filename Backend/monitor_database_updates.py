import sqlalchemy as sa
from sqlalchemy import create_engine, text
import time
from datetime import datetime

engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture', isolation_level="AUTOCOMMIT")

print('\n🔍 REAL-TIME DATABASE MONITORING')
print('='*80)
print('Watching for automatic updates in market_inventory_snapshots...')
print('Press Ctrl+C to stop\n')

try:
    previous_updated_at = {}
    
    for i in range(10):  # Monitor for 10 iterations (50 seconds)
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT 
                    id,
                    crop_type,
                    updated_at,
                    last_synced_at,
                    sensors::text
                FROM market_inventory_snapshots
                ORDER BY crop_type
            """))
            
            current_time = datetime.now().strftime('%H:%M:%S')
            print(f'\n[{current_time}] Check #{i+1}:')
            print('-'*80)
            
            rows = result.fetchall()
            changes_detected = False
            
            for row in rows:
                snap_id = str(row[0])
                crop = row[1]
                updated_at = row[2]
                last_synced = row[3]
                sensors = row[4][:100] if row[4] else 'None'
                
                # Check if updated_at changed
                if snap_id in previous_updated_at:
                    if previous_updated_at[snap_id] != updated_at:
                        print(f'  🔄 {crop}: UPDATED!')
                        print(f'     Old: {previous_updated_at[snap_id]}')
                        print(f'     New: {updated_at}')
                        changes_detected = True
                    else:
                        print(f'  ⏸️ {crop}: No change (last update: {updated_at})')
                else:
                    print(f'  📊 {crop}: Initial read (updated_at: {updated_at})')
                
                previous_updated_at[snap_id] = updated_at
            
            if not changes_detected and i > 0:
                print('\n  ⚠️ NO CHANGES DETECTED - Database not auto-updating!')
        
        if i < 9:
            print(f'\nWaiting 5 seconds before next check...')
            time.sleep(5)
    
    print('\n\n' + '='*80)
    print('📊 MONITORING COMPLETE')
    print('='*80)
    
    # Final analysis
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                crop_type,
                updated_at AT TIME ZONE 'Asia/Kolkata' as updated,
                last_synced_at AT TIME ZONE 'Asia/Kolkata' as synced,
                EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_ago
            FROM market_inventory_snapshots
        """))
        
        print('\nFinal Status:')
        for row in result.fetchall():
            print(f'  {row[0]}: Last updated {row[3]:.1f} minutes ago ({row[1]})')
        
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM market_inventory_snapshots 
            WHERE updated_at > NOW() - INTERVAL '1 minute'
        """))
        
        recent_updates = result.fetchone()[0]
        
        if recent_updates > 0:
            print(f'\n  ✅ {recent_updates} snapshot(s) updated in last minute')
            print('  ✅ Database IS auto-updating!')
        else:
            print('\n  ❌ No updates in last minute')
            print('  ❌ Database NOT auto-updating!')
            print('\n  🔧 Check:')
            print('     1. Is backend server running?')
            print('     2. Is scheduler enabled in main.py?')
            print('     3. Check backend logs for errors')

except KeyboardInterrupt:
    print('\n\nMonitoring stopped by user.')
