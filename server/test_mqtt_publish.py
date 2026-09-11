"""
BioGuardian MQTT Sensor Publisher Test Script

Publishes real-time sensor packets to the MQTT broker so you can test
end-to-end data flow into the FastAPI gateway and 3D Digital Twin.
"""

import json
import time
import math
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

BROKER_HOST = "localhost"
BROKER_PORT = 1883
TOPIC = "bioguardian/devices/BG-ESP32-001/telemetry"

def main():
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="BioGuardian-Sensor-Test-Script")
    except (AttributeError, TypeError):
        client = mqtt.Client(client_id="BioGuardian-Sensor-Test-Script")
    print(f"Connecting to MQTT broker at {BROKER_HOST}:{BROKER_PORT}...")
    try:
        client.connect(BROKER_HOST, BROKER_PORT, 60)
    except Exception as e:
        print(f"Connection error: {e}")
        print("Tip: Make sure an MQTT broker (e.g. mosquitto or dashboard server.js) is running on port 1883.")
        return

    client.loop_start()
    print(f"Publishing live sensor telemetry to topic '{TOPIC}' every 1s...")
    print("Press Ctrl+C to stop.\n")

    step = 0
    try:
        while True:
            # Simulate subtle physiological drift
            t = step * 0.1
            step += 1

            # Inject a bubble alert every 20 seconds for 5 seconds
            bubble_detected = (step % 20) >= 15
            bubble_prob = 0.94 if bubble_detected else 0.02
            flow_rate = 320.0 if bubble_detected else round(450.0 + 8.0 * math.sin(t), 1)
            pressure = 1032.0 if bubble_detected else round(1012.4 + 2.5 * math.cos(t), 1)

            payload = {
                "device_id": "BG-ESP32-001",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ph": round(7.38 + 0.02 * math.sin(t * 0.5), 2),
                "glucose": round(92.4 + 1.2 * math.cos(t * 0.3), 1),
                "oxygen": round(6.8 + 0.1 * math.sin(t * 0.4), 2),
                "pressure": pressure,
                "flow_rate": flow_rate,
                "temperature": round(37.0 + 0.05 * math.sin(t), 1),
                "bubble_detected": bubble_detected,
                "bubble_probability": bubble_prob,
                "source": "device",
            }

            msg = json.dumps(payload)
            client.publish(TOPIC, msg)
            status_tag = "🔴 [BUBBLE DETECTED]" if bubble_detected else "🟢 [NOMINAL]"
            print(f"{status_tag} Published frame: Flow={flow_rate} µL/min, P={pressure} mbar, Bubble={bubble_detected}")
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\nStopping publisher.")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
