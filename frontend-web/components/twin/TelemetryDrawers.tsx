'use client';

/**
 * BioGuardian Glass Telemetry Drawers
 *
 * Floating dark-glass drawers with backdrop-blur, scientific typography,
 * keyboard accessibility (Escape), and click-outside dismissal.
 */

import React, { useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Droplet,
  Eye,
  Flame,
  Gauge,
  Info,
  Microscope,
  ShieldCheck,
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
    inspectionTarget,
    setInspectionTarget,
    triggerBubbleAlert,
    clearBubbleAlert,
    setSimulationFlowRate,
    providerMode,
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
  const isSuspicious = !isHighRisk && probPercent > 35;

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
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#090e1a]/90 backdrop-blur-xl border-l border-teal/20 p-6 flex flex-col shadow-2xl text-slate-100 z-50 overflow-y-auto animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal/15 text-teal border border-teal/30">
                  <Activity className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide text-white">LIVE SENSOR TELEMETRY</h3>
                  <div className="text-[11px] text-slate-400">Microfluidic Channel Bus · 1000ms Poll</div>
                </div>
              </div>
              <button
                onClick={() => setTelemetryDrawerOpen(false)}
                className="size-8 rounded-lg border border-white/10 hover:border-teal/40 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition"
                aria-label="Close telemetry drawer"
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
                <div className="mt-2 text-[11px] text-slate-400 flex justify-between border-t border-white/5 pt-2">
                  <span>Velocity: {(telemetry.flow_rate * 0.0022).toFixed(3)} mm/s</span>
                  <span>Shear: 0.12 Pa</span>
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
                <div className="mt-2 text-[11px] text-slate-400 flex justify-between border-t border-white/5 pt-2">
                  <span>Delta P: +0.4%</span>
                  <span>Resistance: 2.24 Pa·s/m³</span>
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
                    SAT: 6.0-8.0
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {telemetry.oxygen.toFixed(1)} <span className="text-xs font-normal text-slate-400">mg/L</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Normoxic
                  </span>
                </div>
              </div>

              {/* Glucose Concentration */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Flame className="size-3.5 text-amber-400" /> Glucose Concentration
                  </span>
                  <span className="font-mono text-[10px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                    OPT: 80-120
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {telemetry.glucose.toFixed(1)} <span className="text-xs font-normal text-slate-400">mg/dL</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Balanced
                  </span>
                </div>
              </div>

              {/* Temperature */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-teal/30 transition">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="size-3.5 text-rose-400" /> Incubation Temperature
                  </span>
                  <span className="font-mono text-[10px] text-rose-400 px-1.5 py-0.5 rounded bg-rose-400/10 border border-rose-400/20">
                    TARGET: 37.0°C
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {telemetry.temperature.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Core Setpoint
                  </span>
                </div>
              </div>
            </div>

            {/* Footer summary */}
            <div className="pt-4 mt-auto border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-teal animate-pulse" />
                Bus: BG-I2C-SPI-01
              </span>
              <span className="font-mono text-[11px]">{new Date(telemetry.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BUBBLE ANALYSIS DRAWER                                 */}
      {/* ========================================================= */}
      {bubbleDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:bg-transparent"
          onClick={() => setBubbleDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[440px] bg-[#090e1a]/90 backdrop-blur-xl border-l border-teal/20 p-6 flex flex-col shadow-2xl text-slate-100 z-50 overflow-y-auto animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-xl border ${isHighRisk ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-teal/15 text-teal border-teal/30'}`}>
                  <Zap className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide text-white">AI BUBBLE DETECTION ANALYSIS</h3>
                  <div className="text-[11px] text-slate-400">Inlet Inspection Zone · CMOS + IR Refractometry</div>
                </div>
              </div>
              <button
                onClick={() => setBubbleDrawerOpen(false)}
                className="size-8 rounded-lg border border-white/10 hover:border-teal/40 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition"
                aria-label="Close bubble drawer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Bubble Status Banner */}
            <div className={`mt-5 p-4 rounded-2xl border ${
              isHighRisk
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/40'
                : isSuspicious
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                : 'bg-teal/10 border-teal/30 text-teal-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold">Classification State</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${
                  isHighRisk
                    ? 'bg-rose-500 text-white'
                    : isSuspicious
                    ? 'bg-amber-500 text-black'
                    : 'bg-teal text-white'
                }`}>
                  {telemetry.bubble_detected ? 'BUBBLE DETECTED' : 'BUBBLE NOT DETECTED'}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-400">Estimated Bubble Probability</div>
                  <div className="text-3xl font-bold font-mono text-white mt-0.5">
                    {probPercent}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Severity Rating</div>
                  <div className={`text-sm font-semibold mt-1 ${
                    isHighRisk ? 'text-rose-400' : isSuspicious ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {isHighRisk ? 'HIGH CRITICAL' : isSuspicious ? 'SUSPICIOUS' : 'NOMINAL CLEAR'}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3.5 h-2 w-full rounded-full bg-black/40 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isHighRisk ? 'bg-rose-500' : isSuspicious ? 'bg-amber-400' : 'bg-teal'
                  }`}
                  style={{ width: `${Math.max(2, probPercent)}%` }}
                />
              </div>
            </div>

            {/* Analysis Metrics */}
            <div className="mt-5 space-y-3">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Observation Zone Coordinate</span>
                <span className="font-mono text-white font-medium">x = -20.0 mm (Upstream)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Microchannel Hydrodynamic Flow</span>
                <span className="font-mono text-white font-medium">{telemetry.flow_rate.toFixed(1)} µL/min</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Optical Transmittance Deviation</span>
                <span className={`font-mono font-medium ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isHighRisk ? '-42.8% (IR Dip)' : '+0.2% (Clear)'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Organ-on-Chip Barrier Protection</span>
                <span className="text-teal font-medium flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> Intercept Ready
                </span>
              </div>
            </div>

            {/* Interactive Simulation Injections (clearly marked DEMO) */}
            {providerMode === 'mock' && (
              <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-300">DEMO INJECTION CONTROLS</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal/10 text-teal border border-teal/20">
                    SIMULATION ONLY
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Inject synthetic microfluidic anomalies into the 3D Digital Twin to evaluate protection response.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={triggerBubbleAlert}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium hover:bg-rose-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <span>🔴</span> Inject Bubble
                  </button>
                  <button
                    onClick={clearBubbleAlert}
                    className="py-2.5 px-3 rounded-xl bg-teal/20 border border-teal/40 text-teal-200 text-xs font-medium hover:bg-teal/30 transition flex items-center justify-center gap-1.5"
                  >
                    <span>🟢</span> Clear Bubble
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Simulate Flow Speed:</span>
                  <div className="flex gap-1.5">
                    {[0, 200, 450].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSimulationFlowRate(rate)}
                        className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border ${
                          Math.abs(telemetry.flow_rate - rate) < 15
                            ? 'bg-teal text-black font-bold border-teal'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        {rate === 0 ? 'Halt' : `${rate}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CONTEXTUAL COMPONENT INSPECTION DRAWER                  */}
      {/* ========================================================= */}
      {inspectionTarget && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:bg-transparent"
          onClick={() => setInspectionTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-4 sm:left-8 bottom-6 sm:bottom-10 w-[calc(100%-2rem)] sm:w-[460px] bg-[#090e1a]/95 backdrop-blur-2xl border border-teal/30 rounded-3xl p-6 shadow-2xl text-slate-100 z-50 animate-in slide-in-from-bottom duration-300"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal/15 text-teal border border-teal/30">
                  {inspectionTarget === 'ORGAN_ON_CHIP' ? <Microscope className="size-5" /> : <Eye className="size-5" />}
                </span>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide text-white">
                    {inspectionTarget === 'ORGAN_ON_CHIP'
                      ? 'ORGAN-ON-CHIP (PDMS BIO-CHAMBER)'
                      : 'INLET BUBBLE OBSERVATION ZONE'}
                  </h3>
                  <div className="text-[11px] text-teal">
                    {inspectionTarget === 'ORGAN_ON_CHIP'
                      ? 'Primary Monitored Cell Culture Substrate'
                      : 'Upstream Optical Anomaly Intercept Gate'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectionTarget(null)}
                className="size-8 rounded-lg border border-white/10 hover:border-teal/40 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition"
                aria-label="Close component inspection drawer"
              >
                <X className="size-4" />
              </button>
            </div>

            {inspectionTarget === 'ORGAN_ON_CHIP' ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[11px] text-slate-400">Microchannel Health</span>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">100% NOMINAL</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[11px] text-slate-400">Bubble Risk Level</span>
                    <div className={`text-lg font-bold font-mono mt-0.5 ${isHighRisk ? 'text-rose-400' : 'text-teal'}`}>
                      {isHighRisk ? 'CRITICAL SPIKE' : 'CLEAR'}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Material Composition:</span>
                    <span className="font-medium text-white">Sylgard 184 PDMS / Glass Base</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cell Culture Model:</span>
                    <span className="font-medium text-white">Endothelial-Epithelial Barrier</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Central Chamber Vol:</span>
                    <span className="font-mono text-white">2.8 µL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Core Incubation:</span>
                    <span className="font-mono text-white">{telemetry.temperature.toFixed(1)} °C</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[11px] text-slate-400">Detection Node</span>
                    <div className="text-lg font-bold font-mono text-teal mt-0.5">OPT-CMOS-A1</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[11px] text-slate-400">Confidence Score</span>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">{probPercent}%</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Axial Position:</span>
                    <span className="font-mono text-white">-20.0 mm Upstream</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Optical Modality:</span>
                    <span className="font-medium text-white">High-Speed Edge Vision + IR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Observed Flow:</span>
                    <span className="font-mono text-white">{telemetry.flow_rate.toFixed(1)} µL/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hydrostatic Head:</span>
                    <span className="font-mono text-white">{telemetry.pressure.toFixed(1)} mbar</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
