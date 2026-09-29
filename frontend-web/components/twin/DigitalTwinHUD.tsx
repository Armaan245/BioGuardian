'use client';

/**
 * BioGuardian Mission-Control HUD Overlay
 *
 * Floating dark glass cards inspired by SolarEye scientific design system:
 * - Transparent glass cards (backdrop-blur-md, thin borders, subtle glow)
 * - Information-dense but minimal, keeping the 3D Digital Twin dominant
 * - Telemetry state cards: FLOW, BUBBLE, SYSTEM
 * - Presets: FULL SYSTEM, RESERVOIRS, BUBBLE TRAP CHIP, ORGAN-ON-CHIP, SENSOR MANIFOLD
 * - Unified Environment Mode Switch: [LIVE HARDWARE TWIN] <-> [VIRTUAL LAB SIMULATION]
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  Camera,
  CheckCircle2,
  ChevronDown,
  Eye,
  FlaskConical,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Tv,
  Waves,
  Wifi,
  WifiOff,
  Zap,
  Sliders,
} from 'lucide-react';
import { useTelemetry } from '@/lib/telemetry/TelemetryContext';
import { CameraPreset } from '@/lib/telemetry/types';

interface DigitalTwinHUDProps {
  telemetryDrawerOpen: boolean;
  setTelemetryDrawerOpen: (open: boolean) => void;
  bubbleDrawerOpen: boolean;
  setBubbleDrawerOpen: (open: boolean) => void;
  virtualLabDrawerOpen?: boolean;
  setVirtualLabDrawerOpen?: (open: boolean) => void;
}

export function DigitalTwinHUD({
  telemetryDrawerOpen,
  setTelemetryDrawerOpen,
  bubbleDrawerOpen,
  setBubbleDrawerOpen,
  virtualLabDrawerOpen = false,
  setVirtualLabDrawerOpen,
}: DigitalTwinHUDProps) {
  const {
    telemetry,
    status,
    providerMode,
    setProviderMode,
    environmentMode,
    setEnvironmentMode,
    cameraPreset,
    setCameraPreset,
    viewMode,
    setViewMode,
    inspectionTarget,
    setInspectionTarget,
    triggerBubbleAlert,
    clearBubbleAlert,
    triggerBubbleSpot,
    clearBubbleSpot,
    showBubbleSpotVisual,
    fetchLatestFromApi,
    isApiFetching,
    backendUrl,
    virtualLabOrgan,
    isSimulating,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    virtualLabElapsed,
    simulatedBubbleActive,
    injectSimulatedBubble,
  } = useTelemetry();

  const probPercent = Math.round(telemetry.bubble_probability * 100);
  const isBubbleDetected = telemetry.bubble_detected;
  const isHighRisk = isBubbleDetected || probPercent > 75;

  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // ==========================================
  // PRESENTATION MODE
  // ==========================================
  if (viewMode === 'PRESENTATION') {
    return (
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-30">
        <div className="flex items-start justify-between">
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/30 px-6 py-4 rounded-2xl pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
              <span className="size-2 rounded-full bg-teal animate-pulse" />
              BIOGUARDIAN · 3D DIGITAL TWIN
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Autonomous Organ-on-Chip Microfluidic Protection
            </h1>
            <p className="text-xs text-slate-400 mt-1">Real-Time Fluidics & Optical Bubble Interception</p>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => setViewMode('STANDARD')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white backdrop-blur-md transition flex items-center gap-2"
            >
              <Minimize2 className="size-3.5" /> Exit Presentation
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
          <div className="flex items-center gap-4 bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-6 py-3.5 rounded-2xl shadow-xl">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">FLOW RATE</div>
              <div className="text-xl font-bold font-mono text-white">
                {telemetry.flow_rate.toFixed(1)} <span className="text-xs font-normal text-slate-400">µL/min</span>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">BUBBLE STATUS</div>
              <div className={`text-xl font-bold font-mono ${isBubbleDetected ? 'text-rose-400' : 'text-teal'}`}>
                {isBubbleDetected ? 'DETECTED' : 'NOMINAL'}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">SYSTEM STATE</div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE · {environmentMode === 'VIRTUAL_LAB' ? 'VIRTUAL SIMULATOR' : telemetry.source}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CLEAN 3D MODE
  // ==========================================
  if (viewMode === 'CLEAN_3D') {
    return (
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-30">
        <div className="flex items-center justify-between">
          <div className="bg-[#090e1a]/80 backdrop-blur-md border border-teal/20 px-4 py-2 rounded-xl pointer-events-auto flex items-center gap-2.5 text-xs text-white">
            <span className="size-2 rounded-full bg-teal animate-pulse" />
            <span className="font-semibold">BioGuardian</span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-teal">
              {environmentMode === 'VIRTUAL_LAB' ? 'VIRTUAL LAB SIMULATION' : 'CLEAN 3D MODE'}
            </span>
          </div>

          <button
            onClick={() => setViewMode('STANDARD')}
            className="pointer-events-auto px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white backdrop-blur-md transition flex items-center gap-1.5"
          >
            <Layers className="size-3.5" /> Restore HUD
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono text-center">
          Left click: Rotate · Right click: Pan · Scroll: Zoom
        </div>
      </div>
    );
  }

  // ==========================================
  // STANDARD INTERACTIVE HUD MODE
  // ==========================================
  return (
    <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-30">
      {/* 1. TOP FLOATING HUD ROW */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-3">
        {/* Left: Environment Switcher (Live Hardware Twin vs Virtual Lab) */}
        <div className="flex flex-col items-start gap-2.5 max-w-2xl">
          <div className="bg-[#090e1a]/90 backdrop-blur-md border border-teal/20 p-2 sm:px-4 sm:py-2.5 rounded-2xl pointer-events-auto shadow-2xl flex flex-wrap items-center gap-3">
            {/* Logo / Brand Indicator */}
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-teal animate-pulse" />
              <span className="font-bold text-xs tracking-wider text-white">BIOGUARDIAN</span>
            </div>
            <div className="h-4 w-px bg-white/15 hidden sm:block" />

            {/* PRIMARY ENVIRONMENT SWITCHER */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
              <button
                onClick={() => setEnvironmentMode('HARDWARE_TWIN')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider transition flex items-center gap-1.5 ${
                  environmentMode === 'HARDWARE_TWIN'
                    ? 'bg-teal-500/25 text-teal-300 border border-teal-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Live Physical ESP32 Hardware Monitoring"
              >
                <Radio className="size-3 text-teal-400" /> LIVE TWIN
              </button>

              <button
                onClick={() => setEnvironmentMode('VIRTUAL_LAB')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider transition flex items-center gap-1.5 ${
                  environmentMode === 'VIRTUAL_LAB'
                    ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to In-Silico Organ-on-Chip Virtual Lab Simulation"
              >
                <FlaskConical className="size-3 text-purple-400" /> VIRTUAL LAB
              </button>
            </div>

            {/* Context-Specific Secondary Controls */}
            {environmentMode === 'HARDWARE_TWIN' ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                  <button
                    onClick={() => setProviderMode('mock')}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold transition ${
                      providerMode === 'mock' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    MOCK
                  </button>
                  <button
                    onClick={() => setProviderMode('real')}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold transition ${
                      providerMode === 'real' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    ESP32
                  </button>
                </div>

                {!showBubbleSpotVisual && !isBubbleDetected ? (
                  <button
                    onClick={() => triggerBubbleSpot(false)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 transition flex items-center gap-1 shadow-sm"
                  >
                    <Zap className="size-3 text-rose-400" /> SPOT BUBBLE
                  </button>
                ) : (
                  <button
                    onClick={clearBubbleSpot}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 transition flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="size-3 text-emerald-400" /> CLEAR SPOT
                  </button>
                )}
              </div>
            ) : (
              /* Virtual Lab Direct Action Bar */
              <div className="flex items-center gap-2">
                {isSimulating ? (
                  <button
                    onClick={pauseSimulation}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1"
                  >
                    <Pause className="size-3" /> PAUSE
                  </button>
                ) : (
                  <button
                    onClick={startSimulation}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition flex items-center gap-1 shadow-sm"
                  >
                    <Play className="size-3 fill-current" /> RUN SIM
                  </button>
                )}

                <button
                  onClick={injectSimulatedBubble}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition flex items-center gap-1"
                  title="Inject bubble into the Prep & Bubble Trap Chip"
                >
                  <AlertOctagon className="size-3 text-rose-400" /> INJECT BUBBLE
                </button>

                {setVirtualLabDrawerOpen && (
                  <button
                    onClick={() => setVirtualLabDrawerOpen(!virtualLabDrawerOpen)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition flex items-center gap-1"
                  >
                    <Sliders className="size-3 text-purple-400" /> PARAMETERS
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Alert Banner */}
          {(isBubbleDetected || showBubbleSpotVisual || simulatedBubbleActive) && (
            <div className="pointer-events-auto bg-rose-950/95 backdrop-blur-md border border-rose-500/60 px-4 py-2.5 rounded-2xl shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="size-4 text-rose-400 shrink-0 animate-pulse" />
                <div className="text-xs text-rose-200">
                  <div className="font-bold tracking-wide text-white flex items-center gap-1.5">
                    BUBBLE ANOMALY IN MICROFLUIDIC BUS
                    {environmentMode === 'HARDWARE_TWIN' && (
                      <span className="text-[11px] font-mono text-rose-300 font-normal">({probPercent}% risk)</span>
                    )}
                  </div>
                  <div className="text-[10px] text-rose-300/90 leading-tight mt-0.5">
                    Traversing Prep Chip → Bubble Trap Vent Chamber
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                <button
                  onClick={() => setBubbleDrawerOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold transition cursor-pointer shadow-xs"
                >
                  Inspect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Floating Telemetry Status Cards */}
        <div className="flex flex-wrap items-center gap-2.5 pointer-events-auto">
          {/* Card 1: FLOW */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <Waves className="size-4 text-teal" />
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">FLOW RATE</div>
              <div className="text-xs font-bold font-mono text-white">
                {telemetry.flow_rate.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">µL/min</span>
              </div>
            </div>
          </div>

          {/* Card 2: BUBBLE STATUS */}
          <button
            onClick={() => setBubbleDrawerOpen(true)}
            className={`bg-[#090e1a]/85 backdrop-blur-md border px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-3 transition text-left ${
              isHighRisk || simulatedBubbleActive
                ? 'border-rose-500/50 hover:bg-rose-950/40 shadow-rose-950/50'
                : 'border-teal/20 hover:border-teal/40'
            }`}
          >
            <Zap className={`size-4 ${isHighRisk || simulatedBubbleActive ? 'text-rose-400 animate-pulse' : 'text-teal'}`} />
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">BUBBLE TRAP</div>
              <div className={`text-xs font-bold font-mono ${isHighRisk || simulatedBubbleActive ? 'text-rose-400' : 'text-white'}`}>
                {isBubbleDetected || simulatedBubbleActive ? 'INTERCEPT' : 'PASSIVE'}
              </div>
            </div>
          </button>

          {/* Card 3: MODE BADGE */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">ACTIVE ENV</div>
              <div className="text-xs font-semibold text-emerald-400">
                {environmentMode === 'VIRTUAL_LAB' ? 'VIRTUAL LAB' : 'HARDWARE TWIN'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM CONTROL & NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pointer-events-auto">
        {/* Left: Camera Presets (Updated to reflect new physical layout) */}
        <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 p-1.5 rounded-2xl shadow-xl flex items-center gap-1 overflow-x-auto max-w-full">
          <div className="px-2 py-1 text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1 shrink-0">
            <Camera className="size-3 text-teal" /> Presets:
          </div>
          {(
            [
              ['FULL_SYSTEM', 'Overview'],
              ['RESERVOIRS', 'Bottles'],
              ['BUBBLE_TRAP', 'Bubble Trap Chip'],
              ['ORGAN_ON_CHIP', 'Organ-on-Chip'],
              ['SENSOR_MANIFOLD', 'Sensor Manifold'],
            ] as [CameraPreset, string][]
          ).map(([presetKey, label]) => (
            <button
              key={presetKey}
              onClick={() => setCameraPreset(presetKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                cameraPreset === presetKey
                  ? 'bg-teal text-slate-950 font-semibold shadow-md shadow-teal/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: Drawer Triggers & Display Modes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Telemetry Drawer Button */}
          <button
            onClick={() => setTelemetryDrawerOpen(!telemetryDrawerOpen)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5 ${
              telemetryDrawerOpen
                ? 'bg-teal/20 border-teal text-teal'
                : 'bg-[#090e1a]/85 border-teal/20 text-slate-200 hover:border-teal/40'
            }`}
          >
            <Activity className="size-3.5 text-teal" />
            <span>Telemetry Bus</span>
          </button>

          {/* Bubble Analysis Drawer Button */}
          <button
            onClick={() => setBubbleDrawerOpen(!bubbleDrawerOpen)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5 ${
              bubbleDrawerOpen
                ? 'bg-teal/20 border-teal text-teal'
                : 'bg-[#090e1a]/85 border-teal/20 text-slate-200 hover:border-teal/40'
            }`}
          >
            <Zap className="size-3.5 text-teal" />
            <span>Bubble Trap Analysis</span>
          </button>

          {/* Clean 3D Mode Toggle */}
          <button
            onClick={() => setViewMode('CLEAN_3D')}
            className="px-3 py-2 rounded-xl bg-[#090e1a]/85 border border-teal/20 hover:border-teal/40 text-slate-300 hover:text-white text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5"
            title="Switch to Clean 3D View without overlays"
          >
            <Eye className="size-3.5 text-teal" />
            <span>Clean 3D</span>
          </button>

          {/* Presentation Mode Toggle */}
          <button
            onClick={() => setViewMode('PRESENTATION')}
            className="px-3 py-2 rounded-xl bg-[#090e1a]/85 border border-teal/20 hover:border-teal/40 text-slate-300 hover:text-white text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5"
            title="Presentation Mode"
          >
            <Tv className="size-3.5 text-teal" />
            <span>Presentation</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            className="px-3 py-2 rounded-xl bg-[#090e1a]/85 border border-teal/20 hover:border-teal/40 text-slate-300 hover:text-white text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5"
          >
            {isBrowserFullscreen ? <Minimize2 className="size-3.5 text-teal" /> : <Maximize2 className="size-3.5 text-teal" />}
          </button>
        </div>
      </div>
    </div>
  );
}
