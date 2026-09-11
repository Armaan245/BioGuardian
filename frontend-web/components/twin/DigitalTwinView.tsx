'use client';

/**
 * BioGuardian Complete 3D Digital Twin View
 * Unifies the WebGL 3D Canvas, SolarEye-inspired Glass HUD, and Telemetry Drawers.
 */

import React, { useState } from 'react';
import { DigitalTwinCanvas } from './DigitalTwinCanvas';
import { DigitalTwinHUD } from './DigitalTwinHUD';
import { TelemetryDrawers } from './TelemetryDrawers';
import { TelemetryProvider } from '@/lib/telemetry/TelemetryContext';

interface DigitalTwinViewProps {
  fullscreen?: boolean;
}

function DigitalTwinViewContent({ fullscreen = false }: DigitalTwinViewProps) {
  const [telemetryDrawerOpen, setTelemetryDrawerOpen] = useState(false);
  const [bubbleDrawerOpen, setBubbleDrawerOpen] = useState(false);

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
      />

      {/* 3. Collapsible Glass Drawers */}
      <TelemetryDrawers
        telemetryDrawerOpen={telemetryDrawerOpen}
        setTelemetryDrawerOpen={setTelemetryDrawerOpen}
        bubbleDrawerOpen={bubbleDrawerOpen}
        setBubbleDrawerOpen={setBubbleDrawerOpen}
      />
    </div>
  );
}

export function DigitalTwinView({ fullscreen = false }: DigitalTwinViewProps) {
  return (
    <TelemetryProvider>
      <DigitalTwinViewContent fullscreen={fullscreen} />
    </TelemetryProvider>
  );
}
