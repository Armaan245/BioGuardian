"""
simulate_sensor_data.py
────────────────────────────────────────────────────────────────────────────
BioGuardian — Synthetic Microfluidic Sensor Data Generator
────────────────────────────────────────────────────────────────────────────

Generates a 30-minute synthetic dataset sampled at 20 Hz (50 ms intervals)
containing two physiological classes:

  label = 0  →  NORMAL_FLOW   (first 15 minutes)
  label = 1  →  BUBBLE_RISK   (last  15 minutes)

Output CSV columns
──────────────────
  timestamp_ms   : elapsed time since epoch start (ms)
  pressure_raw   : barometric / channel pressure  (mbar)
  flow_raw       : micro-flow rate                (µL/min)
  ir_analog_raw  : IR photodetector signal        (mV)
  temp_c         : channel temperature            (°C)
  label          : 0 = NORMAL_FLOW | 1 = BUBBLE_RISK

Usage
─────
  python simulate_sensor_data.py
  python3 simulate_sensor_data.py
"""

import csv
import math
import os
import random
import sys
import time

# ──────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────

SAMPLE_RATE_HZ       = 20           # samples per second
SAMPLE_INTERVAL_MS   = 1000 // SAMPLE_RATE_HZ   # 50 ms

DURATION_MINUTES     = 30
NORMAL_MINUTES       = 15
BUBBLE_MINUTES       = 15

TOTAL_SAMPLES        = DURATION_MINUTES * 60 * SAMPLE_RATE_HZ   # 36 000
NORMAL_SAMPLES       = NORMAL_MINUTES  * 60 * SAMPLE_RATE_HZ    # 18 000
BUBBLE_SAMPLES       = BUBBLE_MINUTES  * 60 * SAMPLE_RATE_HZ    # 18 000

OUTPUT_FILE          = "sensor_data_log.csv"
CSV_COLUMNS          = ["timestamp_ms", "pressure_raw", "flow_raw",
                        "ir_analog_raw", "temp_c", "label"]

# ──────────────────────────────────────────────────────────────────────────
# Baseline / Noise parameters
# ──────────────────────────────────────────────────────────────────────────

# NORMAL_FLOW baseline values
NORM_PRESSURE_BASE   = 1012.0       # mbar
NORM_FLOW_BASE       = 450.0        # µL/min
NORM_IR_BASE         = 3850.0       # mV
NORM_TEMP_BASE       = 24.1         # °C

# Light Gaussian noise standard deviations for NORMAL class
NORM_PRESSURE_STD    = 0.30         # mbar
NORM_FLOW_STD        = 2.50         # µL/min
NORM_IR_STD          = 4.00         # mV
NORM_TEMP_STD        = 0.03         # °C

# BUBBLE_RISK anomaly parameters
BUBBLE_PRESSURE_STD      = 0.50     # background noise (mbar)
BUBBLE_FLOW_STD          = 8.00     # baseline noise  (µL/min)
BUBBLE_IR_STD            = 12.00    # baseline noise  (mV)
BUBBLE_TEMP_DRIFT_RATE   = 0.0002   # °C per sample (gradual rise over 15 min)
BUBBLE_TEMP_STD          = 0.05     # °C noise on top of drift

# Pressure drop spike: probability and magnitude
BUBBLE_PDROP_PROB        = 0.015    # ~1.5 % of samples trigger a spike
BUBBLE_PDROP_MIN         = -3.5     # mbar
BUBBLE_PDROP_MAX         = -1.0     # mbar

# Flow-rate variance spike: probability and magnitude
BUBBLE_FLOW_SPIKE_PROB   = 0.020    # ~2 % of samples
BUBBLE_FLOW_SPIKE_STD    = 35.0     # µL/min  (one-sided positive spike)

# IR dip: probability and depth
BUBBLE_IR_DIP_PROB       = 0.025    # ~2.5 % of samples
BUBBLE_IR_DIP_MIN        = -80.0    # mV dip
BUBBLE_IR_DIP_MAX        = -20.0    # mV dip

# ──────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────

def gauss(mu: float, sigma: float) -> float:
    """Gaussian random sample."""
    return random.gauss(mu, sigma)


def uniform(lo: float, hi: float) -> float:
    """Uniform random sample."""
    return random.uniform(lo, hi)


def low_freq_drift(sample_idx: int,
                   period_samples: int = 400,
                   amplitude: float = 0.15) -> float:
    """
    Slow sinusoidal drift to mimic pump pulsatility / thermal creep.
    period_samples ~400 = ~20-second cycle at 20 Hz.
    """
    return amplitude * math.sin(2.0 * math.pi * sample_idx / period_samples)


# ──────────────────────────────────────────────────────────────────────────
# Sample generators
# ──────────────────────────────────────────────────────────────────────────

def generate_normal_sample(sample_idx: int, timestamp_ms: int) -> list:
    """
    NORMAL_FLOW class (label = 0).
    Stable baseline + light Gaussian noise + slow periodic drift.
    """
    pressure = (NORM_PRESSURE_BASE
                + gauss(0, NORM_PRESSURE_STD)
                + low_freq_drift(sample_idx, period_samples=600, amplitude=0.12))

    flow     = (NORM_FLOW_BASE
                + gauss(0, NORM_FLOW_STD)
                + low_freq_drift(sample_idx, period_samples=400, amplitude=1.5))

    ir       = (NORM_IR_BASE
                + gauss(0, NORM_IR_STD)
                + low_freq_drift(sample_idx, period_samples=500, amplitude=3.0))

    temp     = (NORM_TEMP_BASE
                + gauss(0, NORM_TEMP_STD)
                + low_freq_drift(sample_idx, period_samples=1200, amplitude=0.02))

    return [
        timestamp_ms,
        round(pressure, 4),
        round(flow,     4),
        round(ir,       4),
        round(temp,     4),
        0,
    ]


