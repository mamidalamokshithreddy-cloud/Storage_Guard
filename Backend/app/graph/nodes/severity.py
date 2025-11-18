"""
Severity Assessment Node - Convert predictions to 0-100 severity score with calibration
"""

import logging
import time
from typing import Dict, Any, List
from app.schemas.postgres_base_models import WorkflowState, Severity, SeverityBand

logger = logging.getLogger(__name__)


async def severity_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Assess severity based on vision predictions and calibration
    
    Args:
        state: Current workflow state
        
    Returns:
        Updated state with severity assessment
    """
    start_time = time.time()
    node_name = "severity"
    
    logger.info(
        f"📊 Starting severity assessment",
        extra={"trace_id": state.trace_id}
    )
    
    try:
        if not state.vision_results:
            error_msg = "No vision results available for severity assessment"
            logger.error(error_msg, extra={"trace_id": state.trace_id})
            return {
                "errors": state.errors + [error_msg],
                "processing_times": {
                    **state.processing_times,
                    node_name: time.time() - start_time
                }
            }
        
        diagnosis = state.vision_results.get("aggregated_diagnosis")
        if not diagnosis:
            error_msg = "No diagnosis available for severity assessment"
            logger.error(error_msg, extra={"trace_id": state.trace_id})
            return {
                **state.dict(),
                "errors": state.errors + [error_msg],
                "processing_times": {
                    **state.processing_times,
                    node_name: time.time() - start_time
                }
            }
        
        # Calculate base severity score
        base_score = _calculate_base_severity(diagnosis, state.trace_id)
        
        # Apply crop and growth stage modifiers
        crop_modifier = _get_crop_modifier(state.payload.crop if state.payload else None)
        stage_modifier = _get_growth_stage_modifier(state.payload.stage if state.payload else None)
        
        # Apply detection-based modifiers
        detection_modifier = _get_detection_modifier(state.vision_results.get("detection_results"))
        
        # Calculate final severity score
        final_score = _apply_modifiers(base_score, crop_modifier, stage_modifier, detection_modifier)
        
        # Determine severity band
        severity_band = _determine_severity_band(final_score)
        
        # Identify contributing factors
        factors = _identify_severity_factors(
            diagnosis, 
            state.vision_results,
            crop_modifier,
            stage_modifier, 
            detection_modifier
        )
        
        # Calculate confidence in severity assessment
        severity_confidence = _calculate_severity_confidence(
            diagnosis.confidence,
            state.vision_results.get("individual_predictions", [])
        )
        
        severity_assessment = Severity(
            score_0_100=final_score,
            band=severity_band,
            factors=factors,
            confidence=severity_confidence
        )
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"✅ Severity assessment completed",
            extra={
                "trace_id": state.trace_id,
                "severity_score": final_score,
                "severity_band": severity_band.value,
                "confidence": severity_confidence,
                "processing_time": processing_time
            }
        )
        
        return {
            "severity_assessment": severity_assessment,
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        error_msg = f"Severity assessment node failed: {str(e)}"
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


def _calculate_base_severity(diagnosis, trace_id: str) -> int:
    """
    Calculate base severity score from diagnosis
    
    Args:
        diagnosis: Diagnosis object
        trace_id: Workflow trace ID
        
    Returns:
        Base severity score (0-100)
    """
    try:
        label = diagnosis.label.lower()
        confidence = diagnosis.confidence
        
        # Healthy conditions
        if label == "healthy" or "healthy" in label:
            return max(0, int(10 * (1 - confidence)))  # Low severity for healthy plants
        
        # Disease severity mapping
        disease_severity_map = {
            "bacterial_blight": 70,
            "fungal_disease": 65,
            "late_blight": 85,
            "early_blight": 60,
            "powdery_mildew": 50,
            "downy_mildew": 65,
            "rust": 55,
            "leaf_spot": 45,
            "anthracnose": 60,
            "wilt": 80,
            "root_rot": 85,
            "virus": 75,
            "viral_disease": 75,
            "mosaic": 65,
            "curl": 50,
            "yellowing": 40,
            "nutrient_deficiency": 35,
            "nitrogen_deficiency": 30,
            "phosphorus_deficiency": 35,
            "potassium_deficiency": 40,
            "pest_damage": 60,
            "insect_damage": 55,
            "aphid": 45,
            "thrips": 50,
            "whitefly": 55,
            "caterpillar": 65,
            "beetle": 60,
            "mite": 40,
            "nematode": 70,
            "other_stress": 45,
            "unknown": 30
        }
        
        # Find matching severity
        base_severity = 50  # Default for unknown conditions
        
        for condition, severity in disease_severity_map.items():
            if condition in label:
                base_severity = severity
                break
        
        # Apply confidence scaling
        # High confidence = full severity, low confidence = reduced severity
        confidence_scaled_severity = int(base_severity * confidence)
        
        # Apply affected area modifier if available
        if diagnosis.affected_area_percent:
            area_modifier = min(1.5, 1.0 + (diagnosis.affected_area_percent / 200))  # Up to 1.5x for high coverage
            confidence_scaled_severity = int(confidence_scaled_severity * area_modifier)
        
        # Ensure valid range
        final_score = max(0, min(100, confidence_scaled_severity))
        
        logger.debug(
            f"📊 Base severity calculated: {label} → {final_score}",
            extra={"trace_id": trace_id}
        )
        
        return final_score
        
    except Exception as e:
        logger.warning(f"Base severity calculation failed: {e}")
        return 50  # Default moderate severity


def _get_crop_modifier(crop_type) -> float:
    """
    Get crop-specific severity modifier
    
    Args:
        crop_type: Crop type enum
        
    Returns:
        Modifier factor (0.8-1.2)
    """
    if not crop_type:
        return 1.0
    
    # Some crops are more susceptible to certain conditions
    crop_modifiers = {
        "tomato": 1.1,      # Generally susceptible
        "potato": 1.15,     # Highly susceptible to blights
        "rice": 1.0,        # Standard
        "wheat": 0.95,      # Generally hardy
        "corn": 0.9,        # Relatively resistant
        "cotton": 1.05,     # Moderate susceptibility
        "soybean": 1.0,     # Standard
        "cabbage": 1.1,     # Susceptible to many pests
        "pepper": 1.05,     # Moderate
        "cucumber": 1.1,    # Susceptible
        "bean": 1.0,        # Standard
        "onion": 0.9        # Generally resistant
    }
    
    crop_name = crop_type.value if hasattr(crop_type, 'value') else str(crop_type).lower()
    return crop_modifiers.get(crop_name, 1.0)


def _get_growth_stage_modifier(growth_stage) -> float:
    """
    Get growth stage-specific severity modifier
    
    Args:
        growth_stage: Growth stage enum
        
    Returns:
        Modifier factor (0.8-1.3)
    """
    if not growth_stage:
        return 1.0
    
    # Vulnerability varies by growth stage
    stage_modifiers = {
        "seedling": 1.3,    # Most vulnerable
        "vegetative": 1.0,  # Standard
        "flowering": 1.2,   # Critical stage, high impact
        "fruiting": 1.15,   # Important for yield
        "maturity": 0.9,    # Less impact on final yield
        "harvest": 0.8      # Minimal impact
    }
    
    stage_name = growth_stage.value if hasattr(growth_stage, 'value') else str(growth_stage).lower()
    return stage_modifiers.get(stage_name, 1.0)


def _get_detection_modifier(detection_results) -> float:
    """
    Get modifier based on detection results
    
    Args:
        detection_results: Detection results dictionary
        
    Returns:
        Modifier factor (0.9-1.2)
    """
    if not detection_results:
        return 1.0
    
    total_detections = detection_results.get("total_detections", 0)
    
    if total_detections == 0:
        return 0.9  # Lower severity if no specific detections
    elif total_detections <= 2:
        return 1.0  # Standard
    elif total_detections <= 5:
        return 1.1  # Moderate increase
    else:
        return 1.2  # High severity for many detections


def _apply_modifiers(base_score: int, crop_mod: float, stage_mod: float, detection_mod: float) -> int:
    """
    Apply all modifiers to base severity score
    
    Args:
        base_score: Base severity score
        crop_mod: Crop modifier
        stage_mod: Growth stage modifier
        detection_mod: Detection modifier
        
    Returns:
        Final severity score
    """
    # Combine modifiers
    combined_modifier = crop_mod * stage_mod * detection_mod
    
    # Apply to base score
    modified_score = int(base_score * combined_modifier)
    
    # Ensure valid range
    return max(0, min(100, modified_score))


def _determine_severity_band(score: int) -> SeverityBand:
    """
    Determine severity band from score
    
    Args:
        score: Severity score (0-100)
        
    Returns:
        Severity band enum
    """
    if score <= 30:
        return SeverityBand.mild
    elif score <= 60:
        return SeverityBand.moderate
    else:
        return SeverityBand.severe


def _identify_severity_factors(diagnosis, vision_results, crop_mod, stage_mod, detection_mod) -> List[str]:
    """
    Identify factors contributing to severity assessment
    
    Args:
        diagnosis: Diagnosis object
        vision_results: Vision results dictionary
        crop_mod: Crop modifier
        stage_mod: Growth stage modifier
        detection_mod: Detection modifier
        
    Returns:
        List of contributing factors
    """
    factors = []
    
    # Primary condition
    if diagnosis.label != "healthy":
        factors.append(f"Primary condition: {diagnosis.label}")
    
    # Confidence level
    if diagnosis.confidence < 0.7:
        factors.append("Uncertain diagnosis reduces severity")
    elif diagnosis.confidence > 0.9:
        factors.append("High confidence increases severity")
    
    # Affected area
    if diagnosis.affected_area_percent:
        if diagnosis.affected_area_percent > 50:
            factors.append(f"Large affected area ({diagnosis.affected_area_percent:.0f}%)")
        elif diagnosis.affected_area_percent > 25:
            factors.append(f"Moderate affected area ({diagnosis.affected_area_percent:.0f}%)")
    
    # Crop susceptibility
    if crop_mod > 1.05:
        factors.append("Crop type highly susceptible")
    elif crop_mod < 0.95:
        factors.append("Crop type naturally resistant")
    
    # Growth stage vulnerability
    if stage_mod > 1.1:
        factors.append("Critical growth stage increases impact")
    elif stage_mod < 0.95:
        factors.append("Growth stage reduces impact")
    
    # Detection results
    detection_results = vision_results.get("detection_results")
    if detection_results:
        total_detections = detection_results.get("total_detections", 0)
        if total_detections > 3:
            factors.append(f"Multiple detection sites ({total_detections})")
    
    # Multiple alternatives
    if len(diagnosis.alternatives) > 2:
        factors.append("Multiple potential conditions detected")
    
    return factors


def _calculate_severity_confidence(diagnosis_confidence: float, predictions: List) -> float:
    """
    Calculate confidence in severity assessment
    
    Args:
        diagnosis_confidence: Primary diagnosis confidence
        predictions: List of individual predictions
        
    Returns:
        Severity confidence (0-1)
    """
    # Base confidence from diagnosis
    base_confidence = diagnosis_confidence
    
    # Adjust based on prediction consistency
    if predictions:
        # Check consistency across images
        labels = [pred["label"] for pred in predictions]
        unique_labels = set(labels)
        consistency = 1.0 - (len(unique_labels) - 1) * 0.1  # Reduce for inconsistency
        consistency = max(0.5, consistency)
        
        # Combine with base confidence
        final_confidence = (base_confidence + consistency) / 2
    else:
        final_confidence = base_confidence
    
    return max(0.0, min(1.0, final_confidence))
