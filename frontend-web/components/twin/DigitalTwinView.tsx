'use client';

/**
 * BioGuardian Complete 3D Digital Twin & Virtual Lab View
 * Unifies the WebGL 3D Canvas, SolarEye-inspired Glass HUD, and Drawers (Telemetry, Bubble, and Virtual Lab Deck).
 */

import React, { useState } from 'react';
import { DigitalTwinCanvas } from './DigitalTwinCanvas';
import { DigitalTwinHUD } from './DigitalTwinHUD';
import { DigitalTwinZoomControl } from './DigitalTwinZoomControl';
import { TelemetryDrawers } from './TelemetryDrawers';
import { TelemetryProvider } from '@/lib/telemetry/TelemetryContext';
import { TwinEnvironmentMode } from '@/lib/telemetry/types';

interface DigitalTwinViewProps {
  fullscreen?: boolean;
  initialEnvironmentMode?: TwinEnvironmentMode;
}

function DigitalTwinViewContent({
  fullscreen = false,
  initialEnvironmentMode = 'HARDWARE_TWIN',
}: DigitalTwinViewProps) {
  const [telemetryDrawerOpen, setTelemetryDrawerOpen] = useState(false);
  const [bubbleDrawerOpen, setBubbleDrawerOpen] = useState(false);
  const [labDrawerOpen, setLabDrawerOpen] = useState(false);

  return (
    <div
      className={`relative w-full h-full flex-1 flex flex-col overflow-hidden bg-[#060a12] ${
        fullscreen
          ? 'min-h-0 rounded-none border-0 shadow-none'
          : 'min-h-[600px] lg:min-h-[720px] rounded-3xl border border-teal/20 shadow-2xl'
      }`}
    >
      {/* 1. 3D WebGL Canvas Layer */}
      <DigitalTwinCanvas />

      {/* 2. Floating Scientific HUD Layer */}
      <DigitalTwinHUD
        telemetryDrawerOpen={telemetryDrawerOpen}
        setTelemetryDrawerOpen={setTelemetryDrawerOpen}
        bubbleDrawerOpen={bubbleDrawerOpen}
        setBubbleDrawerOpen={setBubbleDrawerOpen}
        labDrawerOpen={labDrawerOpen}
        setLabDrawerOpen={setLabDrawerOpen}
      />

      {/* 3. Collapsible Glass Drawers */}
      <TelemetryDrawers
        telemetryDrawerOpen={telemetryDrawerOpen}
        setTelemetryDrawerOpen={setTelemetryDrawerOpen}
        bubbleDrawerOpen={bubbleDrawerOpen}
        setBubbleDrawerOpen={setBubbleDrawerOpen}
        labDrawerOpen={labDrawerOpen}
        setLabDrawerOpen={setLabDrawerOpen}
      />

      {/* 4. On-Screen Precision Smooth Zoom Controller */}
      <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <DigitalTwinZoomControl />
      </div>
    </div>
  );
}

export function DigitalTwinView({
  fullscreen = false,
  initialEnvironmentMode = 'HARDWARE_TWIN',
}: DigitalTwinViewProps) {
  return (
    <TelemetryProvider initialEnvironmentMode={initialEnvironmentMode}>
      <DigitalTwinViewContent
        fullscreen={fullscreen}
        initialEnvironmentMode={initialEnvironmentMode}
      />
    </TelemetryProvider>
  );
}
