# app/database/connection.py
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = f"postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Ensure we operate in the configured schema (default: public)
TARGET_SCHEMA = getattr(settings, "db_schema", "public")

# Set search_path on each connection
@event.listens_for(engine, "connect")
def set_search_path(dbapi_connection, connection_record):
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute(f"SET search_path TO {TARGET_SCHEMA}")
        cursor.close()
    except Exception:
        # Non-fatal; if role lacks privileges, DDL will still fail but DML will use default
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        # Log and re-raise so FastAPI can produce a proper error response
        print(f"Error in database operation: {e}")
        db.rollback()
        raise
    finally:
        db.close()
    