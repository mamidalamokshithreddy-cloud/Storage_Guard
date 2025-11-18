"""
Cross-Validation Node - Meta-analysis combining SLM and LLM results
"""

import logging
import time
import json
from typing import Dict, Any, List, Optional

from app.schemas.postgres_base_models import WorkflowState
from app.services.llm_service import LLMService
from app.services.schemas import Priority

logger = logging.getLogger(__name__)


async def cross_validate_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Cross-validate SLM and LLM results using meta-analysis
    
    Args:
        state: Current workflow state containing both SLM and LLM results
        
    Returns:
        Updated state with validated consensus results
    """
    start_time = time.time()
    node_name = "cross_validate"
    
    logger.info(
        f"🔄 Starting cross-validation",
        extra={"trace_id": state.trace_id}
    )
    
    try:
        # Get both analysis results
        slm_results = getattr(state, "vision_results", None)
        llm_results = getattr(state, "llm_vision_results", None)
        
        if not slm_results and not llm_results:
            error_msg = "No analysis results available for cross-validation"
            logger.error(error_msg, extra={"trace_id": state.trace_id})
            return {
                **state.dict(),
                "errors": state.errors + [error_msg],
                "processing_times": {
                    **state.processing_times,
                    node_name: time.time() - start_time
                }
            }
        
        # If only one result available, use it directly
        if not slm_results:
            logger.info("Only LLM results available, using LLM analysis")
            consensus_results = _create_consensus_from_single_source(llm_results, "llm")
        elif not llm_results:
            logger.info("Only SLM results available, using SLM analysis")
            consensus_results = _create_consensus_from_single_source(slm_results, "slm")
        else:
            # Both results available - perform cross-validation
            consensus_results = await _perform_cross_validation(
                slm_results, llm_results, state
            )
        
        # Store validation results
        cross_validation_results = {
            "consensus": consensus_results,
            "validation_method": consensus_results.get("validation_method", "single_source"),
            "confidence_score": consensus_results.get("consensus_confidence", 0.5),
            "disagreement_areas": consensus_results.get("disagreement_areas", []),
            "human_review_needed": consensus_results.get("human_review_needed", False)
        }
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"✅ Cross-validation completed",
            extra={
                "trace_id": state.trace_id,
                "consensus_diagnosis": consensus_results.get("consensus_diagnosis", "unknown"),
                "consensus_confidence": consensus_results.get("consensus_confidence", 0.0),
                "validation_method": consensus_results.get("validation_method"),
                "processing_time": processing_time
            }
        )
        
        return {
            **state.dict(),
            "cross_validation_results": cross_validation_results,
            "validated_diagnosis": consensus_results.get("consensus_diagnosis"),
            "validated_confidence": consensus_results.get("consensus_confidence", 0.5),
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        error_msg = f"Cross-validation failed: {str(e)}"
        logger.error(
            error_msg,
            extra={"trace_id": state.trace_id},
            exc_info=True
        )
        
        return {
            **state.dict(),
            "errors": state.errors + [error_msg],
            "processing_times": {
                **state.processing_times,
                node_name: time.time() - start_time
            }
        }


async def _perform_cross_validation(
    slm_results: Dict[str, Any],
    llm_results: Dict[str, Any],
    state: WorkflowState
) -> Dict[str, Any]:
    """Perform cross-validation using meta-analysis LLM"""
    
    try:
        # Extract key information from both analyses
        slm_analysis = _extract_analysis_info(slm_results, "slm")
        llm_analysis = _extract_analysis_info(llm_results, "llm")
        
        # Prepare context for validation
        context = _prepare_validation_context(state)
        
        # Build cross-validation prompt
        prompt_vars = {
            "slm_diagnosis": slm_analysis["diagnosis"],
            "slm_confidence": slm_analysis["confidence"],
            "slm_severity": slm_analysis["severity"],
            "slm_reasoning": slm_analysis["reasoning"],
            "llm_diagnosis": llm_analysis["diagnosis"],
            "llm_confidence": llm_analysis["confidence"],
            "llm_severity": llm_analysis["severity"],
            "llm_reasoning": llm_analysis["reasoning"],
            **context
        }
        
        # Get LLM service for validation
        from app.graph.nodes.llm_vision_predict import _get_llm_service
        llm_service = _get_llm_service()
        
        # Generate validation response
        response = await llm_service.generate(
            prompt_name="cross_validation",
            prompt_vars=prompt_vars,
            model_hint="openai_gpt-4",  # Use text model for validation
            request_id=state.trace_id,
            priority=Priority.HIGH,
            max_tokens=800,
            temperature=0.1
        )
        
        # Parse validation results
        validation_results = _parse_validation_response(response.content)
        validation_results["validation_method"] = "llm_cross_validation"
        validation_results["validation_cost"] = response.token_usage.estimated_cost
        validation_results["validation_tokens"] = response.token_usage.total_tokens
        
        return validation_results
        
    except Exception as e:
        logger.error(f"Cross-validation LLM call failed: {e}")
        # Fallback to algorithmic validation
        return _algorithmic_validation(slm_results, llm_results)


def _extract_analysis_info(results: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Extract standardized information from analysis results"""
    
    if source == "slm":
        # Extract from SLM (computer vision) results
        diagnosis_info = results.get("aggregated_diagnosis", {})
        return {
            "diagnosis": getattr(diagnosis_info, "label", "unknown"),
            "confidence": getattr(diagnosis_info, "confidence", 0.0),
            "severity": "not_assessed",  # SLM doesn't assess severity directly
            "reasoning": "Computer vision analysis based on trained models"
        }
    
    elif source == "llm":
        # Extract from LLM results
        llm_analysis = results.get("llm_analysis", {})
        primary_diagnosis = llm_analysis.get("primary_diagnosis", {})
        severity_info = llm_analysis.get("severity", {})
        
        return {
            "diagnosis": primary_diagnosis.get("label", "unknown"),
            "confidence": primary_diagnosis.get("confidence", 0.0),
            "severity": severity_info.get("score", 0),
            "reasoning": llm_analysis.get("reasoning", "LLM-based image analysis")
        }
    
    return {
        "diagnosis": "unknown",
        "confidence": 0.0,
        "severity": 0,
        "reasoning": "No analysis available"
    }


