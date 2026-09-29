'use client';

import type { OrganProfile } from '@/lib/virtual-lab/types';

const META: Record<string, { icon: string; short: string; color: string }> = {
  lung:   { icon: '🫁', short: 'Alveolar-capillary barrier',    color: 'teal'   },
  heart:  { icon: '❤️', short: 'Cardiac micro-tissue',          color: 'red'    },
  liver:  { icon: '🧬', short: 'Hepatic sinusoid metabolic',    color: 'lime'   },
  kidney: { icon: '🫘', short: 'Renal proximal tubule barrier', color: 'orange' },
  gut:    { icon: '🦠', short: 'Intestinal epithelial flow',    color: 'yellow' },
  brain:  { icon: '🧠', short: 'Blood-brain barrier NVU',       color: 'purple' },
};

const COLOR_MAP: Record<string, { ring: string; bg: string; text: string }> = {
  teal:   { ring: 'ring-teal-500/50',   bg: 'bg-teal-900/20',   text: 'text-teal-300'   },
  red:    { ring: 'ring-red-500/50',    bg: 'bg-red-900/20',    text: 'text-red-300'    },
  lime:   { ring: 'ring-lime-500/50',   bg: 'bg-lime-900/20',   text: 'text-lime-300'   },
  orange: { ring: 'ring-orange-500/50', bg: 'bg-orange-900/20', text: 'text-orange-300' },
  yellow: { ring: 'ring-yellow-500/50', bg: 'bg-yellow-900/20', text: 'text-yellow-300' },
  purple: { ring: 'ring-purple-500/50', bg: 'bg-purple-900/20', text: 'text-purple-300' },
};

interface Props {
  organs: OrganProfile[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function OrganSelector({ organs, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {organs.map((organ) => {
        const meta  = META[organ.id] ?? { icon: '🔬', short: '', color: 'teal' };
        const c     = COLOR_MAP[meta.color] ?? COLOR_MAP.teal;
        const active = organ.id === selected;
        return (
          <button
            key={organ.id}
            onClick={() => onSelect(organ.id)}
            className={`relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all duration-150 ${
              active
                ? `border-transparent ring-1 ${c.ring} ${c.bg}`
                : 'border-slate-800 bg-slate-800/30 hover:border-slate-700 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-lg leading-none">{meta.icon}</span>
            <span className={`mt-1 text-[11px] font-semibold leading-tight ${active ? c.text : 'text-slate-200'}`}>
              {organ.name}
            </span>
            <span className="text-[9px] leading-tight text-slate-600 line-clamp-2">{meta.short}</span>
            {active && (
              <span className={`absolute right-2 top-2 size-1.5 rounded-full ${c.text.replace('text-', 'bg-')}`} />
            )}
          </button>
        );
      })}
      <p className="col-span-2 mt-1 text-[9px] leading-4 text-slate-700">
        ⚠ In-silico profiles only. Not medically validated.
      </p>
    </div>
  );
}
