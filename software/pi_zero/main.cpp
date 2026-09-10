#include <iostream>
#include <vector>
#include <cmath>
#include <chrono>
#include <string>
#include <thread>
#include <atomic>
#include <iomanip>
#include <sstream>
#include <cstring>
#include "model_data.h"

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
typedef SOCKET socket_t;
#define IS_INVALID_SOCKET(s) ((s) == INVALID_SOCKET)
#define CLOSE_SOCKET(s) closesocket(s)
#else
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>
typedef int socket_t;
#define IS_INVALID_SOCKET(s) ((s) < 0)
#define CLOSE_SOCKET(s) close(s)
#endif

// Global Actuator & Edge AI State Variables
std::atomic<float> g_inference_threshold(0.75f);
std::atomic<bool> g_purge_valve_gpio_state(false);
std::atomic<bool> g_running(true);

// High-resolution UTC timestamp helper
std::string get_high_res_timestamp() {
    auto now = std::chrono::system_clock::now();
    auto ms = std::chrono::duration_cast<std::chrono::microseconds>(now.time_since_epoch()) % 1000000;
    std::time_t t = std::chrono::system_clock::to_time_t(now);
    std::tm tm_buf;
#ifdef _WIN32
    gmtime_s(&tm_buf, &t);
#else
    gmtime_r(&t, &tm_buf);
#endif
    std::ostringstream oss;
    oss << std::put_time(&tm_buf, "%Y-%m-%dT%H:%M:%S")
        << "." << std::setfill('0') << std::setw(6) << ms.count() << "Z";
    return oss.str();
}

void print_timestamped_log(const std::string& message) {
    std::cout << "[" << get_high_res_timestamp() << "] " << message << std::endl;
}

// Prediction logic using normalized features from model_data.h and dynamic threshold
int predict_bubble_risk(const float raw_features[6], float& risk_score) {
    float scaled_input[6];
    
    // 1. Normalize raw inputs using exported mean and standard deviation
    for (int i = 0; i < 6; ++i) {
        scaled_input[i] = (raw_features[i] - X_MEAN[i]) / X_STD[i];
    }

    // 2. Anomaly Rule Check / Thresholding Evaluation
    // Index 1: Pressure slope (dP/dt), Index 4: IR Noise (Peak-to-Peak)
    if (scaled_input[1] < -0.5f || scaled_input[4] > 1.0f) {
        risk_score = 0.98f; // High Bubble Risk
    } else {
        risk_score = 0.01f; // Healthy / Normal Laminar Flow
    }

    float current_thresh = g_inference_threshold.load();
    return (risk_score > current_thresh) ? 1 : 0;
}

// Command dispatcher parsing JSON payloads
void handle_control_command(const std::string& payload_str) {
    // Extract "command" value
    std::string command;
    auto cmd_key = payload_str.find("\"command\"");
    if (cmd_key != std::string::npos) {
        auto colon = payload_str.find(':', cmd_key);
        auto q1 = payload_str.find('"', colon);
        auto q2 = payload_str.find('"', q1 + 1);
        if (q1 != std::string::npos && q2 != std::string::npos) {
            command = payload_str.substr(q1 + 1, q2 - q1 - 1);
        }
    }

    if (command == "UPDATE_THRESHOLD") {
        auto val_key = payload_str.find("\"value\"");
        if (val_key != std::string::npos) {
            auto colon = payload_str.find(':', val_key);
            try {
                float new_thresh = std::stof(payload_str.substr(colon + 1));
                g_inference_threshold.store(new_thresh);
                std::ostringstream oss;
                oss << "[CONTROL COMMAND] UPDATE_THRESHOLD -> Decision threshold dynamically updated to " 
                    << std::fixed << std::setprecision(4) << new_thresh;
                print_timestamped_log(oss.str());
            } catch (...) {
                print_timestamped_log("[ERROR] Failed to parse threshold value from payload: " + payload_str);
            }
        }
    } else if (command == "OVERRIDE_PURGE_VALVE") {
        auto state_key = payload_str.find("\"state\"");
        if (state_key != std::string::npos) {
            bool state = (payload_str.find("true", state_key) != std::string::npos);
            g_purge_valve_gpio_state.store(state);
            std::string state_str = state ? "HIGH (EMERGENCY PURGE ENGAGED)" : "LOW (NORMAL PASSIVE FLOW)";
            print_timestamped_log("[ACTUATOR OVERRIDE] GPIO_PIN_18 (PURGE_VALVE) set to " + state_str);
        }
    } else if (command == "SHUTDOWN") {
        print_timestamped_log("[CONTROL COMMAND] SHUTDOWN requested. Exiting Edge Engine.");
        g_running.store(false);
    } else {
        print_timestamped_log("[CONTROL COMMAND] Unknown command received: " + payload_str);
    }
}

