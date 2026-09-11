'use client';

/**
 * BioGuardian On-Screen Smooth Zoom Control
 * Inspired by professional GIS / CAD navigation widgets:
 * - [+] Zoom In button
 * - Vertical Slider Bar with graduation ticks and interactive draggable thumb
 * - [-] Zoom Out button
 * - [↺] Re-center / Reset camera button
 * - Real-time percentage indicator and bidirectional sync with 3D canvas
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Minus, RotateCcw, ZoomIn } from 'lucide-react';

export function DigitalTwinZoomControl() {
  // zoomLevel: 0.0 (maximum zoom out) to 1.0 (maximum zoom in)
  const [zoomLevel, setZoomLevel] = useState(0.45);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Synchronize with camera zoom events from Three.js
  useEffect(() => {
    const handleZoomChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ level: number }>;
      if (typeof customEvent.detail?.level === 'number') {
        setZoomLevel(Math.max(0, Math.min(1, customEvent.detail.level)));
      }
    };

    window.addEventListener('bioguardian:zoom_changed', handleZoomChanged);
    return () => {
      window.removeEventListener('bioguardian:zoom_changed', handleZoomChanged);
    };
  }, []);

  const dispatchZoomStep = useCallback((direction: 'in' | 'out') => {
    window.dispatchEvent(
      new CustomEvent('bioguardian:zoom_step', {
        detail: { direction, amount: 0.2 },
      })
    );
  }, []);

  const dispatchSetZoomLevel = useCallback((level: number) => {
    window.dispatchEvent(
      new CustomEvent('bioguardian:set_zoom_level', {
        detail: { level },
      })
    );
  }, []);

  const dispatchResetZoom = useCallback(() => {
    window.dispatchEvent(new CustomEvent('bioguardian:reset_zoom'));
  }, []);

  // Update zoom from pointer position along vertical track
  const updateZoomFromPointer = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      // Top is 1.0 (Zoom In), bottom is 0.0 (Zoom Out)
      const ratio = 1 - (clientY - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(1, ratio));
      setZoomLevel(clamped);
      dispatchSetZoomLevel(clamped);
    },
    [dispatchSetZoomLevel]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    updateZoomFromPointer(e.clientY);

    const onPointerMove = (ev: PointerEvent) => {
      updateZoomFromPointer(ev.clientY);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Convert zoomLevel 0-1 to friendly display percentage (e.g. 50% to 250%)
  const zoomPercent = Math.round(50 + zoomLevel * 200);

  return (
    <div className="flex flex-col items-center pointer-events-auto select-none">
      {/* Container Card */}
      <div className="bg-[#090e1a]/85 backdrop-blur-md border border-teal/30 hover:border-teal/50 shadow-2xl rounded-2xl p-1.5 flex flex-col items-center gap-1.5 transition-all duration-200">
        
        {/* 1. Zoom In Button (+) */}
        <button
          onClick={() => dispatchZoomStep('in')}
          onMouseEnter={() => setShowTooltip('Zoom In')}
          onMouseLeave={() => setShowTooltip(null)}
          aria-label="Zoom In"
          className="size-8 rounded-xl bg-white/5 hover:bg-teal/20 active:bg-teal/30 text-teal hover:text-white border border-white/10 hover:border-teal/40 transition flex items-center justify-center shadow-sm active:scale-95 group relative"
          title="Zoom In (+)"
        >
          <Plus className="size-4 transition-transform group-hover:scale-110" />
        </button>

        {/* 2. Interactive Vertical Slider Track */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onMouseEnter={() => setShowTooltip(`Drag to Zoom (${zoomPercent}%)`)}
          onMouseLeave={() => setShowTooltip(null)}
          className="relative w-7 h-32 sm:h-36 py-2 flex flex-col items-center justify-center cursor-pointer group"
          title={`Drag to Zoom: ${zoomPercent}%`}
        >
          {/* Vertical Track Background Groove */}
          <div className="absolute top-2 bottom-2 w-1.5 bg-slate-800/90 rounded-full overflow-hidden border border-white/10">
            {/* Active Teal Fill Level */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-teal/60 to-cyan-400 transition-all duration-75 rounded-full"
              style={{ height: `${Math.round(zoomLevel * 100)}%` }}
            />
          </div>

          {/* Tick Marks on Track */}
          <div className="absolute inset-y-2 flex flex-col justify-between items-center pointer-events-none w-4 py-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-[1px] bg-slate-500/40 rounded-full"
              />
            ))}
          </div>

          {/* Draggable Slider Thumb Handle */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-6 h-3.5 rounded-md bg-[#0a1120] border-2 border-cyan-400 shadow-md flex items-center justify-center transition-transform ${
              isDragging ? 'scale-110 border-white shadow-cyan-500/50 shadow-lg' : 'group-hover:border-teal'
            }`}
            style={{
              bottom: `calc(${zoomLevel * 100}% - 7px)`,
            }}
          >
            {/* Mini Gripper lines on handle */}
            <div className="flex gap-0.5 pointer-events-none">
              <div className="w-[1.5px] h-2 bg-cyan-300 rounded-full" />
              <div className="w-[1.5px] h-2 bg-cyan-300 rounded-full" />
            </div>
          </div>
        </div>

        {/* 3. Zoom Out Button (-) */}
        <button
          onClick={() => dispatchZoomStep('out')}
          onMouseEnter={() => setShowTooltip('Zoom Out')}
          onMouseLeave={() => setShowTooltip(null)}
          aria-label="Zoom Out"
          className="size-8 rounded-xl bg-white/5 hover:bg-teal/20 active:bg-teal/30 text-teal hover:text-white border border-white/10 hover:border-teal/40 transition flex items-center justify-center shadow-sm active:scale-95 group relative"
          title="Zoom Out (-)"
        >
          <Minus className="size-4 transition-transform group-hover:scale-110" />
        </button>

        {/* Separator */}
        <div className="w-5 h-px bg-white/10 my-0.5" />

        {/* 4. Reset View / Re-Center Camera Button */}
        <button
          onClick={dispatchResetZoom}
          onMouseEnter={() => setShowTooltip('Reset Camera View')}
          onMouseLeave={() => setShowTooltip(null)}
          aria-label="Reset Camera View"
          className="size-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-teal border border-white/5 transition flex items-center justify-center active:scale-95 group"
          title="Reset Camera View"
        >
          <RotateCcw className="size-3.5 transition-transform group-hover:-rotate-45" />
        </button>

        {/* Live Percentage Badge */}
        <span className="text-[9px] font-mono text-teal font-semibold tracking-tighter">
          {zoomPercent}%
        </span>
      </div>

      {/* Floating Tooltip Pill (shows when hovering buttons or dragging) */}
      {showTooltip && (
        <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#090e1a]/95 border border-teal/40 text-[10px] text-white font-mono shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {showTooltip}
        </div>
      )}
    </div>
  );
}
