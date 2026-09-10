"""
Unit tests for BioGuardian Digital Twin Telemetry Protocol & MQTT Transport.
Verifies JSON schema adherence, error handling, non-blocking execution, and publisher lifecycle.
"""

import json
import time
from unittest.mock import MagicMock, patch
import pytest
import jsonschema

from software.twin.telemetry_publisher import (
    TELEMETRY_SCHEMA,
    TwinTelemetryPublisher,
    build_telemetry_payload,
    validate_telemetry_payload,
)


@pytest.fixture
def valid_telemetry_inputs():
    sensor_data = {
        "pressure_mbar": 980.5,
        "flow_uL_min": 412.3,
        "ir_transmittance_mv": 485.0,
        "temperature_c": 25.4,
    }
    ai_data = {
        "prediction": "NOMINAL",
        "confidence": 0.985,
        "latency_ns": 85000,
    }
    vision_data = {
        "bubble_detected": False,
        "diameter_mm": 0.0,
        "volume_uL": 0.0,
        "position_x_mm": 0.0,
    }
    return sensor_data, ai_data, vision_data


@pytest.fixture
def bubble_risk_telemetry_inputs():
    sensor_data = {
        "pressure_mbar": 1045.2,
        "flow_uL_min": 320.0,
        "ir_transmittance_mv": 120.0,
        "temperature_c": 26.1,
    }
    ai_data = {
        "prediction": "BUBBLE_RISK",
        "confidence": 0.992,
        "latency_ns": 92000,
    }
    vision_data = {
        "bubble_detected": True,
        "diameter_mm": 0.65,
        "volume_uL": 0.144,
        "position_x_mm": 1.25,
    }
    return sensor_data, ai_data, vision_data


def test_build_telemetry_payload_schema_conformance(valid_telemetry_inputs):
    """Verifies that generated payload strictly matches the JSON schema contract."""
    sensor_data, ai_data, vision_data = valid_telemetry_inputs
    payload = build_telemetry_payload(
        sensor_data=sensor_data,
        ai_data=ai_data,
        vision_data=vision_data,
        device_id="BioGuardian-PiZero-01",
    )

    # Validate against JSON schema validator
    is_valid, error = validate_telemetry_payload(payload)
    assert is_valid, f"Validation failed: {error}"

    # Direct jsonschema library validation
    jsonschema.validate(instance=payload, schema=TELEMETRY_SCHEMA)

    # Check required fields and structure
    assert payload["device_id"] == "BioGuardian-PiZero-01"
    assert "T" in payload["timestamp_utc"]
    assert payload["physical_state"]["pressure_mbar"] == 980.5
    assert payload["edge_ai"]["prediction"] == "NOMINAL"
    assert payload["spatial_vision"]["bubble_detected"] is False


def test_bubble_risk_payload_schema_conformance(bubble_risk_telemetry_inputs):
    """Verifies that BUBBLE_RISK event payloads with positive vision data conform to schema."""
    sensor_data, ai_data, vision_data = bubble_risk_telemetry_inputs
    payload = build_telemetry_payload(
        sensor_data=sensor_data,
        ai_data=ai_data,
        vision_data=vision_data,
    )

    is_valid, error = validate_telemetry_payload(payload)
    assert is_valid, f"Validation failed: {error}"
    assert payload["edge_ai"]["prediction"] == "BUBBLE_RISK"
    assert payload["spatial_vision"]["bubble_detected"] is True
    assert payload["spatial_vision"]["diameter_mm"] == 0.65


def test_schema_rejection_invalid_prediction(valid_telemetry_inputs):
    """Verifies schema rejects unapproved prediction states."""
    sensor_data, ai_data, vision_data = valid_telemetry_inputs
    payload = build_telemetry_payload(sensor_data, ai_data, vision_data)

    payload["edge_ai"]["prediction"] = "INVALID_STATE"
    is_valid, error = validate_telemetry_payload(payload)
    assert not is_valid
    assert "prediction" in error


def test_schema_rejection_confidence_out_of_bounds(valid_telemetry_inputs):
    """Verifies schema rejects confidence scores outside [0.0, 1.0]."""
    sensor_data, ai_data, vision_data = valid_telemetry_inputs
    payload = build_telemetry_payload(sensor_data, ai_data, vision_data)

    payload["edge_ai"]["confidence"] = 1.25
    is_valid, error = validate_telemetry_payload(payload)
    assert not is_valid
    assert "confidence" in error


