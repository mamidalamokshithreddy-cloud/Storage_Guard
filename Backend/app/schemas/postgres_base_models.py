__all__ = [
    'SoilAnalysis', 'CropInfo', 'EnvironmentalFactors', 'UserPreferences',
    'SimpleFertilizerRequest', 'FertilizerRequest', 'ComprehensiveAnalysisRequest',
    'CostAnalysisRequest', 'ScheduleRequest'
]

from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Union, Literal
from pydantic import BaseModel, Field, validator, HttpUrl
from pydantic.types import UUID4
import re
from pydantic import BaseModel, EmailStr, validator, Field, model_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
from uuid import UUID
from app.schemas.postgres_base import UserRole, LandUse, ServiceType
import enum


# Enums
class CropType(str, Enum):
    """Supported crop types"""
    rice = "rice"
    wheat = "wheat"
    corn = "corn"
    soybean = "soybean"
    cotton = "cotton"
    tomato = "tomato"
    potato = "potato"
    onion = "onion"
    cabbage = "cabbage"
    pepper = "pepper"
    bean = "bean"
    cucumber = "cucumber"
    other = "other"


class GrowthStage(str, Enum):
    """Crop growth stages"""
    seedling = "seedling"
    vegetative = "vegetative"
    flowering = "flowering"
    fruiting = "fruiting"
    maturity = "maturity"
    harvest = "harvest"


class SeverityBand(str, Enum):
    """Disease/pest severity classification"""
    mild = "mild"
    moderate = "moderate"
    severe = "severe"


class WeatherRiskBand(str, Enum):
    """Weather-based risk assessment"""
    low = "low"
    medium = "medium"
    high = "high"


class ImageSource(str, Enum):
    """Source of uploaded images"""
    phone = "phone"
    drone = "drone"
    camera = "camera"
    other = "other"


class TreatmentType(str, Enum):
    """Types of treatment recommendations"""
    prevention = "prevention"
    biological = "biological"
    chemical = "chemical"
    cultural = "cultural"


class IPMActionType(str, Enum):
    """IPM action types"""
    prevention = "prevention"
    monitoring = "monitoring"
    biological = "biological"
    chemical = "chemical"
    cultural = "cultural"
    mechanical = "mechanical"


class IPMUrgency(str, Enum):
    """IPM recommendation urgency levels"""
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


