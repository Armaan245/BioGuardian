'use client';

/**
 * BioGuardian Virtual Lab - 3D Photorealistic Microfluidic Engine
 *
 * Microfluidic Rig:
 * 1. Dual GL45 Reservoir Bottles: Cell Culture Media (pink/red) & Drug Agent (cyan)
 * 2. 3-Layer Y-Junction Prep & Bubble Trap Chip (CAD media_1790691024153.png):
 *    - Top frosted cover plate with 4 precision drilled apertures (Dual Inlets, Vent, Outlet)
 *    - Middle PDMS slab with glowing cyan microchannel:
 *      * Dual vertical inlet posts
 *      * Y-junction converging arms
 *      * Serpentine square-wave mixing channel
 *      * Vertical cylindrical Bubble Trap Chamber (passive debubbler well)
 *      * Vertical outlet post
 *    - Bottom borosilicate glass slide
 * 3. Connecting FEP Bridge Tubing & Surgical Luer-Lock Fittings
 * 4. High-Magnification Machine-Vision Optical Inspection Camera with status LED ring
 * 5. Refractive 3D Bubble tracking with laser targeting reticle
 * 6. Untouched Dual-Layer Organ-on-Chip (OoC):
 *    - 76x26mm Borosilicate Glass Slide Base
 *    - Clear Optical PDMS Block with chamfer edges
 *    - Micro-Porous Permeable Membrane
 *    - Upper Apical Channel & Lower Vascular Channel
 *    - Dual Side Vacuum Chambers with cyclic physiological breathing actuation
 *    - Dynamic organ tissue luminescence & fluid hue based on organId
 * 7. Downstream CNC Electrochemical Sensor Manifold & Waste Beaker
 * 8. Micro-PIV Particles flowing proportionally to flowRate
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

const ORGAN_THEMES: Record<string, { tissueColor: number; fluidColor: number; label: string }> = {
  lung:   { tissueColor: 0x00d2b4, fluidColor: 0x38bdf8, label: 'LUNG-ON-A-CHIP' },
  heart:  { tissueColor: 0xff4d6d, fluidColor: 0xf43f5e, label: 'HEART-ON-A-CHIP' },
  liver:  { tissueColor: 0x84cc16, fluidColor: 0x65a30d, label: 'LIVER-ON-A-CHIP' },
  kidney: { tissueColor: 0xf97316, fluidColor: 0xea580c, label: 'KIDNEY-ON-A-CHIP' },
  gut:    { tissueColor: 0xeab308, fluidColor: 0xca8a04, label: 'GUT-ON-A-CHIP' },
  brain:  { tissueColor: 0xa855f7, fluidColor: 0x9333ea, label: 'BRAIN-ON-A-CHIP' },
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

  // Animation loop refs
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

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [activePreset, setActivePreset] = useState<'OVERVIEW' | 'RESERVOIRS' | 'BUBBLE_TRAP' | 'OBSERVATION' | 'CHIP'>('OVERVIEW');

  const setCameraView = (view: 'OVERVIEW' | 'RESERVOIRS' | 'BUBBLE_TRAP' | 'OBSERVATION' | 'CHIP') => {
    setActivePreset(view);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (view === 'OVERVIEW') {
      camera.position.set(-2, 12, 52);
      controls.target.set(-2, 0, 0);
    } else if (view === 'RESERVOIRS') {
      camera.position.set(-62, 7, 26);
      controls.target.set(-62, 3, 0);
    } else if (view === 'BUBBLE_TRAP') {
      camera.position.set(-33.5, 6, 24);
      controls.target.set(-33.5, 0, 0);
    } else if (view === 'OBSERVATION') {
      camera.position.set(-12, 4, 20);
      controls.target.set(-12, 0, 0);
    } else if (view === 'CHIP') {
      camera.position.set(21, 6, 24);
      controls.target.set(21, 0, 0);
    }
    controls.update();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1120);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(-2, 12, 52);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 140;
    controls.target.set(-2, 0, 0);
    controlsRef.current = controls;

    // 2. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.25);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(30, 45, 35);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-45, 20, -35);
    scene.add(rimLight);

    const inspectionLight = new THREE.PointLight(0x00f0ff, 2.5, 30);
    inspectionLight.position.set(-12, 6, 0);
    scene.add(inspectionLight);

    const chipAccentLight = new THREE.PointLight(0x38bdf8, 1.8, 35);
    chipAccentLight.position.set(21, 8, 4);
    scene.add(chipAccentLight);

    // 3. OPTICAL BREADBOARD
    const stageGeo = new THREE.BoxGeometry(160, 4.0, 70);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x111c30,
      roughness: 0.35,
      metalness: 0.85,
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.set(0, -4, 0);
    stageMesh.receiveShadow = true;
    scene.add(stageMesh);

    const labGrid = new THREE.GridHelper(600, 60, 0x1e293b, 0x0f172a);
    labGrid.position.y = -12.45;
    scene.add(labGrid);

    // 4. RESERVOIR BOTTLES (Media + Drug)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.94,
      roughness: 0.06,
      transparent: true,
      opacity: 0.65,
    });
    const blueCapMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3 });
    const peekFittingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85 });

    // Media Bottle
    const mediaBottle = new THREE.Group();
    mediaBottle.position.set(-62, -2.0, -10.0);
    mediaBottle.add(new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 9.0, 32), glassMat));
    mediaBottle.children[0].position.y = 4.5;
    const mediaLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(3.3, 3.3, 6.5, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xf43f5e, transmission: 0.75, transparent: true, opacity: 0.85 })
    );
    mediaLiquid.position.y = 3.3;
    mediaBottle.add(mediaLiquid);
    const mediaCap = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.8, 24), blueCapMat);
    mediaCap.position.y = 9.8;
    mediaBottle.add(mediaCap);
    scene.add(mediaBottle);

    // Drug Bottle
    const drugBottle = new THREE.Group();
    drugBottle.position.set(-62, -2.0, 10.0);
    drugBottle.add(new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 8.0, 32), glassMat));
    drugBottle.children[0].position.y = 4.0;
    const drugLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(2.9, 2.9, 5.5, 24),
      new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, transmission: 0.8, transparent: true, opacity: 0.85 })
    );
    drugLiquid.position.y = 2.8;
    drugBottle.add(drugLiquid);
    const drugCap = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.6, 24), blueCapMat);
    drugCap.position.y = 8.6;
    drugBottle.add(drugCap);
    scene.add(drugBottle);

    // Feed tubing
    const tubeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.92,
      roughness: 0.05,
      transparent: true,
      opacity: 0.55,
    });
    const createTubeCurve = (start: THREE.Vector3, mid: THREE.Vector3, end: THREE.Vector3) => {
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      return new THREE.TubeGeometry(curve, 24, 0.45, 12, false);
    };
    scene.add(new THREE.Mesh(createTubeCurve(new THREE.Vector3(-62, 8.8, -10), new THREE.Vector3(-55, 6, -5), new THREE.Vector3(-44, 1.6, -3)), tubeMat));
    scene.add(new THREE.Mesh(createTubeCurve(new THREE.Vector3(-62, 7.8, 10), new THREE.Vector3(-55, 5, 5), new THREE.Vector3(-44, 1.6, 3)), tubeMat));

    // 5. 3-LAYER Y-JUNCTION PREP & BUBBLE TRAP CHIP (CAD media_1790691024153.png)
    const yChipGroup = new THREE.Group();
    const yChipCenterX = -33.5;
    const yChipWidth = 26.0;
    const yChipDepth = 14.0;

    // Bottom Glass Slide
    const yBottomGlass = new THREE.Mesh(
      new THREE.BoxGeometry(yChipWidth, 0.8, yChipDepth),
      new THREE.MeshPhysicalMaterial({ color: 0xecfdf5, transmission: 0.95, roughness: 0.05, transparent: true, opacity: 0.75 })
    );
    yBottomGlass.position.set(yChipCenterX, -1.6, 0);
    yChipGroup.add(yBottomGlass);

    // Middle PDMS Slab
    const yPdmsBody = new THREE.Mesh(
      new THREE.BoxGeometry(yChipWidth, 2.4, yChipDepth),
      new THREE.MeshPhysicalMaterial({ color: 0xf0fdfa, transmission: 0.94, roughness: 0.08, transparent: true, opacity: 0.45 })
    );
    yPdmsBody.position.set(yChipCenterX, 0, 0);
    yChipGroup.add(yPdmsBody);

    // Internal Cyan Channels
    const cyanMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      transmission: 0.6,
      transparent: true,
      opacity: 0.92,
    });
    // Inlets
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.3, 20), cyanMat);
    p1.position.set(yChipCenterX - 10.5, 0.2, -3.0);
    yChipGroup.add(p1);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.3, 20), cyanMat);
    p2.position.set(yChipCenterX - 10.5, 0.2, 3.0);
    yChipGroup.add(p2);
    // Y-Arms
    const ya1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 0.9), cyanMat);
    ya1.position.set(yChipCenterX - 8.2, 0, -1.5);
    ya1.rotation.y = 0.62;
    yChipGroup.add(ya1);
    const ya2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 0.9), cyanMat);
    ya2.position.set(yChipCenterX - 8.2, 0, 1.5);
    ya2.rotation.y = -0.62;
    yChipGroup.add(ya2);
    // Serpentine square-wave channel
    const mX = yChipCenterX - 6.0;
    const addSeg = (w: number, d: number, px: number, pz: number) => {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, 0.65, d), cyanMat);
      seg.position.set(px, 0, pz);
      yChipGroup.add(seg);
    };
    addSeg(1.5, 0.9, mX + 0.75, 0);
    addSeg(0.9, 3.8, mX + 1.5, 1.4);
    addSeg(1.8, 0.9, mX + 2.4, 2.8);
    addSeg(0.9, 5.6, mX + 3.3, 0);
    addSeg(1.8, 0.9, mX + 4.2, -2.8);
    addSeg(0.9, 5.6, mX + 5.1, 0);
    addSeg(1.8, 0.9, mX + 6.0, 2.8);
    addSeg(0.9, 3.8, mX + 6.9, 1.4);
    addSeg(2.2, 0.9, mX + 8.0, 0);

    // Bubble Trap Cylinder
    const bTrap = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.2, 32), cyanMat);
    bTrap.position.set(yChipCenterX + 4.2, 0.2, 0);
    yChipGroup.add(bTrap);

    // Exit Conduit & Outlet
    const exitC = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.65, 0.9), cyanMat);
    exitC.position.set(yChipCenterX + 7.3, 0, 0);
    yChipGroup.add(exitC);
    const outP = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.3, 20), cyanMat);
    outP.position.set(yChipCenterX + 10.0, 0.2, 0);
    yChipGroup.add(outP);

    // Top Cover Plate with 4 Port Apertures
    const yTopCover = new THREE.Mesh(
      new THREE.BoxGeometry(yChipWidth, 0.55, yChipDepth),
      new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, transmission: 0.88, roughness: 0.15, transparent: true, opacity: 0.82 })
    );
    yTopCover.position.set(yChipCenterX, 1.5, 0);
    yChipGroup.add(yTopCover);

    const createPortRing = (px: number, pz: number, r = 0.75) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.7, r, 24), new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(px, 1.78, pz);
      return ring;
    };
    yChipGroup.add(createPortRing(yChipCenterX - 10.5, -3.0));
    yChipGroup.add(createPortRing(yChipCenterX - 10.5, 3.0));
    yChipGroup.add(createPortRing(yChipCenterX + 4.2, 0, 1.8));
    yChipGroup.add(createPortRing(yChipCenterX + 10.0, 0));
    scene.add(yChipGroup);

    // 6. BRIDGE TUBE & OPTICAL CAMERA
    const obsX = -12.0;
    const bridgeTube = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 23.5, 24), tubeMat);
    bridgeTube.geometry.rotateZ(Math.PI / 2);
    bridgeTube.position.set(-11.75, 0, 0);
    scene.add(bridgeTube);

    // Camera Assembly
    const camHousing = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 6.5, 32), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 }));
    camHousing.position.set(obsX, 8.5, 0);
    scene.add(camHousing);

    const ledRingMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.5 });
    const ledRing = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.18, 16, 32), ledRingMat);
    ledRing.position.set(obsX, 5.4, 0);
    ledRing.rotation.x = Math.PI / 2;
    scene.add(ledRing);

    // Laser Beam & Target Ring
    const laserBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2, 16), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45 }));
    laserBeam.position.set(obsX, 2.4, 0);
    laserBeam.visible = false;
    scene.add(laserBeam);

    const targetRing = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.06, 16, 48), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 }));
    targetRing.rotation.x = Math.PI / 2;
    targetRing.position.set(obsX, 0, 0);
    targetRing.visible = false;
    scene.add(targetRing);

    // Bubble Mesh
    const bubbleMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 32, 32),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.97, roughness: 0.03, ior: 1.15, transparent: true, opacity: 0.92 })
    );
    bubbleMesh.position.set(obsX, 0, 0);
    bubbleMesh.visible = false;
    scene.add(bubbleMesh);

    // 7. UNTOUCHED DUAL-LAYER ORGAN-ON-CHIP (OoC)
    const chipCenterX = 21.0;
    const oocGroup = new THREE.Group();

    // Slide Base
    const oocSlide = new THREE.Mesh(
      new THREE.BoxGeometry(50, 1.2, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xecfdf5, transmission: 0.95, roughness: 0.04, transparent: true, opacity: 0.65 })
    );
    oocSlide.position.set(chipCenterX, -3.3, 0);
    oocGroup.add(oocSlide);

    // PDMS Body
    const oocBody = new THREE.Mesh(
      new THREE.BoxGeometry(40, 5.4, 20),
      new THREE.MeshPhysicalMaterial({ color: 0xf0fdfa, transmission: 0.97, roughness: 0.03, transparent: true, opacity: 0.42 })
    );
    oocBody.position.set(chipCenterX, 0, 0);
    oocGroup.add(oocBody);

    // Membrane
    const membrane = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 9.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, transparent: true, opacity: 0.88, side: THREE.DoubleSide })
    );
    membrane.rotation.x = -Math.PI / 2;
    membrane.position.set(chipCenterX, 0, 0);
    oocGroup.add(membrane);

    // Upper Channel (Tissue Luminescence)
    const upperChMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.88,
    });
    const upperMain = new THREE.Mesh(new THREE.BoxGeometry(24, 1.15, 2.6), upperChMat);
    upperMain.position.set(chipCenterX, 0.8, 0);
    oocGroup.add(upperMain);

    // Lower Vascular Channel
    const lowerChMat = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      emissive: 0xc2410c,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.88,
    });
    const lowerMain = new THREE.Mesh(new THREE.BoxGeometry(24, 1.15, 2.6), lowerChMat);
    lowerMain.position.set(chipCenterX, -0.8, 0);
    oocGroup.add(lowerMain);

    // Vacuum Side Chambers
    const sideChamberMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, transmission: 0.82, transparent: true, opacity: 0.45 });
    const scLeft = new THREE.Mesh(new THREE.BoxGeometry(22, 3.4, 2.2), sideChamberMat);
    scLeft.position.set(chipCenterX, 0, -4.8);
    oocGroup.add(scLeft);
    const scRight = new THREE.Mesh(new THREE.BoxGeometry(22, 3.4, 2.2), sideChamberMat);
    scRight.position.set(chipCenterX, 0, 4.8);
    oocGroup.add(scRight);

    scene.add(oocGroup);

    // 8. DOWNSTREAM SENSOR MANIFOLD & WASTE
    const manifold = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 8), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.88 }));
    manifold.position.set(50, 0.5, 0);
    scene.add(manifold);

    const wasteBeaker = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.2, 9, 32), glassMat);
    wasteBeaker.position.set(64, 2.5, 0);
    scene.add(wasteBeaker);

    // 9. TRACER PARTICLES
    const P_COUNT = 150;
    const pPos = new Float32Array(P_COUNT * 3);
    const pProg = new Float32Array(P_COUNT);
    const pSpeed = new Float32Array(P_COUNT);
    const pY = new Float32Array(P_COUNT);
    const pZ = new Float32Array(P_COUNT);
    for (let i = 0; i < P_COUNT; i++) {
      pProg[i] = Math.random();
      pSpeed[i] = 0.85 + Math.random() * 0.35;
      pY[i] = (Math.random() - 0.5) * 0.8;
      pZ[i] = (Math.random() - 0.5) * 0.8;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.85, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
    const pPoints = new THREE.Points(pGeo, pMat);
    scene.add(pPoints);

    // 10. ANIMATION LOOP
    let animId: number;
    let clock = new THREE.Clock();
    let localBubbleX = obsX - 8.0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Dynamic organ theme update
      const currentTheme = ORGAN_THEMES[organIdRef.current] || ORGAN_THEMES.lung;
      upperChMat.color.setHex(currentTheme.tissueColor);
      upperChMat.emissive.setHex(currentTheme.fluidColor);
      chipAccentLight.color.setHex(currentTheme.tissueColor);

      // Particle movement
      const speedFactor = Math.max(0.05, Math.min(flowRateRef.current / 450.0, 2.5));
      const posArr = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < P_COUNT; i++) {
        if (isRunningRef.current) {
          pProg[i] += delta * 0.14 * speedFactor * pSpeed[i];
          if (pProg[i] > 1.0) pProg[i] = 0.0;
        }
        const currX = -45.0 + pProg[i] * (chipCenterX + 16.0 - (-45.0));
        let currY = pY[i];
        let currZ = pZ[i];
        if (currX > 0) {
          currY = 0.8 + pY[i] * 0.35;
          currZ = pZ[i] * 0.7;
        }
        posArr[i * 3 + 0] = currX;
        posArr[i * 3 + 1] = currY;
        posArr[i * 3 + 2] = currZ;
      }
      pGeo.attributes.position.needsUpdate = true;

      // Breathing actuation
      const breath = Math.sin(time * 2.4);
      scLeft.scale.z = 1.0 + breath * 0.05;
      scRight.scale.z = 1.0 + breath * 0.05;
      membrane.position.y = breath * 0.025;

      // Bubble motion
      if (bubbleActiveRef.current) {
        bubbleMesh.visible = true;
        targetRing.visible = true;
        laserBeam.visible = true;
        ledRingMat.color.setHex(0xef4444);
        ledRingMat.emissive.setHex(0xef4444);
        inspectionLight.color.setHex(0xef4444);

        localBubbleX += delta * 6.0 * speedFactor;
        if (localBubbleX > 1.5) localBubbleX = obsX - 8.0;
        bubbleMesh.position.x = localBubbleX;
        bubbleMesh.position.y = Math.sin(time * 6) * 0.12;
      } else {
        bubbleMesh.visible = false;
        targetRing.visible = false;
        laserBeam.visible = false;
        ledRingMat.color.setHex(0x00f0ff);
        ledRingMat.emissive.setHex(0x00f0ff);
        inspectionLight.color.setHex(0x00f0ff);
        localBubbleX = obsX - 8.0;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[480px] lg:h-[540px] rounded-3xl overflow-hidden border border-slate-800/90 bg-[#0a1120] shadow-2xl">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Viewport Overlay: Active Organ Tag */}
      <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2">
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
          <span className="size-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            {ORGAN_THEMES[organId]?.label || 'ORGAN-ON-A-CHIP'}
          </span>
          <span className="text-[10px] font-mono text-teal-400 border border-teal-800/50 bg-teal-950/60 px-1.5 py-0.5 rounded">
            {flowRate} µL/min
          </span>
        </div>
      </div>

      {/* Floating Viewport Overlay: Camera Presets Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 p-1.5 rounded-2xl shadow-xl flex items-center gap-1 z-10 pointer-events-auto">
        <div className="px-2 py-1 text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
          <Camera className="size-3 text-teal-400" /> Views:
        </div>
        {[
          ['OVERVIEW', 'Full Rig'],
          ['RESERVOIRS', 'Bottles'],
          ['BUBBLE_TRAP', 'Y-Trap Chip'],
          ['OBSERVATION', 'Camera'],
          ['CHIP', 'Organ Chip'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCameraView(key as any)}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
              activePreset === key
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
