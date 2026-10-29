# BioGuardian: Edge AI Microfluidic Anomaly Prediction System

**BioGuardian** is an ultra-low-latency, dual-modality Edge AI and computer vision system designed for real-time microfluidic bubble detection and spatial analytics. Operating on high-frequency multi-sensor streams (micro-pressure, flow rate, IR transmittance, and temperature), the system extracts sliding-window statistical features, runs sub-millisecond C++ neural network inference, and quantifies physical bubble geometry via OpenCV to execute automated valve control.

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

