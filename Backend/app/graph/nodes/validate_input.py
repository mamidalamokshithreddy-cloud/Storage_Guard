"""
Input Validation Node - Schema checks, image validation, and EXIF sanitization
"""

import logging
import time
from typing import Dict, Any, List
from pathlib import Path

from app.schemas.postgres_base_models import WorkflowState, ImageMetadata
from app.models.transforms import ImageTransforms

logger = logging.getLogger(__name__)


async def validate_input_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Validate input images and payload
    
    Args:
        state: Current workflow state
        
    Returns:
        Updated state with validation results
    """
    start_time = time.time()
    node_name = "validate_input"
    
    logger.info(
        f"🔍 Starting input validation",
        extra={"trace_id": state.trace_id}
    )
    
    try:
        errors = []
        validated_images = []
        
        # Validate payload
        if not state.payload:
            errors.append("Missing analysis payload")
        else:
            # Validate crop type
            if not state.payload.crop:
                errors.append("Missing crop type")
            
            # Validate growth stage
            if not state.payload.stage:
                errors.append("Missing growth stage")
        
        # Validate images
        images_to_validate = []
        
        # Check multiple sources for images
        if state.processed_images:
            images_to_validate = state.processed_images
        elif state.payload and state.payload.images:
            images_to_validate = state.payload.images
        elif state.images:
            # Extract file paths from ImageMetadata objects
            images_to_validate = [img.file_path for img in state.images if img.file_path]
        
        if not images_to_validate:
            errors.append("No images provided for analysis")
        else:
            for i, image_path in enumerate(images_to_validate):
                try:
                    # Validate image file
                    is_valid, error_msg, metadata = ImageTransforms.validate_image(image_path)
                    
                    if not is_valid:
                        errors.append(f"Image {i+1}: {error_msg}")
                        continue
                    
                    # Check image quality requirements
                    warnings = []
                    if metadata:
                        # Minimum resolution check (warning only, don't skip)
                        if metadata["width"] < 224 or metadata["height"] < 224:
                            warnings.append(f"Image {i+1}: Resolution too low (minimum 224x224)")
                        
                        # Check for reasonable aspect ratio (warning only)
                        aspect_ratio = metadata["width"] / metadata["height"]
                        if aspect_ratio < 0.1 or aspect_ratio > 10:
                            warnings.append(f"Image {i+1}: Unusual aspect ratio ({aspect_ratio:.2f})")
                        
                        # Update image metadata
                        if i < len(state.images):
                            state.images[i].exif_data = metadata.get("exif", {})
                    
                    # Add warnings to errors list but still include image for processing
                    errors.extend(warnings)
                    validated_images.append(image_path)
                    
                except Exception as e:
                    errors.append(f"Image {i+1}: Validation failed - {str(e)}")
        
        # Check for critical errors
        critical_errors = [e for e in errors if any(keyword in e.lower() 
                          for keyword in ["missing", "no images", "failed to load"])]
        
        if critical_errors:
            logger.error(
                f"Critical validation errors: {critical_errors}",
                extra={"trace_id": state.trace_id}
            )
            return {
                "errors": state.errors + critical_errors,
                "processing_times": {
                    **state.processing_times,
                    node_name: time.time() - start_time
                }
            }
        
        # Log warnings for non-critical errors
        if errors:
            logger.warning(
                f"Validation warnings: {errors}",
                extra={"trace_id": state.trace_id}
            )
        
        # Update validated images list
        state.processed_images = validated_images
        
        # Calculate validation score
        validation_score = 1.0 - (len(errors) * 0.1)  # Reduce score for each warning
        validation_score = max(0.0, validation_score)
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"✅ Input validation completed",
            extra={
                "trace_id": state.trace_id,
                "valid_images": len(validated_images),
                "warnings": len(errors),
                "validation_score": validation_score,
                "processing_time": processing_time
            }
        )
        
        return {
            "processed_images": validated_images,
            "errors": state.errors + errors,
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        error_msg = f"Input validation node failed: {str(e)}"
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


def should_continue_after_validation(state: WorkflowState) -> bool:
    """
    Determine if workflow should continue after validation
    
    Args:
        state: Current workflow state
        
    Returns:
        True if workflow should continue, False otherwise
    """
    # Check for critical errors that would prevent analysis
    critical_keywords = ["missing", "no images", "failed to load", "invalid format"]
    
    for error in state.errors:
        if any(keyword in error.lower() for keyword in critical_keywords):
            logger.warning(
                f"Stopping workflow due to critical error: {error}",
                extra={"trace_id": state.trace_id}
            )
            return False
    
    # Check if we have any valid images
    if not state.processed_images:
        logger.warning(
            "Stopping workflow: No valid images to process",
            extra={"trace_id": state.trace_id}
        )
        return False
    
    return True
