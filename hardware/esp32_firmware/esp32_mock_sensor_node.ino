/**
 * ==============================================================================
 * BioGuardian ESP32 Standalone Mock Sensor Node
 * ==============================================================================
 * Target Board: Any ESP32 (Dev Module, NodeMCU-32S, ESP32-WROOM-32, etc.)
 * 
 * Purpose:
 *   Runs directly on an ESP32 with ZERO external sensors or breadboard wiring.
 *   Generates realistic synthetic microfluidic telemetry and sends HTTP POST
 *   requests directly to the BioGuardian backend running on port 8004.
 *
 * Requirements:
 *   - Arduino IDE with ESP32 board support installed.
 *   - Both ESP32 and host PC must be connected to the SAME Wi-Fi network (or phone hotspot).
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <math.h>

// ==============================================================================
// 1. NETWORK & BACKEND CONFIGURATION
// ==============================================================================
// Replace with your Wi-Fi credentials
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Device Identifier
const char* DEVICE_ID     = "BG-ESP32-001";

// ------------------------------------------------------------------------------
// SERVER CONFIGURATION (PORT 8004):
// NOTE: "localhost" refers to the ESP32 itself, NOT your computer.
// Replace 10.126.25.224 with your computer's LAN IP (run 'hostname -I' or 'ipconfig').
// ------------------------------------------------------------------------------
const char* SERVER_BASE_URI = "http://10.126.25.224:8004";

// Transmission loop interval (in milliseconds)
const unsigned long TRANSMIT_INTERVAL_MS = 1000; // 1 reading per second

// Built-in LED on most ESP32 boards (GPIO 2)
const int PIN_LED = 2;

// ==============================================================================
// 2. INTERNAL STATE & VARIABLES
// ==============================================================================
unsigned long lastTransmitTime = 0;
unsigned long stepCount = 0;

// ==============================================================================
// 3. WIFI CONNECTION HELPER
// ==============================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print(F("[WiFi] Connecting to SSID: "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(400);
    Serial.print(F("."));
    digitalWrite(PIN_LED, !digitalRead(PIN_LED)); // Blink while connecting
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_LED, HIGH); // Solid ON when connected
    Serial.println();
    Serial.println(F("[WiFi] Successfully connected!"));
    Serial.print(F("[WiFi] ESP32 IP Address: "));
    Serial.println(WiFi.localIP());
    Serial.print(F("[WiFi] Target Backend URL: "));
    Serial.print(SERVER_BASE_URI);
    Serial.println(F("/api/telemetry/ingest"));
  } else {
    digitalWrite(PIN_LED, LOW);
    Serial.println();
    Serial.println(F("[WiFi] Connection timed out! Check SSID and Password."));
  }
}

// ==============================================================================
// 4. SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);

  Serial.println();
  Serial.println(F("=========================================================="));
  Serial.println(F("    BioGuardian ESP32 Mock Telemetry Transmitter Node     "));
  Serial.println(F("=========================================================="));
  Serial.println(F(" Mode: Standalone Mock Sensors (Zero Hardware Wiring)"));
  Serial.print(F(" Target Endpoint: "));
  Serial.print(SERVER_BASE_URI);
  Serial.println(F("/api/telemetry/ingest"));
  Serial.println(F("----------------------------------------------------------"));

  connectWiFi();
}

// ==============================================================================
// 5. MAIN LOOP: SYNTHESIZE MOCK SENSORS & TRANSMIT
// ==============================================================================
void loop() {
  // Reconnect if connection dropped
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastTransmitTime >= TRANSMIT_INTERVAL_MS) {
    lastTransmitTime = currentMillis;
    stepCount++;

    // --------------------------------------------------------------------------
    // A. Generate Mock Sensor Data with Natural Microfluidic Variations
    // --------------------------------------------------------------------------
    float t = stepCount * 0.1;

    // Simulate an air bubble event every 25 seconds lasting for 5 seconds
    bool bubbleDetected = ((stepCount % 25) >= 20);
    float bubbleProbability = bubbleDetected ? 0.94 : 0.02;

    // Normal baseline values with subtle sinusoidal drift
    float phVal             = 7.38 + (0.03 * sin(t * 0.5));
    float glucoseMgDl       = 92.4 + (1.20 * cos(t * 0.3));
    float oxygenMgL         = 6.80 + (0.15 * sin(t * 0.4));
    float tempCelsius       = 37.0 + (0.10 * sin(t * 0.8));

    // When a bubble is passing, flow dips and upstream pressure spikes
    float flowRateULMin     = bubbleDetected ? 310.0 : (450.0 + 8.0 * sin(t));
    float pressureMbar      = bubbleDetected ? 1032.5 : (1012.4 + 2.5 * cos(t));

    // Visual indicator on ESP32 LED
    if (bubbleDetected) {
      digitalWrite(PIN_LED, (stepCount % 2 == 0) ? HIGH : LOW); // Rapid alert blink
    } else {
      digitalWrite(PIN_LED, HIGH); // Steady nominal light
    }

    // --------------------------------------------------------------------------
    // B. Build Canonical BioGuardian JSON Payload
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
      "\"source\":\"esp32_mock\""
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

    // --------------------------------------------------------------------------
    // C. Transmit HTTP POST to Server (Port 8004)
    // --------------------------------------------------------------------------
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String endpoint = String(SERVER_BASE_URI) + "/api/telemetry/ingest";

      http.begin(endpoint);
      http.addHeader("Content-Type", "application/json");
      http.setTimeout(2500); // 2.5 second timeout

      int httpCode = http.POST(jsonBuffer);

      if (httpCode > 0) {
        Serial.print(bubbleDetected ? F("🔴 [BUBBLE ALERT] ") : F("🟢 [NOMINAL] "));
        Serial.print(F("HTTP "));
        Serial.print(httpCode);
        Serial.print(F(" | Flow: "));
        Serial.print(flowRateULMin, 1);
        Serial.print(F(" uL/min | Press: "));
        Serial.print(pressureMbar, 1);
        Serial.print(F(" mbar | Temp: "));
        Serial.print(tempCelsius, 1);
        Serial.print(F(" C | Bubble: "));
        Serial.println(bubbleDetected ? F("YES") : F("NO"));
      } else {
        Serial.print(F("⚠️ [HTTP Error] Failed to POST: "));
        Serial.print(http.errorToString(httpCode).c_str());
        Serial.print(F(" (Check if server is running on "));
        Serial.print(SERVER_BASE_URI);
        Serial.println(F(")"));
      }

      http.end();
    } else {
      Serial.println(F("⚠️ [WiFi] Disconnected. Reconnecting..."));
    }
  }
}

