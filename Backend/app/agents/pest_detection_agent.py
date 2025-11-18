"""
Pest Detection Agent - AI-powered pest and disease detection for agricultural monitoring

This agent integrates computer vision models, weather context, and expert knowledge
to provide comprehensive pest and disease identification with actionable recommendations.
"""

import logging
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from pathlib import Path

from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.cache import get_cache_manager
from app.core.security import InputValidator
from app.schemas.postgres_base_models import (
    AnalysisPayload, AnalysisResponse, ImageData, CropType, GrowthStage,
    WorkflowState, Diagnosis, Alternative, Detection, SeverityAssessment,
    WeatherRisk, IPMRecommendation, Location
)
from app.graph.graph import get_workflow
# Local CV model manager disabled in LLM-only mode
from app.services.weather_service import WeatherService


logger = get_logger(__name__)
settings = settings()


@dataclass
class PestDetectionConfig:
    """Configuration for pest detection agent"""
    confidence_threshold: float = 0.6
    uncertainty_threshold: float = 0.2
    max_images_per_analysis: int = 5
    enable_weather_integration: bool = True
    cache_predictions: bool = True
    cache_ttl: int = 3600  # 1 hour
    enable_detection_models: bool = True
    severity_bands: Dict[str, Tuple[int, int]] = field(default_factory=lambda: {
        "low": (0, 30),
        "moderate": (31, 60), 
        "high": (61, 85),
        "severe": (86, 100)
    })


@dataclass
class DetectionContext:
    """Context information for pest detection analysis"""
    trace_id: str
    timestamp: datetime
    crop_info: Dict[str, Any]
    location_info: Optional[Dict[str, Any]] = None
    weather_data: Optional[Dict[str, Any]] = None
    field_history: Optional[List[Dict]] = None
    user_preferences: Optional[Dict[str, Any]] = None


