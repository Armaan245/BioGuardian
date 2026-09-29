'use client';

import type { SimulationState, MLPredictResponse, MLStatus } from '@/lib/virtual-lab/types';

interface Props {
  organ: string;
  simState: SimulationState | null;
  elapsed: number;
  bubbleCount: number;
  mlStatus: MLStatus | null;
  mlResult: MLPredictResponse | null;
  mlQuerying: boolean;
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const ORGAN_LABELS: Record<string, string> = {
  lung: 'Lung-on-a-Chip', heart: 'Heart-on-a-Chip', liver: 'Liver-on-a-Chip',
  kidney: 'Kidney-on-a-Chip', gut: 'Gut-on-a-Chip', brain: 'Brain-on-a-Chip',
};

interface MetricProps { label: string; value: string; alert?: boolean; mono?: boolean; }
function Metric({ label, value, alert, mono }: MetricProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-semibold ${mono ? 'font-mono' : ''} ${alert ? 'text-red-400' : 'text-slate-100'}`}>
        {value}
      </span>
    </div>
  );
}

export default function ResultsPanel({ organ, simState, elapsed, bubbleCount, mlStatus, mlResult, mlQuerying }: Props) {
  return (
    <div className="space-y-5">

      {/* Simulation summary */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">Simulation Summary</span>
          </div>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">IN-SILICO</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2">
          <Metric label="Organ Model" value={ORGAN_LABELS[organ] ?? organ} />
          <Metric label="Elapsed" value={fmtTime(elapsed)} mono />
          {simState ? (
            <>
              <Metric label="Flow Rate"       value={`${simState.flow_rate.toFixed(0)} µL/min`} mono />
              <Metric label="Pressure"        value={`${simState.pressure.toFixed(1)} mbar`} mono />
              <Metric label="pH"              value={simState.ph.toFixed(2)} mono />
              <Metric label="Dissolved O₂"    value={`${simState.oxygen.toFixed(1)} mg/L`} mono />
              <Metric label="Temperature"     value={`${simState.temperature.toFixed(1)} °C`} mono />
              <Metric label="Bubble Events"   value={`${bubbleCount} (simulated)`} alert={bubbleCount > 0} mono />
            </>
          ) : (
            <p className="py-6 text-center text-xs text-slate-700">Run the simulation to see results.</p>
          )}
        </div>
      </div>

      {/* ML Prediction */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-purple-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400">ML Prediction</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          {/* Connection status row */}
          <div className="mb-3 flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${mlStatus?.connected ? 'bg-teal-400' : 'bg-red-500/70'}`} />
            <span className="text-sm font-semibold text-slate-200">
              {mlStatus?.connected ? 'Service Connected' : 'Not Connected'}
            </span>
          </div>

          {!mlStatus?.connected && (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs font-semibold text-red-400 mb-1">ML Prediction Service: Not Connected</p>
              <p className="text-[11px] leading-5 text-slate-500">
                {mlStatus?.message ?? 'ML_SERVICE_URL not configured.'}
              </p>
              <p className="mt-2 text-[11px] text-slate-600">
                Connect the ML model API to generate predictions.
              </p>
            </div>
          )}

          {mlQuerying && (
            <div className="mt-2 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs text-purple-400">Querying ML model…</span>
            </div>
          )}

          {mlResult && !mlResult.available && !mlQuerying && (
            <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-[11px] text-slate-500">{mlResult.message}</p>
            </div>
          )}

          {mlResult?.available && mlResult.prediction !== undefined && (
            <div className="mt-2 rounded-lg border border-purple-800/30 bg-purple-900/10 p-3">
              <p className="mb-2 text-xs font-semibold text-purple-300">ML Response:</p>
              <pre className="text-[11px] text-slate-300 whitespace-pre-wrap break-all leading-5">
                {JSON.stringify(mlResult.prediction, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
