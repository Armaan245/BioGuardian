"""
BioGuardian Push Notification & Alarm Dispatcher

Handles urgent operational fault alerts (e.g. critical bubble risk, flow obstruction)
triggered during real-time telemetry observation.
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger("bioguardian.alerts")


class AlertDispatcher:
    """Dispatches operational alert notifications to researchers / operators."""

    @classmethod
    async def notify_bubble_detected(
        cls,
        device_id: str,
        bubble_probability: float,
        flow_rate: float,
        pressure: float,
    ) -> Dict[str, Any]:
        """Triggered when an air bubble is detected upstream of the Organ-on-Chip."""
        alert_payload = {
            "type": "CRITICAL_FAULT_ALERT",
            "severity": "HIGH",
            "device_id": device_id,
            "title": "Air Bubble Intercepted Upstream",
            "message": (
                f"Bubble detected in microfluidic line for device {device_id} "
                f"with {round(bubble_probability * 100)}% confidence at {flow_rate:.1f} µL/min. "
                "Downstream Organ-on-Chip protected."
            ),
            "telemetry": {
                "flow_rate": flow_rate,
                "pressure": pressure,
                "bubble_probability": bubble_probability,
            },
        }

        logger.warning(
            f"[ALERT DISPATCH] {alert_payload['title']} | Device: {device_id} | "
            f"Prob: {round(bubble_probability * 100)}%"
        )
        return alert_payload


alert_dispatcher = AlertDispatcher()
