"""
Feedback Service - Handles user feedback for model improvement
Collects and stores feedback on analysis results
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

import aiofiles

from app.schemas.postgres_base_models import FeedbackRequest, FeedbackResponse

logger = logging.getLogger(__name__)


class FeedbackService:
    """Service for handling user feedback"""
    
    def __init__(self):
        """Initialize the feedback service"""
        self.feedback_dir = Path("data/feedback")
        self.feedback_dir.mkdir(parents=True, exist_ok=True)
    
    async def submit_feedback(self, feedback: FeedbackRequest) -> FeedbackResponse:
        """
        Submit user feedback
        
        Args:
            feedback: Feedback request data
            
        Returns:
            FeedbackResponse: Feedback submission result
        """
        try:
            # Generate feedback ID
            feedback_id = str(uuid4())
            
            # Create feedback record
            feedback_record = {
                "feedback_id": feedback_id,
                "submitted_at": datetime.utcnow().isoformat(),
                **feedback.dict()
            }
            
            # Save to file
            feedback_file = self.feedback_dir / f"{feedback_id}.json"
            async with aiofiles.open(feedback_file, 'w') as f:
                await f.write(json.dumps(feedback_record, indent=2))
            
            logger.info(
                f"📝 Feedback submitted successfully",
                extra={
                    "feedback_id": feedback_id,
                    "trace_id": feedback.trace_id,
                    "user_id": str(feedback.user_id) if feedback.user_id else None
                }
            )
            
            return FeedbackResponse(
                success=True,
                message="Feedback submitted successfully",
                feedback_id=feedback_id
            )
            
        except Exception as e:
            logger.error(f"Failed to submit feedback: {e}", exc_info=True)
            return FeedbackResponse(
                success=False,
                message=f"Failed to submit feedback: {str(e)}",
                feedback_id=""
            )
    
    async def get_feedback(self, feedback_id: str) -> Optional[dict]:
        """
        Retrieve feedback by ID
        
        Args:
            feedback_id: Feedback identifier
            
        Returns:
            Optional[dict]: Feedback data if found
        """
        try:
            feedback_file = self.feedback_dir / f"{feedback_id}.json"
            
            if not feedback_file.exists():
                return None
            
            async with aiofiles.open(feedback_file, 'r') as f:
                content = await f.read()
                return json.loads(content)
                
        except Exception as e:
            logger.error(f"Failed to retrieve feedback: {e}", exc_info=True)
            return None
    
    async def get_feedback_for_trace(self, trace_id: str) -> List[dict]:
        """
        Get all feedback for a specific trace ID
        
        Args:
            trace_id: Analysis trace identifier
            
        Returns:
            List[dict]: List of feedback records
        """
        feedback_list = []
        
        try:
            for feedback_file in self.feedback_dir.glob("*.json"):
                try:
                    async with aiofiles.open(feedback_file, 'r') as f:
                        content = await f.read()
                        feedback_data = json.loads(content)
                        
                        if feedback_data.get('trace_id') == trace_id:
                            feedback_list.append(feedback_data)
                            
                except Exception as e:
                    logger.warning(f"Error reading feedback file {feedback_file}: {e}")
                    
        except Exception as e:
            logger.error(f"Error getting feedback for trace {trace_id}: {e}", exc_info=True)
        
        return feedback_list
    
    async def get_feedback_stats(self) -> dict:
        """
        Get feedback statistics
        
        Returns:
            dict: Feedback statistics
        """
        try:
            total_feedback = 0
            with_corrections = 0
            with_effectiveness = 0
            
            for feedback_file in self.feedback_dir.glob("*.json"):
                try:
                    async with aiofiles.open(feedback_file, 'r') as f:
                        content = await f.read()
                        feedback_data = json.loads(content)
                        
                        total_feedback += 1
                        
                        if feedback_data.get('correct_label') or feedback_data.get('correct_severity'):
                            with_corrections += 1
                            
                        if feedback_data.get('treatment_effectiveness'):
                            with_effectiveness += 1
                            
                except Exception as e:
                    logger.warning(f"Error reading feedback file {feedback_file}: {e}")
            
            return {
                "total_feedback": total_feedback,
                "with_corrections": with_corrections,
                "with_effectiveness": with_effectiveness,
                "correction_rate": with_corrections / total_feedback if total_feedback > 0 else 0,
                "effectiveness_rate": with_effectiveness / total_feedback if total_feedback > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting feedback stats: {e}", exc_info=True)
            return {
                "total_feedback": 0,
                "with_corrections": 0,
                "with_effectiveness": 0,
                "correction_rate": 0,
                "effectiveness_rate": 0
            }


# Singleton instance
_feedback_service_instance: Optional[FeedbackService] = None


def get_feedback_service() -> FeedbackService:
    """Get singleton FeedbackService instance"""
    global _feedback_service_instance
    
    if _feedback_service_instance is None:
        _feedback_service_instance = FeedbackService()
    
    return _feedback_service_instance
