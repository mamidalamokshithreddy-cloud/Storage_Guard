"""
Cross-Validation Analysis Node - Meta-analysis and consensus building
Validates and synthesizes results from SLM, LLM, and CV analyses
"""

import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

from app.schemas.postgres_base_models import WorkflowState, LLMAnalysisResult
from app.services.llm_service import get_llm_service, LLMProvider, LLMResponseType
from app.services.prompt_engineering import get_prompt_engine
from app.core.config import LLM_CONSENSUS_THRESHOLD, CROSS_VALIDATION_LLM_PROVIDER

logger = logging.getLogger(__name__)


async def cross_validation_node(state: WorkflowState) -> WorkflowState:
    """
    Perform sequential cross-validation analysis comparing Response A vs Response B
    
    This node focuses on:
    - Comparing SLM Response A with LLM Response B
    - Multi-validator consensus for best response selection
    - Quality assessment and synthesis
    - Final recommendation generation
    
    Sequential Flow:
    1. Response A (SLM) + Response B (LLM) → Multiple Validators
    2. Validators compare responses and vote for best one
    3. Synthesize final response based on validator consensus
    
    Args:
        state: Current workflow state with SLM and LLM results
        
    Returns:
        Updated state with cross-validation analysis and final consensus
    """
    start_time = datetime.utcnow()
    logger.info(f"🔍 Starting sequential cross-validation for trace_id: {state.trace_id}")
    
    try:
        # Check if cross-validation is enabled
        if not state.cv_analysis_enabled:
            logger.info("⏭️ Cross-validation analysis disabled")
            return state
        
        # Check prerequisites - need both Response A and Response B
        if not _validate_sequential_prerequisites(state):
            logger.warning("⏭️ Sequential validation prerequisites not met")
            return state
        
        # Get services
        llm_service = get_llm_service()
        prompt_engine = get_prompt_engine()
        
        # Select multiple validators for sequential comparison
        validators = _select_sequential_validators(llm_service)
        
        if not validators:
            error_msg = "No suitable validators available for sequential cross-validation"
            logger.error(error_msg)
            state.errors.append(error_msg)
            return state
        
        logger.info(f"🤖 Using {len(validators)} validators: {[v.value for v in validators]}")
        
        # Prepare validation data (Response A vs Response B)
        validation_context = _prepare_sequential_validation_context(state)
        
        # Generate comparison prompts for each validator
        validator_responses = {}
        
        for validator_provider in validators:
            logger.debug(f"🔍 Running validator: {validator_provider.value}")
            
            # Generate validator-specific prompt for Response A vs Response B comparison
            validator_prompt = prompt_engine.generate_cross_validation_prompt(
                vision_results=state.vision_results,
                severity_assessment=state.severity_assessment, 
                weather_context=state.weather_context,
                slm_analysis=state.llm_results.slm_analysis,  # Response A
                llm_analyses=list(state.llm_results.llm_analysis.values()),  # Response B
                consensus_data={
                    "validation_mode": "sequential_comparison",
                    "response_a_source": "local_slm",
                    "response_b_source": "cloud_llm",
                    "comparison_focus": "agricultural_expertise_quality"
                },
                context_data=validation_context,
                provider_hint=validator_provider.value
            )
            
            # Execute validator analysis
            if state.processed_images:
                image_data = state.processed_images[0]
                response = await llm_service.analyze_image_with_provider(
                    provider=validator_provider,
                    image_data=image_data,
                    prompt=validator_prompt,
                    response_type=LLMResponseType.CROSS_VALIDATION
                )
            else:
                # Text-only validation if no images available
                response = await llm_service.analyze_text_with_provider(
                    provider=validator_provider,
                    prompt=validator_prompt,
                    response_type=LLMResponseType.CROSS_VALIDATION
                )
            
            # Store validator response
            validator_responses[validator_provider.value] = response
        
        # Process validator responses and determine consensus
        validator_results = {}
        successful_validations = 0
        
        for provider_name, response in validator_responses.items():
            validator_result = LLMAnalysisResult(
                provider=provider_name,
                model_name=response.metadata.get("model", "unknown"),
                analysis_type="sequential_validator",
                content=response.content,
                parsed_data=response.parse_json_content(),
                confidence=_extract_consensus_confidence(response.content),
                token_usage=response.metadata.get("usage", {}),
                processing_time=(datetime.utcnow() - start_time).total_seconds(),
                success=response.success,
                error_message=response.error,
                metadata={
                    "validation_role": "response_comparator",
                    "comparison_mode": "A_vs_B_analysis",
                    "finish_reason": response.metadata.get("finish_reason")
                }
            )
            
            validator_results[provider_name] = validator_result
            
            if response.success:
                successful_validations += 1
        
        # Determine consensus from validator votes
        consensus_decision = _determine_sequential_consensus(validator_results, state)
        
        # Create final cross-validation result
        cv_result = LLMAnalysisResult(
            provider="sequential_consensus",
            model_name="multi_validator_consensus",
            analysis_type="sequential_cross_validation",
            content=consensus_decision["final_response"],
            parsed_data=consensus_decision,
            confidence=consensus_decision["consensus_confidence"],
            token_usage=_aggregate_validator_tokens(validator_results),
            processing_time=(datetime.utcnow() - start_time).total_seconds(),
            success=successful_validations > 0,
            error_message=None if successful_validations > 0 else "All validators failed",
            metadata={
                "validation_approach": "sequential_comparison",
                "validators_used": list(validator_results.keys()),
                "successful_validations": successful_validations,
                "total_validators": len(validators),
                "winning_response": consensus_decision["selected_response"],
                "decision_rationale": consensus_decision["rationale"]
            }
        )
        
        # Store cross-validation results
        state.llm_results.cross_validation = cv_result
        state.llm_results.validator_results = validator_results
        
        # Update active providers list
        for provider_name in validator_results.keys():
            if provider_name not in state.active_llm_providers:
                state.active_llm_providers.append(provider_name)
        
        # Record processing metrics
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        state.processing_times["cross_validation"] = processing_time
        state.node_execution_order.append("cross_validation")
        
        # Log success
        logger.info(
            f"✅ Sequential cross-validation completed in {processing_time:.2f}s "
            f"({successful_validations}/{len(validators)} validators successful, "
            f"selected: {consensus_decision['selected_response']}, "
            f"confidence: {consensus_decision['consensus_confidence']:.3f})"
        )
        
        # Generate final insights based on winning response
        if cv_result.success:
            _generate_final_sequential_insights(state, consensus_decision)
        else:
            error_msg = f"Sequential cross-validation failed: all validators failed"
            logger.error(error_msg)
            state.errors.append(error_msg)
        
        return state
        
    except Exception as e:
        error_msg = f"Sequential cross-validation failed: {str(e)}"
        logger.error(error_msg)
        state.errors.append(error_msg)
        
        # Record failed processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        state.processing_times["cross_validation"] = processing_time
        
        return state


