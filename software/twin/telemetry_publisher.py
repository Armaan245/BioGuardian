"""
BioGuardian Digital Twin - Telemetry Protocol & Asynchronous MQTT Transport
Defines the telemetry JSON schema contract and non-blocking MQTT transport client.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, Optional, Tuple
import jsonschema
import paho.mqtt.client as mqtt

logger = logging.getLogger("bioguardian.twin.telemetry")

# Telemetry JSON Schema Contract
TELEMETRY_SCHEMA: Dict[str, Any] = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "BioGuardianTwinTelemetry",
    "description": "Schema contract for BioGuardian Digital Twin real-time telemetry stream",
    "type": "object",
    "additionalProperties": False,
    "required": [
        "timestamp_utc",
        "device_id",
        "physical_state",
        "edge_ai",
        "spatial_vision",
    ],
    "properties": {
        "timestamp_utc": {
            "type": "string",
            "format": "date-time",
            "description": "ISO-8601 UTC timestamp of telemetry capture",
        },
        "device_id": {
            "type": "string",
            "minLength": 1,
            "default": "BioGuardian-PiZero-01",
            "description": "Hardware device identifier",
        },
        "physical_state": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "pressure_mbar",
                "flow_uL_min",
                "ir_transmittance_mv",
                "temperature_c",
            ],
            "properties": {
                "pressure_mbar": {"type": "number", "description": "Pressure in millibars"},
                "flow_uL_min": {"type": "number", "description": "Flow rate in microliters per minute"},
                "ir_transmittance_mv": {"type": "number", "description": "IR optical sensor reading in millivolts"},
                "temperature_c": {"type": "number", "description": "Fluidics ambient/core temperature in Celsius"},
            },
        },
        "edge_ai": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "prediction",
                "confidence",
                "latency_ns",
            ],
            "properties": {
                "prediction": {
                    "type": "string",
                    "enum": ["NOMINAL", "BUBBLE_RISK"],
                    "description": "Classification result from the edge neural network",
                },
                "confidence": {
                    "type": "number",
                    "minimum": 0.0,
                    "maximum": 1.0,
                    "description": "Confidence score of prediction",
                },
                "latency_ns": {
                    "type": "integer",
                    "minimum": 0,
                    "description": "Edge AI inference latency in nanoseconds",
                },
            },
        },
        "spatial_vision": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "bubble_detected",
                "diameter_mm",
                "volume_uL",
                "position_x_mm",
            ],
            "properties": {
                "bubble_detected": {
                    "type": "boolean",
                    "description": "Flag indicating visual bubble detection confirmation",
                },
                "diameter_mm": {
                    "type": "number",
                    "minimum": 0.0,
                    "description": "Detected bubble diameter in millimeters",
                },
                "volume_uL": {
                    "type": "number",
                    "minimum": 0.0,
                    "description": "Calculated bubble volume in microliters",
                },
                "position_x_mm": {
                    "type": "number",
                    "description": "Spatial X coordinate of bubble within the microchannel in millimeters",
                },
            },
        },
    },
}

# Pre-compiled JSON Schema validator for high-throughput performance
_validator = jsonschema.Draft7Validator(TELEMETRY_SCHEMA)


def validate_telemetry_payload(payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validates a telemetry payload dictionary against TELEMETRY_SCHEMA.
    Returns (True, None) if valid, or (False, error_message) if invalid.
    """
    errors = sorted(_validator.iter_errors(payload), key=lambda e: e.path)
    if errors:
        first_error = errors[0]
        error_path = " -> ".join([str(p) for p in first_error.path]) or "root"
        return False, f"Schema validation error at [{error_path}]: {first_error.message}"
    return True, None