def _prepare_validation_context(state: WorkflowState) -> Dict[str, Any]:
    """Prepare context for validation prompt"""
    context = {}
    
    if state.payload:
        context["crop_type"] = getattr(state.payload, "crop", "unknown")
        context["growth_stage"] = getattr(state.payload, "stage", "unknown")
        context["location"] = "not specified"
        
        if hasattr(state.payload, "location") and state.payload.location:
            location = state.payload.location
            context["location"] = f"Lat: {location.lat}, Lon: {location.lon}"
    
    # Add weather context
    if hasattr(state, "weather_context") and state.weather_context:
        weather = state.weather_context
        context["weather_risk"] = getattr(weather, "risk_band", "unknown")
    else:
        context["weather_risk"] = "not assessed"
    
    return context


def _parse_validation_response(content: str) -> Dict[str, Any]:
    """Parse validation response from LLM"""
    try:
        # Try to parse as JSON
        if content.strip().startswith('{'):
            response_data = json.loads(content)
            # Extract validation_result if nested
            if "validation_result" in response_data:
                return response_data["validation_result"]
            return response_data
        
        # Try to extract JSON from text
        import re
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            response_data = json.loads(json_match.group())
            if "validation_result" in response_data:
                return response_data["validation_result"]
            return response_data
        
        # Fallback response
        return {
            "consensus_diagnosis": "validation_parsing_error",
            "consensus_confidence": 0.1,
            "consensus_severity": 0,
            "agreement_areas": [],
            "disagreement_areas": ["response_parsing"],
            "human_review_needed": True,
            "meta_reasoning": "Could not parse validation response"
        }
        
    except Exception as e:
        logger.error(f"Failed to parse validation response: {e}")
        return {
            "consensus_diagnosis": "validation_error",
            "consensus_confidence": 0.1,
            "consensus_severity": 0,
            "agreement_areas": [],
            "disagreement_areas": ["validation_error"],
            "human_review_needed": True,
            "meta_reasoning": f"Validation parsing failed: {str(e)}"
        }


