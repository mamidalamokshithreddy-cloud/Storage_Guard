"""
Enhanced Format Response Node - Final formatting with multi-LLM integration
"""

import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.schemas.postgres_base_models import (
    WorkflowState,
    AnalysisResponse,
    ResponseMetadata,
    Diagnosis,
    Severity,
    SeverityBand,
    WeatherRisk,
    WeatherRiskBand,
    WeatherRiskIndices,
    IPMRecommendations,
)
from app.core.config import ENABLE_LLM_ANALYSIS, ENABLE_CROSS_VALIDATION

logger = logging.getLogger(__name__)


async def format_response_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Format final response with all analysis results including multi-LLM insights
    
    Args:
        state: Current workflow state with CV and LLM results
        
    Returns:
        Final formatted response with integrated insights
    """
    start_time = time.time()
    node_name = "format_response"
    
    logger.info(
        f"📋 Starting enhanced response formatting",
        extra={
            "trace_id": state.trace_id,
            "llm_enabled": ENABLE_LLM_ANALYSIS,
            "has_llm_results": bool(state.llm_results.slm_analysis or state.llm_results.llm_analysis)
        }
    )
    
    try:
        # Gather pipeline outputs
        predictions = state.vision_results.get("individual_predictions", []) if state.vision_results else []
        aggregated = state.vision_results.get("aggregated_diagnosis") if state.vision_results else None
        diagnosis: Diagnosis = aggregated if isinstance(aggregated, Diagnosis) else Diagnosis(label="unknown", confidence=0.0, alternatives=[])
        severity: Optional[Severity] = state.severity_assessment
        weather_context = state.weather_context
        # Ensure recommendations object is typed correctly
        ipm_recommendations: IPMRecommendations = (
            state.ipm_recommendations if isinstance(state.ipm_recommendations, IPMRecommendations)
            else IPMRecommendations()
        )
        action_required = getattr(state, 'action_required', False)
        
        # Compute confidence fallback
        overall_confidence = (severity.confidence if severity else diagnosis.confidence) or 0.0
        
        # Build rationale
        rationale_parts: List[str] = []
        if aggregated and isinstance(aggregated, Diagnosis):
            rationale_parts.append(f"Primary finding: {aggregated.label}")
        if severity:
            rationale_parts.append(f"Severity: {severity.band.value} ({severity.score_0_100}/100)")
        if weather_context:
            rationale_parts.append(f"Weather risk: {weather_context.risk_band.value}")
        if action_required:
            rationale_parts.append("Action required based on thresholds")
        rationale = ". ".join(rationale_parts) + ("." if rationale_parts else "")
        
        # Metadata
        total_processing_time = sum(state.processing_times.values())
        metadata = ResponseMetadata(
            trace_id=state.trace_id,
            timestamp=datetime.utcnow(),
            processing_time=total_processing_time,
            model_versions=_get_enhanced_model_versions(state),
            workflow_version="2.0.0"
        )
        
        # Ensure weather_risk is set (provide a safe default if missing)
        weather_risk_value: WeatherRisk = weather_context if isinstance(weather_context, WeatherRisk) else WeatherRisk(
            indices=WeatherRiskIndices(),
            risk_band=WeatherRiskBand.low,
            factors=[]
        )

        # Create API response matching schema
        response = AnalysisResponse(
            diagnosis=diagnosis,
            severity=severity or Severity(score_0_100=0, band=SeverityBand.mild, factors=[], confidence=0.0),
            alert=action_required,
            weather_risk=weather_risk_value,
            recommendations=ipm_recommendations,
            rationale=rationale or "",
            trace_id=state.trace_id,
            confidence=float(overall_confidence),
            timings=None,
            created_at=datetime.utcnow(),
        )
        
        # Add LLM-specific information to enhanced response
        if ENABLE_LLM_ANALYSIS:
            enhanced_response_data = _create_enhanced_response_data(state, response)
            state.enhanced_response = enhanced_response_data
        
        processing_time = time.time() - start_time
        
        # Count total recommendations across categories
        rec_count = (
            len(ipm_recommendations.prevention)
            + len(ipm_recommendations.biological)
            + len(ipm_recommendations.chemical)
            + len(ipm_recommendations.cultural)
            + len(ipm_recommendations.monitoring)
        )

        # Determine consensus presence
        consensus_present = bool(getattr(state.llm_results, 'consensus_result', None))

        logger.info(
            f"✅ Enhanced response formatting completed",
            extra={
                "trace_id": state.trace_id,
                "detections_count": len(predictions),
                "recommendations_count": rec_count,
                "total_processing_time": total_processing_time,
                "formatting_time": processing_time,
                "llm_providers_used": len(state.active_llm_providers),
                "consensus_achieved": consensus_present
            }
        )
        
        return {
            "final_response": response,
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        error_msg = f"Response formatting failed: {str(e)}"
        logger.error(
            error_msg,
            extra={"trace_id": state.trace_id},
            exc_info=True
        )
        
        processing_time = time.time() - start_time
        
        # Create minimal error response matching schema
        error_response = AnalysisResponse(
            diagnosis=Diagnosis(label="unknown", confidence=0.0, alternatives=[]),
            severity=Severity(score_0_100=0, band=SeverityBand.mild, factors=[], confidence=0.0),
            alert=True,
            weather_risk=weather_context if 'weather_context' in locals() else None,  # may be None
            recommendations=IPMRecommendations(),
            rationale=f"Analysis failed: {error_msg}",
            trace_id=state.trace_id,
            confidence=0.0,
            timings=None,
            created_at=datetime.utcnow(),
        )
        
        return {
            "final_response": error_response,
            "errors": state.errors + [error_msg],
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }


def _get_model_versions() -> Dict[str, str]:
    """
    Get versions of models used in analysis
    
    Returns:
        Dictionary of model versions
    """
    # This would typically be populated from model metadata
    return {
        "pest_detection": "yolov8n-pest-v1.2",
        "disease_classification": "efficientnet-b0-disease-v1.1", 
        "severity_assessment": "regression-v1.0",
        "weather_integration": "v1.0"
    }


def _generate_executive_summary(predictions, severity, action_required: bool, urgency_level: str) -> str:
    """
    Generate executive summary of analysis
    
    Args:
        predictions: List of predictions
        severity: Severity assessment
        action_required: Whether action is required
        urgency_level: Urgency level
        
    Returns:
        Executive summary text
    """
    if not predictions:
        return "No pests, diseases, or issues detected in the analyzed images. Crops appear healthy."
    
    # Count detection types
    pest_count = sum(1 for p in predictions if _is_pest(p.class_name))
    disease_count = sum(1 for p in predictions if _is_disease(p.class_name))
    deficiency_count = sum(1 for p in predictions if _is_deficiency(p.class_name))
    
    summary_parts = []
    
    # Detection summary
    if disease_count > 0:
        summary_parts.append(f"{disease_count} disease{'s' if disease_count != 1 else ''} detected")
    if pest_count > 0:
        summary_parts.append(f"{pest_count} pest issue{'s' if pest_count != 1 else ''} identified")
    if deficiency_count > 0:
        summary_parts.append(f"{deficiency_count} nutritional deficienc{'ies' if deficiency_count != 1 else 'y'} found")
    
    detection_summary = ", ".join(summary_parts)
    
    # Severity summary
    severity_score = severity.overall_severity if severity else 0
    if severity_score > 70:
        severity_text = "high severity"
    elif severity_score > 40:
        severity_text = "moderate severity"
    else:
        severity_text = "low severity"
    
    # Action summary
    if action_required:
        if urgency_level == "high":
            action_text = "immediate intervention required"
        elif urgency_level == "medium":
            action_text = "management action recommended"
        else:
            action_text = "monitoring advised"
    else:
        action_text = "continued observation recommended"
    
    return f"{detection_summary} with {severity_text}. {action_text.capitalize()}."


def _generate_detailed_analysis(predictions, severity, weather_context, threshold_decisions) -> str:
    """
    Generate detailed analysis text
    
    Args:
        predictions: List of predictions
        severity: Severity assessment
        weather_context: Weather risk assessment
        threshold_decisions: List of threshold decisions
        
    Returns:
        Detailed analysis text
    """
    analysis_parts = []
    
    # Detection details
    if predictions:
        analysis_parts.append("DETECTIONS:")
        for pred in predictions:
            analysis_parts.append(
                f"- {pred.class_name.replace('_', ' ').title()}: "
                f"{pred.confidence:.1%} confidence"
            )
    
    # Severity details
    if severity:
        analysis_parts.append("\nSEVERITY ASSESSMENT:")
        analysis_parts.append(f"- Overall severity: {severity.overall_severity:.1f}/100")
        if severity.affected_area_percentage:
            analysis_parts.append(f"- Affected area: {severity.affected_area_percentage:.1f}%")
        analysis_parts.append(f"- Assessment confidence: {severity.confidence:.1%}")
    
    # Weather context
    if weather_context:
        analysis_parts.append("\nWEATHER CONTEXT:")
        analysis_parts.append(f"- Risk level: {weather_context.risk_band.value}")
        for factor in weather_context.factors[:3]:  # Top 3 factors
            analysis_parts.append(f"- {factor}")
    
    # Threshold analysis
    if threshold_decisions:
        analysis_parts.append("\nTHRESHOLD ANALYSIS:")
        for decision in threshold_decisions:
            status = "URGENT" if decision["urgent_action"] else "ACTION" if decision["action_required"] else "MONITOR"
            analysis_parts.append(
                f"- {decision['pest_disease'].replace('_', ' ').title()}: {status} "
                f"(severity {decision['severity_score']:.1f} vs threshold {decision['adjusted_threshold']:.1f})"
            )
    
    return "\n".join(analysis_parts) if analysis_parts else "No detailed analysis available."


def _format_confidence_scores(predictions, severity) -> Dict[str, float]:
    """
    Format confidence scores for response
    
    Args:
        predictions: List of predictions
        severity: Severity assessment
        
    Returns:
        Dictionary of confidence scores
    """
    scores = {}
    
    # Detection confidence (average of all detections)
    if predictions:
        scores["detection"] = sum(p.confidence for p in predictions) / len(predictions)
    else:
        scores["detection"] = 1.0  # High confidence in "no detection"
    
    # Severity confidence
    if severity:
        scores["severity_assessment"] = severity.confidence
    else:
        scores["severity_assessment"] = 0.0
    
    # Overall confidence (conservative approach)
    scores["overall"] = min(scores.values()) if scores else 0.0
    
    return scores


def _generate_next_steps(imp_recommendations, action_required: bool) -> list:
    """
    Generate next steps from IPM recommendations
    
    Args:
        imp_recommendations: List of IPM recommendations
        action_required: Whether action is required
        
    Returns:
        List of next steps
    """
    if not imp_recommendations:
        if action_required:
            return [
                "Conduct manual field inspection",
                "Consult with agricultural expert",
                "Monitor crop condition daily"
            ]
        else:
            return [
                "Continue routine monitoring",
                "Maintain current management practices",
                "Re-assess in 1-2 weeks"
            ]
    
    next_steps = []
    
    # Extract immediate actions from recommendations
    for recommendation in imp_recommendations[:3]:  # Top 3 recommendations
        for action in recommendation.actions[:2]:  # Top 2 actions per recommendation
            if action.timing in ["Immediate", "Within 24 hours", "Within 12 hours"]:
                step = f"{action.description}"
                if action.timing != "Immediate":
                    step += f" ({action.timing})"
                next_steps.append(step)
    
    # Add monitoring step
    next_steps.append("Monitor progress and document results")
    
    # Add follow-up step
    if action_required:
        next_steps.append("Re-evaluate effectiveness in 3-5 days")
    else:
        next_steps.append("Routine re-assessment in 1-2 weeks")
    
    return next_steps


def _extract_llm_insights(state: WorkflowState) -> Dict[str, Any]:
    """Extract and structure LLM insights from analysis results"""
    insights = {
        "slm_insights": {},
        "llm_consensus": {},
        "cross_validation": {},
        "provider_performance": {},
        "confidence_metrics": {}
    }
    
    # Extract SLM insights
    if state.llm_results.slm_analysis and state.llm_results.slm_analysis.success:
        slm = state.llm_results.slm_analysis
        insights["slm_insights"] = {
            "provider": slm.provider,
            "confidence": slm.confidence,
            "key_findings": slm.parsed_data.get("key_findings", []) if slm.parsed_data else [],
            "processing_time": slm.processing_time,
            "has_structured_data": slm.parsed_data is not None
        }
    
    # Extract LLM consensus data
    if state.llm_results.llm_analysis:
        successful_analyses = [a for a in state.llm_results.llm_analysis.values() if a.success]
        insights["llm_consensus"] = {
            "providers_used": [a.provider for a in successful_analyses],
            "average_confidence": sum(a.confidence for a in successful_analyses if a.confidence) / len(successful_analyses) if successful_analyses else 0,
            "agreement_score": state.llm_results.agreement_score,
            "parallel_processing_time": state.llm_results.parallel_processing_time
        }
        
        # Provider performance metrics
        for analysis in successful_analyses:
            insights["provider_performance"][analysis.provider] = {
                "confidence": analysis.confidence,
                "response_quality": analysis.metadata.get("provider_performance", {}).get("response_quality"),
                "token_usage": analysis.token_usage,
                "processing_time": analysis.processing_time
            }
    
    # Extract cross-validation insights
    if state.llm_results.cross_validation and state.llm_results.cross_validation.success:
        cv = state.llm_results.cross_validation
        insights["cross_validation"] = {
            "consensus_confidence": cv.confidence,
            "validation_summary": cv.parsed_data.get("validation_summary") if cv.parsed_data else {},
            "conflict_resolution": cv.parsed_data.get("conflict_resolution") if cv.parsed_data else {},
            "final_recommendations": cv.parsed_data.get("recommendations") if cv.parsed_data else {}
        }
    
    # Overall confidence metrics
    insights["confidence_metrics"] = {
        "overall_confidence": getattr(state, 'final_insights', {}).get('confidence_metrics', {}).get('overall_confidence'),
        "consensus_threshold_met": state.llm_results.agreement_score and state.llm_results.agreement_score >= state.consensus_threshold,
        "total_token_usage": state.llm_results.total_token_usage
    }
    
    return insights


def _get_enhanced_model_versions(state: WorkflowState) -> Dict[str, str]:
    """Get model versions including LLM models used"""
    versions = _get_model_versions()  # Get base CV model versions
    
    # Add LLM model information
    if state.llm_results.slm_analysis:
        versions["slm_model"] = state.llm_results.slm_analysis.model_name
    
    for provider, analysis in state.llm_results.llm_analysis.items():
        if analysis.success:
            versions[f"llm_{provider}"] = analysis.model_name
    
    if state.llm_results.cross_validation:
        versions["cross_validation_model"] = state.llm_results.cross_validation.model_name
    
    return versions


def _generate_enhanced_executive_summary(
    predictions: List[Any], 
    severity: Any, 
    action_required: bool, 
    urgency_level: str,
    llm_insights: Dict[str, Any],
    consensus_result: Optional[Dict[str, Any]]
) -> str:
    """Generate executive summary with LLM insights integration"""
    
    # Start with base summary
    base_summary = _generate_executive_summary(predictions, severity, action_required, urgency_level)
    
    # Enhance with LLM insights
    enhancements = []
    
    # Add consensus information
    if consensus_result and "final_diagnosis" in consensus_result:
        final_diag = consensus_result["final_diagnosis"]
        if final_diag.get("consensus_level") in ["high", "strong"]:
            enhancements.append(f"Multi-LLM consensus strongly supports the diagnosis")
        elif final_diag.get("consensus_level") == "moderate":
            enhancements.append(f"Multi-LLM analysis provides moderate consensus on diagnosis")
    
    # Add confidence enhancement
    if llm_insights.get("confidence_metrics", {}).get("consensus_threshold_met"):
        enhancements.append("High confidence achieved through cross-validation")
    
    # Add provider information
    providers_used = llm_insights.get("llm_consensus", {}).get("providers_used", [])
    if providers_used:
        enhancements.append(f"Analysis validated using {len(providers_used)} AI providers")
    
    if enhancements:
        return base_summary + " " + ". ".join(enhancements) + "."
    
    return base_summary


def _generate_enhanced_detailed_analysis(
    predictions: List[Any],
    severity: Any,
    weather_context: Any,
    threshold_decisions: List[Any],
    llm_insights: Dict[str, Any],
    consensus_result: Optional[Dict[str, Any]]
) -> str:
    """Generate detailed analysis with LLM integration"""
    
    # Start with base analysis
    base_analysis = _generate_detailed_analysis(predictions, severity, weather_context, threshold_decisions)
    
    # Add LLM analysis section
    llm_section = "\n\n**Multi-LLM Analysis:**\n"
    
    # Add SLM insights
    if llm_insights.get("slm_insights"):
        slm = llm_insights["slm_insights"]
        llm_section += f"• Quick analysis (SLM): {slm.get('provider', 'Unknown')} provider, "
        llm_section += f"confidence {slm.get('confidence', 0):.2f}\n"
    
    # Add LLM consensus
    if llm_insights.get("llm_consensus"):
        consensus = llm_insights["llm_consensus"]
        providers = consensus.get("providers_used", [])
        if providers:
            llm_section += f"• Comprehensive analysis: {len(providers)} providers "
            llm_section += f"({', '.join(providers)})\n"
            
        if consensus.get("agreement_score") is not None:
            llm_section += f"• Provider agreement score: {consensus['agreement_score']:.2f}\n"
    
    # Add cross-validation results
    if consensus_result:
        llm_section += "• Cross-validation: Completed with consensus building\n"
        
        if "confidence_assessment" in consensus_result:
            conf_assess = consensus_result["confidence_assessment"]
            overall_conf = conf_assess.get("overall_confidence")
            if overall_conf:
                llm_section += f"• Final confidence assessment: {overall_conf:.2f}\n"
    
    # Add token usage summary
    if llm_insights.get("confidence_metrics", {}).get("total_token_usage"):
        token_usage = llm_insights["confidence_metrics"]["total_token_usage"]
        total_tokens = token_usage.get("total_tokens", 0)
        if total_tokens > 0:
            llm_section += f"• Analysis computational cost: {total_tokens:,} tokens\n"
    
    return base_analysis + llm_section


def _format_enhanced_confidence_scores(
    predictions: List[Any],
    severity: Any,
    llm_results: Any
) -> Dict[str, float]:
    """Format confidence scores including LLM analysis"""
    
    # Start with base confidence scores
    scores = _format_confidence_scores(predictions, severity)
    
    # Add SLM confidence
    if llm_results.slm_analysis and llm_results.slm_analysis.confidence:
        scores["slm_analysis"] = llm_results.slm_analysis.confidence
    
    # Add LLM provider confidences
    if llm_results.llm_analysis:
        llm_confidences = []
        for provider, analysis in llm_results.llm_analysis.items():
            if analysis.success and analysis.confidence:
                scores[f"llm_{provider}"] = analysis.confidence
                llm_confidences.append(analysis.confidence)
        
        if llm_confidences:
            scores["llm_average"] = sum(llm_confidences) / len(llm_confidences)
    
    # Add cross-validation confidence
    if llm_results.cross_validation and llm_results.cross_validation.confidence:
        scores["cross_validation"] = llm_results.cross_validation.confidence
    
    # Add consensus metrics
    if llm_results.agreement_score is not None:
        scores["provider_agreement"] = llm_results.agreement_score
    
    # Recalculate overall confidence with LLM factors
    if "llm_average" in scores and "cross_validation" in scores:
        # Weight: CV=40%, LLM=40%, Cross-validation=20%
        weights = {"overall": 0.4, "llm_average": 0.4, "cross_validation": 0.2}
        weighted_scores = [scores.get(key, 0.5) * weight for key, weight in weights.items() if key in scores]
        if weighted_scores:
            scores["overall"] = sum(weighted_scores) / sum(weights.values())
    
    return scores


def _generate_enhanced_next_steps(
    ipm_recommendations: List[Any],
    action_required: bool,
    llm_insights: Dict[str, Any],
    consensus_result: Optional[Dict[str, Any]]
) -> List[str]:
    """Generate next steps with LLM recommendations integration"""
    
    # Start with base next steps
    next_steps = _generate_next_steps(ipm_recommendations, action_required)
    
    # Add LLM-derived next steps
    llm_steps = []
    
    # Add consensus recommendations
    if consensus_result and "final_recommendations" in consensus_result:
        final_recs = consensus_result["final_recommendations"]
        
        # Add immediate actions from consensus
        immediate_actions = final_recs.get("immediate_actions", [])
        for action in immediate_actions[:2]:  # Top 2 immediate actions
            if action not in next_steps:
                llm_steps.append(f"LLM Consensus: {action}")
        
        # Add monitoring plan
        monitoring_plan = final_recs.get("monitoring_plan", [])
        if monitoring_plan:
            llm_steps.append(f"Enhanced monitoring: {monitoring_plan[0]}")
    
    # Add confidence-based recommendations
    confidence_metrics = llm_insights.get("confidence_metrics", {})
    if not confidence_metrics.get("consensus_threshold_met"):
        llm_steps.append("Consider additional expert consultation due to analysis uncertainty")
    
    # Combine and return
    combined_steps = next_steps + llm_steps
    return combined_steps[:8]  # Limit to 8 steps max


def _create_enhanced_response_data(state: WorkflowState, response: AnalysisResponse) -> Dict[str, Any]:
    """Create enhanced response data with full LLM analysis details"""
    data = {
        "standard_response": response.dict(),
        "llm_analysis_details": {
            "slm_analysis": state.llm_results.slm_analysis.dict() if state.llm_results.slm_analysis else None,
            "llm_analyses": {
                provider: analysis.dict() 
                for provider, analysis in state.llm_results.llm_analysis.items()
            },
            "cross_validation": state.llm_results.cross_validation.dict() if state.llm_results.cross_validation else None,
            "consensus_result": state.llm_results.consensus_result,
            "agreement_metrics": {
                "agreement_score": state.llm_results.agreement_score,
                "confidence_scores": state.llm_results.confidence_scores,
                "parallel_processing_time": state.llm_results.parallel_processing_time,
                "total_token_usage": state.llm_results.total_token_usage
            }
        },
        "workflow_metadata": {
            "active_providers": state.active_llm_providers,
            "node_execution_order": state.node_execution_order,
            "processing_times": state.processing_times,
            "final_insights": getattr(state, 'final_insights', {}),
            "errors": state.errors
        },
        "enhanced_capabilities": {
            "multi_llm_analysis": True,
            "cross_validation": state.llm_results.cross_validation is not None,
            "consensus_building": state.llm_results.consensus_result is not None,
            "provider_fallbacks": len(state.active_llm_providers) > 1
        }
    }
    return data


def _is_pest(class_name: str) -> bool:
    """Check if detection is a pest"""
    pest_keywords = ["aphid", "thrip", "mite", "caterpillar", "beetle", "bug", "fly", "moth"]
    return any(keyword in class_name.lower() for keyword in pest_keywords)


def _is_disease(class_name: str) -> bool:
    """Check if detection is a disease"""
    disease_keywords = ["mildew", "rust", "blight", "spot", "rot", "virus", "mosaic", "curl", "canker"]
    return any(keyword in class_name.lower() for keyword in disease_keywords)


def _is_deficiency(class_name: str) -> bool:
    """Check if detection is a nutrient deficiency"""
    deficiency_keywords = ["deficiency", "nitrogen", "phosphorus", "potassium", "iron", "nutrient"]
    return any(keyword in class_name.lower() for keyword in deficiency_keywords)
