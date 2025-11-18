"""
Enhanced Multi-LLM Service for intelligent nutrient recommendations
Provides LLM-based analysis with prompt engineering - no mock/default values
"""

import logging
import json
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from enum import Enum
import os

try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
except ImportError:
    genai = None
    HarmCategory = None
    HarmBlockThreshold = None

try:
    import openai
except ImportError:
    openai = None

try:
    import anthropic
except ImportError:
    anthropic = None

from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMProvider(Enum):
    """Supported LLM providers"""
    GEMINI = "gemini"
    OPENAI = "openai"
    CLAUDE = "claude"
    LLAMA = "llama"
    COHERE = "cohere"

@dataclass
class GeminiResponse:
    """Structured response from Gemini API"""
    content: str
    confidence: float
    response_time: float
    model_used: str
    timestamp: datetime
    error: Optional[str] = None
    success: bool = True

@dataclass
class NutrientAnalysisRequest:
    """Enhanced request structure for nutrient analysis"""
    soil_analysis: Dict[str, Any]
    crop_info: Dict[str, Any]
    current_nutrients: Dict[str, float]
    deficiencies: List[str]
    growth_stage: str
    target_yield: float
    farm_context: Dict[str, Any]
    user_preferences: Dict[str, Any]
    weather_forecast: List[Dict[str, Any]]

@dataclass
class NutrientRecommendationRequest:
    """Request structure for nutrient recommendations"""
    crop_info: Dict[str, Any]
    soil_analysis: Dict[str, Any]
    farm_context: Dict[str, Any]
    current_nutrients: Dict[str, float]
    deficiencies: List[str]
    weather_forecast: List[Dict[str, Any]]
    user_preferences: Optional[Dict[str, Any]] = None

