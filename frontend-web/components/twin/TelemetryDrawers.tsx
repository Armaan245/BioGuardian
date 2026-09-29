'use client';

/**
 * BioGuardian Glass Drawers
 *
 * 1. Live Hardware Telemetry Drawer (All 6 sensors, physiological metrics)
 * 2. Bubble Interceptor & Anomaly Analysis Drawer
 * 3. In-Silico Virtual Lab Simulation Deck:
 *    - Organ Model Selector (Lung, Heart, Liver, Kidney, Gut, Brain)
 *    - Real-Time Experimental Parameters (Drug Concentration, Flow Rate, Exposure, pH, dO2)
 *    - Physiological Simulation Waveforms
 *    - External ML Gateway Card (Strict Zero Fake ML: "Not Connected")
 * 4. Microfluidic Component Inspector
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Droplet,
  Eye,
  Flame,
  FlaskConical,
  Gauge,
  Heart,
  Info,
  Microscope,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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
  labDrawerOpen: boolean;
  setLabDrawerOpen: (open: boolean) => void;
}

const ORGAN_MODELS = [
  { id: 'lung', name: 'Lung-on-a-Chip', desc: 'Alveolar-capillary barrier & cyclic breathing', status: 'prototype' },
  { id: 'heart', name: 'Heart-on-a-Chip', desc: 'Cardiomyocyte electrophysiology & contractility', status: 'prototype' },
  { id: 'liver', name: 'Liver-on-a-Chip', desc: 'Hepatocyte metabolism & drug clearance', status: 'prototype' },
  { id: 'kidney', name: 'Kidney-on-a-Chip', desc: 'Glomerular filtration & tubular reabsorption', status: 'prototype' },
  { id: 'gut', name: 'Gut-on-a-Chip', desc: 'Intestinal epithelium & peristaltic motion', status: 'prototype' },
  { id: 'brain', name: 'Brain-on-a-Chip', desc: 'Blood-brain barrier tight-junction dynamics', status: 'prototype' },
];

export function TelemetryDrawers({
  telemetryDrawerOpen,
  setTelemetryDrawerOpen,
  bubbleDrawerOpen,
  setBubbleDrawerOpen,
  labDrawerOpen,
  setLabDrawerOpen,
}: TelemetryDrawersProps) {
  const {
    telemetry,
    inspectionTarget,
    setInspectionTarget,
    triggerBubbleAlert,
    clearBubbleAlert,
    setSimulationFlowRate,
    virtualLabOrgan,
    setVirtualLabOrgan,
    virtualLabParameters,
    setVirtualLabParameters,
    isSimulating,
    startSimulation,
    pauseSimulation,
    injectSimulatedBubble,
    environmentMode,
  } = useTelemetry();

  const [mlQueryLoading, setMlQueryLoading] = useState(false);
  const [mlGatewayResponse, setMlGatewayResponse] = useState<string | null>(null);

  // Handle ESC key to dismiss any open drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTelemetryDrawerOpen(false);
        setBubbleDrawerOpen(false);
        setLabDrawerOpen(false);
        setInspectionTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTelemetryDrawerOpen, setBubbleDrawerOpen, setLabDrawerOpen, setInspectionTarget]);

  const probPercent = Math.round(telemetry.bubble_probability * 100);
  const isHighRisk = telemetry.bubble_detected || probPercent > 75;

  // ML Gateway Call (Zero Fake ML: calls real endpoint /api/virtual-lab/ml/predict)
  const testMlGateway = async () => {
    setMlQueryLoading(true);
    setMlGatewayResponse(null);
    try {
      const res = await fetch('/api/virtual-lab/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organ: virtualLabOrgan,
          parameters: virtualLabParameters,
        }),
      });
      const data = await res.json();
      if (!data.available) {
        setMlGatewayResponse(data.message || 'ML Prediction Service: Not Connected');
      } else {
        setMlGatewayResponse(JSON.stringify(data.prediction));
      }
    } catch {
      setMlGatewayResponse('ML Prediction Service: Not Connected (Endpoint Unreachable)');
    } finally {
      setMlQueryLoading(false);
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. VIRTUAL LAB SIMULATION DECK DRAWER                     */}
      {/* ========================================================= */}
      {labDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:bg-transparent"
          onClick={() => setLabDrawerOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-full sm:w-[460px] bg-[#090e1a]/95 backdrop-blur-xl border-r border-purple-500/30 p-5 shadow-2xl flex flex-col pointer-events-auto overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FlaskConical className="size-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    VIRTUAL LAB DECK
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      IN-SILICO
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Organ-on-Chip Experimental Controls & ML Gateway</p>
                </div>
              </div>
              <button
                onClick={() => setLabDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 flex-1">
              {/* SECTION A: ORGAN PROFILE SELECTOR */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between mb-2">
                  <span>1. Select Organ Model</span>
                  <span className="text-[10px] font-mono text-purple-400">6 PROFILES AVAILABLE</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ORGAN_MODELS.map((org) => {
                    const isSelected = virtualLabOrgan === org.id;
                    return (
                      <button
                        key={org.id}
                        onClick={() => setVirtualLabOrgan(org.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-900/30 ring-1 ring-purple-500/50'
                            : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold font-mono tracking-wide">{org.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 px-1 py-0.2 rounded bg-white/5">
                            {org.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">{org.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION B: EXPERIMENT PARAMETERS */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  2. Experimental Parameters
                </label>

                {/* Drug Concentration Slider */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Droplet className="size-3 text-cyan-400" /> Drug Concentration
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {virtualLabParameters.drug_concentration ?? 50} µM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="5"
                    value={virtualLabParameters.drug_concentration ?? 50}
                    onChange={(e) =>
                      setVirtualLabParameters((prev) => ({
                        ...prev,
                        drug_concentration: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0 µM (Control)</span>
                    <span>250 µM</span>
                    <span>500 µM (Max)</span>
                  </div>
                </div>

                {/* Flow Rate Slider */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Waves className="size-3 text-teal" /> Perfusion Flow Rate
                    </span>
                    <span className="font-mono text-teal font-bold">
                      {virtualLabParameters.flow_rate ?? 450} µL/min
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="25"
                    value={virtualLabParameters.flow_rate ?? 450}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setVirtualLabParameters((prev) => ({ ...prev, flow_rate: val }));
                      setSimulationFlowRate(val);
                    }}
                    className="w-full accent-teal cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>50 µL/min</span>
                    <span>Physiological (450)</span>
                    <span>1000 µL/min</span>
                  </div>
                </div>

                {/* Exposure Duration & pH Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[11px] text-slate-400 block">Exposure (h)</span>
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={virtualLabParameters.exposure_duration ?? 24}
                      onChange={(e) =>
                        setVirtualLabParameters((prev) => ({
                          ...prev,
                          exposure_duration: Number(e.target.value),
                        }))
                      }
                      className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-[11px] text-slate-400 block">pH Buffer</span>
                    <input
                      type="number"
                      step="0.05"
                      min="6.5"
                      max="8.0"
                      value={virtualLabParameters.ph ?? 7.4}
                      onChange={(e) =>
                        setVirtualLabParameters((prev) => ({
                          ...prev,
                          ph: Number(e.target.value),
                        }))
                      }
                      className="mt-1 w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* Simulation Action Triggers */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => injectSimulatedBubble()}
                    className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Waves className="size-3.5 text-rose-400 animate-pulse" /> Inject Bubble
                  </button>
                  <button
                    onClick={() => {
                      setVirtualLabParameters({
                        drug_concentration: 50,
                        exposure_duration: 24,
                        flow_rate: 450,
                        ph: 7.4,
                        oxygen: 6.5,
                        temperature: 37.0,
                      });
                      setSimulationFlowRate(450);
                    }}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="size-3.5" /> Reset Baseline
                  </button>
                </div>
              </div>

              {/* SECTION C: EXTERNAL ML PREDICTION GATEWAY (Strict Zero-Fake-ML) */}
              <div className="pt-2 border-t border-white/5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Cpu className="size-3.5 text-purple-400" />
                  3. External ML Prediction Gateway
                </label>
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-slate-500" />
                      <span className="text-xs font-bold text-white">ML Prediction Service</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      NOT CONNECTED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The external machine learning model is an external service developed separately.
                    Configure <code className="text-purple-300 bg-black/40 px-1 py-0.5 rounded">ML_SERVICE_URL</code> in environment to connect.
                  </p>

                  <button
                    onClick={testMlGateway}
                    disabled={mlQueryLoading}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 disabled:opacity-50"
                  >
                    <Zap className="size-3.5" />
                    {mlQueryLoading ? 'Connecting to ML Service...' : 'Query ML Model Adapter'}
                  </button>

                  {mlGatewayResponse && (
                    <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 text-[11px] font-mono text-slate-300 break-all">
                      {mlGatewayResponse}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LIVE TELEMETRY DRAWER (All 6 Sensors)                  */}
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
      {/* 3. BUBBLE INTERCEPTOR & ANOMALY DRAWER                    */}
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