def _validate_sequential_prerequisites(state: WorkflowState) -> bool:
    """Validate prerequisites for sequential validation (Response A vs Response B)"""
    # Need Response A (SLM analysis)
    if not (state.llm_results.slm_analysis and state.llm_results.slm_analysis.success):
        logger.warning("Sequential validation requires successful SLM analysis (Response A)")
        return False
    
    # Need Response B (LLM analysis) 
    if not (state.llm_results.llm_analysis and 
            any(analysis.success for analysis in state.llm_results.llm_analysis.values())):
        logger.warning("Sequential validation requires successful LLM analysis (Response B)")
        return False
    
    # Need vision results for context
    if not state.vision_results:
        logger.warning("Sequential validation requires vision results for context")
        return False
    
    return True


def _select_sequential_validators(llm_service) -> List[LLMProvider]:
    """Select multiple validators for sequential Response A vs Response B comparison"""
    healthy_providers = llm_service.get_healthy_providers()
    
    # Use different providers as validators (avoid using same as Response B generator)
    validator_priority = [
        LLMProvider.ANTHROPIC,  # Claude for analytical comparison
        LLMProvider.GOOGLE,     # Gemini for diverse perspective
        LLMProvider.OPENAI,     # GPT-4o for comprehensive analysis
    ]
    
    # Select up to 3 validators from healthy providers
    selected_validators = []
    for provider in validator_priority:
        if provider in healthy_providers and len(selected_validators) < 3:
            selected_validators.append(provider)
    
    logger.debug(f"Selected {len(selected_validators)} validators from {len(healthy_providers)} healthy providers")
    return selected_validators


