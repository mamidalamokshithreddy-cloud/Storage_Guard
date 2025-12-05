import sqlalchemy as sa
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

print('\n🗑️ CLEANING OLD SNAPSHOTS')
print('='*80)

with engine.connect() as conn:
    # Count total snapshots
    result = conn.execute(text("SELECT COUNT(*) FROM market_inventory_snapshots"))
    total_before = result.fetchone()[0]
    print(f'Total snapshots before: {total_before}')
    
    # Find snapshots older than 1 hour
    cutoff_time = datetime.now() - timedelta(hours=1)
    result = conn.execute(text("""
        SELECT COUNT(*) FROM market_inventory_snapshots 
        WHERE created_at < NOW() - INTERVAL '5 hours'
    """))
    old_count = result.fetchone()[0]
    print(f'Old snapshots (>5 hours old): {old_count}')
    
    # Delete old snapshots
    result = conn.execute(text("""
        DELETE FROM market_inventory_snapshots 
        WHERE created_at < NOW() - INTERVAL '5 hours'
    """))
    conn.commit()
    
    print(f'\n✅ Deleted {old_count} old snapshots')
    
    # Count remaining
    result = conn.execute(text("SELECT COUNT(*) FROM market_inventory_snapshots"))
    total_after = result.fetchone()[0]
    print(f'Total snapshots after: {total_after}')
    
    print(f'\n📊 Summary:')
    print(f'  Before: {total_before}')
    print(f'  Deleted: {old_count}')
    print(f'  After: {total_after}')
