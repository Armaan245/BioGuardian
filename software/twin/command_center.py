"""
BioGuardian Digital Twin - Command Center & Reverse Control Loop (Phase 04)
Dispatches actuation and parameter updates to the C++ Edge AI Engine over MQTT.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, Optional
import paho.mqtt.client as mqtt

logger = logging.getLogger("bioguardian.twin.command_center")


class TwinCommandCenter:
    """
    Bidirectional Command Center for the BioGuardian Digital Twin.
    Publishes runtime threshold adjustments and automated emergency override commands
    to the C++ edge engine over topic 'bioguardian/control/commands'.
    """

    DEFAULT_COMMAND_TOPIC = "bioguardian/control/commands"

    def __init__(
        self,
        broker_host: str = "localhost",
        broker_port: int = 1883,
        command_topic: str = DEFAULT_COMMAND_TOPIC,
        client_id: str = "BioGuardian-Twin-CommandCenter",
    ) -> None:
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.command_topic = command_topic
        self.client_id = client_id
        self._connected = False

        # Support Paho MQTT v2 with v1 fallback
        try:
            self.client = mqtt.Client(
                callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
                client_id=self.client_id,
            )
        except (AttributeError, TypeError):
            self.client = mqtt.Client(client_id=self.client_id)

        self._configure_callbacks()

    def _configure_callbacks(self) -> None:
        def on_connect(client, userdata, flags, rc, properties=None):
            rc_code = getattr(rc, "value", rc)
            if rc_code == 0:
                self._connected = True
                logger.info("Connected to command broker successfully (rc=0)")
            else:
                self._connected = False
                logger.warning("Failed connecting to command broker rc: %s", rc_code)

        def on_disconnect(client, userdata, disconnect_flags_or_rc, reason_code=None, properties=None):
            self._connected = False
            logger.info("Disconnected from command broker")

        self.client.on_connect = on_connect
        self.client.on_disconnect = on_disconnect

    def connect(self, host: Optional[str] = None, port: Optional[int] = None) -> None:
        """Connects to MQTT broker and starts background loop."""
        target_host = host or self.broker_host
        target_port = port or self.broker_port
        logger.info("Connecting TwinCommandCenter to %s:%s", target_host, target_port)
        self.client.connect(target_host, port=target_port, keepalive=60)
        self.client.loop_start()

    def disconnect(self) -> None:
        """Stops background loop and disconnects from broker."""
        try:
            self.client.disconnect()
        except Exception:
            pass
        finally:
            self.client.loop_stop()
            self._connected = False

    def send_threshold_update(self, new_threshold: float) -> Dict[str, Any]:
        """
        Publishes a command to dynamically adjust edge inference decision threshold.
        """
        payload = {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "command": "UPDATE_THRESHOLD",
            "value": float(new_threshold),
        }
        json_str = json.dumps(payload)
        msg_info = self.client.publish(self.command_topic, json_str, qos=1)
        logger.info("Published UPDATE_THRESHOLD: %s (mid: %s)", new_threshold, msg_info.mid)
        return {"status": "PUBLISHED", "command": "UPDATE_THRESHOLD", "value": new_threshold, "mid": msg_info.mid}

    def trigger_emergency_purge(self, state: bool = True) -> Dict[str, Any]:
        """
        Publishes an override command actuating the emergency purge valve solenoid (GPIO 18).
        """
        payload = {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "command": "OVERRIDE_PURGE_VALVE",
            "state": bool(state),
        }
        json_str = json.dumps(payload)
        msg_info = self.client.publish(self.command_topic, json_str, qos=1)
        logger.info("Published OVERRIDE_PURGE_VALVE: %s (mid: %s)", state, msg_info.mid)
        return {"status": "PUBLISHED", "command": "OVERRIDE_PURGE_VALVE", "state": state, "mid": msg_info.mid}

    def evaluate_closed_loop(
        self,
        telemetry_payload: Dict[str, Any],
        channel_health: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """
        Closed-Loop Decision Logic:
        Automatically triggers an emergency purge if:
        1. Phase 02 Physics Engine reports channel degradation or clogging ('CHANNEL_DEGRADATION_OR_CLOGGING' or 'CHANNEL_DEGRADATION')
        AND
        2. Phase 01 Telemetry reports edge AI prediction == 'BUBBLE_RISK'
        """
        health_status = str(channel_health.get("status", "")).upper()
        ai_pred = str(telemetry_payload.get("edge_ai", {}).get("prediction", "")).upper()

        is_degraded = ("CHANNEL_DEGRADATION" in health_status or "CLOGG" in health_status)
        is_bubble_risk = (ai_pred == "BUBBLE_RISK")

        if is_degraded and is_bubble_risk:
            logger.warning("Closed-loop trigger condition met! Actuating Emergency Purge Valve.")
            result = self.trigger_emergency_purge(state=True)
            result["trigger_reason"] = "PHYSICS_DEGRADATION_AND_AI_BUBBLE_RISK"
            return result

        return None


if __name__ == "__main__":
    print("==========================================================")
    print(" BioGuardian Twin Command Center (Phase 04)")
    print("==========================================================")
    cmd = TwinCommandCenter()
    cmd.connect()
    import time
    time.sleep(0.5)

    print("Sending threshold update -> 0.65")
    cmd.send_threshold_update(0.65)
    time.sleep(0.5)

    print("Triggering emergency purge override -> true")
    cmd.trigger_emergency_purge(True)
    time.sleep(0.5)

    cmd.disconnect()
    print("Command center demonstration finished.")
    print("==========================================================")
