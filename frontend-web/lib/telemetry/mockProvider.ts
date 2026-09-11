/**
 * BioGuardian Isolated Mock Telemetry Provider
 *
 * Simulates microfluidic organ-on-chip operational conditions with realistic
 * biological drift and interactive anomaly injection.
 * Clearly tags all produced payloads with source: 'SIMULATION'.
 */

import { BioGuardianTelemetry } from './types';

export class MockTelemetryProvider {
  private listeners: Set<(telemetry: BioGuardianTelemetry) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private current: BioGuardianTelemetry = {
    device_id: 'BG-ESP32-001 (Sim)',
    timestamp: new Date().toISOString(),
    ph: 7.38,
    glucose: 92.4,
    oxygen: 6.8,
    pressure: 1012.4,
    flow_rate: 450.0,
    temperature: 37.0,
    bubble_detected: false,
    bubble_probability: 0.02,
    source: 'SIMULATION',
  };

  private targetFlowRate: number = 450.0;

  constructor() {
    this.start();
  }

  public start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public subscribe(callback: (telemetry: BioGuardianTelemetry) => void): () => void {
    this.listeners.add(callback);
    // Send immediate initial frame
    callback(this.getTelemetry());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getTelemetry(): BioGuardianTelemetry {
    return { ...this.current };
  }

  public triggerBubble() {
    this.current.bubble_detected = true;
    this.current.bubble_probability = 0.94;
    // Transient pressure rise when microbubble enters
    this.current.pressure = parseFloat((this.current.pressure + 18.5).toFixed(1));
    this.notify();
  }

  public clearBubble() {
    this.current.bubble_detected = false;
    this.current.bubble_probability = 0.02;
    this.current.pressure = 1012.4;
    this.notify();
  }

  public setFlowRate(rate: number) {
    this.targetFlowRate = Math.max(0, rate);
    this.current.flow_rate = this.targetFlowRate;
    this.notify();
  }

  private tick() {
    // Subtle physiologic drift
    const jitter = (range: number) => (Math.random() - 0.5) * range;

    const baseFlow = this.targetFlowRate;
    const flowJitter = baseFlow > 0 ? jitter(5.0) : 0;
    const currentFlow = Math.max(0, parseFloat((baseFlow + flowJitter).toFixed(1)));

    // pH physiological buffer stability
    const nextPh = Math.min(7.45, Math.max(7.32, parseFloat((this.current.ph + jitter(0.015)).toFixed(2))));

    // Glucose micro-metabolism consumption
    const nextGlucose = parseFloat((92.4 + jitter(0.8)).toFixed(1));

    // Dissolved oxygen diffusion
    const nextOxygen = parseFloat((6.8 + jitter(0.12)).toFixed(2));

    // Hydrostatic microfluidic pressure
    const baseP = this.current.bubble_detected ? 1030.0 : 1012.4;
    const nextPressure = parseFloat((baseP + (currentFlow / 450.0) * 8.0 + jitter(1.5)).toFixed(1));

    // Temperature chamber stabilization (37.0 C)
    const nextTemp = parseFloat((37.0 + jitter(0.06)).toFixed(1));

    // Bubble probability oscillation around nominal or risk
    let prob = this.current.bubble_detected ? 0.92 + Math.random() * 0.07 : 0.015 + Math.random() * 0.02;
    prob = parseFloat(Math.min(0.99, Math.max(0.01, prob)).toFixed(2));

    this.current = {
      ...this.current,
      timestamp: new Date().toISOString(),
      ph: nextPh,
      glucose: nextGlucose,
      oxygen: nextOxygen,
      pressure: nextPressure,
      flow_rate: currentFlow,
      temperature: nextTemp,
      bubble_probability: prob,
      source: 'SIMULATION',
    };

    this.notify();
  }

  private notify() {
    const payload = this.getTelemetry();
    this.listeners.forEach((cb) => cb(payload));
  }
}
