"""
LLM Service - Production-ready service for multiple LLM providers
Implements adapter pattern with model selection, retry logic, and monitoring
"""

import asyncio
import json
import logging
import time
import uuid
from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, AsyncGenerator, Union
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.schemas import (
    PromptRequest, LLMResponse, ModelInfo, TokenUsage, LLMError,
    ModelProvider, ModelType, Priority, AdapterConfig, HealthCheck,
    UsageStats, StreamChunk, ModelSelectionCriteria
)
from app.prompt_engineering import build_prompt, validate_variables, get_available_prompts


logger = logging.getLogger(__name__)


class LLMServiceError(Exception):
    """Base exception for LLM service errors"""
    pass


class ModelNotAvailableError(LLMServiceError):
    """Model not available error"""
    pass


class RateLimitError(LLMServiceError):
    """Rate limit exceeded error"""
    pass


class ValidationError(LLMServiceError):
    """Validation error"""
    pass


class BaseModelAdapter(ABC):
    """Abstract base class for LLM adapters"""
    
    def __init__(self, config: AdapterConfig):
        self.config = config
        self.provider = config.provider
        self.model_name = config.model_name
        self._client: Optional[httpx.AsyncClient] = None
        self._rate_limiter = None
        self._metrics = {
            "requests": 0,
            "errors": 0,
            "total_tokens": 0,
            "total_cost": 0.0,
            "last_request": None
        }
    
    @property
    @abstractmethod
    def model_info(self) -> ModelInfo:
        """Get model information"""
        pass
    
    @abstractmethod
    async def generate(
        self, 
        prompt: str, 
        **kwargs
    ) -> LLMResponse:
        """Generate response from prompt"""
        pass
    
    @abstractmethod
    async def stream_generate(
        self, 
        prompt: str, 
        **kwargs
    ) -> AsyncGenerator[StreamChunk, None]:
        """Stream generate response from prompt"""
        pass
    
    async def health_check(self) -> Dict[str, Any]:
        """Check adapter health"""
        return {
            "provider": self.provider.value,
            "model": self.model_name,
            "status": "healthy" if self.config.enabled else "disabled",
            "metrics": self._metrics.copy()
        }
    
    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count using simple heuristic"""
        # Rough estimation: ~4 characters per token
        return max(1, len(text) // 4)
    
    def _calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost estimate"""
        cost = 0.0
        if self.config.cost_per_1k_input:
            cost += (input_tokens / 1000) * self.config.cost_per_1k_input
        if self.config.cost_per_1k_output:
            cost += (output_tokens / 1000) * self.config.cost_per_1k_output
        return cost
    
    def _update_metrics(self, tokens_used: int, cost: float, error: bool = False):
        """Update adapter metrics"""
        self._metrics["requests"] += 1
        if error:
            self._metrics["errors"] += 1
        else:
            self._metrics["total_tokens"] += tokens_used
            self._metrics["total_cost"] += cost
        self._metrics["last_request"] = datetime.utcnow().isoformat()


