# BioGuardian ESP32 Hardware Integration & Flashing Guide

This guide is for the **Hardware & Embedded Team** to flash, wire, and test the ESP32 sensor node with the BioGuardian real-time life support system.

---

## 1. System Architecture

```
[ Microfluidic Perfusion Line ]
   │
   ├─► IR Bubble Detector (GPIO 34)
   ├─► Pressure Transducer (GPIO 35) ──► [ ESP32 Microcontroller Node ]
   ├─► Temperature Sensor  (GPIO 32)         │
   ├─► pH Sensor Probe     (GPIO 33)         ├─► Dual Protocol:
   └─► Flow Pulse Meter    (GPIO 25)         │     1. HTTP POST (Optional Base URI)
                                             │     2. MQTT (Optional Broker)
[ Pinch Valve Relay ] <── (GPIO 26) ─────────┘     │
                                                   ▼
                                         [ BioGuardian Gateway ]
                                         (FastAPI Port 8000)
                                                   │
                                         ┌─────────┴─────────┐
                                         ▼                   ▼
                                 [ Main Dashboard ]   [ 3D Digital Twin ]
```

---

## 2. Hardware Pinout & Wiring Table

| Sensor / Actuator | ESP32 Pin | Type | Notes & Voltage Level |
|---|---|---|---|
| **IR Bubble Sensor** | **GPIO 34** (ADC1_CH6) | Analog Input | Phototransistor signal (0 - 3.3V). Voltage dips below 1.65V when an air bubble passes the optical path. |
| **Pressure Transducer** | **GPIO 35** (ADC1_CH7) | Analog Input | Hydrostatic sensor (0 - 3.3V). Calibrated range: 950 - 1100 mbar. |
| **Temperature Sensor** | **GPIO 32** (ADC1_CH4) | Analog Input | NTC thermistor or analog temperature probe (0 - 3.3V). Calibrated for 20°C - 45°C. |
| **Electrochemical pH** | **GPIO 33** (ADC1_CH5) | Analog Input | Signal conditioning board output (0 - 3.3V). Calibrated for pH 5.5 - 8.5. |
| **Flow Meter** | **GPIO 25** | Digital Input | Pulse frequency / interrupt pin. Pulled HIGH internally; pulses on liquid displacement. |
| **Bubble Intercept Valve** | **GPIO 26** | Digital Output | Active-HIGH to MOSFET / relay driving high-speed micro-solenoid pinch valve. |
| **Status LED** | **GPIO 2** | Digital Output | On-board blue LED. Blinks during WiFi connect; solid when operational; flashes on bubble detection. |

> [!IMPORTANT]
> Use **ADC1** pins (GPIO 32, 33, 34, 35) as assigned above. **Do not use ADC2 pins** (GPIO 0, 2, 4, 12-15, 25-27) for analog reads while WiFi is active, as WiFi uses ADC2 internally.

---

## 3. Configuration & Optional Base URI

Open `hardware/esp32_firmware/esp32_firmware.ino` in Arduino IDE or PlatformIO.

At the top of the file:

```cpp
// 1. WiFi Credentials
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// 2. Device ID
const char* DEVICE_ID     = "BG-ESP32-001";

// 3. OPTIONAL HTTP Backend:
// Put the IP address of the laptop/PC running the BioGuardian server
const char* SERVER_BASE_URI = "http://192.168.1.100:8000"; 
const bool  ENABLE_HTTP_POST = true;

// 4. OPTIONAL MQTT:
const bool  ENABLE_MQTT     = false; // Set true only if running an MQTT broker
const char* MQTT_BROKER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
```

### Why the Base URI is Optional:
- **Direct HTTP POST (Recommended)**: If `ENABLE_HTTP_POST = true` and `SERVER_BASE_URI` is set (e.g. `http://192.168.1.100:8000`), the ESP32 sends telemetry directly to `POST /api/telemetry/ingest`. No MQTT broker required!
- **Skipping HTTP**: If `SERVER_BASE_URI` is left empty (`""`) or `ENABLE_HTTP_POST = false`, the ESP32 skips HTTP requests without crashing and transmits via MQTT or prints to the Serial Monitor.

