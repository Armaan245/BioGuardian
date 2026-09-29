'use client';

/**
 * BioGuardian Telemetry Context & Provider Bridge
 * Provides seamless hot-swapping between:
 * 1. Hardware Digital Twin (ESP32 Real-Time WebSocket & Mock Telemetry)
 * 2. Virtual Lab Simulation (In-Silico Organ-on-Chip Experimentation)
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
  // Environment Mode (Live Twin vs Virtual Lab)
  const [environmentMode, setEnvironmentMode] = useState<TwinEnvironmentMode>(initialEnvironmentMode);

  // Hardware Twin Mode State
  const [providerMode, setProviderMode] = useState<ProviderMode>('mock');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('FULL_SYSTEM');
  const [inspectionTarget, setInspectionTarget] = useState<InspectionTarget>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('STANDARD');
  const [showBubbleSpotVisual, setShowBubbleSpotVisual] = useState<boolean>(false);
  const [isApiFetching, setIsApiFetching] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

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

  // Virtual Lab Simulation State
  const [virtualLabOrgan, setVirtualLabOrgan] = useState<string>('lung');
  const [virtualLabParams, setVirtualLabParams] = useState<Record<string, number>>({
    drug_concentration: 50,
    exposure_duration: 24,
    flow_rate: 450,
    ph: 7.4,
    oxygen: 6.5,
    temperature: 37,
  });
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [virtualLabElapsed, setVirtualLabElapsed] = useState<number>(0);
  const [simulatedBubbleActive, setSimulatedBubbleActive] = useState<boolean>(false);
  const [simulatedBubblePos, setSimulatedBubblePos] = useState<number>(0);

  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setVirtualLabParam = (id: string, val: number) => {
    setVirtualLabParams((prev) => ({ ...prev, [id]: val }));
  };

  const startSimulation = () => {
    setIsSimulating(true);
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setVirtualLabElapsed(0);
    setSimulatedBubbleActive(false);
    setSimulatedBubblePos(0);
  };

  const injectSimulatedBubble = () => {
    setSimulatedBubbleActive(true);
    setSimulatedBubblePos(0);
    if (!isSimulating) setIsSimulating(true);

    if (bubbleTimerRef.current) clearInterval(bubbleTimerRef.current);
    let p = 0;
    bubbleTimerRef.current = setInterval(() => {
      p += 0.02;
      setSimulatedBubblePos(p);
      if (p >= 1.0) {
        clearInterval(bubbleTimerRef.current!);
        bubbleTimerRef.current = null;
        setSimulatedBubbleActive(false);
        setSimulatedBubblePos(0);
      }
    }, 60);
  };

  // Virtual Lab Elapsed Timer
  useEffect(() => {
    if (isSimulating) {
      simTimerRef.current = setInterval(() => {
        setVirtualLabElapsed((e) => e + 1);
      }, 1000);
    } else {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulating]);

  // Initialize Hardware Providers
  useEffect(() => {
    mockProviderRef.current = new MockTelemetryProvider();
    realProviderRef.current = new RealTelemetryProvider();

    return () => {
      mockProviderRef.current?.stop();
      realProviderRef.current?.disconnect();
    };
  }, []);

  // Subscribe to active Hardware provider
  useEffect(() => {
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
  }, [providerMode]);

  const triggerBubbleAlert = () => {
    setShowBubbleSpotVisual(true);
    if (providerMode === 'mock') {
      mockProviderRef.current?.triggerBubble();
    } else {
      realProviderRef.current?.triggerBackendBubbleSpike();
    }
  };

  const clearBubbleAlert = () => {
    setShowBubbleSpotVisual(false);
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
    if (providerMode === 'mock') {
      mockProviderRef.current?.triggerBubble();
    } else {
      realProviderRef.current?.triggerBackendBubbleSpike();
    }
  };

  const clearBubbleSpot = () => {
    setShowBubbleSpotVisual(false);
    if (providerMode === 'mock') {
      mockProviderRef.current?.clearBubble();
    } else {
      realProviderRef.current?.clearBackendBubble();
    }
  };

  const setSimulationFlowRate = (rate: number) => {
    if (providerMode === 'mock') {
      mockProviderRef.current?.setFlowRate(rate);
    } else {
      realProviderRef.current?.setBackendFlowRate(rate);
    }
  };

  const fetchLatestFromApi = async () => {
    if (!realProviderRef.current) return;
    setIsApiFetching(true);
    setApiError(null);
    try {
      const result = await realProviderRef.current.fetchLatest();
      if (!result) {
        setApiError('FastAPI unreachable or offline');
      }
    } catch (e) {
      setApiError(String(e));
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
      backendUrl: realProviderRef.current?.getDeviceId() || 'http://localhost:8000',
      virtualLabOrgan,
      setVirtualLabOrgan,
      virtualLabParams,
      setVirtualLabParam,
      isSimulating,
      startSimulation,
      pauseSimulation,
      resetSimulation,
      virtualLabElapsed,
      simulatedBubbleActive,
      simulatedBubblePos,
      injectSimulatedBubble,
    }),
    [
      telemetry,
      status,
      providerMode,
      environmentMode,
      showBubbleSpotVisual,
      isApiFetching,
      apiError,
      cameraPreset,
      inspectionTarget,
      viewMode,
      virtualLabOrgan,
      virtualLabParams,
      isSimulating,
      virtualLabElapsed,
      simulatedBubbleActive,
      simulatedBubblePos,
    ]
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function TelemetryProvider(props: TelemetryProviderProps) {
  return <TelemetryProviderInner {...props} />;
}

export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