def _create_consensus_from_single_source(
    results: Dict[str, Any],
    source: str
) -> Dict[str, Any]:
    """Create consensus results from a single analysis source"""
    
    analysis_info = _extract_analysis_info(results, source)
    
    return {
        "consensus_diagnosis": analysis_info["diagnosis"],
        "consensus_confidence": analysis_info["confidence"],
        "consensus_severity": analysis_info["severity"] if isinstance(analysis_info["severity"], (int, float)) else 0,
        "validation_method": f"single_source_{source}",
        "agreement_areas": ["single_source_only"],
        "disagreement_areas": [],
        "human_review_needed": analysis_info["confidence"] < 0.7,
        "meta_reasoning": f"Only {source.upper()} analysis available: {analysis_info['reasoning']}"
    }


def _algorithmic_validation(
    slm_results: Dict[str, Any],
    llm_results: Dict[str, Any]
) -> Dict[str, Any]:
    """Fallback algorithmic validation when LLM validation fails"""
    
    slm_info = _extract_analysis_info(slm_results, "slm")
    llm_info = _extract_analysis_info(llm_results, "llm")
    
    # Simple consensus logic
    agreement_threshold = 0.7
    
    # Check diagnosis agreement
    diagnoses_match = slm_info["diagnosis"].lower() == llm_info["diagnosis"].lower()
    
    # Weight by confidence
    slm_weight = slm_info["confidence"]
    llm_weight = llm_info["confidence"]
    total_weight = slm_weight + llm_weight
    
    if total_weight > 0:
        consensus_confidence = (slm_weight + llm_weight) / 2
        
        # Choose diagnosis based on higher confidence
        if llm_weight > slm_weight:
            consensus_diagnosis = llm_info["diagnosis"]
            consensus_severity = llm_info["severity"]
        else:
            consensus_diagnosis = slm_info["diagnosis"]
            consensus_severity = 50  # Default severity for SLM
    else:
        consensus_confidence = 0.1
        consensus_diagnosis = "uncertain"
        consensus_severity = 0
    
    # Determine agreement areas
    agreement_areas = []
    disagreement_areas = []
    
    if diagnoses_match:
        agreement_areas.append("primary_diagnosis")
    else:
        disagreement_areas.append("primary_diagnosis")
    
    # Check if confidence levels are similar
    confidence_diff = abs(slm_info["confidence"] - llm_info["confidence"])
    if confidence_diff < 0.2:
        agreement_areas.append("confidence_level")
    else:
        disagreement_areas.append("confidence_level")
    
    # Determine if human review is needed
    human_review_needed = (
        not diagnoses_match or 
        consensus_confidence < 0.6 or
        len(disagreement_areas) > 1
    )
    
    return {
        "consensus_diagnosis": consensus_diagnosis,
        "consensus_confidence": consensus_confidence,
        "consensus_severity": consensus_severity,
        "validation_method": "algorithmic_validation",
        "agreement_areas": agreement_areas,
        "disagreement_areas": disagreement_areas,
        "human_review_needed": human_review_needed,
        "meta_reasoning": f"Algorithmic consensus between SLM ({slm_info['confidence']:.2f}) and LLM ({llm_info['confidence']:.2f})"
    }
    """
Cross-Validation Node - Meta-analysis combining SLM and LLM results
"""

import logging
import time
import json
from typing import Dict, Any, List, Optional

from app.schemas.postgres_base_models import WorkflowState
from app.services.llm_service import LLMService
from app.services.schemas import Priority

logger = logging.getLogger(__name__)


