'use client';

/**
 * BioGuardian Glass Telemetry Drawers
 *
 * Floating dark-glass drawers with backdrop-blur, scientific typography,
 * keyboard accessibility (Escape), and click-outside dismissal:
 * 1. Live Sensor Telemetry Drawer (Hardware bus)
 * 2. Bubble Analysis Drawer (Anomaly telemetry & physical trap)
 * 3. Component Inspection Modal (Prep Chip, OoC, Sensor Manifold)
 * 4. Virtual Lab Deck Drawer (In-Silico Organ Selector, Parameters, Waveforms, ML Gateway)
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Droplet,
  Eye,
  Flame,
  FlaskConical,
  Gauge,
  Info,
  Layers,
  Microscope,
  ShieldCheck,
  Thermometer,
  Waves,
  X,
  Zap,
  Sliders,
  Cpu,
} from 'lucide-react';
import { useTelemetry } from '@/lib/telemetry/TelemetryContext';
import OrganSelector from '@/components/virtual-lab/OrganSelector';
import ParameterPanel from '@/components/virtual-lab/ParameterPanel';
import SimulationCharts from '@/components/virtual-lab/SimulationCharts';
import ResultsPanel from '@/components/virtual-lab/ResultsPanel';
import type { OrganProfile, ParameterSchema, SimDataPoint, MLStatus, MLPredictResponse } from '@/lib/virtual-lab/types';
import { fetchOrgans, fetchOrganParameters, queryMLPredict, fetchMLStatus } from '@/lib/virtual-lab/api';

interface TelemetryDrawersProps {
  telemetryDrawerOpen: boolean;
  setTelemetryDrawerOpen: (open: boolean) => void;
  bubbleDrawerOpen: boolean;
  setBubbleDrawerOpen: (open: boolean) => void;
  virtualLabDrawerOpen?: boolean;
  setVirtualLabDrawerOpen?: (open: boolean) => void;
}

export function TelemetryDrawers({
  telemetryDrawerOpen,
  setTelemetryDrawerOpen,
  bubbleDrawerOpen,
  setBubbleDrawerOpen,
  virtualLabDrawerOpen = false,
  setVirtualLabDrawerOpen,
}: TelemetryDrawersProps) {
  const {
    telemetry,
    inspectionTarget,
    setInspectionTarget,
    triggerBubbleAlert,
    clearBubbleAlert,
    setSimulationFlowRate,
    providerMode,
    environmentMode,
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
    injectSimulatedBubble,
  } = useTelemetry();

  // Virtual Lab Drawer Sub-Tab
  const [vlTab, setVlTab] = useState<'CONFIG' | 'CHARTS' | 'RESULTS'>('CONFIG');

  // Dynamic parameters & organ profiles for the drawer
  const [organs, setOrgans] = useState<OrganProfile[]>([]);
  const [params, setParams] = useState<ParameterSchema[]>([]);
  const [mlStatus, setMLStatus] = useState<MLStatus | null>(null);
  const [mlResult, setMLResult] = useState<MLPredictResponse | null>(null);
  const [mlQuerying, setMLQuerying] = useState<boolean>(false);
  const [chartData, setChartData] = useState<SimDataPoint[]>([]);

  useEffect(() => {
    fetchOrgans().then(setOrgans).catch(() => {});
    fetchMLStatus().then(setMLStatus).catch(() => {});
  }, []);

  useEffect(() => {
    fetchOrganParameters(virtualLabOrgan)
      .then((res) => {
        if (res?.parameters) setParams(res.parameters);
      })
      .catch(() => {});
  }, [virtualLabOrgan]);

  // Keep simulated chart data ticking when isSimulating is active
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      const fr = virtualLabParams.flow_rate || 450;
      setChartData((prev) => {
        const next = [
          ...prev,
          {
            t: prev.length + 1,
            flow_rate: fr + (Math.random() - 0.5) * 6,
            pressure: fr * 2.27 + (Math.random() - 0.5) * 2,
            ph: (virtualLabParams.ph || 7.4) + (Math.random() - 0.5) * 0.03,
            oxygen: (virtualLabParams.oxygen || 6.5) + (Math.random() - 0.5) * 0.08,
            bubble_position: simulatedBubbleActive ? 0.35 : 0,
          },
        ];
        return next.length > 60 ? next.slice(-60) : next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating, virtualLabParams, simulatedBubbleActive]);

  const handleQueryML = async () => {
    setMLQuerying(true);
    setVlTab('RESULTS');
    try {
      const res = await queryMLPredict(virtualLabOrgan, virtualLabParams);
      setMLResult(res);
      const st = await fetchMLStatus();
      setMLStatus(st);
    } catch {
      setMLResult({
        available: false,
        message: 'Could not connect to external ML prediction service.',
      });
    } finally {
      setMLQuerying(false);
    }
  };

  // Handle ESC key to dismiss any open drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTelemetryDrawerOpen(false);
        setBubbleDrawerOpen(false);
        setInspectionTarget(null);
        setVirtualLabDrawerOpen?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTelemetryDrawerOpen, setBubbleDrawerOpen, setInspectionTarget, setVirtualLabDrawerOpen]);

  const probPercent = Math.round(telemetry.bubble_probability * 100);
  const isHighRisk = telemetry.bubble_detected || probPercent > 75;
  const isSuspicious = !isHighRisk && probPercent > 35;

  return (
    <>
      {/* ========================================================= */}
      {/* 1. LIVE TELEMETRY DRAWER                                  */}
      {/* ========================================================= */}
      {telemetryDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:bg-transparent"
          onClick={() => setTelemetryDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#090e1a]/95 backdrop-blur-xl border-l border-teal/20 p-6 flex flex-col shadow-2xl text-slate-100 z-50 overflow-y-auto animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal/15 text-teal border border-teal/30">
                  <Activity className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide text-white">LIVE SENSOR TELEMETRY</h3>
                  <div className="text-[11px] text-slate-400">Microfluidic Sensor Manifold Bus</div>
                </div>
              </div>
              <button
                onClick={() => setTelemetryDrawerOpen(false)}
                className="size-8 rounded-lg border border-white/10 hover:border-teal/40 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Telemetry Metric Cards */}
            <div className="mt-5 space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[11px] text-slate-400">Microfluidic Flow Rate</span>
                <div className="text-xl font-bold font-mono text-teal mt-0.5">
                  {telemetry.flow_rate.toFixed(1)} <span className="text-xs font-normal text-slate-400">µL/min</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[11px] text-slate-400">Channel Hydrostatic Pressure</span>
                <div className="text-xl font-bold font-mono text-purple-300 mt-0.5">
                  {telemetry.pressure.toFixed(1)} <span className="text-xs font-normal text-slate-400">mbar</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[11px] text-slate-400">Physiological pH</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {telemetry.ph.toFixed(2)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[11px] text-slate-400">Dissolved Oxygen (pO₂)</span>
                <div className="text-xl font-bold font-mono text-sky-400 mt-0.5">
                  {telemetry.oxygen.toFixed(1)} <span className="text-xs font-normal text-slate-400">mg/L</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[11px] text-slate-400">Medium Incubation Temperature</span>
                <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                  {telemetry.temperature.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
                </div>
              </div>
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
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[440px] bg-[#090e1a]/95 backdrop-blur-xl border-l border-rose-500/30 p-6 flex flex-col shadow-2xl text-slate-100 z-50 overflow-y-auto animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <Zap className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide text-white">BUBBLE TRAP TELEMETRY</h3>
                  <div className="text-[11px] text-rose-300">Passive Vent Well & Optical Detection</div>
                </div>
              </div>
              <button
                onClick={() => setBubbleDrawerOpen(false)}
                className="size-8 rounded-lg border border-white/10 hover:border-rose-400/40 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30">
                <span className="text-[11px] text-rose-300 uppercase font-mono">Detection Confidence</span>
                <div className="text-2xl font-bold font-mono text-white mt-1">{probPercent}%</div>
                <div className="w-full h-2 bg-slate-900 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(probPercent, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Passive Trap Status:</span>
                  <span className="font-semibold text-teal-300">Active Hydrophobic Membrane</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bubble Location:</span>
                  <span className="font-mono text-white">Prep & Bubble Trap Well (x=20)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Downstream OoC Risk:</span>
                  <span className={isHighRisk ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {isHighRisk ? 'Interception Valve Engaged' : 'Safe / Protected'}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={injectSimulatedBubble}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="size-4" />
                  <span>Simulate Bubble Influx</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. VIRTUAL LAB SLIDE-OUT DECK DRAWER                      */}
      {/* ========================================================= */}
      {virtualLabDrawerOpen && setVirtualLabDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:bg-transparent"
          onClick={() => setVirtualLabDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 bottom-0 w-full sm:w-[500px] bg-[#090e1a]/95 backdrop-blur-xl border-r border-purple-500/30 p-6 flex flex-col shadow-2xl text-slate-100 z-50 overflow-y-auto animate-in slide-in-from-left duration-300"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <FlaskConical className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide text-white">VIRTUAL LAB SIMULATION DECK</h3>
                  <div className="text-[11px] text-purple-300">In-Silico Organ-on-Chip Experimentation</div>
                </div>
              </div>
              <button
                onClick={() => setVirtualLabDrawerOpen(false)}
                className="size-8 rounded-lg border border-white/10 hover:border-purple-400/40 hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl my-4">
              <button
                onClick={() => setVlTab('CONFIG')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                  vlTab === 'CONFIG' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Organ & Params
              </button>
              <button
                onClick={() => setVlTab('CHARTS')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                  vlTab === 'CHARTS' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Waveforms
              </button>
              <button
                onClick={() => setVlTab('RESULTS')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                  vlTab === 'RESULTS' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                ML Gateway
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {vlTab === 'CONFIG' && (
                <>
                  <OrganSelector
                    organs={organs}
                    selected={virtualLabOrgan}
                    onSelect={setVirtualLabOrgan}
                  />
                  <div className="pt-2">
                    <ParameterPanel
                      parameters={params}
                      values={virtualLabParams}
                      onChange={setVirtualLabParam}
                      onRun={isSimulating ? pauseSimulation : startSimulation}
                      onQueryML={handleQueryML}
                      isRunning={isSimulating}
                      mlQuerying={mlQuerying}
                    />
                  </div>
                </>
              )}

              {vlTab === 'CHARTS' && (
                <div className="pt-2">
                  <SimulationCharts data={chartData} />
                </div>
              )}

              {vlTab === 'RESULTS' && (
                <div className="pt-2">
                  <ResultsPanel
                    organ={virtualLabOrgan}
                    simState={null}
                    elapsed={virtualLabElapsed}
                    bubbleCount={simulatedBubbleActive ? 1 : 0}
                    mlStatus={mlStatus}
                    mlResult={mlResult}
                    mlQuerying={mlQuerying}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