class OpenAIAdapter(BaseModelAdapter):
    """OpenAI API adapter"""
    
    def __init__(self, config: AdapterConfig):
        super().__init__(config)
        self._base_url = config.api_base or "https://api.openai.com/v1"
    
    @property
    def model_info(self) -> ModelInfo:
        return ModelInfo(
            provider=ModelProvider.OPENAI,
            model_name=self.model_name,
            model_type=ModelType.VISION if "vision" in self.model_name.lower() else ModelType.CHAT,
            max_tokens=self.config.max_tokens,
            supports_streaming=True,
            supports_vision="vision" in self.model_name.lower(),
            cost_per_1k_input=self.config.cost_per_1k_input,
            cost_per_1k_output=self.config.cost_per_1k_output
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError))
    )
    async def generate(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate response using OpenAI API"""
        start_time = time.time()
        
        if not self.config.enabled:
            raise ModelNotAvailableError(f"OpenAI adapter disabled")
        
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }
        
        # Prepare request payload
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": kwargs.get("max_tokens", self.config.max_tokens),
            "temperature": kwargs.get("temperature", self.config.temperature),
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout_seconds) as client:
                response = await client.post(
                    f"{self._base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                
                # Calculate metrics
                input_tokens = usage.get("prompt_tokens", self._estimate_tokens(prompt))
                output_tokens = usage.get("completion_tokens", self._estimate_tokens(content))
                total_tokens = input_tokens + output_tokens
                cost = self._calculate_cost(input_tokens, output_tokens)
                latency_ms = (time.time() - start_time) * 1000
                
                self._update_metrics(total_tokens, cost)
                
                return LLMResponse(
                    content=content,
                    model_info=self.model_info,
                    token_usage=TokenUsage(
                        prompt_tokens=input_tokens,
                        completion_tokens=output_tokens,
                        total_tokens=total_tokens,
                        estimated_cost=cost
                    ),
                    request_id=kwargs.get("request_id"),
                    latency_ms=latency_ms,
                    finish_reason=data["choices"][0].get("finish_reason")
                )
                
        except httpx.HTTPStatusError as e:
            self._update_metrics(0, 0, error=True)
            if e.response.status_code == 429:
                raise RateLimitError(f"Rate limit exceeded: {e}")
            raise LLMServiceError(f"OpenAI API error: {e}")
        except Exception as e:
            self._update_metrics(0, 0, error=True)
            raise LLMServiceError(f"OpenAI adapter error: {e}")
    
    async def stream_generate(self, prompt: str, **kwargs) -> AsyncGenerator[StreamChunk, None]:
        """Stream generate using OpenAI API"""
        # TODO: Implement streaming for production use
        # For now, simulate streaming by yielding full response
        response = await self.generate(prompt, **kwargs)
        yield StreamChunk(
            content=response.content,
            is_final=True,
            token_count=response.token_usage.total_tokens
        )


class LocalONNXAdapter(BaseModelAdapter):
    """Local ONNX model adapter (stubbed for implementation)"""
    
    @property
    def model_info(self) -> ModelInfo:
        return ModelInfo(
            provider=ModelProvider.LOCAL,
            model_name=self.model_name,
            model_type=ModelType.CHAT,
            max_tokens=self.config.max_tokens,
            supports_streaming=False,
            supports_vision=False
        )
    
    async def generate(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate using local ONNX model"""
        # TODO: Implement ONNX model inference
        # This is a stub - replace with actual ONNX inference logic
        
        start_time = time.time()
        
        # Simulate processing time
        await asyncio.sleep(0.1)
        
        # Mock response
        content = f"Local ONNX response to: {prompt[:50]}..."
        input_tokens = self._estimate_tokens(prompt)
        output_tokens = self._estimate_tokens(content)
        latency_ms = (time.time() - start_time) * 1000
        
        return LLMResponse(
            content=content,
            model_info=self.model_info,
            token_usage=TokenUsage(
                prompt_tokens=input_tokens,
                completion_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
                estimated_cost=0.0  # Local model has no cost
            ),
            latency_ms=latency_ms,
            finish_reason="stop"
        )
    
    async def stream_generate(self, prompt: str, **kwargs) -> AsyncGenerator[StreamChunk, None]:
        """Stream generate using local model"""
        response = await self.generate(prompt, **kwargs)
        yield StreamChunk(
            content=response.content,
            is_final=True,
            token_count=response.token_usage.total_tokens
        )


class MockAdapter(BaseModelAdapter):
    """Mock adapter for testing"""
    
    @property
    def model_info(self) -> ModelInfo:
        return ModelInfo(
            provider=ModelProvider.MOCK,
            model_name="mock-model",
            model_type=ModelType.CHAT,
            max_tokens=1000,
            supports_streaming=True,
            supports_vision=False
        )
    
    async def generate(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate mock response"""
        await asyncio.sleep(0.05)  # Simulate latency
        
        content = json.dumps({
            "primary_diagnosis": {
                "label": "mock_pest_detected",
                "confidence": 0.85,
                "category": "pest"
            },
            "severity": {
                "score": 65,
                "band": "moderate",
                "factors": ["visual_symptoms", "environmental_conditions"]
            },
            "reasoning": "Mock analysis response for testing"
        }, indent=2)
        
        return LLMResponse(
            content=content,
            model_info=self.model_info,
            token_usage=TokenUsage(
                prompt_tokens=100,
                completion_tokens=50,
                total_tokens=150,
                estimated_cost=0.0
            ),
            latency_ms=50.0,
            finish_reason="stop"
        )
    
    async def stream_generate(self, prompt: str, **kwargs) -> AsyncGenerator[StreamChunk, None]:
        """Stream mock response"""
        chunks = ["Mock", " streaming", " response", " chunk"]
        for i, chunk in enumerate(chunks):
            await asyncio.sleep(0.01)
            yield StreamChunk(
                content=chunk,
                is_final=(i == len(chunks) - 1),
                token_count=1
            )


class ModelSelector:
    """Strategy for selecting appropriate models"""
    
    def __init__(self, adapters: Dict[str, BaseModelAdapter]):
        self.adapters = adapters
        self.fallback_order = ["openai", "local", "mock"]
    
    def select_adapter(
        self, 
        criteria: ModelSelectionCriteria,
        model_hint: Optional[str] = None
    ) -> BaseModelAdapter:
        """Select best adapter based on criteria"""
        
        # If specific model hinted, try that first
        if model_hint and model_hint in self.adapters:
            adapter = self.adapters[model_hint]
            if adapter.config.enabled:
                return adapter
        
        # Filter by criteria
        available_adapters = [
            (name, adapter) for name, adapter in self.adapters.items()
            if adapter.config.enabled
        ]
        
        if not available_adapters:
            raise ModelNotAvailableError("No adapters available")
        
        # For now, use simple fallback strategy
        # TODO: Implement sophisticated selection based on cost, latency, capabilities
        for name in self.fallback_order:
            if name in self.adapters and self.adapters[name].config.enabled:
                return self.adapters[name]
        
        # Return first available as last resort
        return available_adapters[0][1]


class LLMService:
    """Main LLM service with adapter management and monitoring"""
    
    def __init__(self, configs: List[AdapterConfig]):
        self.adapters: Dict[str, BaseModelAdapter] = {}
        self.selector: Optional[ModelSelector] = None
        self.usage_stats = UsageStats()
        self._setup_adapters(configs)
    
    def _setup_adapters(self, configs: List[AdapterConfig]):
        """Initialize adapters from configurations"""
        for config in configs:
            try:
                if config.provider == ModelProvider.OPENAI:
                    adapter = OpenAIAdapter(config)
                elif config.provider == ModelProvider.LOCAL:
                    adapter = LocalONNXAdapter(config)
                elif config.provider == ModelProvider.MOCK:
                    adapter = MockAdapter(config)
                else:
                    logger.warning(f"Unknown provider: {config.provider}")
                    continue
                
                adapter_name = f"{config.provider.value}_{config.model_name}"
                self.adapters[adapter_name] = adapter
                logger.info(f"Initialized adapter: {adapter_name}")
                
            except Exception as e:
                logger.error(f"Failed to initialize adapter {config.provider}: {e}")
        
        if self.adapters:
            self.selector = ModelSelector(self.adapters)
        else:
            raise LLMServiceError("No adapters could be initialized")
    
    async def generate(
        self,
        prompt_name: str,
        prompt_vars: Dict[str, Any],
        model_hint: Optional[str] = None,
        **kwargs
    ) -> LLMResponse:
        """Generate response using specified prompt"""
        
        start_time = time.time()
        request_id = kwargs.get("request_id", str(uuid.uuid4()))
        
        try:
            # Validate and build prompt
            validated_vars = validate_variables(prompt_name, prompt_vars)
            prompt = build_prompt(prompt_name, **validated_vars)
            
            # Select adapter
            criteria = ModelSelectionCriteria(
                priority=kwargs.get("priority", Priority.NORMAL),
                max_cost_per_request=kwargs.get("max_cost"),
                preferred_provider=kwargs.get("preferred_provider")
            )
            
            adapter = self.selector.select_adapter(criteria, model_hint)
            
            # Generate response
            response = await adapter.generate(
                prompt,
                request_id=request_id,
                **kwargs
            )
            
            # Update stats
            self.usage_stats.total_requests += 1
            self.usage_stats.successful_requests += 1
            self.usage_stats.total_tokens += response.token_usage.total_tokens
            self.usage_stats.total_cost += response.token_usage.estimated_cost or 0
            
            logger.info(
                f"LLM request completed",
                extra={
                    "request_id": request_id,
                    "prompt_name": prompt_name,
                    "adapter": adapter.model_name,
                    "tokens": response.token_usage.total_tokens,
                    "latency_ms": response.latency_ms
                }
            )
            
            return response
            
        except Exception as e:
            self.usage_stats.failed_requests += 1
            logger.error(
                f"LLM request failed",
                extra={
                    "request_id": request_id,
                    "prompt_name": prompt_name,
                    "error": str(e)
                }
            )
            raise
    
    async def stream_generate(
        self,
        prompt_name: str,
        prompt_vars: Dict[str, Any],
        model_hint: Optional[str] = None,
        **kwargs
    ) -> AsyncGenerator[StreamChunk, None]:
        """Stream generate response"""
        
        request_id = kwargs.get("request_id", str(uuid.uuid4()))
        
        try:
            # Validate and build prompt
            validated_vars = validate_variables(prompt_name, prompt_vars)
            prompt = build_prompt(prompt_name, **validated_vars)
            
            # Select adapter
            criteria = ModelSelectionCriteria()
            adapter = self.selector.select_adapter(criteria, model_hint)
            
            # Stream response
            async for chunk in adapter.stream_generate(prompt, **kwargs):
                yield chunk
                
        except Exception as e:
            logger.error(f"Stream generation failed: {e}")
            raise
    
    async def health_check(self) -> HealthCheck:
        """Check service health"""
        adapter_health = {}
        for name, adapter in self.adapters.items():
            try:
                adapter_health[name] = await adapter.health_check()
            except Exception as e:
                adapter_health[name] = {"status": "unhealthy", "error": str(e)}
        
        # Determine overall status
        healthy_count = sum(1 for health in adapter_health.values() 
                          if health.get("status") == "healthy")
        
        if healthy_count == 0:
            status = "unhealthy"
        elif healthy_count < len(adapter_health):
            status = "degraded"
        else:
            status = "healthy"
        
        return HealthCheck(
            service="llm_service",
            status=status,
            adapters=adapter_health,
            metrics={
                "total_requests": self.usage_stats.total_requests,
                "success_rate": (
                    self.usage_stats.successful_requests / max(1, self.usage_stats.total_requests)
                ),
                "total_cost": self.usage_stats.total_cost
            }
        )
    
    def get_usage_stats(self) -> UsageStats:
        """Get usage statistics"""
        return self.usage_stats
    
    def get_available_prompts(self) -> List[str]:
        """Get list of available prompts"""
        return get_available_prompts()
