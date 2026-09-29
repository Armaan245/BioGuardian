'use client';

/**
 * BioGuardian Virtual Lab - Parameter Panel
 * Professional scientific controls with high-contrast sliders, numeric direct readouts,
 * and a guaranteed non-overflowing sticky action footer.
 */

import React from 'react';
import type { ParameterSchema, ParameterValues } from '@/lib/virtual-lab/types';
import { Sliders, Play, Pause, Cpu, RotateCcw, Activity } from 'lucide-react';

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
  parameters,
  values,
  onChange,
  onRun,
  onQueryML,
  isRunning,
  mlQuerying,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3 shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sliders className="size-3.5 text-teal-400" /> In-Silico Parameters
        </span>
        <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-800/40">
          {parameters.length} Controls
        </span>
      </div>

      {/* Scrollable Sliders Container with nice styling */}
      <div className="space-y-3.5 pr-1 overflow-y-auto max-h-[380px] custom-scrollbar">
        {parameters.map((p) => {
          const val = values[p.id] ?? p.default ?? 0;
          const min = p.min ?? 0;
          const max = p.max ?? 100;
          const isDecimal = !Number.isInteger(p.default) || (p.step && p.step < 1);

          return (
            <div
              key={p.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 transition hover:border-slate-700/80"
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-slate-300">
                  {p.label}
                </label>
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 font-mono text-xs font-semibold text-teal-300">
                  <span>{isDecimal ? Number(val).toFixed(1) : Math.round(Number(val))}</span>
                  {p.unit && <span className="text-[9px] text-slate-500 font-normal">{p.unit}</span>}
                </div>
              </div>

              {/* High-visibility Slider Track */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={p.step ?? (max - min) / 200}
                  value={val}
                  onChange={(e) => onChange(p.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
                />
              </div>

              {/* Min & Max Labels */}
              <div className="flex justify-between items-center mt-1 text-[9px] font-mono text-slate-500">
                <span>{min}{p.unit ? ` ${p.unit}` : ''}</span>
                <span>{max}{p.unit ? ` ${p.unit}` : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dedicated Action Buttons (Prominent & Non-Overflowing) */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 shrink-0">
        <button
          onClick={onRun}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-lg ${
            isRunning
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 shadow-amber-950/20'
              : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-teal-950/40 hover:scale-[1.01]'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="size-4 animate-pulse" />
              <span>Pause In-Silico Run</span>
            </>
          ) : (
            <>
              <Play className="size-4 fill-current" />
              <span>Run Virtual Experiment</span>
            </>
          )}
        </button>

        <button
          onClick={onQueryML}
          disabled={mlQuerying}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-purple-500/40 bg-purple-950/30 text-xs font-semibold text-purple-300 hover:bg-purple-900/40 hover:border-purple-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Cpu className="size-3.5 text-purple-400" />
          <span>{mlQuerying ? 'Querying ML Service…' : 'Query ML Model Adapter'}</span>
        </button>
      </div>
    </div>
  );
}
