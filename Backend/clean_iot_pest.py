import sqlalchemy as sa
from sqlalchemy import create_engine, text

# Create engine
engine = create_engine('postgresql://postgres:Mani8143@localhost/Agriculture')

print('\n🗑️ CLEANING ALL IOT & PEST DATA')
print('='*80)

with engine.connect() as conn:
    # Count records
    result = conn.execute(text("SELECT COUNT(*) FROM iot_sensors"))
    sensors_count = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM sensor_readings"))
    readings_count = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM pest_detections"))
    pest_count = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM crop_inspections"))
    inspections_count = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM scheduled_inspections"))
    scheduled_count = result.fetchone()[0]
    
    print(f'IoT Sensors before: {sensors_count}')
    print(f'Sensor Readings before: {readings_count}')
    print(f'Pest Detections before: {pest_count}')
    print(f'Crop Inspections before: {inspections_count}')
    print(f'Scheduled Inspections before: {scheduled_count}')
    
    print('\n🗑️ Deleting data...')
    
    # Delete sensor readings first (child table)
    if readings_count > 0:
        conn.execute(text("DELETE FROM sensor_readings"))
        print(f'  ✅ Deleted {readings_count} sensor readings')
    
    # Delete IoT sensors
    if sensors_count > 0:
        conn.execute(text("DELETE FROM iot_sensors"))
        print(f'  ✅ Deleted {sensors_count} IoT sensors')
    
    # Delete pest detections
    if pest_count > 0:
        conn.execute(text("DELETE FROM pest_detections"))
        print(f'  ✅ Deleted {pest_count} pest detections')
    
    # Delete crop inspections
    if inspections_count > 0:
        conn.execute(text("DELETE FROM crop_inspections"))
        print(f'  ✅ Deleted {inspections_count} crop inspections')
    
    # Delete scheduled inspections
    if scheduled_count > 0:
        conn.execute(text("DELETE FROM scheduled_inspections"))
        print(f'  ✅ Deleted {scheduled_count} scheduled inspections')
    
    conn.commit()
    
    # Verify deletion
    result = conn.execute(text("SELECT COUNT(*) FROM iot_sensors"))
    sensors_after = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM sensor_readings"))
    readings_after = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM pest_detections"))
    pest_after = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM crop_inspections"))
    inspections_after = result.fetchone()[0]
    
    result = conn.execute(text("SELECT COUNT(*) FROM scheduled_inspections"))
    scheduled_after = result.fetchone()[0]
    
    print(f'\n📊 Summary:')
    print(f'  IoT Sensors: {sensors_count} → {sensors_after}')
    print(f'  Sensor Readings: {readings_count} → {readings_after}')
    print(f'  Pest Detections: {pest_count} → {pest_after}')
    print(f'  Crop Inspections: {inspections_count} → {inspections_after}')
    print(f'  Scheduled Inspections: {scheduled_count} → {scheduled_after}')
    print('\n✅ All IoT and Pest data cleaned!')
