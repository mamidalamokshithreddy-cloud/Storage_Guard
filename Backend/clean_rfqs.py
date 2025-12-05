import sqlalchemy as sa
from sqlalchemy import create_engine, text

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

print('\n🗑️ CLEANING ALL RFQs')
print('='*80)

with engine.connect() as conn:
    # Count RFQs
    result = conn.execute(text("SELECT COUNT(*) FROM rfqs"))
    rfq_count = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM storage_rfq"))
    storage_rfq_count = result.fetchone()[0]
    
    print(f'RFQs before: {rfq_count}')
    print(f'Storage RFQs before: {storage_rfq_count}')
    
    # Delete all RFQs
    if rfq_count > 0:
        result = conn.execute(text("DELETE FROM rfqs"))
        conn.commit()
        print(f'✅ Deleted {rfq_count} RFQs')
    else:
        print('✅ No RFQs to delete')
    
    # Delete all Storage RFQs
    if storage_rfq_count > 0:
        result = conn.execute(text("DELETE FROM storage_rfq"))
        conn.commit()
        print(f'✅ Deleted {storage_rfq_count} Storage RFQs')
    else:
        print('✅ No Storage RFQs to delete')
    
    # Verify deletion
    result = conn.execute(text("SELECT COUNT(*) FROM rfqs"))
    rfq_after = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM storage_rfq"))
    storage_rfq_after = result.fetchone()[0]
    
    print(f'\n📊 Summary:')
    print(f'  RFQs: {rfq_count} → {rfq_after}')
    print(f'  Storage RFQs: {storage_rfq_count} → {storage_rfq_after}')
    print('\n✅ All RFQs cleaned!')
