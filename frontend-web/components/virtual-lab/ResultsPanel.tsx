'use client';

/**
 * BioGuardian Virtual Lab - Results & External ML Prediction Panel
 * Displays physical simulation metrics summary and handles external ML connectivity.
 * ZERO fake ML policy strictly enforced.
 */

import React from 'react';
import type { SimulationState, MLPredictResponse, MLStatus } from '@/lib/virtual-lab/types';
import { Cpu, FileText, CheckCircle2, XCircle, AlertCircle, Clock, Droplets, Gauge, Activity, ShieldCheck } from 'lucide-react';

interface Props {
  organ: string;
  simState: SimulationState | null;
  elapsed: number;
  bubbleCount: number;
  mlStatus: MLStatus | null;
  mlResult: MLPredictResponse | null;
  mlQuerying: boolean;
}

function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ResultsPanel({
  organ,
  simState,
  elapsed,
  bubbleCount,
  mlStatus,
  mlResult,
  mlQuerying,
}: Props) {
  const isMlConnected = mlStatus?.connected ?? false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. In-Silico Experiment Summary Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              In-Silico Experiment Summary
            </span>
          </div>
          <span className="rounded-full bg-teal-950/80 border border-teal-800/60 px-2 py-0.5 text-[9px] font-mono text-teal-300">
            SIMULATED RUN
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-2.5">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Organ Cartridge</span>
            <strong className="text-sm font-semibold text-slate-200 capitalize">{organ}-on-a-Chip</strong>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-2.5">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Simulated Duration</span>
            <strong className="text-sm font-semibold font-mono text-slate-200">{formatClock(elapsed)}</strong>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-2.5">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Operating Flow Rate</span>
            <strong className="text-sm font-semibold font-mono text-teal-300">
              {simState ? `${simState.flow_rate.toFixed(0)} µL/min` : '450 µL/min (Nominal)'}
            </strong>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-2.5">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Channel Pressure</span>
            <strong className="text-sm font-semibold font-mono text-purple-300">
              {simState ? `${simState.pressure.toFixed(1)} mbar` : '1021.4 mbar (Nominal)'}
            </strong>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-2.5">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Physiological pH</span>
            <strong className="text-sm font-semibold font-mono text-emerald-300">
              {simState ? simState.ph.toFixed(2) : '7.40 pH'}
            </strong>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-2.5">
            <span className="text-[10px] text-slate-500 block uppercase font-mono">Simulated Bubble Spikes</span>
            <strong className={`text-sm font-semibold font-mono ${bubbleCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {bubbleCount} {bubbleCount === 1 ? 'event' : 'events'}
            </strong>
          </div>
        </div>

        <p className="mt-3 text-[10px] font-mono text-slate-500">
          All values derived from in-silico fluid dynamic model. Zero patient or physical hardware data.
        </p>
      </div>

      {/* 2. External ML Prediction Gateway Card (Strict Zero-Fake-ML) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Machine Learning Prediction Service
              </span>
            </div>
            <span className="rounded-full bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 text-[9px] font-mono text-purple-300">
              EXTERNAL ADAPTER
            </span>
          </div>

          {/* Connection Status Banner */}
          <div
            className={`rounded-xl border p-3 mb-3 flex items-start gap-3 ${
              isMlConnected
                ? 'bg-teal-950/30 border-teal-500/40 text-teal-200'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
            }`}
          >
            {isMlConnected ? (
              <CheckCircle2 className="size-5 text-teal-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="size-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {isMlConnected ? 'ML Service Connected' : 'ML Prediction Service: Not Connected'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isMlConnected
                  ? 'External biological model is online. Predictions will be generated by the connected model.'
                  : 'Connect the ML model API to generate predictions. No fake toxicity, cell viability, or biological scores will be simulated.'}
              </p>
            </div>
          </div>

          {/* Active Model Response / Details */}
          {mlQuerying && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/30 p-3 text-center animate-pulse">
              <div className="text-xs font-semibold text-purple-300">
                Contacting External ML Endpoint…
              </div>
              <div className="text-[10px] text-purple-400 font-mono mt-1">
                Forwarding experiment parameters to ML_SERVICE_URL
              </div>
            </div>
          )}

          {mlResult && mlResult.available && mlResult.prediction !== undefined && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Model Output (Real ML Service):
              </span>
              <pre className="text-xs font-mono text-teal-300 overflow-x-auto p-2 bg-slate-950 rounded-lg">
                {JSON.stringify(mlResult.prediction, null, 2)}
              </pre>
            </div>
          )}

          {mlResult && !mlResult.available && !mlQuerying && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[11px] font-mono text-slate-400">
              <span className="text-slate-300 font-semibold block mb-0.5">Gateway Status:</span>
              <span>{mlResult.message || 'ML service unconfigured. Set ML_SERVICE_URL in your .env file.'}</span>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <ShieldCheck className="size-3.5 text-teal-400 shrink-0" />
          <span>Strict Zero-Fake-ML Guarantee: Biological outputs are never fabricated.</span>
        </div>
      </div>
    </div>
  );
}
