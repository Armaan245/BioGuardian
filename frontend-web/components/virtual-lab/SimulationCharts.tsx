'use client';

import type { SimDataPoint } from '@/lib/virtual-lab/types';

interface LineChartProps {
  data: SimDataPoint[];
  yKey: keyof Omit<SimDataPoint, 't'>;
  label: string;
  unit: string;
  color: string;
  yMin?: number;
  yMax?: number;
}

function sparkline(data: SimDataPoint[], yKey: keyof Omit<SimDataPoint, 't'>, yMin?: number, yMax?: number) {
  if (data.length < 2) return { polyline: '', area: '', xs: [], ys: [], lastVal: 0 };
  const W = 300, H = 60, P = 3;
  const vals = data.map((d) => d[yKey] as number);
  const minV = yMin ?? Math.min(...vals);
  const maxV = yMax ?? Math.max(...vals);
  const range = maxV - minV || 1;
  const xs = data.map((_, i) => P + (i / (data.length - 1)) * (W - P * 2));
  const ys = vals.map((v) => P + (1 - (v - minV) / range) * (H - P * 2));
  const polyline = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `M ${xs[0].toFixed(1)},${H} ${xs.map((x, i) => `L ${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')} L ${xs[xs.length - 1].toFixed(1)},${H} Z`;
  return { polyline, area, xs, ys, lastVal: vals[vals.length - 1] };
}

function LineChart({ data, yKey, label, unit, color, yMin, yMax }: LineChartProps) {
  const W = 300, H = 60;
  const { polyline, area, xs, ys, lastVal } = sparkline(data, yKey, yMin, yMax);
  const hasData = data.length >= 2;
  const gradId = `grad-${yKey}`;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold text-slate-300">{label}</span>
        </div>
        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-wider">SIMULATION DATA</span>
      </div>

      {hasData ? (
        <div className="flex items-end gap-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="flex-1" preserveAspectRatio="none" style={{ height: 56 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.20" />
                <stop offset="100%" stopColor={color} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradId})`} />
            <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
          </svg>
          <div className="shrink-0 text-right min-w-[52px]">
            <div className="font-mono text-base font-bold" style={{ color }}>
              {lastVal.toFixed(yKey === 'ph' ? 2 : 1)}
            </div>
            <div className="text-[10px] text-slate-600">{unit || 'value'}</div>
          </div>
        </div>
      ) : (
        <div className="flex h-14 items-center justify-center">
          <span className="text-xs text-slate-700">Run simulation to see data</span>
        </div>
      )}
    </div>
  );
}

interface Props { data: SimDataPoint[]; }

export default function SimulationCharts({ data }: Props) {
  return (
    <div>
      <p className="mb-3 text-[10px] text-slate-600">
        All values are in-silico simulation outputs — not measured from physical hardware.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <LineChart data={data} yKey="flow_rate"       label="Flow Rate"       unit="µL/min" color="#2dd4bf" />
        <LineChart data={data} yKey="pressure"        label="Pressure"        unit="mbar"   color="#a78bfa" />
        <LineChart data={data} yKey="ph"              label="pH"              unit=""       color="#34d399" yMin={6.5} yMax={8.0} />
        <LineChart data={data} yKey="oxygen"          label="Dissolved O₂"    unit="mg/L"   color="#60a5fa" />
        <LineChart data={data} yKey="bubble_position" label="Bubble Position" unit="norm."  color="#f87171" yMin={0} yMax={1} />
      </div>
    </div>
  );
}
