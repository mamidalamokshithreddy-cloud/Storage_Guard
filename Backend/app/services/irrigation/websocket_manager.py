"""
WebSocket connection manager for irrigation service
"""

from fastapi import WebSocket
from typing import Dict, List
from datetime import datetime
import logging
import json
import asyncio

logger = logging.getLogger(__name__)

class IrrigationWebSocketManager:
    """Manages WebSocket connections for real-time irrigation data"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, plot_id: str):
        """Accept a new WebSocket connection"""
        try:
            await websocket.accept()
            if plot_id not in self.active_connections:
                self.active_connections[plot_id] = []
            self.active_connections[plot_id].append(websocket)
            logger.info(f"New WebSocket connection for plot {plot_id}")
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            raise
    
    def disconnect(self, websocket: WebSocket, plot_id: str):
        """Remove a WebSocket connection"""
        try:
            if plot_id in self.active_connections:
                self.active_connections[plot_id].remove(websocket)
                if not self.active_connections[plot_id]:
                    del self.active_connections[plot_id]
                logger.info(f"WebSocket disconnected for plot {plot_id}")
        except Exception as e:
            logger.warning(f"Error during WebSocket disconnect: {e}")
    
    async def broadcast_update(self, plot_id: str, data: Dict):
        """Broadcast an update to all connections for a plot"""
        if plot_id in self.active_connections:
            dead_connections = []
            
            for connection in self.active_connections[plot_id]:
                try:
                    await connection.send_json({
                        "type": "irrigation_update",
                        "timestamp": datetime.now().isoformat(),
                        "data": data
                    })
                except Exception as e:
                    logger.error(f"Failed to send update to WebSocket: {e}")
                    dead_connections.append(connection)
            
            # Clean up dead connections
            for dead in dead_connections:
                try:
                    self.active_connections[plot_id].remove(dead)
                except:
                    pass # Connection already removed
            
            # Remove empty plot entries
            if not self.active_connections[plot_id]:
                del self.active_connections[plot_id]
    
    async def broadcast_error(self, plot_id: str, error: str):
        """Broadcast an error message to all connections for a plot"""
        if plot_id in self.active_connections:
            await self.broadcast_update(plot_id, {
                "type": "error",
                "message": error
            })
    
    async def broadcast_status(self, plot_id: str, status: Dict):
        """Broadcast a status update to all connections for a plot"""
        if plot_id in self.active_connections:
            await self.broadcast_update(plot_id, {
                "type": "status",
                "status": status
            })

# Global WebSocket manager instance
irrigation_ws_manager = IrrigationWebSocketManager()