"""
BioGuardian – ML Service Adapter
=================================
ZERO fake ML guarantee: this module ONLY proxies requests to an external ML
model configured via ML_SERVICE_URL. If that variable is unset or the service
is unreachable, it returns an explicit "not connected" response.
No biological predictions, no toxicity scores, no cell viability numbers are
ever generated here.
"""

from __future__ import annotations
import os
import json
from typing import Any

try:
    import urllib.request as _urllib_req
    import urllib.error as _urllib_err
except ImportError:
    _urllib_req = None  # type: ignore
    _urllib_err = None  # type: ignore


class MLService:
    """External ML adapter — strictly a pass-through HTTP client."""

    def __init__(self) -> None:
        self._url: str | None = os.environ.get("ML_SERVICE_URL") or None

    def get_status(self) -> dict[str, Any]:
        if not self._url:
            return {
                "connected": False,
                "status":    "not_configured",
                "message":   "ML_SERVICE_URL environment variable is not configured.",
            }
        try:
            req = _urllib_req.Request(
                f"{self._url.rstrip('/')}/health",
                method="GET",
                headers={"Accept": "application/json"},
            )
            with _urllib_req.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read())
            return {
                "connected": True,
                "status":    "available",
                "message":   data.get("message", "ML service is reachable."),
            }
        except Exception as exc:
            return {
                "connected": False,
                "status":    "unreachable",
                "message":   f"ML service could not be reached: {exc}",
            }

    def predict(self, experiment_data: dict[str, Any]) -> dict[str, Any]:
        if not self._url:
            return {
                "available": False,
                "message":   "ML prediction service is not connected. "
                             "Configure ML_SERVICE_URL to enable predictions.",
            }
        try:
            payload = json.dumps(experiment_data).encode("utf-8")
            req = _urllib_req.Request(
                f"{self._url.rstrip('/')}/predict",
                data=payload,
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "Accept":       "application/json",
                },
            )
            with _urllib_req.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read())
            return {"available": True, "prediction": result}
        except Exception as exc:
            return {
                "available": False,
                "message":   f"ML service request failed: {exc}",
            }
