from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
import logging
from typing import Dict, List, Optional, Union
from urllib.parse import quote_plus
import time
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# MongoDB connection configuration from settings
MONGO_HOST = settings.mongodb_host
MONGO_PORT = str(settings.mongodb_port)
MONGO_DB = settings.mongodb_name
MONGO_USER = settings.mongodb_username or ""
MONGO_PASSWORD = settings.mongodb_password or ""
MONGO_URL_ENV = (settings.mongodb_url or "").strip() if hasattr(settings, "mongodb_url") else ""


def _build_mongo_url() -> str:
    """Construct a MongoDB URI from settings, preferring explicit MONGODB_URL if provided."""
    if MONGO_URL_ENV:
        return MONGO_URL_ENV
    if MONGO_USER and MONGO_PASSWORD:
        # Use the configured DB as authSource to avoid hardcoding
        return (
            f"mongodb://{quote_plus(MONGO_USER)}:{quote_plus(MONGO_PASSWORD)}"
            f"@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource={MONGO_DB}"
        )
    return f"mongodb://{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}"


MONGO_URL = _build_mongo_url()
masked_url = MONGO_URL
if MONGO_PASSWORD:
    masked_url = MONGO_URL.replace(quote_plus(MONGO_PASSWORD), "****")

logger.info("Initializing MongoDB connection")
logger.info(
    "Mongo settings: host=%s port=%s db=%s user_configured=%s using_url_env=%s",
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DB,
    "Yes" if MONGO_USER else "No",
    "Yes" if bool(MONGO_URL_ENV) else "No",
)
logger.debug("Mongo URL: %s", masked_url)

client = MongoClient(MONGO_URL)
db = client[MONGO_DB]

# Maximum number of connection attempts
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


