"""
LLM Vision Prediction Node - External LLM-based image analysis
"""

import logging
import time
import base64
import json
from typing import Dict, Any, List
from pathlib import Path

from app.schemas.postgres_base_models import WorkflowState
from app.services.llm_service import get_llm_service, LLMProvider, LLMResponseType
from app.services.prompt_engineering import get_prompt_engine

logger = logging.getLogger(__name__)


async def llm_vision_predict_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Run LLM-based vision prediction on preprocessed images
    
    Args:
        state: Current workflow state
        
    Returns:
        Updated state with LLM vision results
    """
    start_time = time.time()
    node_name = "llm_vision_predict"
    
    logger.info(
        f"🤖 Starting LLM vision prediction",
        extra={
            "trace_id": state.trace_id,
            "image_count": len(state.processed_images)
        }
    )
    
    try:
        # Get LLM service
        llm_service = get_llm_service()
        
        if not state.processed_images:
            error_msg = "No processed images available for LLM analysis"
            logger.error(error_msg, extra={"trace_id": state.trace_id})
            return {
                "errors": state.errors + [error_msg],
                "processing_times": {
                    **state.processing_times,
                    node_name: time.time() - start_time
                }
            }
        
        # Prepare context from workflow state
        context = _prepare_analysis_context(state)
        
        # Encode images for LLM
        encoded_images = []
        for image_path in state.processed_images[:3]:  # Limit to 3 images for cost
            try:
                encoded_image = _encode_image_for_llm(image_path)
                encoded_images.append(encoded_image)
            except Exception as e:
                logger.warning(f"Failed to encode image {image_path}: {e}")
        
        if not encoded_images:
            error_msg = "No images could be encoded for LLM analysis"
            logger.error(error_msg, extra={"trace_id": state.trace_id})
            return {
                "errors": state.errors + [error_msg],
                "processing_times": {
                    **state.processing_times,
                    node_name: time.time() - start_time
                }
            }
        
        # Prepare prompt variables
        prompt_vars = {
            "crop_type": context.get("crop_type", "unknown"),
            "growth_stage": context.get("growth_stage", "unknown"),
            "location": context.get("location", "not specified"),
            "weather_conditions": context.get("weather_conditions", "not specified"),
            "field_notes": context.get("field_notes", "not specified")
        }
        
        # Get healthy providers for vision analysis
        healthy_providers = llm_service.get_healthy_providers()
        if not healthy_providers:
            error_msg = "No healthy LLM providers available for vision analysis"
            logger.error(error_msg, extra={"trace_id": state.trace_id})
            return {
                "errors": state.errors + [error_msg],
                "processing_times": {
                    **state.processing_times,
                    node_name: time.time() - start_time
                }
            }
        
        # Prefer user-requested providers when available
        preferred = []
        try:
            preferred = [LLMProvider(p) for p in getattr(state, 'preferred_llm_providers', []) if p]
        except Exception:
            preferred = []
        candidate_providers = [p for p in preferred if p in healthy_providers] or healthy_providers
        # Choose a provider (prefer Google for vision)
        provider = next((p for p in candidate_providers if p == LLMProvider.GOOGLE), candidate_providers[0])
        
        # Create vision analysis prompt
        vision_prompt = f"""You are an expert agricultural AI assistant specializing in pest and disease identification.
        
Analyze the provided image(s) and identify any pests, diseases, or plant health issues.

Context:
- Crop: {prompt_vars['crop_type']}
- Growth stage: {prompt_vars['growth_stage']}
- Location: {prompt_vars['location']}
- Weather conditions: {prompt_vars['weather_conditions']}
- Field notes: {prompt_vars['field_notes']}

Please provide a detailed analysis including:
1. Identification of any pests or diseases visible
2. Severity assessment (low/medium/high) 
3. Confidence level in your assessment
4. Recommended immediate actions
5. Preventive measures

