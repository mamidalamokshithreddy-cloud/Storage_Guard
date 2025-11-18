"""
Preprocessing Node - Image preprocessing, resizing, normalization, and tiling
"""

import logging
import time
from typing import Dict, Any, List
from pathlib import Path
import asyncio
from app.schemas.postgres_base_models import WorkflowState, ImageSource
from app.models.transforms import ImageTransforms
from app.core.config import settings

logger = logging.getLogger(__name__)


async def preprocess_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Preprocess images for model inference
    
    Args:
        state: Current workflow state
        
    Returns:
        Updated state with preprocessed images
    """
    start_time = time.time()
    node_name = "preprocess"
    
    logger.info(
        f"🔄 Starting image preprocessing",
        extra={
            "trace_id": state.trace_id,
            "image_count": len(state.processed_images)
        }
    )
    
    try:
        preprocessed_images = []
        preprocessing_metadata = []
        
        for i, image_path in enumerate(state.processed_images):
            try:
                image_meta = state.images[i] if i < len(state.images) else None
                processed_path = await _preprocess_single_image(
                    image_path=image_path,
                    image_meta=image_meta,
                    trace_id=state.trace_id,
                    index=i
                )
                
                if processed_path:
                    preprocessed_images.append(processed_path)
                    preprocessing_metadata.append({
                        "original_path": image_path,
                        "processed_path": processed_path,
                        "index": i
                    })
                else:
                    logger.warning(
                        f"Failed to preprocess image {i+1}",
                        extra={"trace_id": state.trace_id}
                    )
                    
            except Exception as e:
                error_msg = f"Image {i+1} preprocessing failed: {str(e)}"
                logger.error(
                    error_msg,
                    extra={"trace_id": state.trace_id}
                )
                state.errors.append(error_msg)
        
        if not preprocessed_images:
            error_msg = "No images successfully preprocessed"
            logger.error(error_msg, extra={"trace_id": state.trace_id})
            return {
                "errors": state.errors + [error_msg],
                "processing_times": {
                    **state.processing_times,
                    node_name: time.time() - start_time
                }
            }
        
        processing_time = time.time() - start_time
        
        logger.info(
            f"✅ Image preprocessing completed",
            extra={
                "trace_id": state.trace_id,
                "original_count": len(state.processed_images),
                "processed_count": len(preprocessed_images),
                "processing_time": processing_time
            }
        )
        
        return {
            "processed_images": preprocessed_images,
            "processing_times": {
                **state.processing_times,
                node_name: processing_time
            }
        }
        
    except Exception as e:
        error_msg = f"Preprocessing node failed: {str(e)}"
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


async def _preprocess_single_image(image_path: str, image_meta: Any, 
                                 trace_id: str, index: int) -> str:
    """
    Preprocess a single image
    
    Args:
        image_path: Path to input image
        image_meta: Image metadata
        trace_id: Workflow trace ID
        index: Image index
        
    Returns:
        Path to preprocessed image
    """
    try:
        path = Path(image_path)
        output_dir = path.parent / "preprocessed"
        output_dir.mkdir(exist_ok=True)
        
        # Determine preprocessing strategy based on image source
        image_source = getattr(image_meta, 'source', ImageSource.phone) if image_meta else ImageSource.phone
        
        if image_source == ImageSource.drone:
            # Handle large drone images - may need tiling
            return await _preprocess_drone_image(image_path, output_dir, trace_id, index)
        else:
            # Handle phone/camera images - standard preprocessing
            return await _preprocess_standard_image(image_path, output_dir, trace_id, index)
            
    except Exception as e:
        logger.error(f"Single image preprocessing failed: {e}")
        return None


async def _preprocess_drone_image(image_path: str, output_dir: Path, 
                                trace_id: str, index: int) -> str:
    """
    Preprocess drone images (may include tiling for very large images)
    
    Args:
        image_path: Input image path
        output_dir: Output directory
        trace_id: Workflow trace ID
        index: Image index
        
    Returns:
        Path to preprocessed image or primary tile
    """
    try:
        # Check image dimensions
        is_valid, _, metadata = ImageTransforms.validate_image(image_path)
        if not is_valid or not metadata:
            return None
        
        width, height = metadata["width"], metadata["height"]
        max_dimension = max(width, height)
        
        # If image is very large (> 4K), consider tiling
        if max_dimension > 4096:
            logger.info(
                f"🧩 Large drone image detected ({width}x{height}), considering tiling",
                extra={"trace_id": trace_id}
            )
            
            # Create tiles for processing
            tile_dir = output_dir / f"tiles_{index}"
            tile_paths = ImageTransforms.tile_large_image(
                image_path=image_path,
                tile_size=(1024, 1024),
                overlap=128,
                output_dir=str(tile_dir)
            )
            
            if tile_paths:
                # For now, return the first tile as primary
                # In a full implementation, you'd process all tiles and merge results
                logger.info(
                    f"Created {len(tile_paths)} tiles, using first tile for analysis",
                    extra={"trace_id": trace_id}
                )
                return tile_paths[0]
        
        # Standard processing for smaller drone images
        return await _preprocess_standard_image(image_path, output_dir, trace_id, index)
        
    except Exception as e:
        logger.error(f"Drone image preprocessing failed: {e}")
        return None


async def _preprocess_standard_image(image_path: str, output_dir: Path, 
                                   trace_id: str, index: int) -> str:
    """
    Standard image preprocessing (resize, enhance, normalize)
    
    Args:
        image_path: Input image path
        output_dir: Output directory
        trace_id: Workflow trace ID
        index: Image index
        
    Returns:
        Path to preprocessed image
    """
    try:
        path = Path(image_path)
        
        # Step 1: Remove EXIF data for privacy
        exif_cleaned_path = output_dir / f"{path.stem}_noexif_{index}{path.suffix}"
        try:
            cleaned_path = ImageTransforms.remove_exif(image_path, str(exif_cleaned_path))
        except Exception as e:
            logger.warning(f"EXIF removal failed, using original: {e}")
            cleaned_path = image_path
        
        # Step 2: Apply quality enhancements
        enhanced_path = output_dir / f"{path.stem}_enhanced_{index}{path.suffix}"
        try:
            enhanced = ImageTransforms.apply_quality_enhancements(cleaned_path, str(enhanced_path))
        except Exception as e:
            logger.warning(f"Quality enhancement failed, using cleaned image: {e}")
            enhanced = cleaned_path
        
        # Step 3: Resize to model input size if needed
        is_valid, _, metadata = ImageTransforms.validate_image(enhanced)
        if is_valid and metadata:
            width, height = metadata["width"], metadata["height"]
            
            # Resize if image is too large or too small for optimal processing
            if max(width, height) > 1024 or min(width, height) < 224:
                # For small images, upscale to at least 512x512
                # For large images, downscale to 1024x1024
                if min(width, height) < 224:
                    target_size = (512, 512)
                    logger.info(
                        f"🔍 Upscaling small image from {width}x{height} to {target_size}",
                        extra={"trace_id": trace_id}
                    )
                else:
                    target_size = (1024, 1024)
                
                resized_path = output_dir / f"{path.stem}_resized_{index}{path.suffix}"
                final_path = ImageTransforms.resize_image(
                    enhanced, target_size, str(resized_path), maintain_aspect=True
                )
            else:
                final_path = enhanced
        else:
            # If validation fails, still try to use the enhanced image
            logger.warning(
                f"⚠️ Image validation failed but continuing with enhanced image",
                extra={"trace_id": trace_id}
            )
            final_path = enhanced
        
        # Step 4: Extract NDVI for vegetation analysis (optional)
        ndvi_path = ImageTransforms.extract_ndvi(final_path)
        if ndvi_path:
            logger.debug(
                f"🌱 NDVI extracted for analysis enhancement",
                extra={"trace_id": trace_id}
            )
        
        logger.debug(
            f"📸 Preprocessed image {index+1}: {image_path} → {final_path}",
            extra={"trace_id": trace_id}
        )
        
        return final_path
        
    except Exception as e:
        logger.error(f"Standard image preprocessing failed: {e}")
        return None


def should_continue_after_preprocessing(state: WorkflowState) -> bool:
    """
    Determine if workflow should continue after preprocessing
    
    Args:
        state: Current workflow state
        
    Returns:
        True if workflow should continue, False otherwise
    """
    # Check if we have successfully preprocessed images
    if not state.processed_images:
        logger.warning(
            "Stopping workflow: No successfully preprocessed images",
            extra={"trace_id": state.trace_id}
        )
        return False
    
    # Check for too many preprocessing errors
    preprocessing_errors = [e for e in state.errors if "preprocessing" in e.lower()]
    if len(preprocessing_errors) >= len(state.images):
        logger.warning(
            "Stopping workflow: All images failed preprocessing",
            extra={"trace_id": state.trace_id}
        )
        return False
    
    return True