# Location model
class Location(BaseModel):
    """GPS coordinates"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")
    altitude: Optional[float] = Field(None, description="Altitude in meters")


# Weather models
class WeatherData(BaseModel):
    """Current weather conditions"""
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity %")
    rainfall: float = Field(0, ge=0, description="Rainfall in mm")
    wind_speed: float = Field(0, ge=0, description="Wind speed in km/h")
    pressure: Optional[float] = Field(None, description="Atmospheric pressure in hPa")
    dew_point: Optional[float] = Field(None, description="Dew point in Celsius")


class WeatherRiskIndices(BaseModel):
    """Computed weather risk indicators"""
    high_humidity_hours: int = Field(0, description="Hours with RH > 85%")
    consecutive_wet_days: int = Field(0, description="Consecutive days with rain")
    degree_days: float = Field(0, description="Accumulated degree days")
    wind_risk: bool = Field(False, description="High wind conditions")
    temperature_stress: bool = Field(False, description="Temperature stress conditions")


class WeatherRisk(BaseModel):
    """Weather risk assessment"""
    indices: WeatherRiskIndices
    risk_band: WeatherRiskBand
    factors: List[str] = Field(default_factory=list, description="Risk contributing factors")


# Analysis request models
class ImageMetadata(BaseModel):
    """Metadata for uploaded images"""
    filename: str
    size_bytes: int
    content_type: str
    source: ImageSource = ImageSource.phone
    captured_at: Optional[datetime] = None
    exif_data: Optional[Dict[str, Any]] = None


class AnalysisPayload(BaseModel):
    """Payload for image analysis request"""
    crop: CropType
    stage: GrowthStage
    location: Optional[Location] = None
    taken_at: Optional[datetime] = None
    weather: Optional[WeatherData] = None
    image_source: ImageSource = ImageSource.phone
    notes: Optional[str] = Field(None, max_length=500, description="Additional context")
    
    # Optional field for workflow execution (added by router)
    images: Optional[List[str]] = Field(None, description="Image file paths (added during processing)")
    
    class Config:
        extra = "allow"  # Allow extra fields
    
    @validator('taken_at', pre=True)
    def parse_taken_at(cls, v):
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                return None
        return v


# Analysis response models
class Alternative(BaseModel):
    """Alternative diagnosis"""
    label: str
    confidence: float = Field(..., ge=0, le=1)
    description: Optional[str] = None


class Diagnosis(BaseModel):
    """Primary diagnosis result"""
    label: str = Field(..., description="Detected pest/disease")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score")
    alternatives: List[Alternative] = Field(default_factory=list)
    bounding_boxes: Optional[List[Dict[str, float]]] = Field(None, description="Detection boxes")
    affected_area_percent: Optional[float] = Field(None, ge=0, le=100, description="% of plant affected")


class Severity(BaseModel):
    """Severity assessment"""
    score_0_100: int = Field(..., ge=0, le=100, description="Severity score")
    band: SeverityBand
    factors: List[str] = Field(default_factory=list, description="Severity contributing factors")
    confidence: float = Field(..., ge=0, le=1, description="Severity assessment confidence")


class ChemicalTreatment(BaseModel):
    """Chemical treatment recommendation"""
    active_ingredient: str
    product_name: Optional[str] = None
    rate: str = Field(..., description="Application rate")
    phi_days: int = Field(..., description="Pre-harvest interval in days")
    moa_group: Optional[str] = Field(None, description="Mode of action group")
    notes: Optional[str] = None
    restrictions: Optional[List[str]] = Field(default_factory=list)


class BiologicalTreatment(BaseModel):
    """Biological treatment recommendation"""
    agent: str = Field(..., description="Biological control agent")
    application_method: str
    rate: str
    frequency: str
    notes: Optional[str] = None


class PreventionMeasure(BaseModel):
    """Prevention recommendation"""
    measure: str
    description: str
    priority: int = Field(..., ge=1, le=5, description="Priority level (1=highest)")


class IPMAction(BaseModel):
    """Individual IPM action"""
    category: str = Field(..., description="Action category (e.g., 'Biological Control', 'Chemical')")
    description: str = Field(..., description="Detailed action description")
    timing: str = Field(..., description="When to perform this action")
    frequency: str = Field(..., description="How often to perform this action")
    cost_estimate: Optional[str] = Field(None, description="Estimated cost range")
    effectiveness: Optional[float] = Field(None, ge=0, le=1, description="Expected effectiveness")


class IPMRecommendation(BaseModel):
    """Single IPM recommendation for a specific issue"""
    target_issue: str = Field(..., description="The pest/disease this recommendation targets")
    action_type: IPMActionType = Field(..., description="Primary type of action")
    urgency: IPMUrgency = Field(..., description="Urgency level")
    description: str = Field(..., description="Summary of the recommendation")
    actions: List[IPMAction] = Field(default_factory=list, description="Specific actions to take")
    rationale: str = Field(..., description="Why this recommendation is suggested")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Confidence in recommendation")
    alternatives: Optional[List[str]] = Field(None, description="Alternative approaches")


class IPMRecommendations(BaseModel):
    """Integrated Pest Management recommendations"""
    prevention: List[PreventionMeasure] = Field(default_factory=list)
    biological: List[BiologicalTreatment] = Field(default_factory=list)
    chemical: List[ChemicalTreatment] = Field(default_factory=list)
    cultural: List[str] = Field(default_factory=list, description="Cultural control methods")
    monitoring: List[str] = Field(default_factory=list, description="Monitoring recommendations")
    requires_approval: bool = Field(False, description="Requires human approval")
    approval_reason: Optional[str] = None


class ProcessingTimings(BaseModel):
    """Processing time breakdown"""
    total_ms: float
    validate_input_ms: float
    preprocess_ms: float
    vision_predict_ms: float
    severity_ms: float
    weather_context_ms: float
    threshold_decision_ms: float
    recommend_ipm_ms: float
    format_response_ms: float


class AnalysisResponse(BaseModel):
    """Complete analysis response"""
    diagnosis: Diagnosis
    severity: Severity
    alert: bool = Field(..., description="Whether immediate action is required")
    weather_risk: WeatherRisk
    recommendations: IPMRecommendations
    rationale: str = Field(..., description="AI reasoning for recommendations")
    trace_id: str = Field(..., description="Unique identifier for this analysis")
    confidence: float = Field(..., ge=0, le=1, description="Overall analysis confidence")
    uncertain: bool = Field(False, description="Whether analysis has high uncertainty")
    uncertainty_guidance: Optional[List[str]] = Field(None, description="Guidance for uncertain results")
    timings: Optional[ProcessingTimings] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ResponseMetadata(BaseModel):
    """Response metadata for analysis results"""
    trace_id: str = Field(..., description="Unique trace identifier")
    timestamp: datetime = Field(..., description="Response generation timestamp")
    processing_time: float = Field(..., description="Total processing time in seconds")
    model_versions: Dict[str, str] = Field(default_factory=dict, description="Model version information")
    workflow_version: str = Field(..., description="Workflow version used")


# Weather API models
class WeatherContextRequest(BaseModel):
    """Request for weather context data"""
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    from_date: datetime
    to_date: datetime
    
    @validator('from_date', 'to_date', pre=True)
    def parse_dates(cls, v):
        if isinstance(v, str):
            return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v


class WeatherContextResponse(BaseModel):
    """Weather context response"""
    risk_indices: WeatherRiskIndices
    risk_band: WeatherRiskBand
    historical_data: List[WeatherData] = Field(default_factory=list)
    forecast_data: List[WeatherData] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


# Feedback models
class FeedbackRequest(BaseModel):
    """Feedback for model improvement"""
    trace_id: str
    correct_label: Optional[str] = None
    correct_severity: Optional[int] = Field(None, ge=0, le=100)
    treatment_effectiveness: Optional[int] = Field(None, ge=1, le=5, description="1=poor, 5=excellent")
    actual_outcome: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=1000)
    user_id: Optional[UUID4] = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)


class FeedbackResponse(BaseModel):
    """Feedback submission response"""
    success: bool
    message: str
    feedback_id: str


# Error models
class APIError(BaseModel):
    """API error response"""
    code: int
    message: str
    request_id: str
    timestamp: float
    details: Optional[Dict[str, Any]] = None


# Health check models
class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    timestamp: float
    models_loaded: bool = False
    weather_service_available: bool = False


# ML Model Result Schemas
class PredictionResult(BaseModel):
    """ML model prediction result"""
    class_name: str = Field(..., description="Predicted class/label")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence")
    bounding_box: Optional[List[float]] = Field(None, description="Detection bounding box [x1, y1, x2, y2]")
    additional_info: Dict[str, Any] = Field(default_factory=dict, description="Additional prediction metadata")


class SeverityScore(BaseModel):
    """Pest/disease severity assessment"""
    overall_severity: float = Field(..., ge=0, le=100, description="Overall severity score 0-100")
    affected_area_percentage: float = Field(..., ge=0, le=100, description="Percentage of affected area")
    confidence: float = Field(..., ge=0, le=1, description="Severity assessment confidence")
    severity_factors: List[str] = Field(default_factory=list, description="Factors contributing to severity")


class ImageData(BaseModel):
    """Image data container for processing"""
    data: str = Field(..., description="Base64 encoded image data or file path")
    format: str = Field(..., description="Image format (png, jpg, etc.)")
    filename: str = Field(..., description="Original filename")
    size_bytes: Optional[int] = Field(None, description="File size in bytes")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


# LLM Analysis models
class LLMAnalysisResult(BaseModel):
    """LLM analysis result from a single provider"""
    provider: str = Field(..., description="LLM provider name")
    model_name: str = Field(..., description="Model used for analysis")
    analysis_type: str = Field(..., description="Type of analysis (SLM/LLM/cross_validation)")
    content: str = Field(..., description="Raw LLM response content")
    parsed_data: Optional[Dict[str, Any]] = Field(None, description="Parsed structured data")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Analysis confidence")
    token_usage: Optional[Dict[str, int]] = Field(None, description="Token usage statistics")
    processing_time: float = Field(..., description="Processing time in seconds")
    success: bool = Field(True, description="Whether analysis succeeded")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MultiLLMResults(BaseModel):
    """Results from multiple LLM analyses"""
    slm_analysis: Optional[LLMAnalysisResult] = Field(None, description="SLM-focused analysis")
    llm_analysis: Dict[str, LLMAnalysisResult] = Field(default_factory=dict, description="LLM analyses by provider")
    cross_validation: Optional[LLMAnalysisResult] = Field(None, description="Cross-validation analysis")
    consensus_result: Optional[Dict[str, Any]] = Field(None, description="Final consensus result")
    confidence_scores: Dict[str, float] = Field(default_factory=dict, description="Confidence scores by provider")
    agreement_score: Optional[float] = Field(None, ge=0, le=1, description="Agreement between analyses")
    parallel_processing_time: float = Field(0.0, description="Total parallel processing time")
    total_token_usage: Dict[str, int] = Field(default_factory=dict, description="Total token usage across providers")


# Internal workflow state models (for LangGraph)
from typing import Annotated
from operator import or_ as dict_union

class WorkflowState(BaseModel):
    """Enhanced internal state for LangGraph workflow with multi-LLM support"""
    trace_id: str
    images: List[ImageMetadata] = Field(default_factory=list)
    payload: Optional[AnalysisPayload] = None
    processed_images: List[str] = Field(default_factory=list)  # Base64 or file paths
    
    # Traditional CV pipeline results
    vision_results: Optional[Dict[str, Any]] = None
    severity_assessment: Optional[Severity] = None
    weather_context: Optional[WeatherRisk] = None
    ipm_recommendations: Optional[IPMRecommendations] = None
    
    # Multi-LLM analysis results
    llm_results: MultiLLMResults = Field(default_factory=MultiLLMResults)
    
    # Cross-validation and consensus
    cv_analysis_enabled: bool = Field(True, description="Whether cross-validation is enabled")
    consensus_threshold: float = Field(0.7, ge=0, le=1, description="Minimum consensus threshold")
    
    # Response handling
    final_response: Optional[AnalysisResponse] = None
    enhanced_response: Optional[Dict[str, Any]] = Field(None, description="Enhanced response with LLM insights")
    
    # Error and processing tracking
    errors: List[str] = Field(default_factory=list)
    # Allow multiple processing_time updates from parallel nodes by merging dicts
    # Uses dict union (|) via operator.or_ to combine concurrent writes safely
    processing_times: Annotated[Dict[str, float], dict_union] = Field(default_factory=dict)
    node_execution_order: List[str] = Field(default_factory=list, description="Order of node execution")
    
    # LLM-specific configurations
    active_llm_providers: List[str] = Field(default_factory=list, description="Active LLM providers for this analysis")
    preferred_llm_providers: List[str] = Field(default_factory=list, description="Preferred LLM providers for this analysis")
    skip_llm_analysis: bool = Field(False, description="Skip LLM analysis if needed")
    
    class Config:
        arbitrary_types_allowed = True


# Configuration models
class ModelConfig(BaseModel):
    """ML model configuration"""
    model_path: str
    label_map_path: str
    calibration_path: Optional[str] = None
    confidence_threshold: float = Field(0.5, ge=0, le=1)
    nms_threshold: float = Field(0.4, ge=0, le=1)
    max_detections: int = Field(100, ge=1)


class ProcessingConfig(BaseModel):
    """Image processing configuration"""
    max_image_size: int = Field(1024, description="Maximum image dimension")
    supported_formats: List[str] = Field(["jpg", "jpeg", "png", "webp"])
    max_images_per_request: int = Field(5, ge=1, le=10)
    tile_large_images: bool = Field(True, description="Tile large drone images")
    remove_exif: bool = Field(True, description="Remove EXIF data for privacy")


"""
Pydantic schemas for LLM service requests and responses
"""
from datetime import datetime
from typing import Dict, Any, List, Optional, Union, Literal
from pydantic import BaseModel, Field, validator, conint, confloat
from enum import Enum
from enum import Enum


class ModelProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"
    MOCK = "mock"


class ModelType(str, Enum):
    """Types of models"""
    CHAT = "chat"
    COMPLETION = "completion"
    VISION = "vision"
    EMBEDDING = "embedding"


class Priority(str, Enum):
    """Request priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class TokenUsage(BaseModel):
    """Token usage tracking"""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost: Optional[float] = None
    
    @property
    def cost_per_1k_tokens(self) -> Optional[float]:
        """Calculate cost per 1k tokens if cost is available"""
        if self.estimated_cost and self.total_tokens > 0:
            return (self.estimated_cost / self.total_tokens) * 1000
        return None


