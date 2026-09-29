'use client';

/**
 * BioGuardian Virtual Lab - Standard In-Silico Simulation Studio
 *
 * Professional Laboratory Layout:
 * - Top Header: Virtual Lab title & quick link to Live Digital Twin
 * - Left Control Deck:
 *     * Organ Cartridge Selector (Lung, Heart, Liver, Kidney, Gut, Brain with precision SVG glyphs)
 *     * In-Silico Parameter Panel (Sliders for Drug Conc, Flow Rate, Exposure Duration, pH, dO2, Temp)
 * - Center/Right Simulation Deck:
 *     * Simulation Controls (Play, Pause, Reset, Inject Bubble Anomaly, Elapsed Timer)
 *     * High-Fidelity 3D Microfluidic Viewport (CAD 3-Layer Y-Junction Chip, Reservoirs, Untouched OoC)
 *     * Bottom Drawers: Real-Time Waveform Charts & External ML Gateway (Zero Fake ML)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type {
  OrganProfile,
  ParameterSchema,
  SimulationState,
  MLStatus,
  MLPredictResponse,
  SimDataPoint,
  SimulationStatus,
  ParameterValues,
} from '@/lib/virtual-lab/types';
import {
  fetchOrgans,
  fetchOrganParameters,
  runSimulation,
  fetchMLStatus,
  queryMLPredict,
} from '@/lib/virtual-lab/api';

import VirtualLabCanvas from './VirtualLabCanvas';
import OrganSelector from './OrganSelector';
import ParameterPanel from './ParameterPanel';
import SimulationControls from './SimulationControls';
import SimulationCharts from './SimulationCharts';
import ResultsPanel from './ResultsPanel';
import { FlaskConical, ArrowLeft, Radio, Activity, Cpu, Sparkles } from 'lucide-react';
import Link from 'next/link';

const CHART_HISTORY_MAX = 80;

const FALLBACK_ORGANS: OrganProfile[] = [
  { id: 'lung',   name: 'Lung-on-a-Chip',   status: 'prototype' },
  { id: 'heart',  name: 'Heart-on-a-Chip',  status: 'prototype' },
  { id: 'liver',  name: 'Liver-on-a-Chip',  status: 'prototype' },
  { id: 'kidney', name: 'Kidney-on-a-Chip', status: 'prototype' },
  { id: 'gut',    name: 'Gut-on-a-Chip',    status: 'prototype' },
  { id: 'brain',  name: 'Brain-on-a-Chip',  status: 'prototype' },
];

const FALLBACK_PARAMS: ParameterSchema[] = [
  { id: 'drug_concentration', label: 'Drug Concentration', unit: 'µM',    min: 0,   max: 500,  default: 50  },
  { id: 'exposure_duration',  label: 'Exposure Duration',  unit: 'hours', min: 1,   max: 72,   default: 24  },
  { id: 'flow_rate',          label: 'Microfluidic Flow Rate', unit: 'µL/min',min: 50,  max: 1000, default: 450 },
  { id: 'ph',                 label: 'Physiological pH',   unit: 'pH',    min: 6.5, max: 8.0,  default: 7.4 },
  { id: 'oxygen',             label: 'Dissolved Oxygen',   unit: 'mg/L',  min: 0.5, max: 12,   default: 6.5 },
  { id: 'temperature',        label: 'Medium Temperature', unit: '°C',    min: 30,  max: 42,   default: 37  },
];

export default function VirtualLabView() {
  const [organs, setOrgans] = useState<OrganProfile[]>(FALLBACK_ORGANS);
  const [selectedOrgan, setSelectedOrgan] = useState<string>('lung');
  const [params, setParams] = useState<ParameterSchema[]>(FALLBACK_PARAMS);
  const [values, setValues] = useState<ParameterValues>({
    drug_concentration: 50,
    exposure_duration: 24,
    flow_rate: 450,
    ph: 7.4,
    oxygen: 6.5,
    temperature: 37,
  });

  const [simStatus, setSimStatus] = useState<SimulationStatus>('idle');
  const [elapsed, setElapsed] = useState<number>(0);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [chartData, setChartData] = useState<SimDataPoint[]>([]);
  const [bubbleActive, setBubbleActive] = useState<boolean>(false);
  const [bubblePos, setBubblePos] = useState<number>(0);
  const [bubbleCount, setBubbleCount] = useState<number>(0);

  const [mlStatus, setMLStatus] = useState<MLStatus | null>(null);
  const [mlResult, setMLResult] = useState<MLPredictResponse | null>(null);
  const [mlQuerying, setMLQuerying] = useState<boolean>(false);

  const [bottomTab, setBottomTab] = useState<'TELEMETRY' | 'RESULTS'>('TELEMETRY');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bubbleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load organ profiles
  useEffect(() => {
    fetchOrgans().then((res) => {
      if (res && res.length > 0) setOrgans(res);
    });
    fetchMLStatus().then((res) => {
      if (res) setMLStatus(res);
    });
  }, []);

  // Load parameters for selected organ
  useEffect(() => {
    fetchOrganParameters(selectedOrgan).then((res) => {
      if (res && res.parameters && res.parameters.length > 0) {
        setParams(res.parameters);
        const defaults: ParameterValues = {};
        for (const p of res.parameters) {
          defaults[p.id] = p.default ?? (p.min ?? 0);
        }
        setValues((prev) => ({ ...defaults, ...prev }));
      }
    });
  }, [selectedOrgan]);

  // Simulation tick loop
  const startTick = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;

        setValues((currValues) => {
          const flow = currValues.flow_rate ?? 450;
          const ph = currValues.ph ?? 7.4;
          const o2 = currValues.oxygen ?? 6.5;

          const noise = (Math.random() - 0.5) * 1.5;
          const calcPressure = flow * 2.27 + noise;

          const pt: SimDataPoint = {
            t: next,
            flow_rate: Math.max(0, flow + (Math.random() - 0.5) * 4),
            pressure: Math.round(calcPressure * 10) / 10,
            ph: Math.round((ph + (Math.random() - 0.5) * 0.03) * 100) / 100,
            oxygen: Math.round((o2 + (Math.random() - 0.5) * 0.05) * 100) / 100,
            bubble_prob: 0.01,
          };

          setChartData((history) => {
            const updated = [...history, pt];
            return updated.length > CHART_HISTORY_MAX
              ? updated.slice(updated.length - CHART_HISTORY_MAX)
              : updated;
          });

          return currValues;
        });

        return next;
      });
    }, 1000);
  }, []);

  const stopTick = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Play / Run simulation
  const handlePlay = async () => {
    setSimStatus('running');
    startTick();

    try {
      const resp = await runSimulation(selectedOrgan, values);
      if (resp && resp.simulation_state) {
        setSimState(resp.simulation_state);
      }
    } catch {
      // Backend simulation fallback handled
    }
  };

  const handlePause = () => {
    setSimStatus('paused');
    stopTick();
  };

  const handleReset = () => {
    stopTick();
    setSimStatus('idle');
    setElapsed(0);
    setChartData([]);
    setBubbleActive(false);
    setBubblePos(0);
    setSimState(null);
  };

  // Inject bubble anomaly
  const handleBubble = () => {
    setBubbleActive(true);
    setBubblePos(0.05);
    setBubbleCount((c) => c + 1);
    setSimStatus('bubble');

    let step = 0.05;
    const interval = setInterval(() => {
      step += 0.035;
      setBubblePos(step);
      if (step >= 0.95) {
        clearInterval(interval);
        setBubbleActive(false);
        setBubblePos(0);
        setSimStatus('running');
      }
    }, 120);
  };

  // Query External ML Gateway
  const handleQueryML = async () => {
    setMLQuerying(true);
    setBottomTab('RESULTS');
    try {
      const resp = await queryMLPredict(selectedOrgan, values);
      setMLResult(resp);
    } catch {
      setMLResult({
        available: false,
        message: 'Could not connect to FastAPI gateway or external ML service.',
      });
    } finally {
      setMLQuerying(false);
    }
  };

  useEffect(() => {
    return () => {
      stopTick();
      if (bubbleRef.current) clearInterval(bubbleRef.current);
    };
  }, [stopTick]);

  const isRunning = simStatus === 'running' || simStatus === 'bubble';

  return (
    <div className="flex flex-col min-h-screen bg-[#060a12] text-slate-100">
      {/* 1. TOP APP BAR */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800/90 bg-slate-950/85 px-4 lg:px-8 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 shadow-lg shadow-purple-950/40">
              <FlaskConical className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-slate-100">
                  Virtual Lab
                </span>
                <span className="rounded-full bg-purple-950/90 border border-purple-500/40 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-purple-300">
                  SIMULATOR STUDIO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden md:block">
                Autonomous Life Support · In-Silico Organ-on-Chip Prototyping
              </p>
            </div>
          </div>
        </div>

        {/* Quick link to Real Physical Digital Twin */}
        <Link
          href="/dashboard/twin"
          className="flex items-center gap-2 rounded-xl border border-teal-800/50 bg-teal-950/40 px-3.5 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-900/40 hover:border-teal-600 transition shadow-sm"
        >
          <Radio className="size-3.5 text-teal-400 animate-pulse" />
          <span>Live Digital Twin</span>
          <span className="rounded bg-teal-900/80 px-1.5 py-0.5 text-[9px] font-mono font-bold text-teal-300 uppercase">
            REAL ESP32
          </span>
        </Link>
      </header>

      {/* 2. MAIN LABORATORY WORKSPACE */}
      <div className="flex-1 p-3 lg:p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT CONTROL DECK (4 Cols on LG) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Organ Cartridge Selector */}
            <div className="rounded-3xl border border-slate-800/90 bg-slate-950/70 p-4 shadow-xl backdrop-blur-sm">
              <OrganSelector
                organs={organs}
                selected={selectedOrgan}
                onSelect={setSelectedOrgan}
              />
            </div>

            {/* In-Silico Parameter Deck */}
            <div className="rounded-3xl border border-slate-800/90 bg-slate-950/70 p-4 shadow-xl backdrop-blur-sm">
              <ParameterPanel
                parameters={params}
                values={values}
                onChange={(id, val) => setValues((v) => ({ ...v, [id]: val }))}
                onRun={isRunning ? handlePause : handlePlay}
                onQueryML={handleQueryML}
                isRunning={isRunning}
                mlQuerying={mlQuerying}
              />
            </div>
          </div>

          {/* RIGHT SIMULATION DECK (8 Cols on LG) */}
          <div className="lg:col-span-8 space-y-4">

            {/* Simulation Controller Action Bar */}
            <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-3 shadow-lg backdrop-blur-sm">
              <SimulationControls
                status={simStatus}
                elapsed={elapsed}
                onPlay={handlePlay}
                onPause={handlePause}
                onReset={handleReset}
                onBubble={handleBubble}
              />
            </div>

            {/* 3D Photorealistic Microfluidic Engine Viewport */}
            <VirtualLabCanvas
              organId={selectedOrgan}
              status={simStatus}
              flowRate={values.flow_rate ?? 450}
              bubblePosition={bubblePos}
              bubbleActive={bubbleActive}
            />

            {/* Bottom Telemetry & Results Drawer */}
            <div className="rounded-3xl border border-slate-800/90 bg-slate-950/70 p-4 shadow-xl backdrop-blur-sm">
              {/* Drawer Tab Switcher */}
              <div className="flex items-center gap-1.5 pb-3 border-b border-slate-800/80 mb-4">
                <button
                  onClick={() => setBottomTab('TELEMETRY')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    bottomTab === 'TELEMETRY'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="size-3.5 text-teal-400" />
                  <span>Real-Time Waveforms</span>
                </button>
                <button
                  onClick={() => setBottomTab('RESULTS')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    bottomTab === 'RESULTS'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="size-3.5 text-purple-400" />
                  <span>ML Gateway & Results</span>
                  {!mlStatus?.connected && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono text-slate-400">
                      Zero-Fake-ML
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Contents */}
              {bottomTab === 'TELEMETRY' ? (
                <SimulationCharts data={chartData} />
              ) : (
                <ResultsPanel
                  organ={selectedOrgan}
                  simState={simState}
                  elapsed={elapsed}
                  bubbleCount={bubbleCount}
                  mlStatus={mlStatus}
                  mlResult={mlResult}
                  mlQuerying={mlQuerying}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
