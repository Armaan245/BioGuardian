'use client';

/**
 * BioGuardian Mission-Control HUD Overlay
 *
 * Dedicated to Real Hardware Digital Twin monitoring (ESP32):
 * - Live Hardware Telemetry: Flow, Pressure, Temperature, pH, dO2, Optical Bubble Risk
 * - Bubble Interception & Optical Spot Trigger
 * - Camera Presets across the entire fluidic train:
 *   FULL RIG, RESERVOIRS, Y-CHIP DEBUBBLER, OPTICAL ZONE, DUAL-LAYER OoC, SENSORS & WASTE
 * - Quick Link to dedicated Virtual Lab Studio (/dashboard/virtual-lab)
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertOctagon,
  Camera,
  CheckCircle2,
  Droplet,
  Flame,
  FlaskConical,
  Gauge,
  Maximize2,
  Minimize2,
  Radio,
  ShieldAlert,
  Tv,
  Waves,
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
    providerMode,
    setProviderMode,
    cameraPreset,
    setCameraPreset,
    viewMode,
    setViewMode,
    triggerBubbleSpot,
    clearBubbleSpot,
    showBubbleSpotVisual,
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
    ['FULL_SYSTEM', 'Full Rig'],
    ['RESERVOIRS', 'Reservoirs'],
    ['BUBBLE_TRAP', 'Y-Trap Chip'],
    ['INLET_OBSERVATION', 'Optical Zone'],
    ['ORGAN_ON_CHIP', 'Organ-on-Chip'],
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
              BIOGUARDIAN · LIVE HARDWARE DIGITAL TWIN
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Autonomous Organ-on-Chip Microfluidic Protection Rig
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Dual Reservoirs · Y-Junction Trap Chip · Dual-Channel OoC · Sensor Manifold
            </p>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => setViewMode('STANDARD')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white backdrop-blur-md transition flex items-center gap-2 cursor-pointer"
            >
              <Minimize2 className="size-3.5" /> Exit Presentation
            </button>
          </div>
        </div>

        {/* Presentation bottom ticker */}
        <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-6 py-3 rounded-2xl pointer-events-auto shadow-2xl self-center flex items-center gap-8 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">FLOW:</span>
            <span className="text-teal font-bold">{Math.round(telemetry.flow_rate || 450)} µL/min</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">PRESSURE:</span>
            <span className="text-sky-300 font-bold">{telemetry.pressure || 12.4} mbar</span>
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
        {/* Left: Brand, Mode & Quick Actions */}
        <div className="flex flex-col items-start gap-2 max-w-2xl">
          <div className="bg-[#090e1a]/90 backdrop-blur-md border border-teal/20 p-2 sm:px-3 sm:py-2 rounded-2xl pointer-events-auto shadow-xl flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-teal animate-pulse" />
              <span className="font-semibold text-xs tracking-wider text-white">BIOGUARDIAN</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal/10 text-teal border border-teal/20">
                LIVE TWIN
              </span>
            </div>
            <div className="h-4 w-px bg-white/15 hidden sm:block" />

            {/* Provider Mode Switcher (Simulated vs Live Hardware Gateway) */}
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => setProviderMode('mock')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition cursor-pointer ${
                  providerMode === 'mock'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Use simulated telemetry values"
              >
                SIM
              </button>
              <button
                onClick={() => setProviderMode('real')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition cursor-pointer ${
                  providerMode === 'real'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Connect to physical ESP32 REST telemetry"
              >
                LIVE API
              </button>
            </div>

            {/* Spot Bubble Interceptor Trigger */}
            {!showBubbleSpotVisual && !isBubbleDetected ? (
              <button
                onClick={() => triggerBubbleSpot(false)}
                className="px-2 py-1 rounded-lg text-[9px] font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 transition flex items-center gap-1 cursor-pointer"
                title="Simulate micro-bubble entering optical inspection zone"
              >
                <Radio className="size-2.5 text-rose-400 animate-pulse" /> SPOT BUBBLE
              </button>
            ) : (
              <button
                onClick={clearBubbleSpot}
                className="px-2 py-1 rounded-lg text-[9px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 transition flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="size-2.5 text-emerald-400" /> CLEAR
              </button>
            )}

            <div className="h-4 w-px bg-white/15 hidden sm:block" />

            {/* Dedicated Link to Virtual Lab Studio */}
            <Link
              href="/dashboard/virtual-lab"
              className="px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 text-[10px] font-mono font-bold tracking-wider transition flex items-center gap-1.5 shadow-sm group"
              title="Navigate to dedicated Virtual Lab Simulation Studio"
            >
              <FlaskConical className="size-3 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span>VIRTUAL LAB STUDIO</span>
              <span className="rounded bg-purple-900/80 px-1 py-0.2 text-[8px] font-mono text-purple-300">
                SIM
              </span>
            </Link>
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
                className="px-2 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-semibold transition cursor-pointer"
              >
                INTERCEPT
              </button>
            </div>
          )}
        </div>

        {/* Right: Telemetry Vital Cards & View Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Card 1: FLOW RATE */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <div className="p-1 rounded-lg bg-teal/10 text-teal">
              <Gauge className="size-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">FLOW</div>
              <div className="text-xs font-bold font-mono text-white">
                {Math.round(telemetry.flow_rate || 450)} <span className="text-[10px] text-teal font-normal">µL/min</span>
              </div>
            </div>
          </div>

          {/* Card 2: PRESSURE */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <div className="p-1 rounded-lg bg-sky-500/10 text-sky-400">
              <Waves className="size-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">PRESSURE</div>
              <div className="text-xs font-bold font-mono text-white">
                {telemetry.pressure || 12.4} <span className="text-[10px] text-sky-400 font-normal">mbar</span>
              </div>
            </div>
          </div>

          {/* Card 3: BUBBLE STATUS */}
          <div className={`bg-[#090e1a]/85 backdrop-blur-md border px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 ${
            isHighRisk ? 'border-rose-500/60 bg-rose-950/40' : 'border-teal/20'
          }`}>
            <div className={`p-1 rounded-lg ${isHighRisk ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <ShieldAlert className="size-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400">BUBBLE</div>
              <div className={`text-xs font-bold font-mono ${isHighRisk ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {isHighRisk ? `${probPercent}% ANOMALY` : 'NOMINAL'}
              </div>
            </div>
          </div>

          {/* Presentation Mode Toggle */}
          <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/20 p-1 rounded-xl shadow-lg flex items-center gap-1">
            <button
              onClick={() => setViewMode('PRESENTATION')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer"
              title="Showcase Presentation Mode"
            >
              <Tv className="size-3.5 text-teal" />
              <span className="hidden md:inline">Showcase</span>
            </button>
            <button
              onClick={toggleBrowserFullscreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title="Toggle Fullscreen"
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
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                cameraPreset === presetKey
                  ? 'bg-teal text-slate-950 font-semibold shadow-md shadow-teal/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: Drawer Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Telemetry Drawer Button */}
          <button
            onClick={() => setTelemetryDrawerOpen(!telemetryDrawerOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5 cursor-pointer ${
              telemetryDrawerOpen
                ? 'bg-teal/20 border-teal text-teal'
                : 'bg-[#090e1a]/85 border-teal/20 text-slate-200 hover:border-teal/40'
            }`}
          >
            <Activity className="size-3.5 text-teal" />
            <span>Vital Telemetry</span>
          </button>

          {/* Bubble Analysis Drawer Button */}
          <button
            onClick={() => setBubbleDrawerOpen(!bubbleDrawerOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md shadow-lg transition flex items-center gap-1.5 cursor-pointer ${
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

export default DigitalTwinHUD;
