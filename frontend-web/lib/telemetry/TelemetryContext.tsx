'use client';

/**
 * BioGuardian Telemetry Context & Provider Bridge
 * Supports dual operating modes:
 *  1. HARDWARE_TWIN: Real device telemetry (ESP32 via WebSocket) or hardware simulation.
 *  2. VIRTUAL_LAB: In-silico Organ-on-Chip experimental simulation with parameter tuning & external ML Gateway.
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MockTelemetryProvider } from './mockProvider';
import { RealTelemetryProvider } from './realProvider';
import {
  BioGuardianTelemetry,
  CameraPreset,
  ConnectionStatus,
  InspectionTarget,
  ProviderMode,
  TelemetryContextValue,
  TwinEnvironmentMode,
  ViewMode,
} from './types';

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

interface TelemetryProviderProps {
  children: React.ReactNode;
  initialEnvironmentMode?: TwinEnvironmentMode;
}

function TelemetryProviderInner({
  children,
  initialEnvironmentMode = 'HARDWARE_TWIN',
}: TelemetryProviderProps) {
  const [environmentMode, setEnvironmentMode] = useState<TwinEnvironmentMode>(initialEnvironmentMode);
  const [providerMode, setProviderMode] = useState<ProviderMode>('mock');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('FULL_SYSTEM');
  const [inspectionTarget, setInspectionTarget] = useState<InspectionTarget>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('STANDARD');
  const [showBubbleSpotVisual, setShowBubbleSpotVisual] = useState<boolean>(false);
  const [isApiFetching, setIsApiFetching] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Virtual Lab Simulation State
  const [virtualLabOrgan, setVirtualLabOrgan] = useState<string>('lung');
  const [virtualLabParameters, setVirtualLabParameters] = useState<Record<string, any>>({
    drug_concentration: 50,
    exposure_duration: 24,
    flow_rate: 450,
    ph: 7.4,
    oxygen: 6.5,
    temperature: 37.0,
    stretch_frequency: 0.2,
  });
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  const mockProviderRef = useRef<MockTelemetryProvider | null>(null);
  const realProviderRef = useRef<RealTelemetryProvider | null>(null);

  const [telemetry, setTelemetry] = useState<BioGuardianTelemetry>({
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
  });

  const [status, setStatus] = useState<ConnectionStatus>('SIMULATION_ACTIVE');

  // Initialize providers
  useEffect(() => {
    mockProviderRef.current = new MockTelemetryProvider();
    realProviderRef.current = new RealTelemetryProvider();

    return () => {
      mockProviderRef.current?.stop();
      realProviderRef.current?.disconnect();
    };
  }, []);

  // Subscribe to active hardware provider when in HARDWARE_TWIN mode
  useEffect(() => {
    if (environmentMode === 'VIRTUAL_LAB') {
      mockProviderRef.current?.stop();
      realProviderRef.current?.disconnect();
      setStatus('SIMULATION_ACTIVE');
      return;
    }

    let unsubscribeTelemetry: (() => void) | undefined;
    let unsubscribeStatus: (() => void) | undefined;

    if (providerMode === 'mock') {
      realProviderRef.current?.disconnect();
      mockProviderRef.current?.start();

      if (mockProviderRef.current) {
        unsubscribeTelemetry = mockProviderRef.current.subscribe((data) => {
          setTelemetry(data);
          if (data.bubble_detected) {
            setShowBubbleSpotVisual(true);
          }
        });
        setStatus('SIMULATION_ACTIVE');
      }
    } else {
      mockProviderRef.current?.stop();
      realProviderRef.current?.connect();

      if (realProviderRef.current) {
        unsubscribeTelemetry = realProviderRef.current.subscribe((data) => {
          setTelemetry(data);
          if (data.bubble_detected) {
            setShowBubbleSpotVisual(true);
          }
        });
        unsubscribeStatus = realProviderRef.current.subscribeStatus((st) => {
          setStatus(st);
        });
      }
    }

    return () => {
      unsubscribeTelemetry?.();
      unsubscribeStatus?.();
    };
  }, [providerMode, environmentMode]);

  // Synchronize Virtual Lab parameters to telemetry stream when active
  useEffect(() => {
    if (environmentMode !== 'VIRTUAL_LAB') return;

    const interval = setInterval(() => {
      if (!isSimulating) return;

      const baseFlow = Number(virtualLabParameters.flow_rate) || 450;
      const basePh = Number(virtualLabParameters.ph) || 7.4;
      const baseOxygen = Number(virtualLabParameters.oxygen) || 6.5;
      const baseTemp = Number(virtualLabParameters.temperature) || 37.0;

      // Realistic physical in-silico microfluidic noise (no fake ML)
      const noise = (Math.random() - 0.5) * 2;
      const calcPressure = baseFlow * 2.27 + noise;

      setTelemetry((prev) => ({
        ...prev,
        device_id: `In-Silico [${virtualLabOrgan.toUpperCase()}-ON-CHIP]`,
        timestamp: new Date().toISOString(),
        flow_rate: Math.max(0, baseFlow + noise * 0.5),
        pressure: Math.round(calcPressure * 10) / 10,
        ph: Math.round((basePh + (Math.random() - 0.5) * 0.04) * 100) / 100,
        oxygen: Math.round((baseOxygen + (Math.random() - 0.5) * 0.08) * 100) / 100,
        temperature: Math.round((baseTemp + (Math.random() - 0.5) * 0.1) * 10) / 10,
        source: 'SIMULATION',
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [environmentMode, isSimulating, virtualLabOrgan, virtualLabParameters]);

  const triggerBubbleAlert = () => {
    setShowBubbleSpotVisual(true);
    if (environmentMode === 'VIRTUAL_LAB') {
      setTelemetry((prev) => ({
        ...prev,
        bubble_detected: true,
        bubble_probability: 0.94,
      }));
      return;
    }
    if (providerMode === 'mock') {
      mockProviderRef.current?.triggerBubble();
    } else {
      realProviderRef.current?.triggerBackendBubbleSpike();
    }
  };

  const clearBubbleAlert = () => {
    setShowBubbleSpotVisual(false);
    if (environmentMode === 'VIRTUAL_LAB') {
      setTelemetry((prev) => ({
        ...prev,
        bubble_detected: false,
        bubble_probability: 0.02,
      }));
      return;
    }
    if (providerMode === 'mock') {
      mockProviderRef.current?.clearBubble();
    } else {
      realProviderRef.current?.clearBackendBubble();
    }
  };

  const triggerBubbleSpot = (focusCamera: boolean = false) => {
    setShowBubbleSpotVisual(true);
    if (focusCamera) {
      setCameraPreset('INLET_OBSERVATION');
    }
    triggerBubbleAlert();
  };

  const clearBubbleSpot = () => {
    setShowBubbleSpotVisual(false);
    clearBubbleAlert();
  };

  const setSimulationFlowRate = (rate: number) => {
    if (environmentMode === 'VIRTUAL_LAB') {
      setVirtualLabParameters((prev) => ({ ...prev, flow_rate: rate }));
      setTelemetry((prev) => ({ ...prev, flow_rate: rate }));
      return;
    }
    if (providerMode === 'mock') {
      mockProviderRef.current?.setFlowRate(rate);
    } else {
      realProviderRef.current?.setBackendFlowRate(rate);
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
  };

  const injectSimulatedBubble = () => {
    triggerBubbleSpot(true);
    setTimeout(() => {
      clearBubbleSpot();
    }, 6000);
  };

  const backendUrl = useMemo(() => {
    return (
      realProviderRef.current?.getHttpBaseUrl() ||
      (typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '')
        : undefined) ||
      'http://localhost:8000'
    );
  }, []);

  const fetchLatestFromApi = async () => {
    setIsApiFetching(true);
    setApiError(null);
    try {
      if (realProviderRef.current) {
        const data = await realProviderRef.current.fetchLatest();
        if (data) {
          setTelemetry(data);
          if (data.bubble_detected) {
            setShowBubbleSpotVisual(true);
          }
        } else {
          setApiError(`Could not reach backend API at ${realProviderRef.current.getHttpBaseUrl()}`);
        }
      }
    } catch (e: any) {
      setApiError(e?.message || 'Error fetching from API');
    } finally {
      setIsApiFetching(false);
    }
  };

  const value = useMemo<TelemetryContextValue>(
    () => ({
      telemetry,
      status,
      providerMode,
      setProviderMode,
      environmentMode,
      setEnvironmentMode,
      virtualLabOrgan,
      setVirtualLabOrgan,
      virtualLabParameters,
      setVirtualLabParameters,
      isSimulating,
      startSimulation,
      pauseSimulation,
      injectSimulatedBubble,
      triggerBubbleAlert,
      clearBubbleAlert,
      triggerBubbleSpot,
      clearBubbleSpot,
      showBubbleSpotVisual,
      setSimulationFlowRate,
      fetchLatestFromApi,
      isApiFetching,
      apiError,
      cameraPreset,
      setCameraPreset,
      inspectionTarget,
      setInspectionTarget,
      viewMode,
      setViewMode,
      backendUrl,
      setTelemetry,
    }),
    [
      telemetry,
      status,
      providerMode,
      environmentMode,
      virtualLabOrgan,
      virtualLabParameters,
      isSimulating,
      showBubbleSpotVisual,
      isApiFetching,
      apiError,
      cameraPreset,
      inspectionTarget,
      viewMode,
      backendUrl,
      setTelemetry,
    ]
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function TelemetryProvider({ children, initialEnvironmentMode }: TelemetryProviderProps) {
  const existing = useContext(TelemetryContext);
  if (existing) {
    return <>{children}</>;
  }
  return (
    <TelemetryProviderInner initialEnvironmentMode={initialEnvironmentMode}>
      {children}
    </TelemetryProviderInner>
  );
}

export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
