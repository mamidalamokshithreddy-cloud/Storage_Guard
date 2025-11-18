"""
Multi-LLM Service Architecture for Agricultural AI Analysis
Production-ready LLM integration with multiple providers
"""

from __future__ import annotations
import asyncio
import json
import logging
import os
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import base64
from app.services.prompt_engineering import AgriculturalPromptEngine
import aiohttp

from app.core.config import (
    OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY,
    AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT,
    LLM_MODELS, LLM_VISION_MODELS, LLM_TEMPERATURE, LLM_MAX_TOKENS, LLM_TIMEOUT
)
logger = logging.getLogger(__name__)

class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    AZURE = "azure"
    GEMINI = "gemini"
    CLAUDE = "claude"


@dataclass
class LLMProviderConfig:
    provider: str
    api_key: Optional[str]
    model_name: str
    max_tokens: int = 4096
    temperature: float = 0.7


class LLMResponseType(str, Enum):
    """Types of LLM responses"""
    SLM_ANALYSIS = "slm_analysis"
    LLM_ANALYSIS = "llm_analysis"
    CROSS_VALIDATION = "cross_validation"
    # Added for image/vision prompts usage
    LLM_VISION_ANALYSIS = "llm_vision_analysis"


class LLMResponse:
    """Standardized LLM response container"""
    def __init__(
        self,
        provider: Union[LLMProvider, str],
        response_type: Union[LLMResponseType, str] = LLMResponseType.LLM_ANALYSIS,
        content: str = "",
        metadata: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error: Optional[str] = None,
        model: Optional[str] = None,
        tokens_used: Optional[int] = None,
        response_time: Optional[float] = None,
        confidence: Optional[float] = None,
    ):
        # normalize provider and response_type
        if isinstance(provider, str):
            try:
                self.provider = LLMProvider(provider)
            except Exception:
                self.provider = provider
        else:
            self.provider = provider

        if isinstance(response_type, str):
            try:
                self.response_type = LLMResponseType(response_type)
            except Exception:
                self.response_type = response_type
        else:
            self.response_type = response_type

        self.content = content
        self.metadata = metadata or {}
        self.success = success
        self.error = error
        self.model = model
        self.tokens_used = tokens_used
        self.response_time = response_time
        self.confidence = confidence
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert response to dictionary"""
        return {
            "provider": (self.provider.value if isinstance(self.provider, LLMProvider) else str(self.provider)),
            "response_type": (self.response_type.value if isinstance(self.response_type, LLMResponseType) else str(self.response_type)),
            "content": self.content,
            "metadata": self.metadata,
            "model": self.model,
            "tokens_used": self.tokens_used,
            "response_time": self.response_time,
            "confidence": self.confidence,
            "success": self.success,
            "error": self.error,
            "timestamp": self.timestamp.isoformat()
        }

    def parse_json_content(self) -> Optional[Dict[str, Any]]:
        """Parse JSON content from LLM response"""
        try:
            content = self.content.strip()
            if "```json" in content:
                start = content.find("```json") + 7
                end = content.find("```", start)
                content = content[start:end].strip()
            elif "```" in content:
                start = content.find("```") + 3
                end = content.find("```", start)
                if end != -1:
                    content = content[start:end].strip()
            content = content.strip()
            return json.loads(content)
        except json.JSONDecodeError:
            return None
        except Exception as e:
            logger.warning(f"Failed to parse JSON content: {e}")
            return None

    def _initialize_providers(self):
        """Initialize all available LLM providers"""
        self._setup_gemini()
        self._setup_openai()
        self._setup_claude()
        # Add more providers as needed
        
        logger.info(f"Initialized {len(self.providers)} LLM provider(s)")
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=LLM_TIMEOUT))
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _setup_gemini(self):
        """Setup Gemini provider"""
        try:
            gemini_key = os.getenv("GEMINI_API_KEY")
            if gemini_key:
                import google.generativeai as genai
                genai.configure(api_key=gemini_key)
                
                self.providers[LLMProvider.GEMINI] = {
                    "client": genai,
                    "model": genai.GenerativeModel("gemini-2.5-flash"),
                    "config": LLMProviderConfig(
                        provider="gemini",
                        api_key=gemini_key,
                        model_name="gemini-2.5-flash",
                        max_tokens=4096,
                        temperature=0.7
                    )
                }
                logger.info("Gemini provider initialized successfully")
            else:
                logger.warning("Gemini API key not found")
        except ImportError:
            logger.warning("Gemini dependencies not available")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
    
    def _setup_openai(self):
        """Setup OpenAI provider"""
        try:
            openai_key = os.getenv("OPENAI_API_KEY")
            if openai_key:
                import openai
                openai.api_key = openai_key
                
                self.providers[LLMProvider.OPENAI] = {
                    "client": openai,
                    "model": "gpt-4",
                    "config": LLMProviderConfig(
                        provider="openai",
                        api_key=openai_key,
                        model_name="gpt-4",
                        max_tokens=4096,
                        temperature=0.7
                    )
                }
                logger.info("OpenAI provider initialized successfully")
            else:
                logger.warning("OpenAI API key not found")
        except ImportError:
            logger.warning("OpenAI dependencies not available")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI: {e}")
    
    def _setup_claude(self):
        """Setup Claude provider"""
        try:
            claude_key = os.getenv("CLAUDE_API_KEY")
            if claude_key:
                import anthropic
                
                self.providers[LLMProvider.CLAUDE] = {
                    "client": anthropic.Anthropic(api_key=claude_key),
                    "model": "claude-3-sonnet-20240229",
                    "config": LLMProviderConfig(
                        provider="claude",
                        api_key=claude_key,
                        model_name="claude-3-sonnet-20240229",
                        max_tokens=4096,
                        temperature=0.7
                    )
                }
                logger.info("Claude provider initialized successfully")
            else:
                logger.warning("Claude API key not found")
        except ImportError:
            logger.warning("Claude dependencies not available")
        except Exception as e:
            logger.error(f"Failed to initialize Claude: {e}")
    
    def is_available(self, provider: Optional[LLMProvider] = None) -> bool:
        """Check if LLM service is available"""
        if provider:
            return provider in self.providers
        return len(self.providers) > 0
    
    def set_active_provider(self, provider: LLMProvider):
        """Set the active LLM provider"""
        if provider in self.providers:
            self.active_provider = provider
            logger.info(f"Active provider set to {provider.value}")
        else:
            logger.warning(f"Provider {provider.value} not available")

    async def generate_nutrient_analysis(
        self, 
        request: Dict[str, Any],
        provider: Optional[LLMProvider] = None
    ) -> LLMResponse:
        """Generate comprehensive nutrient analysis using LLM"""
        provider = provider or self.active_provider
        
        try:
            # Get optimized prompt from prompt engineering service
            prompt_data = AgriculturalPromptEngine.get_nutrient_analysis_prompt(
                request, provider
            )
            
            # Generate response using specified provider
            response = await self._call_llm(
                system_prompt=prompt_data["system_prompt"],
                user_prompt=prompt_data["user_prompt"],
                provider=provider,
                max_tokens=prompt_data["max_tokens"],
                temperature=prompt_data["temperature"]
            )
            
            if response.success:
                # Parse and validate response
                analysis_result = self._parse_nutrient_analysis_response(response.content)
                response.metadata = {"analysis_type": "comprehensive_nutrient_analysis"}
                response.confidence = self._calculate_response_confidence(response.content)
                
            return response
            
        except Exception as e:
            logger.error(f"Error in nutrient analysis: {e}")
            return LLMResponse(
                content="",
                provider=provider.value,
                model="",
                success=False,
                response_time=0.0,
                error=str(e)
            )
    
    async def detect_nutrient_deficiencies(
        self,
        soil_data: Dict[str, Any],
        crop_info: Dict[str, Any],
        provider: Optional[LLMProvider] = None
    ) -> LLMResponse:
        """Detect nutrient deficiencies using LLM analysis"""
        provider = provider or self.active_provider
        
        try:
            prompt_data = AgriculturalPromptEngine.get_deficiency_detection_prompt(
                soil_data, crop_info, provider
            )
            
            response = await self._call_llm(
                system_prompt=prompt_data["system_prompt"],
                user_prompt=prompt_data["user_prompt"],
                provider=provider,
                max_tokens=prompt_data["max_tokens"],
                temperature=prompt_data["temperature"]
            )
            
            if response.success:
                response.metadata = {"analysis_type": "deficiency_detection"}
                response.confidence = self._calculate_response_confidence(response.content)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in deficiency detection: {e}")
            return LLMResponse(
                content="",
                provider=provider.value,
                model="",
                success=False,
                response_time=0.0,
                error=str(e)
            )
    
    async def optimize_fertilizer_selection(
        self,
        requirements: Dict[str, float],
        available_products: List[Dict[str, Any]],
        constraints: Dict[str, Any],
        provider: Optional[LLMProvider] = None
    ) -> LLMResponse:
        """Optimize fertilizer selection using LLM"""
        provider = provider or self.active_provider
        
        try:
            prompt_data = AgriculturalPromptEngine.get_fertilizer_optimization_prompt(
                requirements, available_products, constraints, provider
            )
            
            response = await self._call_llm(
                system_prompt=prompt_data["system_prompt"],
                user_prompt=prompt_data["user_prompt"],
                provider=provider,
                max_tokens=prompt_data["max_tokens"],
                temperature=prompt_data["temperature"]
            )
            
            if response.success:
                response.metadata = {"analysis_type": "fertilizer_optimization"}
                response.confidence = self._calculate_response_confidence(response.content)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in fertilizer optimization: {e}")
            return LLMResponse(
                content="",
                provider=provider.value,
                model="",
                success=False,
                response_time=0.0,
                error=str(e)
            )
    
    async def generate_application_schedule(
        self,
        crop_info: Dict[str, Any],
        fertilizer_plan: List[Dict[str, Any]],
        weather_forecast: List[Dict[str, Any]],
        provider: Optional[LLMProvider] = None
    ) -> LLMResponse:
        """Generate application schedule using LLM"""
        provider = provider or self.active_provider
        
        try:
            prompt_data = AgriculturalPromptEngine.get_application_scheduling_prompt(
                crop_info, fertilizer_plan, weather_forecast, provider
            )
            
            response = await self._call_llm(
                system_prompt=prompt_data["system_prompt"],
                user_prompt=prompt_data["user_prompt"],
                provider=provider,
                max_tokens=prompt_data["max_tokens"],
                temperature=prompt_data["temperature"]
            )
            
            if response.success:
                response.metadata = {"analysis_type": "application_scheduling"}
                response.confidence = self._calculate_response_confidence(response.content)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in application scheduling: {e}")
            return LLMResponse(
                content="",
                provider=provider.value,
                model="",
                success=False,
                response_time=0.0,
                error=str(e)
            )
    
    async def perform_cost_benefit_analysis(
        self,
        fertilizer_plan: Dict[str, Any],
        farm_context: Dict[str, Any],
        market_data: Dict[str, Any],
        provider: Optional[LLMProvider] = None
    ) -> LLMResponse:
        """Perform cost-benefit analysis using LLM"""
        provider = provider or self.active_provider
        
        try:
            prompt_data = AgriculturalPromptEngine.get_cost_benefit_analysis_prompt(
                fertilizer_plan, farm_context, market_data, provider
            )
            
            response = await self._call_llm(
                system_prompt=prompt_data["system_prompt"],
                user_prompt=prompt_data["user_prompt"],
                provider=provider,
                max_tokens=prompt_data["max_tokens"],
                temperature=prompt_data["temperature"]
            )
            
            if response.success:
                response.metadata = {"analysis_type": "cost_benefit_analysis"}
                response.confidence = self._calculate_response_confidence(response.content)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in cost-benefit analysis: {e}")
            return LLMResponse(
                content="",
                provider=provider.value,
                model="",
                success=False,
                response_time=0.0,
                error=str(e)
            )
    
    async def assess_risks(
        self,
        analysis_results: Dict[str, Any],
        environmental_factors: Dict[str, Any],
        provider: Optional[LLMProvider] = None
    ) -> LLMResponse:
        """Assess risks using LLM analysis"""
        provider = provider or self.active_provider
        
        try:
            prompt_data = AgriculturalPromptEngine.get_risk_assessment_prompt(
                analysis_results, environmental_factors, provider
            )
            
            response = await self._call_llm(
                system_prompt=prompt_data["system_prompt"],
                user_prompt=prompt_data["user_prompt"],
                provider=provider,
                max_tokens=prompt_data["max_tokens"],
                temperature=prompt_data["temperature"]
            )
            
            if response.success:
                response.metadata = {"analysis_type": "risk_assessment"}
                response.confidence = self._calculate_response_confidence(response.content)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in risk assessment: {e}")
            return LLMResponse(
                content="",
                provider=provider.value,
                model="",
                success=False,
                response_time=0.0,
                error=str(e)
            )
    
    async def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        provider: LLMProvider,
        max_tokens: int = 4096,
        temperature: float = 0.7
    ) -> LLMResponse:
        """Call specific LLM provider with retry logic"""
        start_time = datetime.now()
        
        try:
            if provider == LLMProvider.GEMINI:
                response = await self._call_gemini(system_prompt, user_prompt, max_tokens, temperature)
            elif provider == LLMProvider.OPENAI:
                response = await self._call_openai(system_prompt, user_prompt, max_tokens, temperature)
            elif provider == LLMProvider.CLAUDE:
                response = await self._call_claude(system_prompt, user_prompt, max_tokens, temperature)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
            
            response_time = (datetime.now() - start_time).total_seconds()
            response.response_time = response_time
            
            return response
            
        except Exception as e:
            # Try fallback providers
            for fallback_provider in self.fallback_providers:
                if fallback_provider != provider and fallback_provider in self.providers:
                    logger.info(f"Trying fallback provider: {fallback_provider}")
                    try:
                        return await self._call_llm(
                            system_prompt, user_prompt, fallback_provider, max_tokens, temperature
                        )
                    except Exception as fallback_error:
                        logger.warning(f"Fallback provider {fallback_provider} failed: {fallback_error}")
                        continue
            
            # All providers failed
            response_time = (datetime.now() - start_time).total_seconds()
            return LLMResponse(
                content="",
                provider=provider.value,
                model="",
                success=False,
                response_time=response_time,
                error=str(e)
            )
    
    async def _call_gemini(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        max_tokens: int, 
        temperature: float
    ) -> LLMResponse:
        """Call Gemini API"""
        try:
            if LLMProvider.GEMINI not in self.providers:
                raise ValueError("Gemini provider not available")
            
            provider_info = self.providers[LLMProvider.GEMINI]
            model = provider_info["model"]
            
            # Combine system and user prompts for Gemini
            full_prompt = f"{system_prompt}\n\n{user_prompt}"
            
            # Configure generation parameters
            generation_config = {
                "max_output_tokens": max_tokens,
                "temperature": temperature,
            }
            
            # Generate content
            response = model.generate_content(
                full_prompt,
                generation_config=generation_config
            )
            
            return LLMResponse(
                content=response.text,
                provider="gemini",
                model="gemini-2.5-flash",
                success=True,
                response_time=0.0,  # Will be set by caller
                tokens_used=None,  # Gemini doesn't provide token count in response
                metadata={"generation_config": generation_config}
            )
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return LLMResponse(
                content="",
                provider="gemini",
                model="gemini-2.5-flash",
                success=False,
                response_time=0.0,
                error=str(e)
            )
    
    async def _call_openai(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        max_tokens: int, 
        temperature: float
    ) -> LLMResponse:
        """Call OpenAI API"""
        try:
            if LLMProvider.OPENAI not in self.providers:
                raise ValueError("OpenAI provider not available")
            
            provider_info = self.providers[LLMProvider.OPENAI]
            client = provider_info["client"]
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response = await client.ChatCompletion.acreate(
                model="gpt-4",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return LLMResponse(
                content=response.choices[0].message.content,
                provider="openai",
                model="gpt-4",
                success=True,
                response_time=0.0,
                tokens_used=response.usage.total_tokens,
                metadata={"usage": response.usage}
            )
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return LLMResponse(
                content="",
                provider="openai",
                model="gpt-4",
                success=False,
                response_time=0.0,
                error=str(e)
            )
    
    async def _call_claude(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        max_tokens: int, 
        temperature: float
    ) -> LLMResponse:
        """Call Claude API"""
        try:
            if LLMProvider.CLAUDE not in self.providers:
                raise ValueError("Claude provider not available")
            
            provider_info = self.providers[LLMProvider.CLAUDE]
            client = provider_info["client"]
            
            response = await client.messages.create(
                model="claude-3-sonnet-20240229",
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return LLMResponse(
                content=response.content[0].text,
                provider="claude",
                model="claude-3-sonnet-20240229",
                success=True,
                response_time=0.0,
                tokens_used=response.usage.input_tokens + response.usage.output_tokens,
                metadata={"usage": response.usage}
            )
            
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return LLMResponse(
                content="",
                provider="claude",
                model="claude-3-sonnet-20240229",
                success=False,
                response_time=0.0,
                error=str(e)
            )
    
    def _parse_nutrient_analysis_response(self, content: str) -> Dict[str, Any]:
        """Parse and validate nutrient analysis response"""
        try:
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # If no JSON found, create a structured response from text
                return {"raw_analysis": content, "parsed": False}
        except Exception as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            return {"raw_analysis": content, "parsed": False, "error": str(e)}
    
    def _calculate_response_confidence(self, content: str) -> float:
        """Calculate confidence score for LLM response"""
        try:
            # Simple confidence calculation based on response characteristics
            confidence = 0.5  # Base confidence
            
            # Increase confidence for structured responses
            if "{" in content and "}" in content:
                confidence += 0.2
            
            # Increase confidence for detailed responses
            if len(content) > 500:
                confidence += 0.1
            
            # Increase confidence for responses with specific numbers
            import re
            if re.search(r'\d+\.?\d*\s*(kg|%|ppm)', content):
                confidence += 0.1
            
            # Increase confidence for responses with recommendations
            if any(word in content.lower() for word in ['recommend', 'apply', 'use', 'consider']):
                confidence += 0.1
            
            return min(confidence, 1.0)
            
        except Exception:
            return 0.5


    @abstractmethod
    async def analyze_image(
        self,
        image_data: str,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze image with text prompt"""
        pass
        
    @abstractmethod
    async def analyze_text(
        self,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze text-only prompt"""
        pass

    def _prepare_image_data(self, image_data: str) -> str:
        """Prepare image data for API consumption"""
        # Ensure proper base64 encoding
        if not image_data.startswith('data:image'):
            # Assume it's raw base64, add MIME type
            return f"data:image/jpeg;base64,{image_data}"
        return image_data

    def _create_error_response(
        self,
        response_type: LLMResponseType,
        error_message: str
    ) -> LLMResponse:
        """Create standardized error response"""
        return LLMResponse(
            provider=self.provider,
            response_type=response_type,
            content="",
            metadata={"error_type": "api_error"},
            success=False,
            error=error_message
        )


class BaseLLMClient(ABC):
    """Abstract base LLM client providing session management and helpers"""
    
    def __init__(self, provider: LLMProvider, api_key: Optional[str], model: str):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        if not self.session:
            self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=LLM_TIMEOUT))
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            self.session = None
    
    @abstractmethod
    async def analyze_image(self, image_data: str, prompt: str, response_type: LLMResponseType) -> LLMResponse:
        pass
    
    @abstractmethod
    async def analyze_text(self, prompt: str, response_type: LLMResponseType) -> LLMResponse:
        pass
    
    def _prepare_image_data(self, image_data: str) -> str:
        if not image_data.startswith('data:image'):
            return f"data:image/jpeg;base64,{image_data}"
        return image_data
    
    def _create_error_response(self, response_type: LLMResponseType, error_message: str) -> LLMResponse:
        return LLMResponse(
            provider=self.provider,
            response_type=response_type,
            content="",
            metadata={"error_type": "api_error"},
            success=False,
            error=error_message
        )


class OpenAIClient(BaseLLMClient):
    """OpenAI GPT-4 Vision client"""
    
    def __init__(self):
        super().__init__(
            provider=LLMProvider.OPENAI,
            api_key=OPENAI_API_KEY,
            model=LLM_VISION_MODELS[LLMProvider.OPENAI]
        )
        self.postgres_base_url = "https://api.openai.com/v1"
    
    async def analyze_image(
        self,
        image_data: str,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze image using OpenAI GPT-4 Vision"""
        try:
            image_data = self._prepare_image_data(image_data)
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": image_data}
                            }
                        ]
                    }
                ],
                "max_tokens": LLM_MAX_TOKENS,
                "temperature": LLM_TEMPERATURE
            }
            
            async with self.session.post(
                f"{self.postgres_base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result["choices"][0]["message"]["content"]
                    
                    return LLMResponse(
                        provider=self.provider,
                        response_type=response_type,
                        content=content,
                        metadata={
                            "model": self.model,
                            "usage": result.get("usage", {}),
                            "finish_reason": result["choices"][0].get("finish_reason")
                        }
                    )
                else:
                    error_text = await response.text()
                    return self._create_error_response(
                        response_type,
                        f"OpenAI API error: {response.status} - {error_text}"
                    )
                    
        except Exception as e:
            logger.error(f"OpenAI image analysis failed: {e}")
            return self._create_error_response(response_type, str(e))
    
    async def analyze_text(
        self,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze text using OpenAI GPT-4"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": LLM_MODELS[LLMProvider.OPENAI],
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": LLM_MAX_TOKENS,
                "temperature": LLM_TEMPERATURE
            }
            
            async with self.session.post(
                f"{self.postgres_base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result["choices"][0]["message"]["content"]
                    
                    return LLMResponse(
                        provider=self.provider,
                        response_type=response_type,
                        content=content,
                        metadata={
                            "model": LLM_MODELS[LLMProvider.OPENAI],
                            "usage": result.get("usage", {}),
                            "finish_reason": result["choices"][0].get("finish_reason")
                        }
                    )
                else:
                    error_text = await response.text()
                    return self._create_error_response(
                        response_type,
                        f"OpenAI API error: {response.status} - {error_text}"
                    )
                    
        except Exception as e:
            logger.error(f"OpenAI text analysis failed: {e}")
            return self._create_error_response(response_type, str(e))


class AnthropicClient(BaseLLMClient):
    """Anthropic Claude client"""
    
    def __init__(self):
        super().__init__(
            provider=LLMProvider.ANTHROPIC,
            api_key=ANTHROPIC_API_KEY,
            model=LLM_VISION_MODELS[LLMProvider.ANTHROPIC]
        )
        self.postgres_base_url = "https://api.anthropic.com/v1"
    
    async def analyze_image(
        self,
        image_data: str,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze image using Anthropic Claude"""
        try:
            # Extract base64 data (Claude expects raw base64)
            if image_data.startswith('data:image'):
                base64_data = image_data.split(',')[1]
            else:
                base64_data = image_data
            
            headers = {
                "x-api-key": self.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            payload = {
                "model": self.model,
                "max_tokens": LLM_MAX_TOKENS,
                "temperature": LLM_TEMPERATURE,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": base64_data
                                }
                            },
                            {"type": "text", "text": prompt}
                        ]
                    }
                ]
            }
            
            async with self.session.post(
                f"{self.postgres_base_url}/messages",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result["content"][0]["text"]
                    
                    return LLMResponse(
                        provider=self.provider,
                        response_type=response_type,
                        content=content,
                        metadata={
                            "model": self.model,
                            "usage": result.get("usage", {}),
                            "stop_reason": result.get("stop_reason")
                        }
                    )
                else:
                    error_text = await response.text()
                    return self._create_error_response(
                        response_type,
                        f"Anthropic API error: {response.status} - {error_text}"
                    )
                    
        except Exception as e:
            logger.error(f"Anthropic image analysis failed: {e}")
            return self._create_error_response(response_type, str(e))
    
    async def analyze_text(
        self,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze text using Anthropic Claude"""
        try:
            headers = {
                "x-api-key": self.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            payload = {
                "model": LLM_MODELS[LLMProvider.ANTHROPIC],
                "max_tokens": LLM_MAX_TOKENS,
                "temperature": LLM_TEMPERATURE,
                "messages": [{"role": "user", "content": prompt}]
            }
            
            async with self.session.post(
                f"{self.postgres_base_url}/messages",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result["content"][0]["text"]
                    
                    return LLMResponse(
                        provider=self.provider,
                        response_type=response_type,
                        content=content,
                        metadata={
                            "model": LLM_MODELS[LLMProvider.ANTHROPIC],
                            "usage": result.get("usage", {}),
                            "stop_reason": result.get("stop_reason")
                        }
                    )
                else:
                    error_text = await response.text()
                    return self._create_error_response(
                        response_type,
                        f"Anthropic API error: {response.status} - {error_text}"
                    )
                    
        except Exception as e:
            logger.error(f"Anthropic text analysis failed: {e}")
            return self._create_error_response(response_type, str(e))



class GoogleClient(BaseLLMClient):
    """Google Gemini client"""
    
    def __init__(self):
        super().__init__(
            provider=LLMProvider.GOOGLE,
            api_key=GEMINI_API_KEY,
            model=LLM_VISION_MODELS[LLMProvider.GOOGLE]
        )
        self.postgres_base_url = "https://generativelanguage.googleapis.com/v1beta"
    
    async def analyze_image(
        self,
        image_data: str,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze image using Google Gemini"""
        try:
            # Extract base64 data and mime type
            mime_type = "image/jpeg"
            if image_data.startswith('data:'):
                header, b64 = image_data.split(',', 1)
                # header example: data:image/png;base64
                if header.startswith('data:') and ';' in header:
                    mime_type = header[5:header.find(';')] or mime_type
                base64_data = b64
            else:
                base64_data = image_data
            # Remove accidental whitespace/newlines in base64
            base64_data = base64_data.replace('\n', '').replace('\r', '').strip()
            
            headers = {"Content-Type": "application/json"}
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": base64_data
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": LLM_TEMPERATURE,
                    "maxOutputTokens": LLM_MAX_TOKENS
                }
            }
            
            url = f"{self.postgres_base_url}/models/{self.model}:generateContent?key={self.api_key}"
            
            # Debug: log request meta (not the full image)
            try:
                logger.debug(f"GoogleClient.analyze_image url={url} model={self.model} b64_len={len(base64_data)} prompt_len={len(prompt or '')}")
            except Exception:
                pass
            async with self.session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    # Defensive parsing for Gemini responses
                    try:
                        candidates = result.get("candidates") or []
                        if not candidates:
                            raise ValueError(f"No candidates in response: {result}")
                        first = candidates[0]
                        parts = (first.get("content") or {}).get("parts") or first.get("content", {}).get("parts", [])
                        if not parts:
                            raise ValueError(f"No content parts in response: {result}")
                        content = parts[0].get("text")
                        if not content:
                            raise ValueError(f"Empty text content in response: {result}")
                    except Exception as parse_err:
                        return self._create_error_response(
                            response_type,
                            f"Google API parse error: {parse_err}"
                        )
                    
                    return LLMResponse(
                        provider=self.provider,
                        response_type=response_type,
                        content=content,
                        metadata={
                            "model": self.model,
                            "usage": result.get("usageMetadata", {}),
                            "finish_reason": result["candidates"][0].get("finishReason")
                        }
                    )
                else:
                    error_text = await response.text()
                    safe_body = (error_text[:1000] + '...') if len(error_text) > 1000 else error_text
                    logger.error(f"Google API HTTP error status={response.status} body={safe_body}")
                    return self._create_error_response(
                        response_type,
                        f"Google API error: {response.status} - {error_text}"
                    )
                    
        except Exception as e:
            logger.exception("Google image analysis failed")
            return self._create_error_response(response_type, str(e))
    
    async def analyze_text(
        self,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze text using Google Gemini"""
        try:
            headers = {"Content-Type": "application/json"}
            
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": LLM_TEMPERATURE,
                    "maxOutputTokens": LLM_MAX_TOKENS
                }
            }
            
            model = LLM_MODELS[LLMProvider.GOOGLE]
            url = f"{self.postgres_base_url}/models/{model}:generateContent?key={self.api_key}"
            
            async with self.session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result["candidates"][0]["content"]["parts"][0]["text"]
                    
                    return LLMResponse(
                        provider=self.provider,
                        response_type=response_type,
                        content=content,
                        metadata={
                            "model": model,
                            "usage": result.get("usageMetadata", {}),
                            "finish_reason": result["candidates"][0].get("finishReason")
                        }
                    )
                else:
                    error_text = await response.text()
                    return self._create_error_response(
                        response_type,
                        f"Google API error: {response.status} - {error_text}"
                    )
                    
        except Exception as e:
            logger.error(f"Google text analysis failed: {e}")
            return self._create_error_response(response_type, str(e))


class MultiLLMService:
    """
    Production-ready multi-LLM service with provider switching and fallbacks
    """
    
    def __init__(self):
        """Initialize multi-LLM service"""
        self.clients = self._initialize_clients()
        self.provider_health = {provider: True for provider in LLMProvider}
        
    def _initialize_clients(self) -> Dict[LLMProvider, BaseLLMClient]:
        """Initialize all available LLM clients"""
        clients = {}
        
        if OPENAI_API_KEY:
            clients[LLMProvider.OPENAI] = OpenAIClient()
        if ANTHROPIC_API_KEY:
            clients[LLMProvider.ANTHROPIC] = AnthropicClient()
        if GEMINI_API_KEY:
            clients[LLMProvider.GOOGLE] = GoogleClient()
            
        logger.info(f"Initialized LLM clients: {list(clients.keys())}")
        return clients
    
    async def analyze_image_with_provider(
        self,
        provider: LLMProvider,
        image_data: str,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze image with specific provider"""
        client = self.clients.get(provider)
        if not client:
            return LLMResponse(
                provider=provider,
                response_type=response_type,
                content="",
                metadata={},
                success=False,
                error=f"Provider {provider.value} not available"
            )
        
        try:
            async with client:
                response = await client.analyze_image(image_data, prompt, response_type)
                
            # Update provider health
            self.provider_health[provider] = response.success
            return response
            
        except Exception as e:
            logger.error(f"Provider {provider.value} analysis failed: {e}")
            self.provider_health[provider] = False
            return client._create_error_response(response_type, str(e))
    
    async def analyze_text_with_provider(
        self,
        provider: LLMProvider,
        prompt: str,
        response_type: LLMResponseType
    ) -> LLMResponse:
        """Analyze text with specific provider"""
        client = self.clients.get(provider)
        if not client:
            return LLMResponse(
                provider=provider,
                response_type=response_type,
                content="",
                metadata={},
                success=False,
                error=f"Provider {provider.value} not available"
            )
        
        try:
            async with client:
                response = await client.analyze_text(prompt, response_type)
                
            # Update provider health
            self.provider_health[provider] = response.success
            return response
            
        except Exception as e:
            logger.error(f"Provider {provider.value} text analysis failed: {e}")
            self.provider_health[provider] = False
            return client._create_error_response(response_type, str(e))
    
    async def parallel_image_analysis(
        self,
        providers: List[LLMProvider],
        image_data: str,
        prompts: Dict[LLMProvider, str],
        response_types: Dict[LLMProvider, LLMResponseType]
    ) -> Dict[LLMProvider, LLMResponse]:
        """Run parallel image analysis across multiple providers"""
        tasks = []
        
        for provider in providers:
            if provider in self.clients:
                task = self.analyze_image_with_provider(
                    provider=provider,
                    image_data=image_data,
                    prompt=prompts.get(provider, ""),
                    response_type=response_types.get(provider, LLMResponseType.LLM_ANALYSIS)
                )
                tasks.append((provider, task))
        
        # Execute all tasks in parallel
        results = {}
        if tasks:
            completed_tasks = await asyncio.gather(
                *[task for _, task in tasks],
                return_exceptions=True
            )
            
            for (provider, _), result in zip(tasks, completed_tasks):
                if isinstance(result, Exception):
                    logger.error(f"Provider {provider.value} failed: {result}")
                    results[provider] = LLMResponse(
                        provider=provider,
                        response_type=response_types.get(provider, LLMResponseType.LLM_ANALYSIS),
                        content="",
                        metadata={},
                        success=False,
                        error=str(result)
                    )
                else:
                    results[provider] = result
        
        return results
    
    def get_healthy_providers(self) -> List[LLMProvider]:
        """Get list of currently healthy providers"""
        return [
            provider for provider, healthy in self.provider_health.items()
            if healthy and provider in self.clients
        ]
    
    def get_provider_status(self) -> Dict[str, Any]:
        """Get comprehensive provider status"""
        return {
            "available_providers": list(self.clients.keys()),
            "healthy_providers": self.get_healthy_providers(),
            "provider_health": {
                provider.value: status 
                for provider, status in self.provider_health.items()
            },
            "total_providers": len(self.clients)
        }


# Global service instance
_llm_service_instance: Optional[MultiLLMService] = None


def get_llm_service() -> MultiLLMService:
    """Get global multi-LLM service instance"""
    global _llm_service_instance
    
    if _llm_service_instance is None:
        _llm_service_instance = MultiLLMService()
        logger.info("✅ Multi-LLM service initialized")
    
    return _llm_service_instance


async def cleanup_llm_service():
    """Cleanup LLM service resources"""
    global _llm_service_instance
    
    if _llm_service_instance:
        logger.info("🧹 Cleaning up LLM service resources")
        _llm_service_instance = None
        logger.info("✅ LLM service cleanup completed")


# -------- Convenience utility for image analysis (leaf images) ---------
async def analyze_leaf_image_llm(
    image_bytes: bytes,
    providers: Optional[str] = "auto",
    prompt: Optional[str] = None
) -> Dict[str, Any]:
    """High-level helper to analyze a leaf image across multiple LLM vision providers.

    - Encodes the image to base64 (JPEG assumed for MIME in downstream clients).
    - Selects providers: "auto" uses healthy providers, "all" uses all initialized, or a comma list.
    - Uses provided prompt or a sensible default.
    - Returns a normalized payload with per-provider results.
    """
    service = get_llm_service()
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    available = service.get_healthy_providers() or list(service.clients.keys())
    if providers and providers not in ("auto", "all"):
        req = [p.strip().lower() for p in providers.split(",") if p.strip()]
        selected: List[LLMProvider] = []
        for p in req:
            try:
                # Accept alias 'gemini' to map to Google client
                lp = LLMProvider.GOOGLE if p == "gemini" else LLMProvider(p)
                if lp in service.clients:
                    selected.append(lp)
            except Exception:
                continue
    else:
        selected = list(service.clients.keys()) if providers == "all" else available

    if not selected:
        return {
            "status": "error",
            "error": "no_providers_available",
            "providers": [],
        }

    effective_prompt = prompt or (
        "Analyze this leaf image for disease or pest condition. "
        "Provide diagnosis, confidence, severity (0-100), alternatives, and brief reasoning."
    )
    prompts = {p: effective_prompt for p in selected}
    rtypes = {p: LLMResponseType.LLM_VISION_ANALYSIS for p in selected}

    results = await service.parallel_image_analysis(selected, b64, prompts, rtypes)
    return {
        "status": "success",
        "providers": [p.value for p in selected],
        "responses": {p.value: r.to_dict() for p, r in results.items()}
    }