// Embedded Cross-Platform MQTT 3.1.1 Subscriber Worker
void mqtt_subscriber_worker(const std::string& host, int port) {
#ifdef _WIN32
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);
#endif

    socket_t sock = socket(AF_INET, SOCK_STREAM, 0);
    if (IS_INVALID_SOCKET(sock)) {
        print_timestamped_log("[MQTT Client] Failed to create socket.");
        return;
    }

    sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port);
    server_addr.sin_addr.s_addr = inet_addr(host.c_str());

    if (connect(sock, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        print_timestamped_log("[MQTT Client] Connection to broker at " + host + ":" + std::to_string(port) + " failed.");
        CLOSE_SOCKET(sock);
        return;
    }

    print_timestamped_log("[MQTT Client] Connected to MQTT broker at " + host + ":" + std::to_string(port));

    // 1. Send MQTT 3.1.1 CONNECT Packet
    // Client ID: "BioGuardian-Edge-Cpp"
    std::string client_id = "BioGuardian-Edge-Cpp";
    std::vector<uint8_t> conn_pkt = {
        0x10, // CONNECT
        (uint8_t)(12 + client_id.length()), // Remaining length
        0x00, 0x04, 'M', 'Q', 'T', 'T',    // Protocol name
        0x04,                               // Protocol Level (3.1.1)
        0x02,                               // Connect Flags (Clean Session)
        0x00, 0x3C                          // Keep Alive (60s)
    };
    conn_pkt.push_back((uint8_t)(client_id.length() >> 8));
    conn_pkt.push_back((uint8_t)(client_id.length() & 0xFF));
    conn_pkt.insert(conn_pkt.end(), client_id.begin(), client_id.end());

    send(sock, (const char*)conn_pkt.data(), conn_pkt.size(), 0);

    // Read CONNACK (4 bytes)
    uint8_t ack_buf[4];
    int r = recv(sock, (char*)ack_buf, 4, 0);
    if (r >= 4 && ack_buf[0] == 0x20 && ack_buf[3] == 0x00) {
        print_timestamped_log("[MQTT Client] CONNACK received: Connection Accepted (rc=0)");
    }

    // 2. Send MQTT SUBSCRIBE Packet
    // Topic: "bioguardian/control/commands"
    std::string topic = "bioguardian/control/commands";
    std::vector<uint8_t> sub_pkt = {
        0x82, // SUBSCRIBE
        (uint8_t)(2 + 2 + topic.length() + 1), // Remaining length
        0x00, 0x01 // Packet Identifier = 1
    };
    sub_pkt.push_back((uint8_t)(topic.length() >> 8));
    sub_pkt.push_back((uint8_t)(topic.length() & 0xFF));
    sub_pkt.insert(sub_pkt.end(), topic.begin(), topic.end());
    sub_pkt.push_back(0x00); // Requested QoS 0

    send(sock, (const char*)sub_pkt.data(), sub_pkt.size(), 0);
    print_timestamped_log("[MQTT Client] Subscribed to topic: " + topic);

    // 3. Receive Loop
    uint8_t buffer[2048];
    while (g_running.load()) {
        int bytes = recv(sock, (char*)buffer, sizeof(buffer) - 1, 0);
        if (bytes <= 0) {
            break;
        }

        // Parse MQTT Packet
        if ((buffer[0] & 0xF0) == 0x30) { // PUBLISH Packet
            int idx = 1;
            int rem_len = buffer[idx++];
            if (rem_len >= 0x80) { // Variable byte length handling
                rem_len = (rem_len & 0x7F) + (buffer[idx++] << 7);
            }

            // Extract topic length
            int topic_len = (buffer[idx] << 8) | buffer[idx + 1];
            idx += 2;
            std::string pub_topic((char*)&buffer[idx], topic_len);
            idx += topic_len;

            // Extract payload
            int payload_len = rem_len - (2 + topic_len);
            if (payload_len > 0 && idx + payload_len <= bytes) {
                std::string payload((char*)&buffer[idx], payload_len);
                handle_control_command(payload);
            }
        }
    }

    CLOSE_SOCKET(sock);
#ifdef _WIN32
    WSACleanup();
#endif
    print_timestamped_log("[MQTT Client] Subscriber stopped.");
}

int main(int argc, char* argv[]) {
    std::cout << "=================================================" << std::endl;
    std::cout << "   BioGuardian Edge AI Engine (Pi Zero Target)   " << std::endl;
    std::cout << "   Phase 04: Bidirectional Reverse Control Loop " << std::endl;
    std::cout << "=================================================" << std::endl;

    // Default connection parameters
    std::string broker_host = "127.0.0.1";
    int broker_port = 1883;

    if (argc > 1) broker_host = argv[1];
    if (argc > 2) broker_port = std::stoi(argv[2]);

    // Initial Test 1: Healthy Flow
    float healthy_input[6] = {1012.0f, 0.01f, 450.0f, 1.2f, 20.0f, 24.1f};
    float score = 0.0f;
    int pred1 = predict_bubble_risk(healthy_input, score);

    std::cout << "\n[BASELINE CHECK] Healthy Flow Pred: " 
              << (pred1 == 1 ? "BUBBLE_RISK" : "NORMAL") 
              << " | Active Threshold: " << g_inference_threshold.load() << std::endl;

    // Launch MQTT subscriber thread listening for reverse control commands
    std::thread sub_thread(mqtt_subscriber_worker, broker_host, broker_port);

    // Keep process alive while listening
    while (g_running.load()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    if (sub_thread.joinable()) {
        sub_thread.join();
    }

    return 0;
}