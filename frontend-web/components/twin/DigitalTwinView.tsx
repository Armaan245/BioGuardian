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

function DigitalTwinViewContent() {
  const [telemetryDrawerOpen, setTelemetryDrawerOpen] = useState(false);
  const [bubbleDrawerOpen, setBubbleDrawerOpen] = useState(false);

  return (
    <div className="relative w-full h-full min-h-[600px] lg:min-h-[720px] rounded-3xl overflow-hidden border border-teal/20 shadow-2xl bg-[#060a12]">
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

export function DigitalTwinView() {
  return (
    <TelemetryProvider>
      <DigitalTwinViewContent />
    </TelemetryProvider>
  );
}
