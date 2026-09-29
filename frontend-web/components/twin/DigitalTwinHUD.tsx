'use client';

/**
 * BioGuardian Mission-Control HUD Overlay
 *
 * Unifies Live Digital Twin monitoring and Virtual Lab simulation:
 * - Environment Switcher: [🔬 LIVE HARDWARE TWIN] <-> [🧪 VIRTUAL LAB]
 * - Transparent dark-glass floating cards (SolarEye aesthetic)
 * - Telemetry state monitors: FLOW, BUBBLE ALERT, SYSTEM STATUS
 * - Virtual Lab controls: Active Organ, Parameter Drawer, Bubble Anomaly Injection
 * - Camera Presets: FULL SYSTEM, RESERVOIRS, BUBBLE TRAP (Y-CHIP), INLET CAMERA, ORGAN CHIP, SENSOR & WASTE
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertOctagon,
  Camera,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Eye,
  Flame,
  FlaskConical,
  Gauge,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Tv,
  Waves,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useTelemetry } from '@/lib/telemetry/TelemetryContext';
import { CameraPreset } from '@/lib/telemetry/types';

interface DigitalTwinHUDProps {
  telemetryDrawerOpen: boolean;
  setTelemetryDrawerOpen: (open: boolean) => void;
  bubbleDrawerOpen: boolean;
  setBubbleDrawerOpen: (open: boolean) => void;
}

export function DigitalTwinHUD({
  telemetryDrawerOpen,
  setTelemetryDrawerOpen,
  bubbleDrawerOpen,
  setBubbleDrawerOpen,
}: DigitalTwinHUDProps) {
  const {
    telemetry,
    status,
    providerMode,
    setProviderMode,
    environmentMode,
    setEnvironmentMode,
    virtualLabOrgan,
    isSimulating,
    startSimulation,
    pauseSimulation,
    injectSimulatedBubble,
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

  // Preset configuration list
  const PRESET_CONFIG: [CameraPreset, string][] = [
    ['FULL_SYSTEM', 'Full System'],
    ['RESERVOIRS', 'Reservoirs'],
    ['BUBBLE_TRAP', 'Bubble Trap (Y-Chip)'],
    ['INLET_OBSERVATION', 'Camera & Inlets'],
    ['ORGAN_ON_CHIP', 'Organ Chip'],
    ['SENSOR_MANIFOLD', 'Sensors & Waste'],
  ];

  // ==========================================
  // PRESENTATION MODE (Clean minimalist showcase)
  // ==========================================
  if (viewMode === 'PRESENTATION') {
    return (
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-30">
        <div className="flex items-start justify-between">
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/30 px-6 py-4 rounded-2xl pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
              <span className="size-2 rounded-full bg-teal animate-pulse" />
              BIOGUARDIAN · 3D TWIN & VIRTUAL LAB
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Autonomous Organ-on-Chip Microfluidic Protection
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {environmentMode === 'VIRTUAL_LAB'
                ? `In-Silico ${virtualLabOrgan.toUpperCase()} Simulation Environment`
                : 'Real-Time Hardware Telemetry & Optical Bubble Interception'}
            </p>
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

        {/* Presentation bottom ticker */}
        <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-6 py-3 rounded-2xl pointer-events-auto shadow-2xl self-center flex items-center gap-8 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">FLOW:</span>
            <span className="text-teal font-bold">{Math.round(telemetry.flow_rate)} µL/min</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">PRESSURE:</span>
            <span className="text-sky-300 font-bold">{telemetry.pressure} mbar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">BUBBLE:</span>
            <span className={isHighRisk ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isHighRisk ? 'ANOMALY DETECTED' : 'NOMINAL (0%)'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STANDARD INTERACTIVE HUD MODE
  // ==========================================
  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between z-30">
      {/* 1. TOP FLOATING HUD ROW */}
      <div className="flex flex-col xl:flex-row items-start justify-between gap-3">
        {/* Left: Brand, Environment Switcher & Status Controls */}
        <div className="flex flex-col items-start gap-2 max-w-2xl">
          <div className="bg-[#090e1a]/90 backdrop-blur-md border border-teal/20 p-2 sm:px-3 sm:py-2 rounded-2xl pointer-events-auto shadow-xl flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-teal animate-pulse" />
              <span className="font-semibold text-xs tracking-wider text-white">BIOGUARDIAN</span>
            </div>
            <div className="h-4 w-px bg-white/15 hidden sm:block" />

            {/* MASTER ENVIRONMENT SWITCHER */}
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setEnvironmentMode('HARDWARE_TWIN')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition flex items-center gap-1.5 ${
                  environmentMode === 'HARDWARE_TWIN'
                    ? 'bg-teal text-slate-950 shadow-md shadow-teal/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to Real Hardware Digital Twin (ESP32)"
              >
                <Activity className="size-3" /> LIVE TWIN
              </button>
              <button
                onClick={() => {
                  setEnvironmentMode('VIRTUAL_LAB');
                  setLabDrawerOpen(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition flex items-center gap-1.5 ${
                  environmentMode === 'VIRTUAL_LAB'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Switch to In-Silico Virtual Lab Simulation"
              >
                <FlaskConical className="size-3" /> VIRTUAL LAB
              </button>
            </div>

            {/* Sub-Controls depending on active Environment */}
            {environmentMode === 'HARDWARE_TWIN' ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                  <button
                    onClick={() => setProviderMode('mock')}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      providerMode === 'mock'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    SIM
                  </button>
                  <button
                    onClick={() => setProviderMode('real')}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      providerMode === 'real'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    LIVE API
                  </button>
                </div>

                {!showBubbleSpotVisual && !isBubbleDetected ? (
                  <button
                    onClick={() => triggerBubbleSpot(false)}
                    className="px-2 py-1 rounded-lg text-[9px] font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 transition flex items-center gap-1"
                    title="Spot air bubble at optical inspection zone"
                  >
                    <Radio className="size-2.5 text-rose-400 animate-pulse" /> SPOT BUBBLE
                  </button>
                ) : (
                  <button
                    onClick={clearBubbleSpot}
                    className="px-2 py-1 rounded-lg text-[9px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="size-2.5 text-emerald-400" /> CLEAR
                  </button>
                )}
              </div>
            ) : (
              /* Virtual Lab Quick Actions */
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-300 uppercase">
                  {virtualLabOrgan}-ON-CHIP
                </span>
                <button
                  onClick={() => injectSimulatedBubble()}
                  className="px-2 py-1 rounded-lg text-[9px] font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 transition flex items-center gap-1"
                  title="Inject physical micro-bubble into fluid stream"
                >
                  <Waves className="size-2.5 text-rose-400 animate-pulse" /> INJECT BUBBLE
                </button>
                <button
                  onClick={() => setLabDrawerOpen(!labDrawerOpen)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold transition flex items-center gap-1 border ${
                    labDrawerOpen
                      ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  }`}
                >
                  <FlaskConical className="size-2.5 text-purple-400" /> PARAMETERS
                </button>
              </div>
            )}
          </div>

          {/* Bubble Warning Alert Banner */}
          {(isBubbleDetected || showBubbleSpotVisual) && (
            <div className="pointer-events-auto bg-rose-950/95 backdrop-blur-md border border-rose-500/60 px-3.5 py-2 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <AlertOctagon className="size-4 text-rose-400 shrink-0 animate-pulse" />
                <div className="text-xs text-rose-200">
                  <span className="font-bold text-white">BUBBLE SPOTTED AT OPTICAL ZONE</span>{' '}
                  <span className="font-mono text-rose-300">({probPercent}% risk)</span>
                </div>
              </div>
              <button
                onClick={() => setBubbleDrawerOpen(true)}
                className="px-2 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-semibold transition"
              >
                INTERCEPT
              </button>
            </div>
          )}
        </div>

        {/* Right: Telemetry Vital Cards & ML Status Pill */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Card 1: FLOW RATE */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <div className="p-1 rounded-lg bg-teal/10 text-teal">
              <Gauge className="size-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">FLOW</div>
              <div className="text-xs font-bold font-mono text-white">
                {Math.round(telemetry.flow_rate)} <span className="text-[10px] text-teal font-normal">µL/min</span>
              </div>
            </div>
          </div>

          {/* Card 2: BUBBLE RISK */}
          <button
            onClick={() => setBubbleDrawerOpen(true)}
            className={`bg-[#090e1a]/85 backdrop-blur-md border px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 transition cursor-pointer ${
              isHighRisk
                ? 'border-rose-500/60 bg-rose-950/40 text-rose-300 shadow-rose-900/30'
                : 'border-teal/20 text-slate-300 hover:border-teal/50'
            }`}
          >
            <div className={`p-1 rounded-lg ${isHighRisk ? 'bg-rose-500/20 text-rose-400' : 'bg-teal/10 text-teal'}`}>
              <Waves className="size-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">BUBBLE</div>
              <div className={`text-xs font-bold font-mono ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isHighRisk ? 'ALERT' : 'NOMINAL'}
              </div>
            </div>
            <span className={`px-1 rounded text-[9px] font-mono border ${
              isHighRisk ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-white/5 text-slate-400 border-white/10'
            }`}>
              {probPercent}%
            </span>
          </button>

          {/* Card 3: ML PREDICTION GATEWAY BADGE (Strict Zero-Fake-ML) */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-purple-500/30 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <span className="size-2 rounded-full bg-slate-500" />
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">ML GATEWAY</div>
              <div className="text-xs font-semibold text-slate-300">NOT CONNECTED</div>
            </div>
          </div>

          {/* Card 4: FULLSCREEN / DISPLAY MODES */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 p-1 rounded-xl shadow-lg flex items-center gap-1">
            <button
              onClick={() => setViewMode(viewMode === 'CLEAN_3D' ? 'STANDARD' : 'CLEAN_3D')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'CLEAN_3D' ? 'bg-teal text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Clean 3D viewport (hide HUD)"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode('PRESENTATION')}
              className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition"
              title="Presentation Mode"
            >
              <Tv className="size-3.5" />
            </button>
            <button
              onClick={toggleBrowserFullscreen}
              className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition"
              title="Toggle browser fullscreen"
            >
              {isBrowserFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM CONTROL & NAVIGATION BAR */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-3 pointer-events-auto">
        {/* Left: Camera Presets */}
        <div className="bg-[#090e1a]/90 backdrop-blur-md border border-teal/20 p-1 rounded-2xl shadow-xl flex flex-wrap items-center gap-1 max-w-2xl">
          <div className="px-2 py-1 text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <Camera className="size-3 text-teal" /> Presets:
          </div>
          {PRESET_CONFIG.map(([presetKey, label]) => (
            <button
              key={presetKey}
              onClick={() => setCameraPreset(presetKey)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                cameraPreset === presetKey
                  ? 'bg-teal text-slate-950 font-semibold shadow-md shadow-teal/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: Triggers & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dedicated Virtual Lab Simulator Page Link */}
          <Link
            href="/dashboard/virtual-lab"
            className="px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-950/70 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold backdrop-blur-md shadow-lg transition flex items-center gap-2 group"
          >
            <FlaskConical className="size-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Virtual Lab Studio</span>
            <span className="rounded bg-purple-900/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-purple-200 uppercase">
              SIM
            </span>
          </Link>

          {/* Live Telemetry Drawer Button */}
          <button
            onClick={() => setTelemetryDrawerOpen(!telemetryDrawerOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5 ${
              telemetryDrawerOpen
                ? 'bg-teal/20 border-teal text-teal'
                : 'bg-[#090e1a]/85 border-teal/20 text-slate-200 hover:border-teal/40'
            }`}
          >
            <Activity className="size-3.5 text-teal" />
            <span>Telemetry</span>
          </button>

          {/* Bubble Analysis Drawer Button */}
          <button
            onClick={() => setBubbleDrawerOpen(!bubbleDrawerOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5 ${
              bubbleDrawerOpen
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-[#090e1a]/85 border-teal/20 text-slate-200 hover:border-rose-500/40'
            }`}
          >
            <ShieldAlert className="size-3.5 text-rose-400" />
            <span>Bubble Interceptor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