class GeminiService:
    """Enhanced singleton service for multi-LLM integration with prompt engineering"""
    
    _instance = None
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def generate_response(self, prompt: str, provider: Optional[LLMProvider] = None, **kwargs) -> GeminiResponse:
        """Generate response using specified LLM provider with retry logic"""
        provider = provider or self.active_provider
        
        # Validate API availability before proceeding
        if not self._validate_api_availability():
            return GeminiResponse(
                content="",
                confidence=0.0,
                response_time=0.0,
                model_used="none",
                timestamp=datetime.now(),
                error="Gemini API is not properly configured. Please check your API key and configuration.",
                success=False
            )
        
        if provider not in self.providers:
            return GeminiResponse(
                content="",
                confidence=0.0,
                response_time=0.0,
                model_used=provider.value if provider else "unknown",
                timestamp=datetime.now(),
                error=f"Provider {provider.value if provider else 'unknown'} is not configured",
                success=False
            )
        
        start_time = datetime.now()
        
        try:
            if provider == LLMProvider.GEMINI:
                response = await self._call_gemini(prompt, **kwargs)
            elif provider == LLMProvider.OPENAI:
                response = await self._call_openai(prompt, **kwargs)
            elif provider == LLMProvider.CLAUDE:
                response = await self._call_claude(prompt, **kwargs)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
            
            response_time = (datetime.now() - start_time).total_seconds()
            response.response_time = response_time
            
            return response
            
        except Exception as e:
            # Try fallback to Gemini if available
            if provider != LLMProvider.GEMINI and LLMProvider.GEMINI in self.providers:
                logger.warning(f"Provider {provider.value} failed, falling back to Gemini")
                try:
                    return await self._call_gemini(prompt, **kwargs)
                except Exception as fallback_error:
                    logger.error(f"Fallback to Gemini also failed: {fallback_error}")
            
            response_time = (datetime.now() - start_time).total_seconds()
            return GeminiResponse(
                content="",
                confidence=0.0,
                response_time=response_time,
                model_used=provider.value,
                timestamp=datetime.now(),
                error=str(e),
                success=False
            )
    
    async def _call_gemini(self, prompt: str, **kwargs) -> GeminiResponse:
        """Call Gemini API with real-time data processing"""
        try:
            if not self.model:
                raise ValueError("Gemini model not available. Please check API configuration.")
            
            # Merge any additional generation config
            generation_config = {**self.generation_config}
            if 'temperature' in kwargs:
                generation_config['temperature'] = kwargs['temperature']
            if 'max_tokens' in kwargs:
                generation_config['max_output_tokens'] = kwargs['max_tokens']
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.model.generate_content(
                    prompt,
                    generation_config=generation_config,
                    safety_settings=self.safety_settings
                )
            )
            finish_reason = getattr(response, 'finish_reason', None)
            response_text = getattr(response, 'text', None)
            if not response_text or (finish_reason is not None and finish_reason != 0):
                # Retry once if STOP, else return user-friendly error
                logger.warning(f"Gemini returned finish_reason={finish_reason}, retrying once...")
                response_retry = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.model.generate_content(
                        prompt,
                        generation_config=generation_config,
                        safety_settings=self.safety_settings
                    )
                )
                response_text_retry = getattr(response_retry, 'text', None)
                finish_reason_retry = getattr(response_retry, 'finish_reason', None)
                if response_text_retry and (finish_reason_retry is None or finish_reason_retry == 0):
                    confidence = self._calculate_confidence(response_text_retry)
                    return GeminiResponse(
                        content=response_text_retry,
                        confidence=confidence,
                        response_time=0.0,
                        model_used="gemini-2.5-flash",
                        timestamp=datetime.now(),
                        success=True
                    )
                # If still invalid, return user-friendly error
                error_msg = (
                    f"Gemini API did not return a valid response. finish_reason={finish_reason_retry}. "
                    "Please try again or adjust your prompt."
                )
                logger.error(error_msg)
                return GeminiResponse(
                    content="",
                    confidence=0.0,
                    response_time=0.0,
                    model_used="gemini-2.5-flash",
                    timestamp=datetime.now(),
                    error=error_msg,
                    success=False
                )
            # Valid response
            confidence = self._calculate_confidence(response_text)
            return GeminiResponse(
                content=response_text,
                confidence=confidence,
                response_time=0.0,
                model_used="gemini-2.5-flash",
                timestamp=datetime.now(),
                success=True
            )
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return GeminiResponse(
                content="",
                confidence=0.0,
                response_time=0.0,
                model_used="gemini-2.5-flash",
                timestamp=datetime.now(),
                error=str(e),
                success=False
            )
    
    async def _call_openai(self, prompt: str, **kwargs) -> GeminiResponse:
        """Call OpenAI API"""
        try:
            if LLMProvider.OPENAI not in self.providers or not openai:
                raise ValueError("OpenAI provider not available")
            
            messages = [{"role": "user", "content": prompt}]
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=messages,
                temperature=kwargs.get('temperature', 0.7),
                max_tokens=kwargs.get('max_tokens', 4096)
            )
            
            content = response.choices[0].message.content
            confidence = self._calculate_confidence(content)
            
            return GeminiResponse(
                content=content,
                confidence=confidence,
                response_time=0.0,
                model_used="gpt-4",
                timestamp=datetime.now(),
                success=True
            )
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return GeminiResponse(
                content="",
                confidence=0.0,
                response_time=0.0,
                model_used="gpt-4",
                timestamp=datetime.now(),
                error=str(e),
                success=False
            )
    
    async def _call_claude(self, prompt: str, **kwargs) -> GeminiResponse:
        """Call Claude API"""
        try:
            if LLMProvider.CLAUDE not in self.providers or not anthropic:
                raise ValueError("Claude provider not available")
            
            client = self.providers[LLMProvider.CLAUDE]["client"]
            
            response = await client.messages.create(
                model="claude-3-sonnet-20240229",
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get('temperature', 0.7),
                max_tokens=kwargs.get('max_tokens', 4096)
            )
            
            content = response.content[0].text
            confidence = self._calculate_confidence(content)
            
            return GeminiResponse(
                content=content,
                confidence=confidence,
                response_time=0.0,
                model_used="claude-3-sonnet-20240229",
                timestamp=datetime.now(),
                success=True
            )
            
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return GeminiResponse(
                content="",
                confidence=0.0,
                response_time=0.0,
                model_used="claude-3-sonnet-20240229",
                timestamp=datetime.now(),
                error=str(e),
                success=False
            )
    
    def _calculate_confidence(self, content: str) -> float:
        """Calculate confidence score based on response characteristics"""
        if not content:
            return 0.0
        
        confidence = 0.5  # Base confidence
        
        # Increase confidence for structured responses
        if any(indicator in content for indicator in ['{', 'recommendations:', 'analysis:', '```']):
            confidence += 0.2
        
        # Increase confidence for detailed responses
        if len(content) > 500:
            confidence += 0.1
        
        # Increase confidence for responses with specific nutrients
        nutrient_keywords = ['nitrogen', 'phosphorus', 'potassium', 'NPK', 'kg/ha', 'ppm']
        if any(keyword.lower() in content.lower() for keyword in nutrient_keywords):
            confidence += 0.15
        
        # Increase confidence for actionable recommendations
        action_keywords = ['apply', 'recommend', 'use', 'consider', 'schedule']
        if any(keyword.lower() in content.lower() for keyword in action_keywords):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _validate_api_availability(self) -> bool:
        """Validate that the Gemini API is properly configured and available"""
        try:
            # Check if API key is configured
            api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
            if not api_key:
                logger.error("Gemini API key not configured. Please set GEMINI_API_KEY environment variable.")
                return False
                
            # Check if genai library is available
            if not genai:
                logger.error("Google Generative AI library not installed. Install with: pip install google-generativeai")
                return False
                
            # Check if we have the internal model or can create it
            if not hasattr(self, '_model'):
                logger.warning("Model attribute not initialized yet")
                return False
                
            # If model is None, try to create it during validation
            if self._model is None:
                try:
                    genai.configure(api_key=api_key)
                    self._model = genai.GenerativeModel(
                        model_name="gemini-2.5-flash",
                        generation_config=getattr(self, 'generation_config', {
                            "temperature": 0.7,
                            "max_output_tokens": 4096
                        }),
                        safety_settings=getattr(self, 'safety_settings', None)
                    )
                    logger.info("Model created during validation")
                except Exception as e:
                    logger.error(f"Failed to create model during validation: {e}")
                    return False
                
            return True
        except Exception as e:
            logger.error(f"API validation failed: {e}")
            return False
    
    async def get_nutrient_recommendations_async(self, request: NutrientAnalysisRequest) -> GeminiResponse:
        """Get enhanced nutrient recommendations using LLM-based analysis"""
        try:
            # Generate optimized prompt
            prompt_data = self._generate_nutrient_analysis_prompt(request)
            
            # Combine system and user prompts for single-prompt models
            full_prompt = f"{prompt_data['system_prompt']}\n\n{prompt_data['user_prompt']}"
            
            # Generate response using active provider
            response = await self.generate_response(
                full_prompt,
                temperature=prompt_data['temperature'],
                max_tokens=prompt_data['max_tokens']
            )
            
            if response.success:
                # Try to parse JSON response
                parsed_content = self._parse_json_response(response.content)
                
                # Return enhanced content with structured data if parsed
                enhanced_content = parsed_content or response.content
                if isinstance(enhanced_content, dict):
                    enhanced_content = json.dumps(enhanced_content, indent=2)
                
                return GeminiResponse(
                    content=enhanced_content,
                    confidence=response.confidence,
                    response_time=response.response_time,
                    model_used=response.model_used,
                    timestamp=response.timestamp,
                    success=True
                )
            else:
                return GeminiResponse(
                    content="",
                    confidence=0.0,
                    response_time=response.response_time,
                    model_used=response.model_used,
                    timestamp=response.timestamp,
                    error=response.error,
                    success=False
                )
                
        except Exception as e:
            logger.error(f"Error in nutrient recommendations: {e}")
            return GeminiResponse(
                content="",
                confidence=0.0,
                response_time=0.0,
                model_used="gemini-2.5-flash",
                timestamp=datetime.now(),
                error=str(e),
                success=False
            )
    
    def _parse_json_response(self, content: str) -> Optional[Dict[str, Any]]:
        """Try to parse JSON from response content"""
        try:
            import re
            # Look for JSON-like structure
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
        except Exception as e:
            logger.debug(f"JSON parsing failed: {e}")
        
        return None
    
    def __init__(self):
        if self._initialized:
            return
        
        # Initialize multi-LLM support
        self.providers = {}
        self.active_provider = LLMProvider.GEMINI
        self._model = None
        self.safety_settings = None
        self.generation_config = None
        self._api_available = False
        
        self._initialize_providers()
        self._initialized = True
        
        logger.info("Enhanced GeminiService initialized with multi-LLM support")
    
    def _initialize_providers(self):
        """Initialize all available LLM providers"""
        self._setup_gemini()
        self._setup_openai()
        self._setup_claude()
        
        logger.info(f"Initialized {len(self.providers)} LLM provider(s)")
    
    def _setup_gemini(self):
        """Initialize Gemini AI configuration"""
        if not genai:
            logger.error("Google Generative AI package not available. Install with: pip install google-generativeai")
            return
        
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("Gemini API key not found. Please set GEMINI_API_KEY environment variable.")
            return
        
        try:
            genai.configure(api_key=api_key)
            
            # Configure safety settings
            self.safety_settings = {
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            } if HarmCategory and HarmBlockThreshold else None
            
            # Configure generation parameters
            self.generation_config = {
                "temperature": 0.7,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 4096
            }
            
            # Initialize the model
            self._model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                generation_config=self.generation_config,
                safety_settings=self.safety_settings
            )
            
            self.providers[LLMProvider.GEMINI] = {
                "client": genai,
                "model": self._model,
                "config": self.generation_config
            }
            
            self._api_available = True
            logger.info("Gemini model initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            self._api_available = False
    
    def _setup_openai(self):
        """Setup OpenAI provider"""
        try:
            openai_key = os.getenv("OPENAI_API_KEY")
            if openai_key and openai:
                self.providers[LLMProvider.OPENAI] = {
                    "client": openai,
                    "api_key": openai_key,
                    "model": "gpt-4"
                }
                logger.info("OpenAI provider initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI: {e}")
    
    def _setup_claude(self):
        """Setup Claude provider"""
        try:
            claude_key = os.getenv("CLAUDE_API_KEY")
            if claude_key and anthropic:
                self.providers[LLMProvider.CLAUDE] = {
                    "client": anthropic.Anthropic(api_key=claude_key),
                    "model": "claude-3-sonnet-20240229"
                }
                logger.info("Claude provider initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Claude: {e}")
    
    def is_available(self) -> bool:
        """Check if any LLM service is available"""
        return len(self.providers) > 0
    
    def set_active_provider(self, provider: LLMProvider):
        """Set the active LLM provider"""
        if provider in self.providers:
            self.active_provider = provider
            logger.info(f"Active provider set to {provider.value}")
        else:
            logger.warning(f"Provider {provider.value} not available")
    
    def _generate_nutrient_analysis_prompt(self, request: NutrientAnalysisRequest) -> Dict[str, Any]:
        """Generate comprehensive nutrient analysis prompt"""
        system_prompt = """You are an expert agricultural scientist specializing in nutrient management. 
        Analyze the provided soil and crop data to provide comprehensive nutrient recommendations.
        
        Focus on:
        - Current nutrient status and deficiencies
        - Crop-specific nutrient requirements
        - Fertilizer recommendations with specific products and rates
        - Application timing and methods
        - Cost considerations and sustainability
        
        Respond with detailed analysis in JSON format with the following structure:
        {
            "soil_health_assessment": {
                "overall_score": 0-100,
                "nutrient_status": {"N": "status", "P": "status", "K": "status"},
                "deficiencies": ["nutrient1", "nutrient2"],
                "recommendations": ["action1", "action2"]
            },
            "fertilizer_recommendations": {
                "products": [{"name": "product", "rate_kg_ha": 0, "timing": "when"}],
                "total_cost_estimate": 0,
                "application_schedule": [{"date": "YYYY-MM-DD", "product": "name", "rate": 0}]
            },
            "expected_outcomes": {
                "yield_increase_percent": 0,
                "roi_estimate": 0,
                "sustainability_score": 0-10
            }
        }"""
        
        user_prompt = f"""
        Please analyze the following agricultural data and provide comprehensive nutrient recommendations:
        
        SOIL ANALYSIS:
        {json.dumps(request.soil_analysis, indent=2)}
        
        CROP INFORMATION:
        {json.dumps(request.crop_info, indent=2)}
        
        CURRENT NUTRIENT LEVELS:
        {json.dumps(request.current_nutrients, indent=2)}
        
        IDENTIFIED DEFICIENCIES:
        {request.deficiencies}
        
        GROWTH STAGE: {request.growth_stage}
        TARGET YIELD: {request.target_yield} tons/ha
        
        FARM CONTEXT:
        {json.dumps(request.farm_context, indent=2)}
        
        USER PREFERENCES:
        {json.dumps(request.user_preferences, indent=2)}
        
        WEATHER FORECAST:
        {json.dumps(request.weather_forecast, indent=2)}
        
        Provide detailed, actionable recommendations based on this data. Ensure all recommendations are:
        1. Scientifically accurate
        2. Economically viable
        3. Environmentally sustainable
        4. Specific to the crop and growth stage
        5. Considering local conditions and constraints
        """
        
        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "temperature": 0.7,
            "max_tokens": 4096
        }
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeminiService, cls).__new__(cls)
        return cls._instance
    
    @property
    def model(self):
        """Get or create Gemini model instance"""
        if self._model is None and self._api_available:
            try:
                self._model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash",
                    generation_config=self.generation_config,
                    safety_settings=self.safety_settings
                )
            except Exception as e:
                logger.error(f"Failed to create Gemini model: {e}")
                self._api_available = False
        return self._model
    
    def is_available(self) -> bool:
        """Check if Gemini API service is properly configured and available"""
        return self._validate_api_availability()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def generate_content_async(self, prompt: str) -> GeminiResponse:
        """Generate content asynchronously with retry logic"""
        start_time = datetime.now()
        
        try:
            if not self.model or not self._validate_api_availability():
                return GeminiResponse(
                    content="",
                    confidence=0.0,
                    response_time=0.0,
                    model_used="none",
                    timestamp=start_time,
                    error="Gemini API not properly configured or available",
                    success=False
                )
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini API")
            
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()
            
            return GeminiResponse(
                content=response.text,
                confidence=self._calculate_confidence(response.text),
                response_time=response_time,
                model_used="gemini-2.5-flash",
                timestamp=start_time,
                success=True
            )
            
        except Exception as e:
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()
            
            logger.error(f"Gemini API error: {e}")
            return GeminiResponse(
                content="",
                confidence=0.0,
                response_time=response_time,
                model_used="gemini-2.5-flash",
                timestamp=start_time,
                error=str(e),
                success=False
            )
    
    def generate_content(self, prompt: str) -> GeminiResponse:
        """Generate content synchronously"""
        start_time = datetime.now()
        
        try:
            if not self._validate_api_availability():
                return GeminiResponse(
                    content="",
                    confidence=0.0,
                    response_time=0.0,
                    model_used="none",
                    timestamp=start_time,
                    error="Gemini API not properly configured",
                    success=False
                )
            
            response = self.model.generate_content(prompt)
            
            if not response.text:
                raise ValueError("Empty response from Gemini API")
            
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()
            
            return GeminiResponse(
                content=response.text,
                confidence=self._calculate_confidence(response.text),
                response_time=response_time,
                model_used=settings.gemini_model,
                timestamp=start_time,
                success=True
            )
            
        except Exception as e:
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()
            
            logger.error(f"Gemini API error: {e}")
            return GeminiResponse(
                content="",
                confidence=0.0,
                response_time=response_time,
                model_used=settings.gemini_model,
                timestamp=start_time,
                error=str(e),
                success=False
            )
    
    def create_nutrient_recommendation_prompt(self, request: NutrientRecommendationRequest) -> str:
        """Create a structured prompt for nutrient recommendations"""
        
        prompt = f"""
You are an expert agricultural consultant specializing in nutrient management for crops. 
Analyze the following farm data and provide detailed, actionable nutrient recommendations.

## Farm Context:
- Location: {request.farm_context.get('location', 'Not specified')}
- Farm Size: {request.farm_context.get('area_acres', 'Not specified')} acres
- Soil Type: {request.farm_context.get('soil_type', 'Not specified')}
- Irrigation: {request.farm_context.get('irrigation_type', 'Not specified')}
- Budget: {request.farm_context.get('budget_constraint', 'Not specified')}

## Crop Information:
- Species: {request.crop_info.get('species', 'Not specified')}
- Variety: {request.crop_info.get('variety', 'Not specified')}
- Growth Stage: {request.crop_info.get('current_stage', 'Not specified')}
- Target Yield: {request.crop_info.get('target_yield', 'Not specified')} tonnes/ha
- Planting Date: {request.crop_info.get('planting_date', 'Not specified')}

## Soil Analysis Results:
- pH: {request.soil_analysis.get('ph', 'Not tested')}
- Organic Carbon: {request.soil_analysis.get('organic_carbon', 'Not tested')}%
- Available Nitrogen: {request.soil_analysis.get('available_nitrogen', 'Not tested')} kg/ha
- Available Phosphorus: {request.soil_analysis.get('available_phosphorus', 'Not tested')} kg/ha
- Available Potassium: {request.soil_analysis.get('available_potassium', 'Not tested')} kg/ha
- Available Sulfur: {request.soil_analysis.get('available_sulfur', 'Not tested')} kg/ha

## Current Nutrient Status:
{json.dumps(request.current_nutrients, indent=2)}

## Identified Deficiencies:
{', '.join(request.deficiencies) if request.deficiencies else 'None identified'}

## Weather Forecast (Next 7 days):
{json.dumps(request.weather_forecast[:7], indent=2) if request.weather_forecast else 'No weather data available'}

## User Preferences:
{json.dumps(request.user_preferences, indent=2) if request.user_preferences else 'No specific preferences'}

Please provide recommendations in the following structured format:

### 1. PRIORITY ACTIONS (Most Critical)
- List 3-5 immediate actions needed

### 2. NUTRIENT APPLICATION SCHEDULE
- Detailed timing for each nutrient application
- Specific fertilizer products and quantities
- Application methods (broadcasting, side-dressing, foliar, etc.)

### 3. FERTILIZER RECOMMENDATIONS
- Primary fertilizers needed with exact NPK ratios
- Secondary nutrients (S, Ca, Mg) if needed
- Micronutrients requirements
- Organic vs synthetic options

### 4. APPLICATION TIMING & METHODS
- Best timing windows based on crop stage and weather
- Application techniques for maximum efficiency
- Split application schedules if recommended

### 5. MONITORING & ADJUSTMENTS
- Key indicators to monitor
- When to adjust the plan
- Follow-up soil testing recommendations

### 6. COST-BENEFIT ANALYSIS
- Estimated costs per acre
- Expected yield improvements
- Return on investment calculations

### 7. RISK MITIGATION
- Potential risks and how to avoid them
- Alternative strategies if weather doesn't cooperate
- Compatibility warnings for mixing fertilizers

### 8. SUSTAINABILITY CONSIDERATIONS
- Long-term soil health impact
- Environmental considerations
- Organic matter management

Provide specific, actionable advice that considers local conditions, crop requirements, and economic feasibility.
"""
        return prompt
    
    async def get_nutrient_recommendations_async(self, request: NutrientRecommendationRequest) -> GeminiResponse:
        """Get AI-powered nutrient recommendations asynchronously"""
        prompt = self.create_nutrient_recommendation_prompt(request)
        return await self.generate_content_async(prompt)
    
    def get_nutrient_recommendations(self, request: NutrientRecommendationRequest) -> GeminiResponse:
        """Get AI-powered nutrient recommendations synchronously"""
        prompt = self.create_nutrient_recommendation_prompt(request)
        return self.generate_content(prompt)
    
    def analyze_soil_health_insights(self, soil_data: Dict[str, Any]) -> GeminiResponse:
        """Get AI insights on soil health"""
        prompt = f"""
Analyze the following soil health data and provide insights:

{json.dumps(soil_data, indent=2)}

Please provide:
1. Overall soil health assessment
2. Key nutrient deficiencies or excesses
3. pH recommendations
4. Organic matter status
5. Potential soil constraints
6. Improvement strategies
7. Crop suitability analysis

Keep the response concise but informative.
"""
        return self.generate_content(prompt)
    
    def generate_fertilizer_plan(self, crop_type: str, soil_analysis: Dict, target_yield: float) -> GeminiResponse:
        """Generate a comprehensive fertilizer plan"""
        prompt = f"""
Create a detailed fertilizer plan for {crop_type} with target yield of {target_yield} tonnes/ha.

Soil Analysis:
{json.dumps(soil_analysis, indent=2)}

Provide:
1. Pre-planting fertilizer application
2. Growth stage-specific applications
3. Foliar feeding recommendations
4. Micronutrient management
5. Timing and application methods
6. Expected costs and ROI

Format as a practical, implementable plan.
"""
        return self.generate_content(prompt)

