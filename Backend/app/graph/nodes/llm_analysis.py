"""
LLM Analysis Node - Large Language Model Analysis for Agricultural Computer Vision
Advanced multi-provider analysis with deep agricultural expertise
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.schemas.postgres_base_models import WorkflowState, LLMAnalysisResult
from app.services.llm_service import get_llm_service, LLMProvider, LLMResponseType
from app.services.prompt_engineering import get_prompt_engine
from app.core.config import LLM_PARALLEL_PROVIDERS, LLM_CONSENSUS_THRESHOLD

logger = logging.getLogger(__name__)


async def llm_analysis_node(state: WorkflowState) -> WorkflowState:
    """
    Perform single LLM analysis for sequential validation workflow
    
    This node focuses on:
    - Single high-quality LLM analysis (not parallel)
    - Generate Response B to compare with SLM Response A
    - Prepare both responses for validator comparison
    
    Args:
        state: Current workflow state with SLM results and CV data
        
    Returns:
        Updated state with single LLM analysis result
    """
    start_time = datetime.utcnow()
    node_name = "llm_analysis"
    
    logger.info(f"🧠 Starting sequential LLM analysis for trace_id: {state.trace_id}")
    
    try:
        # Check prerequisites
        if not state.vision_results:
            error_msg = "No vision results available for LLM analysis"
            logger.error(error_msg)
            state.errors.append(error_msg)
            return state
            
        if not state.processed_images:
            error_msg = "No processed images available for LLM analysis"
            logger.error(error_msg)
            state.errors.append(error_msg)
            return state
        
        # Skip LLM analysis if requested
        if state.skip_llm_analysis:
            logger.info("⏭️ Skipping LLM analysis as requested")
            return state
        
        # Get services
        llm_service = get_llm_service()
        prompt_engine = get_prompt_engine()
        
        # Select single best LLM provider for Response B generation
        target_provider = _select_primary_llm_provider(llm_service, state)
        
        if not target_provider:
            error_msg = "No healthy LLM provider available for sequential analysis"
            logger.error(error_msg)
            state.errors.append(error_msg)
            return state
        
        logger.info(f"🤖 Using {target_provider.value} for sequential LLM analysis (Response B)")
        
        # Prepare comprehensive analysis context
        analysis_context = _prepare_llm_context(state)
        
        # Generate LLM prompt for Response B
        llm_prompt = prompt_engine.generate_llm_vision_prompt(
            vision_results=state.vision_results,
            severity_assessment=state.severity_assessment,
            weather_context=state.weather_context,
            slm_analysis=state.llm_results.slm_analysis,
            crop_info={
                "crop_type": state.payload.crop.value if state.payload else "unknown",
                "growth_stage": state.payload.stage.value if state.payload else "unknown",
                "location": state.payload.location.dict() if state.payload and state.payload.location else None,
                "notes": state.payload.notes if state.payload else None
            },
            context_data=analysis_context,
            provider_hint=target_provider.value
        )
        
        # Execute single LLM analysis for Response B
        image_data = state.processed_images[0]  # Use first processed image
        
        response = await llm_service.analyze_image_with_provider(
            provider=target_provider,
            image_data=image_data,
            prompt=llm_prompt,
            response_type=LLMResponseType.LLM_ANALYSIS
        )
        
        # Create single LLM analysis result
        llm_result = LLMAnalysisResult(
            provider=target_provider.value,
            model_name=response.metadata.get("model", "unknown"),
            analysis_type="sequential_llm_analysis", 
            content=response.content,
            parsed_data=response.parse_json_content(),
            confidence=_extract_advanced_confidence(response.content),
            token_usage=response.metadata.get("usage", {}),
            processing_time=(datetime.utcnow() - start_time).total_seconds(),
            success=response.success,
            error_message=response.error,
            metadata={
                "prompt_length": len(llm_prompt),
                "finish_reason": response.metadata.get("finish_reason"),
                "analysis_focus": "comprehensive_agricultural_expertise",
                "sequential_mode": True,
                "response_designation": "Response_B"
            }
        )
        
        # Store single LLM analysis result
        state.llm_results.llm_analysis = {target_provider.value: llm_result}
        
        # Update active providers list
        if target_provider.value not in state.active_llm_providers:
            state.active_llm_providers.append(target_provider.value)
        
        # Record processing metrics
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        state.processing_times["llm_analysis"] = processing_time
        state.node_execution_order.append("llm_analysis")
        
        logger.info(
            f"✅ Sequential LLM analysis completed in {processing_time:.2f}s "
            f"(provider: {target_provider.value}, Response B ready for validation)"
        )
        
        # Integrate insights for validation preparation
        if llm_result.success:
            _prepare_responses_for_validation(state)
        else:
            error_msg = f"LLM analysis failed: {llm_result.error_message}"
            logger.error(error_msg)
            state.errors.append(error_msg)
        
        return state
        
    except Exception as e:
        error_msg = f"Sequential LLM analysis failed: {str(e)}"
        logger.error(error_msg)
        state.errors.append(error_msg)
        
        # Record failed processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        state.processing_times["llm_analysis"] = processing_time
        
        return state


def _select_primary_llm_provider(llm_service, state: WorkflowState) -> Optional[LLMProvider]:
    """Select single best LLM provider for sequential Response B generation"""
    healthy_providers = llm_service.get_healthy_providers()
    
    # Priority order for sequential analysis (pick the best single provider)
    provider_priority = [
        LLMProvider.OPENAI,     # GPT-4o preferred for comprehensive analysis
        LLMProvider.ANTHROPIC,  # Claude as high-quality alternative
        LLMProvider.GOOGLE      # Gemini as fallback
    ]
    
    # Return first healthy provider from priority list
    for provider in provider_priority:
        if provider in healthy_providers:
            logger.debug(f"Selected {provider.value} as primary LLM provider for Response B")
            return provider
    
    logger.warning("No healthy LLM providers available from priority list")
    return None


def _prepare_responses_for_validation(state: WorkflowState) -> None:
    """Prepare Response A (SLM) and Response B (LLM) for validator comparison"""
    try:
        validation_data = {
            "response_a": {
                "source": "local_slm",
                "provider": state.llm_results.slm_analysis.provider if state.llm_results.slm_analysis else "unknown",
                "content": state.llm_results.slm_analysis.content if state.llm_results.slm_analysis else None,
                "confidence": state.llm_results.slm_analysis.confidence if state.llm_results.slm_analysis else None,
                "parsed_data": state.llm_results.slm_analysis.parsed_data if state.llm_results.slm_analysis else None,
                "processing_time": state.llm_results.slm_analysis.processing_time if state.llm_results.slm_analysis else None,
                "designation": "SLM_Response_A"
            },
            "response_b": {
                "source": "cloud_llm",
                "provider": None,
                "content": None,
                "confidence": None,
                "parsed_data": None,
                "processing_time": None,
                "designation": "LLM_Response_B"
            },
            "comparison_context": {
                "vision_results": state.vision_results,
                "severity_assessment": state.severity_assessment,
                "weather_context": state.weather_context,
                "crop_info": {
                    "crop_type": state.payload.crop.value if state.payload else "unknown",
                    "growth_stage": state.payload.stage.value if state.payload else "unknown"
                },
                "trace_id": state.trace_id
            }
        }
        
        # Populate Response B data from LLM analysis
        if state.llm_results.llm_analysis:
            # Get first (and only) LLM analysis result for sequential approach
            llm_result = next(iter(state.llm_results.llm_analysis.values()))
            validation_data["response_b"] = {
                "source": "cloud_llm",
                "provider": llm_result.provider,
                "content": llm_result.content,
                "confidence": llm_result.confidence,
                "parsed_data": llm_result.parsed_data,
                "processing_time": llm_result.processing_time,
                "designation": "LLM_Response_B",
                "model_name": llm_result.model_name,
                "token_usage": llm_result.token_usage
            }
        
        # Store validation preparation data
        if not hasattr(state, 'validation_data'):
            state.validation_data = {}
        state.validation_data = validation_data
        
        logger.info(
            f"✅ Prepared responses for validation: "
            f"Response A ({validation_data['response_a']['provider']}) vs "
            f"Response B ({validation_data['response_b']['provider']})"
        )
        
    except Exception as e:
        logger.error(f"Failed to prepare responses for validation: {e}")
        state.errors.append(f"Validation preparation failed: {str(e)}")


def _select_llm_providers(llm_service, state: WorkflowState) -> List[LLMProvider]:
    """Legacy function - kept for compatibility but not used in sequential approach"""
    """Select optimal LLM providers for comprehensive analysis"""
    healthy_providers = llm_service.get_healthy_providers()
    
    # Priority order for comprehensive analysis (most capable first)
    comprehensive_providers = [
        LLMProvider.OPENAI,     # GPT-4o for advanced reasoning
        LLMProvider.ANTHROPIC,  # Claude for detailed analysis
        LLMProvider.GOOGLE      # Gemini for diverse perspective
    ]
    
    # Filter to healthy providers only
    available_providers = [p for p in comprehensive_providers if p in healthy_providers]
    
    # Respect configuration limits
    max_providers = min(len(available_providers), LLM_PARALLEL_PROVIDERS)
    selected = available_providers[:max_providers]
    
    logger.debug(f"Selected {len(selected)} providers from {len(available_providers)} available")
    return selected


def _prepare_llm_context(state: WorkflowState) -> Dict[str, Any]:
    """Prepare comprehensive context for LLM analysis"""
    context = {
        "timestamp": datetime.utcnow().isoformat(),
        "trace_id": state.trace_id,
        "analysis_chain": state.node_execution_order.copy(),
        "previous_processing_times": state.processing_times.copy(),
        "error_history": state.errors.copy()
    }
    
    # Add detailed vision context
    if state.vision_results:
        vision_summary = _create_detailed_vision_summary(state.vision_results)
        context["vision_analysis"] = vision_summary
    
    # Add severity analysis context
    if state.severity_assessment:
        context["severity_analysis"] = {
            "score": state.severity_assessment.score_0_100,
            "band": state.severity_assessment.band.value,
            "confidence": state.severity_assessment.confidence,
            "contributing_factors": state.severity_assessment.factors,
            "assessment_method": "computer_vision_based"
        }
    
    # Add weather context with detailed indices
    if state.weather_context:
        context["weather_analysis"] = {
            "risk_band": state.weather_context.risk_band.value,
            "contributing_factors": state.weather_context.factors,
            "detailed_indices": state.weather_context.indices.dict() if state.weather_context.indices else None,
            "environmental_stress_indicators": _extract_weather_stress_indicators(state.weather_context)
        }
    
    # Add SLM insights if available
    if state.llm_results.slm_analysis:
        context["slm_insights"] = {
            "provider": state.llm_results.slm_analysis.provider,
            "confidence": state.llm_results.slm_analysis.confidence,
            "key_findings": _extract_slm_key_findings(state.llm_results.slm_analysis),
            "parsed_data_available": state.llm_results.slm_analysis.parsed_data is not None
        }
    
    # Add crop-specific context
    if state.payload:
        context["crop_context"] = {
            "crop_type": state.payload.crop.value,
            "growth_stage": state.payload.stage.value,
            "geographic_context": _extract_geographic_context(state.payload.location),
            "user_notes": state.payload.notes,
            "image_capture_time": state.payload.taken_at.isoformat() if state.payload.taken_at else None,
            "image_source": state.payload.image_source.value
        }
    
    return context


def _create_detailed_vision_summary(vision_results: Dict[str, Any]) -> Dict[str, Any]:
    """Create detailed summary of computer vision results"""
    summary = {
        "total_detections": len(vision_results.get("predictions", [])),
        "detection_details": [],
        "confidence_distribution": {},
        "spatial_analysis": {}
    }
    
    predictions = vision_results.get("predictions", [])
    
    # Analyze each detection
    for pred in predictions:
        detail = {
            "class": pred.get("class_name", "unknown"),
            "confidence": pred.get("confidence", 0),
            "bbox": pred.get("bounding_box"),
            "area_coverage": pred.get("area_percentage")
        }
        summary["detection_details"].append(detail)
    
    # Confidence distribution
    if predictions:
        confidences = [p.get("confidence", 0) for p in predictions]
        summary["confidence_distribution"] = {
            "mean": sum(confidences) / len(confidences),
            "max": max(confidences),
            "min": min(confidences),
            "high_confidence_count": len([c for c in confidences if c > 0.8])
        }
    
    # Class frequency
    classes = [p.get("class_name", "unknown") for p in predictions]
    class_counts = {}
    for cls in classes:
        class_counts[cls] = class_counts.get(cls, 0) + 1
    summary["class_frequency"] = class_counts
    
    return summary


def _extract_weather_stress_indicators(weather_context) -> List[str]:
    """Extract weather stress indicators from weather context"""
    indicators = []
    
    if weather_context.indices:
        indices = weather_context.indices
        
        # High humidity stress
        if indices.high_humidity_hours > 12:
            indicators.append("prolonged_high_humidity")
        
        # Wet conditions stress
        if indices.consecutive_wet_days > 3:
            indicators.append("extended_wet_period")
        
        # Temperature stress
        if indices.temperature_stress:
            indicators.append("temperature_stress")
        
        # Wind stress
        if indices.wind_risk:
            indicators.append("wind_damage_risk")
    
    return indicators


def _extract_slm_key_findings(slm_analysis: LLMAnalysisResult) -> List[str]:
    """Extract key findings from SLM analysis"""
    findings = []
    
    if slm_analysis.parsed_data:
        parsed = slm_analysis.parsed_data
        
        # Extract main diagnostic findings
        if "analysis" in parsed:
            analysis_data = parsed["analysis"]
            if isinstance(analysis_data, dict):
                if "primary_issue" in analysis_data:
                    findings.append(f"Primary issue: {analysis_data['primary_issue']}")
                if "severity_assessment" in analysis_data:
                    findings.append(f"Severity: {analysis_data['severity_assessment']}")
        
        # Extract recommendation priorities
        if "recommendations" in parsed:
            rec_data = parsed["recommendations"]
            if isinstance(rec_data, dict) and "immediate_actions" in rec_data:
                actions = rec_data["immediate_actions"]
                if actions:
                    findings.append(f"Immediate actions needed: {len(actions)} items")
    
    # Fallback to content analysis if no structured data
    if not findings and slm_analysis.content:
        content_lower = slm_analysis.content.lower()
        if "severe" in content_lower:
            findings.append("Severe condition detected")
        if "immediate" in content_lower:
            findings.append("Immediate action recommended")
        if "fungal" in content_lower or "bacterial" in content_lower:
            findings.append("Disease pathogen detected")
    
    return findings


def _extract_geographic_context(location) -> Optional[Dict[str, Any]]:
    """Extract geographic context from location data"""
    if not location:
        return None
        
    context = {
        "coordinates": {"lat": location.lat, "lon": location.lon},
        "altitude": location.altitude
    }
    
    # Add region classification based on coordinates
    # (This is a simplified example - real implementation would use geographic databases)
    lat, lon = location.lat, location.lon
    
    if 23.5 <= lat <= 66.5:  # Temperate zone
        context["climate_zone"] = "temperate"
    elif -23.5 <= lat <= 23.5:  # Tropical zone
        context["climate_zone"] = "tropical" 
    else:  # Polar zones
        context["climate_zone"] = "polar"
    
    return context


def _extract_advanced_confidence(content: str) -> Optional[float]:
    """Extract confidence score with advanced pattern matching"""
    try:
        import re
        
        # Multiple pattern attempts for confidence extraction
        patterns = [
            r'"overall_confidence"[:\s]*([0-9]*\.?[0-9]+)',
            r'"confidence"[:\s]*([0-9]*\.?[0-9]+)',
            r'confidence[:\s]*([0-9]*\.?[0-9]+)%?',
            r'overall confidence[:\s]*([0-9]*\.?[0-9]+)%?',
            r'analysis confidence[:\s]*([0-9]*\.?[0-9]+)%?'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content.lower())
            if matches:
                try:
                    value = float(matches[0])
                    # Convert percentage to decimal if needed
                    if value > 1:
                        value = value / 100
                    return min(1.0, max(0.0, value))
                except ValueError:
                    continue
        
        # Try structured JSON parsing
        try:
            # Extract JSON blocks
            json_blocks = re.findall(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if not json_blocks:
                json_blocks = re.findall(r'```\s*([\{\[].*?[\}\]])\s*```', content, re.DOTALL)
            
            for block in json_blocks:
                try:
                    parsed = json.loads(block)
                    if isinstance(parsed, dict):
                        # Look for confidence at various levels
                        confidence_keys = ["confidence", "overall_confidence", "analysis_confidence"]
                        for key in confidence_keys:
                            if key in parsed:
                                value = float(parsed[key])
                                return min(1.0, max(0.0, value if value <= 1 else value / 100))
                except (json.JSONDecodeError, ValueError):
                    continue
                    
        except Exception:
            pass
            
    except Exception as e:
        logger.debug(f"Advanced confidence extraction failed: {e}")
    
    return None


def _assess_provider_performance(response) -> Dict[str, Any]:
    """Assess performance metrics for provider response"""
    performance = {
        "response_length": len(response.content),
        "has_structured_data": response.parse_json_content() is not None,
        "token_efficiency": 0.0,
        "response_quality": "unknown"
    }
    
    # Calculate token efficiency (content length per token)
    usage = response.metadata.get("usage", {})
    total_tokens = usage.get("total_tokens", 0)
    if total_tokens > 0:
        performance["token_efficiency"] = len(response.content) / total_tokens
    
    # Basic quality assessment
    content_lower = response.content.lower()
    quality_indicators = [
        "analysis", "recommendation", "severity", "confidence",
        "treatment", "prevention", "monitoring", "diagnosis"
    ]
    
    quality_score = sum(1 for indicator in quality_indicators if indicator in content_lower)
    performance["quality_indicators_present"] = quality_score
    
    if quality_score >= 6:
        performance["response_quality"] = "high"
    elif quality_score >= 4:
        performance["response_quality"] = "medium"
    else:
        performance["response_quality"] = "low"
    
    return performance


def _calculate_llm_consensus_metrics(state: WorkflowState) -> None:
    """Calculate consensus and agreement metrics across LLM responses"""
    llm_analyses = state.llm_results.llm_analysis
    
    if len(llm_analyses) < 2:
        return
    
    # Extract confidence scores
    confidences = {}
    successful_analyses = []
    
    for provider, analysis in llm_analyses.items():
        if analysis.success and analysis.confidence is not None:
            confidences[provider] = analysis.confidence
            successful_analyses.append(analysis)
    
    state.llm_results.confidence_scores = confidences
    
    if len(confidences) >= 2:
        # Calculate agreement score based on confidence similarity
        conf_values = list(confidences.values())
        mean_confidence = sum(conf_values) / len(conf_values)
        variance = sum((c - mean_confidence) ** 2 for c in conf_values) / len(conf_values)
        
        # Agreement is higher when variance is lower (similar confidences)
        # Scale: 1.0 = perfect agreement, 0.0 = maximum disagreement
        agreement_score = max(0.0, 1.0 - (variance * 4))  # Scale variance to 0-1 range
        state.llm_results.agreement_score = agreement_score
        
        logger.debug(f"LLM consensus metrics - Agreement: {agreement_score:.3f}, Confidences: {confidences}")


def _aggregate_token_usage(state: WorkflowState) -> None:
    """Aggregate token usage across all LLM analyses"""
    total_usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    
    # Include SLM analysis
    if state.llm_results.slm_analysis and state.llm_results.slm_analysis.token_usage:
        slm_usage = state.llm_results.slm_analysis.token_usage
        for key in total_usage:
            total_usage[key] += slm_usage.get(key, 0)
    
    # Include LLM analyses
    for analysis in state.llm_results.llm_analysis.values():
        if analysis.token_usage:
            for key in total_usage:
                total_usage[key] += analysis.token_usage.get(key, 0)
    
    state.llm_results.total_token_usage = total_usage


def _integrate_llm_insights(state: WorkflowState) -> None:
    """Integrate insights from multiple LLM analyses"""
    try:
        integrated_insights = {
            "diagnostic_consensus": {},
            "severity_consensus": {},
            "treatment_consensus": {},
            "risk_consensus": {},
            "provider_agreements": {},
            "confidence_weighted_recommendations": []
        }
        
        successful_analyses = [
            analysis for analysis in state.llm_results.llm_analysis.values()
            if analysis.success and analysis.parsed_data
        ]
        
        if not successful_analyses:
            return
        
        # Analyze diagnostic consensus
        diagnoses = {}
        for analysis in successful_analyses:
            if analysis.parsed_data and "diagnosis" in analysis.parsed_data:
                diag_data = analysis.parsed_data["diagnosis"]
                if isinstance(diag_data, dict) and "primary_issue" in diag_data:
                    issue = diag_data["primary_issue"]
                    if issue not in diagnoses:
                        diagnoses[issue] = []
                    diagnoses[issue].append({
                        "provider": analysis.provider,
                        "confidence": analysis.confidence or 0.5
                    })
        
        integrated_insights["diagnostic_consensus"] = diagnoses
        
        # Analyze severity consensus
        severity_assessments = []
        for analysis in successful_analyses:
            if analysis.parsed_data and "severity" in analysis.parsed_data:
                sev_data = analysis.parsed_data["severity"]
                if isinstance(sev_data, dict):
                    severity_assessments.append({
                        "provider": analysis.provider,
                        "score": sev_data.get("score"),
                        "assessment": sev_data.get("assessment"),
                        "confidence": analysis.confidence or 0.5
                    })
        
        integrated_insights["severity_consensus"] = severity_assessments
        
        # Store integrated insights
        if not hasattr(state, 'llm_insights'):
            state.llm_insights = {}
        state.llm_insights.update(integrated_insights)
        
        logger.debug(f"Integrated insights from {len(successful_analyses)} LLM analyses")
        
    except Exception as e:
        logger.warning(f"Failed to integrate LLM insights: {e}")


# Export for graph construction
__all__ = ["llm_analysis_node"]