Respond in a structured format with clear findings and actionable recommendations."""
        
        # Generate LLM vision analysis using the service API
        try:
            # Use the first encoded image to control cost; extend to multiple if needed
            llm_resp = await llm_service.analyze_image_with_provider(
                provider=provider,
                image_data=encoded_images[0],
                prompt=vision_prompt,
                response_type=LLMResponseType.LLM_ANALYSIS
            )

            if not getattr(llm_resp, 'success', False):
                raise RuntimeError(getattr(llm_resp, 'error', 'LLM analysis failed'))

            # Parse structured content when possible
            parsed = None
            if hasattr(llm_resp, 'parse_json_content'):
                try:
                    parsed = llm_resp.parse_json_content()
                except Exception:
                    parsed = None
            content_text = getattr(llm_resp, 'content', '') or ''

            if parsed:
                llm_results = _parse_llm_response(json.dumps(parsed), state.trace_id)
            else:
                # Keep free-form content; wrap into expected dict
                llm_results = {
                    "primary_diagnosis": {
                        "label": "llm_observation",
                        "confidence": 0.5,
                        "category": "text"
                    },
                    "reasoning": content_text[:1500],
                    "recommendations": []
                }

        except Exception as e:
            logger.warning("LLM service doesn't support image analysis or failed; using text-only fallback")
            llm_results = {
                "primary_diagnosis": {
                    "label": "analysis_unavailable",
                    "confidence": 0.2,
                    "category": "fallback"
                },
                "reasoning": f"Fallback used: {str(e)}",
                "recommendations": []
            }
        
        # Store results
        llm_vision_results = {
            "provider": provider.value,
            "analysis": llm_results,
            "confidence": llm_results.get("primary_diagnosis", {}).get("confidence", 0.0),
            "images_analyzed": len(encoded_images),
            "timestamp": time.time()
        }
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"✅ LLM vision prediction completed",
            extra={
                "trace_id": state.trace_id,
                "provider": provider.value,
                "llm_diagnosis": llm_results.get("primary_diagnosis", {}).get("label", "unknown"),
                "llm_confidence": llm_results.get("primary_diagnosis", {}).get("confidence", 0.0),
                "processing_time": processing_time
            }
        )
        
        return {
            "llm_vision_results": llm_vision_results,
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        error_msg = f"LLM vision prediction failed: {str(e)}"
        logger.error(
            error_msg,
            extra={"trace_id": state.trace_id},
            exc_info=True
        )
        
        return {
            "errors": state.errors + [error_msg],
            "processing_times": {
                **state.processing_times,
                node_name: time.time() - start_time
            }
        }


def _prepare_analysis_context(state: WorkflowState) -> Dict[str, Any]:
    """Prepare context information for LLM analysis"""
    context = {}
    
    if state.payload:
        context["crop_type"] = getattr(state.payload, "crop", "unknown")
        context["growth_stage"] = getattr(state.payload, "stage", "unknown")
        context["field_notes"] = getattr(state.payload, "field_notes", "")
        
        if hasattr(state.payload, "location") and state.payload.location:
            location = state.payload.location
            context["location"] = f"Lat: {location.lat}, Lon: {location.lon}"
    
    # Add weather context if available
    if hasattr(state, "weather_context") and state.weather_context:
        weather = state.weather_context
        context["weather_conditions"] = f"Risk: {weather.risk_band}, Humidity: {weather.humidity_risk}"
    
    return context


def _encode_image_for_llm(image_path: str) -> str:
    """Encode image as base64 for LLM vision models"""
    try:
        with open(image_path, "rb") as image_file:
            image_data = image_file.read()
            # Resize image if too large (implement as needed)
            # For now, just encode
            encoded = base64.b64encode(image_data).decode('utf-8')
            return f"data:image/jpeg;base64,{encoded}"
    except Exception as e:
        logger.error(f"Failed to encode image {image_path}: {e}")
        raise


def _parse_llm_response(content: str, trace_id: str) -> Dict[str, Any]:
    """Parse LLM response content into structured format"""
    try:
        import json
        
        # Try to parse as JSON
        if content.strip().startswith('{'):
            return json.loads(content)
        
        # If not JSON, try to extract JSON from text
        import re
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        
        # Fallback: create structured response from text
        return {
            "primary_diagnosis": {
                "label": "llm_analysis_result",
                "confidence": 0.7,
                "category": "analysis"
            },
            "severity": {
                "score": 50,
                "band": "moderate",
                "factors": ["llm_analysis"]
            },
            "reasoning": content,
            "raw_response": content
        }
        
    except Exception as e:
        logger.warning(f"Failed to parse LLM response: {e}", extra={"trace_id": trace_id})
        return {
            "primary_diagnosis": {
                "label": "parsing_error",
                "confidence": 0.1,
                "category": "error"
            },
            "reasoning": "Failed to parse LLM response",
            "raw_response": content,
            "error": str(e)
        }
