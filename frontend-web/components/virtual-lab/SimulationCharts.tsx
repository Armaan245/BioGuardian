'use client';

/**
 * BioGuardian Virtual Lab - Scientific Waveform Telemetry Charts
 * High-precision SVG waveforms for Flow Rate, Pressure, pH, Dissolved O2, and Bubble Probability.
 */

import React from 'react';
import type { SimDataPoint } from '@/lib/virtual-lab/types';
import { Activity, Droplets, Gauge, Thermometer, AlertCircle } from 'lucide-react';

interface Props {
  data: SimDataPoint[];
}

interface ChartConfig {
  key: keyof Omit<SimDataPoint, 't'>;
  label: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  nominal: number;
  decimals: number;
}

const CHARTS: ChartConfig[] = [
  {
    key: 'flow_rate',
    label: 'Microfluidic Flow Rate',
    unit: 'µL/min',
    color: '#00d2b4',
    icon: <Droplets className="size-3.5 text-teal-400" />,
    min: 0,
    max: 1000,
    nominal: 450,
    decimals: 0,
  },
  {
    key: 'pressure',
    label: 'Hydrostatic Pressure',
    unit: 'mbar',
    color: '#a855f7',
    icon: <Gauge className="size-3.5 text-purple-400" />,
    min: 980,
    max: 1100,
    nominal: 1021,
    decimals: 1,
  },
  {
    key: 'ph',
    label: 'Physiological pH',
    unit: 'pH',
    color: '#10b981',
    icon: <Activity className="size-3.5 text-emerald-400" />,
    min: 6.8,
    max: 8.0,
    nominal: 7.4,
    decimals: 2,
  },
  {
    key: 'oxygen',
    label: 'Dissolved Oxygen (pO₂)',
    unit: 'mg/L',
    color: '#38bdf8',
    icon: <Activity className="size-3.5 text-sky-400" />,
    min: 0,
    max: 12,
    nominal: 6.5,
    decimals: 1,
  },
  {
    key: 'bubble_position',
    label: 'Bubble Position (Optical Track)',
    unit: 'norm',
    color: '#f43f5e',
    icon: <AlertCircle className="size-3.5 text-rose-400" />,
    min: 0,
    max: 1,
    nominal: 0,
    decimals: 2,
  },
];

export default function SimulationCharts({ data }: Props) {
  // If data is empty, generate a subtle baseline idle wave
  const hasData = data && data.length > 1;

  return (
    <div className="space-y-3">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-teal-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Real-Time In-Silico Telemetry
          </span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-mono font-bold text-slate-400 border border-slate-700">
            SIMULATION DATA
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {hasData ? `${data.length} telemetry frames recorded` : 'Standby baseline waveform'}
        </span>
      </div>

      {/* Grid of Waveform Monitors */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {CHARTS.map((cfg) => {
          // Extract values
          const values: number[] = hasData
            ? data.map((d) => Number(d[cfg.key] ?? cfg.nominal))
            : [cfg.nominal, cfg.nominal + 0.1, cfg.nominal - 0.1, cfg.nominal];

          const currentVal = values[values.length - 1];
          const minVal = Math.min(...values, cfg.min);
          const maxVal = Math.max(...values, cfg.max);
          const range = maxVal - minVal || 1;

          // Compute SVG points
          const W = 280;
          const H = 64;
          const padding = 4;
          const points = values.map((v, i) => {
            const x = (i / (values.length - 1 || 1)) * (W - padding * 2) + padding;
            const y = H - ((v - minVal) / range) * (H - padding * 2) - padding;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          const polylineStr = points.join(' ');

          // Closed path for subtle gradient under waveform
          const lastX = W - padding;
          const firstX = padding;
          const areaPath = `M ${firstX},${H} L ${polylineStr} L ${lastX},${H} Z`;

          return (
            <div
              key={cfg.key}
              className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-3.5 backdrop-blur-sm transition hover:border-slate-700"
            >
              {/* Card Top: Title, Icon, Value */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-slate-900 border border-slate-800">
                    {cfg.icon}
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-200">
                      {cfg.label}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      Baseline: {cfg.nominal} {cfg.unit}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold font-mono tracking-tight" style={{ color: cfg.color }}>
                    {currentVal.toFixed(cfg.decimals)}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">
                    {cfg.unit}
                  </div>
                </div>
              </div>

              {/* Waveform Viewport */}
              <div className="relative rounded-xl border border-slate-900 bg-slate-900/40 p-1 overflow-hidden">
                {/* Horizontal reference grid line */}
                <div className="absolute inset-x-0 top-1/2 border-t border-slate-800/40 border-dashed pointer-events-none" />

                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14 overflow-visible">
                  <defs>
                    <linearGradient id={`grad-${cfg.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cfg.color} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={cfg.color} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area Fill */}
                  <path d={areaPath} fill={`url(#grad-${cfg.key})`} />

                  {/* High-Resolution Waveform Line */}
                  <polyline
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylineStr}
                  />

                  {/* Pulsing Target Dot on Latest Sample */}
                  {points.length > 0 && (
                    <circle
                      cx={points[points.length - 1].split(',')[0]}
                      cy={points[points.length - 1].split(',')[1]}
                      r="3.5"
                      fill={cfg.color}
                    />
                  )}
                </svg>
              </div>

              {/* Footer bounds */}
              <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-slate-600">
                <span>Min: {minVal.toFixed(cfg.decimals)}</span>
                <span className="text-slate-500">In-Silico Fluid Dynamic</span>
                <span>Max: {maxVal.toFixed(cfg.decimals)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
