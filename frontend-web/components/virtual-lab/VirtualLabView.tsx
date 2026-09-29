'use client';

/**
 * BioGuardian Virtual Lab - Unified 3D Digital Twin & Simulation View
 * 
 * Unifies Virtual Lab into the exact high-fidelity 3D Digital Twin rig:
 * - Dual Reservoir Bottles (Media + Drug)
 * - 3-Layer Y-Junction Prep & Bubble Trap Chip (CAD media_1790691024153.png)
 * - Untouched High-Fidelity Organ-on-Chip
 * - Optical Machine-Vision Inspection Camera
 * - Downstream Sensor Manifold & Waste Beaker
 * - Master Environment Mode Switcher: [🔬 LIVE TWIN] <-> [🧪 VIRTUAL LAB]
 * - Virtual Lab Deck: Organ Selector, Parameter Panel, Waveforms, Zero-Fake-ML Gateway
 */

import { DigitalTwinView } from '@/components/twin/DigitalTwinView';

export default function VirtualLabView() {
  return <DigitalTwinView fullscreen initialEnvironmentMode="VIRTUAL_LAB" />;
}
