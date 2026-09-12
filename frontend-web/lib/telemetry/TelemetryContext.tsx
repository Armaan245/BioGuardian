'use client';

/**
 * BioGuardian Telemetry Context & Provider Bridge
 * Provides seamless hot-swapping between MockTelemetryProvider (SIMULATION)
 * and RealTelemetryProvider (REAL DEVICE WebSocket).
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
  ViewMode,
} from './types';

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

function TelemetryProviderInner({ children }: { children: React.ReactNode }) {
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

  // Initialize providers
  useEffect(() => {
    mockProviderRef.current = new MockTelemetryProvider();
    realProviderRef.current = new RealTelemetryProvider();

    return () => {
      mockProviderRef.current?.stop();
      realProviderRef.current?.disconnect();
    };
  }, []);

  // Subscribe to active provider
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
    }),
    [
      telemetry,
      status,
      providerMode,
      showBubbleSpotVisual,
      isApiFetching,
      apiError,
      cameraPreset,
      inspectionTarget,
      viewMode,
      backendUrl,
    ]
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const existing = useContext(TelemetryContext);
  if (existing) {
    return <>{children}</>;
  }
  return <TelemetryProviderInner>{children}</TelemetryProviderInner>;
}

export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