def generate_bubble_sample(sample_idx: int,
                            timestamp_ms: int,
                            bubble_local_idx: int) -> list:
    """
    BUBBLE_RISK class (label = 1).
    Elevated noise + probabilistic anomaly spikes + gradual temp rise.
    """
    # Pressure: background noise + occasional negative dP/dt spike
    pressure = (NORM_PRESSURE_BASE
                + gauss(0, BUBBLE_PRESSURE_STD)
                + low_freq_drift(sample_idx, period_samples=600, amplitude=0.18))

    if random.random() < BUBBLE_PDROP_PROB:
        pressure += uniform(BUBBLE_PDROP_MIN, BUBBLE_PDROP_MAX)

    # Flow: higher variance + occasional positive spike
    flow = (NORM_FLOW_BASE
            + gauss(0, BUBBLE_FLOW_STD)
            + low_freq_drift(sample_idx, period_samples=400, amplitude=2.5))

    if random.random() < BUBBLE_FLOW_SPIKE_PROB:
        flow += abs(gauss(0, BUBBLE_FLOW_SPIKE_STD))

    # IR: high-frequency jitter + occasional deep dip
    ir = (NORM_IR_BASE
          + gauss(0, BUBBLE_IR_STD)
          + low_freq_drift(sample_idx, period_samples=500, amplitude=5.0))

    if random.random() < BUBBLE_IR_DIP_PROB:
        ir += uniform(BUBBLE_IR_DIP_MIN, BUBBLE_IR_DIP_MAX)

    # Temperature: gradual linear rise + noise
    temp = (NORM_TEMP_BASE
            + BUBBLE_TEMP_DRIFT_RATE * bubble_local_idx
            + gauss(0, BUBBLE_TEMP_STD)
            + low_freq_drift(sample_idx, period_samples=1200, amplitude=0.03))

    return [
        timestamp_ms,
        round(pressure, 4),
        round(flow,     4),
        round(ir,       4),
        round(temp,     4),
        1,
    ]


# ──────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────

def main() -> None:
    random.seed(42)   # reproducible results

    script_dir   = os.path.dirname(os.path.abspath(__file__))
    output_path  = os.path.join(script_dir, OUTPUT_FILE)

    print("=" * 62)
    print("  BioGuardian -- Synthetic Sensor Data Generator")
    print("=" * 62)
    print(f"  Sample rate      : {SAMPLE_RATE_HZ} Hz  ({SAMPLE_INTERVAL_MS} ms interval)")
    print(f"  Duration         : {DURATION_MINUTES} minutes")
    print(f"  Total samples    : {TOTAL_SAMPLES:,}")
    print(f"    NORMAL_FLOW    : {NORMAL_SAMPLES:,} samples ({NORMAL_MINUTES} min)")
    print(f"    BUBBLE_RISK    : {BUBBLE_SAMPLES:,} samples ({BUBBLE_MINUTES} min)")
    print(f"  Output file      : {output_path}")
    print("-" * 62)

    t_start = time.time()
    rows_written = 0

    with open(output_path, "w", newline="") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(CSV_COLUMNS)

        # Phase 1: NORMAL_FLOW (label = 0)
        print("  Generating NORMAL_FLOW segment ...", end="", flush=True)
        for i in range(NORMAL_SAMPLES):
            ts_ms = i * SAMPLE_INTERVAL_MS
            row   = generate_normal_sample(i, ts_ms)
            writer.writerow(row)
            rows_written += 1
        print(f" done  ({NORMAL_SAMPLES:,} rows)")

        # Phase 2: BUBBLE_RISK (label = 1)
        print("  Generating BUBBLE_RISK segment ...", end="", flush=True)
        for j in range(BUBBLE_SAMPLES):
            global_idx = NORMAL_SAMPLES + j
            ts_ms      = global_idx * SAMPLE_INTERVAL_MS
            row        = generate_bubble_sample(global_idx, ts_ms, j)
            writer.writerow(row)
            rows_written += 1
        print(f" done  ({BUBBLE_SAMPLES:,} rows)")

    elapsed = time.time() - t_start

    # Verification
    file_size_kb = os.path.getsize(output_path) / 1024
    print("-" * 62)
    print(f"  [OK] File written   : {OUTPUT_FILE}")
    print(f"  [OK] Rows written   : {rows_written:,}  (expected {TOTAL_SAMPLES:,})")
    print(f"  [OK] File size      : {file_size_kb:.1f} KB")
    print(f"  [OK] Elapsed time   : {elapsed:.2f} s")

    # Row-count sanity check
    with open(output_path, "r") as f:
        actual_rows = sum(1 for _ in f) - 1   # subtract header

    status = "PASS" if actual_rows == TOTAL_SAMPLES else "FAIL"
    print(f"  [OK] Row count check: {status}  ({actual_rows:,} data rows in CSV)")
    print("=" * 62)

    if actual_rows != TOTAL_SAMPLES:
        sys.exit(1)


if __name__ == "__main__":
    main()
