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

import { DigitalTwinCanvas } from '@/components/twin/DigitalTwinCanvas';
import { DigitalTwinZoomControl } from '@/components/twin/DigitalTwinZoomControl';
import { TelemetryProvider, useTelemetry } from '@/lib/telemetry/TelemetryContext';
import { CameraPreset } from '@/lib/telemetry/types';
import OrganSelector from './OrganSelector';
import ParameterPanel from './ParameterPanel';
import SimulationControls from './SimulationControls';
import SimulationCharts from './SimulationCharts';
import ResultsPanel from './ResultsPanel';
import { FlaskConical, ArrowLeft, Radio, Activity, Cpu, Sparkles, Camera } from 'lucide-react';
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

function VirtualLabViewContent() {
  const {
    telemetry,
    setTelemetry,
    cameraPreset,
    setCameraPreset,
    triggerBubbleSpot,
    clearBubbleSpot,
    setEnvironmentMode,
  } = useTelemetry();

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

  // Ensure environment mode is set to VIRTUAL_LAB
  useEffect(() => {
    setEnvironmentMode('VIRTUAL_LAB');
  }, [setEnvironmentMode]);

  // Synchronize parameter panel adjustments into real-time telemetry
  useEffect(() => {
    setTelemetry((prev) => ({
      ...prev,
      flow_rate: values.flow_rate ?? prev.flow_rate,
      ph: values.ph ?? prev.ph,
      temperature: values.temperature ?? prev.temperature,
      oxygen: values.oxygen ?? prev.oxygen,
      source: 'SIMULATION',
    }));
  }, [values.flow_rate, values.ph, values.temperature, values.oxygen, setTelemetry]);

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
    setTelemetry((prev) => ({
      ...prev,
      flow_rate: values.flow_rate ?? 450,
      source: 'SIMULATION',
    }));

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
    setTelemetry((prev) => ({
      ...prev,
      flow_rate: 0,
    }));
  };

  const handleReset = () => {
    stopTick();
    setSimStatus('idle');
    setElapsed(0);
    setChartData([]);
    setBubbleActive(false);
    setBubblePos(0);
    setSimState(null);
    clearBubbleSpot();
    setTelemetry((prev) => ({
      ...prev,
      flow_rate: values.flow_rate ?? 450,
      bubble_detected: false,
      bubble_probability: 0.01,
      source: 'SIMULATION',
    }));
  };

  // Inject bubble anomaly
  const handleBubble = () => {
    setBubbleActive(true);
    setBubblePos(0.05);
    setBubbleCount((c) => c + 1);
    setSimStatus('bubble');
    triggerBubbleSpot(true);
    setTelemetry((prev) => ({
      ...prev,
      bubble_detected: true,
      bubble_probability: 0.98,
    }));

    let step = 0.05;
    const interval = setInterval(() => {
      step += 0.035;
      setBubblePos(step);
      if (step >= 0.95) {
        clearInterval(interval);
        setBubbleActive(false);
        setBubblePos(0);
        setSimStatus('running');
        clearBubbleSpot();
        setTelemetry((prev) => ({
          ...prev,
          bubble_detected: false,
          bubble_probability: 0.01,
        }));
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
      <div className="flex-1 p-3 sm:p-4 lg:p-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">

          {/* LEFT CONTROL DECK (Responsive column sizing) */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-4">
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

          {/* RIGHT SIMULATION DECK (Expanded viewport width) */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-4">

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

            {/* 3D High-Fidelity Microfluidic Twin Engine Viewport */}
            <div className="relative w-full h-[520px] lg:h-[580px] xl:h-[640px] rounded-3xl overflow-hidden border border-slate-800/90 bg-[#0b1528] shadow-2xl">
              {/* Direct call to high-fidelity 3D Digital Twin Canvas */}
              <DigitalTwinCanvas />

              {/* Floating Viewport Overlay: Active Organ Tag */}
              <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2 z-20">
                <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                  <span className="size-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    {selectedOrgan?.toUpperCase() || 'ORGAN-ON-A-CHIP'}
                  </span>
                  <span className="text-[10px] font-mono text-teal-400 border border-teal-800/50 bg-teal-950/60 px-1.5 py-0.5 rounded">
                    {simStatus === 'paused' ? '0' : (values.flow_rate ?? 450)} µL/min
                  </span>
                </div>
              </div>

              {/* Floating Viewport Overlay: Camera Presets Bar */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 p-1.5 rounded-2xl shadow-xl flex items-center gap-1 z-20 pointer-events-auto">
                <div className="px-2 py-1 text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
                  <Camera className="size-3 text-teal-400" /> Views:
                </div>
                {(
                  [
                    ['FULL_SYSTEM', 'Full Rig'],
                    ['RESERVOIRS', 'Bottles'],
                    ['BUBBLE_TRAP', 'Y-Trap Chip'],
                    ['INLET_OBSERVATION', 'Camera'],
                    ['ORGAN_ON_CHIP', 'Organ Chip'],
                    ['SENSOR_MANIFOLD', 'Manifold'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCameraPreset(key as CameraPreset)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                      cameraPreset === key
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Floating Viewport Overlay: Precision Smooth Zoom Controller */}
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                <DigitalTwinZoomControl />
              </div>
            </div>

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

export default function VirtualLabView() {
  return (
    <TelemetryProvider initialEnvironmentMode="VIRTUAL_LAB">
      <VirtualLabViewContent />
    </TelemetryProvider>
  );
}
