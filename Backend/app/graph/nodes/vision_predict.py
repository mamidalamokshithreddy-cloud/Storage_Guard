"""
Vision Prediction Node - Computer vision inference for pest and disease detection
"""

import logging
import time
from typing import Dict, Any, List, Optional

from app.schemas.postgres_base_models import WorkflowState, Diagnosis, Alternative
# from app.models.vision_classifier import get_classifier  # Vision classifier disabled
from PIL import Image as _PILImage
from app.services.llm_service import get_llm_service, LLMProvider, LLMResponseType

# Handle optional imports gracefully
try:
    from app.models.infer import ModelInference
    INFERENCE_AVAILABLE = True
except (ImportError, RuntimeError) as e:
    ModelInference = None
    INFERENCE_AVAILABLE = False

logger = logging.getLogger(__name__)


async def vision_predict_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Run computer vision inference on preprocessed images

    Args:
        state: Current workflow state

    Returns:
        Updated state with vision prediction results
    """
    start_time = time.time()
    node_name = "vision_predict"

    logger.info(
        f"🧠 Starting vision prediction",
        extra={
            "trace_id": state.trace_id,
            "image_count": len(state.processed_images)
        }
    )

    try:
        llm_service = get_llm_service()

        predictions: List[Dict[str, Any]] = []
        for i, image_path in enumerate(state.processed_images):
            try:
                with open(image_path, 'rb') as f:
                    img_bytes = f.read()

                # Prefer Google (Gemini) or OpenAI for vision
                healthy = llm_service.get_healthy_providers() or []
                provider = None
                for p in (LLMProvider.GOOGLE, LLMProvider.OPENAI, LLMProvider.ANTHROPIC):
                    if p in healthy:
                        provider = p
                        break
                provider = provider or (healthy[0] if healthy else LLMProvider.GOOGLE)

                resp = await llm_service.analyze_image_with_provider(
                    provider=provider,
                    image_data=img_bytes,
                    prompt=("Analyze this leaf image for disease or pest condition."
                            " Return JSON with fields: diagnosis, confidence, alternatives[] (label, confidence)."),
                    response_type=LLMResponseType.LLM_VISION_ANALYSIS,
                )

                parsed = resp.parse_json_content() if hasattr(resp, 'parse_json_content') else None
                label = str((parsed or {}).get("diagnosis") or (parsed or {}).get("label") or "unknown")
                try:
                    confidence = float((parsed or {}).get("confidence") or 0.0)
                except Exception:
                    confidence = 0.0
                alt_list: List[Alternative] = []
                for alt in (parsed or {}).get("alternatives", []) or []:
                    try:
                        alt_list.append(Alternative(label=str(alt.get("label") or alt.get("diagnosis") or "unknown"), confidence=float(alt.get("confidence") or 0.0)))
                    except Exception:
                        pass

                predictions.append({
                    "image_index": i,
                    "image_path": image_path,
                    "label": label,
                    "confidence": confidence,
                    "alternatives": alt_list,
                })
            except Exception as e:
                msg = f"LLM vision failed for image {i+1}: {e}"
                logger.error(msg, extra={"trace_id": state.trace_id})
                state.errors.append(msg)

        if not predictions:
            error_msg = "No successful predictions generated"
            logger.error(error_msg, extra={"trace_id": state.trace_id})
            return {
                **state.dict(),
                "errors": state.errors + [error_msg],
                "processing_times": {**state.processing_times, node_name: time.time() - start_time},
            }

        aggregated_diagnosis = _aggregate_predictions(predictions, state.trace_id)

        # No CV detector when classifier disabled
        detection_results = None

        vision_results = {
            "individual_predictions": predictions,
            "aggregated_diagnosis": aggregated_diagnosis,
            "detection_results": detection_results,
            "model_info": {"vision": "disabled", "mode": "llm_only"},
        }

        processing_time = time.time() - start_time
        logger.info(
            "✅ Vision prediction completed",
            extra={
                "trace_id": state.trace_id,
                "predictions": len(predictions),
                "primary_label": aggregated_diagnosis.label,
                "avg_confidence": aggregated_diagnosis.confidence,
                "processing_time": processing_time,
            },
        )

        return {
            "vision_results": vision_results,
            "processing_times": {**state.processing_times, node_name: processing_time},
        }

    except Exception as e:
        error_msg = f"Vision prediction node failed: {e}"
        logger.error(error_msg, extra={"trace_id": state.trace_id}, exc_info=True)
        return {
            "errors": state.errors + [error_msg],
            "processing_times": {**state.processing_times, node_name: time.time() - start_time},
        }


def _aggregate_predictions(predictions: List[Dict], trace_id: str) -> Diagnosis:
    """
    Aggregate predictions from multiple images into a single diagnosis
    
    Args:
        predictions: List of individual image predictions
        trace_id: Workflow trace ID
        
    Returns:
        Aggregated diagnosis
    """
    try:
        if not predictions:
            return Diagnosis(
                label="unknown",
                confidence=0.0,
                alternatives=[]
            )
        
        # Count occurrences of each label across all images
        label_votes = {}
        label_confidences = {}
        all_alternatives = {}
        
        for pred in predictions:
            label = pred["label"]
            confidence = pred["confidence"]
            
            # Count votes
            label_votes[label] = label_votes.get(label, 0) + 1
            
            # Track confidence scores
            if label not in label_confidences:
                label_confidences[label] = []
            label_confidences[label].append(confidence)
            
            # Collect alternatives
            for alt in pred["alternatives"]:
                alt_label = alt.label
                if alt_label not in all_alternatives:
                    all_alternatives[alt_label] = []
                all_alternatives[alt_label].append(alt.confidence)
        
        # Determine primary diagnosis based on voting and confidence
        best_label = None
        best_score = 0.0
        
        for label, vote_count in label_votes.items():
            # Calculate weighted score: vote ratio * average confidence
            vote_ratio = vote_count / len(predictions)
            avg_confidence = sum(label_confidences[label]) / len(label_confidences[label])
            score = vote_ratio * avg_confidence
            
            if score > best_score:
                best_score = score
                best_label = label
        
        # Calculate final confidence for primary diagnosis
        primary_confidence = sum(label_confidences[best_label]) / len(label_confidences[best_label])
        
        # Create alternatives list
        alternatives = []
        for label, confidences in all_alternatives.items():
            if label != best_label:
                avg_conf = sum(confidences) / len(confidences)
                vote_count = label_votes.get(label, 0)
                alternatives.append(Alternative(
                    label=label,
                    confidence=avg_conf,
                    description=f"Detected in {vote_count}/{len(predictions)} images"
                ))
        
        # Sort alternatives by confidence
        alternatives.sort(key=lambda x: x.confidence, reverse=True)
        alternatives = alternatives[:4]  # Keep top 4 alternatives
        
        # Calculate affected area estimate (simplified)
        affected_area_percent = None
        if best_label != "healthy" and primary_confidence > 0.5:
            # Rough estimate based on confidence and detection frequency
            area_estimate = (primary_confidence * 50) + (label_votes[best_label] / len(predictions) * 30)
            affected_area_percent = min(100.0, area_estimate)
        
        diagnosis = Diagnosis(
            label=best_label or "unknown",
            confidence=primary_confidence,
            alternatives=alternatives,
            affected_area_percent=affected_area_percent
        )
        
        logger.debug(
            f"🎯 Aggregated diagnosis: {diagnosis.label} ({diagnosis.confidence:.3f})",
            extra={"trace_id": trace_id}
        )
        
        return diagnosis
        
    except Exception as e:
        logger.error(f"Prediction aggregation failed: {e}")
        return Diagnosis(
            label="unknown",
            confidence=0.0,
            alternatives=[]
        )


async def _run_detection_if_available(image_paths: List[str], model_manager, 
                                    trace_id: str) -> Optional[Dict]:
    """
    Run detection model if available for additional insights
    
    Args:
        image_paths: List of preprocessed image paths
        model_manager: Model manager instance
        trace_id: Workflow trace ID
        
    Returns:
        Detection results or None if not available
    """
    try:
        detection_model = model_manager.get_detection_model()
        if not detection_model:
            logger.debug("No detection model available", extra={"trace_id": trace_id})
            return None
        
        detection_results = {
            "detections": [],
            "total_detections": 0,
            "detection_summary": {}
        }
        
        for i, image_path in enumerate(image_paths):
            try:
                # Run detection (assuming detection model has detection-specific methods)
                if hasattr(detection_model, 'postprocess_detections'):
                    # Get image shape for detection postprocessing
                    from app.models.transforms import ImageTransforms
                    is_valid, _, metadata = ImageTransforms.validate_image(image_path)
                    
                    if is_valid and metadata:
                        image_shape = (metadata["height"], metadata["width"])
                        
                        # Run inference
                        image_array = detection_model.preprocess_image(image_path)
                        outputs = detection_model.run_inference(image_array)
                        
                        # Get detections
                        label, confidence, alternatives, bounding_boxes = detection_model.postprocess_detections(
                            outputs, image_shape
                        )
                        
                        detection_results["detections"].append({
                            "image_index": i,
                            "detections": bounding_boxes,
                            "count": len(bounding_boxes)
                        })
                        
                        detection_results["total_detections"] += len(bounding_boxes)
                        
                        # Update summary
                        for bbox in bounding_boxes:
                            class_name = bbox["class"]
                            detection_results["detection_summary"][class_name] = \
                                detection_results["detection_summary"].get(class_name, 0) + 1
                
            except Exception as e:
                logger.warning(f"Detection failed for image {i+1}: {e}")
        
        if detection_results["total_detections"] > 0:
            logger.info(
                f"🔍 Detection completed: {detection_results['total_detections']} detections",
                extra={"trace_id": trace_id}
            )
            return detection_results
        else:
            logger.debug("No detections found", extra={"trace_id": trace_id})
            return None
            
    except Exception as e:
        logger.warning(f"Detection model inference failed: {e}")
        return None


def should_continue_after_vision(state: WorkflowState) -> bool:
    """
    Determine if workflow should continue after vision prediction
    
    Args:
        state: Current workflow state
        
    Returns:
        True if workflow should continue, False otherwise
    """
    # Check if we have vision results
    if not state.vision_results:
        logger.warning(
            "Stopping workflow: No vision prediction results",
            extra={"trace_id": state.trace_id}
        )
        return False
    
    # Check if we have a valid diagnosis
    aggregated = state.vision_results.get("aggregated_diagnosis")
    if not aggregated or aggregated.label == "unknown":
        logger.warning(
            "Continuing with uncertainty: No clear diagnosis",
            extra={"trace_id": state.trace_id}
        )
        # Continue but mark as uncertain
        return True
    
    return True


def is_prediction_uncertain(state: WorkflowState) -> bool:
    """
    Check if prediction has high uncertainty requiring special handling
    
    Args:
        state: Current workflow state
        
    Returns:
        True if prediction is uncertain
    """
    if not state.vision_results:
        return True
    
    diagnosis = state.vision_results.get("aggregated_diagnosis")
    if not diagnosis:
        return True
    
    # Check confidence threshold
    if diagnosis.confidence < 0.6:
        return True
    
    # Check margin between top predictions
    alternatives = diagnosis.alternatives
    if alternatives and len(alternatives) > 0:
        top_alt_confidence = alternatives[0].confidence
        margin = diagnosis.confidence - top_alt_confidence
        
        if margin < 0.2:  # Small margin between top predictions
            return True
    
    return False
