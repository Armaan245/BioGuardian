import time
import json
import random
from bubble_sizer import calculate_bubble_metrics

def generate_telemetry_payload(event_type="BUBBLE_ALERT"):
    # 1. Run vision metrics on snapshot
    vision_data = calculate_bubble_metrics("test_frame.jpg")
    
    # 2. Structure full JSON payload for FastAPI / Next.js Dashboard
    payload = {
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "device_id": "BioGuardian-PiZero-01",
        "event": event_type,
        "inference_metrics": {
            "model_version": "v1.0-mlp-int8",
            "prediction": "BUBBLE_RISK",
            "confidence": 0.98,
            "latency_ms": 0.0001
        },
        "vision_metrics": vision_data,
        "sensor_snapshot": {
            "pressure_mbar": 980.0,
            "flow_uL_min": 410.0,
            "ir_transmittance_mv": 480.0,
            "temperature_c": 25.6
        }
    }
    
    return payload

if __name__ == "__main__":
    print("=================================================")
    print("   BioGuardian Telemetry Publisher (Phase 5)     ")
    print("=================================================")
    
    telemetry = generate_telemetry_payload()
    
    print("\n[MQTT/HTTP PAYLOAD READY]")
    print(json.dumps(telemetry, indent=2))
    print("\n=================================================")