import sqlalchemy as sa
from sqlalchemy import create_engine, text

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

print('\n🔍 CHECKING ALL RFQ TABLES')
print('='*80)

with engine.connect() as conn:
    # Check all possible RFQ related tables
    rfq_tables = [
        'rfqs',
        'storage_rfq',
        'storage_bids',
        'rfq_responses',
        'vendor_quotes'
    ]
    
    total_rfqs = 0
    tables_with_data = []
    
    for table in rfq_tables:
        try:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.fetchone()[0]
            if count > 0:
                print(f'❌ {table}: {count} records found!')
                total_rfqs += count
                tables_with_data.append((table, count))
            else:
                print(f'✅ {table}: 0 (clean)')
        except Exception as e:
            print(f'⚠️ {table}: N/A (table does not exist)')
    
    if total_rfqs > 0:
        print(f'\n🗑️ Found {total_rfqs} RFQ records to delete')
        print('\nDeleting...')
        
        for table, count in tables_with_data:
            try:
                conn.execute(text(f"DELETE FROM {table}"))
                conn.commit()
                print(f'  ✅ Deleted {count} records from {table}')
            except Exception as e:
                conn.rollback()
                print(f'  ❌ Error deleting from {table}: {e}')
        
        # Verify deletion
        print('\n📊 AFTER CLEANUP:')
        for table in rfq_tables:
            try:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                if count > 0:
                    print(f'  ❌ {table}: {count} (still has data!)')
                else:
                    print(f'  ✅ {table}: 0')
            except:
                pass
    else:
        print('\n✅ All RFQ tables are clean!')
