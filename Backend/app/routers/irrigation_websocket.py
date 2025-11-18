from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.irrigation.websocket_manager import irrigation_ws_manager

router = APIRouter(prefix="/api/irrigation", tags=["irrigation-websocket"])

@router.websocket("/ws/{plot_id}")
async def websocket_endpoint(websocket: WebSocket, plot_id: str):
    """WebSocket endpoint for real-time irrigation updates"""
    await irrigation_ws_manager.connect(websocket, plot_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now - could process commands here
            await irrigation_ws_manager.send_personal_message(f"Echo: {data}", plot_id)
    except WebSocketDisconnect:
        irrigation_ws_manager.disconnect(websocket, plot_id)