def test_schema_rejection_missing_fields(valid_telemetry_inputs):
    """Verifies schema rejects payloads with missing mandatory fields."""
    sensor_data, ai_data, vision_data = valid_telemetry_inputs
    payload = build_telemetry_payload(sensor_data, ai_data, vision_data)

    del payload["physical_state"]["flow_uL_min"]
    is_valid, error = validate_telemetry_payload(payload)
    assert not is_valid
    assert "flow_uL_min" in error


def test_schema_rejection_additional_properties(valid_telemetry_inputs):
    """Verifies additional unexpected properties are rejected."""
    sensor_data, ai_data, vision_data = valid_telemetry_inputs
    payload = build_telemetry_payload(sensor_data, ai_data, vision_data)

    payload["unexpected_injected_field"] = 123
    is_valid, error = validate_telemetry_payload(payload)
    assert not is_valid


class MockMessageInfo:
    def __init__(self, mid=1, rc=0):
        self.mid = mid
        self.rc = rc

    def is_published(self):
        return True


@pytest.fixture
def mock_mqtt_publisher():
    """Provides a TwinTelemetryPublisher instance with a mocked Paho MQTT client."""
    with patch("paho.mqtt.client.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.publish.return_value = MockMessageInfo(mid=101, rc=0)
        mock_client_cls.return_value = mock_client

        publisher = TwinTelemetryPublisher(device_id="BioGuardian-PiZero-01")
        publisher.client = mock_client
        yield publisher, mock_client


def test_publisher_lifecycle(mock_mqtt_publisher):
    """Verifies connect (async/non-blocking), publish_state, and disconnect methods."""
    publisher, mock_client = mock_mqtt_publisher

    # 1. Connect
    publisher.connect(broker_host="127.0.0.1", port=1883)
    mock_client.connect_async.assert_called_once_with("127.0.0.1", port=1883, keepalive=60)
    mock_client.loop_start.assert_called_once()

    # 2. Disconnect
    publisher.disconnect()
    mock_client.disconnect.assert_called_once()
    mock_client.loop_stop.assert_called_once()
    assert publisher.is_connected is False


def test_asynchronous_non_blocking_publish(mock_mqtt_publisher, valid_telemetry_inputs):
    """
    Verifies that publish_state operates asynchronously without blocking execution,
    completing within milliseconds even over rapid successive invocations.
    """
    publisher, mock_client = mock_mqtt_publisher
    sensor_data, ai_data, vision_data = valid_telemetry_inputs

    # Benchmarking multiple non-blocking calls
    iterations = 50
    start_time = time.perf_counter()

    for i in range(iterations):
        result = publisher.publish_state(sensor_data, ai_data, vision_data)
        assert result["status"] == "QUEUED"
        assert result["mid"] == 101

    elapsed = time.perf_counter() - start_time
    avg_per_call_ms = (elapsed / iterations) * 1000.0

    # Assert non-blocking execution: each call must execute in less than 5ms
    assert avg_per_call_ms < 5.0, f"Average execution took {avg_per_call_ms:.3f}ms (expected < 5ms)"

    # Verify underlying publish was called the exact number of times
    assert mock_client.publish.call_count == iterations

    # Verify message payload sent to MQTT is valid JSON and conforms to schema
    last_call_args = mock_client.publish.call_args[0]
    published_topic = last_call_args[0]
    published_payload_bytes = last_call_args[1]

    assert published_topic == TwinTelemetryPublisher.DEFAULT_TOPIC
    published_dict = json.loads(published_payload_bytes.decode("utf-8"))
    jsonschema.validate(instance=published_dict, schema=TELEMETRY_SCHEMA)


def test_publish_state_invalid_payload_raises(mock_mqtt_publisher, valid_telemetry_inputs):
    """Verifies that publishing invalid payload raises jsonschema.ValidationError."""
    publisher, mock_client = mock_mqtt_publisher
    sensor_data, ai_data, vision_data = valid_telemetry_inputs

    invalid_ai_data = dict(ai_data)
    invalid_ai_data["prediction"] = "NON_EXISTENT_STATE"

    with pytest.raises(jsonschema.ValidationError):
        publisher.publish_state(sensor_data, invalid_ai_data, vision_data)

    # Verify no message was queued to broker on validation failure
    mock_client.publish.assert_not_called()