def connect_with_retry():
    for attempt in range(MAX_RETRIES):
        try:
            print(f"\nConnection attempt {attempt + 1} of {MAX_RETRIES}...")
            client = MongoClient(
                MONGO_URL,
                serverSelectionTimeoutMS=5000,
                maxPoolSize=50,
                retryWrites=True,
                connectTimeoutMS=5000,
                socketTimeoutMS=10000,
            )
            # Test connection
            print("Testing connection with ping command...")
            client.admin.command("ping")
            print(f"✅ Successfully connected to MongoDB on {MONGO_HOST}:{MONGO_PORT}")
            logger.info(f"Successfully connected to MongoDB on {MONGO_HOST}:{MONGO_PORT}")
            return client
        except Exception as e:
            print(f"❌ Connection attempt {attempt + 1} failed: {str(e)}")
            if attempt < MAX_RETRIES - 1:
                print(f"Waiting {RETRY_DELAY} seconds before next attempt...")
                logger.warning(f"Connection attempt {attempt + 1} failed: {e}. Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                error_msg = (f"Failed to connect to MongoDB after {MAX_RETRIES} attempts: {e}")
                print(f"❌ {error_msg}")
                logger.error(error_msg)
                raise


try:
    # Initialize the client with retry logic
    print("\nInitializing MongoDB connection...")
    client = connect_with_retry()
except Exception as e:
    error_msg = f"Failed to establish MongoDB connection: {e}"
    print(f"❌ {error_msg}")
    logger.error(error_msg)
    raise


def test_connection() -> bool:
    try:
        print("\nTesting MongoDB connection...")
        # Ping the server to verify connection is alive
        client.admin.command("ping")
        success_msg = "✅ Successfully connected to MongoDB"
        print(success_msg)
        logger.info(success_msg)
        return True
    except ConnectionFailure as e:
        error_msg = f"MongoDB connection error: {e}"
        print(f"❌ {error_msg}")
        logger.error(error_msg)
        return False
    except OperationFailure as e:
        error_msg = f"MongoDB authentication error: {e}"
        print(f"❌ {error_msg}")
        logger.error(error_msg)
        return False
    except Exception as e:
        error_msg = f"Unexpected MongoDB error: {e}"
        print(f"❌ {error_msg}")
        logger.error(error_msg)
        return False


def get_mongo_db(db_name: Optional[str] = None):
    try:
        name = db_name or MONGO_DB
        return client[name]
    except Exception as e:
        logger.error(f"Error getting MongoDB database: {e}")
        raise


def get_collection(collection_name: str, db_name: Optional[str] = None):
    try:
        db = get_mongo_db(db_name)
        return db[collection_name]
    except Exception as e:
        logger.error(f"Error getting collection {collection_name}: {e}")
        raise


def insert_data(collection_name: str, data: Union[Dict, List[Dict]], db_name: Optional[str] = None):
    try:
        collection = get_collection(collection_name, db_name)

        # Check if data is a list (multiple documents) or dict (single document)
        if isinstance(data, list):
            result = collection.insert_many(data)
            logger.info(f"Successfully inserted {len(result.inserted_ids)} documents into {collection_name}")
            return result
        else:
            result = collection.insert_one(data)
            logger.info(f"Successfully inserted document with ID: {result.inserted_id} into {collection_name}")
            return result
    except Exception as e:
        logger.error(f"Error inserting data into {collection_name}: {e}")
        raise


def update_one(collection_name: str,filter_query: Dict,update_data: Dict,db_name: Optional[str] = None,):
    try:
        collection = get_collection(collection_name, db_name)
        result = collection.update_one(filter_query, update_data)
        logger.info(f"Updated {result.modified_count} document in {collection_name}")
        return result
    except Exception as e:
        logger.error(f"Error updating document in {collection_name}: {e}")
        raise


def update_many(collection_name: str,filter_query: Dict,update_data: Dict,db_name: Optional[str] = None,):
    try:
        collection = get_collection(collection_name, db_name)
        result = collection.update_many(filter_query, update_data)
        logger.info(f"Updated {result.modified_count} documents in {collection_name}")
        return result
    except Exception as e:
        logger.error(f"Error updating documents in {collection_name}: {e}")
        raise


def delete_one(collection_name: str, filter_query: Dict, db_name: Optional[str] = None):
    try:
        collection = get_collection(collection_name, db_name)
        result = collection.delete_one(filter_query)
        logger.info(f"Deleted {result.deleted_count} document from {collection_name}")
        return result
    except Exception as e:
        logger.error(f"Error deleting document from {collection_name}: {e}")
        raise


def delete_many(collection_name: str, filter_query: Dict, db_name: Optional[str] = None):
    try:
        collection = get_collection(collection_name, db_name)
        result = collection.delete_many(filter_query)
        logger.info(f"Deleted {result.deleted_count} documents from {collection_name}")
        return result
    except Exception as e:
        logger.error(f"Error deleting documents from {collection_name}: {e}")
        raise


def find_one(collection_name: str, query: Dict, db_name: Optional[str] = None):
    try:
        collection = get_collection(collection_name, db_name)
        return collection.find_one(query)
    except Exception as e:
        logger.error(f"Error finding document in {collection_name}: {e}")
        raise


def find_many(collection_name: str,query: Dict = {},sort_by: Optional[List[tuple]] = None,limit: Optional[int] = None,skip: Optional[int] = None,db_name: Optional[str] = None,):
    try:
        collection = get_collection(collection_name, db_name)
        cursor = collection.find(query)

        # Apply sorting if specified
        if sort_by:
            cursor = cursor.sort(sort_by)

        # Apply pagination if specified
        if skip is not None:
            cursor = cursor.skip(skip)
        if limit is not None:
            cursor = cursor.limit(limit)

        return cursor
    except Exception as e:
        logger.error(f"Error finding documents in {collection_name}: {e}")
        raise


def count_documents(collection_name: str, query: Dict = {}, db_name: Optional[str] = None) -> int:
    try:
        collection = get_collection(collection_name, db_name)
        return collection.count_documents(query)
    except Exception as e:
        logger.error(f"Error counting documents in {collection_name}: {e}")
        raise


def aggregate(collection_name: str, pipeline: List[Dict], db_name: Optional[str] = None):
    try:
        collection = get_collection(collection_name, db_name)
        return collection.aggregate(pipeline)
    except Exception as e:
        logger.error(f"Error performing aggregation on {collection_name}: {e}")
        raise


def create_index(collection_name: str,keys: List[tuple],unique: bool = False,db_name: Optional[str] = None,):
    try:
        collection = get_collection(collection_name, db_name)
        result = collection.create_index(keys, unique=unique)
        logger.info(f"Created index {result} on collection {collection_name}")
        return result
    except Exception as e:
        logger.error(f"Error creating index on {collection_name}: {e}")
        raise


# Test the connection on module import
if not test_connection():
    logger.warning("Failed to establish initial MongoDB connection")