def _prepare_sequential_validation_context(state: WorkflowState) -> Dict[str, Any]:
    """Prepare context for sequential validation comparing Response A vs Response B"""
    context = {
        "validation_mode": "sequential_comparison",
        "timestamp": datetime.utcnow().isoformat(),
        "trace_id": state.trace_id,
        "comparison_task": "select_best_agricultural_analysis"
    }
    
    # Add Response A (SLM) summary
    if state.llm_results.slm_analysis:
        context["response_a_summary"] = {
            "source": "local_slm_model",
            "provider": state.llm_results.slm_analysis.provider,
            "confidence": state.llm_results.slm_analysis.confidence,
            "processing_time": state.llm_results.slm_analysis.processing_time,
            "has_structured_data": state.llm_results.slm_analysis.parsed_data is not None
        }
    
    # Add Response B (LLM) summary
    if state.llm_results.llm_analysis:
        llm_result = next(iter(state.llm_results.llm_analysis.values()))
        context["response_b_summary"] = {
            "source": "cloud_llm_model", 
            "provider": llm_result.provider,
            "confidence": llm_result.confidence,
            "processing_time": llm_result.processing_time,
            "has_structured_data": llm_result.parsed_data is not None,
            "model_name": llm_result.model_name
        }
    
    # Add evaluation criteria
    context["evaluation_criteria"] = {
        "agricultural_expertise": "depth of agricultural knowledge and accuracy",
        "diagnostic_accuracy": "correctness of pest/disease identification",
        "treatment_recommendations": "practicality and effectiveness of suggested treatments",
        "confidence_calibration": "appropriateness of confidence levels",
        "completeness": "comprehensiveness of analysis and recommendations",
        "clarity": "clarity and usefulness for farmer decision-making"
    }
    
    return context


def _determine_sequential_consensus(validator_results: Dict[str, LLMAnalysisResult], 
                                  state: WorkflowState) -> Dict[str, Any]:
    """Determine consensus from validator comparisons of Response A vs Response B"""
    votes = {"response_a": 0, "response_b": 0, "tie": 0}
    validator_decisions = {}
    confidence_scores = []
    reasoning_summaries = []
    
    # Analyze each validator's decision
    for provider, result in validator_results.items():
        if not result.success:
            continue
            
        # Extract decision from validator response
        decision = _extract_validator_decision(result.content, result.parsed_data)
        validator_decisions[provider] = decision
        
        # Count votes
        if decision["selected_response"] == "response_a":
            votes["response_a"] += 1
        elif decision["selected_response"] == "response_b":
            votes["response_b"] += 1
        else:
            votes["tie"] += 1
        
        if decision["confidence"]:
            confidence_scores.append(decision["confidence"])
        
        if decision["reasoning"]:
            reasoning_summaries.append(f"{provider}: {decision['reasoning']}")
    
    # Determine winning response
    if votes["response_a"] > votes["response_b"]:
        selected_response = "response_a"
        winning_analysis = state.llm_results.slm_analysis
        decision_confidence = votes["response_a"] / sum(votes.values())
    elif votes["response_b"] > votes["response_a"]:
        selected_response = "response_b"
        winning_analysis = next(iter(state.llm_results.llm_analysis.values()))
        decision_confidence = votes["response_b"] / sum(votes.values())
    else:
        # Tie - default to Response B (cloud LLM) for agricultural expertise
        selected_response = "response_b"
        winning_analysis = next(iter(state.llm_results.llm_analysis.values()))
        decision_confidence = 0.5
    
    # Calculate consensus confidence
    consensus_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
    
    # Prepare consensus decision
    consensus_decision = {
        "selected_response": selected_response,
        "final_response": winning_analysis.content if winning_analysis else "No analysis available",
        "consensus_confidence": consensus_confidence,
        "decision_confidence": decision_confidence,
        "vote_breakdown": votes,
        "validator_decisions": validator_decisions,
        "rationale": f"Selected {selected_response} based on {sum(votes.values())} validator votes",
        "reasoning_summaries": reasoning_summaries,
        "winning_analysis_metadata": {
            "provider": winning_analysis.provider if winning_analysis else "unknown",
            "original_confidence": winning_analysis.confidence if winning_analysis else None,
            "analysis_type": winning_analysis.analysis_type if winning_analysis else "unknown"
        }
    }
    
    logger.info(f"🏆 Consensus decision: {selected_response} (votes: {votes})")
    return consensus_decision


def _extract_validator_decision(content: str, parsed_data: Optional[Dict]) -> Dict[str, Any]:
    """Extract validator decision from response content"""
    decision = {
        "selected_response": "response_b",  # Default to Response B
        "confidence": 0.5,
        "reasoning": "Unable to parse validator decision"
    }
    
    try:
        # Try to extract from parsed JSON first
        if parsed_data:
            if "selected_response" in parsed_data:
                decision["selected_response"] = parsed_data["selected_response"].lower().replace(" ", "_")
            if "confidence" in parsed_data:
                decision["confidence"] = float(parsed_data["confidence"])
            if "reasoning" in parsed_data:
                decision["reasoning"] = parsed_data["reasoning"]
            return decision
        
        # Fallback to text analysis
        content_lower = content.lower()
        
        # Look for explicit response selection
        if "response a" in content_lower and "better" in content_lower:
            decision["selected_response"] = "response_a"
        elif "response b" in content_lower and "better" in content_lower:
            decision["selected_response"] = "response_b"
        elif "slm" in content_lower and ("superior" in content_lower or "better" in content_lower):
            decision["selected_response"] = "response_a"
        elif "llm" in content_lower and ("superior" in content_lower or "better" in content_lower):
            decision["selected_response"] = "response_b"
        
        # Extract confidence if available
        import re
        conf_match = re.search(r'confidence[:\s]*([0-9]*\.?[0-9]+)', content_lower)
        if conf_match:
            try:
                conf_value = float(conf_match.group(1))
                decision["confidence"] = conf_value if conf_value <= 1 else conf_value / 100
            except ValueError:
                pass
        
        # Extract reasoning
        decision["reasoning"] = content[:200] + "..." if len(content) > 200 else content
        
    except Exception as e:
        logger.debug(f"Error extracting validator decision: {e}")
    
    return decision


