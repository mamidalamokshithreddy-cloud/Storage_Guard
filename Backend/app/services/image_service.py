import asyncio
import json
import logging
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4
import aiofiles
from fastapi import UploadFile
from PIL import Image
from app.core.config import settings
from app.schemas.postgres_base_models import ImageMetadata, AnalysisResponse

logger = logging.getLogger(__name__)


class ImageService:
    """Service for handling image uploads, storage, and management"""
    
    def __init__(self):
        self.settings = settings
        self.upload_dir = Path("data/uploads")
        self.cache_dir = Path("data/cache")
        self.analysis_cache_dir = Path("data/analysis_cache")
        
        # Create directories if they don't exist
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.analysis_cache_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_upload(
        self, 
        upload_file: UploadFile, 
        trace_id: str, 
        metadata: ImageMetadata,
        remove_exif: bool = True
    ) -> str:
        """
        Save uploaded file to disk with optional EXIF removal
        
        Args:
            upload_file: FastAPI uploaded file
            trace_id: Unique identifier for this analysis
            metadata: Image metadata
            remove_exif: Whether to remove EXIF data for privacy
            
        Returns:
            str: Path to saved file
        """
        try:
            # Create trace-specific directory
            trace_dir = self.upload_dir / trace_id
            trace_dir.mkdir(exist_ok=True)
            
            # Generate safe filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_ext = metadata.filename.split('.')[-1].lower() if '.' in metadata.filename else 'jpg'
            safe_filename = f"{timestamp}_{uuid4().hex[:8]}.{file_ext}"
            file_path = trace_dir / safe_filename
            
            # Read file content
            content = await upload_file.read()
            
            if remove_exif and file_ext.lower() in ['jpg', 'jpeg']:
                # Remove EXIF data using PIL
                try:
                    with Image.open(upload_file.file) as img:
                        # Create new image without EXIF
                        clean_img = Image.new(img.mode, img.size)
                        clean_img.putdata(list(img.getdata()))
                        
                        # Save cleaned image
                        clean_img.save(file_path, format='JPEG', quality=95)
                        
                    logger.debug(f"Removed EXIF data from {safe_filename}")
                        
                except Exception as e:
                    logger.warning(f"Failed to remove EXIF from {safe_filename}: {e}")
                    # Fallback: save original content
                    async with aiofiles.open(file_path, 'wb') as f:
                        await f.write(content)
            else:
                # Save original content
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(content)
            
            # Save metadata
            metadata_path = trace_dir / f"{safe_filename}.meta.json"
            
            # Use Pydantic's JSON serialization which handles datetime objects properly
            metadata_json = metadata.model_dump_json()
            metadata_data = json.loads(metadata_json)
            metadata_data['saved_path'] = str(file_path)
            metadata_data['saved_at'] = datetime.now().isoformat()
            
            async with aiofiles.open(metadata_path, 'w') as f:
                await f.write(json.dumps(metadata_data, indent=2))
            
            logger.info(
                f"📁 Saved image: {metadata.filename} → {safe_filename}",
                extra={
                    "trace_id": trace_id,
                    "original_size": metadata.size_bytes,
                    "saved_path": str(file_path)
                }
            )
            
            return str(file_path)
            
        except Exception as e:
            logger.error(
                f"Failed to save upload: {e}",
                extra={"trace_id": trace_id, "original_filename": metadata.filename},
                exc_info=True
            )
            raise
    
    async def get_cached_analysis(self, trace_id: str) -> Optional[AnalysisResponse]:
        """
        Retrieve cached analysis results
        
        Args:
            trace_id: Analysis trace identifier
            
        Returns:
            Optional[AnalysisResponse]: Cached results if found
        """
        try:
            cache_file = self.analysis_cache_dir / f"{trace_id}.json"
            
            if not cache_file.exists():
                return None
            
            async with aiofiles.open(cache_file, 'r') as f:
                content = await f.read()
                data = json.loads(content)
                
            # Check if cache is not too old (24 hours)
            cached_at = datetime.fromisoformat(data.get('cached_at', ''))
            if datetime.utcnow() - cached_at > timedelta(hours=24):
                logger.debug(f"Cache expired for trace_id: {trace_id}")
                return None
                
            return AnalysisResponse(**data['response'])
            
        except Exception as e:
            logger.warning(
                f"Failed to retrieve cached analysis: {e}",
                extra={"trace_id": trace_id}
            )
            return None
    
    async def cache_analysis(self, trace_id: str, response: AnalysisResponse) -> None:
        """
        Cache analysis results for future retrieval
        
        Args:
            trace_id: Analysis trace identifier
            response: Analysis response to cache
        """
        try:
            cache_file = self.analysis_cache_dir / f"{trace_id}.json"
            
            cache_data = {
                "trace_id": trace_id,
                "cached_at": datetime.utcnow().isoformat(),
                "response": response.dict()
            }
            
            async with aiofiles.open(cache_file, 'w') as f:
                await f.write(json.dumps(cache_data, indent=2))
                
            logger.debug(f"💾 Cached analysis results for {trace_id}")
            
        except Exception as e:
            logger.error(
                f"Failed to cache analysis: {e}",
                extra={"trace_id": trace_id},
                exc_info=True
            )
    
    async def delete_analysis_data(self, trace_id: str) -> int:
        """
        Delete all data associated with an analysis
        
        Args:
            trace_id: Analysis trace identifier
            
        Returns:
            int: Number of files deleted
        """
        deleted_count = 0
        
        try:
            # Delete uploaded images and metadata
            trace_dir = self.upload_dir / trace_id
            if trace_dir.exists():
                files_to_delete = list(trace_dir.glob("*"))
                for file_path in files_to_delete:
                    try:
                        file_path.unlink()
                        deleted_count += 1
                    except Exception as e:
                        logger.warning(f"Failed to delete {file_path}: {e}")
                
                # Remove directory if empty
                try:
                    trace_dir.rmdir()
                except OSError:
                    pass  # Directory not empty
            
            # Delete cached analysis
            cache_file = self.analysis_cache_dir / f"{trace_id}.json"
            if cache_file.exists():
                try:
                    cache_file.unlink()
                    deleted_count += 1
                except Exception as e:
                    logger.warning(f"Failed to delete cache file: {e}")
            
            logger.info(
                f"🗑️ Deleted {deleted_count} files for trace_id: {trace_id}",
                extra={"trace_id": trace_id}
            )
            
            return deleted_count
            
        except Exception as e:
            logger.error(
                f"Error during cleanup: {e}",
                extra={"trace_id": trace_id},
                exc_info=True
            )
            return deleted_count
    
    async def cleanup_old_uploads(self, max_age_hours: int = 24) -> int:
        """
        Clean up old uploaded files and analysis data
        
        Args:
            max_age_hours: Maximum age of files to keep
            
        Returns:
            int: Number of files deleted
        """
        deleted_count = 0
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        try:
            # Clean upload directories
            for trace_dir in self.upload_dir.iterdir():
                if not trace_dir.is_dir():
                    continue
                    
                try:
                    # Check directory creation time
                    dir_ctime = datetime.fromtimestamp(trace_dir.stat().st_ctime)
                    
                    if dir_ctime < cutoff_time:
                        # Delete all files in directory
                        for file_path in trace_dir.glob("*"):
                            try:
                                file_path.unlink()
                                deleted_count += 1
                            except Exception as e:
                                logger.warning(f"Failed to delete {file_path}: {e}")
                        
                        # Remove directory
                        try:
                            trace_dir.rmdir()
                        except OSError:
                            pass
                            
                except Exception as e:
                    logger.warning(f"Error processing directory {trace_dir}: {e}")
            
            # Clean analysis cache
            for cache_file in self.analysis_cache_dir.glob("*.json"):
                try:
                    file_ctime = datetime.fromtimestamp(cache_file.stat().st_ctime)
                    
                    if file_ctime < cutoff_time:
                        cache_file.unlink()
                        deleted_count += 1
                        
                except Exception as e:
                    logger.warning(f"Failed to delete cache file {cache_file}: {e}")
            
            if deleted_count > 0:
                logger.info(
                    f"🧹 Cleanup completed: deleted {deleted_count} old files",
                    extra={"max_age_hours": max_age_hours}
                )
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}", exc_info=True)
            return deleted_count
    
    async def get_upload_stats(self) -> Dict[str, int]:
        """
        Get statistics about uploaded files
        
        Returns:
            Dict[str, int]: Statistics about uploads
        """
        try:
            total_dirs = 0
            total_files = 0
            total_size = 0
            
            for trace_dir in self.upload_dir.iterdir():
                if trace_dir.is_dir():
                    total_dirs += 1
                    
                    for file_path in trace_dir.glob("*"):
                        if file_path.is_file():
                            total_files += 1
                            total_size += file_path.stat().st_size
            
            return {
                "total_traces": total_dirs,
                "total_files": total_files,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting upload stats: {e}", exc_info=True)
            return {
                "total_traces": 0,
                "total_files": 0,
                "total_size_bytes": 0,
                "total_size_mb": 0
            }


# Singleton instance
_image_service_instance: Optional[ImageService] = None


def get_image_service() -> ImageService:
    """Get singleton ImageService instance"""
    global _image_service_instance
    
    if _image_service_instance is None:
        _image_service_instance = ImageService()
    
    return _image_service_instance
