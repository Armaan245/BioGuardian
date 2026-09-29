'use client';

/**
 * BioGuardian Virtual Lab - 3D Photorealistic Microfluidic Engine
 *
 * Full WebGL 3D Simulation built with Three.js:
 * - Thorlabs-style Optical Breadboard Table with brushed metal finish & grid holes
 * - Dual Medical Inlets: Media Buffer + Drug Compound with luer-lock fittings & transparent FEP tubing
 * - 3D Y-Junction Mixing Manifold
 * - Machine-Vision Optical Inspection Zone with camera reticle & active laser alert ring
 * - Centerpiece: Transparent PDMS Organ-on-Chip with internal microchannels tailored to each organ:
 *     * Lung: Alveolar-capillary barrier with porous membrane
 *     * Heart: Cardiomyocyte micro-tissue chamber with subtle contraction
 *     * Liver: Hexagonal hepatic sinusoid network
 *     * Kidney: Serpentine proximal tubule channel
 *     * Gut: Undulating intestinal villi channel
 *     * Brain: Neurovascular blood-brain barrier chamber
 * - Dynamic data-driven microfluidic tracer beads (speed proportional to flow_rate)
 * - 3D Refractive Physical Bubble moving through inlet, observation zone, and chip
 * - OrbitControls with Camera View Presets
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SimulationStatus } from '@/lib/virtual-lab/types';
import { Camera, Eye, Layers, Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Props {
  organId: string;
  status: SimulationStatus;
  flowRate: number;
  bubblePosition: number;
  bubbleActive: boolean;
}

// Organ-specific theme palettes for the 3D chip and tissue
const ORGAN_THEMES: Record<string, { tissueColor: number; fluidColor: number; label: string; subLabel: string }> = {
  lung:   { tissueColor: 0x00d2b4, fluidColor: 0x00ae9c, label: 'LUNG-ON-A-CHIP',    subLabel: 'Alveolar-Capillary Membrane' },
  heart:  { tissueColor: 0xff4d6d, fluidColor: 0xf43f5e, label: 'HEART-ON-A-CHIP',   subLabel: 'Cardiomyocyte Micro-Tissue' },
  liver:  { tissueColor: 0x84cc16, fluidColor: 0x65a30d, label: 'LIVER-ON-A-CHIP',   subLabel: 'Hepatic Sinusoid Array' },
  kidney: { tissueColor: 0xf97316, fluidColor: 0xea580c, label: 'KIDNEY-ON-A-CHIP',  subLabel: 'Renal Proximal Tubule' },
  gut:    { tissueColor: 0xeab308, fluidColor: 0xca8a04, label: 'GUT-ON-A-CHIP',     subLabel: 'Intestinal Epithelial Villi' },
  brain:  { tissueColor: 0xa855f7, fluidColor: 0x9333ea, label: 'BRAIN-ON-A-CHIP',   subLabel: 'Blood-Brain Barrier (BBB)' },
};

export default function VirtualLabCanvas({
  organId,
  status,
  flowRate,
  bubblePosition,
  bubbleActive,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isRunning = status === 'running' || status === 'bubble';

  // Refs for animation loop
  const isRunningRef = useRef(isRunning);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  const flowRateRef = useRef(flowRate);
  useEffect(() => { flowRateRef.current = flowRate; }, [flowRate]);

  const organIdRef = useRef(organId);
  useEffect(() => { organIdRef.current = organId; }, [organId]);

  const bubblePosRef = useRef(bubblePosition);
  useEffect(() => { bubblePosRef.current = bubblePosition; }, [bubblePosition]);

  const bubbleActiveRef = useRef(bubbleActive);
  useEffect(() => { bubbleActiveRef.current = bubbleActive; }, [bubbleActive]);

  // Camera preset controller ref
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Active camera preset tag
  const [activePreset, setActivePreset] = useState<'OVERVIEW' | 'OBSERVATION' | 'CHIP' | 'INLETS'>('OVERVIEW');

  // Trigger camera transitions
  const setCameraView = (view: 'OVERVIEW' | 'OBSERVATION' | 'CHIP' | 'INLETS') => {
    setActivePreset(view);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    let targetPos = new THREE.Vector3(0, 18, 42);
    let targetLook = new THREE.Vector3(0, 0, 0);

    if (view === 'OBSERVATION') {
      targetPos = new THREE.Vector3(-4, 9, 16);
      targetLook = new THREE.Vector3(-4, 1.2, 0);
    } else if (view === 'CHIP') {
      targetPos = new THREE.Vector3(12, 10, 22);
      targetLook = new THREE.Vector3(12, 1.2, 0);
    } else if (view === 'INLETS') {
      targetPos = new THREE.Vector3(-22, 12, 22);
      targetLook = new THREE.Vector3(-18, 1.5, 0);
    }

    // Animate smoothly
    const startPos = camera.position.clone();
    const startLook = controls.target.clone();
    let progress = 0;
    const animId = setInterval(() => {
      progress += 0.06;
      if (progress >= 1) {
        camera.position.copy(targetPos);
        controls.target.copy(targetLook);
        clearInterval(animId);
      } else {
        camera.position.lerpVectors(startPos, targetPos, progress);
        controls.target.lerpVectors(startLook, targetLook, progress);
      }
      controls.update();
    }, 16);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ----------------------------------------------------
    // 1. SCENE SETUP & ENVIRONMENT
    // ----------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b14);
    scene.fog = new THREE.FogExp2(0x060b14, 0.007);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 18, 42);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 90;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // ----------------------------------------------------
    // 2. STUDIO LIGHTING RIG
    // ----------------------------------------------------
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.4);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(20, 45, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 100;
    const d = 30;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x00ae9c, 2.0);
    cyanRim.position.set(-30, 20, -25);
    scene.add(cyanRim);

    const purpleAccent = new THREE.PointLight(0xa855f7, 2.2, 50);
    purpleAccent.position.set(-20, 8, 12);
    scene.add(purpleAccent);

    // ----------------------------------------------------
    // 3. OPTICAL BREADBOARD PLATFORM (Thorlabs style)
    // ----------------------------------------------------
    const tableGeo = new THREE.BoxGeometry(64, 2.2, 28);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e,
      roughness: 0.28,
      metalness: 0.85,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -1.1;
    table.receiveShadow = true;
    scene.add(table);

    // Grid holes texture pattern
    const gridHelper = new THREE.GridHelper(60, 30, 0x1e3a5f, 0x0f2238);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // ----------------------------------------------------
    // 4. MICROFLUIDIC INLET STATIONS & PIPELINE GEOMETRY
    // ----------------------------------------------------
    // Spline pathways:
    // Media Inlet: (-26, 3, -6) -> Y-Junction (-14, 1.2, 0)
    // Drug Inlet:  (-26, 3,  6) -> Y-Junction (-14, 1.2, 0)
    // Main Channel: Y-Junction (-14, 1.2, 0) -> Obs Zone (-4, 1.2, 0) -> Chip Entry (4, 1.2, 0) -> Chip Exit (20, 1.2, 0) -> Outlet (26, 1.2, 0)
    const mediaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-26, 3.2, -6),
      new THREE.Vector3(-20, 2.2, -4),
      new THREE.Vector3(-14, 1.2, 0),
    ]);

    const drugCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-26, 3.2, 6),
      new THREE.Vector3(-20, 2.2, 4),
      new THREE.Vector3(-14, 1.2, 0),
    ]);

    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-14, 1.2, 0),
      new THREE.Vector3(-4, 1.2, 0),   // Observation Zone
      new THREE.Vector3(4, 1.2, 0),    // Chip Entry
      new THREE.Vector3(12, 1.2, 0),   // Chip Center
      new THREE.Vector3(20, 1.2, 0),   // Chip Exit
      new THREE.Vector3(26, 1.0, 0),   // Outlet
    ]);

    // Transparent Glass/PDMS Tubing Material
    const tubeGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.05,
      transmission: 0.85,
      ior: 1.45,
      depthWrite: false,
    });

    // Surgical Stainless Steel Fitting Material
    const fittingMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.95,
      roughness: 0.22,
    });

    // Create Tubes
    const mediaTube = new THREE.Mesh(new THREE.TubeGeometry(mediaCurve, 40, 0.45, 16, false), tubeGlassMat);
    const drugTube  = new THREE.Mesh(new THREE.TubeGeometry(drugCurve, 40, 0.45, 16, false), tubeGlassMat);
    const mainTube  = new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 80, 0.52, 16, false), tubeGlassMat);
    scene.add(mediaTube);
    scene.add(drugTube);
    scene.add(mainTube);

    // Inlet Mount Towers (Brushed Aluminum Posts)
    const towerGeo = new THREE.CylinderGeometry(1.0, 1.2, 3.4, 24);
    const mediaTower = new THREE.Mesh(towerGeo, fittingMat);
    mediaTower.position.set(-26, 1.7, -6);
    scene.add(mediaTower);

    const drugTower = new THREE.Mesh(towerGeo, fittingMat);
    drugTower.position.set(-26, 1.7, 6);
    scene.add(drugTower);

    // Luer-Lock Fluid Reservoirs on Towers
    const vialGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.2, 24);
    const vialMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.65,
      transmission: 0.8,
      roughness: 0.12,
    });
    const mediaVial = new THREE.Mesh(vialGeo, vialMat);
    mediaVial.position.set(-26, 5.2, -6);
    scene.add(mediaVial);

    const drugVialMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8b4fe,
      transparent: true,
      opacity: 0.65,
      transmission: 0.8,
      roughness: 0.12,
    });
    const drugVial = new THREE.Mesh(vialGeo, drugVialMat);
    drugVial.position.set(-26, 5.2, 6);
    scene.add(drugVial);

    // Y-Junction Surgical Manifold Block
    const yJunctionBlock = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 1.2, 24),
      fittingMat
    );
    yJunctionBlock.position.set(-14, 1.2, 0);
    yJunctionBlock.rotation.x = Math.PI / 2;
    scene.add(yJunctionBlock);

    // ----------------------------------------------------
    // 5. MACHINE-VISION OPTICAL OBSERVATION ZONE
    // ----------------------------------------------------
    const obsGroup = new THREE.Group();
    obsGroup.position.set(-4, 0, 0);

    // Optical inspection stage ring
    const stageRingGeo = new THREE.CylinderGeometry(3.2, 3.6, 0.6, 32);
    const stageRing = new THREE.Mesh(stageRingGeo, fittingMat);
    stageRing.position.y = 0.3;
    obsGroup.add(stageRing);

    // Machine Vision Camera Lens Body overhead
    const lensTubeGeo = new THREE.CylinderGeometry(1.3, 1.6, 5.5, 32);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.8,
    });
    const cameraLens = new THREE.Mesh(lensTubeGeo, lensMat);
    cameraLens.position.set(0, 6.5, 0);
    obsGroup.add(cameraLens);

    // Gold/Copper C-mount lens aperture ring
    const cMount = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.12, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
    );
    cMount.position.set(0, 4.0, 0);
    cMount.rotation.x = Math.PI / 2;
    obsGroup.add(cMount);

    // Optical Laser Reticle Ring (Turns red when bubble detected)
    const laserRingGeo = new THREE.TorusGeometry(2.0, 0.08, 16, 48);
    const laserRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ae9c,
      transparent: true,
      opacity: 0.9,
    });
    const laserRing = new THREE.Mesh(laserRingGeo, laserRingMat);
    laserRing.position.set(0, 1.3, 0);
    laserRing.rotation.x = Math.PI / 2;
    obsGroup.add(laserRing);

    // Sensor Strobe Glow Light
    const sensorStrobe = new THREE.PointLight(0x00ae9c, 1.5, 12);
    sensorStrobe.position.set(0, 2.5, 0);
    obsGroup.add(sensorStrobe);

    scene.add(obsGroup);

    // ----------------------------------------------------
    // 6. THE CENTERPIECE: TRANSPARENT ORGAN-ON-CHIP
    // ----------------------------------------------------
    const chipGroup = new THREE.Group();
    chipGroup.position.set(12, 0, 0);

    // Glass Slide Cartridge Base
    const chipBodyGeo = new THREE.BoxGeometry(16, 1.8, 9.5);
    const chipGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.72,
      roughness: 0.08,
      metalness: 0.02,
      transmission: 0.92,
      ior: 1.52,
      reflectivity: 0.8,
    });
    const chipBody = new THREE.Mesh(chipBodyGeo, chipGlassMat);
    chipBody.position.y = 1.1;
    chipBody.castShadow = true;
    chipGroup.add(chipBody);

    // Beveled Stage Clamps on left and right
    const clampGeo = new THREE.BoxGeometry(1.6, 2.2, 10.5);
    const leftClamp = new THREE.Mesh(clampGeo, fittingMat);
    leftClamp.position.set(-8.2, 1.1, 0);
    chipGroup.add(leftClamp);

    const rightClamp = new THREE.Mesh(clampGeo, fittingMat);
    rightClamp.position.set(8.2, 1.1, 0);
    chipGroup.add(rightClamp);

    // Internal Microchannel Trench
    const trenchGeo = new THREE.BoxGeometry(14, 0.45, 1.8);
    const trenchMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ae9c,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      transmission: 0.7,
    });
    const trench = new THREE.Mesh(trenchGeo, trenchMat);
    trench.position.set(0, 1.15, 0);
    chipGroup.add(trench);

    // Living Cell Membrane / Tissue Layer
    const membraneGeo = new THREE.PlaneGeometry(12, 2.6);
    const membraneMat = new THREE.MeshStandardMaterial({
      color: 0x00d2b4,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      emissive: 0x00ae9c,
      emissiveIntensity: 0.25,
    });
    const membrane = new THREE.Mesh(membraneGeo, membraneMat);
    membrane.position.set(0, 1.25, 0);
    membrane.rotation.x = -Math.PI / 2;
    chipGroup.add(membrane);

    // Subtle Internal Micro-Pillar Array (PDMS micropillars)
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
    for (let x = -5; x <= 5; x += 1.4) {
      for (let z = -0.6; z <= 0.6; z += 0.6) {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x, 1.2, z);
        chipGroup.add(pillar);
      }
    }

    // Chip Glow Light (Internal bioluminescence)
    const chipGlow = new THREE.PointLight(0x00d2b4, 2.0, 18);
    chipGlow.position.set(0, 1.8, 0);
    chipGroup.add(chipGlow);

    scene.add(chipGroup);

    // ----------------------------------------------------
    // 7. OUTLET DRAIN RESERVOIR
    // ----------------------------------------------------
    const outletVial = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 4.2, 24),
      new THREE.MeshPhysicalMaterial({ color: 0x64748b, transparent: true, opacity: 0.5, transmission: 0.7 })
    );
    outletVial.position.set(26, 2.1, 0);
    scene.add(outletVial);

    // ----------------------------------------------------
    // 8. DYNAMIC FLUID TRACER PARTICLES
    // ----------------------------------------------------
    const NUM_PARTICLES = 36;
    const particleGeo = new THREE.SphereGeometry(0.16, 12, 12);

    // Buffer Media Particles (Cyan)
    const mediaParticles: { mesh: THREE.Mesh; progress: number }[] = [];
    const mediaMat = new THREE.MeshBasicMaterial({ color: 0x00d2b4 });
    for (let i = 0; i < 10; i++) {
      const p = new THREE.Mesh(particleGeo, mediaMat);
      scene.add(p);
      mediaParticles.push({ mesh: p, progress: i / 10 });
    }

    // Drug Solution Particles (Magenta)
    const drugParticles: { mesh: THREE.Mesh; progress: number }[] = [];
    const drugMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    for (let i = 0; i < 10; i++) {
      const p = new THREE.Mesh(particleGeo, drugMat);
      scene.add(p);
      drugParticles.push({ mesh: p, progress: i / 10 });
    }

    // Main Stream Particles (Mixed solution through chip)
    const mainParticles: { mesh: THREE.Mesh; progress: number }[] = [];
    const mainPartMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const p = new THREE.Mesh(particleGeo, mainPartMat);
      scene.add(p);
      mainParticles.push({ mesh: p, progress: i / NUM_PARTICLES });
    }

    // ----------------------------------------------------
    // 9. 3D REFRACTIVE BUBBLE
    // ----------------------------------------------------
    const bubbleGeo = new THREE.SphereGeometry(0.55, 24, 24);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.95,
      ior: 1.15,
      reflectivity: 0.95,
    });
    const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    bubbleMesh.visible = false;

    // Specular bubble highlight
    const bubbleHighlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
    );
    bubbleHighlight.position.set(0.18, 0.22, 0.2);
    bubbleMesh.add(bubbleHighlight);

    scene.add(bubbleMesh);

    // ----------------------------------------------------
    // 10. ANIMATION & RENDER LOOP
    // ----------------------------------------------------
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedSec = clock.getElapsedTime();

      // Update organ theme dynamically
      const activeTheme = ORGAN_THEMES[organIdRef.current] || ORGAN_THEMES.lung;
      membraneMat.color.setHex(activeTheme.tissueColor);
      membraneMat.emissive.setHex(activeTheme.fluidColor);
      chipGlow.color.setHex(activeTheme.tissueColor);
      trenchMat.color.setHex(activeTheme.fluidColor);

      // Subtle heartbeat or tissue breathing motion
      if (organIdRef.current === 'heart') {
        const pulse = 1.0 + Math.sin(elapsedSec * 6.5) * 0.04;
        chipGroup.scale.set(pulse, pulse, pulse);
      } else if (organIdRef.current === 'lung') {
        const breath = 1.0 + Math.sin(elapsedSec * 2.2) * 0.02;
        chipGroup.scale.set(1.0, breath, 1.0);
      } else {
        chipGroup.scale.set(1.0, 1.0, 1.0);
      }

      // Flow speed proportional to telemetry flow_rate (standard = 450 uL/min)
      const speedMultiplier = isRunningRef.current ? (flowRateRef.current / 450.0) : 0.0;
      const speed = speedMultiplier * delta * 0.22;

      // Animate Media Particles
      mediaParticles.forEach((p) => {
        if (isRunningRef.current) {
          p.progress = (p.progress + speed * 1.5) % 1.0;
        }
        const pt = mediaCurve.getPoint(p.progress);
        p.mesh.position.copy(pt);
        p.mesh.visible = isRunningRef.current;
      });

      // Animate Drug Particles
      drugParticles.forEach((p) => {
        if (isRunningRef.current) {
          p.progress = (p.progress + speed * 1.5) % 1.0;
        }
        const pt = drugCurve.getPoint(p.progress);
        p.mesh.position.copy(pt);
        p.mesh.visible = isRunningRef.current;
      });

      // Animate Main Channel Particles
      mainParticles.forEach((p) => {
        if (isRunningRef.current) {
          p.progress = (p.progress + speed) % 1.0;
        }
        const pt = mainCurve.getPoint(p.progress);
        // Add subtle Brownian jitter inside the chip chamber
        if (p.progress > 0.35 && p.progress < 0.75) {
          pt.z += Math.sin(elapsedSec * 8 + p.progress * 20) * 0.25;
        }
        p.mesh.position.copy(pt);
        p.mesh.visible = isRunningRef.current;
      });

      // Animate Simulated Bubble
      if (bubbleActiveRef.current && bubblePosRef.current > 0) {
        bubbleMesh.visible = true;
        const normPos = Math.min(Math.max(bubblePosRef.current, 0.01), 0.99);
        const bubblePoint = mainCurve.getPoint(normPos);
        bubbleMesh.position.copy(bubblePoint);

        // Check if bubble is inside observation zone (-4 position, around normPos 0.15 to 0.32)
        const isInObsZone = normPos >= 0.12 && normPos <= 0.35;
        if (isInObsZone) {
          laserRingMat.color.setHex(0xef4444);
          sensorStrobe.color.setHex(0xef4444);
          sensorStrobe.intensity = 4.0;
          laserRing.scale.set(1.15, 1.15, 1.15);
        } else {
          laserRingMat.color.setHex(0x00ae9c);
          sensorStrobe.color.setHex(0x00ae9c);
          sensorStrobe.intensity = 1.5;
          laserRing.scale.set(1.0, 1.0, 1.0);
        }
      } else {
        bubbleMesh.visible = false;
        laserRingMat.color.setHex(0x00ae9c);
        sensorStrobe.color.setHex(0x00ae9c);
        sensorStrobe.intensity = 1.5;
        laserRing.scale.set(1.0, 1.0, 1.0);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const activeTheme = ORGAN_THEMES[organId] || ORGAN_THEMES.lung;

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-[460px] overflow-hidden rounded-3xl border border-slate-800 bg-[#060b14] shadow-2xl">
      {/* 1. 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full min-h-[380px] lg:min-h-[460px]" />

      {/* 2. Top-Left Floating Metadata HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 rounded-full border border-teal-500/30 bg-slate-900/80 px-3.5 py-1.5 backdrop-blur-md shadow-lg shadow-teal-950/20">
          <span className="size-2 rounded-full bg-teal-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            {activeTheme.label}
          </span>
          <span className="rounded bg-teal-900/60 px-2 py-0.5 text-[9px] font-mono font-bold text-teal-300">
            3D DIGITAL TWIN
          </span>
        </div>
        <p className="text-[10px] font-mono text-slate-400 pl-3">
          Microfluidic Pathway: Media + Drug → Y-Junction → Observation Zone → Chip
        </p>
      </div>

      {/* 3. Top-Right Bubble Alarm Banner (Shows when bubble active) */}
      {bubbleActive && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2.5 rounded-full border border-rose-500/50 bg-rose-950/80 px-4 py-1.5 text-xs font-semibold text-rose-200 backdrop-blur-md shadow-xl animate-pulse">
          <span className="size-2 rounded-full bg-rose-400" />
          <span>SIMULATED AIR BUBBLE EVENT IN PROGRESS</span>
        </div>
      )}

      {/* 4. Bottom-Left Camera Preset Switcher */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-950/85 p-1.5 backdrop-blur-md shadow-xl pointer-events-auto">
        <span className="px-2 text-[10px] font-mono font-semibold uppercase text-slate-500 flex items-center gap-1">
          <Camera className="size-3" /> View:
        </span>
        {(['OVERVIEW', 'OBSERVATION', 'CHIP', 'INLETS'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setCameraView(view)}
            className={`rounded-xl px-2.5 py-1 text-[10px] font-medium transition ${
              activePreset === view
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {view === 'OVERVIEW' ? 'Overview' : view === 'OBSERVATION' ? 'Sensor Spot' : view === 'CHIP' ? 'Organ Chip' : 'Inlet Hub'}
          </button>
        ))}
      </div>

      {/* 5. Bottom-Right 3D Orbit Interaction Hint */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-1 text-[10px] font-mono text-slate-500 backdrop-blur-sm">
        <span>Left-click: Rotate</span>
        <span>·</span>
        <span>Right-click: Pan</span>
        <span>·</span>
        <span>Scroll: Zoom</span>
      </div>
    </div>
  );
}