def _aggregate_validator_tokens(validator_results: Dict[str, LLMAnalysisResult]) -> Dict[str, int]:
    """Aggregate token usage across all validators"""
    total_usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    
    for result in validator_results.values():
        if result.token_usage:
            for key in total_usage:
                total_usage[key] += result.token_usage.get(key, 0)
    
    return total_usage


def _generate_final_sequential_insights(state: WorkflowState, consensus_decision: Dict[str, Any]) -> None:
    """Generate final insights based on sequential validation consensus"""
    try:
        insights = {
            "validation_approach": "sequential_comparison",
            "selected_response_source": consensus_decision["selected_response"],
            "consensus_strength": consensus_decision["decision_confidence"],
            "overall_confidence": consensus_decision["consensus_confidence"],
            "decision_summary": consensus_decision["rationale"],
            "validator_consensus": consensus_decision["vote_breakdown"]
        }
        
        # Add insights from winning analysis
        winning_metadata = consensus_decision.get("winning_analysis_metadata", {})
        insights["final_analysis_provider"] = winning_metadata.get("provider", "unknown")
        insights["final_analysis_confidence"] = winning_metadata.get("original_confidence")
        
        # Store final insights
        if not hasattr(state, 'final_insights'):
            state.final_insights = {}
        state.final_insights.update(insights)
        
        logger.info(f"✅ Generated final insights for {consensus_decision['selected_response']}")
        
    except Exception as e:
        logger.warning(f"Failed to generate final sequential insights: {e}")


def _count_available_analyses(state: WorkflowState) -> Dict[str, int]:
    """Legacy function - kept for compatibility"""
    """Count available analyses for cross-validation"""
    counts = {
        "cv_vision": 1 if state.vision_results else 0,
        "cv_severity": 1 if state.severity_assessment else 0,
        "slm_analysis": 1 if state.llm_results.slm_analysis and state.llm_results.slm_analysis.success else 0,
        "llm_analyses": len([a for a in state.llm_results.llm_analysis.values() if a.success]),
        "weather_context": 1 if state.weather_context else 0
    }
    
    counts["total"] = sum(counts.values())
    return counts


def _select_cross_validation_provider(llm_service) -> Optional[LLMProvider]:
    """Select the best provider for cross-validation analysis"""
    healthy_providers = llm_service.get_healthy_providers()
    
    # Check if specific cross-validation provider is configured and healthy
    if CROSS_VALIDATION_LLM_PROVIDER:
        try:
            preferred_provider = LLMProvider(CROSS_VALIDATION_LLM_PROVIDER)
            if preferred_provider in healthy_providers:
                return preferred_provider
        except ValueError:
            logger.warning(f"Invalid cross-validation provider configured: {CROSS_VALIDATION_LLM_PROVIDER}")
    
    # Priority order for cross-validation (most reasoning-capable first)
    cv_priority = [
        LLMProvider.OPENAI,     # GPT-4o for advanced meta-analysis
        LLMProvider.ANTHROPIC,  # Claude for thorough analysis
        LLMProvider.GOOGLE      # Gemini as fallback
    ]
    
    for provider in cv_priority:
        if provider in healthy_providers:
            return provider
    
    return None


