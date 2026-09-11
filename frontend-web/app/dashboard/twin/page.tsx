'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { DigitalTwinView } from '@/components/twin/DigitalTwinView';

export default function TwinPage() {
  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden bg-[#060a12] text-white flex flex-col">
      {/* Top Header */}
      <header className="h-14 shrink-0 border-b border-white/10 bg-[#090e1a]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-teal/40 hover:bg-white/5 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
          <div className="h-4 w-px bg-white/15" />
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-teal text-white text-xs font-bold">BG</span>
            <div>
              <div className="text-xs font-semibold text-white tracking-wide">BioGuardian 3D Digital Twin</div>
              <div className="text-[10px] text-teal hidden sm:block">Autonomous Organ-on-Chip Microfluidic Protection</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="size-4 text-teal" /> Optical Bubble Interception Bus
          </span>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-teal transition flex items-center gap-1"
          >
            Platform Overview <ExternalLink className="size-3" />
          </Link>
        </div>
      </header>

      {/* Main 3D Digital Twin View Container - Full Browser Viewport */}
      <main className="flex-1 w-full h-[calc(100dvh-3.5rem)] min-h-0 relative overflow-hidden flex flex-col p-0 m-0">
        <DigitalTwinView fullscreen />
      </main>
    </div>
  );
}
