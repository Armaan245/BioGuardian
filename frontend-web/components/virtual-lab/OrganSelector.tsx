'use client';

/**
 * BioGuardian Organ Selector
 * Precision biomedical vector icons with organ microfluidic profiles.
 * No amateur emojis.
 */

import React from 'react';
import type { OrganProfile } from '@/lib/virtual-lab/types';
import { Layers, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  organs: OrganProfile[];
  selected: string;
  onSelect: (id: string) => void;
}

// Precision SVG Organ Glyphs for biomedical scientific UI
function OrganIcon({ id, className = 'size-5' }: { id: string; className?: string }) {
  switch (id) {
    case 'lung':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 4v7" />
          <path d="M12 7c-2-1-4-2-6-1-2.5 1-3.5 4-3.5 8 0 4.5 3 6 5.5 6s4-2 4-5.5V7z" />
          <path d="M12 7c2-1 4-2 6-1 2.5 1 3.5 4 3.5 8 0 4.5-3 6-5.5 6s-4-2-4-5.5V7z" />
          <path d="M7 13c1 0 2 1 2 2" />
          <path d="M17 13c-1 0-2 1-2 2" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 5v4" />
          <path d="M9 12h6" />
        </svg>
      );
    case 'liver':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M3.5 9.5C3.5 6 6.5 4 11 4c6 0 9.5 2.5 9.5 7.5 0 6-4.5 8.5-10 8.5-5 0-7-3-7-10.5z" />
          <path d="M11 4c1 4 1 8-1 16" />
          <circle cx="15.5" cy="11.5" r="1.5" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'kidney':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 3c4.5 0 8 3.5 8 8.5 0 5.5-3.5 9.5-8 9.5-3.5 0-6-2.5-6-5.5 0-2.5 1.5-3.5 2.5-4.5s1-2 1-3.5C9.5 5 10.5 3 12 3z" />
          <path d="M9 11c1.5 0 2.5 1 2.5 2s-1 2-2.5 2" />
        </svg>
      );
    case 'gut':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6 5c3-1 9-1 12 0 1.5.5 2 2 1 3.5-2 3-8 3-10 4-2 1-2.5 3-1 4.5s5 1.5 8 1.5 4 2 2 3.5c-3 2-9 2-12 0" />
        </svg>
      );
    case 'brain':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M9.5 4a3.5 3.5 0 0 0-3.5 3.5c0 .7.2 1.3.5 1.8A3.5 3.5 0 0 0 5 12a3.5 3.5 0 0 0 1.5 2.8 3.5 3.5 0 0 0 5 3.2V4z" />
          <path d="M14.5 4a3.5 3.5 0 0 1 3.5 3.5c0 .7-.2 1.3-.5 1.8A3.5 3.5 0 0 1 19 12a3.5 3.5 0 0 1-1.5 2.8 3.5 3.5 0 0 1-5 3.2V4z" />
          <path d="M12 4v16" />
        </svg>
      );
    default:
      return <Layers className={className} />;
  }
}

const ORGAN_METADATA: Record<string, { label: string; tissue: string; badge: string; accentBorder: string; activeGlow: string }> = {
  lung: {
    label: 'Lung-on-a-Chip',
    tissue: 'Alveolar-Capillary Interface',
    badge: 'Dual-Chamber',
    accentBorder: 'border-teal-500/50 hover:border-teal-400',
    activeGlow: 'bg-teal-950/40 border-teal-400 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.18)]',
  },
  heart: {
    label: 'Heart-on-a-Chip',
    tissue: 'Cardiomyocyte Syncytium',
    badge: 'Electrophysiology',
    accentBorder: 'border-rose-500/50 hover:border-rose-400',
    activeGlow: 'bg-rose-950/40 border-rose-400 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.18)]',
  },
  liver: {
    label: 'Liver-on-a-Chip',
    tissue: 'Hepatic Sinusoid Array',
    badge: 'Metabolic Matrix',
    accentBorder: 'border-lime-500/50 hover:border-lime-400',
    activeGlow: 'bg-lime-950/40 border-lime-400 text-lime-300 shadow-[0_0_20px_rgba(132,204,22,0.18)]',
  },
  kidney: {
    label: 'Kidney-on-a-Chip',
    tissue: 'Renal Proximal Tubule',
    badge: 'Fluid Shear Unit',
    accentBorder: 'border-amber-500/50 hover:border-amber-400',
    activeGlow: 'bg-amber-950/40 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.18)]',
  },
  gut: {
    label: 'Gut-on-a-Chip',
    tissue: 'Intestinal Villi Epithelium',
    badge: 'Peristaltic Flow',
    accentBorder: 'border-yellow-500/50 hover:border-yellow-400',
    activeGlow: 'bg-yellow-950/40 border-yellow-400 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.18)]',
  },
  brain: {
    label: 'Brain-on-a-Chip',
    tissue: 'Blood-Brain Barrier NVU',
    badge: 'Neurovascular',
    accentBorder: 'border-purple-500/50 hover:border-purple-400',
    activeGlow: 'bg-purple-950/40 border-purple-400 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.18)]',
  },
};

export default function OrganSelector({ organs, selected, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="size-3.5 text-teal-400" /> Organ Cartridge Model
        </span>
        <span className="text-[10px] font-mono text-slate-500">6 Profiles</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {organs.map((organ) => {
          const meta = ORGAN_METADATA[organ.id] || {
            label: organ.name,
            tissue: 'In-silico barrier model',
            badge: 'Prototype',
            accentBorder: 'border-slate-700',
            activeGlow: 'bg-slate-800 text-slate-100 border-teal-500',
          };
          const isSelected = organ.id === selected;

          return (
            <button
              key={organ.id}
              onClick={() => onSelect(organ.id)}
              className={`relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 group ${
                isSelected
                  ? `${meta.activeGlow} ring-1 ring-teal-400/40`
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              {/* Icon & Status badge */}
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`size-8 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <OrganIcon id={organ.id} className="size-4" />
                </div>
                {isSelected ? (
                  <span className="flex items-center gap-1 text-[9px] font-mono font-semibold text-teal-400">
                    <CheckCircle2 className="size-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-600 uppercase">
                    {meta.badge}
                  </span>
                )}
              </div>

              {/* Title & Tissue description */}
              <div className="text-xs font-semibold tracking-tight text-slate-100">
                {meta.label}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                {meta.tissue}
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
        <ShieldAlert className="size-3 text-amber-500 shrink-0" />
        <span>In-silico organ models for microfluidic simulation.</span>
      </div>
    </div>
  );
}
