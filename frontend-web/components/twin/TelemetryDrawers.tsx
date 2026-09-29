'use client';

/**
 * BioGuardian Glass Telemetry Drawers
 *
 * 1. Live Hardware Telemetry Drawer (All 6 physical sensors, physiological metrics)
 * 2. Bubble Interceptor & Optical Anomaly Analysis Drawer
 */

import React, { useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Flame,
  Gauge,
  Info,
  ShieldAlert,
  Thermometer,
  Waves,
  X,
  Zap,
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
      {/* 1. LIVE TELEMETRY DRAWER (All Physical Sensors)           */}
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
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Waves className="size-3.5 text-teal" /> Volumetric Flow Rate
                  </span>
                  <span className="font-mono text-emerald-400">NOMINAL</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {telemetry.flow_rate?.toFixed(1) || '450.0'}
                  </span>
                  <span className="text-xs text-slate-400">µL/min</span>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden mt-3">
                  <div
                    className="h-full bg-teal transition-all duration-300"
                    style={{ width: `${Math.min(100, ((telemetry.flow_rate || 450) / 1000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Perfusion Pressure */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="size-3.5 text-cyan-400" /> Perfusion Pressure
                  </span>
                  <span className="font-mono text-emerald-400">NOMINAL</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {telemetry.pressure?.toFixed(2) || '12.40'}
                  </span>
                  <span className="text-xs text-slate-400">mbar</span>
                </div>
              </div>

              {/* Physiological pH */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Droplet className="size-3.5 text-purple-400" /> Culture pH
                  </span>
                  <span className="font-mono text-emerald-400">7.35 - 7.45</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {telemetry.ph?.toFixed(2) || '7.40'}
                  </span>
                  <span className="text-xs text-slate-400">pH</span>
                </div>
              </div>

              {/* Incubator Temperature */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Flame className="size-3.5 text-amber-400" /> Medium Temperature
                  </span>
                  <span className="font-mono text-emerald-400">HOMEOSTATIC</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {telemetry.temperature?.toFixed(1) || '37.0'}
                  </span>
                  <span className="text-xs text-slate-400">°C</span>
                </div>
              </div>

              {/* Dissolved Oxygen */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="size-3.5 text-blue-400" /> Dissolved Oxygen (dO2)
                  </span>
                  <span className="font-mono text-emerald-400">OPTIMAL</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {telemetry.dissolved_oxygen?.toFixed(2) || '6.50'}
                  </span>
                  <span className="text-xs text-slate-400">mg/L</span>
                </div>
              </div>

              {/* Optical Bubble Detector */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Zap className="size-3.5 text-emerald-400" /> Optical Bubble Detector
                  </span>
                  <span className={`font-mono ${telemetry.bubble_detected ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                    {telemetry.bubble_detected ? 'BUBBLE DETECTED' : 'CLEAR'}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">
                    {probPercent}%
                  </span>
                  <span className="text-xs text-slate-400">Risk Probability</span>
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
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#090e1a]/95 backdrop-blur-xl border-l border-teal/20 p-6 shadow-2xl flex flex-col pointer-events-auto overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-teal/20 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isHighRisk ? 'bg-rose-500/10 text-rose-400' : 'bg-teal/10 text-teal'}`}>
                  {isHighRisk ? <ShieldAlert className="size-5" /> : <AlertTriangle className="size-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                    BUBBLE INTERCEPTOR
                    {isHighRisk && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        ANOMALY
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">Micro-Bubble Detection & Diverter Actuator</p>
                </div>
              </div>
              <button
                onClick={() => setBubbleDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
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

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs text-slate-300">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Info className="size-3.5 text-teal" /> Trap Mechanism
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The upstream Y-junction chip incorporates a passive debubbler well and serpentine mixer. If micro-bubbles bypass the trap, the optical zone flags the anomaly for pinch-valve diversion.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button
                  onClick={() => triggerBubbleAlert()}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <AlertOctagon className="size-3.5 text-rose-400" /> Trigger Spot
                </button>
                <button
                  onClick={() => clearBubbleAlert()}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
