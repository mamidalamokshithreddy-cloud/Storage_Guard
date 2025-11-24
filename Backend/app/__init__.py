import logging
from contextlib import asynccontextmanager
import importlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.routers.ai_pipeline import router as ai_pipeline_router
from app.nutrients.nutrient_service import router as nutrient_router
from app.routers.irrigation_dashboard import router as irrigation_dashboard_router
from app.routers.irrigation_websocket import router as irrigation_websocket_router
from app.routers.irrigation_enhanced_analytics import router as irrigation_enhanced_analytics_router
from app.nutrients.application_scheduler import router as application_scheduler_router
from app.routers.aquaguide import router as aquaguide_router
from app.core.config import ENABLE_LLM_ANALYSIS, FRONTEND_URL
from app.routers.recommendations import recommendation_router
from app.routers.weather import weather_router
from app.routers.land_registration import land_registration_router
from app.routers.lease_management import lease_management_router
from app.routers.soil_sense import soil_sense_router
from app.routers.admin_routes import admin_router
from app.routers.auth import authentication_router
from app.routers.storage_guard import storage_guard_router
from app.routers.market_integration import market_router

    
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Enhanced application lifespan events with multi-LLM support"""
    # Startup
    logger.info("🚀 Starting Enhanced Pest & Disease Monitoring AI Agent with Multi-LLM")

    # Initialize database tables
    try:
        from app.schemas.postgres_base import create_tables
        create_tables()
        logger.info("✅ Database tables initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database tables: {e}")
        logger.error("Please ensure the PostgreSQL database exists and is accessible")
        # Don't fail startup completely, but log the error

    # Load ML models on startup
    # try:
    #     from app.models.model_manager import get_model_manager
    #     model_manager = await get_model_manager()
    #     logger.info("✅ ML models loaded successfully")
    # except Exception as e:
    #     logger.error(f"❌ Failed to load ML models: {e}")
        # Don't fail startup, but log the error
    
    # Initialize weather cache
    try:
        from app.services.weather_service import WeatherService
        weather_service = WeatherService()
        await weather_service.initialize_cache()
        logger.info("✅ Weather service initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize weather service: {e}")
    
    # Initialize enhanced workflow
    try:
        from app.graph.graph import initialize_workflow
        workflow = initialize_workflow()
        logger.info("✅ Enhanced workflow initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize enhanced workflow: {e}")
        # pass
    
    # Initialize AI Pipeline Components
    try:
        from app.models.llm_manager import get_llm_manager
        from app.models.response_agent import get_response_agent

        # Initialize LLM manager
        llm_manager = get_llm_manager()
        logger.info(f"✅ Multi-LLM manager initialized with {len(llm_manager.enabled_providers)} providers")
        # Expose via app.state for downstream usage
        try:
            app.state.llm_manager = llm_manager
        except Exception:
            pass

        # Initialize response agent
        agent = get_response_agent()
        logger.info("✅ Intelligent response agent initialized")

    except Exception as e:
        logger.error(f"❌ Failed to initialize AI pipeline components: {e}")

    # Initialize Storage Guard Agent
    try:
        from app.agents.storage_guard import StorageGuardAgent
        app.state.storage_guard_agent = StorageGuardAgent()
        logger.info("✅ Storage Guard Agent initialized successfully")
    except Exception as e:
        app.state.storage_guard_agent = None
        logger.warning(f"⚠️ Storage Guard Agent initialization failed: {e}")
        logger.info("📝 Agent will be initialized on first use")
    
    # Initialize LLM services if enabled
    if ENABLE_LLM_ANALYSIS:
        try:
            from app.services.llm_service import get_llm_service
            llm_service = get_llm_service()
            status = llm_service.get_provider_status()
            logger.info(
                f"✅ Multi-LLM service initialized - {status['total_providers']} providers available, "
                f"{len(status['healthy_providers'])} healthy"
            )
        except Exception as e:
            logger.error(f"❌ Failed to initialize LLM service: {e}")
    else:
        logger.info("ℹ️ LLM analysis disabled - running in CV-only mode")
    
    # Initialize prompt engineering service
    try:
        from app.services.prompt_engineering import get_prompt_engine
        prompt_engine = get_prompt_engine()
        logger.info("✅ Prompt engineering service initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize prompt engineering service: {e}")
    
    # Initialize database connections
    try:
        # MongoDB
        from app.connections.mongo_connection import test_connection as test_mongo
        if test_mongo():
            logger.info("✅ MongoDB connection healthy")
        else:
            logger.warning("⚠️ MongoDB connection test failed; check credentials/host")
    except Exception as e:
        logger.error(f"❌ MongoDB init failed: {e}")
    
    # Shutdown
    logger.info("🛑 Shutting down Enhanced Pest & Disease Monitoring AI Agent")
    
    # Cleanup LLM service resources
    if ENABLE_LLM_ANALYSIS:
        try:
            from app.services.llm_service import cleanup_llm_service
            await cleanup_llm_service()
            logger.info("✅ LLM service cleanup completed")
        except Exception as e:
            logger.error(f"❌ LLM service cleanup failed: {e}")
    
    # Cleanup workflow resources
    try:
        from app.graph.graph import cleanup_workflow
        await cleanup_workflow()
        logger.info("✅ Workflow cleanup completed")
    except Exception as e:
        logger.error(f"❌ Workflow cleanup failed: {e}")

    # Cleanup weather service resources
    try:
        from app.services.weather_service import cleanup_weather_service
        await cleanup_weather_service()
        logger.info("✅ Weather service cleanup completed")
    except Exception as e:
        logger.error(f"❌ Weather service cleanup failed: {e}")

    # Cleanup local SLM resources disabled (local SLM is disabled)
    # try:
    #     from app.services.slm_service import cleanup_slm_service
    #     await cleanup_slm_service()
    #     logger.info("✅ Local SLM service cleanup completed")
    # except Exception as e:
    #     logger.error(f"❌ Local SLM service cleanup failed: {e}")

    # Cleanup AI pipeline components
    try:
        from app.models.llm_manager import cleanup_llm_manager
        await cleanup_llm_manager()
        logger.info("✅ AI pipeline components cleanup completed")
    except Exception as e:
        logger.error(f"❌ AI pipeline components cleanup failed: {e}")


app = FastAPI()

# Mount static files for serving uploaded images
uploads_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Security middleware (allow localhost and any host during development)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*", "localhost", "127.0.0.1"]
)

# CORS middleware - Enhanced for mobile device support
# Allow both HTTP (dev) and HTTPS (production) origins, including mobile access
app.add_middleware( 
    CORSMiddleware,
    allow_origins=[
        # Production origins
        "https://beta.agrihublife.ai",
        "https://api.agrihublife.ai",
        # Local development
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000", 
        "http://127.0.0.1:8000",
        # Mobile access patterns (common local IP ranges) - if needed, add specific IPs
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "*",
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRFToken",
        "Cache-Control",
        "Pragma",
        # Mobile-specific headers
        "User-Agent",
        "X-Forwarded-For",
        "X-Real-IP",
    ],
    expose_headers=["*"]
)


# Include routers
app.include_router(ai_pipeline_router, tags=["ai-pipeline"])
app.include_router(nutrient_router, tags=["nutrients"])
app.include_router(application_scheduler_router, tags=["nutrient-scheduling"])
app.include_router(irrigation_dashboard_router, tags=["irrigation-dashboard"])
app.include_router(irrigation_websocket_router, tags=["irrigation-websocket"])
app.include_router(irrigation_enhanced_analytics_router, tags=["irrigation-analytics"])
app.include_router(aquaguide_router, tags=["aquaguide"])
app.include_router(recommendation_router, tags=["recommendations"])
app.include_router(weather_router, tags=["weather"])
app.include_router(land_registration_router, tags=["Land Registration & Approval"])
app.include_router(lease_management_router, tags=["Lease Management"])
app.include_router(soil_sense_router, tags=["Soil Testing & Health Card"])
app.include_router(admin_router, tags=["Admin"])
app.include_router(authentication_router, tags=["Auth"])
app.include_router(storage_guard_router, prefix="/storage-guard", tags=["Storage Guard"])
app.include_router(market_router, tags=["Market Integration"])