def build_telemetry_payload(
    sensor_data: Dict[str, Any],
    ai_data: Dict[str, Any],
    vision_data: Dict[str, Any],
    device_id: str = "BioGuardian-PiZero-01",
    timestamp_utc: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Structures and casts raw subsystem inputs into the canonical telemetry payload format.
    """
    if timestamp_utc is None:
        # Standard ISO-8601 UTC timestamp format
        timestamp_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    payload: Dict[str, Any] = {
        "timestamp_utc": timestamp_utc,
        "device_id": str(device_id),
        "physical_state": {
            "pressure_mbar": float(sensor_data.get("pressure_mbar", 0.0)),
            "flow_uL_min": float(sensor_data.get("flow_uL_min", 0.0)),
            "ir_transmittance_mv": float(sensor_data.get("ir_transmittance_mv", 0.0)),
            "temperature_c": float(sensor_data.get("temperature_c", 0.0)),
        },
        "edge_ai": {
            "prediction": str(ai_data.get("prediction", "NOMINAL")),
            "confidence": float(ai_data.get("confidence", 0.0)),
            "latency_ns": int(ai_data.get("latency_ns", 0)),
        },
        "spatial_vision": {
            "bubble_detected": bool(vision_data.get("bubble_detected", False)),
            "diameter_mm": float(vision_data.get("diameter_mm", 0.0)),
            "volume_uL": float(vision_data.get("volume_uL", 0.0)),
            "position_x_mm": float(vision_data.get("position_x_mm", 0.0)),
        },
    }
    return payload


class TwinTelemetryPublisher:
    """
    Asynchronous, non-blocking MQTT transport client for the BioGuardian Digital Twin.
    Dispatches telemetry payloads conforming to TELEMETRY_SCHEMA over a background daemon network loop.
    """

    DEFAULT_TOPIC = "bioguardian/twin/telemetry"

    def __init__(
        self,
        device_id: str = "BioGuardian-PiZero-01",
        default_topic: str = DEFAULT_TOPIC,
        client_id: Optional[str] = None,
        qos: int = 1,
    ):
        self.device_id = device_id
        self.default_topic = default_topic
        self.qos = qos
        self.client_id = client_id or f"{device_id}-pub"
        self._connected = False

        # Support Paho MQTT v2 Callback API with backward compatibility for v1
        try:
            self.client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=self.client_id,
            )
        except (AttributeError, TypeError):
            self.client = mqtt.Client(client_id=self.client_id)

        self._configure_callbacks()

    def _configure_callbacks(self) -> None:
        """Sets up asynchronous callbacks for MQTT events."""
        def on_connect(client, userdata, flags, rc, properties=None):
            rc_code = getattr(rc, "value", rc)
            if rc_code == 0:
                self._connected = True
                logger.info("Connected to MQTT Broker successfully (rc=0)")
            else:
                self._connected = False
                logger.warning("Failed to connect to MQTT broker with rc: %s", rc_code)

        def on_disconnect(client, userdata, disconnect_flags_or_rc, reason_code=None, properties=None):
            self._connected = False
            logger.info("Disconnected from MQTT Broker")

        def on_publish(client, userdata, mid, reason_code=None, properties=None):
            logger.debug("Telemetry packet delivered mid=%s", mid)

        self.client.on_connect = on_connect
        self.client.on_disconnect = on_disconnect
        self.client.on_publish = on_publish

    def connect(self, broker_host: str = "localhost", port: int = 1883, keepalive: int = 60) -> None:
        """
        Connects asynchronously to the MQTT broker and starts the background network loop.
        Non-blocking: loop_start() runs in a background thread.
        """
        logger.info("Initiating async connection to MQTT Broker at %s:%s", broker_host, port)
        self.client.connect_async(broker_host, port=port, keepalive=keepalive)
        self.client.loop_start()

    def publish_state(
        self,
        sensor_data: Dict[str, Any],
        ai_data: Dict[str, Any],
        vision_data: Dict[str, Any],
        topic: Optional[str] = None,
        custom_timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Constructs, validates, and asynchronously publishes a telemetry state packet.
        Execution is non-blocking to prevent stalling upstream realtime control loops.

        Returns:
            Dict containing publish status, message ID (mid), and the validated payload.
        Raises:
            jsonschema.ValidationError if payload violates schema contract.
        """
        payload = build_telemetry_payload(
            sensor_data=sensor_data,
            ai_data=ai_data,
            vision_data=vision_data,
            device_id=self.device_id,
            timestamp_utc=custom_timestamp,
        )

        is_valid, error_msg = validate_telemetry_payload(payload)
        if not is_valid:
            logger.error("Telemetry validation failed: %s", error_msg)
            raise jsonschema.ValidationError(error_msg)

        json_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        target_topic = topic or self.default_topic

        # paho-mqtt publish() puts message into outgoing network queue and returns immediately
        msg_info = self.client.publish(target_topic, json_bytes, qos=self.qos)

        return {
            "status": "QUEUED",
            "mid": msg_info.mid,
            "rc": msg_info.rc,
            "topic": target_topic,
            "payload": payload,
        }

    def disconnect(self, timeout: float = 2.0) -> None:
        """
        Disconnects from broker and gracefully stops the background network thread.
        """
        try:
            self.client.disconnect()
        except Exception as err:
            logger.warning("Error during client.disconnect(): %s", err)
        finally:
            self.client.loop_stop()
            self._connected = False
            logger.info("Telemetry publisher stopped cleanly")

    @property
    def is_connected(self) -> bool:
        return self._connected


if __name__ == "__main__":
    print("==========================================================")
    print(" BioGuardian Digital Twin Telemetry Publisher (Phase 01)")
    print("==========================================================")
    sample_sensor = {
        "pressure_mbar": 982.4,
        "flow_uL_min": 415.0,
        "ir_transmittance_mv": 482.5,
        "temperature_c": 25.3,
    }
    sample_ai = {
        "prediction": "NOMINAL",
        "confidence": 0.991,
        "latency_ns": 78000,
    }
    sample_vision = {
        "bubble_detected": False,
        "diameter_mm": 0.0,
        "volume_uL": 0.0,
        "position_x_mm": 0.0,
    }

    sample_payload = build_telemetry_payload(sample_sensor, sample_ai, sample_vision)
    valid, err = validate_telemetry_payload(sample_payload)

    print(f"Payload schema valid: {valid}")
    print("\n[Canonical Telemetry Payload JSON]:")
    print(json.dumps(sample_payload, indent=2))
    print("==========================================================")
