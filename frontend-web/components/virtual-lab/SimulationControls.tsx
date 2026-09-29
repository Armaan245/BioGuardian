'use client';

import type { SimulationStatus } from '@/lib/virtual-lab/types';

interface Props {
  status: SimulationStatus;
  elapsed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onBubble: () => void;
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const STATUS_STYLE: Record<SimulationStatus, string> = {
  idle:   'bg-slate-800 text-slate-500',
  running:'bg-teal-900/60 text-teal-300 border border-teal-700/40',
  paused: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
  bubble: 'bg-red-900/40 text-red-300 border border-red-700/40 animate-pulse',
};

const STATUS_DOT: Record<SimulationStatus, string> = {
  idle:   'bg-slate-600',
  running:'bg-teal-400 animate-pulse',
  paused: 'bg-amber-400',
  bubble: 'bg-red-400',
};

export default function SimulationControls({ status, elapsed, onPlay, onPause, onReset, onBubble }: Props) {
  const isRunning = status === 'running' || status === 'bubble';

  return (
    <div className="flex items-center gap-3 flex-wrap">

      {/* Status + clock */}
      <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>
        <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} />
        {status === 'bubble' ? 'BUBBLE EVENT' : status.toUpperCase()}
      </div>
      <span className="font-mono text-sm text-slate-400 tabular-nums">{fmtTime(elapsed)}</span>

      <div className="ml-auto flex items-center gap-2">
        {/* Play / Pause */}
        {isRunning ? (
          <button onClick={onPause}
            className="flex items-center gap-1.5 rounded-lg border border-amber-600/30 bg-amber-900/20 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-900/40 transition">
            ⏸ Pause
          </button>
        ) : (
          <button onClick={onPlay}
            className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-400 transition shadow-[0_0_12px_rgba(20,184,166,0.3)]">
            ▶ Run
          </button>
        )}

        {/* Reset */}
        <button onClick={onReset}
          className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:border-slate-600 hover:text-slate-200 transition">
          ↻ Reset
        </button>

        {/* Bubble */}
        <button onClick={onBubble}
          className="flex items-center gap-2 rounded-lg border border-red-700/30 bg-red-900/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/30 transition">
          🫧 Inject Bubble
          <span className="rounded bg-red-900/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-500">SIMULATED</span>
        </button>
      </div>
    </div>
  );
}
