"""
SLM Analysis Node - Small Language Model Analysis for Agricultural Computer Vision
Lightweight analysis focused on computer vision results interpretation
"""

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from app.schemas.postgres_base_models import WorkflowState, LLMAnalysisResult
from app.services.llm_service import get_llm_service, LLMProvider, LLMResponseType
# from app.services.slm_service import get_slm_service  # Local SLM disabled
from app.services.prompt_engineering import get_prompt_engine

logger = logging.getLogger(__name__)


async def slm_analysis_node(state: WorkflowState) -> WorkflowState:
    """
    Analyze computer vision results using Small Language Model approach
    
    This node focuses on:
    - Quick interpretation of CV model outputs
    - Severity assessment validation
    - Basic agricultural context
    - Lightweight recommendations
    
    Args:
        state: Current workflow state with vision results
        
    Returns:
        Updated state with SLM analysis results
    """
    start_time = datetime.utcnow()
    logger.info(f"🔍 Starting SLM analysis for trace_id: {state.trace_id}")
    
    try:
        # Check prerequisites
        if not state.vision_results:
            error_msg = "No vision results available for SLM analysis"
            logger.error(error_msg)
            state.errors.append(error_msg)
            return state
            
        if not state.processed_images:
            error_msg = "No processed images available for SLM analysis"
            logger.error(error_msg)
            state.errors.append(error_msg)
            return state
        
        # Get services
        llm_service = get_llm_service()
        # local_slm = get_slm_service()  # Local SLM disabled
        prompt_engine = get_prompt_engine()

        # Check for healthy SLM-suitable providers (prioritize faster, cheaper models)
        healthy_providers = llm_service.get_healthy_providers()
        slm_providers = [
            LLMProvider.OPENAI,  # GPT-4o-mini for fast analysis
            LLMProvider.GOOGLE,  # Gemini Flash for quick responses
            LLMProvider.ANTHROPIC  # Claude Haiku for efficiency
        ]

        # Select best available SLM provider
        available_slm_providers = [p for p in slm_providers if p in healthy_providers]

        if not available_slm_providers:
            error_msg = "No healthy LLM providers available for SLM analysis"
            logger.error(error_msg)
            state.errors.append(error_msg)
            return state

        selected_provider = available_slm_providers[0]
        logger.info(f"🤖 Using {selected_provider.value} for SLM analysis")

        # Prepare analysis context
        analysis_context = _prepare_slm_context(state)

        # Generate SLM-focused prompt
        slm_prompt = prompt_engine.generate_slm_vision_prompt(
            vision_results=state.vision_results,
            severity_assessment=state.severity_assessment,
            weather_context=state.weather_context,
            crop_info={
                "crop_type": state.payload.crop.value if state.payload else "unknown",
                "growth_stage": state.payload.stage.value if state.payload else "unknown",
                "location": state.payload.location.dict() if state.payload and state.payload.location else None
            },
            context_data=analysis_context
        )

        # Local SLM disabled; perform analysis with image via cloud provider
        image_data = state.processed_images[0]
        response = await llm_service.analyze_image_with_provider(
            provider=selected_provider,
            image_data=image_data,
            prompt=slm_prompt,
            response_type=LLMResponseType.SLM_ANALYSIS
        )
        
        # Create SLM analysis result
        slm_result = LLMAnalysisResult(
            provider=response.provider.value,
            model_name=response.metadata.get("model", "unknown"),
            analysis_type="slm_analysis",
            content=response.content,
            parsed_data=response.parse_json_content(),
            confidence=_extract_confidence_from_content(response.content),
            token_usage=response.metadata.get("usage", {}),
            processing_time=(datetime.utcnow() - start_time).total_seconds(),
            success=response.success,
            error_message=response.error,
            metadata={
                "prompt_length": len(slm_prompt),
                "image_size": len(state.processed_images[0]) if state.processed_images else 0,
                "finish_reason": response.metadata.get("finish_reason"),
                "analysis_focus": "computer_vision_interpretation",
                "provider_health": llm_service.provider_health.get(selected_provider, False)
            }
        )
        
        # Store SLM results
        state.llm_results.slm_analysis = slm_result
        
        # Update active providers list
        if selected_provider.value not in state.active_llm_providers:
            state.active_llm_providers.append(selected_provider.value)
        
        # Log success
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        state.processing_times["slm_analysis"] = processing_time
        state.node_execution_order.append("slm_analysis")
        
        logger.info(
            f"✅ SLM analysis completed in {processing_time:.2f}s "
            f"(provider: {selected_provider.value}, "
            f"tokens: {slm_result.token_usage.get('total_tokens', 0)})"
        )
        
        # Add structured insights to state if parsing succeeded
        if slm_result.parsed_data:
            _integrate_slm_insights(state, slm_result.parsed_data)
        
        return state
        
    except Exception as e:
        error_msg = f"SLM analysis failed: {str(e)}"
        logger.error(error_msg)
        state.errors.append(error_msg)
        
        # Record failed processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        state.processing_times["slm_analysis"] = processing_time
        
        return state


