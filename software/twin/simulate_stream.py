"""
BioGuardian Digital Twin - Telemetry Stream Simulator (Phase 03)
Publishes real-time telemetry frames over MQTT to 'bioguardian/edge/telemetry'
for live 3D dashboard visualization and verification.
"""

import argparse
from datetime import datetime, timezone
import json
import math
import time
import paho.mqtt.client as mqtt

DEFAULT_TOPIC = "bioguardian/edge/telemetry"
BROKER_HOST = "localhost"
BROKER_PORT = 1883


def generate_frame(step_index: int) -> dict:
    """Generates synthetic telemetry transitioning between nominal and bubble alerts."""
    t = step_index * 0.2
    timestamp_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")

    # Alternate every 15 steps between nominal and bubble risk
    cycle = (step_index // 15) % 3

    if cycle == 0:
        # Phase A: Clean nominal flow, no bubble
        return {
            "timestamp_utc": timestamp_utc,
            "device_id": "BioGuardian-PiZero-01",
            "physical_state": {
                "pressure_mbar": round(980.0 + 3.0 * math.sin(t), 2),
                "flow_uL_min": round(400.0 + 5.0 * math.cos(t), 2),
                "ir_transmittance_mv": round(480.0 + 2.0 * math.sin(t), 1),
                "temperature_c": 25.1,
            },
            "edge_ai": {
                "prediction": "NOMINAL",
                "confidence": 0.992,
                "latency_ns": 78000,
            },
            "spatial_vision": {
                "bubble_detected": False,
                "diameter_mm": 0.0,
                "volume_uL": 0.0,
                "position_x_mm": 0.0,
            },
        }
    elif cycle == 1:
        # Phase B: Microbubble passing through channel (Nominal classification)
        bubble_pos = 1.0 + (step_index % 15) * 0.22
        return {
            "timestamp_utc": timestamp_utc,
            "device_id": "BioGuardian-PiZero-01",
            "physical_state": {
                "pressure_mbar": round(983.5 + 2.0 * math.sin(t), 2),
                "flow_uL_min": round(395.0 - 4.0 * math.cos(t), 2),
                "ir_transmittance_mv": 390.0,
                "temperature_c": 25.2,
            },
            "edge_ai": {
                "prediction": "NOMINAL",
                "confidence": 0.954,
                "latency_ns": 82000,
            },
            "spatial_vision": {
                "bubble_detected": True,
                "diameter_mm": 0.40,
                "volume_uL": 0.033,
                "position_x_mm": round(bubble_pos, 2),
            },
        }
    else:
        # Phase C: Critical Bubble Risk spike (Clogging/embolism risk alert)
        bubble_pos = 1.5 + (step_index % 15) * 0.18
        return {
            "timestamp_utc": timestamp_utc,
            "device_id": "BioGuardian-PiZero-01",
            "physical_state": {
                "pressure_mbar": round(1055.0 + 10.0 * math.sin(t), 2),
                "flow_uL_min": round(310.0 - 15.0 * math.cos(t), 2),
                "ir_transmittance_mv": 110.0,
                "temperature_c": 26.4,
            },
            "edge_ai": {
                "prediction": "BUBBLE_RISK",
                "confidence": 0.988,
                "latency_ns": 94000,
            },
            "spatial_vision": {
                "bubble_detected": True,
                "diameter_mm": 0.78,
                "volume_uL": 0.248,
                "position_x_mm": round(bubble_pos, 2),
            },
        }


def main():
    parser = argparse.ArgumentParser(description="BioGuardian Telemetry Stream Simulator")
    parser.add_argument("--host", default=BROKER_HOST, help="MQTT broker host")
    parser.add_argument("--port", type=int, default=BROKER_PORT, help="MQTT broker port")
    parser.add_argument("--topic", default=DEFAULT_TOPIC, help="Target MQTT topic")
    parser.add_argument("--interval", type=float, default=0.25, help="Publish interval in seconds")
    parser.add_argument("--count", type=int, default=0, help="Number of frames to emit (0 = infinite)")
    args = parser.parse_args()

    print(f"[Simulator] Initializing Paho MQTT client...")
    try:
        client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2, client_id="BioGuardian-SimStream")
    except Exception:
        client = mqtt.Client(client_id="BioGuardian-SimStream")

    print(f"[Simulator] Connecting to {args.host}:{args.port}...")
    client.connect(args.host, args.port, 60)
    client.loop_start()

    print(f"[Simulator] Emitting telemetry stream to topic '{args.topic}' (interval: {args.interval}s)...")
    step = 0
    try:
        while True:
            frame = generate_frame(step)
            payload_str = json.dumps(frame)
            client.publish(args.topic, payload_str, qos=1)
            pred = frame["edge_ai"]["prediction"]
            bubble = "[ALERT BUBBLE_RISK]" if pred == "BUBBLE_RISK" else ("[BUBBLE NOMINAL]" if frame["spatial_vision"]["bubble_detected"] else "[NOMINAL CLEAN]")
            print(f"[{step:04d}] Sent -> {bubble} | P: {frame['physical_state']['pressure_mbar']} mbar | Q: {frame['physical_state']['flow_uL_min']} uL/min")
            step += 1
            if args.count > 0 and step >= args.count:
                break
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n[Simulator] Stopped by user.")
    finally:
        client.loop_stop()
        client.disconnect()
        print("[Simulator] Cleaned up and disconnected.")


if __name__ == "__main__":
    main()
