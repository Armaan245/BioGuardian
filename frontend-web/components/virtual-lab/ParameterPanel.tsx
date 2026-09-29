'use client';

import type { ParameterSchema, ParameterValues } from '@/lib/virtual-lab/types';

interface Props {
  parameters: ParameterSchema[];
  values: ParameterValues;
  onChange: (id: string, value: number) => void;
  onRun: () => void;
  onQueryML: () => void;
  isRunning: boolean;
  mlQuerying: boolean;
}

export default function ParameterPanel({
  parameters, values, onChange, onRun, onQueryML, isRunning, mlQuerying,
}: Props) {
  return (
    <div className="space-y-4">
      {parameters.map((p) => {
        const val = values[p.id] ?? p.default ?? 0;
        const min = p.min ?? 0;
        const max = p.max ?? 100;
        const pct = Math.round(((val - min) / (max - min)) * 100);
        const isFloat = !Number.isInteger(p.default) || String(p.default).includes('.');
        return (
          <div key={p.id}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="text-[11px] font-medium text-slate-400">{p.label}</label>
              <span className="font-mono text-xs font-semibold text-teal-300">
                {isFloat ? (val as number).toFixed(1) : Math.round(val as number)}
                {p.unit ? <span className="ml-0.5 text-[9px] text-slate-500">{p.unit}</span> : null}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={min}
                max={max}
                step={(max - min) / 200}
                value={val}
                onChange={(e) => onChange(p.id, parseFloat(e.target.value))}
                className="w-full cursor-pointer accent-teal-400"
                style={{ height: '4px' }}
              />
              <div className="mt-0.5 flex justify-between text-[9px] text-slate-700">
                <span>{min}{p.unit ? ` ${p.unit}` : ''}</span>
                <span>{max}{p.unit ? ` ${p.unit}` : ''}</span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="space-y-2 pt-2">
        <button
          onClick={onRun}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
            isRunning
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-teal-500 text-white hover:bg-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.25)]'
          }`}
        >
          {isRunning ? '⏸  Pause Simulation' : '▶  Run Simulation'}
        </button>
        <button
          onClick={onQueryML}
          disabled={mlQuerying}
          className="w-full rounded-xl border border-purple-700/40 py-2 text-xs font-semibold text-purple-300 transition hover:border-purple-500/50 hover:bg-purple-900/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mlQuerying ? '⏳  Querying ML…' : '🤖  Query ML Model'}
        </button>
      </div>
    </div>
  );
}
