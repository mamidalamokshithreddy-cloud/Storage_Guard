from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Dict, Any, Optional
import logging

# Compute path to repo root .env (four levels up from this file: core -> app -> Backend -> repo root)
ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    # Pydantic v2 config: load .env from repository root, allow env overrides
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore", case_sensitive=False)
    # Database settings
    db_user: str
    db_password: str
    db_host: str
    db_port: str
    db_name: str
    db_schema: str = "public"  # default schema; set DB_SCHEMA in .env to override

    # MongoDB settings
    # If MONGODB_URL is provided, it will be preferred by the Mongo client code.
    mongodb_url: Optional[str] = None
    mongodb_host: str
    mongodb_port: int
    mongodb_name: str
    mongodb_username: str
    mongodb_password: str

    # Server binding (for Docker, default to 0.0.0.0)
    HOST : str = "0.0.0.0"
    PORT : int = 8000

    # Frontend URL for email links and redirects
    FRONTEND_URL: str = "http://localhost:3000"  # Should be set in .env (e.g., https://yourdomain.com or http://localhost:3000 for dev)
    FRONTEND_BASE_URL: str = "http://localhost:3000"  # Base URL for registration/invitation links (e.g., http://localhost:3000)

    # API Keys
    GOOGLE_API_KEY: str = ""

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    MODEL_DIR: Path = BASE_DIR / "data" / "models"
    CACHE_DIR: Path = BASE_DIR / "data" / "cache"

    WEATHER_API_KEY: str = ""
    
    # LLM API Keys
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""  # API key for all Gemini services
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""

    # Model settings
    MODEL_NAME: str = ""

    MODEL_TEMPERATURE: float = 0.2
    CONFIDENCE_THRESHOLD: float = 0.5
    NMS_THRESHOLD: float = 0.4
    
    # External APIs (optional)
    weather_api_key: Optional[str] = None
    accuweather_api_key: Optional[str] = None
    market_api_url: Optional[str] = None
    extension_api_url: Optional[str] = None
    
    # Mandi Market APIs
    enam_api_key: Optional[str] = None
    agmarknet_api_key: Optional[str] = None
    data_gov_api_key: Optional[str] = None
    market_data_cache_duration: int = 3600  # 1 hour
    price_update_frequency: str = "daily"
    
    # API Cache settings
    api_cache_duration: int = 3600

    # LLM Configuration
    PRIMARY_LLM_PROVIDER: str = "openai"  # openai, anthropic, google, azure
    FALLBACK_LLM_PROVIDER: str = "anthropic"
    CROSS_VALIDATION_LLM_PROVIDER: str = "google"
    
    LLM_MODELS: Dict[str, str] = {
        "openai": "gpt-4o",
        "anthropic": "claude-3-5-sonnet-20241022",
        "google": "gemini-2.5-flash",
        "azure": "gpt-4o"
    }
    
    LLM_VISION_MODELS: Dict[str, str] = {
        "openai": "gpt-4o",
        "anthropic": "claude-3-5-sonnet-20241022", 
        "google": "gemini-2.5-flash",
        "azure": "gpt-4o"
    }
    
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 4000
    LLM_TIMEOUT: int = 30
    
    # LLM Parallel Processing Settings
    LLM_PARALLEL_PROVIDERS: int = 2  # Number of LLM providers to use in parallel
    LLM_CONSENSUS_THRESHOLD: float = 0.7  # Minimum consensus threshold for decisions
    
    # LLM Analysis Enable/Disable Flags
    ENABLE_LLM_ANALYSIS: bool = True  # Enable/disable LLM analysis in workflow
    ENABLE_SLM_ANALYSIS: bool = True  # Enable/disable SLM analysis in workflow
    # Local SLM toggles and parameters
    SLM_LOCAL_ENABLED: bool = True  # Disabled by default; enable via .env if you want local SLM
    SLM_MODEL_NAME: str = "bharatgenai/AgriParam"
    SLM_MAX_NEW_TOKENS: int = 300
    SLM_TEMPERATURE: float = 0.6
    SLM_TOP_K: int = 50
    SLM_TOP_P: float = 0.95
    # Auto fine-tune controls for local SLM
    AUTO_SLM_FINETUNE_ENABLED: bool = False
    AUTO_SLM_FINETUNE_THRESHOLD: int = 100  # number of collected examples before triggering
    AUTO_SLM_FINETUNE_MAX_BUFFER: int = 1000  # cap buffer size
    AUTO_SLM_FINETUNE_MIN_INTERVAL_MINUTES: int = 30  # minimum minutes between auto fine-tunes
    AUTO_SLM_FINETUNE_EVAL_SPLIT: float = 0.1  # evaluation fraction
    
    # Model Loading Control
    ENABLE_MODEL_LOADING: bool = True  # Enable/disable ML model loading on startup
    # Strict mode: when True, disallow any mock/placeholder/fallback data generation across services
    STRICT_NO_FALLBACKS: bool = False
    
    # LLM Skip Configuration
    LLM_SKIP_ON_HIGH_CONFIDENCE: bool = False  # Skip LLM if CV confidence is high
    LLM_CV_CONFIDENCE_THRESHOLD: float = 0.9  # Confidence threshold for skipping LLM
    
    # Cross-validation settings
    ENABLE_CROSS_VALIDATION: bool = True
    CROSS_VALIDATION_THRESHOLD: float = 0.7  # Use cross-validation if confidence < threshold
    CONSENSUS_WEIGHT_SLM: float = 0.3
    CONSENSUS_WEIGHT_LLM: float = 0.7

    # Analysis Constants
    PERCENTAGE_TOLERANCE: float = 1.0
    MAX_RATING: float = 10.0
    MAX_IMAGES_PER_REQUEST: int = 5
    MAX_IMAGE_SIZE: int = 1024
    SUPPORTED_FORMATS: list = ["jpg", "jpeg", "png", "webp"]
    REMOVE_EXIF: bool = True  # Remove EXIF data from uploaded images for privacy

    # Weather thresholds
    HIGH_HUMIDITY_THRESHOLD: float = 85.0
    TEMPERATURE_STRESS_LOW: float = 5.0
    TEMPERATURE_STRESS_HIGH: float = 35.0
    WIND_RISK_THRESHOLD: float = 15.0
    RAINFALL_THRESHOLD: float = 5.0

    # IPM thresholds
    DEFAULT_LOW_THRESHOLD: int = 10
    DEFAULT_MEDIUM_THRESHOLD: int = 30
    DEFAULT_HIGH_THRESHOLD: int = 60

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SECRET_KEY: str = "your-secret-key-here-change-in-production"  # Add to .env for production
    ALGORITHM: str = "HS256"

    MODEL_CONFIG: Dict[str, Any] = {
        "name": MODEL_NAME,
        "temperature": MODEL_TEMPERATURE,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "nms_threshold": NMS_THRESHOLD,
    }

    ANALYSIS_CONFIG: Dict[str, Any] = {
        "percentage_tolerance": PERCENTAGE_TOLERANCE,
        "max_rating": MAX_RATING,
        "max_images_per_request": MAX_IMAGES_PER_REQUEST,
        "max_image_size": MAX_IMAGE_SIZE,
        "categories": {
            "pest": "Pest Detection",
            "disease": "Disease Detection",
            "nutrient": "Nutrient Deficiency",
            "weather": "Weather Impact",
        },
    }

    WEATHER_CONFIG: Dict[str, Any] = {
        "high_humidity_threshold": HIGH_HUMIDITY_THRESHOLD,
        "temperature_stress_low": TEMPERATURE_STRESS_LOW,
        "temperature_stress_high": TEMPERATURE_STRESS_HIGH,
        "wind_risk_threshold": WIND_RISK_THRESHOLD,
        "rainfall_threshold": RAINFALL_THRESHOLD,
    }

    IPM_CONFIG: Dict[str, Any] = {
        "low_threshold": DEFAULT_LOW_THRESHOLD,
        "medium_threshold": DEFAULT_MEDIUM_THRESHOLD,
        "high_threshold": DEFAULT_HIGH_THRESHOLD,
        "max_recommendations": 5,
        "include_organic": True,
        "include_chemical": True,
        "include_biological": True,
    }

    LOGGING_CONFIG: Dict[str, Any] = {
        "level": "INFO",
        "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    }

    # (Removed legacy Config/extra; handled by model_config above)


settings = Settings()


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Configure logger
logger = logging.getLogger(__name__)
logging.basicConfig(**settings.LOGGING_CONFIG)

# Export all required constants
BASE_DIR = settings.BASE_DIR
UPLOAD_DIR = settings.UPLOAD_DIR
MODEL_DIR = settings.MODEL_DIR
CACHE_DIR = settings.CACHE_DIR
WEATHER_API_KEY = settings.WEATHER_API_KEY
GOOGLE_API_KEY = settings.GOOGLE_API_KEY
FRONTEND_URL = settings.FRONTEND_URL

# LLM Configuration exports
OPENAI_API_KEY = settings.OPENAI_API_KEY
ANTHROPIC_API_KEY = settings.ANTHROPIC_API_KEY
GEMINI_API_KEY = settings.GEMINI_API_KEY
AZURE_OPENAI_API_KEY = settings.AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT = settings.AZURE_OPENAI_ENDPOINT
PRIMARY_LLM_PROVIDER = settings.PRIMARY_LLM_PROVIDER
FALLBACK_LLM_PROVIDER = settings.FALLBACK_LLM_PROVIDER
CROSS_VALIDATION_LLM_PROVIDER = settings.CROSS_VALIDATION_LLM_PROVIDER
LLM_MODELS = settings.LLM_MODELS
LLM_VISION_MODELS = settings.LLM_VISION_MODELS
LLM_TEMPERATURE = settings.LLM_TEMPERATURE
LLM_MAX_TOKENS = settings.LLM_MAX_TOKENS
LLM_TIMEOUT = settings.LLM_TIMEOUT
LLM_PARALLEL_PROVIDERS = settings.LLM_PARALLEL_PROVIDERS
LLM_CONSENSUS_THRESHOLD = settings.LLM_CONSENSUS_THRESHOLD
ENABLE_LLM_ANALYSIS = settings.ENABLE_LLM_ANALYSIS
ENABLE_SLM_ANALYSIS = settings.ENABLE_SLM_ANALYSIS
SLM_LOCAL_ENABLED = settings.SLM_LOCAL_ENABLED
SLM_MODEL_NAME = settings.SLM_MODEL_NAME
SLM_MAX_NEW_TOKENS = settings.SLM_MAX_NEW_TOKENS
SLM_TEMPERATURE = settings.SLM_TEMPERATURE
SLM_TOP_K = settings.SLM_TOP_K
SLM_TOP_P = settings.SLM_TOP_P
ENABLE_MODEL_LOADING = settings.ENABLE_MODEL_LOADING
LLM_SKIP_ON_HIGH_CONFIDENCE = settings.LLM_SKIP_ON_HIGH_CONFIDENCE
LLM_CV_CONFIDENCE_THRESHOLD = settings.LLM_CV_CONFIDENCE_THRESHOLD
ENABLE_CROSS_VALIDATION = settings.ENABLE_CROSS_VALIDATION
CROSS_VALIDATION_THRESHOLD = settings.CROSS_VALIDATION_THRESHOLD
CONSENSUS_WEIGHT_SLM = settings.CONSENSUS_WEIGHT_SLM
CONSENSUS_WEIGHT_LLM = settings.CONSENSUS_WEIGHT_LLM
STRICT_NO_FALLBACKS = settings.STRICT_NO_FALLBACKS
AUTO_SLM_FINETUNE_ENABLED = settings.AUTO_SLM_FINETUNE_ENABLED
AUTO_SLM_FINETUNE_THRESHOLD = settings.AUTO_SLM_FINETUNE_THRESHOLD
AUTO_SLM_FINETUNE_MAX_BUFFER = settings.AUTO_SLM_FINETUNE_MAX_BUFFER
AUTO_SLM_FINETUNE_MIN_INTERVAL_MINUTES = settings.AUTO_SLM_FINETUNE_MIN_INTERVAL_MINUTES
AUTO_SLM_FINETUNE_EVAL_SPLIT = settings.AUTO_SLM_FINETUNE_EVAL_SPLIT
MODEL_NAME = settings.MODEL_NAME
MODEL_TEMPERATURE = settings.MODEL_TEMPERATURE
CONFIDENCE_THRESHOLD = settings.CONFIDENCE_THRESHOLD
NMS_THRESHOLD = settings.NMS_THRESHOLD
MODEL_CONFIG = settings.MODEL_CONFIG
LOGGING_CONFIG = settings.LOGGING_CONFIG
ANALYSIS_CONFIG = settings.ANALYSIS_CONFIG
WEATHER_CONFIG = settings.WEATHER_CONFIG
IPM_CONFIG = settings.IPM_CONFIG
PERCENTAGE_TOLERANCE = settings.PERCENTAGE_TOLERANCE
MAX_RATING = settings.MAX_RATING
MAX_IMAGES_PER_REQUEST = settings.MAX_IMAGES_PER_REQUEST
MAX_IMAGE_SIZE = settings.MAX_IMAGE_SIZE
SUPPORTED_FORMATS = settings.SUPPORTED_FORMATS
REMOVE_EXIF = settings.REMOVE_EXIF
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES if hasattr(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES') else 30
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

# Create necessary directories
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Storage for runtime data
ANALYSIS_STORAGE: Dict[str, Dict[str, Any]] = {}  # Key: analysis_id, Value: analysis data
ACTIVE_ANALYSIS_ID: str = None  # Track currently active analysis
