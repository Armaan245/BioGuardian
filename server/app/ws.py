"""
BioGuardian WebSocket Hub & Connection Manager
"""

import json
import logging
from typing import Any, Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("bioguardian.ws")


class WebSocketConnectionManager:
    """Manages active browser WebSocket client connections for real-time telemetry streaming."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, device_id: str):
        await websocket.accept()
        self.all_connections.add(websocket)
        if device_id not in self.active_connections:
            self.active_connections[device_id] = set()
        self.active_connections[device_id].add(websocket)
        logger.info(f"[WS] Client connected for device '{device_id}'. Total active: {len(self.all_connections)}")

    def disconnect(self, websocket: WebSocket, device_id: str):
        self.all_connections.discard(websocket)
        if device_id in self.active_connections:
            self.active_connections[device_id].discard(websocket)
        logger.info(f"[WS] Client disconnected. Total active: {len(self.all_connections)}")

    async def broadcast(self, data: Dict[str, Any], device_id: str):
        """Broadcast payload to all clients subscribed to this device or universal subscribers."""
        message = json.dumps(data)
        targets = set()
        if device_id in self.active_connections:
            targets.update(self.active_connections[device_id])
        targets.update(self.all_connections)

        disconnected = []
        for client in targets:
            try:
                await client.send_text(message)
            except Exception:
                disconnected.append(client)

        for dead_client in disconnected:
            self.all_connections.discard(dead_client)
            if device_id in self.active_connections:
                self.active_connections[device_id].discard(dead_client)


ws_manager = WebSocketConnectionManager()
