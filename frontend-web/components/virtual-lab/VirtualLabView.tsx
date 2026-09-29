'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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

import OrganSelector from './OrganSelector';
import ParameterPanel from './ParameterPanel';
import SimulationControls from './SimulationControls';
import VirtualLabCanvas from './VirtualLabCanvas';
import SimulationCharts from './SimulationCharts';
import ResultsPanel from './ResultsPanel';

const CHART_MAX = 120;

export default function VirtualLabView() {
  const [organs, setOrgans] = useState<OrganProfile[]>([]);
  const [selectedOrgan, setSelectedOrgan] = useState('lung');
  const [params, setParams] = useState<ParameterSchema[]>([]);
  const [values, setValues] = useState<ParameterValues>({});
  const [simStatus, setSimStatus] = useState<SimulationStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [chartData, setChartData] = useState<SimDataPoint[]>([]);
  const [bubbleActive, setBubbleActive] = useState(false);
  const [bubblePos, setBubblePos] = useState(0);
  const [bubbleCount, setBubbleCount] = useState(0);
  const [mlStatus, setMLStatus] = useState<MLStatus | null>(null);
  const [mlResult, setMLResult] = useState<MLPredictResponse | null>(null);
  const [mlQuerying, setMLQuerying] = useState(false);
  // Tab state for bottom panels
  const [activeTab, setActiveTab] = useState<'charts' | 'results'>('charts');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bubbleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

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
    { id: 'flow_rate',          label: 'Flow Rate',          unit: 'µL/min',min: 50,  max: 1000, default: 450 },
    { id: 'ph',                 label: 'pH',                 unit: '',      min: 6.5, max: 8.0,  default: 7.4 },
    { id: 'oxygen',             label: 'Dissolved O₂',       unit: 'mg/L',  min: 0.5, max: 12,   default: 6.5 },
    { id: 'temperature',        label: 'Temperature',        unit: '°C',    min: 30,  max: 42,   default: 37  },
  ];

  useEffect(() => {
    fetchOrgans().then(setOrgans).catch(() => setOrgans(FALLBACK_ORGANS));
    fetchMLStatus().then(setMLStatus).catch(() =>
      setMLStatus({ connected: false, status: 'not_configured', message: 'ML_SERVICE_URL not configured.' })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleReset();
    fetchOrganParameters(selectedOrgan)
      .then((res) => {
        setParams(res.parameters);
        const d: ParameterValues = {};
        res.parameters.forEach((p) => { if (p.default !== undefined) d[p.id] = p.default; });
        setValues(d);
      })
      .catch(() => {
        setParams(FALLBACK_PARAMS);
        const d: ParameterValues = {};
        FALLBACK_PARAMS.forEach((p) => { if (p.default !== undefined) d[p.id] = p.default; });
        setValues(d);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrgan]);

  const stopTick = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTick = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(async () => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      try {
        const res = await runSimulation(selectedOrgan, values);
        const ss = res.simulation_state;
        setSimState(ss);
        setChartData((prev) => {
          const next = [...prev, { t: elapsedRef.current, flow_rate: ss.flow_rate, pressure: ss.pressure, ph: ss.ph, oxygen: ss.oxygen, bubble_position: ss.bubble_position }];
          return next.length > CHART_MAX ? next.slice(-CHART_MAX) : next;
        });
      } catch {
        const fr = values.flow_rate ?? 450;
        setChartData((prev) => {
          const next = [...prev, {
            t: elapsedRef.current,
            flow_rate: fr + (Math.random() - 0.5) * 8,
            pressure: fr * 2.27 + (Math.random() - 0.5) * 3,
            ph: (values.ph ?? 7.4) + (Math.random() - 0.5) * 0.04,
            oxygen: (values.oxygen ?? 6.5) + (Math.random() - 0.5) * 0.1,
            bubble_position: 0,
          }];
          return next.length > CHART_MAX ? next.slice(-CHART_MAX) : next;
        });
      }
    }, 1000);
  }, [selectedOrgan, values]);

  const handlePlay = () => { setSimStatus('running'); startTick(); };
  const handlePause = () => { setSimStatus('paused'); stopTick(); };
  const handleReset = useCallback(() => {
    stopTick();
    if (bubbleRef.current) { clearInterval(bubbleRef.current); bubbleRef.current = null; }
    setSimStatus('idle'); setElapsed(0); elapsedRef.current = 0;
    setSimState(null); setChartData([]); setBubbleActive(false); setBubblePos(0); setBubbleCount(0); setMLResult(null);
  }, [stopTick]);

  const handleBubble = () => {
    if (simStatus === 'idle') { setSimStatus('running'); startTick(); }
    setBubbleActive(true); setBubblePos(0); setBubbleCount((c) => c + 1); setSimStatus('bubble');
    let pos = 0;
    if (bubbleRef.current) clearInterval(bubbleRef.current);
    bubbleRef.current = setInterval(() => {
      pos += 0.025;
      setBubblePos(pos);
      if (pos >= 1) {
        clearInterval(bubbleRef.current!); bubbleRef.current = null;
        setBubbleActive(false); setBubblePos(0);
        setSimStatus(timerRef.current ? 'running' : 'idle');
      }
    }, 80);
  };

  const handleQueryML = async () => {
    setMLQuerying(true);
    try {
      const res = await queryMLPredict(selectedOrgan, values);
      setMLResult(res);
      const st = await fetchMLStatus();
      setMLStatus(st);
    } catch {
      setMLResult({ available: false, message: 'Could not reach backend.' });
    } finally { setMLQuerying(false); }
  };

  useEffect(() => () => { stopTick(); if (bubbleRef.current) clearInterval(bubbleRef.current); }, [stopTick]);

  const isRunning = simStatus === 'running' || simStatus === 'bubble';

  return (
    <div className="flex h-screen flex-col bg-[#060c14] text-slate-100 overflow-hidden">

      {/* ── TOP HEADER ─────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-purple-600/20 border border-purple-500/30">
              <svg className="size-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 3h6v11l3.5 5.5a1 1 0 01-.85 1.5H6.35a1 1 0 01-.85-1.5L9 14V3z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-100">Virtual Lab</span>
            <span className="rounded-full border border-purple-500/40 bg-purple-900/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-purple-300">
              SIMULATION
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-500">In-silico Organ-on-Chip environment</span>
        </div>
        <a
          href="/dashboard/twin"
          className="flex items-center gap-2 rounded-xl border border-teal-700/40 bg-teal-900/20 px-3 py-1.5 text-xs font-semibold text-teal-300 transition hover:bg-teal-900/40"
        >
          Live Digital Twin
          <span className="rounded-sm bg-teal-900/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-400">REAL DEVICE</span>
        </a>
      </header>

      {/* ── MAIN BODY ──────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
        <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-800 bg-slate-900/50 p-4">

          {/* Organ selector */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-teal-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">Organ Model</span>
            </div>
            <OrganSelector organs={organs.length ? organs : FALLBACK_ORGANS} selected={selectedOrgan} onSelect={setSelectedOrgan} />
          </section>

          {/* Parameters */}
          <section className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-purple-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400">Parameters</span>
            </div>
            <ParameterPanel
              parameters={params.length ? params : FALLBACK_PARAMS}
              values={values}
              onChange={(id, val) => setValues((v) => ({ ...v, [id]: val }))}
              onRun={isRunning ? handlePause : handlePlay}
              onQueryML={handleQueryML}
              isRunning={isRunning}
              mlQuerying={mlQuerying}
            />
          </section>
        </aside>

        {/* ── CENTRE ───────────────────────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-4">

          {/* Controls bar */}
          <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-3">
            <SimulationControls
              status={simStatus}
              elapsed={elapsed}
              onPlay={handlePlay}
              onPause={handlePause}
              onReset={handleReset}
              onBubble={handleBubble}
            />
          </div>

          {/* 3-D Canvas */}
          <div className="shrink-0">
            <VirtualLabCanvas
              organId={selectedOrgan}
              status={simStatus}
              flowRate={values.flow_rate ?? 450}
              bubblePosition={bubblePos}
              bubbleActive={bubbleActive}
            />
          </div>

          {/* Tab bar */}
          <div className="flex shrink-0 gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            {(['charts', 'results'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition ${
                  activeTab === tab
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'charts' ? '📊 Live Trajectories' : '📋 Results & ML'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-0 flex-1">
            {activeTab === 'charts' ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <SimulationCharts data={chartData} />
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <ResultsPanel
                  organ={selectedOrgan}
                  simState={simState}
                  elapsed={elapsed}
                  bubbleCount={bubbleCount}
                  mlStatus={mlStatus}
                  mlResult={mlResult}
                  mlQuerying={mlQuerying}
                />
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
