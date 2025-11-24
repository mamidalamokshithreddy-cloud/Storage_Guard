"""
Create IoT Sensors and Sensor Readings tables
"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

def create_iot_tables():
    """Create IoT Sensors and Sensor Readings tables"""
    with engine.connect() as conn:
        print("📡 Creating IoT Sensors table...")
        
        # Check if iot_sensors table exists
        check_table = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'iot_sensors'
            );
        """)
        
        exists = conn.execute(check_table).scalar()
        
        if not exists:
            # Create iot_sensors table
            create_iot_sensors = text("""
                CREATE TABLE iot_sensors (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    location_id UUID REFERENCES storage_locations(id) ON DELETE CASCADE,
                    sensor_type VARCHAR(64) NOT NULL,
                    device_id VARCHAR(120) NOT NULL UNIQUE,
                    status VARCHAR(24) DEFAULT 'active',
                    last_reading TIMESTAMP WITH TIME ZONE,
                    battery_level FLOAT,
                    installation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """)
            conn.execute(create_iot_sensors)
            print("✅ iot_sensors table created")
            
            # Create sensor_readings table
            create_sensor_readings = text("""
                CREATE TABLE sensor_readings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    sensor_id UUID REFERENCES iot_sensors(id) ON DELETE CASCADE,
                    reading_value FLOAT NOT NULL,
                    reading_unit VARCHAR(16),
                    reading_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    alert_triggered BOOLEAN DEFAULT FALSE,
                    alert_reason VARCHAR(120),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """)
            conn.execute(create_sensor_readings)
            print("✅ sensor_readings table created")
            
            # Create indexes for performance
            create_indexes = text("""
                CREATE INDEX idx_iot_sensors_location ON iot_sensors(location_id);
                CREATE INDEX idx_iot_sensors_status ON iot_sensors(status);
                CREATE INDEX idx_sensor_readings_sensor ON sensor_readings(sensor_id);
                CREATE INDEX idx_sensor_readings_time ON sensor_readings(reading_time);
            """)
            conn.execute(create_indexes)
            print("✅ Indexes created")
            
            conn.commit()
            print("\n🎉 IoT tables created successfully!")
        else:
            print("✅ iot_sensors table already exists, skipping.")

if __name__ == "__main__":
    print("=" * 60)
    print("IOT SENSORS TABLE MIGRATION")
    print("=" * 60)
    
    try:
        create_iot_tables()
        print("\n✅ Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
