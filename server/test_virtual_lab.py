"""
BioGuardian – Virtual Lab backend unit tests (no HTTP, pure in-process)
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.simulation_service import SimulationService
from app.services.ml_service import MLService

def test_organs():
    svc = SimulationService()
    organs = svc.get_organs()
    ids = [o["id"] for o in organs]
    expected = ["lung", "heart", "liver", "kidney", "gut", "brain"]
    assert ids == expected, f"Unexpected organs: {ids}"
    print(f"  ✓ All 6 organ profiles verified: {ids}")

def test_organ_parameters():
    svc = SimulationService()
    res = svc.get_organ_parameters("lung")
    param_ids = [p["id"] for p in res["parameters"]]
    required = ["drug_concentration", "exposure_duration", "flow_rate", "ph", "oxygen", "temperature"]
    for r in required:
        assert r in param_ids, f"Missing parameter: {r}"
    print(f"  ✓ Lung parameters verified: {param_ids}")

def test_simulation_run():
    svc = SimulationService()
    res = svc.run_simulation("lung", {
        "drug_concentration": 50,
        "exposure_duration": 24,
        "flow_rate": 450,
        "ph": 7.4,
        "oxygen": 6.5,
        "temperature": 37.0,
    })
    ss = res["simulation_state"]
    assert ss["flow_active"] is True
    assert ss["flow_rate"] == 450.0
    assert ss["bubble_detected"] is False
    assert "pressure" in ss
    print(f"  ✓ Simulation run state verified with zero fake ML: {ss}")

def test_ml_unconfigured():
    os.environ.pop("ML_SERVICE_URL", None)
    ml = MLService()
    status = ml.get_status()
    assert status["connected"] is False
    assert status["status"] == "not_configured"
    print(f"  ✓ Unconfigured ML status verified: {status}")

    predict = ml.predict({"organ": "lung", "parameters": {}})
    assert predict["available"] is False
    assert "not connected" in predict["message"].lower() or "not configured" in predict["message"].lower()
    print(f"  ✓ Unconfigured ML predict response verified with zero fake predictions: {predict}")

if __name__ == "__main__":
    print("Testing SimulationService.get_organs()...")
    test_organs()
    print("Testing SimulationService.get_organ_parameters('lung')...")
    test_organ_parameters()
    print("Testing SimulationService.run_simulation()...")
    test_simulation_run()
    print("Testing MLService with ML_SERVICE_URL unset...")
    test_ml_unconfigured()
    print("\n✅ All Virtual Lab backend tests PASSED successfully!")
