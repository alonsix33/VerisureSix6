from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone

router = APIRouter()

connected_clients: set[WebSocket] = set()


@router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.discard(websocket)


async def broadcast_event(event: dict):
    for client in connected_clients.copy():
        try:
            await client.send_json({
                "type": "event",
                "data": event,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        except Exception:
            connected_clients.discard(client)
