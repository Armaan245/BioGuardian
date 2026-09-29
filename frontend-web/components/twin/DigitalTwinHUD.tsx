'use client';

/**
 * BioGuardian Mission-Control HUD Overlay
 *
 * Floating dark glass cards inspired by SolarEye scientific design system:
 * - Transparent glass cards (backdrop-blur-md, thin borders, subtle glow)
 * - Information-dense but minimal, keeping the 3D Digital Twin dominant
 * - Telemetry state cards: FLOW, BUBBLE, SYSTEM
 * - Presets: FULL SYSTEM, INLET OBSERVATION, ORGAN-ON-CHIP
 * - Display Modes: Standard HUD, Clean 3D, Presentation Mode
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  Camera,
  CheckCircle2,
  ChevronDown,
  Eye,
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

  // ==========================================
  // PRESENTATION MODE (Minimalist Clean Showcase)
  // ==========================================
  if (viewMode === 'PRESENTATION') {
    return (
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-30">
        {/* Minimal Presentation Header */}
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

        {/* Minimalist Presentation Bottom Readouts */}
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
                ONLINE · {telemetry.source}
              </div>
            </div>
          </div>

          {/* Critical alert banner in presentation mode */}
          {isBubbleDetected && (
            <div className="bg-rose-500/20 backdrop-blur-md border border-rose-500/50 px-5 py-3 rounded-2xl text-rose-200 flex items-center gap-3 animate-pulse">
              <AlertOctagon className="size-5 text-rose-400 shrink-0" />
              <div className="text-xs">
                <strong className="block font-semibold">BUBBLE INTERCEPT ACTIVE</strong>
                Protecting downstream Organ-on-Chip chamber
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // CLEAN 3D MODE (Uncluttered Scene Focus)
  // ==========================================
  if (viewMode === 'CLEAN_3D') {
    return (
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-30">
        <div className="flex items-center justify-between">
          <div className="bg-[#090e1a]/80 backdrop-blur-md border border-teal/20 px-4 py-2 rounded-xl pointer-events-auto flex items-center gap-2.5 text-xs text-white">
            <span className="size-2 rounded-full bg-teal animate-pulse" />
            <span className="font-semibold">BioGuardian</span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-teal">CLEAN 3D MODE</span>
          </div>

          <button
            onClick={() => setViewMode('STANDARD')}
            className="pointer-events-auto px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white backdrop-blur-md transition flex items-center gap-1.5"
          >
            <Layers className="size-3.5" /> Restore HUD
          </button>
        </div>

        {/* Critical alert pill if active */}
        {isBubbleDetected && (
          <div className="self-center bg-rose-500/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide shadow-2xl flex items-center gap-2 animate-bounce pointer-events-auto">
            <ShieldAlert className="size-4" /> BUBBLE DETECTED IN INLET LINE ({probPercent}%)
          </div>
        )}

        <div className="text-[11px] text-slate-500 font-mono text-center">
          Click and drag to rotate · Scroll to zoom · Right click to pan
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
        {/* Left: Brand & Telemetry Source Switch + Top-Left Alert */}
        <div className="flex flex-col items-start gap-2.5 max-w-xl">
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 p-2 sm:px-4 sm:py-2 rounded-2xl pointer-events-auto shadow-xl flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-teal animate-pulse" />
              <span className="font-semibold text-xs tracking-wide text-white">BIOGUARDIAN TWIN</span>
            </div>
            <div className="h-4 w-px bg-white/15 hidden sm:block" />

            {/* Mode Selector Segmented Buttons */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setProviderMode('mock')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition flex items-center gap-1.5 ${
                  providerMode === 'mock'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="size-3 text-amber-400" /> SIMULATION
              </button>
              <button
                onClick={() => setProviderMode('real')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider transition flex items-center gap-1.5 ${
                  providerMode === 'real'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wifi className="size-3 text-emerald-400" /> LIVE APIS
              </button>
            </div>

            {/* Simulation vs Real Action Buttons */}
            {providerMode === 'mock' ? (
              <div className="flex items-center gap-2">
                {!showBubbleSpotVisual && !isBubbleDetected ? (
                  <button
                    onClick={() => triggerBubbleSpot(false)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 transition flex items-center gap-1.5 shadow-sm"
                    title="Spot air bubble at optical inspection zone"
                  >
                    <Radio className="size-3 text-rose-400 animate-pulse" /> SHOW BUBBLE SPOT
                  </button>
                ) : (
                  <button
                    onClick={clearBubbleSpot}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 transition flex items-center gap-1.5 shadow-sm"
                    title="Clear bubble and restore normal flow"
                  >
                    <CheckCircle2 className="size-3 text-emerald-400" /> CLEAR SPOT
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLatestFromApi}
                  disabled={isApiFetching}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal transition flex items-center gap-1.5 disabled:opacity-50"
                  title="Fetch latest reading from FastAPI endpoint"
                >
                  <RotateCcw className={`size-3 text-teal ${isApiFetching ? 'animate-spin' : ''}`} />
                  {isApiFetching ? 'FETCHING...' : 'FETCH API'}
                </button>
                <span
                  className="text-[10px] text-slate-400 font-mono hidden md:inline"
                  title={`API Base: ${backendUrl}`}
                >
                  {status === 'CONNECTED' ? 'LIVE APIS' : status === 'STALE' ? 'STALE' : 'OFFLINE'}
                </span>
              </div>
            )}
          </div>

          {/* Top-Left Alert Banner (Displaced from middle of screen to top-left) */}
          {(isBubbleDetected || showBubbleSpotVisual) && (
            <div className="pointer-events-auto bg-rose-950/95 backdrop-blur-md border border-rose-500/60 px-4 py-2.5 rounded-2xl shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="size-4 text-rose-400 shrink-0 animate-pulse" />
                <div className="text-xs text-rose-200">
                  <div className="font-bold tracking-wide text-white flex items-center gap-1.5">
                    BUBBLE SPOTTED AT OPTICAL ZONE <span className="text-[11px] font-mono text-rose-300 font-normal">({probPercent}% risk)</span>
                  </div>
                  <div className="text-[10px] text-rose-300/90 leading-tight mt-0.5">Observation reticle highlighted · Valve intercept armed</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                <button
                  onClick={() => setBubbleDrawerOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold transition cursor-pointer shadow-xs"
                >
                  Inspect
                </button>
                <button
                  onClick={clearBubbleSpot}
                  className="px-2.5 py-1 rounded-lg border border-rose-400/50 bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition cursor-pointer"
                >
                  Clear Spot
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Primary Transparent Floating Status Cards */}
        <div className="flex flex-wrap items-center gap-2.5 pointer-events-auto">
          {/* Card 1: FLOW */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <Waves className="size-4 text-teal" />
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">FLOW</div>
              <div className="text-xs font-bold font-mono text-white">
                {telemetry.flow_rate.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">µL/min</span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal/10 text-teal border border-teal/20">
              {telemetry.flow_rate === 0 ? 'HALTED' : telemetry.flow_rate < 300 ? 'LOW' : 'NORMAL'}
            </span>
          </div>

          {/* Card 2: BUBBLE */}
          <button
            onClick={() => setBubbleDrawerOpen(true)}
            className={`bg-[#090e1a]/85 backdrop-blur-md border px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-3 transition text-left ${
              isHighRisk
                ? 'border-rose-500/50 hover:bg-rose-950/40 shadow-rose-950/50'
                : 'border-teal/20 hover:border-teal/40'
            }`}
          >
            <Zap className={`size-4 ${isHighRisk ? 'text-rose-400 animate-pulse' : 'text-teal'}`} />
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">BUBBLE</div>
              <div className={`text-xs font-bold font-mono ${isHighRisk ? 'text-rose-400' : 'text-white'}`}>
                {isBubbleDetected ? 'DETECTED' : 'NONE'}
              </div>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
              isHighRisk
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-white/5 text-slate-300 border-white/10'
            }`}>
              {probPercent}%
            </span>
          </button>

          {/* Card 3: SYSTEM */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">SYSTEM</div>
              <div className="text-xs font-semibold text-emerald-400">ONLINE</div>
            </div>
          </div>

          {/* Card 4: Mini Node / Component Inspection */}
          <button
            onClick={() => {
              if (inspectionTarget) {
                setInspectionTarget(null);
              } else {
                setInspectionTarget(cameraPreset === 'INLET_OBSERVATION' ? 'INLET_OBSERVATION' : 'ORGAN_ON_CHIP');
              }
            }}
            title={inspectionTarget ? 'Close component details popup' : 'View component inspection details'}
            className={`bg-[#090e1a]/85 backdrop-blur-md border px-3 py-2 rounded-xl shadow-lg flex items-center gap-2.5 transition text-left cursor-pointer ${
              inspectionTarget
                ? 'border-teal bg-teal/15 text-white shadow-teal/20 ring-1 ring-teal/40'
                : 'border-teal/20 hover:border-teal/50 hover:bg-white/5 text-slate-300'
            }`}
          >
            <div className={`p-1 rounded-lg ${inspectionTarget ? 'bg-teal text-black' : 'bg-teal/10 text-teal'}`}>
              <Info className="size-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">INSPECT</div>
              <div className="text-xs font-bold font-mono text-white">
                {inspectionTarget ? (inspectionTarget === 'ORGAN_ON_CHIP' ? 'CHIP' : 'INLET') : 'NODE'}
              </div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                inspectionTarget
                  ? 'bg-teal/20 text-teal border-teal/40'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              {inspectionTarget ? 'OPEN' : 'VIEW'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. BOTTOM CONTROL & NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pointer-events-auto">
        {/* Left: Camera Presets */}
        <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 p-1.5 rounded-2xl shadow-xl flex items-center gap-1">
          <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
            <Camera className="size-3 text-teal" /> Presets:
          </div>
          {(
            [
              ['FULL_SYSTEM', 'Full System'],
              ['INLET_OBSERVATION', 'Inlet Observation'],
              ['ORGAN_ON_CHIP', 'Organ-on-Chip'],
            ] as [CameraPreset, string][]
          ).map(([presetKey, label]) => (
            <button
              key={presetKey}
              onClick={() => setCameraPreset(presetKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
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
            <span>Telemetry Drawer</span>
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
            <span>Bubble Analysis</span>
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
            title="Presentation Mode for SIH / PPT Demonstration"
          >
            <Tv className="size-3.5 text-teal" />
            <span>Presentation</span>
          </button>

          {/* Browser Fullscreen Toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            className="px-3 py-2 rounded-xl bg-[#090e1a]/85 border border-teal/20 hover:border-teal/40 text-slate-300 hover:text-white text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5"
            title={isBrowserFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
          >
            {isBrowserFullscreen ? (
              <>
                <Minimize2 className="size-3.5 text-teal" />
                <span>Exit Full</span>
              </>
            ) : (
              <>
                <Maximize2 className="size-3.5 text-teal" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
