# BioGuardian: Edge AI Microfluidic Anomaly Prediction System

**BioGuardian** is an ultra-low-latency, dual-modality Edge AI and computer vision system designed for real-time microfluidic bubble detection and spatial analytics. Operating on high-frequency multi-sensor streams (micro-pressure, flow rate, IR transmittance, and temperature), the system extracts sliding-window statistical features, runs sub-millisecond C++ neural network inference, and quantifies physical bubble geometry via OpenCV to execute automated valve control.

---

## 🏗️ System Architecture

[ Sensor Simulation / Hardware ]
├── Micro-Pressure (mbar)
├── Micro-Flow (µL/min)
├── IR Transmittance (mV)
└── Temperature (°C)
│
▼
[ Sliding Window Feature Extractor ]
└── 2.0s Window / 0.2s Stride (6D Feature Vector)
│
├──► [ C++ Edge Inference Engine ] (100 ns Latency)
│         └── MLP Classifier (model_data.h) -> BUBBLE_RISK Alert
│
└──► [ OpenCV Vision Pipeline ]
└── Spatial Geometry Analysis (Diameter, Volume, Action)
│
▼
[ JSON Telemetry Publisher ]
└── MQTT / HTTP Stream

---

## 🚀 Key Features

* **Dual-Modality Detection:** Integrates high-frequency 20 Hz time-series sensor fusion with optical computer vision.
* **Ultra-Fast Edge Inference:** C++ inference engine executes forward pass predictions in **0.0001 ms (100 ns)** with zero heap allocation.
* **High Model Precision:** 6D feature vector trained on 36,000 sensor samples achieves **99.99% classification accuracy**.
* **Spatial Bubble Sizing:** OpenCV pipeline calculates bubble diameter ($d$), microfluidic volume ($V$), and assigns severity tiers (`MICRO_BUBBLE`, `SHEARING_BUBBLE`, `MACRO_SLUG`).
* **Standardized Telemetry:** Outputs structured JSON payloads combining inference probabilities, vision metrics, and valve actuation flags.

---

## 📁 Repository Structure

BioGuardian/
├── software/
│   ├── pi_zero/
│   │   ├── simulate_sensor_data.py   # Synthetic 20Hz multi-sensor data generator
│   │   ├── train_model.py            # Feature extraction & MLP training script
│   │   ├── model_data.h              # Exported Z-score constants & model params
│   │   ├── main.cpp                  # C++ edge inference engine entry point
│   │   ├── run_cpp_engine.py         # Python runner for C++ parameter evaluation
│   │   └── requirements.txt          # Python dependencies
│   └── vision/
│       ├── bubble_sizer.py           # OpenCV contour analyzer & volume calculator
│       └── telemetry_publisher.py    # Unified telemetry JSON generator
├── sensor_data_log.csv               # Generated 20Hz dataset (36,000 rows)
└── README.md

---

## ⚙️ Quick Start Guide

### Prerequisites

* Python 3.10+
* GCC / G++ C++ Compiler (MinGW-w64 on Windows or native GCC on Linux)
* Python packages: `numpy`, `pandas`, `scikit-learn`, `opencv-python`

---

### Step-by-Step Execution

#### 1. Clone the Repository
```bash
git clone [https://github.com/Armaan245/BioGuardian.git](https://github.com/Armaan245/BioGuardian.git)
cd BioGuardian

###Install Python Dependencies

pip install -r software/pi_zero/requirements.txt

Generate Synthetic Sensor Data (Phase 1)

python software/pi_zero/simulate_sensor_data.py

Train Feature Engineering Model (Phase 2)

python software/pi_zero/train_model.py

Compile and Run C++ Edge AI Engine (Phase 3)

# Set PATH for current session if using MinGW on Windows
$env:Path += ";C:\msys64\ucrt64\bin"

# Compile and run engine
cd software/pi_zero
g++ -O2 -std=c++17 main.cpp -o pi_zero_edge_ai
.\pi_zero_edge_ai.exe

Run OpenCV Vision & Telemetry Pipeline (Phases 4 & 5)

python software/vision/bubble_sizer.py
python software/vision/telemetry_publisher.py

📊 Telemetry Output Example

{
  "timestamp_utc": "2026-09-09T18:50:54Z",
  "device_id": "BioGuardian-PiZero-01",
  "event": "BUBBLE_ALERT",
  "inference_metrics": {
    "model_version": "v1.0-mlp-int8",
    "prediction": "BUBBLE_RISK",
    "confidence": 0.98,
    "latency_ms": 0.0001
  },
  "vision_metrics": {
    "diameter_mm": 0.6,
    "volume_uL": 0.1131,
    "category": "SHEARING_BUBBLE",
    "risk_level": "HIGH_RISK",
    "action": "ALERT_PREPARE_PURGE_VALVE"
  },
  "sensor_snapshot": {
    "pressure_mbar": 980.0,
    "flow_uL_min": 410.0,
    "ir_transmittance_mv": 480.0,
    "temperature_c": 25.6
  }
}
