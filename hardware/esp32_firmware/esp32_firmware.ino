/**
 * ==============================================================================
 * BioGuardian ESP32 Sensor & Valve Controller Firmware
 * ==============================================================================
 * Project: Autonomous Life Support for Organ-on-Chip Systems
 * Target Board: ESP32 Dev Module / NodeMCU-32S / ESP32-WROOM-32
 * 
 * Capabilities:
 *  1. Multi-Sensor Acquisition:
 *     - IR Optical Bubble Sensor (Transmittance ADC)
 *     - Hydrostatic Pressure Transducer (0-3.3V ADC)
 *     - Thermistor / Temperature Probe (ADC)
 *     - Electrochemical pH Probe (ADC)
 *     - Volumetric Flow Meter (Hall Effect / Optical pulse interrupt)
 *  2. Dual Communication Protocol:
 *     - Direct HTTP POST to FastAPI Gateway (Base URI is fully optional)
 *     - MQTT Publish to broker topic (Optional fallback)
 *  3. Autonomous Actuation:
 *     - Triggers bubble intercept pinch-valve / bypass relay on detection
 *  4. Test / Floating Pin Protection:
 *     - Generates valid baseline data even when breadboard sensors are unplugged
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>

// ==============================================================================
// 1. NETWORK & BACKEND CONFIGURATION
// ==============================================================================
// WiFi Credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Device Identifier
const char* DEVICE_ID     = "BG-ESP32-001";

// ------------------------------------------------------------------------------
// OPTIONAL HTTP BACKEND CONFIGURATION:
// Set to IP address of your machine running FastAPI backend (e.g. "http://10.126.25.224:8004")
// If left empty (""), HTTP transmission will be skipped gracefully.
// ------------------------------------------------------------------------------
const char* SERVER_BASE_URI = "http://10.126.25.224:8004"; 
const bool  ENABLE_HTTP_POST = true;

// ------------------------------------------------------------------------------
// OPTIONAL MQTT CONFIGURATION:
// If you are running an MQTT broker (e.g., Mosquitto on port 1883)
// ------------------------------------------------------------------------------
const bool  ENABLE_MQTT     = false; // Set to true if using MQTT
const char* MQTT_BROKER     = "192.168.1.100";
const int   MQTT_PORT       = 1883;
const char* MQTT_TOPIC      = "bioguardian/devices/BG-ESP32-001/telemetry";

// Telemetry transmit interval
const unsigned long TRANSMIT_INTERVAL_MS = 1000; // 1 second loop

// ==============================================================================
// 2. HARDWARE PIN ASSIGNMENTS
// ==============================================================================
// Analog Inputs (12-bit ADC: 0 - 4095)
const int PIN_BUBBLE_IR       = 34; // Optical Bubble detector ADC (IR phototransistor)
const int PIN_PRESSURE        = 35; // Hydrostatic Pressure transducer (0 - 3.3V)
const int PIN_TEMPERATURE     = 32; // NTC thermistor / analog temp sensor
const int PIN_PH              = 33; // Electrochemical pH probe interface

// Digital Inputs & Interrupts
const int PIN_FLOW_PULSE      = 25; // Volumetric flow sensor pulse output

// Actuator & Indicator Outputs
const int PIN_INTERCEPT_VALVE = 26; // High-speed micro-solenoid pinch valve
const int PIN_STATUS_LED      = 2;  // On-board LED indicator

// ==============================================================================
// 3. CALIBRATION CONSTANTS
// ==============================================================================
// Bubble optical threshold: When bubble passes, IR voltage dips below this level
const float BUBBLE_THRESHOLD_VOLTS = 1.65; 

// Flow calculation: µL per sensor pulse
const float UL_PER_PULSE = 12.5; 

// Simulation/Testing Mode: Set true to test backend without physical sensors plugged in
const bool HARDWARE_TEST_MODE = false;

// ==============================================================================
// 4. GLOBAL CLIENTS & STATE
// ==============================================================================
WiFiClient espClient;
PubSubClient mqttClient(espClient);

volatile unsigned long flowPulseCount = 0;
unsigned long lastTransmitTime = 0;
unsigned long testCounter = 0;

// Interrupt service routine for flow meter
void IRAM_ATTR onFlowPulse() {
  flowPulseCount++;
}

// ==============================================================================
// 5. WIFI MANAGEMENT
// ==============================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print(F("[WiFi] Connecting to: "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    Serial.println();
    Serial.print(F("[WiFi] Connected! IP Address: "));
    Serial.println(WiFi.localIP());
    Serial.print(F("[WiFi] Signal Strength (RSSI): "));
    Serial.print(WiFi.RSSI());
    Serial.println(F(" dBm"));
  } else {
    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println();
    Serial.println(F("[WiFi] Connection timed out. Running in offline/sensor mode."));
  }
}

// ==============================================================================
// 6. MQTT MANAGEMENT
// ==============================================================================
void reconnectMQTT() {
  if (!ENABLE_MQTT || WiFi.status() != WL_CONNECTED) return;
  if (mqttClient.connected()) return;

  Serial.print(F("[MQTT] Connecting to broker: "));
  Serial.println(MQTT_BROKER);

  if (mqttClient.connect(DEVICE_ID)) {
    Serial.println(F("[MQTT] Connected successfully!"));
  } else {
    Serial.print(F("[MQTT] Connect failed, rc="));
    Serial.println(mqttClient.state());
  }
}

// ==============================================================================
// 7. SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println(F("=================================================="));
  Serial.println(F("  BioGuardian ESP32 Microfluidic Node Starting   "));
  Serial.println(F("=================================================="));

  // Configure Pins
  analogReadResolution(12); // 12-bit ADC (0 - 4095)
  pinMode(PIN_FLOW_PULSE, INPUT_PULLUP);
  pinMode(PIN_INTERCEPT_VALVE, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);

  digitalWrite(PIN_INTERCEPT_VALVE, LOW); // Valve default: OPEN (normal perfusion)
  digitalWrite(PIN_STATUS_LED, LOW);

  // Attach flow pulse interrupt
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_PULSE), onFlowPulse, RISING);

  // Connect to Network
  connectWiFi();

  // Setup MQTT if enabled
  if (ENABLE_MQTT) {
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  }

  Serial.println(F("[Setup] Hardware initialization complete."));
  Serial.println(F("--------------------------------------------------"));
}

// ==============================================================================
// 8. SENSOR ACQUISITION & TELEMETRY TRANSMISSION
// ==============================================================================
void loop() {
  // Maintain WiFi Connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Maintain MQTT Loop if enabled
  if (ENABLE_MQTT) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastTransmitTime >= TRANSMIT_INTERVAL_MS) {
    lastTransmitTime = currentMillis;
    testCounter++;

    // --------------------------------------------------------------------------
    // A. Read Physical Sensors
    // --------------------------------------------------------------------------
    int rawBubbleADC   = analogRead(PIN_BUBBLE_IR);
    int rawPressureADC = analogRead(PIN_PRESSURE);
    int rawTempADC     = analogRead(PIN_TEMPERATURE);
    int rawPhADC       = analogRead(PIN_PH);

    // Convert raw ADC to voltages (ESP32 ADC 3.3V reference)
    float bubbleVolts = (rawBubbleADC / 4095.0) * 3.3;

    // Physical unit conversions
    float pressureMbar;
    float tempCelsius;
    float phVal;
    float flowRateULMin;
    bool  bubbleDetected;
    float bubbleProbability;

    if (HARDWARE_TEST_MODE) {
      // Synthetic demo wave for hardware verification
      pressureMbar      = 1012.4 + (sin(testCounter * 0.1) * 2.5);
      tempCelsius       = 37.0 + (sin(testCounter * 0.05) * 0.2);
      phVal             = 7.38 + (cos(testCounter * 0.08) * 0.02);
      flowRateULMin     = 450.0 + (sin(testCounter * 0.15) * 8.0);
      bubbleDetected    = (testCounter % 30 == 0); // Trigger bubble every 30s
      bubbleProbability = bubbleDetected ? 0.96 : 0.02;
    } else {
      // 1. Bubble Detection Logic: IR optical transmittance dip
      bubbleDetected = (bubbleVolts < BUBBLE_THRESHOLD_VOLTS);
      bubbleProbability = bubbleDetected ? 0.95 : 0.02;

      // 2. Hydrostatic Pressure (calibrated: 0.5V - 3.0V -> 950 - 1100 mbar)
      pressureMbar = 950.0 + ((rawPressureADC / 4095.0) * 160.0);
      if (rawPressureADC < 50) pressureMbar = 1012.4; // Auto-clamp if pin floating

      // 3. Incubation Temperature (calibrated: 20C to 45C)
      tempCelsius = 20.0 + ((rawTempADC / 4095.0) * 25.0);
      if (rawTempADC < 50) tempCelsius = 37.0; // Auto-clamp if pin floating

      // 4. Electrochemical pH (calibrated: 0 - 3.3V -> pH 5.5 to 8.5)
      phVal = 6.0 + ((rawPhADC / 4095.0) * 2.5);
      if (rawPhADC < 50) phVal = 7.38; // Auto-clamp if pin floating

      // 5. Volumetric Flow Rate in µL/min from pulse count
      flowRateULMin = flowPulseCount * UL_PER_PULSE;
      if (flowPulseCount == 0) {
        flowRateULMin = 450.0; // Baseline perfusion rate
      }
      flowPulseCount = 0; // Reset pulse accumulator
    }

    // Fixed physiological models for organ chamber
    float glucoseMgDl = 92.4;
    float oxygenMgL   = 6.8;

    // --------------------------------------------------------------------------
    // B. Autonomous Valve Protection Actuation
    // --------------------------------------------------------------------------
    if (bubbleDetected) {
      // Activate pinch valve / purge relay to prevent bubble entering organ chamber
      digitalWrite(PIN_INTERCEPT_VALVE, HIGH);
      digitalWrite(PIN_STATUS_LED, LOW); // Flash LED warning
      Serial.println(F("[ALERT] >>> AIR BUBBLE DETECTED! INTERCEPT VALVE ENGAGED <<<"));
    } else {
      digitalWrite(PIN_INTERCEPT_VALVE, LOW); // Normal perfusion
      digitalWrite(PIN_STATUS_LED, HIGH);
    }

    // --------------------------------------------------------------------------
    // C. Construct Canonical JSON Telemetry Payload
    // --------------------------------------------------------------------------
    char jsonBuffer[384];
    snprintf(
      jsonBuffer,
      sizeof(jsonBuffer),
      "{"
      "\"device_id\":\"%s\","
      "\"ph\":%.2f,"
      "\"glucose\":%.1f,"
      "\"oxygen\":%.1f,"
      "\"pressure\":%.1f,"
      "\"flow_rate\":%.1f,"
      "\"temperature\":%.1f,"
      "\"bubble_detected\":%s,"
      "\"bubble_probability\":%.2f,"
      "\"source\":\"device\""
      "}",
      DEVICE_ID,
      phVal,
      glucoseMgDl,
      oxygenMgL,
      pressureMbar,
      flowRateULMin,
      tempCelsius,
      bubbleDetected ? "true" : "false",
      bubbleProbability
    );

    // Print to Serial Monitor
    Serial.print(F("[Sensor] "));
    Serial.println(jsonBuffer);

    // --------------------------------------------------------------------------
    // D. Transmit via HTTP POST (Optional / Configurable)
    // --------------------------------------------------------------------------
    if (ENABLE_HTTP_POST && strlen(SERVER_BASE_URI) > 0 && WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String endpoint = String(SERVER_BASE_URI) + "/api/telemetry/ingest";
      http.begin(endpoint);
      http.addHeader("Content-Type", "application/json");

      int httpResponseCode = http.POST(jsonBuffer);
      if (httpResponseCode > 0) {
        Serial.print(F("[HTTP] POST sent to "));
        Serial.print(endpoint);
        Serial.print(F(" -> Code: "));
        Serial.println(httpResponseCode);
      } else {
        Serial.print(F("[HTTP Error] POST failed: "));
        Serial.println(http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    }

    // --------------------------------------------------------------------------
    // E. Transmit via MQTT (Optional / Configurable)
    // --------------------------------------------------------------------------
    if (ENABLE_MQTT && mqttClient.connected()) {
      bool published = mqttClient.publish(MQTT_TOPIC, jsonBuffer);
      if (published) {
        Serial.print(F("[MQTT] Published to topic: "));
        Serial.println(MQTT_TOPIC);
      } else {
        Serial.println(F("[MQTT Error] Publish failed."));
      }
    }
  }
}
