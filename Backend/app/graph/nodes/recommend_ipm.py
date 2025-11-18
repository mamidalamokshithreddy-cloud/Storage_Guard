"""
IPM Recommendation Node - Generate I        # Generate recommendations for each de            ext        return {
                        "imp_recommendations": imp_recommendations_obj,   return {
            **state.dict(),
            "imp_recommendations": ipm_recommendations_obj,           "imp_recommendations": imp_recommendations_obj,   return {
            **state.dict(),
            "imp_recommendations": ipm_recommendations_obj,   **state.dict(),
            "imp_recommendations": IPMRecommendations(
                prevention=[],
                biological=[],
                chemical=[],
                cultural=[str(rec) for rec in prioritized_recommendations],
                monitoring=[],
                requires_approval=False
            ),
            "recommendation_summary": recommendation_summary,
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }             "trace_id": state.trace_id,
                "total_recommendations": len(prioritized_recommendations),
                "action_recommendations": len(ipm_recommendations),
                "preventive_recommendations": len(preventive_recommendations),
                "processing_time": processing_time
            } requiring action
        ipm_recommendations = []
        
        for decision in threshold_decisions:
            if decision["action_required"]:
                recommendation = _generate_ipm_recommendation(
                    decision, weather_context, crop_type, growth_stage, state.llm_results
                )
                ipm_recommendations.append(recommendation)
        
        # Generate preventive recommendations
        preventive_recommendations = _generate_preventive_recommendations(
            threshold_decisions, weather_context, crop_type, growth_stage, state.llm_results
        )
        
        # Combine and prioritize all recommendations
        all_recommendations = ipm_recommendations + preventive_recommendationsnagement recommendations
"""

import logging
import time
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.schemas.postgres_base_models import (
    WorkflowState,
    IPMRecommendation,
    IPMRecommendations,
    IPMAction,
    IPMActionType,
    IPMUrgency,
    PreventionMeasure,
)

logger = logging.getLogger(__name__)


