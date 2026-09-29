'use client';

/**
 * BioGuardian Glass Drawers (Hardware Twin Monitoring)
 *
 * 1. Live Hardware Telemetry Drawer (All 6 physical sensors from ESP32)
 * 2. Bubble Interceptor & Anomaly Analysis Drawer
 */

import React, { useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Gauge,
  ShieldAlert,
  Thermometer,
  Waves,
  X,
} from 'lucide-react';
import { useTelemetry } from '@/lib/telemetry/TelemetryContext';

interface TelemetryDrawersProps {
  telemetryDrawerOpen: boolean;
  setTelemetryDrawerOpen: (open: boolean) => void;
  bubbleDrawerOpen: boolean;
  setBubbleDrawerOpen: (open: boolean) => void;
}

export function TelemetryDrawers({
  telemetryDrawerOpen,
  setTelemetryDrawerOpen,
  bubbleDrawerOpen,
  setBubbleDrawerOpen,
}: TelemetryDrawersProps) {
  const {
    telemetry,
    setInspectionTarget,
    triggerBubbleAlert,
    clearBubbleAlert,
  } = useTelemetry();

  // Handle ESC key to dismiss any open drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTelemetryDrawerOpen(false);
        setBubbleDrawerOpen(false);
        setInspectionTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTelemetryDrawerOpen, setBubbleDrawerOpen, setInspectionTarget]);

  const probPercent = Math.round(telemetry.bubble_probability * 100);
  const isHighRisk = telemetry.bubble_detected || probPercent > 75;

  return (
    <>
      {/* ========================================================= */}
      {/* 1. LIVE TELEMETRY DRAWER (All 6 Sensors)                  */}
      {/* ========================================================= */}
      {telemetryDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:bg-transparent"
          onClick={() => setTelemetryDrawerOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#090e1a]/95 backdrop-blur-xl border-r border-teal/20 p-6 shadow-2xl flex flex-col pointer-events-auto overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-teal/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal/10 text-teal">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                    VITAL TELEMETRY
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h2>
                  <p className="text-xs text-slate-400">Real-Time Sensor Bus · ESP32 Hardware</p>
                </div>
              </div>
              <button
                onClick={() => setTelemetryDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Sensor Metric Grid */}
            <div className="mt-5 space-y-3.5 flex-1">
              {/* Volumetric Flow Rate */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Waves className="size-3.5 text-teal" /> Flow Rate
                  </span>
                  <span className="font-mono text-[10px] text-teal px-1.5 py-0.5 rounded bg-teal/10 border border-teal/20">
                    TARGET: 450
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {telemetry.flow_rate.toFixed(1)} <span className="text-xs font-normal text-slate-400">µL/min</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Nominal
                  </span>
                </div>
              </div>

              {/* Hydrostatic Pressure */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="size-3.5 text-sky-400" /> Hydrostatic Pressure
                  </span>
                  <span className="font-mono text-[10px] text-sky-400 px-1.5 py-0.5 rounded bg-sky-400/10 border border-sky-400/20">
                    RANGE: 980-1040
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {telemetry.pressure.toFixed(1)} <span className="text-xs font-normal text-slate-400">mbar</span>
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-1 ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isHighRisk ? <AlertTriangle className="size-3" /> : <CheckCircle2 className="size-3" />}
                    {isHighRisk ? 'Elevated' : 'Stable'}
                  </span>
                </div>
              </div>

              {/* pH Level */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Droplet className="size-3.5 text-teal" /> pH Buffer
                  </span>
                  <span className="font-mono text-[10px] text-teal px-1.5 py-0.5 rounded bg-teal/10 border border-teal/20">
                    OPT: 7.35-7.45
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {telemetry.ph.toFixed(2)} <span className="text-xs font-normal text-slate-400">pH</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Physiological
                  </span>
                </div>
              </div>

              {/* Dissolved Oxygen */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Activity className="size-3.5 text-cyan-400" /> Dissolved Oxygen (dO₂)
                  </span>
                  <span className="font-mono text-[10px] text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20">
                    SAT: 95%
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {telemetry.oxygen.toFixed(2)} <span className="text-xs font-normal text-slate-400">mg/L</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Optimal
                  </span>
                </div>
              </div>

              {/* Temperature */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="size-3.5 text-amber-400" /> Incubation Chamber
                  </span>
                  <span className="font-mono text-[10px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                    TARGET: 37.0°C
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {telemetry.temperature.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> In Range
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BUBBLE INTERCEPTOR & ANOMALY DRAWER                    */}
      {/* ========================================================= */}
      {bubbleDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:bg-transparent"
          onClick={() => setBubbleDrawerOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[440px] bg-[#090e1a]/95 backdrop-blur-xl border-l border-rose-500/30 p-6 shadow-2xl flex flex-col pointer-events-auto overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isHighRisk ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-teal/10 text-teal'}`}>
                  <ShieldAlert className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-white">
                    BUBBLE INTERCEPTION
                  </h2>
                  <p className="text-xs text-slate-400">Optical Edge AI & Microfluidic Diverter</p>
                </div>
              </div>
              <button
                onClick={() => setBubbleDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 flex-1">
              <div className={`p-4 rounded-xl border ${
                isHighRisk ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-white/[0.03] border-white/10'
              }`}>
                <div className="text-xs text-slate-400">Optical Detection Confidence</div>
                <div className="text-3xl font-bold font-mono tracking-tight text-white mt-1">
                  {probPercent}%
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-300 ${isHighRisk ? 'bg-rose-500' : 'bg-teal'}`}
                    style={{ width: `${probPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerBubbleAlert()}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <AlertOctagon className="size-3.5 text-rose-400" /> Trigger Anomaly
                </button>
                <button
                  onClick={() => clearBubbleAlert()}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="size-3.5 text-emerald-400" /> Clear Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
