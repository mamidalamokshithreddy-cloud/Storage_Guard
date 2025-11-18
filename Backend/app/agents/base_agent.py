from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class AgentResponse(BaseModel):
    """Standard agent response."""
    status: str  # success, error, warning
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    execution_time: Optional[float] = None
    timestamp: datetime = datetime.utcnow()

class BaseAgent(ABC):
    """Simplified base agent class."""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"agents.{name}")
    
    @abstractmethod
    async def execute(self, data: Dict[str, Any]) -> AgentResponse:
        """Execute agent logic."""
        pass
    
    async def run(self, data: Dict[str, Any]) -> AgentResponse:
        """Execute with monitoring."""
        start_time = asyncio.get_event_loop().time()
        
        try:
            self.logger.info(f"Starting {self.name}")
            result = await self.execute(data)
            result.execution_time = asyncio.get_event_loop().time() - start_time
            self.logger.info(f"Completed {self.name} in {result.execution_time:.2f}s")
            return result
            
        except Exception as e:
            execution_time = asyncio.get_event_loop().time() - start_time
            self.logger.error(f"Error in {self.name}: {str(e)}")
            
            return AgentResponse(
                status="error",
                message=f"{self.name} failed: {str(e)}",
                execution_time=execution_time
            )