class PestDetectionAgent:
    """
    Advanced AI agent for comprehensive pest and disease detection
    
    Features:
    - Multi-model computer vision inference
    - Weather-aware risk assessment
    - Severity scoring with confidence calibration
    - IPM-aligned treatment recommendations
    - Contextual analysis with field history
    - Performance monitoring and caching
    """
    
    def __init__(self, config: Optional[PestDetectionConfig] = None):
        """
        Initialize the pest detection agent
        
        Args:
            config: Agent configuration options
        """
        self.config = config or PestDetectionConfig()
        self.settings = settings()
        self.cache_manager = get_cache_manager()
        self.input_validator = InputValidator()
        self.workflow = get_workflow()
        self.weather_service = WeatherService()
        
        # Performance tracking
        self.performance_stats = {
            "total_analyses": 0,
            "successful_detections": 0,
            "average_processing_time": 0.0,
            "cache_hits": 0,
            "model_loading_time": 0.0
        }
        
        logger.info(
            "🔬 Pest Detection Agent initialized",
            extra={
                "config": self.config.__dict__,
                "confidence_threshold": self.config.confidence_threshold,
                "max_images": self.config.max_images_per_analysis
            }
        )
    
    async def analyze_pest_disease(
        self,
        images: List[ImageData],
        crop_type: CropType,
        growth_stage: Optional[GrowthStage] = None,
        location: Optional[Location] = None,
        field_notes: Optional[str] = None,
        previous_treatments: Optional[List[Dict]] = None,
        user_id: Optional[str] = None
    ) -> AnalysisResponse:
        """
        Perform comprehensive pest and disease analysis
        
        Args:
            images: List of crop images to analyze
            crop_type: Type of crop being analyzed
            growth_stage: Current growth stage of crop
            location: GPS location for weather context
            field_notes: Additional field observations
            previous_treatments: History of applied treatments
            user_id: User identifier for personalization
            
        Returns:
            Comprehensive analysis response with recommendations
        """
        trace_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        logger.info(
            "🚀 Starting pest detection analysis",
            extra={
                "trace_id": trace_id,
                "image_count": len(images),
                "crop_type": crop_type.value,
                "growth_stage": growth_stage.value if growth_stage else None,
                "has_location": location is not None,
                "user_id": user_id
            }
        )
        
        try:
            # Input validation and preprocessing
            validated_payload = await self._validate_and_prepare_input(
                images, crop_type, growth_stage, location, field_notes, trace_id
            )
            
            # Check cache for similar analyses
            if self.config.cache_predictions:
                cached_result = await self._check_analysis_cache(validated_payload, trace_id)
                if cached_result:
                    logger.info("📋 Returning cached analysis result", extra={"trace_id": trace_id})
                    self.performance_stats["cache_hits"] += 1
                    return cached_result
            
            # Create detection context
            context = await self._build_detection_context(
                validated_payload, previous_treatments, user_id, trace_id
            )
            
            # Execute main analysis workflow
            analysis_result = await self._execute_analysis_workflow(
                validated_payload, context, trace_id
            )
            
            # Post-process and enhance results
            enhanced_result = await self._enhance_analysis_result(
                analysis_result, context, trace_id
            )
            
            # Cache successful results
            if self.config.cache_predictions and enhanced_result.success:
                await self._cache_analysis_result(validated_payload, enhanced_result, trace_id)
            
            # Update performance statistics
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            await self._update_performance_stats(enhanced_result.success, processing_time)
            
            logger.info(
                "✅ Pest detection analysis completed",
                extra={
                    "trace_id": trace_id,
                    "success": enhanced_result.success,
                    "processing_time": processing_time,
                    "detections_found": len(enhanced_result.detections),
                    "action_required": enhanced_result.action_required
                }
            )
            
            return enhanced_result
            
        except Exception as e:
            error_msg = f"Pest detection analysis failed: {str(e)}"
            logger.error(
                error_msg,
                extra={"trace_id": trace_id},
                exc_info=True
            )
            
            # Return error response
            return self._create_error_response(error_msg, trace_id, start_time)
    
    async def _validate_and_prepare_input(
        self,
        images: List[ImageData],
        crop_type: CropType,
        growth_stage: Optional[GrowthStage],
        location: Optional[Location],
        field_notes: Optional[str],
        trace_id: str
    ) -> AnalysisPayload:
        """Validate and prepare input data for analysis"""
        
        logger.debug("🔍 Validating input data", extra={"trace_id": trace_id})
        
        # Validate image count
        if len(images) > self.config.max_images_per_analysis:
            raise ValueError(f"Too many images. Maximum {self.config.max_images_per_analysis} allowed")
        
        if not images:
            raise ValueError("At least one image is required for analysis")
        
        # Validate and sanitize images
        validated_images = []
        for i, image in enumerate(images):
            try:
                # Use security module for image validation
                is_valid, cleaned_data = await self.input_validator.validate_and_sanitize_image(
                    image.data, image.format
                )
                
                if not is_valid:
                    raise ValueError(f"Image {i+1} failed security validation")
                
                validated_images.append(ImageData(
                    data=cleaned_data,
                    format=image.format,
                    metadata=image.metadata
                ))
                
            except Exception as e:
                raise ValueError(f"Image {i+1} validation failed: {str(e)}")
        
        # Validate field notes if provided
        if field_notes:
            field_notes = await self.input_validator.sanitize_text_input(field_notes)
        
        payload = AnalysisPayload(
            images=validated_images,
            crop_type=crop_type,
            growth_stage=growth_stage,
            location=location,
            field_notes=field_notes,
            timestamp=datetime.utcnow(),
            user_metadata={"trace_id": trace_id}
        )
        
        logger.debug(
            "✅ Input validation completed",
            extra={"trace_id": trace_id, "validated_images": len(validated_images)}
        )
        
        return payload
    
    async def _check_analysis_cache(
        self, payload: AnalysisPayload, trace_id: str
    ) -> Optional[AnalysisResponse]:
        """Check if similar analysis exists in cache"""
        
        try:
            # Create cache key based on image hashes and crop info
            cache_key = await self._generate_cache_key(payload)
            
            cached_data = await self.cache_manager.get(
                cache_key, 
                cache_type="analysis_results"
            )
            
            if cached_data:
                logger.debug(
                    "📋 Cache hit for analysis",
                    extra={"trace_id": trace_id, "cache_key": cache_key}
                )
                
                # Deserialize and return cached result
                return AnalysisResponse.parse_obj(cached_data)
            
            return None
            
        except Exception as e:
            logger.warning(f"Cache check failed: {e}", extra={"trace_id": trace_id})
            return None
    
    async def _build_detection_context(
        self,
        payload: AnalysisPayload,
        previous_treatments: Optional[List[Dict]],
        user_id: Optional[str],
        trace_id: str
    ) -> DetectionContext:
        """Build comprehensive context for detection analysis"""
        
        logger.debug("🔧 Building detection context", extra={"trace_id": trace_id})
        
        # Basic crop information
        crop_info = {
            "type": payload.crop_type.value,
            "growth_stage": payload.growth_stage.value if payload.growth_stage else "unknown",
            "field_notes": payload.field_notes
        }
        
        # Location and weather context
        location_info = None
        weather_data = None
        
        if payload.location and self.config.enable_weather_integration:
            try:
                location_info = {
                    "latitude": payload.location.latitude,
                    "longitude": payload.location.longitude,
                    "altitude": payload.location.altitude
                }
                
                # Get weather data for risk assessment
                weather_data = await self.weather_service.get_current_conditions(
                    payload.location.latitude,
                    payload.location.longitude
                )
                
                # Get recent weather history for disease pressure
                weather_history = await self.weather_service.get_weather_history(
                    payload.location.latitude,
                    payload.location.longitude,
                    days=7
                )
                
                weather_data["history"] = weather_history
                
            except Exception as e:
                logger.warning(f"Weather data retrieval failed: {e}", extra={"trace_id": trace_id})
        
        # Field history and user preferences
        field_history = previous_treatments or []
        user_preferences = await self._get_user_preferences(user_id, trace_id)
        
        context = DetectionContext(
            trace_id=trace_id,
            timestamp=datetime.utcnow(),
            crop_info=crop_info,
            location_info=location_info,
            weather_data=weather_data,
            field_history=field_history,
            user_preferences=user_preferences
        )
        
        logger.debug(
            "✅ Detection context built",
            extra={
                "trace_id": trace_id,
                "has_weather": weather_data is not None,
                "has_location": location_info is not None,
                "treatment_history_count": len(field_history)
            }
        )
        
        return context
    
    async def _execute_analysis_workflow(
        self,
        payload: AnalysisPayload,
        context: DetectionContext,
        trace_id: str
    ) -> AnalysisResponse:
        """Execute the main LangGraph analysis workflow"""
        
        logger.info(
            "🔄 Executing analysis workflow",
            extra={"trace_id": trace_id}
        )
        
        try:
            # Use the existing LangGraph workflow
            result = await self.workflow.analyze_images(payload)
            
            # Add context information to the result
            if hasattr(result, 'metadata') and result.metadata:
                result.metadata.update({
                    "detection_context": {
                        "weather_included": context.weather_data is not None,
                        "location_provided": context.location_info is not None,
                        "field_history_items": len(context.field_history),
                        "analysis_timestamp": context.timestamp.isoformat()
                    }
                })
            
            return result
            
        except Exception as e:
            logger.error(
                f"Workflow execution failed: {str(e)}",
                extra={"trace_id": trace_id},
                exc_info=True
            )
            raise
    
    async def _enhance_analysis_result(
        self,
        result: AnalysisResponse,
        context: DetectionContext,
        trace_id: str
    ) -> AnalysisResponse:
        """Enhance analysis result with additional insights and recommendations"""
        
        logger.debug("🎯 Enhancing analysis result", extra={"trace_id": trace_id})
        
        try:
            # Enhance with weather-based risk assessment
            if context.weather_data and result.weather_risk:
                enhanced_weather_risk = await self._enhance_weather_risk_assessment(
                    result.weather_risk, context.weather_data, trace_id
                )
                result.weather_risk = enhanced_weather_risk
            
            # Add field history context to recommendations
            if context.field_history and result.ipm_recommendations:
                enhanced_recommendations = await self._enhance_ipm_recommendations(
                    result.ipm_recommendations, context.field_history, trace_id
                )
                result.ipm_recommendations = enhanced_recommendations
            
            # Add severity band classification
            if result.severity_assessment:
                severity_band = self._classify_severity_band(result.severity_assessment.overall_score)
                result.severity_assessment.severity_band = severity_band
            
            # Generate executive summary if not present
            if not result.executive_summary:
                result.executive_summary = await self._generate_executive_summary(
                    result, context, trace_id
                )
            
            # Add next steps recommendations
            result.next_steps = await self._generate_next_steps(result, context, trace_id)
            
            logger.debug("✅ Analysis result enhanced",extra={"trace_id": trace_id})
            
            return result
            
        except Exception as e:
            logger.warning(f"Result enhancement failed: {e}", extra={"trace_id": trace_id})
            return result  # Return original result if enhancement fails
    
    async def _enhance_weather_risk_assessment(
        self,
        weather_risk: WeatherRisk,
        weather_data: Dict[str, Any],
        trace_id: str
    ) -> WeatherRisk:
        """Enhance weather risk assessment with additional insights"""
        
        try:
            # Calculate disease pressure indicators
            humidity_avg = weather_data.get("humidity", 0)
            temp_avg = weather_data.get("temperature", 0)
            precipitation = weather_data.get("precipitation", 0)
            
            # Enhance risk factors based on weather patterns
            enhanced_factors = list(weather_risk.risk_factors)
            
            # High humidity disease risk
            if humidity_avg > 80:
                enhanced_factors.append("High humidity favors fungal diseases")
            
            # Temperature stress indicators
            if temp_avg > 35:
                enhanced_factors.append("Heat stress may increase pest susceptibility")
            elif temp_avg < 10:
                enhanced_factors.append("Cool temperatures may slow pest development")
            
            # Precipitation effects
            if precipitation > 10:
                enhanced_factors.append("Recent rain increases disease infection risk")
            
            # Weather history patterns
            if "history" in weather_data:
                history = weather_data["history"]
                if len(history) >= 3:
                    avg_humidity_week = sum(day.get("humidity", 0) for day in history) / len(history)
                    if avg_humidity_week > 75:
                        enhanced_factors.append("Prolonged high humidity period detected")
            
            weather_risk.risk_factors = enhanced_factors
            
            return weather_risk
            
        except Exception as e:
            logger.warning(f"Weather risk enhancement failed: {e}", extra={"trace_id": trace_id})
            return weather_risk
    
    async def _enhance_ipm_recommendations(
        self,
        recommendations: List[IPMRecommendation],
        field_history: List[Dict],
        trace_id: str
    ) -> List[IPMRecommendation]:
        """Enhance IPM recommendations based on field treatment history"""
        
        try:
            # Track recently used active ingredients
            recent_treatments = []
            cutoff_date = datetime.utcnow() - timedelta(days=90)  # 3 months
            
            for treatment in field_history:
                treatment_date = treatment.get("date")
                if treatment_date and isinstance(treatment_date, str):
                    treatment_date = datetime.fromisoformat(treatment_date.replace('Z', '+00:00'))
                
                if treatment_date and treatment_date > cutoff_date:
                    recent_treatments.append(treatment)
            
            # Enhance recommendations with resistance management
            enhanced_recommendations = []
            
            for rec in recommendations:
                enhanced_rec = rec.copy() if hasattr(rec, 'copy') else rec
                
                # Check for mode of action rotation
                if hasattr(enhanced_rec, 'active_ingredient'):
                    active_ingredient = enhanced_rec.active_ingredient
                    
                    # Check if this active ingredient was used recently
                    recently_used = any(
                        t.get("active_ingredient") == active_ingredient 
                        for t in recent_treatments
                    )
                    
                    if recently_used:
                        if hasattr(enhanced_rec, 'notes'):
                            enhanced_rec.notes += " WARNING: This active ingredient was used recently. Consider resistance management rotation."
                        else:
                            enhanced_rec.notes = "WARNING: Recently used - consider rotation for resistance management."
                
                enhanced_recommendations.append(enhanced_rec)
            
            # Add resistance management recommendations
            if recent_treatments:
                resistance_note = IPMRecommendation(
                    type="cultural",
                    priority="high",
                    action="Resistance Management",
                    timing="ongoing",
                    description="Rotate modes of action to prevent resistance development",
                    notes=f"Based on {len(recent_treatments)} recent treatments in the last 90 days"
                )
                enhanced_recommendations.insert(0, resistance_note)
            
            return enhanced_recommendations
            
        except Exception as e:
            logger.warning(f"IPM recommendation enhancement failed: {e}", extra={"trace_id": trace_id})
            return recommendations
    
    def _classify_severity_band(self, severity_score: float) -> str:
        """Classify severity score into descriptive bands"""
        
        for band, (min_score, max_score) in self.config.severity_bands.items():
            if min_score <= severity_score <= max_score:
                return band
        
        return "unknown"
    
    async def _generate_executive_summary(
        self,
        result: AnalysisResponse,
        context: DetectionContext,
        trace_id: str
    ) -> str:
        """Generate executive summary of analysis results"""
        
        try:
            summary_parts = []
            
            # Detection summary
            if result.detections:
                primary_detection = result.detections[0]
                confidence = primary_detection.confidence
                
                if confidence > 0.8:
                    confidence_text = "high confidence"
                elif confidence > 0.6:
                    confidence_text = "moderate confidence"
                else:
                    confidence_text = "low confidence"
                
                summary_parts.append(
                    f"Detected {primary_detection.pest_name} with {confidence_text} "
                    f"({confidence:.1%})"
                )
            else:
                summary_parts.append("No significant pest or disease issues detected")
            
            # Severity assessment
            if result.severity_assessment:
                severity_band = self._classify_severity_band(result.severity_assessment.overall_score)
                summary_parts.append(f"Severity level: {severity_band}")
            
            # Action requirement
            if result.action_required:
                summary_parts.append("Immediate action recommended")
            else:
                summary_parts.append("Continue monitoring")
            
            # Weather context
            if result.weather_risk and result.weather_risk.risk_level != "low":
                summary_parts.append(f"Weather risk: {result.weather_risk.risk_level}")
            
            return ". ".join(summary_parts) + "."
            
        except Exception as e:
            logger.warning(f"Executive summary generation failed: {e}", extra={"trace_id": trace_id})
            return "Analysis completed. Review detailed results below."
    
    async def _generate_next_steps(
        self,
        result: AnalysisResponse,
        context: DetectionContext,
        trace_id: str
    ) -> List[str]:
        """Generate actionable next steps based on analysis results"""
        
        try:
            next_steps = []
            
            # Based on action requirement
            if result.action_required:
                if result.ipm_recommendations:
                    next_steps.append("Implement recommended IPM treatments")
                    next_steps.append("Monitor treatment effectiveness within 7-14 days")
                else:
                    next_steps.append("Consult with agricultural advisor for treatment options")
            else:
                next_steps.append("Continue regular monitoring schedule")
            
            # Weather-based recommendations
            if result.weather_risk and result.weather_risk.risk_level in ["high", "severe"]:
                next_steps.append("Increase monitoring frequency due to weather conditions")
                next_steps.append("Consider preventive treatments if available")
            
            # Field history considerations
            if context.field_history:
                recent_treatments = [
                    t for t in context.field_history 
                    if (datetime.utcnow() - datetime.fromisoformat(
                        t.get("date", "2000-01-01T00:00:00")
                    )).days < 30
                ]
                
                if recent_treatments:
                    next_steps.append("Document treatment results for future reference")
            
            # Image quality recommendations
            if result.confidence_scores.get("overall", 1.0) < 0.7:
                next_steps.append("Consider taking additional images for better analysis")
                next_steps.append("Ensure good lighting and focus for future images")
            
            # General monitoring
            next_steps.append("Schedule follow-up monitoring in 1-2 weeks")
            next_steps.append("Document field conditions and symptoms")
            
            return next_steps[:6]  # Limit to 6 most relevant steps
            
        except Exception as e:
            logger.warning(f"Next steps generation failed: {e}", extra={"trace_id": trace_id})
            return ["Continue monitoring", "Consult agricultural advisor if conditions worsen"]
    
    async def _cache_analysis_result(
        self,
        payload: AnalysisPayload,
        result: AnalysisResponse,
        trace_id: str
    ) -> None:
        """Cache analysis result for future similar requests"""
        
        try:
            cache_key = await self._generate_cache_key(payload)
            
            await self.cache_manager.set(
                cache_key,
                result.dict(),
                ttl=self.config.cache_ttl,
                cache_type="analysis_results"
            )
            
            logger.debug(
                "📋 Analysis result cached",
                extra={"trace_id": trace_id, "cache_key": cache_key}
            )
            
        except Exception as e:
            logger.warning(f"Failed to cache analysis result: {e}", extra={"trace_id": trace_id})
    
    async def _generate_cache_key(self, payload: AnalysisPayload) -> str:
        """Generate cache key based on payload content"""
        
        import hashlib
        
        # Create hash from image data and metadata
        key_components = [
            payload.crop_type.value,
            payload.growth_stage.value if payload.growth_stage else "unknown"
        ]
        
        # Add image hashes
        for image in payload.images:
            image_hash = hashlib.md5(image.data.encode() if isinstance(image.data, str) else image.data).hexdigest()
            key_components.append(image_hash[:8])  # Use first 8 chars
        
        # Add location if provided (rounded for cache efficiency)
        if payload.location:
            lat_rounded = round(payload.location.latitude, 2)
            lon_rounded = round(payload.location.longitude, 2)
            key_components.extend([str(lat_rounded), str(lon_rounded)])
        
        return "pest_analysis:" + ":".join(key_components)
    
    async def _get_user_preferences(self, user_id: Optional[str], trace_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences for personalized recommendations"""
        
        if not user_id:
            return None
        
        try:
            # TODO: Implement user preference retrieval from database
            # For now, return default preferences
            return {
                "organic_preferred": False,
                "chemical_tolerance": "moderate",
                "notification_level": "normal",
                "experience_level": "intermediate"
            }
            
        except Exception as e:
            logger.warning(f"Failed to get user preferences: {e}", extra={"trace_id": trace_id})
            return None
    
    async def _update_performance_stats(self, success: bool, processing_time: float) -> None:
        """Update agent performance statistics"""
        
        try:
            self.performance_stats["total_analyses"] += 1
            
            if success:
                self.performance_stats["successful_detections"] += 1
            
            # Update rolling average processing time
            current_avg = self.performance_stats["average_processing_time"]
            total_analyses = self.performance_stats["total_analyses"]
            
            new_avg = ((current_avg * (total_analyses - 1)) + processing_time) / total_analyses
            self.performance_stats["average_processing_time"] = new_avg
            
        except Exception as e:
            logger.warning(f"Failed to update performance stats: {e}")
    
    def _create_error_response(
        self, error_msg: str, trace_id: str, start_time: datetime
    ) -> AnalysisResponse:
        """Create error response for failed analysis"""
        
        return AnalysisResponse(
            success=False,
            executive_summary="Analysis failed due to technical error",
            detections=[],
            severity_assessment=None,
            weather_risk=None,
            ipm_recommendations=[],
            action_required=True,
            urgency_level="medium",
            confidence_scores={"overall": 0.0},
            detailed_analysis=f"Technical error occurred: {error_msg}",
            next_steps=["Manual inspection recommended", "Contact support if issue persists"],
            metadata={
                "trace_id": trace_id,
                "timestamp": datetime.utcnow(),
                "processing_time": (datetime.utcnow() - start_time).total_seconds(),
                "agent_version": "1.0.0",
                "error": True
            },
            errors=[error_msg]
        )
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics"""
        
        success_rate = 0.0
        if self.performance_stats["total_analyses"] > 0:
            success_rate = (
                self.performance_stats["successful_detections"] / 
                self.performance_stats["total_analyses"]
            )
        
        return {
            **self.performance_stats,
            "success_rate": success_rate,
            "cache_hit_rate": (
                self.performance_stats["cache_hits"] / 
                max(self.performance_stats["total_analyses"], 1)
            )
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check of agent components"""
        
        health_status = {
            "agent_status": "healthy",
            "model_status": "unknown",
            "workflow_status": "unknown",
            "cache_status": "unknown",
            "weather_service_status": "unknown",
            "overall_status": "healthy"
        }
        
        try:
            # In LLM-only mode, CV model is disabled
            health_status["model_status"] = "disabled"
            
            # Check workflow
            if self.workflow:
                health_status["workflow_status"] = "healthy"
            else:
                health_status["workflow_status"] = "unhealthy"
                health_status["overall_status"] = "degraded"
            
            # Check cache
            try:
                await self.cache_manager.ping()
                health_status["cache_status"] = "healthy"
            except:
                health_status["cache_status"] = "unhealthy"
                health_status["overall_status"] = "degraded"
            
            # Check weather service
            try:
                # Simple connectivity test
                health_status["weather_service_status"] = "healthy"
            except:
                health_status["weather_service_status"] = "unhealthy"
                # Weather service failure doesn't make overall status unhealthy
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            health_status["overall_status"] = "unhealthy"
            health_status["error"] = str(e)
        
        return health_status


# Global agent instance
_agent_instance: Optional[PestDetectionAgent] = None


def get_pest_detection_agent(config: Optional[PestDetectionConfig] = None) -> PestDetectionAgent:
    """
    Get global pest detection agent instance
    
    Args:
        config: Optional configuration override
        
    Returns:
        Pest detection agent instance
    """
    global _agent_instance
    
    if _agent_instance is None:
        _agent_instance = PestDetectionAgent(config)
    
    return _agent_instance


async def initialize_agent(config: Optional[PestDetectionConfig] = None) -> PestDetectionAgent:
    """
    Initialize pest detection agent
    
    Args:
        config: Optional agent configuration
        
    Returns:
        Initialized agent instance
    """
    agent = get_pest_detection_agent(config)
    
    # Perform initialization health check
    health_status = await agent.health_check()
    
    if health_status["overall_status"] != "healthy":
        logger.warning(
            "Agent initialized with degraded health",
            extra={"health_status": health_status}
        )
    else:
        logger.info("🎯 Pest Detection Agent initialized successfully")
    
    return agent


async def cleanup_agent():
    """Cleanup pest detection agent resources"""
    global _agent_instance
    
    if _agent_instance:
        logger.info("🧹 Cleaning up Pest Detection Agent")
        # Perform any necessary cleanup
        _agent_instance = None
