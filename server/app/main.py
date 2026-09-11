"""
BioGuardian FastAPI Backend & Real-Time Gateway

Features:
1. MQTT Subscriber for ESP32 & Edge AI topics.
2. WebSocket Hub broadcasting live telemetry to frontend clients.
3. REST API for configuration and on-demand device status.
4. Clean in-memory repository (prepared for Supabase persistence).
"""

import asyncio
from contextlib import asynccontextmanager
import json
import logging
import os
from typing import Any, Dict, List, Optional, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import paho.mqtt.client as mqtt

from .database.connection import get_database_status
from .database.repository import (
    TelemetryModel,
    get_telemetry_repository,
)
from .routers.telemetry import router as telemetry_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bioguardian.server")

MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_TOPICS = [
    "bioguardian/twin/telemetry",
    "bioguardian/edge/telemetry",
    "bioguardian/devices/+/telemetry",
]


from .ws import ws_manager
loop_ref: Optional[asyncio.AbstractEventLoop] = None


def normalize_incoming_payload(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes different payload variations (ESP32 flat vs Twin nested)
    into the canonical BioGuardian telemetry schema.
    """
    device_id = str(raw.get("device_id", "BG-ESP32-001"))
    timestamp = str(raw.get("timestamp") or raw.get("timestamp_utc") or "")

    # Check for nested physics_state from software/twin
    phys = raw.get("physical_state", {})
    vision = raw.get("spatial_vision", {})
    ai = raw.get("edge_ai", {})

    ph = float(raw.get("ph", 7.38))
    glucose = float(raw.get("glucose", 92.4))
    oxygen = float(raw.get("oxygen", 6.8))

    pressure = float(
        raw.get("pressure", phys.get("pressure_mbar", 1012.4))
    )
    flow_rate = float(
        raw.get("flow_rate", phys.get("flow_uL_min", 450.0))
    )
    temperature = float(
        raw.get("temperature", phys.get("temperature_c", 37.0))
    )

    bubble_detected = bool(
        raw.get("bubble_detected", vision.get("bubble_detected", False))
    )
    bubble_probability = float(
        raw.get("bubble_probability", ai.get("confidence", 0.02 if not bubble_detected else 0.94))
    )

    source = str(raw.get("source", "device"))

    return {
        "device_id": device_id,
        "timestamp": timestamp,
        "ph": ph,
        "glucose": glucose,
        "oxygen": oxygen,
        "pressure": pressure,
        "flow_rate": flow_rate,
        "temperature": temperature,
        "bubble_detected": bubble_detected,
        "bubble_probability": bubble_probability,
        "source": source,
    }


def on_mqtt_message(client, userdata, message):
    """Callback when an MQTT message is received."""
    try:
        payload_str = message.payload.decode("utf-8")
        raw_data = json.loads(payload_str)
        norm_data = normalize_incoming_payload(raw_data)
        device_id = norm_data["device_id"]

        # Cache in repository
        repo = get_telemetry_repository()
        repo.update_latest(device_id, norm_data)

        # Broadcast across WebSockets
        global loop_ref
        if loop_ref and loop_ref.is_running():
            asyncio.run_coroutine_threadsafe(
                ws_manager.broadcast(norm_data, device_id),
                loop_ref,
            )
    except Exception as e:
        logger.warning(f"[MQTT] Failed to process message on {message.topic}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager for MQTT client loop and clean shutdown."""
    global loop_ref
    loop_ref = asyncio.get_running_loop()

    # Initialize MQTT client
    try:
        mqtt_client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2,
            client_id="BioGuardian-FastAPI-Gateway"
        )
    except (AttributeError, TypeError):
        mqtt_client = mqtt.Client(client_id="BioGuardian-FastAPI-Gateway")
    mqtt_client.on_message = on_mqtt_message

    def on_connect(client, userdata, flags, rc, properties=None):
        is_success = (rc == 0) if isinstance(rc, int) else (not getattr(rc, "is_failure", False))
        if is_success:
            logger.info(f"[MQTT] Connected to broker at {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")
            for topic in MQTT_TOPICS:
                client.subscribe(topic)
                logger.info(f"[MQTT] Subscribed to topic: {topic}")
        else:
            logger.warning(f"[MQTT] Connection returned code {rc}")

    mqtt_client.on_connect = on_connect

    try:
        mqtt_client.connect_async(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 60)
        mqtt_client.loop_start()
        logger.info("[MQTT] Background MQTT network loop started.")
    except Exception as e:
        logger.warning(
            f"[MQTT] Could not connect to MQTT broker at {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT} ({e}). "
            "Server will continue running in REST/WebSocket mode."
        )

    yield

    try:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        logger.info("[MQTT] MQTT client disconnected cleanly.")
    except Exception:
        pass


app = FastAPI(
    title="BioGuardian Autonomous Life Support API",
    description="FastAPI Backend & Telemetry Streaming Gateway for Organ-on-Chip Digital Twin",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry_router)


@app.get("/")
async def root():
    return {
        "system": "BioGuardian Autonomous Life Support",
        "role": "FastAPI Telemetry Gateway",
        "status": "online",
        "protocols": {
            "mqtt_ingest": f"mqtt://{MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}",
            "websocket_stream": "/ws/devices/{device_id}",
            "rest_api": "/api/telemetry/latest",
        },
        "database": get_database_status(),
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "websocket_clients": len(ws_manager.all_connections),
        "database": get_database_status(),
    }


@app.websocket("/ws/devices/{device_id}")
async def websocket_device_endpoint(websocket: WebSocket, device_id: str):
    """
    WebSocket endpoint for real-time telemetry streaming to frontend clients.
    Immediately dispatches cached baseline or latest reading upon connection.
    """
    await ws_manager.connect(websocket, device_id)
    try:
        # Send current cached frame immediately upon connection
        repo = get_telemetry_repository()
        latest = repo.get_latest(device_id)
        if latest:
            await websocket.send_text(json.dumps(latest))
        else:
            await websocket.send_text(
                json.dumps({
                    "device_id": device_id,
                    "timestamp": "2026-09-11T00:00:00.000Z",
                    "ph": 7.38,
                    "glucose": 92.4,
                    "oxygen": 6.8,
                    "pressure": 1012.4,
                    "flow_rate": 450.0,
                    "temperature": 37.0,
                    "bubble_detected": False,
                    "bubble_probability": 0.02,
                    "source": "SIMULATION",
                })
            )

        while True:
            # Keep socket alive and receive client messages / pings
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Handle client command or simulation injection over WS
                if msg.get("action") == "inject_telemetry" and "payload" in msg:
                    norm = normalize_incoming_payload(msg["payload"])
                    repo.update_latest(norm["device_id"], norm)
                    await ws_manager.broadcast(norm, norm["device_id"])
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, device_id)
    except Exception:
        ws_manager.disconnect(websocket, device_id)
