"""
BioGuardian Digital Twin - Theoretical Physics Engine & Microfluidic Validator (Phase 02)
Implements analytical Hagen-Poiseuille fluid dynamics for rectangular microchannels
and provides real-time channel degradation / clogging detection.
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger("bioguardian.twin.physics")


class MicrofluidicPhysicsTwin:
    """
    Physics engine modeling fluid dynamics in microfluidic channels using the
    Hagen-Poiseuille rectangular channel approximation.
    """

    # Default physical & geometric constants
    DEFAULT_LENGTH_M: float = 0.05       # 50 mm
    DEFAULT_WIDTH_M: float = 0.001       # 1.0 mm
    DEFAULT_HEIGHT_M: float = 0.0002     # 0.2 mm (200 um)
    DEFAULT_VISCOSITY_PA_S: float = 0.00089  # Dynamic viscosity of water @ 25°C

    # Health evaluation threshold: 25% deviation from theoretical expectations
    DEVIATION_THRESHOLD: float = 0.25

    def __init__(
        self,
        length_m: float = DEFAULT_LENGTH_M,
        width_m: float = DEFAULT_WIDTH_M,
        height_m: float = DEFAULT_HEIGHT_M,
        viscosity_pa_s: float = DEFAULT_VISCOSITY_PA_S,
    ) -> None:
        """
        Initializes the physics model with channel dimensions and fluid properties.
        """
        if width_m <= 0 or height_m <= 0 or length_m <= 0:
            raise ValueError("Channel dimensions (L, W, H) must be strictly positive.")
        if viscosity_pa_s <= 0:
            raise ValueError("Dynamic viscosity must be strictly positive.")

        self.length_m = float(length_m)
        self.width_m = float(width_m)
        self.height_m = float(height_m)
        self.viscosity_pa_s = float(viscosity_pa_s)

        # Precompute hydraulic resistance geometry factor:
        # W * (H^3) * (1 - 0.630 * (H / W))
        aspect_ratio = self.height_m / self.width_m
        correction_factor = 1.0 - 0.630 * aspect_ratio
        if correction_factor <= 0:
            raise ValueError("Aspect ratio H/W violates rectangular channel approximation limits.")

        self._geom_denominator = self.width_m * (self.height_m ** 3) * correction_factor
        # Hydraulic resistance R_hyd where dp_pa = R_hyd * Q (with Q in m^3/s)
        self._hydraulic_resistance_pa_s_m3 = (12.0 * self.viscosity_pa_s * self.length_m) / self._geom_denominator

    def compute_theoretical_pressure(self, flow_uL_min: float) -> float:
        """
        Calculates theoretical pressure drop across the rectangular microchannel in millibars (mbar).

        Args:
            flow_uL_min: Volumetric flow rate in microliters per minute (uL/min).
        Returns:
            Theoretical pressure drop in mbar.
        """
        if flow_uL_min < 0:
            raise ValueError(f"Flow rate must be non-negative, got {flow_uL_min}")

        if flow_uL_min == 0.0:
            return 0.0

        # Convert uL/min to m^3/s: 1 uL = 1e-9 m^3, 1 min = 60 s
        q_m3_s = (flow_uL_min * 1e-9) / 60.0

        # dp_pa = (12 * viscosity * L * Q) / (W * (H^3) * (1 - 0.630 * (H / W)))
        dp_pa = self._hydraulic_resistance_pa_s_m3 * q_m3_s

        # 1 mbar = 100 Pa -> dp_mbar = dp_pa / 100.0
        dp_mbar = dp_pa / 100.0
        return dp_mbar

    def verify_channel_health(
        self, actual_p_mbar: float, actual_q_uL_min: float
    ) -> Dict[str, Any]:
        """
        Validates real-time sensor measurements against Hagen-Poiseuille theoretical predictions.
        Identifies channel clogging, constriction, or leakage based on pressure deviation.

        Args:
            actual_p_mbar: Observed pressure sensor reading in mbar.
            actual_q_uL_min: Observed flow sensor reading in uL/min.
        Returns:
            Dictionary containing health status, health score, expected pressure, and deviation.
        """
        p_ideal = self.compute_theoretical_pressure(actual_q_uL_min)

        if p_ideal == 0.0:
            # When theoretical pressure is zero (zero flow)
            if actual_p_mbar == 0.0:
                deviation = 0.0
            else:
                # Sensor reading residual pressure at zero flow indicates baseline drift / blockage
                deviation = 1.0
        else:
            deviation = abs(actual_p_mbar - p_ideal) / p_ideal

        if deviation > self.DEVIATION_THRESHOLD:
            status = "CHANNEL_DEGRADATION_OR_CLOGGING"
            health_score = max(0.0, 1.0 - deviation)
        else:
            status = "NOMINAL"
            health_score = 1.0

        return {
            "status": status,
            "health_score": round(health_score, 4),
            "deviation": round(deviation, 4),
            "actual_pressure_mbar": round(actual_p_mbar, 4),
            "theoretical_pressure_mbar": round(p_ideal, 4),
            "flow_uL_min": round(actual_q_uL_min, 4),
        }


if __name__ == "__main__":
    twin = MicrofluidicPhysicsTwin()
    print("==========================================================")
    print(" BioGuardian Theoretical Physics Engine (Phase 02)")
    print("==========================================================")
    print(f"Channel Geometry: L={twin.length_m*1e3:.1f}mm, W={twin.width_m*1e3:.1f}mm, H={twin.height_m*1e6:.1f}um")
    print(f"Viscosity: {twin.viscosity_pa_s} Pa.s (Water @ 25°C)")
    print("-" * 58)

    test_flows = [0.0, 100.0, 400.0, 1000.0]
    for q in test_flows:
        p = twin.compute_theoretical_pressure(q)
        print(f"Flow: {q:6.1f} uL/min -> Theoretical Pressure: {p:.4f} mbar")

    print("-" * 58)
    # Verification test at nominal and clogged state
    nominal_health = twin.verify_channel_health(actual_p_mbar=5.10, actual_q_uL_min=400.0)
    print("Nominal Check (p=5.10 mbar, q=400 uL/min):", nominal_health)

    clogged_health = twin.verify_channel_health(actual_p_mbar=6.62, actual_q_uL_min=400.0)
    print("Clogged Check (+30% p, q=400 uL/min):", clogged_health)
    print("==========================================================")
