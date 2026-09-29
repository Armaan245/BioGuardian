'use client';

/**
 * BioGuardian Virtual Lab - Simulation Controls
 * Real-time operational controller bar with status indicators, elapsed timer,
 * and bubble event injection.
 */

import React from 'react';
import type { SimulationStatus } from '@/lib/virtual-lab/types';
import { Play, Pause, RotateCcw, AlertTriangle, Radio, Clock, Sparkles } from 'lucide-react';

interface Props {
  status: SimulationStatus;
  elapsed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onBubble: () => void;
}

function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function SimulationControls({
  status,
  elapsed,
  onPlay,
  onPause,
  onReset,
  onBubble,
}: Props) {
  const isRunning = status === 'running' || status === 'bubble';
  const isBubble = status === 'bubble';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      {/* 1. Left Status Pill & High-Precision Timer */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-all ${
            isBubble
              ? 'bg-rose-950/80 border-rose-500/70 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
              : isRunning
              ? 'bg-teal-950/70 border-teal-500/50 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
              : status === 'paused'
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              isBubble
                ? 'bg-rose-400 animate-ping'
                : isRunning
                ? 'bg-teal-400 animate-pulse'
                : status === 'paused'
                ? 'bg-amber-400'
                : 'bg-slate-500'
            }`}
          />
          <span>
            {isBubble ? 'BUBBLE DETECTED' : isRunning ? 'SIMULATION RUNNING' : status === 'paused' ? 'PAUSED' : 'STANDBY IDLE'}
          </span>
        </div>

        {/* Elapsed Timer Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 font-mono text-xs">
          <Clock className="size-3.5 text-slate-500" />
          <span className="font-semibold text-slate-200">{formatClock(elapsed)}</span>
          <span className="text-[10px] text-slate-500">elapsed</span>
        </div>
      </div>

      {/* 2. Right Action Controls */}
      <div className="flex items-center gap-2">
        {/* Play / Pause Toggle */}
        {isRunning ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 text-xs font-semibold transition"
          >
            <Pause className="size-3.5" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-teal-950/30"
          >
            <Play className="size-3.5 fill-current" />
            <span>Run</span>
          </button>
        )}

        {/* Reset Experiment */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs font-semibold transition"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset</span>
        </button>

        {/* The Core Biomedical Action: Inject Simulated Bubble */}
        <button
          onClick={onBubble}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition shadow-lg ${
            isBubble
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-rose-950/50'
              : 'border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 hover:border-rose-400'
          }`}
        >
          <AlertTriangle className="size-3.5 text-rose-400" />
          <span>Simulate Bubble</span>
          <span className="rounded bg-rose-900/80 border border-rose-700/50 px-1.5 py-0.2 text-[9px] font-mono text-rose-300">
            SIMULATED
          </span>
        </button>
      </div>
    </div>
  );
}