def _prepare_cross_validation_context(state: WorkflowState, available_analyses: Dict[str, int]) -> Dict[str, Any]:
    """Prepare comprehensive context for cross-validation"""
    context = {
        "timestamp": datetime.utcnow().isoformat(),
        "trace_id": state.trace_id,
        "analysis_availability": available_analyses,
        "consensus_metrics": {
            "agreement_score": state.llm_results.agreement_score,
            "confidence_scores": state.llm_results.confidence_scores,
            "threshold": state.consensus_threshold
        },
        "processing_chain": state.node_execution_order.copy(),
        "total_processing_time": sum(state.processing_times.values()),
        "error_history": state.errors.copy()
    }
    
    # Add detailed analysis summaries
    analysis_summaries = {}
    
    # Computer Vision summary
    if state.vision_results:
        analysis_summaries["computer_vision"] = _summarize_cv_results(state.vision_results)
    
    # Severity assessment summary
    if state.severity_assessment:
        analysis_summaries["severity_assessment"] = {
            "score": state.severity_assessment.score_0_100,
            "band": state.severity_assessment.band.value,
            "confidence": state.severity_assessment.confidence,
            "factors": state.severity_assessment.factors,
            "method": "cv_model_based"
        }
    
    # Weather context summary
    if state.weather_context:
        analysis_summaries["weather_context"] = {
            "risk_band": state.weather_context.risk_band.value,
            "risk_factors": state.weather_context.factors,
            "indices": state.weather_context.indices.dict() if state.weather_context.indices else None
        }
    
    # SLM analysis summary
    if state.llm_results.slm_analysis and state.llm_results.slm_analysis.success:
        slm = state.llm_results.slm_analysis
        analysis_summaries["slm_analysis"] = {
            "provider": slm.provider,
            "confidence": slm.confidence,
            "has_structured_data": slm.parsed_data is not None,
            "key_findings": _extract_key_findings(slm.content, slm.parsed_data),
            "processing_time": slm.processing_time
        }
    
    # LLM analyses summary
    if state.llm_results.llm_analysis:
        llm_summaries = {}
        for provider, analysis in state.llm_results.llm_analysis.items():
            if analysis.success:
                llm_summaries[provider] = {
                    "confidence": analysis.confidence,
                    "has_structured_data": analysis.parsed_data is not None,
                    "key_findings": _extract_key_findings(analysis.content, analysis.parsed_data),
                    "token_usage": analysis.token_usage,
                    "quality_metrics": analysis.metadata.get("provider_performance", {})
                }
        analysis_summaries["llm_analyses"] = llm_summaries
    
    context["analysis_summaries"] = analysis_summaries
    
    # Add conflict detection
    context["potential_conflicts"] = _detect_analysis_conflicts(state)
    
    return context


def _summarize_cv_results(vision_results: Dict[str, Any]) -> Dict[str, Any]:
    """Create summary of computer vision results"""
    predictions = vision_results.get("predictions", [])
    
    summary = {
        "detection_count": len(predictions),
        "confidence_stats": {},
        "class_distribution": {},
        "spatial_coverage": {}
    }
    
    if predictions:
        confidences = [p.get("confidence", 0) for p in predictions]
        summary["confidence_stats"] = {
            "mean": sum(confidences) / len(confidences),
            "max": max(confidences),
            "min": min(confidences),
            "high_confidence_detections": len([c for c in confidences if c > 0.8])
        }
        
        # Class distribution
        classes = [p.get("class_name", "unknown") for p in predictions]
        class_counts = {}
        for cls in classes:
            class_counts[cls] = class_counts.get(cls, 0) + 1
        summary["class_distribution"] = class_counts
        
        # Primary detection
        if predictions:
            primary = max(predictions, key=lambda x: x.get("confidence", 0))
            summary["primary_detection"] = {
                "class": primary.get("class_name"),
                "confidence": primary.get("confidence"),
                "bbox": primary.get("bounding_box")
            }
    
    return summary


def _extract_key_findings(content: str, parsed_data: Optional[Dict[str, Any]]) -> List[str]:
    """Extract key findings from analysis content"""
    findings = []
    
    # Try structured data first
    if parsed_data:
        if "diagnosis" in parsed_data:
            diag = parsed_data["diagnosis"]
            if isinstance(diag, dict) and "primary_issue" in diag:
                findings.append(f"Primary issue: {diag['primary_issue']}")
        
        if "severity" in parsed_data:
            sev = parsed_data["severity"]
            if isinstance(sev, dict):
                if "score" in sev:
                    findings.append(f"Severity score: {sev['score']}")
                if "assessment" in sev:
                    findings.append(f"Assessment: {sev['assessment']}")
        
        if "recommendations" in parsed_data:
            rec = parsed_data["recommendations"]
            if isinstance(rec, dict) and "immediate_actions" in rec:
                actions = rec["immediate_actions"]
                if actions:
                    findings.append(f"Immediate actions: {len(actions)} recommended")
    
    # Fallback to content analysis
    if not findings:
        content_lower = content.lower()
        
        # Look for key diagnostic terms
        if "fungal" in content_lower:
            findings.append("Fungal disease suspected")
        elif "bacterial" in content_lower:
            findings.append("Bacterial disease suspected")
        elif "viral" in content_lower:
            findings.append("Viral disease suspected")
        elif "pest" in content_lower:
            findings.append("Pest infestation detected")
        
        # Look for severity indicators
        if "severe" in content_lower:
            findings.append("Severe condition")
        elif "moderate" in content_lower:
            findings.append("Moderate condition")
        elif "mild" in content_lower:
            findings.append("Mild condition")
        
        # Look for urgency indicators
        if "immediate" in content_lower or "urgent" in content_lower:
            findings.append("Immediate action required")
        elif "monitor" in content_lower:
            findings.append("Monitoring recommended")
    
    return findings[:5]  # Limit to top 5 findings