# Global instance
gemini_service = GeminiService()


# Additional utility functions for backward compatibility
def get_nutrient_recommendations(crop_type: str, soil_data: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy synchronous function for getting nutrient recommendations"""
    request = NutrientRecommendationRequest(
        crop_info={"type": crop_type, "species": crop_type},
        soil_analysis=soil_data,
        farm_context={},
        current_nutrients={},
        deficiencies=[],
        weather_forecast=[]
    )
    
    try:
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(gemini_service.get_nutrient_recommendations_async(request))
        loop.close()
        
        # Convert GeminiResponse to dict for backward compatibility
        return {
            "content": response.content,
            "confidence": response.confidence,
            "response_time": response.response_time,
            "model": response.model_used,
            "timestamp": response.timestamp.isoformat(),
            "success": response.success,
            "error": response.error
        }
    except Exception as e:
        logger.error(f"Error in sync nutrient recommendations: {e}")
        return {"error": str(e), "success": False}


async def get_nutrient_recommendations_async(crop_type: str, soil_data: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy async function for getting nutrient recommendations"""
    request = NutrientRecommendationRequest(
        crop_info={"type": crop_type, "species": crop_type},
        soil_analysis=soil_data,
        farm_context={},
        current_nutrients={},
        deficiencies=[],
        weather_forecast=[]
    )
    
    response = await gemini_service.get_nutrient_recommendations_async(request)
    
    # Convert GeminiResponse to dict for backward compatibility
    return {
        "content": response.content,
        "confidence": response.confidence,
        "response_time": response.response_time,
        "model": response.model_used,
        "timestamp": response.timestamp.isoformat(),
        "success": response.success,
        "error": response.error
    }


# ===============================
# FastAPI Endpoints for LLM Provider Management
# ===============================

from fastapi import HTTPException, APIRouter
from typing import Dict, Any

# Create router for LLM provider management endpoints
router = APIRouter()

@router.get("/llm/providers", tags=["LLM Management"])
async def get_available_providers():
    """
    Get list of available LLM providers and their status
    """
    try:
        providers_status = {
            "gemini": {
                "available": gemini_service.is_available(),
                "model": "gemini-2.5-flash",
                "capabilities": ["text_generation", "analysis", "recommendations"],
                "status": "active" if gemini_service.is_available() else "unavailable"
            }
        }
        
        return {
            "success": True,
            "providers": providers_status,
            "active_provider": "gemini",
            "total_providers": len(providers_status),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting providers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get providers: {str(e)}")


@router.post("/providers/switch", tags=["LLM Management"])
async def switch_provider(provider_data: Dict[str, Any]):
    """
    Switch active LLM provider (currently supports Gemini only)
    """
    try:
        provider_name = provider_data.get("provider", "gemini")
        
        if provider_name.lower() != "gemini":
            raise HTTPException(
                status_code=400,
                detail="Currently only Gemini provider is supported"
            )
        
        if not gemini_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Gemini service is not available"
            )
        
        return {
            "success": True,
            "message": f"Already using {provider_name} provider",
            "active_provider": "gemini",
            "provider_status": {
                "available": True,
                "model": "gemini-2.5-flash",
                "capabilities": ["text_generation", "analysis", "recommendations"]
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error switching provider: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to switch provider: {str(e)}")


@router.get("/providers/status", tags=["LLM Management"])
async def get_provider_status():
    """
    Get detailed status of the current LLM provider
    """
    try:
        service_status = {
            "provider": "gemini",
            "available": gemini_service.is_available(),
            "model": "gemini-2.5-flash",
            "configuration": {
                "temperature": 0.7,
                "max_tokens": 4000,
                "safety_settings": "moderate"
            },
            "capabilities": {
                "nutrient_analysis": True,
                "soil_analysis": True,
                "fertilizer_recommendations": True,
                "cost_analysis": True,
                "risk_assessment": True,
                "application_scheduling": True
            },
            "last_check": datetime.now().isoformat()
        }
        
        return {
            "success": True,
            "status": service_status,
            "health_check": "passed" if gemini_service.is_available() else "failed",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting provider status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get provider status: {str(e)}")
