"""
Threshold Decision Node - Evaluate severity against thresholds
"""

import logging
import time
from typing import Dict, Any

from app.schemas.postgres_base_models import WorkflowState, PredictionResult, WeatherRisk, SeverityScore, CropType, GrowthStage, WeatherRiskBand

logger = logging.getLogger(__name__)


async def threshold_decision_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Evaluate pest/disease severity against action thresholds
    
    Args:
        state: Current workflow state
        
    Returns:
        Updated state with threshold decision
    """
    start_time = time.time()
    node_name = "threshold_decision"
    
    logger.info(
        f"🎯 Starting threshold decision analysis",
        extra={"trace_id": state.trace_id}
    )
    
    try:
        # Get required data
        predictions = state.vision_results
        severity = state.severity_assessment
        weather_context = state.weather_context
        crop_type = state.payload.crop if state.payload else CropType.unknown
        growth_stage = state.payload.stage if state.payload else GrowthStage.unknown
        
        # Handle case where no predictions are available
        if predictions is None:
            logger.warning("No vision results available for threshold decision analysis")
            predictions = []
        
        # Make threshold decisions for each detection
        threshold_decisions = []
        overall_action_needed = False
        
        for prediction in predictions:
            decision = _evaluate_threshold(
                prediction, severity, weather_context, crop_type, growth_stage
            )
            threshold_decisions.append(decision)
            
            if decision["action_required"]:
                overall_action_needed = True
        
        # Calculate overall urgency
        overall_urgency = _calculate_overall_urgency(
            threshold_decisions, severity, weather_context
        )
        
        # Generate summary
        decision_summary = _generate_decision_summary(
            threshold_decisions, overall_action_needed, overall_urgency
        )
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"✅ Threshold decision analysis completed",
            extra={
                "trace_id": state.trace_id,
                "action_required": overall_action_needed,
                "urgency": overall_urgency,
                "total_detections": len(predictions),
                "processing_time": processing_time
            }
        )
        
        return {
            "threshold_decisions": threshold_decisions,
            "action_required": overall_action_needed,
            "urgency_level": overall_urgency,
            "decision_summary": decision_summary,
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        error_msg = f"Threshold decision analysis failed: {str(e)}"
        logger.error(
            error_msg,
            extra={"trace_id": state.trace_id},
            exc_info=True
        )
        
        processing_time = time.time() - start_time
        
        # Default to requiring action when in doubt
        return {
            "threshold_decisions": [],
            "action_required": True,
            "urgency_level": "medium",
            "decision_summary": "Unable to assess thresholds - manual review recommended",
            "errors": state.errors + [error_msg],
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }


def _evaluate_threshold(prediction: PredictionResult, 
                       severity: SeverityScore,
                       weather_context: WeatherRisk,
                       crop_type: CropType,
                       growth_stage: GrowthStage) -> Dict[str, Any]:
    """
    Evaluate a single prediction against thresholds
    
    Args:
        prediction: Vision prediction result
        severity: Severity assessment
        weather_context: Weather risk assessment
        crop_type: Type of crop
        growth_stage: Growth stage
        
    Returns:
        Threshold decision for this prediction
    """
    # Get base thresholds for this pest/disease
    base_thresholds = _get_base_thresholds(prediction.class_name)
    
    # Adjust thresholds based on context
    adjusted_thresholds = _adjust_thresholds(
        base_thresholds, crop_type, growth_stage, weather_context
    )
    
    # Compare severity against thresholds
    severity_score = severity.overall_severity
    action_required = severity_score >= adjusted_thresholds["action_threshold"]
    urgent_action = severity_score >= adjusted_thresholds["urgent_threshold"]
    
    # Determine response level
    if urgent_action:
        response_level = "urgent"
    elif action_required:
        response_level = "monitor"
    else:
        response_level = "none"
    
    # Calculate confidence in decision
    confidence = _calculate_decision_confidence(
        prediction, severity, adjusted_thresholds
    )
    
    # Generate reasoning
    reasoning = _generate_threshold_reasoning(
        prediction, severity_score, adjusted_thresholds, 
        response_level, weather_context
    )
    
    return {
        "pest_disease": prediction.class_name,
        "detection_confidence": prediction.confidence,
        "severity_score": severity_score,
        "base_threshold": base_thresholds["action_threshold"],
        "adjusted_threshold": adjusted_thresholds["action_threshold"],
        "urgent_threshold": adjusted_thresholds["urgent_threshold"],
        "action_required": action_required,
        "urgent_action": urgent_action,
        "response_level": response_level,
        "decision_confidence": confidence,
        "reasoning": reasoning,
        "weather_factor": weather_context.risk_band.value if weather_context else "unknown"
    }


def _get_base_thresholds(pest_disease: str) -> Dict[str, float]:
    """
    Get base action thresholds for pest/disease
    
    Args:
        pest_disease: Name of pest or disease
        
    Returns:
        Dictionary with threshold values
    """
    # Base thresholds (0-100 scale)
    threshold_map = {
        # Common fungal diseases
        "powdery_mildew": {"action_threshold": 15.0, "urgent_threshold": 40.0},
        "downy_mildew": {"action_threshold": 10.0, "urgent_threshold": 25.0},
        "rust": {"action_threshold": 20.0, "urgent_threshold": 50.0},
        "blight": {"action_threshold": 8.0, "urgent_threshold": 20.0},
        "black_spot": {"action_threshold": 12.0, "urgent_threshold": 30.0},
        
        # Viral diseases
        "mosaic_virus": {"action_threshold": 5.0, "urgent_threshold": 15.0},
        "leaf_curl": {"action_threshold": 10.0, "urgent_threshold": 25.0},
        
        # Bacterial diseases
        "bacterial_spot": {"action_threshold": 8.0, "urgent_threshold": 20.0},
        "fire_blight": {"action_threshold": 5.0, "urgent_threshold": 12.0},
        
        # Insect pests
        "aphids": {"action_threshold": 25.0, "urgent_threshold": 60.0},
        "thrips": {"action_threshold": 20.0, "urgent_threshold": 50.0},
        "whitefly": {"action_threshold": 15.0, "urgent_threshold": 40.0},
        "spider_mites": {"action_threshold": 18.0, "urgent_threshold": 45.0},
        "caterpillars": {"action_threshold": 12.0, "urgent_threshold": 30.0},
        "beetles": {"action_threshold": 15.0, "urgent_threshold": 35.0},
        
        # Nutrient deficiencies
        "nitrogen_deficiency": {"action_threshold": 20.0, "urgent_threshold": 50.0},
        "phosphorus_deficiency": {"action_threshold": 25.0, "urgent_threshold": 55.0},
        "potassium_deficiency": {"action_threshold": 22.0, "urgent_threshold": 52.0},
        "iron_deficiency": {"action_threshold": 18.0, "urgent_threshold": 45.0},
        
        # Abiotic stress
        "water_stress": {"action_threshold": 30.0, "urgent_threshold": 70.0},
        "heat_stress": {"action_threshold": 25.0, "urgent_threshold": 60.0},
        "cold_damage": {"action_threshold": 15.0, "urgent_threshold": 40.0}
    }
    
    # Default thresholds for unknown issues
    default_thresholds = {"action_threshold": 15.0, "urgent_threshold": 35.0}
    
    return threshold_map.get(pest_disease.lower(), default_thresholds)


def _adjust_thresholds(base_thresholds: Dict[str, float],
                      crop_type: CropType,
                      growth_stage: GrowthStage,
                      weather_context: WeatherRisk) -> Dict[str, float]:
    """
    Adjust thresholds based on crop context and weather
    
    Args:
        base_thresholds: Base threshold values
        crop_type: Type of crop
        growth_stage: Growth stage
        weather_context: Weather risk assessment
        
    Returns:
        Adjusted threshold values
    """
    adjusted = base_thresholds.copy()
    
    # Growth stage adjustments
    stage_multipliers = {
        GrowthStage.seedling: 0.5,      # More sensitive when young
        GrowthStage.vegetative: 0.8,     # Moderately sensitive
        GrowthStage.flowering: 0.6,      # Very sensitive during flowering
        GrowthStage.fruiting: 0.7,       # Sensitive during fruit development
        GrowthStage.mature: 1.2,         # More tolerant when mature
        GrowthStage.unknown: 1.0         # No adjustment
    }
    
    stage_multiplier = stage_multipliers.get(growth_stage, 1.0)
    
    # Crop type adjustments
    crop_multipliers = {
        CropType.tomato: 0.9,           # Generally sensitive
        CropType.potato: 0.8,           # Sensitive to many issues
        CropType.corn: 1.1,             # More tolerant
        CropType.wheat: 1.0,            # Standard
        CropType.rice: 0.9,             # Sensitive in wet conditions
        CropType.soybean: 1.0,          # Standard
        CropType.cotton: 0.9,           # Sensitive to many pests
        CropType.unknown: 1.0           # No adjustment
    }
    
    crop_multiplier = crop_multipliers.get(crop_type, 1.0)
    
    # Weather risk adjustments
    weather_multipliers = {
        WeatherRiskBand.low: 1.2,       # Can tolerate more when weather is good
        WeatherRiskBand.medium: 1.0,    # Standard thresholds
        WeatherRiskBand.high: 0.7       # Lower thresholds when weather favors problems
    }
    
    weather_multiplier = weather_multipliers.get(
        weather_context.risk_band if weather_context else WeatherRiskBand.medium, 
        1.0
    )
    
    # Apply adjustments
    combined_multiplier = stage_multiplier * crop_multiplier * weather_multiplier
    
    adjusted["action_threshold"] *= combined_multiplier
    adjusted["urgent_threshold"] *= combined_multiplier
    
    # Ensure thresholds stay within reasonable bounds
    adjusted["action_threshold"] = max(2.0, min(80.0, adjusted["action_threshold"]))
    adjusted["urgent_threshold"] = max(5.0, min(95.0, adjusted["urgent_threshold"]))
    
    # Ensure urgent threshold is always higher than action threshold
    if adjusted["urgent_threshold"] <= adjusted["action_threshold"]:
        adjusted["urgent_threshold"] = adjusted["action_threshold"] + 10.0
    
    return adjusted


def _calculate_decision_confidence(prediction: PredictionResult,
                                 severity: SeverityScore,
                                 thresholds: Dict[str, float]) -> float:
    """
    Calculate confidence in the threshold decision
    
    Args:
        prediction: Vision prediction result
        severity: Severity assessment
        thresholds: Threshold values
        
    Returns:
        Confidence score (0-1)
    """
    # Start with prediction confidence
    base_confidence = prediction.confidence
    
    # Adjust based on how far severity is from threshold
    severity_score = severity.overall_severity
    action_threshold = thresholds["action_threshold"]
    
    distance_from_threshold = abs(severity_score - action_threshold)
    max_distance = 50.0  # Maximum meaningful distance
    
    # Higher confidence when further from threshold (clear decision)
    threshold_confidence = min(1.0, distance_from_threshold / max_distance)
    
    # Consider severity confidence
    severity_confidence = severity.confidence
    
    # Weighted average
    overall_confidence = (
        base_confidence * 0.4 + 
        threshold_confidence * 0.3 + 
        severity_confidence * 0.3
    )
    
    return round(overall_confidence, 3)


def _generate_threshold_reasoning(prediction: PredictionResult,
                                severity_score: float,
                                thresholds: Dict[str, float],
                                response_level: str,
                                weather_context: WeatherRisk) -> str:
    """
    Generate human-readable reasoning for threshold decision
    
    Args:
        prediction: Vision prediction result
        severity_score: Calculated severity score
        thresholds: Threshold values used
        response_level: Determined response level
        weather_context: Weather risk assessment
        
    Returns:
        Reasoning text
    """
    pest_disease = prediction.class_name.replace('_', ' ').title()
    action_threshold = thresholds["action_threshold"]
    urgent_threshold = thresholds["urgent_threshold"]
    
    reasoning_parts = [
        f"{pest_disease} detected with {prediction.confidence:.1%} confidence"
    ]
    
    # Severity assessment
    if severity_score >= urgent_threshold:
        reasoning_parts.append(
            f"Severity score ({severity_score:.1f}) exceeds urgent threshold ({urgent_threshold:.1f})"
        )
    elif severity_score >= action_threshold:
        reasoning_parts.append(
            f"Severity score ({severity_score:.1f}) exceeds action threshold ({action_threshold:.1f})"
        )
    else:
        reasoning_parts.append(
            f"Severity score ({severity_score:.1f}) below action threshold ({action_threshold:.1f})"
        )
    
    # Weather influence
    if weather_context:
        if weather_context.risk_band == WeatherRiskBand.high:
            reasoning_parts.append("High weather risk increases urgency")
        elif weather_context.risk_band == WeatherRiskBand.low:
            reasoning_parts.append("Low weather risk reduces urgency")
    
    # Response recommendation
    response_descriptions = {
        "urgent": "Immediate action required",
        "monitor": "Monitoring and intervention recommended", 
        "none": "Continue routine monitoring"
    }
    
    reasoning_parts.append(response_descriptions.get(response_level, "Assessment inconclusive"))
    
    return ". ".join(reasoning_parts) + "."


def _calculate_overall_urgency(threshold_decisions: list,
                             severity: SeverityScore,
                             weather_context: WeatherRisk) -> str:
    """
    Calculate overall urgency level across all detections
    
    Args:
        threshold_decisions: List of individual threshold decisions
        severity: Overall severity assessment
        weather_context: Weather risk assessment
        
    Returns:
        Overall urgency level
    """
    if not threshold_decisions:
        return "low"
    
    # Count urgent and action-required decisions
    urgent_count = sum(1 for d in threshold_decisions if d["urgent_action"])
    action_count = sum(1 for d in threshold_decisions if d["action_required"])
    
    # Base urgency on detections
    if urgent_count > 0:
        base_urgency = "high"
    elif action_count > 0:
        base_urgency = "medium"
    else:
        base_urgency = "low"
    
    # Weather risk adjustment
    if weather_context and weather_context.risk_band == WeatherRiskBand.high:
        if base_urgency == "medium":
            base_urgency = "high"
        elif base_urgency == "low":
            base_urgency = "medium"
    elif weather_context and weather_context.risk_band == WeatherRiskBand.low:
        if base_urgency == "high" and urgent_count == 0:
            base_urgency = "medium"
    
    # Overall severity adjustment
    if severity.overall_severity > 70:
        base_urgency = "high"
    elif severity.overall_severity > 40 and base_urgency == "low":
        base_urgency = "medium"
    
    return base_urgency


def _generate_decision_summary(threshold_decisions: list,
                             action_required: bool,
                             urgency: str) -> str:
    """
    Generate summary of threshold decisions
    
    Args:
        threshold_decisions: List of threshold decisions
        action_required: Whether any action is required
        urgency: Overall urgency level
        
    Returns:
        Decision summary text
    """
    if not threshold_decisions:
        return "No pest or disease detections to evaluate"
    
    total_detections = len(threshold_decisions)
    action_detections = sum(1 for d in threshold_decisions if d["action_required"])
    urgent_detections = sum(1 for d in threshold_decisions if d["urgent_action"])
    
    summary_parts = [
        f"Analyzed {total_detections} detection{'s' if total_detections != 1 else ''}"
    ]
    
    if urgent_detections > 0:
        summary_parts.append(
            f"{urgent_detections} require{'s' if urgent_detections == 1 else ''} urgent action"
        )
    
    if action_detections > urgent_detections:
        non_urgent_actions = action_detections - urgent_detections
        summary_parts.append(
            f"{non_urgent_actions} require{'s' if non_urgent_actions == 1 else ''} monitoring"
        )
    
    if not action_required:
        summary_parts.append("No immediate action required")
    
    summary_parts.append(f"Overall urgency: {urgency}")
    
    return ". ".join(summary_parts) + "."