def _detect_analysis_conflicts(state: WorkflowState) -> List[Dict[str, Any]]:
    """Detect potential conflicts between different analyses"""
    conflicts = []
    
    # Severity conflicts
    severity_assessments = []
    
    # CV severity
    if state.severity_assessment:
        severity_assessments.append({
            "source": "computer_vision",
            "score": state.severity_assessment.score_0_100,
            "band": state.severity_assessment.band.value,
            "confidence": state.severity_assessment.confidence
        })
    
    # SLM severity assessment
    if (state.llm_results.slm_analysis and 
        state.llm_results.slm_analysis.parsed_data and
        "severity" in state.llm_results.slm_analysis.parsed_data):
        slm_sev = state.llm_results.slm_analysis.parsed_data["severity"]
        if isinstance(slm_sev, dict) and "score" in slm_sev:
            severity_assessments.append({
                "source": "slm_analysis",
                "score": slm_sev["score"],
                "assessment": slm_sev.get("assessment"),
                "confidence": state.llm_results.slm_analysis.confidence
            })
    
    # LLM severity assessments
    for provider, analysis in state.llm_results.llm_analysis.items():
        if (analysis.success and analysis.parsed_data and 
            "severity" in analysis.parsed_data):
            llm_sev = analysis.parsed_data["severity"]
            if isinstance(llm_sev, dict) and "score" in llm_sev:
                severity_assessments.append({
                    "source": f"llm_{provider}",
                    "score": llm_sev["score"],
                    "assessment": llm_sev.get("assessment"),
                    "confidence": analysis.confidence
                })
    
    # Check for severity conflicts
    if len(severity_assessments) >= 2:
        scores = [s["score"] for s in severity_assessments if s.get("score") is not None]
        if scores:
            score_range = max(scores) - min(scores)
            if score_range > 30:  # More than 30 points difference
                conflicts.append({
                    "type": "severity_discrepancy",
                    "description": f"Large severity score range: {min(scores)}-{max(scores)}",
                    "assessments": severity_assessments,
                    "severity": "high" if score_range > 50 else "medium"
                })
    
    # Diagnostic conflicts
    diagnoses = []
    
    # Extract diagnoses from various sources
    if state.vision_results and state.vision_results.get("predictions"):
        primary_pred = max(
            state.vision_results["predictions"], 
            key=lambda x: x.get("confidence", 0)
        )
        diagnoses.append({
            "source": "computer_vision",
            "diagnosis": primary_pred.get("class_name"),
            "confidence": primary_pred.get("confidence")
        })
    
    # Add LLM diagnoses
    for source_name, analysis in [("slm_analysis", state.llm_results.slm_analysis)] + list(state.llm_results.llm_analysis.items()):
        if (analysis and analysis.success and analysis.parsed_data and
            "diagnosis" in analysis.parsed_data):
            diag_data = analysis.parsed_data["diagnosis"]
            if isinstance(diag_data, dict) and "primary_issue" in diag_data:
                diagnoses.append({
                    "source": source_name,
                    "diagnosis": diag_data["primary_issue"],
                    "confidence": analysis.confidence
                })
    
    # Check for diagnostic conflicts
    if len(diagnoses) >= 2:
        unique_diagnoses = set(d["diagnosis"] for d in diagnoses if d["diagnosis"])
        if len(unique_diagnoses) > 1:
            conflicts.append({
                "type": "diagnostic_disagreement",
                "description": f"Multiple different diagnoses: {', '.join(unique_diagnoses)}",
                "diagnoses": diagnoses,
                "severity": "high" if len(unique_diagnoses) > 2 else "medium"
            })
    
    return conflicts


