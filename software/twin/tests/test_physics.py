"""
Unit tests for BioGuardian Microfluidic Physics Engine & Channel Health Validator (Phase 02).
"""

import math
import pytest
from software.twin.physics_engine import MicrofluidicPhysicsTwin


@pytest.fixture
def physics_twin():
    return MicrofluidicPhysicsTwin()


def test_zero_flow_pressure(physics_twin):
    """Zero flow rate returns 0.0 mbar."""
    pressure = physics_twin.compute_theoretical_pressure(flow_uL_min=0.0)
    assert pressure == 0.0


def test_nominal_flow_pressure(physics_twin):
    """
    Nominal flow (400 uL/min) returns correct theoretical pressure according
    to the Hagen-Poiseuille rectangular channel model.
    Analytical expected value:
    L = 0.05 m, W = 0.001 m, H = 0.0002 m, mu = 0.00089 Pa.s
    Q = (400 * 1e-9) / 60.0 = 6.6666667e-9 m^3/s
    dp_pa = (12 * 0.00089 * 0.05 * 6.6666667e-9) / (0.001 * (0.0002^3) * (1 - 0.630 * 0.2))
          = 3.56e-12 / (1e-3 * 8e-12 * 0.874)
          = 3.56e-12 / 6.992e-15 = 509.1533 Pa
    dp_mbar = 5.091533 mbar
    """
    flow_uL_min = 400.0
    pressure_mbar = physics_twin.compute_theoretical_pressure(flow_uL_min=flow_uL_min)

    # Hand-derived analytical pressure
    q_m3_s = (400.0 * 1e-9) / 60.0
    geom_factor = 0.001 * (0.0002 ** 3) * (1.0 - 0.630 * (0.0002 / 0.001))
    expected_pa = (12.0 * 0.00089 * 0.05 * q_m3_s) / geom_factor
    expected_mbar = expected_pa / 100.0

    assert math.isclose(pressure_mbar, expected_mbar, rel_tol=1e-5)
    assert 5.08 < pressure_mbar < 5.11


def test_simulate_clogging_detection(physics_twin):
    """
    Simulate clogging (actual pressure 30% higher than theoretical)
    and verify it triggers 'CHANNEL_DEGRADATION_OR_CLOGGING'.
    """
    flow_uL_min = 400.0
    p_ideal = physics_twin.compute_theoretical_pressure(flow_uL_min)
    
    # 30% pressure increase due to microchannel constriction / bubble blockage
    actual_p_clogged = p_ideal * 1.30

    health_report = physics_twin.verify_channel_health(
        actual_p_mbar=actual_p_clogged,
        actual_q_uL_min=flow_uL_min,
    )

    assert health_report["status"] == "CHANNEL_DEGRADATION_OR_CLOGGING"
    assert math.isclose(health_report["deviation"], 0.30, abs_tol=1e-3)
    # Health score: 1.0 - deviation = 0.70
    assert math.isclose(health_report["health_score"], 0.70, abs_tol=1e-3)
    assert health_report["theoretical_pressure_mbar"] == round(p_ideal, 4)


def test_nominal_health_state(physics_twin):
    """
    Nominal operating conditions with small normal sensor noise (<25% deviation)
    should report 'NOMINAL' and full 1.0 health score.
    """
    flow_uL_min = 400.0
    p_ideal = physics_twin.compute_theoretical_pressure(flow_uL_min)
    
    # Slight normal fluctuation (+5%)
    actual_p_normal = p_ideal * 1.05

    health_report = physics_twin.verify_channel_health(
        actual_p_mbar=actual_p_normal,
        actual_q_uL_min=flow_uL_min,
    )

    assert health_report["status"] == "NOMINAL"
    assert health_report["health_score"] == 1.0
    assert math.isclose(health_report["deviation"], 0.05, abs_tol=1e-3)


def test_negative_flow_raises_error(physics_twin):
    """Negative flow rates should raise ValueError."""
    with pytest.raises(ValueError, match="Flow rate must be non-negative"):
        physics_twin.compute_theoretical_pressure(-10.0)


def test_zero_flow_health_validation(physics_twin):
    """Zero flow rate with zero pressure should be nominal."""
    report = physics_twin.verify_channel_health(actual_p_mbar=0.0, actual_q_uL_min=0.0)
    assert report["status"] == "NOMINAL"
    assert report["health_score"] == 1.0

    # Non-zero residual pressure at zero flow indicates sensor offset or trapped pressure
    blocked_report = physics_twin.verify_channel_health(actual_p_mbar=2.0, actual_q_uL_min=0.0)
    assert blocked_report["status"] == "CHANNEL_DEGRADATION_OR_CLOGGING"


def test_custom_channel_dimensions():
    """Verifies that custom channel geometry scales correctly."""
    # Longer channel should have higher hydraulic resistance and higher pressure drop
    longer_twin = MicrofluidicPhysicsTwin(length_m=0.10)  # Double length: 100 mm
    default_twin = MicrofluidicPhysicsTwin(length_m=0.05)

    p_default = default_twin.compute_theoretical_pressure(200.0)
    p_longer = longer_twin.compute_theoretical_pressure(200.0)

    assert math.isclose(p_longer, 2.0 * p_default, rel_tol=1e-5)