async def cross_validate_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Cross-validate SLM and LLM results using meta-analysis
    
    Args:
        state: Current workflow state containing both SLM and LLM results
        
    Returns:
        Updated state with validated consensus results
    """
    start_time = time.time()
    node_name = "cross_validate"
    
    logger.info(
        f"🔄 Starting cross-validation",
        extra={"trace_id": state.trace_id}
    )
    
    try:
        # Get both analysis results
        slm_results = getattr(state, "vision_results", None)
        llm_results = getattr(state, "llm_vision_results", None)
        
        if not slm_results and not llm_results:
            error_msg = "No analysis results available for cross-validation"
            logger.error(error_msg, extra={"trace_id": state.trace_id})
            return {
                **state.dict(),
                "errors": state.errors + [error_msg],
                "processing_times": {
                    **state.processing_times,
                    node_name: time.time() - start_time
                }
            }
        
        # If only one result available, use it directly
        if not slm_results:
            logger.info("Only LLM results available, using LLM analysis")
            consensus_results = _create_consensus_from_single_source(llm_results, "llm")
        elif not llm_results:
            logger.info("Only SLM results available, using SLM analysis")
            consensus_results = _create_consensus_from_single_source(slm_results, "slm")
        else:
            # Both results available - perform cross-validation
            consensus_results = await _perform_cross_validation(
                slm_results, llm_results, state
            )
        
        # Store validation results
        cross_validation_results = {
            "consensus": consensus_results,
            "validation_method": consensus_results.get("validation_method", "single_source"),
            "confidence_score": consensus_results.get("consensus_confidence", 0.5),
            "disagreement_areas": consensus_results.get("disagreement_areas", []),
            "human_review_needed": consensus_results.get("human_review_needed", False)
        }
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"✅ Cross-validation completed",
            extra={
                "trace_id": state.trace_id,
                "consensus_diagnosis": consensus_results.get("consensus_diagnosis", "unknown"),
                "consensus_confidence": consensus_results.get("consensus_confidence", 0.0),
                "validation_method": consensus_results.get("validation_method"),
                "processing_time": processing_time
            }
        )
        
        return {
            **state.dict(),
            "cross_validation_results": cross_validation_results,
            "validated_diagnosis": consensus_results.get("consensus_diagnosis"),
            "validated_confidence": consensus_results.get("consensus_confidence", 0.5),
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        error_msg = f"Cross-validation failed: {str(e)}"
        logger.error(
            error_msg,
            extra={"trace_id": state.trace_id},
            exc_info=True
        )
        
        return {
            **state.dict(),
            "errors": state.errors + [error_msg],
            "processing_times": {
                **state.processing_times,
                node_name: time.time() - start_time
            }
        }


async def _perform_cross_validation(
    slm_results: Dict[str, Any],
    llm_results: Dict[str, Any],
    state: WorkflowState
) -> Dict[str, Any]:
    """Perform cross-validation using meta-analysis LLM"""
    
    try:
        # Extract key information from both analyses
        slm_analysis = _extract_analysis_info(slm_results, "slm")
        llm_analysis = _extract_analysis_info(llm_results, "llm")
        
        # Prepare context for validation
        context = _prepare_validation_context(state)
        
        # Build cross-validation prompt
        prompt_vars = {
            "slm_diagnosis": slm_analysis["diagnosis"],
            "slm_confidence": slm_analysis["confidence"],
            "slm_severity": slm_analysis["severity"],
            "slm_reasoning": slm_analysis["reasoning"],
            "llm_diagnosis": llm_analysis["diagnosis"],
            "llm_confidence": llm_analysis["confidence"],
            "llm_severity": llm_analysis["severity"],
            "llm_reasoning": llm_analysis["reasoning"],
            **context
        }
        
        # Get LLM service for validation
        from app.graph.nodes.llm_vision_predict import _get_llm_service
        llm_service = _get_llm_service()
        
        # Generate validation response
        response = await llm_service.generate(
            prompt_name="cross_validation",
            prompt_vars=prompt_vars,
            model_hint="openai_gpt-4",  # Use text model for validation
            request_id=state.trace_id,
            priority=Priority.HIGH,
            max_tokens=800,
            temperature=0.1
        )
        
        # Parse validation results
        validation_results = _parse_validation_response(response.content)
        validation_results["validation_method"] = "llm_cross_validation"
        validation_results["validation_cost"] = response.token_usage.estimated_cost
        validation_results["validation_tokens"] = response.token_usage.total_tokens
        
        return validation_results
        
    except Exception as e:
        logger.error(f"Cross-validation LLM call failed: {e}")
        # Fallback to algorithmic validation
        return _algorithmic_validation(slm_results, llm_results)


def _extract_analysis_info(results: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Extract standardized information from analysis results"""
    
    if source == "slm":
        # Extract from SLM (computer vision) results
        diagnosis_info = results.get("aggregated_diagnosis", {})
        return {
            "diagnosis": getattr(diagnosis_info, "label", "unknown"),
            "confidence": getattr(diagnosis_info, "confidence", 0.0),
            "severity": "not_assessed",  # SLM doesn't assess severity directly
            "reasoning": "Computer vision analysis based on trained models"
        }
    
    elif source == "llm":
        # Extract from LLM results
        llm_analysis = results.get("llm_analysis", {})
        primary_diagnosis = llm_analysis.get("primary_diagnosis", {})
        severity_info = llm_analysis.get("severity", {})
        
        return {
            "diagnosis": primary_diagnosis.get("label", "unknown"),
            "confidence": primary_diagnosis.get("confidence", 0.0),
            "severity": severity_info.get("score", 0),
            "reasoning": llm_analysis.get("reasoning", "LLM-based image analysis")
        }
    
    return {
        "diagnosis": "unknown",
        "confidence": 0.0,
        "severity": 0,
        "reasoning": "No analysis available"
    }


