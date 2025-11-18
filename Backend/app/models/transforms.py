"""
Image preprocessing and transformation utilities
"""

import logging
from pathlib import Path
from typing import Tuple, List, Optional
import numpy as np
import cv2
from PIL import Image, ExifTags
import hashlib

logger = logging.getLogger(__name__)


class ImageTransforms:
    """
    Image preprocessing and transformation utilities
    """
    
    @staticmethod
    def remove_exif(image_path: str, output_path: str = None) -> str:
        """
        Remove EXIF data from image for privacy
        
        Args:
            image_path: Input image path
            output_path: Output path (overwrites input if None)
            
        Returns:
            Path to processed image
        """
        if output_path is None:
            output_path = image_path
        
        try:
            # Open image and remove EXIF
            with Image.open(image_path) as img:
                # Create new image without EXIF
                data = list(img.getdata())
                clean_img = Image.new(img.mode, img.size)
                clean_img.putdata(data)
                
                # Save without EXIF
                clean_img.save(output_path, quality=95, optimize=True)
            
            logger.debug(f"🔒 Removed EXIF data: {image_path}")
            return output_path
            
        except Exception as e:
            logger.warning(f"Failed to remove EXIF data: {e}")
            return image_path
    
    @staticmethod
    def validate_image(image_path: str) -> Tuple[bool, str, Optional[dict]]:
        """
        Validate image file and extract metadata
        
        Args:
            image_path: Path to image file
            
        Returns:
            Tuple of (is_valid, error_message, metadata)
        """
        try:
            path = Path(image_path)
            
            # Check file exists
            if not path.exists():
                return False, f"File not found: {image_path}", None
            
            # Check file size
            file_size = path.stat().st_size
            if file_size == 0:
                return False, "Empty file", None
            
            if file_size > 50 * 1024 * 1024:  # 50MB limit
                return False, f"File too large: {file_size / 1024 / 1024:.1f}MB", None
            
            # Try to open with PIL
            with Image.open(image_path) as img:
                # Basic validation
                if img.size[0] < 32 or img.size[1] < 32:
                    return False, "Image too small (minimum 32x32)", None
                
                if img.size[0] > 8192 or img.size[1] > 8192:
                    return False, "Image too large (maximum 8192x8192)", None
                
                # Extract metadata
                metadata = {
                    "width": img.size[0],
                    "height": img.size[1],
                    "format": img.format,
                    "mode": img.mode,
                    "file_size_bytes": file_size
                }
                
                # Extract EXIF if available
                exif_data = {}
                if hasattr(img, '_getexif') and img._getexif():
                    exif = img._getexif()
                    for tag_id, value in exif.items():
                        tag = ExifTags.TAGS.get(tag_id, tag_id)
                        exif_data[tag] = value
                
                if exif_data:
                    metadata["exif"] = exif_data
                
                return True, "", metadata
                
        except Exception as e:
            return False, f"Invalid image file: {str(e)}", None
    
    @staticmethod
    def resize_image(image_path: str, target_size: Tuple[int, int], 
                    output_path: str = None, maintain_aspect: bool = True) -> str:
        """
        Resize image to target size
        
        Args:
            image_path: Input image path
            target_size: Target (width, height)
            output_path: Output path (generates new name if None)
            maintain_aspect: Whether to maintain aspect ratio
            
        Returns:
            Path to resized image
        """
        try:
            if output_path is None:
                path = Path(image_path)
                output_path = str(path.parent / f"{path.stem}_resized{path.suffix}")
            
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Failed to load image: {image_path}")
            
            if maintain_aspect:
                # Calculate aspect-preserving size
                h, w = image.shape[:2]
                target_w, target_h = target_size
                
                # Calculate scaling factor
                scale = min(target_w / w, target_h / h)
                new_w = int(w * scale)
                new_h = int(h * scale)
                
                # Resize
                resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
                
                # Pad to target size if needed
                if new_w != target_w or new_h != target_h:
                    # Create black background
                    padded = np.zeros((target_h, target_w, 3), dtype=np.uint8)
                    
                    # Center the resized image
                    y_offset = (target_h - new_h) // 2
                    x_offset = (target_w - new_w) // 2
                    padded[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
                    
                    resized = padded
            else:
                # Direct resize (may distort aspect ratio)
                resized = cv2.resize(image, target_size, interpolation=cv2.INTER_LINEAR)
            
            # Save resized image
            cv2.imwrite(output_path, resized)
            
            logger.debug(f"📏 Resized image: {image_path} → {target_size}")
            return output_path
            
        except Exception as e:
            logger.error(f"Image resize failed: {e}")
            raise
    
    @staticmethod
    def tile_large_image(image_path: str, tile_size: Tuple[int, int] = (1024, 1024),
                        overlap: int = 128, output_dir: str = None) -> List[str]:
        """
        Tile large images for processing (useful for drone images)
        
        Args:
            image_path: Input large image
            tile_size: Size of each tile (width, height)
            overlap: Overlap between tiles in pixels
            output_dir: Directory for tile outputs
            
        Returns:
            List of tile file paths
        """
        try:
            path = Path(image_path)
            
            if output_dir is None:
                output_dir = path.parent / f"{path.stem}_tiles"
            else:
                output_dir = Path(output_dir)
            
            output_dir.mkdir(exist_ok=True)
            
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Failed to load image: {image_path}")
            
            h, w = image.shape[:2]
            tile_w, tile_h = tile_size
            
            # Calculate step size
            step_x = tile_w - overlap
            step_y = tile_h - overlap
            
            tile_paths = []
            tile_idx = 0
            
            for y in range(0, h - tile_h + 1, step_y):
                for x in range(0, w - tile_w + 1, step_x):
                    # Extract tile
                    tile = image[y:y+tile_h, x:x+tile_w]
                    
                    # Save tile
                    tile_path = output_dir / f"tile_{tile_idx:04d}_{x}_{y}.jpg"
                    cv2.imwrite(str(tile_path), tile)
                    tile_paths.append(str(tile_path))
                    
                    tile_idx += 1
            
            logger.info(f"🧩 Tiled image into {len(tile_paths)} tiles: {image_path}")
            return tile_paths
            
        except Exception as e:
            logger.error(f"Image tiling failed: {e}")
            raise
    
    @staticmethod
    def calculate_image_hash(image_path: str) -> str:
        """
        Calculate perceptual hash of image for duplicate detection
        
        Args:
            image_path: Path to image
            
        Returns:
            Hex string of image hash
        """
        try:
            # Load and resize to small size for hashing
            image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if image is None:
                raise ValueError(f"Failed to load image: {image_path}")
            
            # Resize to 8x8 for simple hashing
            small = cv2.resize(image, (8, 8), interpolation=cv2.INTER_LINEAR)
            
            # Calculate average
            avg = small.mean()
            
            # Create hash based on pixel comparisons
            hash_bits = []
            for pixel in small.flatten():
                hash_bits.append('1' if pixel > avg else '0')
            
            # Convert to hex
            hash_str = ''.join(hash_bits)
            hash_int = int(hash_str, 2)
            hash_hex = f"{hash_int:016x}"
            
            return hash_hex
            
        except Exception as e:
            logger.error(f"Image hashing failed: {e}")
            return ""
    
    @staticmethod
    def apply_quality_enhancements(image_path: str, output_path: str = None) -> str:
        """
        Apply basic quality enhancements to image
        
        Args:
            image_path: Input image path
            output_path: Output path (generates new name if None)
            
        Returns:
            Path to enhanced image
        """
        try:
            if output_path is None:
                path = Path(image_path)
                output_path = str(path.parent / f"{path.stem}_enhanced{path.suffix}")
            
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Failed to load image: {image_path}")
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            enhanced = cv2.merge([l, a, b])
            enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
            
            # Apply slight denoising
            enhanced = cv2.bilateralFilter(enhanced, 9, 75, 75)
            
            # Save enhanced image
            cv2.imwrite(output_path, enhanced)
            
            logger.debug(f"✨ Enhanced image quality: {image_path}")
            return output_path
            
        except Exception as e:
            logger.warning(f"Image enhancement failed: {e}")
            return image_path  # Return original if enhancement fails
    
    @staticmethod
    def extract_ndvi(image_path: str, output_path: str = None) -> Optional[str]:
        """
        Extract NDVI (Normalized Difference Vegetation Index) if multispectral
        
        Args:
            image_path: Input image path (should be multispectral)
            output_path: Output path for NDVI image
            
        Returns:
            Path to NDVI image or None if not applicable
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return None
            
            # Simple NDVI approximation using visible channels
            # Real NDVI needs NIR band, this is just a green-red ratio
            b, g, r = cv2.split(image)
            
            # Avoid division by zero
            denominator = (r.astype(np.float32) + g.astype(np.float32))
            denominator[denominator == 0] = 1
            
            # Calculate pseudo-NDVI
            ndvi = (g.astype(np.float32) - r.astype(np.float32)) / denominator
            
            # Normalize to 0-255
            ndvi_normalized = ((ndvi + 1) * 127.5).astype(np.uint8)
            
            if output_path is None:
                path = Path(image_path)
                output_path = str(path.parent / f"{path.stem}_ndvi{path.suffix}")
            
            # Apply colormap for visualization
            ndvi_colored = cv2.applyColorMap(ndvi_normalized, cv2.COLORMAP_JET)
            cv2.imwrite(output_path, ndvi_colored)
            
            logger.debug(f"🌱 Extracted NDVI: {image_path}")
            return output_path
            
        except Exception as e:
            logger.warning(f"NDVI extraction failed: {e}")
            return None
