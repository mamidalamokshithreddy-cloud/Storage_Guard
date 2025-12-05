from app.connections.mongo_connection import get_mongo_db

# Get MongoDB database
db = get_mongo_db()

print('\n🗑️ CLEANING SENSOR READINGS FROM MONGODB')
print('='*80)

# Count before
telemetry_count = db.telemetry_readings.count_documents({})
print(f'Telemetry readings before: {telemetry_count}')

# Delete all telemetry readings
if telemetry_count > 0:
    result = db.telemetry_readings.delete_many({})
    print(f'✅ Deleted {result.deleted_count} telemetry readings')
else:
    print('✅ No telemetry readings to delete')

# Verify deletion
telemetry_count_after = db.telemetry_readings.count_documents({})
print(f'Telemetry readings after: {telemetry_count_after}')

print('\n📊 Summary:')
print(f'  Sensor readings deleted: {telemetry_count}')
print(f'  Remaining: {telemetry_count_after}')
print('\n✅ All sensor data cleaned! Ready for fresh start.')