def _prepare_validation_context(state: WorkflowState) -> Dict[str, Any]:
    """Prepare context for validation prompt"""
    context = {}
    
    if state.payload:
        context["crop_type"] = getattr(state.payload, "crop", "unknown")
        context["growth_stage"] = getattr(state.payload, "stage", "unknown")
        context["location"] = "not specified"
        
        if hasattr(state.payload, "location") and state.payload.location:
            location = state.payload.location
            context["location"] = f"Lat: {location.lat}, Lon: {location.lon}"
    
    # Add weather context
    if hasattr(state, "weather_context") and state.weather_context:
        weather = state.weather_context
        context["weather_risk"] = getattr(weather, "risk_band", "unknown")
    else:
        context["weather_risk"] = "not assessed"
    
    return context


def _parse_validation_response(content: str) -> Dict[str, Any]:
    """Parse validation response from LLM"""
    try:
        # Try to parse as JSON
        if content.strip().startswith('{'):
            response_data = json.loads(content)
            # Extract validation_result if nested
            if "validation_result" in response_data:
                return response_data["validation_result"]
            return response_data
        
        # Try to extract JSON from text
        import re
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            response_data = json.loads(json_match.group())
            if "validation_result" in response_data:
                return response_data["validation_result"]
            return response_data
        
        # Fallback response
        return {
            "consensus_diagnosis": "validation_parsing_error",
            "consensus_confidence": 0.1,
            "consensus_severity": 0,
            "agreement_areas": [],
            "disagreement_areas": ["response_parsing"],
            "human_review_needed": True,
            "meta_reasoning": "Could not parse validation response"
        }
        
    except Exception as e:
        logger.error(f"Failed to parse validation response: {e}")
        return {
            "consensus_diagnosis": "validation_error",
            "consensus_confidence": 0.1,
            "consensus_severity": 0,
            "agreement_areas": [],
            "disagreement_areas": ["validation_error"],
            "human_review_needed": True,
            "meta_reasoning": f"Validation parsing failed: {str(e)}"
        }


def _algorithmic_validation(
    slm_results: Dict[str, Any],
    llm_results: Dict[str, Any]
) -> Dict[str, Any]:
    """Fallback algorithmic validation when LLM validation fails"""
    
    slm_info = _extract_analysis_info(slm_results, "slm")
    llm_info = _extract_analysis_info(llm_results, "llm")
    
    # Simple consensus logic
    agreement_threshold = 0.7
    
    # Check diagnosis agreement
    diagnoses_match = slm_info["diagnosis"].lower() == llm_info["diagnosis"].lower()
    
    # Weight by confidence
    slm_weight = slm_info["confidence"]
    llm_weight = llm_info["confidence"]
    total_weight = slm_weight + llm_weight
    
    if total_weight > 0:
        consensus_confidence = (slm_weight + llm_weight) / 2
        
        # Choose diagnosis based on higher confidence
        if llm_weight > slm_weight:
            consensus_diagnosis = llm_info["diagnosis"]
            consensus_severity = llm_info["severity"]
        else:
            consensus_diagnosis = slm_info["diagnosis"]
            consensus_severity = 50  # Default severity for SLM
    else:
        consensus_confidence = 0.1
        consensus_diagnosis = "uncertain"
        consensus_severity = 0
    
    # Determine agreement areas
    agreement_areas = []
    disagreement_areas = []
    
    if diagnoses_match:
        agreement_areas.append("primary_diagnosis")
    else:
        disagreement_areas.append("primary_diagnosis")
    
    # Check if confidence levels are similar
    confidence_diff = abs(slm_info["confidence"] - llm_info["confidence"])
    if confidence_diff < 0.2:
        agreement_areas.append("confidence_level")
