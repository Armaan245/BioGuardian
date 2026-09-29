'use client';

import { useEffect, useRef, useState } from 'react';
import type { SimulationStatus } from '@/lib/virtual-lab/types';

interface Props {
  organId: string;
  status: SimulationStatus;
  flowRate: number;
  bubblePosition: number;
  bubbleActive: boolean;
}

const ORGAN_ACCENT: Record<string, string> = {
  lung:   '#2dd4bf', heart:  '#f87171', liver:  '#a3e635',
  kidney: '#fb923c', gut:    '#facc15', brain:  '#a78bfa',
};

const ORGAN_LABEL: Record<string, string> = {
  lung:   'ALVEOLAR', heart: 'CARDIAC µ-TISSUE', liver: 'HEPATIC SINUSOID',
  kidney: 'RENAL TUBULE', gut: 'INTESTINAL', brain: 'BBB UNIT',
};

export default function VirtualLabCanvas({ organId, status, flowRate, bubblePosition, bubbleActive }: Props) {
  const accent = ORGAN_ACCENT[organId] ?? '#2dd4bf';
  const isRunning = status === 'running' || status === 'bubble';

  const tickRef = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const speed = (flowRate / 450) * 0.005;
    let raf: number;
    const animate = () => {
      tickRef.current = (tickRef.current + speed) % 1;
      setTick(tickRef.current);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isRunning, flowRate]);

  // Path: Y-junction (260,160) → obs zone (420,160) → chip in (550,160) → chip out (680,160) → outlet (780,160)
  const PATH = [
    { x: 260, y: 160 }, { x: 420, y: 160 }, { x: 550, y: 160 }, { x: 680, y: 160 }, { x: 780, y: 160 },
  ];

  function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
  function posOnPath(t: number) {
    const n = PATH.length - 1;
    const seg = Math.min(Math.floor(t * n), n - 1);
    const local = t * n - seg;
    return { x: lerp(PATH[seg].x, PATH[seg + 1].x, local), y: lerp(PATH[seg].y, PATH[seg + 1].y, local) };
  }

  const PARTICLES = [0, 0.18, 0.36, 0.54, 0.72, 0.90];
  const MEDIA_ARM = [0, 0.35, 0.70];
  const DRUG_ARM  = [0.15, 0.50, 0.85];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#060c14]" style={{ aspectRatio: '16/5' }}>

      {/* Top-left badge */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-900/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500 backdrop-blur-sm">
        <span className="size-1.5 rounded-full bg-slate-600" />
        Virtual Lab · Simulation
      </div>

      {/* Bubble alert badge */}
      {status === 'bubble' && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2 animate-pulse rounded-full border border-red-500/50 bg-red-900/60 px-3 py-1 text-[10px] font-bold text-red-300 uppercase tracking-wider backdrop-blur-sm">
          🫧 Simulated Bubble Event
        </div>
      )}

      {/* Flow rate readout */}
      <div className="absolute bottom-3 left-3 z-10 font-mono text-[10px] text-slate-700">
        Q = {Math.round(flowRate)} µL/min  ·  {organId.toUpperCase()}-ON-A-CHIP
      </div>

      <svg viewBox="0 0 900 300" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.7" fill="rgba(148,163,184,0.06)" />
          </pattern>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="900" height="300" fill="url(#dots)" />

        {/* ── MEDIA INLET arm ── */}
        {/* Tube shadow */}
        <line x1="60" y1="80" x2="260" y2="160" stroke="#0d1f2d" strokeWidth="20" strokeLinecap="round" />
        {/* Tube body */}
        <line x1="60" y1="80" x2="260" y2="160" stroke="#0f2535" strokeWidth="14" strokeLinecap="round" />
        {/* Inner fluid glow */}
        <line x1="60" y1="80" x2="260" y2="160" stroke={`${accent}18`} strokeWidth="8" strokeLinecap="round" />
        {/* Inlet cap */}
        <rect x="45" y="68" width="18" height="24" rx="4" fill="#0f2535" stroke="#1e3a52" strokeWidth="1.5" />
        <rect x="51" y="74" width="6" height="12" rx="2" fill={accent} opacity="0.5" />
        {/* Label */}
        <text x="40" y="56" fontSize="8" fill="#475569" fontFamily="monospace" fontWeight="600" textAnchor="middle">MEDIA</text>
        <text x="40" y="66" fontSize="7" fill="#334155" fontFamily="monospace" textAnchor="middle">INLET</text>

        {/* ── DRUG INLET arm ── */}
        <line x1="60" y1="240" x2="260" y2="160" stroke="#0d1f2d" strokeWidth="20" strokeLinecap="round" />
        <line x1="60" y1="240" x2="260" y2="160" stroke="#150f2a" strokeWidth="14" strokeLinecap="round" />
        <line x1="60" y1="240" x2="260" y2="160" stroke="rgba(167,139,250,0.15)" strokeWidth="8" strokeLinecap="round" />
        <rect x="45" y="228" width="18" height="24" rx="4" fill="#150f2a" stroke="#2d1f4a" strokeWidth="1.5" />
        <rect x="51" y="234" width="6" height="12" rx="2" fill="#a78bfa" opacity="0.5" />
        <text x="40" y="264" fontSize="8" fill="#475569" fontFamily="monospace" fontWeight="600" textAnchor="middle">DRUG</text>
        <text x="40" y="274" fontSize="7" fill="#334155" fontFamily="monospace" textAnchor="middle">INLET</text>

        {/* ── MAIN CHANNEL ── */}
        <line x1="260" y1="160" x2="800" y2="160" stroke="#0d1f2d" strokeWidth="22" strokeLinecap="round" />
        <line x1="260" y1="160" x2="800" y2="160" stroke="#0f2535" strokeWidth="16" strokeLinecap="round" />
        <line x1="260" y1="160" x2="800" y2="160" stroke={`${accent}14`} strokeWidth="10" strokeLinecap="round" />

        {/* ── Y-JUNCTION node ── */}
        <circle cx="260" cy="160" r="18" fill="#0c1a27" stroke="#1e3a52" strokeWidth="1.5" />
        <circle cx="260" cy="160" r="10" fill="#0f2535" />
        <circle cx="260" cy="160" r="5" fill={accent} opacity="0.4" filter="url(#glow)" />
        <text x="260" y="186" fontSize="7.5" fill="#334155" fontFamily="monospace" fontWeight="600" textAnchor="middle">Y-JUNCTION</text>

        {/* ── OBSERVATION ZONE ── */}
        {/* Outer sensor ring */}
        <circle cx="420" cy="160" r="36" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="420" cy="160" r="28" fill="none" stroke="#162032" strokeWidth="1" />
        {/* Inner camera body */}
        <circle cx="420" cy="160" r="22" fill="#080f1a" stroke="#1e3a52" strokeWidth="1.5" />
        {/* Camera reticle */}
        <line x1="408" y1="160" x2="432" y2="160" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
        <line x1="420" y1="148" x2="420" y2="172" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
        <circle cx="420" cy="160" r="8" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
        <circle cx="420" cy="160" r="3" fill="#38bdf8" opacity="0.4" />
        {/* Alert ring when bubble passes through */}
        {status === 'bubble' && bubblePosition > 0.15 && bubblePosition < 0.50 && (
          <>
            <circle cx="420" cy="160" r="28" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.5">
              <animate attributeName="r" values="22;32;22" dur="0.7s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.7s" repeatCount="indefinite" />
            </circle>
          </>
        )}
        <text x="420" y="204" fontSize="7.5" fill="#38bdf8" fontFamily="monospace" fontWeight="600" textAnchor="middle">OBSERVATION ZONE</text>
        <text x="420" y="213" fontSize="6.5" fill="#1e4060" fontFamily="monospace" textAnchor="middle">Optical · Sensor</text>

        {/* ── ORGAN-ON-CHIP ── */}
        {/* Chip body */}
        <rect x="540" y="118" width="150" height="84" rx="10" fill="#080f1a" stroke="#1e3a52" strokeWidth="2" />
        {/* Inner glass effect */}
        <rect x="546" y="124" width="138" height="72" rx="7" fill={`${accent}06`} stroke={`${accent}20`} strokeWidth="1" />
        {/* Inlet/outlet ports on chip */}
        <circle cx="540" cy="160" r="5" fill="#0f2535" stroke="#1e3a52" strokeWidth="1.5" />
        <circle cx="690" cy="160" r="5" fill="#0f2535" stroke="#1e3a52" strokeWidth="1.5" />
        {/* Internal microchannels — organ specific */}
        {organId === 'lung' && (
          <>
            <line x1="556" y1="160" x2="674" y2="160" stroke={`${accent}50`} strokeWidth="2" />
            <ellipse cx="615" cy="148" rx="24" ry="10" fill="none" stroke={`${accent}30`} strokeWidth="1" />
            <ellipse cx="615" cy="172" rx="24" ry="10" fill="none" stroke={`${accent}25`} strokeWidth="1" />
            <text x="615" y="160" fontSize="6" fill={`${accent}60`} fontFamily="monospace" textAnchor="middle" dominantBaseline="middle">MEMBRANE</text>
          </>
        )}
        {organId === 'heart' && (
          <>
            <line x1="556" y1="160" x2="674" y2="160" stroke={`${accent}50`} strokeWidth="2" />
            <path d="M 590 150 Q 615 140 640 150 Q 640 175 615 185 Q 590 175 590 150Z" fill={`${accent}15`} stroke={`${accent}35`} strokeWidth="1" />
          </>
        )}
        {(organId === 'liver' || organId === 'kidney' || organId === 'gut' || organId === 'brain') && (
          <>
            <line x1="556" y1="154" x2="674" y2="154" stroke={`${accent}45`} strokeWidth="1.5" strokeDasharray="6 3" />
            <line x1="556" y1="166" x2="674" y2="166" stroke={`${accent}35`} strokeWidth="1" strokeDasharray="5 4" />
            <rect x="585" y="138" width="60" height="44" rx="4" fill={`${accent}08`} stroke={`${accent}25`} strokeWidth="0.8" />
          </>
        )}
        <text x="615" y="108" fontSize="8.5" fill={accent} fontFamily="monospace" fontWeight="700" textAnchor="middle" opacity="0.9">ORGAN-ON-CHIP</text>
        <text x="615" y="118" fontSize="7" fill="#334155" fontFamily="monospace" textAnchor="middle">{ORGAN_LABEL[organId] ?? ''}</text>

        {/* ── OUTLET ── */}
        <line x1="790" y1="160" x2="860" y2="160" stroke="#0d1f2d" strokeWidth="22" strokeLinecap="round" />
        <line x1="790" y1="160" x2="860" y2="160" stroke="#0f2535" strokeWidth="14" strokeLinecap="round" />
        {/* Outlet reservoir */}
        <rect x="855" y="144" width="28" height="32" rx="5" fill="#080f1a" stroke="#1e3a52" strokeWidth="1.5" />
        <rect x="862" y="150" width="14" height="20" rx="3" fill="#0f2535" />
        <text x="869" y="192" fontSize="7.5" fill="#334155" fontFamily="monospace" fontWeight="600" textAnchor="middle">OUTLET</text>

        {/* ── FLOWING PARTICLES (main channel) ── */}
        {isRunning && PARTICLES.map((offset, i) => {
          const t = (tick + offset) % 1;
          if (t < 0.005 || t > 0.995) return null;
          const pos = posOnPath(t);
          return (
            <circle key={i} cx={pos.x} cy={pos.y} r="4" fill={accent} opacity={0.7 - t * 0.2} filter="url(#glow)" />
          );
        })}

        {/* Media arm particles */}
        {isRunning && MEDIA_ARM.map((offset, i) => {
          const t = (tick + offset) % 1;
          const px = 60 + t * 200, py = 80 + t * 80;
          if (t > 0.96) return null;
          return <circle key={`m${i}`} cx={px} cy={py} r="3" fill={accent} opacity={0.5 - t * 0.3} />;
        })}

        {/* Drug arm particles */}
        {isRunning && DRUG_ARM.map((offset, i) => {
          const t = (tick + offset) % 1;
          const px = 60 + t * 200, py = 240 - t * 80;
          if (t > 0.96) return null;
          return <circle key={`d${i}`} cx={px} cy={py} r="3" fill="#a78bfa" opacity={0.4 - t * 0.25} />;
        })}

        {/* ── SIMULATED BUBBLE ── */}
        {bubbleActive && bubblePosition > 0 && (
          (() => {
            const pos = posOnPath(Math.min(bubblePosition, 0.97));
            return (
              <g>
                <circle cx={pos.x} cy={pos.y} r="9" fill="rgba(255,255,255,0.06)" stroke="#ef4444" strokeWidth="1.5" filter="url(#glow)" />
                <circle cx={pos.x - 3} cy={pos.y - 3} r="3" fill="rgba(255,255,255,0.25)" />
                <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.3" />
                <text x={pos.x} y={pos.y - 17} fontSize="7.5" fill="#ef4444" textAnchor="middle" fontFamily="monospace" fontWeight="600">BUBBLE</text>
              </g>
            );
          })()
        )}

        {/* Flow direction arrows on main channel */}
        {isRunning && [320, 480, 740].map((x) => (
          <g key={x} opacity="0.25">
            <line x1={x} y1="155" x2={x + 10} y2="160" stroke={accent} strokeWidth="1" />
            <line x1={x} y1="165" x2={x + 10} y2="160" stroke={accent} strokeWidth="1" />
          </g>
        ))}
      </svg>
    </div>
  );
}
