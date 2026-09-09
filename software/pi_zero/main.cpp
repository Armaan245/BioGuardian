#include <iostream>
#include <vector>
#include <cmath>
#include <chrono>
#include "model_data.h"

// Prediction logic using normalized features from model_data.h
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

    return (risk_score > 0.75f) ? 1 : 0;
}

int main() {
    std::cout << "=================================================" << std::endl;
    std::cout << "   BioGuardian Edge AI Engine (Pi Zero Target)   " << std::endl;
    std::cout << "=================================================" << std::endl;

    // Test 1: Healthy Laminar Flow
    // Features: [Pressure_mean, dP/dt, Flow_mean, Flow_std, IR_ptp_noise, Temp]
    float healthy_input[6] = {1012.0f, 0.01f, 450.0f, 1.2f, 20.0f, 24.1f};
    
    // Test 2: Imminent Bubble / Outgassing Anomaly
    float risk_input[6] = {980.0f, -15.2f, 410.0f, 18.5f, 480.0f, 25.6f};

    float score = 0.0f;

    // Run Test 1
    auto t1 = std::chrono::high_resolution_clock::now();
    int pred1 = predict_bubble_risk(healthy_input, score);
    auto t2 = std::chrono::high_resolution_clock::now();
    double ms1 = std::chrono::duration<double, std::milli>(t2 - t1).count();

    std::cout << "\n[TEST 1] Sample: Healthy Flow" << std::endl;
    std::cout << " -> Prediction : " << (pred1 == 1 ? "BUBBLE_RISK" : "NORMAL") << std::endl;
    std::cout << " -> Risk Score : " << score * 100.0f << "%" << std::endl;
    std::cout << " -> Latency    : " << ms1 << " ms" << std::endl;

    // Run Test 2
    t1 = std::chrono::high_resolution_clock::now();
    int pred2 = predict_bubble_risk(risk_input, score);
    t2 = std::chrono::high_resolution_clock::now();
    double ms2 = std::chrono::duration<double, std::milli>(t2 - t1).count();

    std::cout << "\n[TEST 2] Sample: Bubble Risk Event" << std::endl;
    std::cout << " -> Prediction : " << (pred2 == 1 ? "BUBBLE_RISK" : "NORMAL") << std::endl;
    std::cout << " -> Risk Score : " << score * 100.0f << "%" << std::endl;
    std::cout << " -> Latency    : " << ms2 << " ms" << std::endl;

    std::cout << "\n=================================================" << std::endl;
    return 0;
}