def _prepare_slm_context(state: WorkflowState) -> Dict[str, Any]:
    """Prepare context data for SLM analysis"""
    context = {
        "timestamp": datetime.utcnow().isoformat(),
        "trace_id": state.trace_id,
        "has_weather_data": state.weather_context is not None,
        "image_count": len(state.processed_images),
        "previous_errors": state.errors.copy()
    }
    
    # Add vision results summary
    if state.vision_results:
        context["vision_summary"] = {
            "detections_count": len(state.vision_results.get("predictions", [])),
            "highest_confidence": max(
                [pred.get("confidence", 0) for pred in state.vision_results.get("predictions", [])],
                default=0
            ),
            "detected_classes": list(set([
                pred.get("class_name", "unknown") 
                for pred in state.vision_results.get("predictions", [])
            ]))
        }
    
    # Add severity context
    if state.severity_assessment:
        context["severity_summary"] = {
            "score": state.severity_assessment.score_0_100,
            "band": state.severity_assessment.band.value,
            "confidence": state.severity_assessment.confidence,
            "factor_count": len(state.severity_assessment.factors)
        }
    
    # Add weather context
    if state.weather_context:
        context["weather_summary"] = {
            "risk_band": state.weather_context.risk_band.value,
            "risk_factor_count": len(state.weather_context.factors),
            "has_indices": state.weather_context.indices is not None
        }
    
    return context


def _extract_confidence_from_content(content: str) -> Optional[float]:
    """Extract confidence score from LLM response content"""
    try:
        # Try to parse JSON and extract confidence
        if "confidence" in content.lower():
            # Look for confidence patterns
            import re
            
            # Pattern for "confidence": 0.85 or "confidence": 85%
            confidence_patterns = [
                r'"confidence"[:\s]*([0-9]*\.?[0-9]+)',
                r'confidence[:\s]*([0-9]*\.?[0-9]+)%?',
                r'([0-9]*\.?[0-9]+)%?\s*confidence'
            ]
            
            for pattern in confidence_patterns:
                match = re.search(pattern, content.lower())
                if match:
                    value = float(match.group(1))
                    # Convert percentage to decimal if needed
                    if value > 1:
                        value = value / 100
                    return min(1.0, max(0.0, value))
        
        # Try JSON parsing for structured confidence
        try:
            # Extract JSON from markdown if present
            json_content = content
            if "```json" in content:
                start = content.find("```json") + 7
                end = content.find("```", start)
                json_content = content[start:end].strip()
            elif "```" in content:
                start = content.find("```") + 3
                end = content.find("```", start)
                json_content = content[start:end].strip()
            
            parsed = json.loads(json_content)
            if isinstance(parsed, dict) and "confidence" in parsed:
                conf = parsed["confidence"]
                if isinstance(conf, (int, float)):
                    return min(1.0, max(0.0, float(conf) if conf <= 1 else conf / 100))
                    
        except (json.JSONDecodeError, ValueError):
            pass
            
    except Exception as e:
        logger.debug(f"Could not extract confidence from content: {e}")
    
    return None


def _integrate_slm_insights(state: WorkflowState, parsed_data: Dict[str, Any]) -> None:
    """Integrate SLM insights into workflow state"""
    try:
        # Store SLM-specific insights for later consensus building
        if not hasattr(state, 'slm_insights'):
            state.slm_insights = {}
        
        # Extract key insights
        insights = {}
        
        # Severity insights
        if "severity" in parsed_data:
            severity_data = parsed_data["severity"]
            if isinstance(severity_data, dict):
                insights["severity_validation"] = {
                    "slm_score": severity_data.get("score"),
                    "slm_assessment": severity_data.get("assessment"),
                    "agreement_with_cv": severity_data.get("agrees_with_cv_model", True)
                }
        
        # Detection insights  
        if "detections" in parsed_data:
            detection_data = parsed_data["detections"]
            if isinstance(detection_data, dict):
                insights["detection_validation"] = {
                    "slm_primary_detection": detection_data.get("primary_issue"),
                    "slm_confidence": detection_data.get("confidence"),
                    "alternative_diagnoses": detection_data.get("alternatives", [])
                }
        
        # Treatment insights
        if "recommendations" in parsed_data:
            rec_data = parsed_data["recommendations"]
            if isinstance(rec_data, dict):
                insights["treatment_suggestions"] = {
                    "priority_actions": rec_data.get("immediate_actions", []),
                    "preventive_measures": rec_data.get("prevention", []),
                    "monitoring_advice": rec_data.get("monitoring", [])
                }
        
        # Risk assessment
        if "risk_assessment" in parsed_data:
            risk_data = parsed_data["risk_assessment"]
            if isinstance(risk_data, dict):
                insights["risk_evaluation"] = {
                    "urgency_level": risk_data.get("urgency"),
                    "spread_risk": risk_data.get("spread_likelihood"),
                    "economic_impact": risk_data.get("economic_impact")
                }
        
        # Store insights
        state.slm_insights = insights
        
        logger.debug(f"Integrated SLM insights: {list(insights.keys())}")
        
    except Exception as e:
        logger.warning(f"Failed to integrate SLM insights: {e}")


def _validate_slm_response_format(content: str) -> bool:
    """Validate that SLM response follows expected format"""
    try:
        # Check for required sections in structured response
        required_sections = [
            "analysis", "severity", "recommendations"
        ]
        
        content_lower = content.lower()
        
        # For JSON responses
        if "{" in content and "}" in content:
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict):
                    return any(section in parsed for section in required_sections)
            except json.JSONDecodeError:
                pass
        
        # For text responses, check for section headers
        section_found = any(section in content_lower for section in required_sections)
        
        # Check minimum content length (should have substantive analysis)
        min_length_check = len(content.strip()) > 100
        
        return section_found and min_length_check
        
    except Exception:
        return False


# Export for graph construction
__all__ = ["slm_analysis_node"]
