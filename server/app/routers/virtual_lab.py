"""
BioGuardian – Virtual Lab API Router
"""

from __future__ import annotations
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.simulation_service import SimulationService
from app.services.ml_service import MLService

router = APIRouter()
_sim = SimulationService()
_ml  = MLService()


class SimulationRunRequest(BaseModel):
    organ: str
    parameters: dict[str, Any]

class MLPredictRequest(BaseModel):
    organ: str
    parameters: dict[str, Any]


@router.get("/organs")
async def list_organs():
    """Return all available Organ-on-Chip profiles."""
    return _sim.get_organs()


@router.get("/organs/{organ_id}/parameters")
async def get_organ_parameters(organ_id: str):
    """Return dynamic parameter schema for a specific organ."""
    result = _sim.get_organ_parameters(organ_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Organ '{organ_id}' not found.")
    return result


@router.post("/simulation/run")
async def run_simulation(body: SimulationRunRequest):
    """
    Execute a virtual in-silico simulation run.
    Returns physical simulation state only — no ML predictions.
    """
    return _sim.run_simulation(body.organ, body.parameters)


@router.get("/ml/status")
async def ml_status():
    """Check whether the external ML prediction service is reachable."""
    return _ml.get_status()


@router.post("/ml/predict")
async def ml_predict(body: MLPredictRequest):
    """
    Proxy experiment data to the external ML model.
    If ML_SERVICE_URL is not configured, returns explicit 'not connected' response.
    Zero fake predictions are ever generated here.
    """
    return _ml.predict({"organ": body.organ, "parameters": body.parameters})