---

## 4. Standalone Mock Firmware (Zero Wiring Required)

For rapid end-to-end testing without wiring up physical breadboard sensors, use the dedicated mock sketch:
👉 [`hardware/esp32_firmware/esp32_mock_sensor_node.ino`](file:///home/buildwithrehan_7/Desktop/BioGuardian/BioGuardian/hardware/esp32_firmware/esp32_mock_sensor_node.ino)

### What it does:
- Generates realistic microfluidic physics (flow ~450 µL/min, pressure ~1012 mbar, temp ~37.0°C, pH ~7.38).
- Automatically triggers a simulated bubble event every 25 seconds for 5 seconds to test the Digital Twin alert.
- Transmits HTTP POST packets directly to `http://<YOUR_PC_IP>:8004/api/telemetry/ingest`.
- Rapidly flashes the on-board LED on GPIO 2 when a bubble anomaly is triggered.

---

## 5. Step-by-Step Flashing Instructions

### Prerequisites (Arduino IDE)
1. Install **Arduino IDE** (v2.0+ recommended).
2. Install the **ESP32 Board Package**:
   - Open **Settings** / **Preferences**.
   - In "Additional Board Manager URLs", add:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Go to **Boards Manager**, search for `esp32` by Espressif, and click **Install**.
3. *(Optional)* Install **PubSubClient** if using MQTT. For direct HTTP REST, no extra libraries are needed!

### Board Settings in Arduino IDE
- **Board**: `ESP32 Dev Module` (or `NodeMCU-32S`)
- **CPU Frequency**: `240MHz (WiFi/BT)`
- **Upload Speed**: `921600` (or `115200` if upload fails)
- **Port**: Select the USB COM port of your ESP32 (e.g., `COM3` on Windows, `/dev/ttyUSB0` on Linux).

### Compile & Upload
1. Open `hardware/esp32_firmware/esp32_mock_sensor_node.ino` (or `esp32_firmware.ino`).
2. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `SERVER_BASE_URI`.
3. Click the **Upload** arrow button.
4. If your board requires it, hold down the **BOOT** button on the ESP32 when `Connecting........___` appears.

---

## 6. Verifying in Serial Monitor

Open the **Serial Monitor** at **115200 baud**:

You will see:
```
==========================================================
    BioGuardian ESP32 Mock Telemetry Transmitter Node     
==========================================================
 Mode: Standalone Mock Sensors (Zero Hardware Wiring)
 Target Endpoint: http://10.126.25.224:8004/api/telemetry/ingest
----------------------------------------------------------
[WiFi] Connecting to SSID: MyLabWiFi
.....
[WiFi] Successfully connected!
[WiFi] ESP32 IP Address: 10.126.25.145
[WiFi] Target Backend URL: http://10.126.25.224:8004/api/telemetry/ingest

🟢 [NOMINAL] HTTP 200 | Flow: 452.1 uL/min | Press: 1012.8 mbar | Temp: 37.0 C | Bubble: NO
🟢 [NOMINAL] HTTP 200 | Flow: 449.6 uL/min | Press: 1011.9 mbar | Temp: 37.1 C | Bubble: NO
🔴 [BUBBLE ALERT] HTTP 200 | Flow: 310.0 uL/min | Press: 1032.5 mbar | Temp: 37.0 C | Bubble: YES
```

---

## 7. Starting the Backend Server on Port 8004

1. On your PC, start the FastAPI backend on port 8004 binding to `0.0.0.0`:
   ```bash
   cd server
   ./.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8004
   ```
   *(Binding to `0.0.0.0` allows the ESP32 on your local Wi-Fi to reach port 8004).*

2. Open the frontend dashboard:
   - Click **`[ 📡 Real-Time APIs ]`** in the top bar.
   - The status badge will turn green: **`● LIVE APIS CONNECTED`**.
   - The live sensor readings and 3D Digital Twin will now update in real time with the ESP32!