class ModelInfo(BaseModel):
    """Information about the model used"""
    provider: ModelProvider
    model_name: str
    model_type: ModelType
    max_tokens: int
    supports_streaming: bool = False
    supports_vision: bool = False
    cost_per_1k_input: Optional[float] = None
    cost_per_1k_output: Optional[float] = None


class PromptRequest(BaseModel):
    """Request for prompt generation"""
    prompt_name: str
    variables: Dict[str, Any]
    model_hint: Optional[str] = None
    priority: Priority = Priority.NORMAL
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    stream: bool = False
    user_id: Optional[str] = None
    request_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    
    @validator('variables')
    def validate_variables(cls, v):
        """Ensure variables is a dictionary"""
        if not isinstance(v, dict):
            raise ValueError("Variables must be a dictionary")
        return v
    
    @validator('temperature')
    def validate_temperature(cls, v):
        """Validate temperature range"""
        if v is not None and not (0.0 <= v <= 2.0):
            raise ValueError("Temperature must be between 0.0 and 2.0")
        return v


class LLMResponse(BaseModel):
    """Response from LLM generation"""
    content: str
    model_info: ModelInfo
    token_usage: TokenUsage
    metadata: Dict[str, Any] = Field(default_factory=dict)
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    latency_ms: Optional[float] = None
    finish_reason: Optional[str] = None
    is_partial: bool = False  # For streaming responses
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class StreamChunk(BaseModel):
    """Streaming response chunk"""
    content: str
    is_final: bool = False
    token_count: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LLMError(BaseModel):
    """Error response from LLM service"""
    error_type: str
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    retry_after: Optional[int] = None


class ModelSelectionCriteria(BaseModel):
    """Criteria for model selection"""
    priority: Priority = Priority.NORMAL
    max_cost_per_request: Optional[float] = None
    max_latency_ms: Optional[int] = None
    required_capabilities: List[str] = Field(default_factory=list)
    preferred_provider: Optional[ModelProvider] = None
    fallback_enabled: bool = True


class AdapterConfig(BaseModel):
    """Configuration for LLM adapters"""
    provider: ModelProvider
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    model_name: str
    max_tokens: int = 2048
    temperature: float = 0.1
    timeout_seconds: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0
    rate_limit_per_minute: Optional[int] = None
    enabled: bool = True
    cost_per_1k_input: Optional[float] = None
    cost_per_1k_output: Optional[float] = None


