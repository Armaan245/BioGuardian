/**
 * BioGuardian Real-Time WebSocket Telemetry Provider
 *
 * Connects directly to the FastAPI WebSocket hub for live ESP32 microfluidic telemetry.
 * Automatically handles reconnection, heartbeat, and stale-data safety monitoring.
 */

import { BioGuardianTelemetry, ConnectionStatus } from './types';

export class RealTelemetryProvider {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private httpBaseUrl: string;
  private listeners: Set<(telemetry: BioGuardianTelemetry) => void> = new Set();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private staleTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  private currentTelemetry: BioGuardianTelemetry = {
    device_id: 'BG-ESP32-001',
    timestamp: new Date().toISOString(),
    ph: 7.38,
    glucose: 92.4,
    oxygen: 6.8,
    pressure: 1012.4,
    flow_rate: 450.0,
    temperature: 37.0,
    bubble_detected: false,
    bubble_probability: 0.02,
    source: 'REAL DEVICE',
  };

  private deviceId: string;

  constructor(wsUrl?: string, httpBaseUrl?: string, deviceId?: string) {
    this.deviceId =
      deviceId ||
      (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEVICE_ID : undefined) ||
      'BG-ESP32-001';

    const defaultHost =
      typeof window !== 'undefined'
        ? window.location.hostname || 'localhost'
        : 'localhost';

    const envHttp =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
        : undefined;

    const envWs =
      typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_WS_BASE_URL?.trim()
        : undefined;

    // Resolve HTTP base URL (strip trailing slashes)
    const rawHttp = httpBaseUrl || envHttp || `http://${defaultHost}:8000`;
    this.httpBaseUrl = rawHttp.replace(/\/+$/, '');

    // Resolve WS URL: either explicit wsUrl, env WS, or auto-derived from HTTP URL
    if (wsUrl) {
      this.wsUrl = wsUrl;
    } else if (envWs) {
      const cleanWs = envWs.replace(/\/+$/, '');
      this.wsUrl = cleanWs.includes('/ws/devices')
        ? cleanWs
        : `${cleanWs}/ws/devices/${this.deviceId}`;
    } else if (this.httpBaseUrl.startsWith('https://')) {
      const wsHost = this.httpBaseUrl.replace(/^https:\/\//, 'wss://');
      this.wsUrl = `${wsHost}/ws/devices/${this.deviceId}`;
    } else if (this.httpBaseUrl.startsWith('http://')) {
      const wsHost = this.httpBaseUrl.replace(/^http:\/\//, 'ws://');
      this.wsUrl = `${wsHost}/ws/devices/${this.deviceId}`;
    } else {
      this.wsUrl = `ws://${defaultHost}:8000/ws/devices/${this.deviceId}`;
    }
  }

  public getHttpBaseUrl(): string {
    return this.httpBaseUrl;
  }

  public getWsUrl(): string {
    return this.wsUrl;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public async fetchLatest(): Promise<BioGuardianTelemetry | null> {
    if (typeof window === 'undefined') return null;
    try {
      const res = await fetch(
        `${this.httpBaseUrl}/api/telemetry/latest?device_id=${encodeURIComponent(this.deviceId)}`,
        {
          cache: 'no-store',
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const normalized: BioGuardianTelemetry = {
        device_id: String(raw.device_id || this.deviceId),
        timestamp: String(raw.timestamp || new Date().toISOString()),
        ph: Number(raw.ph ?? 7.38),
        glucose: Number(raw.glucose ?? 92.4),
        oxygen: Number(raw.oxygen ?? 6.8),
        pressure: Number(raw.pressure ?? 1012.4),
        flow_rate: Number(raw.flow_rate ?? 450.0),
        temperature: Number(raw.temperature ?? 37.0),
        bubble_detected: Boolean(raw.bubble_detected),
        bubble_probability: Number(raw.bubble_probability ?? 0.02),
        source: 'REAL DEVICE',
      };
      this.currentTelemetry = normalized;
      this.notifyTelemetry(normalized);
      this.notifyStatus('CONNECTED');
      return normalized;
    } catch (e) {
      console.warn('[RealProvider] REST fetchLatest error:', e);
      return null;
    }
  }

  public async triggerBackendBubbleSpike(): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.httpBaseUrl}/api/telemetry/bubble-spike?device_id=${encodeURIComponent(this.deviceId)}`,
        {
          method: 'POST',
        }
      );
      if (!res.ok) return false;
      await this.fetchLatest();
      return true;
    } catch (e) {
      console.warn('[RealProvider] triggerBackendBubbleSpike error:', e);
      return false;
    }
  }

  public async clearBackendBubble(): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.httpBaseUrl}/api/telemetry/bubble-clear?device_id=${encodeURIComponent(this.deviceId)}`,
        {
          method: 'POST',
        }
      );
      if (!res.ok) return false;
      await this.fetchLatest();
      return true;
    } catch (e) {
      console.warn('[RealProvider] clearBackendBubble error:', e);
      return false;
    }
  }

  public async setBackendFlowRate(flowRate: number): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.httpBaseUrl}/api/telemetry/flow?device_id=${encodeURIComponent(this.deviceId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flow_rate: flowRate }),
        }
      );
      if (!res.ok) return false;
      await this.fetchLatest();
      return true;
    } catch (e) {
      console.warn('[RealProvider] setBackendFlowRate error:', e);
      return false;
    }
  }

  public connect() {
    if (typeof window === 'undefined') return;
    // Immediately fetch latest from REST API to avoid blank delay
    this.fetchLatest();

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isDestroyed = false;
    this.notifyStatus('CONNECTING');

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.notifyStatus('CONNECTED');
        this.resetStaleTimer();
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          this.resetStaleTimer();

          const normalized: BioGuardianTelemetry = {
            device_id: String(raw.device_id || 'BG-ESP32-001'),
            timestamp: String(raw.timestamp || new Date().toISOString()),
            ph: Number(raw.ph ?? 7.38),
            glucose: Number(raw.glucose ?? 92.4),
            oxygen: Number(raw.oxygen ?? 6.8),
            pressure: Number(raw.pressure ?? 1012.4),
            flow_rate: Number(raw.flow_rate ?? 450.0),
            temperature: Number(raw.temperature ?? 37.0),
            bubble_detected: Boolean(raw.bubble_detected),
            bubble_probability: Number(raw.bubble_probability ?? 0.02),
            source: 'REAL DEVICE',
          };

          this.currentTelemetry = normalized;
          this.notifyTelemetry(normalized);
        } catch (e) {
          console.warn('[RealProvider] Non-JSON payload received:', event.data);
        }
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          this.notifyStatus('DISCONNECTED');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        if (!this.isDestroyed) {
          this.notifyStatus('DISCONNECTED');
        }
      };
    } catch (err) {
      this.notifyStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.staleTimer) {
      clearTimeout(this.staleTimer);
      this.staleTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus('DISCONNECTED');
  }

  public subscribe(callback: (telemetry: BioGuardianTelemetry) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentTelemetry);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeStatus(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private resetStaleTimer() {
    if (this.staleTimer) clearTimeout(this.staleTimer);
    // Mark stale if no message in 4 seconds
    this.staleTimer = setTimeout(() => {
      this.notifyStatus('STALE');
    }, 4000);
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || this.isDestroyed) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 3000);
  }

  private notifyTelemetry(telemetry: BioGuardianTelemetry) {
    this.listeners.forEach((cb) => cb(telemetry));
  }

  private notifyStatus(status: ConnectionStatus) {
    this.statusListeners.forEach((cb) => cb(status));
  }
}
