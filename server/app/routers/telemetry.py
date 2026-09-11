"""
BioGuardian Telemetry REST API Router
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..database.repository import (
    TelemetryModel,
    TelemetryRepository,
    get_telemetry_repository,
)
from ..push_notify import alert_dispatcher
from ..ws import ws_manager

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


class FlowRateRequest(BaseModel):
    flow_rate: float = Field(ge=0.0, le=2000.0, description="Flow rate in µL/min")


@router.get("/latest", response_model=Dict[str, Any])
async def get_latest_telemetry(
    device_id: str = Query(default="BG-ESP32-001"),
    repo: TelemetryRepository = Depends(get_telemetry_repository),
):
    """Retrieve the most recent telemetry packet for a specific device."""
    data = repo.get_latest(device_id)
    if not data:
        # Return nominal baseline if no device has published yet
        return {
            "device_id": device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ph": 7.38,
            "glucose": 92.4,
            "oxygen": 6.8,
            "pressure": 1012.4,
            "flow_rate": 450.0,
            "temperature": 37.0,
            "bubble_detected": False,
            "bubble_probability": 0.02,
            "source": "baseline",
        }
    return data


@router.post("/ingest", response_model=Dict[str, Any])
async def ingest_telemetry(
    telemetry: TelemetryModel,
    repo: TelemetryRepository = Depends(get_telemetry_repository),
):
    """
    Ingest a telemetry packet (from HTTP source or edge bridge).
    Updates repository cache and broadcasts live to connected WebSockets.
    """
    data = telemetry.model_dump()
    repo.update_latest(telemetry.device_id, data)

    # Broadcast to connected 3D Digital Twin frontend clients
    await ws_manager.broadcast(data, telemetry.device_id)

    # Dispatch alert if bubble detected
    if telemetry.bubble_detected:
        await alert_dispatcher.notify_bubble_detected(
            device_id=telemetry.device_id,
            bubble_probability=telemetry.bubble_probability,
            flow_rate=telemetry.flow_rate,
            pressure=telemetry.pressure,
        )

    return {"status": "ok", "device_id": telemetry.device_id, "broadcast": True}


@router.post("/bubble-spike", response_model=Dict[str, Any])
async def trigger_bubble_spike(
    device_id: str = Query(default="BG-ESP32-001"),
    repo: TelemetryRepository = Depends(get_telemetry_repository),
):
    """
    REST trigger to inject a synthetic bubble detection anomaly.
    Instantly updates the digital twin over WebSocket.
    """
    current = repo.get_latest(device_id) or {}
    spike_payload = {
        "device_id": device_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ph": current.get("ph", 7.38),
        "glucose": current.get("glucose", 92.4),
        "oxygen": current.get("oxygen", 6.8),
        "pressure": 1030.5,
        "flow_rate": current.get("flow_rate", 450.0),
        "temperature": current.get("temperature", 37.0),
        "bubble_detected": True,
        "bubble_probability": 0.94,
        "source": "api_spike",
    }
    repo.update_latest(device_id, spike_payload)
    await ws_manager.broadcast(spike_payload, device_id)
    await alert_dispatcher.notify_bubble_detected(
        device_id=device_id,
        bubble_probability=0.94,
        flow_rate=spike_payload["flow_rate"],
        pressure=spike_payload["pressure"],
    )
    return {"status": "bubble_injected", "payload": spike_payload}


@router.post("/bubble-clear", response_model=Dict[str, Any])
async def clear_bubble_anomaly(
    device_id: str = Query(default="BG-ESP32-001"),
    repo: TelemetryRepository = Depends(get_telemetry_repository),
):
    """REST trigger to clear bubble anomalies and restore nominal status."""
    current = repo.get_latest(device_id) or {}
    nominal_payload = {
        "device_id": device_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ph": current.get("ph", 7.38),
        "glucose": current.get("glucose", 92.4),
        "oxygen": current.get("oxygen", 6.8),
        "pressure": 1012.4,
        "flow_rate": current.get("flow_rate", 450.0),
        "temperature": current.get("temperature", 37.0),
        "bubble_detected": False,
        "bubble_probability": 0.02,
        "source": "api_nominal",
    }
    repo.update_latest(device_id, nominal_payload)
    await ws_manager.broadcast(nominal_payload, device_id)
    return {"status": "bubble_cleared", "payload": nominal_payload}


@router.post("/flow", response_model=Dict[str, Any])
async def set_device_flow_rate(
    body: FlowRateRequest,
    device_id: str = Query(default="BG-ESP32-001"),
    repo: TelemetryRepository = Depends(get_telemetry_repository),
):
    """Set volumetric flow rate for the device and broadcast to 3D Digital Twin."""
    current = repo.get_latest(device_id) or {}
    updated = {
        "device_id": device_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ph": current.get("ph", 7.38),
        "glucose": current.get("glucose", 92.4),
        "oxygen": current.get("oxygen", 6.8),
        "pressure": current.get("pressure", 1012.4),
        "flow_rate": body.flow_rate,
        "temperature": current.get("temperature", 37.0),
        "bubble_detected": current.get("bubble_detected", False),
        "bubble_probability": current.get("bubble_probability", 0.02),
        "source": "api_control",
    }
    repo.update_latest(device_id, updated)
    await ws_manager.broadcast(updated, device_id)
    return {"status": "flow_updated", "flow_rate": body.flow_rate}


@router.get("/devices", response_model=List[str])
async def list_active_devices(
    repo: TelemetryRepository = Depends(get_telemetry_repository),
):
    """List all devices currently reporting telemetry."""
    devices = repo.list_devices()
    if not devices:
        return ["BG-ESP32-001"]
    return devices