def _extract_consensus_confidence(content: str) -> Optional[float]:
    """Extract consensus confidence from cross-validation response"""
    try:
        import re
        
        # Look for consensus-specific confidence patterns
        patterns = [
            r'"consensus_confidence"[:\s]*([0-9]*\.?[0-9]+)',
            r'"overall_confidence"[:\s]*([0-9]*\.?[0-9]+)',
            r'consensus confidence[:\s]*([0-9]*\.?[0-9]+)%?',
            r'final confidence[:\s]*([0-9]*\.?[0-9]+)%?'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content.lower())
            if match:
                value = float(match.group(1))
                return min(1.0, max(0.0, value if value <= 1 else value / 100))
        
        # Try JSON parsing
        try:
            json_blocks = re.findall(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            for block in json_blocks:
                parsed = json.loads(block)
                if isinstance(parsed, dict):
                    for key in ["consensus_confidence", "overall_confidence", "final_confidence"]:
                        if key in parsed:
                            value = float(parsed[key])
                            return min(1.0, max(0.0, value if value <= 1 else value / 100))
        except (json.JSONDecodeError, ValueError):
            pass
            
    except Exception as e:
        logger.debug(f"Failed to extract consensus confidence: {e}")
    
    return None


def _process_consensus_results(state: WorkflowState, cv_parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process and structure consensus results from cross-validation"""
    consensus = {
        "final_diagnosis": {},
        "final_severity": {},
        "final_recommendations": {},
        "confidence_assessment": {},
        "validation_summary": {},
        "conflict_resolution": {},
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Extract final diagnosis
    if "diagnosis" in cv_parsed_data:
        diag_data = cv_parsed_data["diagnosis"]
        if isinstance(diag_data, dict):
            consensus["final_diagnosis"] = {
                "primary_issue": diag_data.get("primary_issue"),
                "confidence": diag_data.get("confidence"),
                "supporting_evidence": diag_data.get("supporting_evidence", []),
                "alternative_diagnoses": diag_data.get("alternatives", []),
                "consensus_level": diag_data.get("consensus_level", "unknown")
            }
    
    # Extract final severity
    if "severity" in cv_parsed_data:
        sev_data = cv_parsed_data["severity"]
        if isinstance(sev_data, dict):
            consensus["final_severity"] = {
                "consensus_score": sev_data.get("score"),
                "severity_band": sev_data.get("band"),
                "confidence": sev_data.get("confidence"),
                "contributing_factors": sev_data.get("factors", []),
                "analysis_agreement": sev_data.get("analysis_agreement", "unknown")
            }
    
    # Extract final recommendations
    if "recommendations" in cv_parsed_data:
        rec_data = cv_parsed_data["recommendations"]
        if isinstance(rec_data, dict):
            consensus["final_recommendations"] = {
                "immediate_actions": rec_data.get("immediate_actions", []),
                "short_term_actions": rec_data.get("short_term", []),
                "long_term_actions": rec_data.get("long_term", []),
                "monitoring_plan": rec_data.get("monitoring", []),
                "confidence": rec_data.get("confidence"),
                "priority_level": rec_data.get("priority", "medium")
            }
    
    # Extract confidence assessment
    if "confidence_analysis" in cv_parsed_data:
        conf_data = cv_parsed_data["confidence_analysis"]
        if isinstance(conf_data, dict):
            consensus["confidence_assessment"] = {
                "overall_confidence": conf_data.get("overall"),
                "analysis_reliability": conf_data.get("reliability"),
                "uncertainty_factors": conf_data.get("uncertainty_factors", []),
                "confidence_sources": conf_data.get("sources", {}),
                "recommendation_strength": conf_data.get("recommendation_strength")
            }
    
    # Extract validation summary
    if "validation" in cv_parsed_data:
        val_data = cv_parsed_data["validation"]
        if isinstance(val_data, dict):
            consensus["validation_summary"] = {
                "analyses_validated": val_data.get("analyses_count", 0),
                "agreement_level": val_data.get("agreement_level"),
                "conflicts_detected": val_data.get("conflicts", []),
                "resolution_strategy": val_data.get("resolution_strategy"),
                "validation_confidence": val_data.get("confidence")
            }
    
    return consensus


def _update_consensus_metrics(state: WorkflowState, consensus_result: Dict[str, Any]) -> None:
    """Update consensus metrics based on cross-validation results"""
    try:
        # Update agreement score based on validation results
        if "validation_summary" in consensus_result:
            val_summary = consensus_result["validation_summary"]
            if "agreement_level" in val_summary:
                agreement_mapping = {
                    "high": 0.9,
                    "medium": 0.7,
                    "low": 0.5,
                    "very_low": 0.3
                }
                agreement_str = val_summary["agreement_level"].lower()
                if agreement_str in agreement_mapping:
                    state.llm_results.agreement_score = agreement_mapping[agreement_str]
        
        # Update confidence scores with consensus confidence
        if "confidence_assessment" in consensus_result:
            conf_assess = consensus_result["confidence_assessment"]
            if "overall_confidence" in conf_assess:
                # Add consensus confidence to confidence scores
                state.llm_results.confidence_scores["consensus"] = conf_assess["overall_confidence"]
        
        logger.debug("Updated consensus metrics based on cross-validation")
        
    except Exception as e:
        logger.warning(f"Failed to update consensus metrics: {e}")


def _generate_final_insights(state: WorkflowState) -> None:
    """Generate final integrated insights from all analyses"""
    try:
        final_insights = {
            "analysis_summary": {
                "total_analyses": len(state.node_execution_order),
                "successful_llm_providers": len([p for p in state.llm_results.llm_analysis.values() if p.success]),
                "consensus_achieved": state.llm_results.agreement_score is not None and state.llm_results.agreement_score >= state.consensus_threshold,
                "cross_validation_completed": state.llm_results.cross_validation is not None and state.llm_results.cross_validation.success
            },
            "confidence_metrics": {
                "overall_confidence": _calculate_overall_confidence(state),
                "confidence_distribution": state.llm_results.confidence_scores.copy(),
                "agreement_score": state.llm_results.agreement_score,
                "consensus_threshold_met": state.llm_results.agreement_score is not None and state.llm_results.agreement_score >= state.consensus_threshold
            },
            "processing_metrics": {
                "total_processing_time": sum(state.processing_times.values()),
                "processing_breakdown": state.processing_times.copy(),
                "parallel_processing_time": state.llm_results.parallel_processing_time,
                "token_usage": state.llm_results.total_token_usage
            },
            "quality_indicators": {
                "errors_encountered": len(state.errors),
                "all_nodes_successful": len(state.errors) == 0,
                "consensus_quality": _assess_consensus_quality(state),
                "recommendation_confidence": _assess_recommendation_confidence(state)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store final insights
        if not hasattr(state, 'final_insights'):
            state.final_insights = {}
        state.final_insights.update(final_insights)
        
        logger.info(f"Generated final insights - Overall confidence: {final_insights['confidence_metrics']['overall_confidence']:.3f}")
        
    except Exception as e:
        logger.warning(f"Failed to generate final insights: {e}")


def _calculate_overall_confidence(state: WorkflowState) -> float:
    """Calculate overall confidence across all analyses"""
    confidences = []
    weights = []
    
    # CV model confidence (if available)
    if state.severity_assessment and state.severity_assessment.confidence:
        confidences.append(state.severity_assessment.confidence)
        weights.append(0.3)  # 30% weight for CV
    
    # SLM confidence
    if state.llm_results.slm_analysis and state.llm_results.slm_analysis.confidence:
        confidences.append(state.llm_results.slm_analysis.confidence)
        weights.append(0.2)  # 20% weight for SLM
    
    # LLM confidences (averaged)
    llm_confidences = [
        analysis.confidence for analysis in state.llm_results.llm_analysis.values()
        if analysis.success and analysis.confidence is not None
    ]
    if llm_confidences:
        avg_llm_confidence = sum(llm_confidences) / len(llm_confidences)
        confidences.append(avg_llm_confidence)
        weights.append(0.4)  # 40% weight for LLM average
    
    # Cross-validation confidence
    if state.llm_results.cross_validation and state.llm_results.cross_validation.confidence:
        confidences.append(state.llm_results.cross_validation.confidence)
        weights.append(0.1)  # 10% weight for cross-validation
    
    # Calculate weighted average
    if confidences and weights:
        # Normalize weights to sum to 1
        total_weight = sum(weights)
        normalized_weights = [w / total_weight for w in weights]
        
        weighted_confidence = sum(c * w for c, w in zip(confidences, normalized_weights))
        return weighted_confidence
    
    return 0.5  # Default moderate confidence


def _assess_consensus_quality(state: WorkflowState) -> str:
    """Assess the quality of consensus achieved"""
    if state.llm_results.agreement_score is None:
        return "no_consensus"
    
    agreement = state.llm_results.agreement_score
    llm_count = len([a for a in state.llm_results.llm_analysis.values() if a.success])
    
    if agreement >= 0.9 and llm_count >= 2:
        return "high_quality"
    elif agreement >= 0.7 and llm_count >= 2:
        return "good_quality"
    elif agreement >= 0.5:
        return "moderate_quality"
    else:
        return "low_quality"


def _assess_recommendation_confidence(state: WorkflowState) -> str:
    """Assess confidence in final recommendations"""
    overall_conf = _calculate_overall_confidence(state)
    consensus_quality = _assess_consensus_quality(state)
    
    if overall_conf >= 0.8 and consensus_quality in ["high_quality", "good_quality"]:
        return "high_confidence"
    elif overall_conf >= 0.6 and consensus_quality != "low_quality":
        return "medium_confidence"
    elif overall_conf >= 0.4:
        return "low_confidence"
    else:
        return "very_low_confidence"


# Export for graph construction
__all__ = ["cross_validation_node"]
