"""
BioGuardian – Virtual Lab Simulation Service
=============================================
Manages organ profiles, parameter schemas, and in-silico fluid simulation state.
Contains ZERO ML algorithms. Computes physical fluid state only.
"""

from __future__ import annotations
import random
from typing import Any

# ---------------------------------------------------------------------------
# Organ Catalogue
# ---------------------------------------------------------------------------

ORGANS: list[dict[str, str]] = [
    {"id": "lung",   "name": "Lung-on-a-Chip",   "status": "prototype"},
    {"id": "heart",  "name": "Heart-on-a-Chip",  "status": "prototype"},
    {"id": "liver",  "name": "Liver-on-a-Chip",  "status": "prototype"},
    {"id": "kidney", "name": "Kidney-on-a-Chip", "status": "prototype"},
    {"id": "gut",    "name": "Gut-on-a-Chip",    "status": "prototype"},
    {"id": "brain",  "name": "Brain-on-a-Chip",  "status": "prototype"},
]

# ---------------------------------------------------------------------------
# Per-organ parameter schemas
# ---------------------------------------------------------------------------

_BASE_PARAMS = [
    {"id": "drug_concentration", "label": "Drug Concentration", "unit": "µM",    "min": 0,    "max": 500,  "default": 50},
    {"id": "exposure_duration",  "label": "Exposure Duration",  "unit": "hours", "min": 1,    "max": 72,   "default": 24},
    {"id": "flow_rate",          "label": "Flow Rate",          "unit": "µL/min","min": 50,   "max": 1000, "default": 450},
    {"id": "ph",                 "label": "pH",                 "unit": "",      "min": 6.5,  "max": 8.0,  "default": 7.4},
    {"id": "oxygen",             "label": "Dissolved Oxygen",   "unit": "mg/L",  "min": 0.5,  "max": 12.0, "default": 6.5},
    {"id": "temperature",        "label": "Temperature",        "unit": "°C",    "min": 30.0, "max": 42.0, "default": 37.0},
]

_ORGAN_PARAMS: dict[str, list[dict]] = {
    "lung":   _BASE_PARAMS + [{"id": "stretch_frequency", "label": "Cyclic Stretch Frequency", "unit": "Hz", "min": 0, "max": 1.0, "default": 0.2}],
    "heart":  _BASE_PARAMS + [{"id": "pacing_frequency",  "label": "Electrical Pacing",        "unit": "Hz", "min": 0, "max": 2.0, "default": 1.0}],
    "liver":  _BASE_PARAMS + [{"id": "albumin_conc",      "label": "Albumin Concentration",    "unit": "g/L","min": 0, "max": 50,  "default": 35}],
    "kidney": _BASE_PARAMS + [{"id": "shear_stress",      "label": "Fluid Shear Stress",       "unit": "dyn/cm²","min": 0, "max": 2.0, "default": 0.2}],
    "gut":    _BASE_PARAMS + [{"id": "peristalsis_freq",  "label": "Peristalsis Frequency",    "unit": "Hz","min": 0, "max": 0.5, "default": 0.1}],
    "brain":  _BASE_PARAMS + [{"id": "glucose_conc",      "label": "Glucose Concentration",    "unit": "mM","min": 1, "max": 25,  "default": 5.5}],
}


class SimulationService:
    """Pure simulation state engine — zero ML."""

    def get_organs(self) -> list[dict[str, str]]:
        return ORGANS

    def get_organ_parameters(self, organ_id: str) -> dict[str, Any]:
        params = _ORGAN_PARAMS.get(organ_id)
        if params is None:
            return {}
        return {"organ": organ_id, "parameters": params}

    def run_simulation(self, organ: str, parameters: dict[str, Any]) -> dict[str, Any]:
        """
        Execute an in-silico simulation step.
        Returns physical fluid state only — no fake ML or biological scores.
        """
        flow_rate   = float(parameters.get("flow_rate",   450.0))
        ph          = float(parameters.get("ph",          7.4))
        oxygen      = float(parameters.get("oxygen",      6.5))
        temperature = float(parameters.get("temperature", 37.0))

        base_resistance = 2.27  # mbar·min/µL
        pressure = flow_rate * base_resistance + random.uniform(-2.0, 2.0)

        return {
            "simulation_id":    f"sim_{random.randint(1000, 9999)}",
            "status":           "running",
            "organ":            organ,
            "parameters":       parameters,
            "simulation_state": {
                "flow_active":    True,
                "flow_rate":      flow_rate,
                "pressure":       round(pressure, 2),
                "ph":             ph,
                "oxygen":         oxygen,
                "temperature":    temperature,
                "elapsed_time":   0,
                "bubble_detected": False,
                "bubble_position": 0.0,
            },
        }