class HealthCheck(BaseModel):
    """Health check response"""
    service: str
    status: Literal["healthy", "degraded", "unhealthy"]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    adapters: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    metrics: Dict[str, Any] = Field(default_factory=dict)


class UsageStats(BaseModel):
    """Usage statistics"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    average_latency_ms: float = 0.0
    requests_by_model: Dict[str, int] = Field(default_factory=dict)
    last_reset: datetime = Field(default_factory=datetime.utcnow)

class SoilAnalysis(BaseModel):
    n_kg_ha: Optional[float] = None
    p_kg_ha: Optional[float] = None
    k_kg_ha: Optional[float] = None
    s_kg_ha: Optional[float] = None
    ph: Optional[float] = None
    oc: Optional[float] = None
    zn_ppm: Optional[float] = None
    fe_ppm: Optional[float] = None
    mn_ppm: Optional[float] = None
    cu_ppm: Optional[float] = None
    b_ppm: Optional[float] = None
    # Allow arbitrary extra nutrient metrics
    class Config:
        extra = "allow"


class CropInfo(BaseModel):
    species: str = Field(..., description="Crop species e.g. rice, wheat")
    variety: Optional[str] = None
    current_stage: Optional[str] = Field(None, description="Current growth stage")
    target_yield: Optional[float] = Field(None, description="Target yield (t/ha)")
    planting_date: Optional[datetime] = None
    area_acres: Optional[float] = None
    class Config:
        extra = "allow"


class EnvironmentalFactors(BaseModel):
    weather_forecast: Optional[List[Dict[str, Any]]] = None
    irrigation: Optional[str] = None
    soil_moisture: Optional[float] = None
    class Config:
        extra = "allow"


class UserPreferences(BaseModel):
    organic_only: Optional[bool] = False
    budget_level: Optional[str] = None
    preferred_application_method: Optional[str] = None
    class Config:
        extra = "allow"


class SimpleFertilizerRequest(BaseModel):
    n_kg_ha: float = 0
    p_kg_ha: float = 0
    k_kg_ha: float = 0
    s_kg_ha: Optional[float] = 0
    micro_nutrients: Optional[Dict[str, float]] = None
    application_method: Optional[str] = "mixed"
    budget: Optional[float] = None
    class Config:
        extra = "allow"


class FertilizerRequest(BaseModel):
    soil_analysis: SoilAnalysis
    crop_info: CropInfo
    user_preferences: Optional[UserPreferences] = None
    class Config:
        extra = "allow"


class ComprehensiveAnalysisRequest(BaseModel):
    soil_analysis: SoilAnalysis
    crop_info: CropInfo
    environmental_factors: EnvironmentalFactors = Field(default_factory=EnvironmentalFactors)
    user_preferences: UserPreferences = Field(default_factory=UserPreferences)
    class Config:
        extra = "allow"


class CostAnalysisRequest(BaseModel):
    fertilizer_plan: Dict[str, Any] = Field(default_factory=dict, description="Plan with nutrient targets and/or product quantities")
    market_prices: Optional[Dict[str, float]] = None
    farm_details: Optional[Dict[str, Any]] = None
    user_preferences: Optional[UserPreferences] = None
    class Config:
        extra = "allow"


class ScheduleRequest(BaseModel):
    farm_crop_id: int
    crop_species: str
    planting_date: datetime
    current_stage: str
    nutrient_requirements: Dict[str, Any] = Field(default_factory=dict)
    weather_forecast: List[Dict[str, Any]] = Field(default_factory=list)
    class Config:
        extra = "allow"

# Create Pydantic enum for UserRole
class UserRoleEnum(str, Enum):
    vendor = "vendor"
    farmer = "farmer"
    buyer = "buyer"
    admin = "admin"
    agri_copilot = "agri_copilot"
    landowner = "landowner"

# Export list (optional but helpful)
__all__ = [
    "UserCreate", "UserResponse", "LoginRequest", "LoginResponse",
    "Token", "TokenResponse", "TokenData", "EmailRequest", "PasswordReset",
    "FarmerCreate", "FarmerResponse", "LandownerCreate", "LandownerResponse",
    "VendorCreate", "VendorResponse", "BuyerCreate", "BuyerResponse",
    "AgriCopilotResponse", "AgriCopilotRegister", "AgriCopilotInvite", "AgriCopilotCreate",
    "ForgotPasswordRequest", "ResetPasswordRequest"
]

# ---------------- Base / Auth Schemas ----------------
class UserBase(BaseModel):
    custom_id: Optional[str] = Field(
        None,
        description="Custom ID for the user (auto-generated if not provided)",
        min_length=3,
        max_length=50
    )
    full_name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    phone: str = Field(
        ...,
        description="User's phone number (10 digits with optional country code)",
        pattern=r'^(\+?91|0)?[6-9]\d{9}$'  # Accepts: 9876543210, 09876543210, +919876543210, 919876543210
    )
    address_line1: str = Field(..., min_length=1, max_length=200, description="Primary address line")
    address_line2: Optional[str] = Field(
        None,
        max_length=200,
        description="Secondary address line (optional)"
    )
    city: str = Field(..., min_length=1, max_length=100, description="City name")
    state: str = Field(..., min_length=1, max_length=100, description="State/Province name")
    mandal: Optional[str] = Field(None, max_length=100, description="Mandal name (optional)")
    country: str = Field(..., min_length=1, max_length=100, description="Country name")
    postal_code: str = Field(
        ...,
        min_length=6,
        max_length=10,
        description="Postal/ZIP code",
        pattern=r'^[1-9][0-9]{5,9}$'  # 6-10 digits, no leading zeros
    )
    # Aadhar number field
    aadhar_number: Optional[str] = Field(
        None,
        min_length=12,
        max_length=12,
        description="12-digit Aadhar number",
        pattern=r'^[0-9]{12}$'
    )
    # Optional uploaded document URLs (relative paths served by backend static mount)
    photo_url: Optional[str] = None
    aadhar_front_url: Optional[str] = None
    aadhar_back_url: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole

    @validator("password")
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v

class AdminCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator("password")
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v

class AdminResponse(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True


class AgriCopilotInvite(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(
        ...,
        description="Mobile phone number (10 digits, optional country code)",
        min_length=10,
        max_length=15
    )
    
    @validator('phone')
    def validate_phone(cls, v):
        """Validate phone number format"""
        import re
        # Remove any non-digit characters except +
        clean_phone = re.sub(r'[^\d+]', '', str(v))
        
        # Check different valid patterns
        patterns = [
            r'^\+91[6-9]\d{9}$',      # +919876543210
            r'^91[6-9]\d{9}$',        # 919876543210
            r'^0[6-9]\d{9}$',         # 09876543210
            r'^[6-9]\d{9}$'           # 9876543210
        ]
        
        if any(re.match(pattern, clean_phone) for pattern in patterns):
            return clean_phone
        
        raise ValueError('Phone number must be a valid Indian mobile number')


class AgriCopilotRegister(UserBase):
    aadhar_number: str
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str
    photo_url: Optional[str] = None
    aadhar_front_url: Optional[str] = None
    role: UserRole = UserRole.agri_copilot
    
    @validator("password")
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v

# Minimal create schema used by admin flows and services
class AgriCopilotCreate(UserCreate):
    employee_id: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    jurisdiction_area: Optional[str] = None
    education_document_url: Optional[str] = None
    id_proof_url: Optional[str] = None
    resume_url: Optional[str] = None
    profile_photo_url: Optional[str] = None
    pincode: str = Field(..., min_length=3, max_length=10)
    role: UserRole = UserRole.agri_copilot



class AgriCopilotDashboard(BaseModel):
    id: UUID
    custom_id: Optional[str] = None
    full_name: str
    email: str
    phone: str
    aadhar_number: str
    # Complete address/location fields
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    mandal: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    location: Optional[str] = None  # Combined formatted location for display
    is_verified: bool
    verification_status: str
    created_at: datetime
    photo_url: Optional[str]
    aadhar_front_url: Optional[str]

class AgriCopilotResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    custom_id: Optional[str] = None
    full_name: str
    phone: str
    email: EmailStr
    aadhar_number: str
    photo_url: Optional[str] = None
    aadhar_front_url: Optional[str] = None
    is_verified: bool = False
    verified_by: Optional[UUID] = None
    verified_at: Optional[datetime] = None
    verification_status: str
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    class Config:
        orm_mode = True


class MessageResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: UUID
    custom_id: Optional[str] = Field(
        None,
        description="Custom ID for the user"
    )
    email: str = Field(..., description="User's email address")
    full_name: str = Field(..., description="User's full name")
    phone: Optional[str] = Field(
        None,
        description="User's phone number"
    )
    address_line1: str = Field(..., description="Primary address line")
    address_line2: Optional[str] = Field(
        None,
        description="Secondary address line (optional)"
    )
    city: str = Field(..., description="City name")
    state: str = Field(..., description="State/Province name")
    mandal: Optional[str] = Field(None, description="Mandal name")
    country: str = Field(..., description="Country name")
    postal_code: str = Field(..., description="Postal/ZIP code")
    role: str = Field(..., description="User's role in the system")
    user_type: str = Field(..., description="Type of user (farmer, vendor, etc.)")
    is_active: bool = Field(True, description="Whether the user account is active")
    is_verified: bool = Field(False, description="Whether the user's email/phone is verified")
    created_at: Optional[datetime] = Field(
        None,
        description="Timestamp when the user was created"
    )
    updated_at: Optional[datetime] = Field(
        None,
        description="Timestamp when the user was last updated"
    )
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

    @validator('role', 'user_type', pre=True)
    def convert_role(cls, v):
        if v is None:
            return ""
        if isinstance(v, UserRole):
            return v.value
        return str(v) if v else ""

class LoginRequest(BaseModel):
    email: Optional[EmailStr] = Field(None, description="Email address for login. Either email or phone must be provided, but not both.")
    phone: Optional[str] = Field(
        None,
        description="Phone number for login. Either email or phone must be provided, but not both.",
        pattern=r'^(\+?91|0)?[6-9]\d{9}$'  # Accepts: 9876543210, 09876543210, +919876543210, 919876543210
    )
    password: str

    @model_validator(mode='after')
    def validate_email_or_phone(self) -> 'LoginRequest':
        if not self.email and not self.phone:
            raise ValueError('Either email or phone must be provided')
        if self.email and self.phone:
            raise ValueError('Provide either email or phone, not both')
        return self

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

    class Config:
        orm_mode = True

# Token and helpers
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenResponse(Token):
    pass

class TokenData(BaseModel):
    email: Optional[str] = None

# Password reset & OTP
class EmailRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @validator("new_password")
    def validate_pwd(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @validator("confirm_password")
    def confirm_matches(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v

class OTPRequest(BaseModel):
    email: EmailStr

class OTPResponse(BaseModel):
    message: str
    email: EmailStr

class OTPVerify(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    otp: str
    
    @validator('phone')
    def validate_phone_or_email(cls, v, values):
        if not v and not values.get('email'):
            raise ValueError('Either email or phone must be provided')
        return v

class MessageResponse(BaseModel):
    message: str
    success: bool = True

# ---------------- Role-specific Schemas ----------------
# Farmer
class FarmerCreate(UserCreate):
    farm_size: float = Field(..., gt=0)
    primary_crop_types: str
    years_of_experience: int = Field(..., ge=0)
    farmer_location: str
    role: UserRole = UserRole.farmer

class FarmerResponse(BaseModel):
    id: UUID
    custom_id: Optional[str] = None
    full_name: str
    email: EmailStr
    phone: Optional[str]
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    mandal: Optional[str] = Field(None, max_length=100, description="Mandal name")
    country: str
    postal_code: str
    farm_size: float
    primary_crop_types: str
    years_of_experience: int
    farmer_location: str
    created_at: datetime
    user_type: UserRole = UserRole.farmer

    class Config:
        orm_mode = True

# Landowner
class LandownerCreate(UserCreate):
    total_land_area: float = Field(..., gt=0)
    current_land_use: LandUse
    managing_remotely: bool
    user_type: UserRole = UserRole.landowner

class LandownerResponse(BaseModel):
    id: UUID
    custom_id: Optional[str] = None
    full_name: str
    email: EmailStr
    phone: Optional[str]
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    mandal: Optional[str] = Field(None, max_length=100, description="Mandal name")
    country: str
    postal_code: str
    total_land_area: float
    current_land_use: LandUse
    managing_remotely: bool
    created_at: datetime
    user_type: UserRole = UserRole.landowner

    class Config:
        orm_mode = True

# Vendor
class VendorCreate(UserCreate):
    legal_name: str
    business_name: str
    gstin: str
    pan: str
    business_type: ServiceType
    product_services: str
    years_in_business: int = Field(..., ge=0)
    service_area: str
    user_type: UserRole = UserRole.vendor

class VendorResponse(BaseModel):
    id: UUID
    custom_id: Optional[str] = None
    full_name: str
    email: EmailStr
    phone: Optional[str]
    legal_name: str
    business_name: str
    gstin: str
    pan: str
    business_type: ServiceType
    product_services: str
    years_in_business: int
    service_area: str
    rating_avg: float = 0.0
    rating_count: int = 0
    verified: bool = False
    certification_status: str = "PENDING"
    created_at: datetime
    user_type: UserRole = UserRole.vendor

    class Config:
        orm_mode = True

# Buyer
class BuyerCreate(UserCreate):
    organization_name: str
    buyer_type: str
    interested_crop_types: str
    preferred_products: str
    monthly_purchase_volume: float = Field(..., gt=0)
    business_license_number: str
    gst_number: str
    user_type: UserRole = UserRole.buyer

class BuyerResponse(BaseModel):
    id: UUID
    custom_id: Optional[str] = None
    full_name: str
    email: EmailStr
    phone: Optional[str]
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    mandal: Optional[str] = Field(None, max_length=100, description="Mandal name")
    country: Optional[str] = None
    postal_code: Optional[str] = None
    organization_name: str
    buyer_type: str
    interested_crop_types: str
    preferred_products: str
    monthly_purchase_volume: float
    business_license_number: str
    gst_number: str
    reliability_score: float = 0.0
    created_at: datetime
    user_type: UserRole = UserRole.buyer

    class Config:
        orm_mode = True

# Forgot / Reset helpers
class ForgotPasswordRequest(BaseModel):
    email: Optional[EmailStr] = Field(
        None,
        description="Email address for password reset. Either email or phone must be provided, but not both.",
        examples=["user@example.com"]
    )
    phone: Optional[str] = Field(
        None,
        description="Phone number (10 digits with optional +91 country code). Either email or phone must be provided, but not both.",
        examples=["9876543210", "+919876543210"],
        pattern=r'^(\+?91|0)?[6-9]\d{9}$'  # Accepts: 9876543210, 09876543210, +919876543210, 919876543210
    )
    
    @model_validator(mode='after')
    def validate_phone_or_email(self):
        email = self.email
        phone = self.phone
        
        if not email and not phone:
            raise ValueError('Either email or phone must be provided')
        if email and phone:
            # If both are provided, use the non-null one (prefer email if both are non-null)
            self.phone = None
            
        return self

# Removed duplicate ResetPasswordRequest - using the one below with OTP validation

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    success: bool = False


class AdminCreate(BaseModel): 
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    is_super_admin: bool = False
    department: Optional[str] = None
    permissions: Optional[str] = None

class AdminResponse(BaseModel):
    id: UUID
    email: EmailStr
    phone: str
    full_name: str
    is_super_admin: bool
    department: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class DeviceInfo(BaseModel):
    user_agent: Optional[str] = None
    platform: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None

class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    otp: Optional[str] = None
    auth_method: Optional[str] = "password"  # "password" or "otp"
    device_info: Optional[DeviceInfo] = None

    @validator('auth_method')
    def validate_auth_method(cls, v):
        if v not in ['password', 'otp']:
            raise ValueError('auth_method must be either "password" or "otp"')
        return v

    @validator('password')
    def validate_password(cls, v, values):
        if values.get('auth_method') == 'password' and not v:
            raise ValueError('Password is required for password authentication')
        return v

    @validator('otp')
    def validate_otp(cls, v, values):
        if values.get('auth_method') == 'otp' and not v:
            raise ValueError('OTP is required for OTP authentication')
        if v and not re.match(r'^\d{6}$', v):
            raise ValueError('OTP must be 6 digits')
        return v

    @validator('email')
    def validate_email(cls, v, values):
        if not v and not values.get('phone'):
            raise ValueError('Either email or phone is required')
        if v:
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
                raise ValueError('Invalid email format')
        return v

    @validator('phone')
    def validate_phone(cls, v, values):
        if not v and not values.get('email'):
            raise ValueError('Either email or phone is required')
        if v:
            # Remove all non-digit characters
            digits = re.sub(r'\D', '', v)
            # Check if it's a valid Indian phone number
            if len(digits) == 10:
                return f"+91{digits}"
            elif len(digits) == 11 and digits.startswith('0'):
                return f"+91{digits[1:]}"
            elif len(digits) == 12 and digits.startswith('91'):
                return f"+{digits}"
            elif len(digits) == 13 and digits.startswith('+91'):
                return digits
            else:
                raise ValueError('Invalid phone number format. Use 10 digits with optional +91 prefix')
        return v

class ForgotPasswordRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None

class OTPVerify(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    otp: str

    @validator('otp')
    def validate_otp(cls, v):
        if len(v) != 6 or not v.isdigit():
            raise ValueError('OTP must be 6 digits')
        return v

class ResetPasswordRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    otp: str
    new_password: str

    @validator('otp')
    def validate_otp(cls, v):
        if len(v) != 6 or not v.isdigit():
            raise ValueError('OTP must be 6 digits')
        return v

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class MessageResponse(BaseModel):
    message: str
    success: bool

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict
    redirect_to: str

class HTTPError(BaseModel):
    detail: str
    code: Optional[str] = None
    errors: Optional[Dict[str, List[str]]] = None

class HTTPValidationError(BaseModel):
    detail: List[Dict[str, Any]]

class Defect(BaseModel):
    type: str = Field(..., description="Type of defect detected", example="minor_bruise")
    confidence: float = Field(..., description="Confidence score (0.0 - 1.0)", example=0.88)
    bounding_box: List[float] = Field(
        ..., description="Normalized [xmin, ymin, xmax, ymax]", example=[0.1, 0.15, 0.2, 0.25]
    )

class QualityReport(BaseModel):
    overall_quality: str = Field(..., description="Overall quality grade", example="Grade A")
    shelf_life_days: int = Field(..., description="Estimated shelf life in days", example=12)
    defects_found: int = Field(..., description="Number of defects detected", example=1)
    defects: List[Defect] = Field(..., description="List of detected defects")
    crop_detected: Optional[str] = Field(None, description="Detected crop type from AI model", example="Tomato")
    crop_confidence: Optional[float] = Field(None, description="Confidence score for crop detection", example=0.95)
    freshness: Optional[str] = Field("N/A", description="Freshness assessment", example="Excellent - Very Fresh")
    freshness_score: Optional[float] = Field(0.0, description="Freshness score (0-1)", example=0.92)
    visual_defects: Optional[str] = Field("None", description="Visual defect summary", example="Minor Spots: Low severity")
    optimal_storage_days: Optional[int] = Field(None, description="AI-recommended optimal storage duration", example=90)

class FullAnalysisResponse(BaseModel):
    vision_analysis: QualityReport
    ai_recommendation: str = Field(..., description="Recommendation from LLM", example="Grade A, suitable for premium markets.")
    llm_provider: str = Field(..., description="LLM provider used", example="Gemini")

class AnalysisRequest(BaseModel):
    include_llm_analysis: bool = Field(True, description="Whether to include LLM-based insights")
    llm_provider: Optional[str] = Field(None, description="Preferred LLM provider")
    additional_context: Optional[str] = Field(None, description="Additional context for analysis")

class AnalysisResponse(BaseModel):  # legacy
    success: bool
    message: str
    report: Optional[QualityReport] = None
    processing_time: float


# =========================================================
# SECTION B: StorageGuard Workflow
# =========================================================
class StorageType(str, enum.Enum):
    cold_storage = "cold_storage"
    dry_storage  = "dry_storage"
    transport    = "transport"
    processing   = "processing"

class StorageJobStatus(str, enum.Enum):
    SCHEDULED  = "SCHEDULED"
    IN_STORAGE = "IN_STORAGE"
    RELEASED   = "RELEASED"
    CLOSED     = "CLOSED"
    DISPUTE    = "DISPUTE"

class StorageProofType(str, enum.Enum):
    INTAKE   = "INTAKE"
    DISPATCH = "DISPATCH"

# -------------------
# Storage Location
# -------------------
class StorageLocationCreate(BaseModel):
    name: str
    type: StorageType
    address: str
    lat: confloat(ge=-90, le=90) # type: ignore
    lon: confloat(ge=-180, le=180) # type: ignore
    capacity_text: str
    price_text: str
    phone: Optional[str]
    hours: Optional[str]
    facilities: List[str] = []

class StorageLocationOut(BaseModel):
    id: UUID
    name: str
    type: StorageType
    address: str
    lat: float
    lon: float
    capacity_text: str
    price_text: str
    rating: Optional[float] = None
    phone: Optional[str] = None
    hours: Optional[str] = None
    facilities: List[str] = []
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True

# -------------------
# RFQ
# -------------------
class RFQCreate(BaseModel):
    crop: str
    quantity_kg: conint(gt=0) # type: ignore
    storage_type: StorageType
    duration_days: conint(ge=1, le=365) # type: ignore
    max_budget: Optional[float] = None
    origin_lat: confloat(ge=-90, le=90) # type: ignore
    origin_lon: confloat(ge=-180, le=180) # type: ignore

class RFQOut(BaseModel):
    id: UUID
    crop: str
    quantity_kg: int
    storage_type: StorageType
    duration_days: int
    status: str

    class Config:
        from_attributes = True

# -------------------
# Bids
# -------------------
class BidCreate(BaseModel):
    location_id: UUID
    price_text: str
    eta_hours: conint(gt=0, le=240) # type: ignore
    notes: Optional[str] = None

class BidOut(BaseModel):
    id: UUID
    price_text: str
    eta_hours: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# -------------------
# Jobs
# -------------------
class JobAwardIn(BaseModel):
    bid_id: UUID

class JobOut(BaseModel):
    id: UUID
    rfq_id: UUID
    location_id: UUID
    vendor_id: Optional[UUID]
    status: StorageJobStatus

    class Config:
        from_attributes = True

# -------------------
# Proofs
# -------------------
class ProofCreate(BaseModel):
    job_id: UUID
    proof_type: StorageProofType
    photo_url: Optional[HttpUrl] = None
    receipt_url: Optional[HttpUrl] = None
    lat: Optional[float]
    lon: Optional[float]
    notes: Optional[str]

class ProofOut(BaseModel):
    id: UUID
    farmer_confirmed: bool
    vendor_confirmed: bool

    class Config:
        from_attributes = True

# -------------------
# Inspection (AgriCopilot)
# -------------------
class InspectionCreate(BaseModel):
    image_urls: List[HttpUrl] = Field(..., min_items=1)
    farmer_id: UUID

class InspectionOut(BaseModel):
    id: UUID
    crop_detected: Optional[str]
    grade: Optional[str]
    recommendation: Optional[str]
    defects: Optional[dict] = {}
    image_urls: List[str]
    rfq: Optional[RFQOut]

    class Config:
        from_attributes = True


# =========================================================
# DIRECT BOOKING SCHEMAS (NEW)
# =========================================================

class BookingStatus(str, enum.Enum):
    """Booking status options"""
    pending = "pending"
    confirmed = "confirmed"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    """Payment status options"""
    pending = "pending"
    processing = "processing"
    paid = "paid"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class TransportBookingStatus(str, enum.Enum):
    """Transport booking status"""
    pending = "pending"
    confirmed = "confirmed"
    in_transit = "in_transit"
    delivered = "delivered"
    cancelled = "cancelled"


# Storage Booking Schemas
class StorageBookingCreate(BaseModel):
    """Create a direct storage booking"""
    location_id: UUID
    crop_type: str
    quantity_kg: int
    grade: Optional[str] = None
    duration_days: int
    start_date: datetime
    transport_required: bool = False
    ai_inspection_id: Optional[UUID] = None
    
    # Transport details (if required)
    pickup_location: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lon: Optional[float] = None
    pickup_time: Optional[datetime] = None


class StorageBookingOut(BaseModel):
    """Storage booking response"""
    id: UUID
    farmer_id: UUID
    location_id: UUID
    vendor_id: Optional[UUID]
    crop_type: str
    quantity_kg: int
    grade: Optional[str]
    duration_days: int
    start_date: datetime
    end_date: datetime
    price_per_day: float
    total_price: float
    booking_status: str
    payment_status: str
    vendor_confirmed: bool
    vendor_confirmed_at: Optional[datetime]
    transport_required: bool
    transport_booking_id: Optional[UUID]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StorageBookingUpdate(BaseModel):
    """Update storage booking"""
    booking_status: Optional[BookingStatus] = None
    vendor_notes: Optional[str] = None


class VendorConfirmBooking(BaseModel):
    """Vendor confirms/rejects booking"""
    confirmed: bool
    notes: Optional[str] = None


# Storage Suggestion Schema
class StorageSuggestion(BaseModel):
    """Storage location suggestion after AI analysis"""
    location_id: UUID
    name: str
    type: str
    address: str
    distance_km: float
    price_per_day: float
    estimated_total_price: float
    capacity_available: bool
    rating: float
    facilities: List[str]
    vendor_name: Optional[str]
    lat: float
    lon: float


class AnalyzeAndSuggestRequest(BaseModel):
    """Request for AI analysis + storage suggestions"""
    farmer_lat: float
    farmer_lon: float
    max_distance_km: Optional[float] = 50.0
    max_results: Optional[int] = 5


class AnalyzeAndSuggestResponse(BaseModel):
    """Response with AI analysis and storage suggestions"""
    analysis: dict  # AI crop analysis results
    inspection_id: UUID
    suggestions: List[StorageSuggestion]
    processing_time: float


# Transport Booking Schemas
class TransportBookingCreate(BaseModel):
    """Create transport booking"""
    pickup_location: str
    pickup_lat: float
    pickup_lon: float
    delivery_location: str
    delivery_lat: float
    delivery_lon: float
    cargo_type: str
    cargo_weight_kg: int
    pickup_time: datetime
    special_requirements: Optional[str] = None


class TransportBookingOut(BaseModel):
    """Transport booking response"""
    id: UUID
    farmer_id: UUID
    vendor_id: Optional[UUID]
    vehicle_id: Optional[UUID]
    pickup_location: str
    pickup_lat: float
    pickup_lon: float
    delivery_location: str
    delivery_lat: float
    delivery_lon: float
    cargo_type: str
    cargo_weight_kg: int
    pickup_time: datetime
    estimated_delivery_time: datetime
    actual_delivery_time: Optional[datetime]
    distance_km: Optional[float]
    transport_cost: float
    booking_status: str
    payment_status: str
    current_lat: Optional[float]
    current_lon: Optional[float]
    last_location_update: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# SCHEDULED INSPECTION SCHEMAS
# ============================================================================

class InspectionType(str, Enum):
    """Types of scheduled inspections"""
    pre_storage = "pre_storage"
    during_storage = "during_storage"
    final = "final"
    dispute = "dispute"


class TimeSlot(str, Enum):
    """Preferred time slots for inspection"""
    morning = "morning"  # 8 AM - 12 PM
    afternoon = "afternoon"  # 12 PM - 4 PM
    evening = "evening"  # 4 PM - 7 PM


class InspectionStatus(str, Enum):
    """Inspection scheduling status"""
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class InspectionScheduleCreate(BaseModel):
    """Request to schedule an on-site inspection"""
    booking_id: Optional[UUID] = Field(None, description="Link to existing booking (optional)")
    inspection_type: InspectionType
    crop_type: str = Field(..., min_length=2, max_length=120)
    quantity_kg: int = Field(..., gt=0)
    location_address: str = Field(..., min_length=10)
    location_lat: Optional[float] = Field(None, ge=-90, le=90)
    location_lon: Optional[float] = Field(None, ge=-180, le=180)
    requested_date: datetime = Field(..., description="Preferred inspection date")
    preferred_time_slot: Optional[TimeSlot] = None
    farmer_notes: Optional[str] = Field(None, max_length=1000)


class InspectionScheduleOut(BaseModel):
    """Scheduled inspection response"""
    id: UUID
    farmer_id: UUID
    booking_id: Optional[UUID]
    vendor_id: Optional[UUID]
    inspection_type: str
    crop_type: str
    quantity_kg: int
    location_address: str
    location_lat: Optional[float]
    location_lon: Optional[float]
    requested_date: datetime
    preferred_time_slot: Optional[str]
    scheduled_date: Optional[datetime]
    completed_date: Optional[datetime]
    status: str
    farmer_notes: Optional[str]
    inspector_notes: Optional[str]
    cancellation_reason: Optional[str]
    inspection_result_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime]

    class Config:
        from_attributes = True


class InspectionConfirm(BaseModel):
    """Vendor confirms inspection schedule"""
    scheduled_date: datetime
    inspector_notes: Optional[str] = None


class InspectionComplete(BaseModel):
    """Complete inspection with results"""
    inspector_notes: str = Field(..., min_length=10)
    crop_detected: str
    grade: str = Field(..., pattern="^[ABC]$")
    defects: List[str] = []
    freshness: str
    shelf_life_days: int = Field(..., gt=0)
    recommendation: Optional[str] = None


class InspectionCancel(BaseModel):
    """Cancel scheduled inspection"""
    cancellation_reason: str = Field(..., min_length=10, max_length=500)


class InspectionList(BaseModel):
    """List of scheduled inspections"""
    inspections: List[InspectionScheduleOut]
    total: int
    pending: int
    confirmed: int
    completed: int


# Payment Schemas
class PaymentCreate(BaseModel):
    """Create payment record"""
    booking_id: Optional[UUID] = None
    transport_booking_id: Optional[UUID] = None
    amount: float
    payment_type: str  # storage, transport, combined
    payment_method: str  # card, upi, net_banking, wallet
    payment_gateway: str  # razorpay, stripe


class PaymentInitiate(BaseModel):
    """Initiate payment"""
    booking_id: Optional[UUID] = None
    transport_booking_id: Optional[UUID] = None
    payment_method: str
    payment_gateway: str = "razorpay"


class PaymentVerify(BaseModel):
    """Verify payment from gateway"""
    payment_id: UUID
    gateway_payment_id: str
    gateway_order_id: str
    gateway_signature: str


class PaymentOut(BaseModel):
    """Payment response"""
    id: UUID
    booking_id: Optional[UUID]
    transport_booking_id: Optional[UUID]
    payer_id: UUID
    payee_id: UUID
    amount: float
    payment_type: str
    payment_method: Optional[str]
    payment_gateway: Optional[str]
    transaction_id: Optional[str]
    status: str
    initiated_at: datetime
    completed_at: Optional[datetime]
    failed_at: Optional[datetime]
    failure_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Farmer Dashboard Schemas
class FarmerBookingSummary(BaseModel):
    """Summary of farmer's bookings"""
    total_bookings: int
    active_bookings: int
    completed_bookings: int
    pending_payments: int
    total_spent: float


class FarmerDashboardResponse(BaseModel):
    """Farmer dashboard data"""
    summary: FarmerBookingSummary
    active_bookings: List[StorageBookingOut]
    recent_bookings: List[StorageBookingOut]
    pending_payments: List[PaymentOut]