async def recommend_ipm_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Generate IPM recommendations based on detections and thresholds
    
    Args:
        state: Current workflow state
        
    Returns:
        Updated state with IPM recommendations
    """
    start_time = time.time()
    node_name = "recommend_ipm"
    
    logger.info(
        f"🌱 Starting IPM recommendation generation",
        extra={"trace_id": state.trace_id}
    )
    
    try:
        # Get decision context
        threshold_decisions = getattr(state, 'threshold_decisions', [])
        action_required = getattr(state, 'action_required', False)
        urgency_level = getattr(state, 'urgency_level', 'medium')
        weather_context = state.weather_context
        crop_type = state.payload.crop if state.payload else None
        growth_stage = state.payload.stage if state.payload else None
        
        # Generate recommendations for each detection requiring action
        ipm_recommendations = []
        
        for decision in threshold_decisions:
            if decision["action_required"]:
                recommendation = _generate_ipm_recommendation(
                    decision, weather_context, crop_type, growth_stage
                )
                ipm_recommendations.append(recommendation)
        
        # Generate preventive recommendations
        preventive_recommendations = _generate_preventive_recommendations(
            threshold_decisions, weather_context, crop_type, growth_stage
        )
        
        # Combine and prioritize all recommendations
        all_recommendations = ipm_recommendations + preventive_recommendations
        prioritized_recommendations = _prioritize_recommendations(
            all_recommendations, urgency_level
        )
        
        # Generate summary
        recommendation_summary = _generate_recommendation_summary(
            prioritized_recommendations, action_required, urgency_level
        )
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"✅ IPM recommendations generated",
            extra={
                "trace_id": state.trace_id,
                "total_recommendations": len(prioritized_recommendations),
                "action_recommendations": len(ipm_recommendations),
                "preventive_recommendations": len(preventive_recommendations),
                "processing_time": processing_time
            }
        )
        
        # Convert list of recommendations to proper IPMRecommendations structure
        # Map IPMRecommendation objects into the proper IPMRecommendations buckets
        prevention_list: List[PreventionMeasure] = []
        biological_list = []  # Intentionally left empty until structured data is available
        chemical_list = []    # Intentionally left empty until structured data is available
        cultural_list: List[str] = []
        monitoring_list: List[str] = []

        def _urgency_to_priority(urgency: IPMUrgency) -> int:
            return {IPMUrgency.high: 1, IPMUrgency.medium: 2, IPMUrgency.low: 3}.get(urgency, 3)

        for rec in prioritized_recommendations:
            if rec.action_type == IPMActionType.prevention:
                # Map preventive recommendations into PreventionMeasure entries
                if rec.actions:
                    for act in rec.actions[:5]:  # cap to 5 to keep it concise
                        prevention_list.append(
                            PreventionMeasure(
                                measure=act.description,
                                description=f"{act.category} · {rec.description}",
                                priority=_urgency_to_priority(rec.urgency)
                            )
                        )
                else:
                    # Fallback when no structured actions exist
                    prevention_list.append(
                        PreventionMeasure(
                            measure=rec.description,
                            description=rec.rationale,
                            priority=_urgency_to_priority(rec.urgency)
                        )
                    )
            elif rec.action_type == IPMActionType.cultural:
                cultural_list.append(rec.description)
            elif rec.action_type == IPMActionType.monitoring:
                monitoring_list.append(rec.description)

        # Also collect cultural/monitoring from action categories across all recommendations
        for rec in prioritized_recommendations:
            if rec.actions:
                for act in rec.actions:
                    cat = (act.category or "").lower()
                    if "cultural" in cat:
                        if act.description not in cultural_list:
                            cultural_list.append(act.description)
                    if "monitor" in cat:
                        if act.description not in monitoring_list:
                            monitoring_list.append(act.description)

        # Determine approval flags
        has_chemical = any(
            (rec.action_type == IPMActionType.chemical) or any((a.category or "").lower().startswith("chemical") for a in (rec.actions or []))
            for rec in prioritized_recommendations
        )
        needs_approval = has_chemical or any(rec.urgency == IPMUrgency.high for rec in prioritized_recommendations)
        approval_reason = None
        if needs_approval:
            if has_chemical:
                approval_reason = "Chemical control included; verify label and PHI."
            elif any(rec.urgency == IPMUrgency.high for rec in prioritized_recommendations):
                approval_reason = "High urgency actions recommended; confirm feasibility."

        ipm_recommendations_obj = IPMRecommendations(
            prevention=prevention_list,
            biological=biological_list,
            chemical=chemical_list,
            cultural=cultural_list,
            monitoring=monitoring_list,
            requires_approval=needs_approval,
            approval_reason=approval_reason
        )
        
        return {
            "ipm_recommendations": ipm_recommendations_obj,
            "recommendation_summary": recommendation_summary,
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        error_msg = f"IPM recommendation generation failed: {str(e)}"
        logger.error(
            error_msg,
            extra={"trace_id": state.trace_id},
            exc_info=True
        )
        
        processing_time = time.time() - start_time
        
        # Provide basic fallback recommendations using the typed IPMRecommendations model
        fallback_ipm = IPMRecommendations(
            prevention=[],
            biological=[],
            chemical=[],
            cultural=[
                "Conduct thorough field inspection",
                "Consult local agronomy expert"
            ],
            monitoring=[
                "Increase monitoring frequency for 48 hours"
            ],
            requires_approval=False
        )

        return {
            "ipm_recommendations": fallback_ipm,
            "recommendation_summary": "Analysis failed - manual assessment recommended",
            "errors": state.errors + [error_msg],
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }


def _generate_ipm_recommendation(decision: Dict[str, Any],
                               weather_context,
                               crop_type,
                               growth_stage,
                               llm_results) -> IPMRecommendation:
    """
    Generate IPM recommendation for a specific pest/disease detection
    
    Args:
        decision: Threshold decision for this detection
        weather_context: Weather risk assessment
        crop_type: Type of crop
        growth_stage: Growth stage
        
    Returns:
        IPM recommendation
    """
    pest_disease = decision["pest_disease"]
    response_level = decision["response_level"]
    severity_score = decision["severity_score"]
    
    # Determine urgency
    if decision["urgent_action"]:
        urgency = IPMUrgency.high
    elif decision["action_required"]:
        urgency = IPMUrgency.medium
    else:
        urgency = IPMUrgency.low
    
    # Get actions for this pest/disease from LLM/SLM outputs (no hardcoded DB)
    adjusted_actions = _get_base_ipm_actions(pest_disease, llm_results)
    
    # Determine primary action type
    action_type = _determine_primary_action_type(adjusted_actions, urgency)
    
    # Generate description
    description = _generate_ipm_description(
        pest_disease, severity_score, response_level, urgency
    )
    
    # Generate rationale
    rationale = _generate_ipm_rationale(
        decision, weather_context, crop_type, growth_stage
    )
    
    return IPMRecommendation(
        target_issue=pest_disease.replace('_', ' ').title(),
        action_type=action_type,
        urgency=urgency,
        description=description,
    actions=adjusted_actions,
        rationale=rationale
    )


def _get_base_ipm_actions(pest_disease: str, llm_results) -> List[IPMAction]:
    """Extract IPM actions for a specific pest/disease solely from LLM/SLM parsed data."""
    actions: List[IPMAction] = []

    def _mk_action(item) -> IPMAction | None:
        if isinstance(item, str):
            txt = item.strip()
            if not txt:
                return None
            # Minimal heuristic for category; prefer to keep LLM-provided category if available
            category = "Monitoring" if any(k in txt.lower() for k in ["monitor", "inspect", "scout"]) else "Cultural Control"
            return IPMAction(category=category, description=txt, timing="Ongoing", frequency="As needed")
        if isinstance(item, dict):
            desc = item.get("description") or item.get("action") or item.get("measure")
            if not desc:
                return None
            category = item.get("category") or "Cultural Control"
            timing = item.get("timing") or "Ongoing"
            frequency = item.get("frequency") or "As needed"
            return IPMAction(category=category, description=desc, timing=timing, frequency=frequency)
        return None

    def _collect_from_dict(d: dict):
        # Try structures like recommendations[{target_issue, actions}] or mapping by issue name
        by_issue = d.get("recommendations") or d.get("issues") or d
        # Case 1: mapping by issue name
        if isinstance(by_issue, dict):
            # Match pest_disease case-insensitively
            for key, val in by_issue.items():
                if isinstance(key, str) and pest_disease.lower() in key.lower():
                    if isinstance(val, dict):
                        for k in ["actions", "treatments", "measures", "steps"]:
                            lst = val.get(k)
                            if isinstance(lst, list):
                                for item in lst:
                                    act = _mk_action(item)
                                    if act:
                                        actions.append(act)
                    elif isinstance(val, list):
                        for item in val:
                            act = _mk_action(item)
                            if act:
                                actions.append(act)
        # Case 2: list of recommendations with target_issue
        if isinstance(by_issue, list):
            for rec in by_issue:
                if isinstance(rec, dict):
                    ti = rec.get("target_issue") or rec.get("issue") or rec.get("label")
                    if isinstance(ti, str) and pest_disease.lower() in ti.lower():
                        lst = rec.get("actions") or rec.get("measures") or rec.get("steps")
                        if isinstance(lst, list):
                            for item in lst:
                                act = _mk_action(item)
                                if act:
                                    actions.append(act)

    if not llm_results:
        return actions

    # 1) Prefer cross-validation structured output
    if getattr(llm_results, "cross_validation", None) and llm_results.cross_validation.parsed_data:
        pd = llm_results.cross_validation.parsed_data
        if isinstance(pd, dict):
            recs = pd.get("recommendations") if isinstance(pd.get("recommendations"), (dict, list)) else pd
            if isinstance(recs, (dict, list)):
                _collect_from_dict(recs)

    # 2) Fall back to provider analyses
    if not actions and getattr(llm_results, "llm_analysis", None):
        for analysis in llm_results.llm_analysis.values():
            if analysis and analysis.parsed_data and isinstance(analysis.parsed_data, dict):
                _collect_from_dict(analysis.parsed_data)
            if actions:
                break

    # 3) Fall back to SLM analysis
    if not actions and getattr(llm_results, "slm_analysis", None):
        sa = llm_results.slm_analysis
        if sa and sa.parsed_data and isinstance(sa.parsed_data, dict):
            _collect_from_dict(sa.parsed_data)

    return actions


def _adjust_ipm_actions(base_actions: List[IPMAction],
                       severity_score: float,
                       weather_context,
                       crop_type,
                       growth_stage,
                       urgency: IPMUrgency) -> List[IPMAction]:
    """
    Adjust IPM actions based on context
    
    Args:
        base_actions: Base list of IPM actions
        severity_score: Severity assessment score
        weather_context: Weather risk assessment
        crop_type: Type of crop
        growth_stage: Growth stage
        urgency: Urgency level
        
    Returns:
        Adjusted list of IPM actions
    """
    adjusted_actions = []
    
    for action in base_actions:
        adjusted_action = IPMAction(
            category=action.category,
            description=action.description,
            timing=action.timing,
            frequency=action.frequency
        )
        
        # Adjust timing based on urgency and severity
        if urgency == IPMUrgency.high or severity_score > 70:
            adjusted_action.timing = _accelerate_timing(action.timing)
        
        # Adjust frequency based on weather risk
        if weather_context and weather_context.risk_band.value == "high":
            adjusted_action.frequency = _increase_frequency(action.frequency)
        
        # Add growth stage specific adjustments
        if growth_stage:
            adjusted_action = _adjust_for_growth_stage(adjusted_action, growth_stage)
        
        adjusted_actions.append(adjusted_action)
    
    return adjusted_actions


def _accelerate_timing(original_timing: str) -> str:
    """Accelerate timing for urgent situations"""
    timing_map = {
        "Within 1 week": "Within 24 hours",
        "Within 48 hours": "Within 12 hours", 
        "Within 24 hours": "Immediate",
        "Next planting cycle": "Within 1 week"
    }
    return timing_map.get(original_timing, original_timing)


def _increase_frequency(original_frequency: str) -> str:
    """Increase frequency for high risk conditions"""
    frequency_map = {
        "Weekly": "Every 3-5 days",
        "Every 7-10 days": "Every 5-7 days",
        "Every 7-14 days": "Every 5-10 days",
        "Monthly": "Every 2-3 weeks"
    }
    return frequency_map.get(original_frequency, original_frequency)


def _adjust_for_growth_stage(action: IPMAction, growth_stage) -> IPMAction:
    """Adjust action based on crop growth stage"""
    # More conservative chemical applications during flowering
    if (growth_stage.value == "flowering" and 
        action.category == "Chemical Control"):
        action.description += " (use pollinator-safe formulations)"
    
    # More frequent monitoring during sensitive stages
    if (growth_stage.value in ["seedling", "flowering"] and 
        action.category == "Monitoring"):
        if "weekly" in action.frequency.lower():
            action.frequency = action.frequency.replace("weekly", "every 3-5 days")
    
    return action


def _determine_primary_action_type(actions: List[IPMAction], urgency: IPMUrgency) -> IPMActionType:
    """
    Determine primary action type from list of actions
    
    Args:
        actions: List of IPM actions
        urgency: Urgency level
        
    Returns:
        Primary action type
    """
    if urgency == IPMUrgency.high:
        # Look for immediate intervention actions
        for action in actions:
            if action.category in ["Chemical Control", "Physical Control"]:
                return IPMActionType.chemical
        return IPMActionType.monitoring
    
    elif urgency == IPMUrgency.medium:
        # Look for biological or cultural controls
        for action in actions:
            if action.category in ["Biological Control", "Cultural Control"]:
                return IPMActionType.biological
        return IPMActionType.monitoring
    
    else:
        return IPMActionType.monitoring


def _generate_ipm_description(pest_disease: str, severity_score: float, 
                            response_level: str, urgency: IPMUrgency) -> str:
    """Generate description for IPM recommendation"""
    pest_name = pest_disease.replace('_', ' ').title()
    
    descriptions = {
        "urgent": f"Immediate intervention required for {pest_name}. Severity level ({severity_score:.1f}) demands rapid response to prevent crop loss.",
        "monitor": f"Active management needed for {pest_name}. Current severity ({severity_score:.1f}) warrants intervention and close monitoring.",
        "none": f"{pest_name} detected but below action threshold. Implement preventive measures and continue monitoring."
    }
    
    return descriptions.get(response_level, f"Manage {pest_name} using integrated approach")


def _generate_ipm_rationale(decision: Dict[str, Any], weather_context, 
                          crop_type, growth_stage) -> str:
    """Generate rationale for IPM recommendation"""
    rationale_parts = []
    
    # Detection rationale
    confidence = decision["detection_confidence"]
    rationale_parts.append(f"Detection confidence: {confidence:.1%}")
    
    # Threshold rationale
    severity = decision["severity_score"]
    threshold = decision["adjusted_threshold"]
    rationale_parts.append(f"Severity ({severity:.1f}) vs threshold ({threshold:.1f})")
    
    # Weather influence
    if weather_context:
        risk_band = weather_context.risk_band.value
        rationale_parts.append(f"Weather risk: {risk_band}")
    
    # Growth stage sensitivity
    if growth_stage:
        rationale_parts.append(f"Growth stage: {growth_stage.value}")
    
    # IPM philosophy
    rationale_parts.append("IPM approach prioritizes sustainable, environmentally-friendly solutions")
    
    return ". ".join(rationale_parts) + "."


def _generate_preventive_recommendations(threshold_decisions: list,
                                       weather_context,
                                       crop_type,
                                       growth_stage,
                                       llm_results=None) -> List[IPMRecommendation]:
    """
    Generate preventive IPM recommendations
    
    Args:
        threshold_decisions: List of threshold decisions
        weather_context: Weather risk assessment
        crop_type: Type of crop
        growth_stage: Growth stage
        
    Returns:
        List of preventive recommendations
    """
    preventive_recommendations = []
    
    # Weather-based prevention
    if weather_context and weather_context.risk_band.value == "high":
        weather_prevention = IPMRecommendation(
            target_issue="Weather-Related Risks",
            action_type=IPMActionType.prevention,
            urgency=IPMUrgency.medium,
            description="Implement preventive measures due to high weather risk",
            actions=_get_weather_preventive_actions(weather_context),
            rationale="High weather risk increases disease and pest pressure"
        )
        preventive_recommendations.append(weather_prevention)
    
    # Growth stage specific prevention
    if growth_stage:
        stage_prevention = _get_growth_stage_prevention(growth_stage, crop_type)
        if stage_prevention:
            preventive_recommendations.append(stage_prevention)
    
    # General crop health recommendations derived from LLM/SLM (no hardcoded list)
    llm_preventive_actions = _get_general_preventive_actions(crop_type, llm_results)
    if llm_preventive_actions:
        general_prevention = IPMRecommendation(
            target_issue="General Crop Health",
            action_type=IPMActionType.prevention,
            urgency=IPMUrgency.low,
            description="LLM-derived general preventive actions",
            actions=llm_preventive_actions,
            rationale="Preventive guidance extracted from AI analysis"
        )
        preventive_recommendations.append(general_prevention)
    
    return preventive_recommendations


def _get_weather_preventive_actions(weather_context) -> List[IPMAction]:
    """Deprecated: previously returned hardcoded actions. Now returns empty and relies on LLM-derived content."""
    return []


def _get_growth_stage_prevention(growth_stage, crop_type) -> IPMRecommendation:
    """Deprecated: previously returned hardcoded actions. Now returns None and relies on LLM-derived content."""
    return None


def _get_general_preventive_actions(crop_type, llm_results) -> List[IPMAction]:
    """Extract general preventive actions from LLM/SLM results (no hardcoded defaults)."""
    actions: List[IPMAction] = []

    def _mk_action(text: str) -> IPMAction:
        t = (text or "").strip()
        # Heuristic category/timing/frequency from text
        lower = t.lower()
        category = "Cultural Control"
        if any(k in lower for k in ["monitor", "inspection", "scout"]):
            category = "Monitoring"
        elif any(k in lower for k in ["fertilizer", "nutrition", "soil"]):
            category = "Soil Management"
        elif any(k in lower for k in ["habitat", "beneficial"]):
            category = "Beneficial Habitat"
        timing = "Immediate" if any(k in lower for k in ["immediate", "today", "now"]) else (
            "Weekly" if "weekly" in lower else (
            "Daily" if "daily" in lower else "Ongoing")
        )
        frequency = "Every 3-5 days" if any(k in lower for k in ["3-5", "3 to 5"]) else (
            "Weekly" if "weekly" in lower else (
            "Daily" if "daily" in lower else "Season-long")
        )
        return IPMAction(category=category, description=t, timing=timing, frequency=frequency)

    def _collect_from_dict(d: dict):
        # Look for likely keys that hold preventive items
        for key in ["preventive", "prevention", "general_prevention", "general_preventive_actions", "cultural", "monitoring"]:
            val = d.get(key)
            if not val:
                continue
            if isinstance(val, list):
                for item in val:
                    if isinstance(item, str):
                        actions.append(_mk_action(item))
                    elif isinstance(item, dict):
                        desc = item.get("description") or item.get("action") or item.get("measure") or ""
                        cat = item.get("category")
                        if desc:
                            act = _mk_action(desc)
                            if cat:
                                act.category = cat
                            actions.append(act)

    if not llm_results:
        return actions

    # 1) Prefer cross-validation parsed recommendations if available
    if getattr(llm_results, "cross_validation", None) and llm_results.cross_validation.parsed_data:
        pd = llm_results.cross_validation.parsed_data
        if isinstance(pd, dict):
            # direct recommendations structure
            recs = pd.get("recommendations") if isinstance(pd.get("recommendations"), dict) else pd
            if isinstance(recs, dict):
                _collect_from_dict(recs)

    # 2) Fall back to provider-specific LLM analyses
    if not actions and getattr(llm_results, "llm_analysis", None):
        for analysis in llm_results.llm_analysis.values():
            if analysis and analysis.parsed_data and isinstance(analysis.parsed_data, dict):
                _collect_from_dict(analysis.parsed_data)
            if actions:
                break

    # 3) Fall back to SLM analysis
    if not actions and getattr(llm_results, "slm_analysis", None):
        sa = llm_results.slm_analysis
        if sa and sa.parsed_data and isinstance(sa.parsed_data, dict):
            _collect_from_dict(sa.parsed_data)

    return actions


def _prioritize_recommendations(recommendations: List[IPMRecommendation], 
                              urgency_level: str) -> List[IPMRecommendation]:
    """
    Prioritize recommendations by urgency and action type
    
    Args:
        recommendations: List of IPM recommendations
        urgency_level: Overall urgency level
        
    Returns:
        Prioritized list of recommendations
    """
    # Sort by urgency first, then action type
    urgency_order = {IPMUrgency.high: 0, IPMUrgency.medium: 1, IPMUrgency.low: 2}
    action_order = {IPMActionType.chemical: 0, IPMActionType.biological: 1, IPMActionType.monitoring: 2, IPMActionType.prevention: 3}
    
    return sorted(
        recommendations,
        key=lambda r: (urgency_order.get(r.urgency, 3), action_order.get(r.action_type, 3))
    )


def _generate_recommendation_summary(recommendations: List[IPMRecommendation],
                                   action_required: bool,
                                   urgency_level: str) -> str:
    """Generate summary of IPM recommendations"""
    if not recommendations:
        return "No specific recommendations generated"
    
    treatment_count = sum(1 for r in recommendations if r.action_type in [IPMActionType.chemical, IPMActionType.biological])
    monitoring_count = sum(1 for r in recommendations if r.action_type == IPMActionType.monitoring)
    prevention_count = sum(1 for r in recommendations if r.action_type == IPMActionType.prevention)
    
    summary_parts = [
        f"Generated {len(recommendations)} IPM recommendation{'s' if len(recommendations) != 1 else ''}"
    ]
    
    if treatment_count > 0:
        summary_parts.append(f"{treatment_count} treatment action{'s' if treatment_count != 1 else ''}")
    
    if monitoring_count > 0:
        summary_parts.append(f"{monitoring_count} monitoring action{'s' if monitoring_count != 1 else ''}")
    
    if prevention_count > 0:
        summary_parts.append(f"{prevention_count} preventive measure{'s' if prevention_count != 1 else ''}")
    
    summary_parts.append(f"Overall priority: {urgency_level}")
    
    return ". ".join(summary_parts) + "."
