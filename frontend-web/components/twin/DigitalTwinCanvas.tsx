'use client';

/**
 * BioGuardian 3D Digital Twin - Photorealistic Microfluidic Engine
 *
 * Full CAD/Physical Layout matching BioGuardian Engineering Schematics:
 * 1. RESERVOIR BOTTLES (Right): Cell Media & Drug/Reagent with blue caps & 90° pickup tubes
 * 2. PREP & BUBBLE TRAP CHIP (Middle-Right): 3-layer laminated cartridge with dual vertical inlets,
 *    Y-junction mixer, serpentine chaotic channel, and central passive bubble trap/vent well
 * 3. CELL CULTURE CHIP (Center): High-fidelity 76x26mm Organ-on-Chip with microporous membrane,
 *    upper apical chamber, lower vascular channel, and organ-specific tissue morphology
 * 4. SENSOR MANIFOLD (Left): CNC bronze block with vertical electrochemical sensor probe (pH, DO & Flow)
 * 5. EFFLUENT DRAIN: Outflow tube directed TO WASTE
 *
 * Supports both:
 * - Live Hardware Digital Twin (ESP32 Telemetry & Camera Inspection)
 * - Virtual Lab In-Silico Simulation (Organ Selection, Dynamic Parameter Ticks & Bubble Trapping)
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTelemetry } from '@/lib/telemetry/TelemetryContext';
import { CameraPreset } from '@/lib/telemetry/types';

// Organ Theme Palettes for the 3D Cell Culture Chip
const ORGAN_THEMES: Record<string, { tissueColor: number; fluidColor: number; label: string }> = {
  lung:   { tissueColor: 0x00d2b4, fluidColor: 0x00ae9c, label: 'LUNG-ON-A-CHIP' },
  heart:  { tissueColor: 0xff4d6d, fluidColor: 0xf43f5e, label: 'HEART-ON-A-CHIP' },
  liver:  { tissueColor: 0x84cc16, fluidColor: 0x65a30d, label: 'LIVER-ON-A-CHIP' },
  kidney: { tissueColor: 0xf97316, fluidColor: 0xea580c, label: 'KIDNEY-ON-A-CHIP' },
  gut:    { tissueColor: 0xeab308, fluidColor: 0xca8a04, label: 'GUT-ON-A-CHIP' },
  brain:  { tissueColor: 0xa855f7, fluidColor: 0x9333ea, label: 'BRAIN-ON-A-CHIP' },
};

export function DigitalTwinCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    telemetry,
    cameraPreset,
    setCameraPreset,
    showBubbleSpotVisual,
    environmentMode,
    virtualLabOrgan,
    virtualLabParams,
    isSimulating,
    simulatedBubbleActive,
    simulatedBubblePos,
  } = useTelemetry();

  // Active state refs for render loop
  const telemetryRef = useRef(telemetry);
  useEffect(() => { telemetryRef.current = telemetry; }, [telemetry]);

  const presetRef = useRef<CameraPreset>(cameraPreset);
  useEffect(() => { presetRef.current = cameraPreset; }, [cameraPreset]);

  const bubbleSpotRef = useRef(showBubbleSpotVisual);
  useEffect(() => { bubbleSpotRef.current = showBubbleSpotVisual; }, [showBubbleSpotVisual]);

  const envModeRef = useRef(environmentMode);
  useEffect(() => { envModeRef.current = environmentMode; }, [environmentMode]);

  const organRef = useRef(virtualLabOrgan);
  useEffect(() => { organRef.current = virtualLabOrgan; }, [virtualLabOrgan]);

  const isSimRef = useRef(isSimulating);
  useEffect(() => { isSimRef.current = isSimulating; }, [isSimulating]);

  const simBubbleActiveRef = useRef(simulatedBubbleActive);
  useEffect(() => { simBubbleActiveRef.current = simulatedBubbleActive; }, [simulatedBubbleActive]);

  const simBubblePosRef = useRef(simulatedBubblePos);
  useEffect(() => { simBubblePosRef.current = simulatedBubblePos; }, [simulatedBubblePos]);

  const virtParamsRef = useRef(virtualLabParams);
  useEffect(() => { virtParamsRef.current = virtualLabParams; }, [virtualLabParams]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ==========================================
    // 1. THREE.JS SCENE SETUP
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070c16);
    scene.fog = new THREE.FogExp2(0x070c16, 0.005);

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 24, 62);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 140;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.target.set(0, 1.5, 0);

    // ==========================================
    // 2. STUDIO LABORATORY LIGHTING RIG
    // ==========================================
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x111c2e, 1.6);
    scene.add(hemiLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    mainKeyLight.position.set(30, 60, 45);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.bias = -0.0001;
    scene.add(mainKeyLight);

    const frontFillLight = new THREE.DirectionalLight(0xcfd8dc, 1.6);
    frontFillLight.position.set(-20, 25, 45);
    scene.add(frontFillLight);

    const cyanRim = new THREE.DirectionalLight(0x00f0ff, 2.0);
    cyanRim.position.set(-45, 10, -35);
    scene.add(cyanRim);

    const purpleGlow = new THREE.PointLight(0xa855f7, 2.2, 45);
    purpleGlow.position.set(38, 12, 10);
    scene.add(purpleGlow);

    // ==========================================
    // 3. OPTICAL BREADBOARD LABORATORY STAGE
    // ==========================================
    const stageGroup = new THREE.Group();
    const breadboardWidth = 140;
    const breadboardDepth = 48;
    const breadboardGeo = new THREE.BoxGeometry(breadboardWidth, 2.4, breadboardDepth);
    const breadboardMat = new THREE.MeshStandardMaterial({
      color: 0x131f33,
      metalness: 0.88,
      roughness: 0.28,
    });
    const breadboard = new THREE.Mesh(breadboardGeo, breadboardMat);
    breadboard.position.y = -1.2;
    breadboard.receiveShadow = true;
    stageGroup.add(breadboard);

    // Grid Holes Texture on Breadboard
    const gridHelper = new THREE.GridHelper(breadboardWidth - 4, 35, 0x1e3a5f, 0x0f2238);
    gridHelper.position.y = 0.02;
    stageGroup.add(gridHelper);

    // Vibration Isolation Feet
    [-(breadboardWidth / 2 - 8), breadboardWidth / 2 - 8].forEach((posX) => {
      [-18, 18].forEach((posZ) => {
        const footGeo = new THREE.CylinderGeometry(2.4, 2.8, 2.6, 24);
        const footMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.2 });
        const foot = new THREE.Mesh(footGeo, footMat);
        foot.position.set(posX, -2.5, posZ);
        stageGroup.add(foot);
      });
    });

    scene.add(stageGroup);

    // Materials Library
    const tubingMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.94,
      roughness: 0.05,
      metalness: 0.02,
      ior: 1.45,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    const blueFluidMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d4c8,
      transmission: 0.82,
      roughness: 0.1,
      metalness: 0.05,
      ior: 1.333,
      transparent: true,
      opacity: 0.65,
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.95,
      roughness: 0.2,
    });

    // Helper: Create 90° Elbow Tube Segment
    const createTubeFromPoints = (points: THREE.Vector3[], radius = 0.42, mat = tubingMat) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, 40, radius, 16, false);
      return new THREE.Mesh(geo, mat);
    };

    // ==========================================
    // 4. RESERVOIR BOTTLES (Right: x ~ 48)
    // Cell Media (Bottle 1) & Drug/Reagent (Bottle 2)
    // ==========================================
    const reservoirsGroup = new THREE.Group();
    reservoirsGroup.name = 'RESERVOIRS';

    const bottleGeo = new THREE.CylinderGeometry(3.2, 3.4, 9.5, 32);
    const bottleGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.55,
      transmission: 0.85,
      roughness: 0.1,
      ior: 1.5,
    });

    const bottleCapGeo = new THREE.CylinderGeometry(3.5, 3.5, 1.8, 32);
    const blueCapMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.35,
      metalness: 0.2,
    });

    // Bottle 1: Cell Media Bottle (Pinkish/Red fluid)
    const mediaBottle = new THREE.Mesh(bottleGeo, bottleGlassMat);
    mediaBottle.position.set(48, 4.75, -8);
    reservoirsGroup.add(mediaBottle);

    const mediaFluidGeo = new THREE.CylinderGeometry(3.0, 3.2, 7.5, 24);
    const mediaFluidMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.6,
      transmission: 0.75,
    });
    const mediaFluid = new THREE.Mesh(mediaFluidGeo, mediaFluidMat);
    mediaFluid.position.set(48, 3.75, -8);
    reservoirsGroup.add(mediaFluid);

    const mediaCap = new THREE.Mesh(bottleCapGeo, blueCapMat);
    mediaCap.position.set(48, 10.2, -8);
    reservoirsGroup.add(mediaCap);

    // Bottle 2: Drug / Reagent Bottle (Clear / Cyan fluid)
    const drugBottle = new THREE.Mesh(bottleGeo, bottleGlassMat);
    drugBottle.position.set(48, 4.75, 8);
    reservoirsGroup.add(drugBottle);

    const drugFluidMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.6,
      transmission: 0.75,
    });
    const drugFluid = new THREE.Mesh(mediaFluidGeo, drugFluidMat);
    drugFluid.position.set(48, 3.75, 8);
    reservoirsGroup.add(drugFluid);

    const drugCap = new THREE.Mesh(bottleCapGeo, blueCapMat);
    drugCap.position.set(48, 10.2, 8);
    reservoirsGroup.add(drugCap);

    // 90° Overhead Rigid Inflow Tubing from Bottles down to Prep Chip
    // Media Tube: from bottle (48, 11, -8) -> up to (48, 16, -8) -> bend to (36, 16, -4) -> down to Prep Chip inlet (36, 1.8, -4)
    const mediaTubeMesh = createTubeFromPoints([
      new THREE.Vector3(48, 10.5, -8),
      new THREE.Vector3(48, 15.5, -8),
      new THREE.Vector3(38, 15.5, -8),
      new THREE.Vector3(38, 14.0, -3.2),
      new THREE.Vector3(34, 4.5, -3.2),
      new THREE.Vector3(34, 1.6, -3.2),
    ], 0.45);
    reservoirsGroup.add(mediaTubeMesh);

    // Drug Tube: from bottle (48, 11, 8) -> up to (48, 14, 8) -> bend to (36, 14, 4) -> down to Prep Chip inlet (36, 1.8, 4)
    const drugTubeMesh = createTubeFromPoints([
      new THREE.Vector3(48, 10.5, 8),
      new THREE.Vector3(48, 13.5, 8),
      new THREE.Vector3(38, 13.5, 8),
      new THREE.Vector3(38, 12.0, 3.2),
      new THREE.Vector3(34, 4.5, 3.2),
      new THREE.Vector3(34, 1.6, 3.2),
    ], 0.45);
    reservoirsGroup.add(drugTubeMesh);

    scene.add(reservoirsGroup);

    // ==========================================
    // 5. PREP & BUBBLE TRAP CHIP (Middle-Right: x ~ 22)
    // 3-Layer Cartridge: Dual Inlets, Y-Mixer, Serpentine Channel, Passive Vent Well
    // ==========================================
    const prepChipGroup = new THREE.Group();
    prepChipGroup.name = 'BUBBLE_TRAP';
    const prepX = 22.0;

    // Cartridge Base: Soft Greenish/Teal Tinted Glass/PDMS (matching Image 1 & 2)
    const prepWidth = 28;
    const prepDepth = 12;
    const prepHeight = 2.4;

    const prepMat = new THREE.MeshPhysicalMaterial({
      color: 0xccfbf1,
      transparent: true,
      opacity: 0.68,
      transmission: 0.88,
      roughness: 0.08,
      metalness: 0.04,
      ior: 1.48,
    });
    const prepBody = new THREE.Mesh(new THREE.BoxGeometry(prepWidth, prepHeight, prepDepth), prepMat);
    prepBody.position.set(prepX, prepHeight / 2, 0);
    prepBody.castShadow = true;
    prepChipGroup.add(prepBody);

    // Stainless Inflow Gaskets on top surface for the 2 inlet ports
    [-3.2, 3.2].forEach((zOff) => {
      const portGasket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 0.8, 20),
        steelMat
      );
      portGasket.position.set(34, prepHeight + 0.4, zOff);
      prepChipGroup.add(portGasket);
    });

    // Internal Channel: Dual Inlets -> Y-Junction -> Serpentine Mixer -> Bubble Trap Well -> Outlet
    // A. Y-Junction Channel
    const yMixChannelMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d4c8,
      emissive: 0x0f766e,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    });

    // Inflow Channels converging at Y
    const yBranch1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 0.6), yMixChannelMat);
    yBranch1.position.set(31.5, prepHeight / 2, -1.8);
    yBranch1.rotation.y = 0.45;
    prepChipGroup.add(yBranch1);

    const yBranch2 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 0.6), yMixChannelMat);
    yBranch2.position.set(31.5, prepHeight / 2, 1.8);
    yBranch2.rotation.y = -0.45;
    prepChipGroup.add(yBranch2);

    // B. Serpentine Chaotic Mixing Channel (Square zigzag pattern between x=28 and x=22)
    const serpentineGroup = new THREE.Group();
    const zigzags = [
      [-1.8, 1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, -1.8]
    ];
    let currX = 29.0;
    zigzags.forEach(([z1, z2], idx) => {
      const zBar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, Math.abs(z2 - z1)), yMixChannelMat);
      zBar.position.set(currX, prepHeight / 2, (z1 + z2) / 2);
      serpentineGroup.add(zBar);

      const xBar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.5), yMixChannelMat);
      xBar.position.set(currX - 0.7, prepHeight / 2, z2);
      serpentineGroup.add(xBar);
      currX -= 1.4;
    });
    prepChipGroup.add(serpentineGroup);

    // C. Vertical Cylindrical Bubble Trap Chamber / Passive Vent Well (at x = 20)
    const ventWellRadius = 2.4;
    const ventWellGeo = new THREE.CylinderGeometry(ventWellRadius, ventWellRadius, prepHeight + 0.2, 32);
    const ventWellMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      transmission: 0.85,
    });
    const ventWell = new THREE.Mesh(ventWellGeo, ventWellMat);
    ventWell.position.set(20.0, prepHeight / 2, 0);
    prepChipGroup.add(ventWell);

    // Vent Aperture Ring on top of cartridge
    const ventApertureRing = new THREE.Mesh(
      new THREE.TorusGeometry(ventWellRadius, 0.2, 16, 32),
      steelMat
    );
    ventApertureRing.position.set(20.0, prepHeight + 0.1, 0);
    ventApertureRing.rotation.x = Math.PI / 2;
    prepChipGroup.add(ventApertureRing);

    // Passive Hydrophobic Gas Vent Membrane Filter Disc
    const ventFilter = new THREE.Mesh(
      new THREE.CircleGeometry(ventWellRadius - 0.2, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    ventFilter.position.set(20.0, prepHeight - 0.1, 0);
    ventFilter.rotation.x = -Math.PI / 2;
    prepChipGroup.add(ventFilter);

    // Outflow Channel from Bubble Trap Well to chip exit (x = 10)
    const outChannel = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 0.6), yMixChannelMat);
    outChannel.position.set(15.0, prepHeight / 2, 0);
    prepChipGroup.add(outChannel);

    // Outlet Port Collar at x = 10
    const prepOutletCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.8, 20),
      steelMat
    );
    prepOutletCollar.position.set(10.0, prepHeight + 0.4, 0);
    prepChipGroup.add(prepOutletCollar);

    scene.add(prepChipGroup);

    // Bridge Tubing: connecting Prep Chip Outlet (x=10) to Cell Culture Chip Inlet (x=2)
    const prepToOocTube = createTubeFromPoints([
      new THREE.Vector3(10.0, prepHeight + 0.4, 0),
      new THREE.Vector3(10.0, prepHeight + 2.4, 0),
      new THREE.Vector3(2.0, prepHeight + 2.4, 0),
      new THREE.Vector3(2.0, 1.8, 0),
    ], 0.42);
    scene.add(prepToOocTube);

    // ==========================================
    // 6. CELL CULTURE CHIP (Center: x ~ -8 to +2)
    // The High-Fidelity Organ-on-Chip (Kept identical as requested)
    // Borosilicate slide, PDMS block, micro-porous membrane, cell culture layer
    // ==========================================
    const oocGroup = new THREE.Group();
    oocGroup.name = 'ORGAN_ON_CHIP';
    const oocCenterX = -5.0;
    const oocWidth = 26;
    const oocDepth = 12;
    const oocHeight = 3.2;

    // A. Microscope Slide Base
    const oocSlide = new THREE.Mesh(
      new THREE.BoxGeometry(oocWidth + 6, 0.8, oocDepth + 2),
      new THREE.MeshPhysicalMaterial({ color: 0xecfdf5, transmission: 0.95, roughness: 0.05, opacity: 0.7, transparent: true })
    );
    oocSlide.position.set(oocCenterX, 0.4, 0);
    oocSlide.receiveShadow = true;
    oocGroup.add(oocSlide);

    // B. Clear PDMS Elastomer Body
    const oocBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0fdfa,
      transmission: 0.96,
      roughness: 0.04,
      metalness: 0.02,
      ior: 1.43,
      transparent: true,
      opacity: 0.45,
    });
    const oocBody = new THREE.Mesh(new THREE.BoxGeometry(oocWidth, oocHeight, oocDepth), oocBodyMat);
    oocBody.position.set(oocCenterX, oocHeight / 2 + 0.8, 0);
    oocBody.castShadow = true;
    oocGroup.add(oocBody);

    // C. Micro-Porous Permeable Membrane (Cell culture interface)
    const oocMembrane = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 5.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    oocMembrane.position.set(oocCenterX, oocHeight / 2 + 0.8, 0);
    oocMembrane.rotation.x = -Math.PI / 2;
    oocGroup.add(oocMembrane);

    // D. Upper Apical Cell Culture Channel (Organ Tissue Layer)
    const cellChamberGeo = new THREE.BoxGeometry(16, 0.6, 3.2);
    const cellChamberMat = new THREE.MeshStandardMaterial({
      color: 0x00d2b4,
      emissive: 0x00ae9c,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.8,
    });
    const cellChamber = new THREE.Mesh(cellChamberGeo, cellChamberMat);
    cellChamber.position.set(oocCenterX, oocHeight / 2 + 1.2, 0);
    oocGroup.add(cellChamber);

    // E. Lower Vascular Shear Flow Channel
    const vascChamberMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xc2410c,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.75,
    });
    const vascChamber = new THREE.Mesh(cellChamberGeo, vascChamberMat);
    vascChamber.position.set(oocCenterX, oocHeight / 2 + 0.4, 0);
    oocGroup.add(vascChamber);

    // Inlet and Outlet Ports on OoC
    const oocInletCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.8, 20), steelMat);
    oocInletCollar.position.set(2.0, oocHeight + 1.0, 0);
    oocGroup.add(oocInletCollar);

    const oocOutletCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.8, 20), steelMat);
    oocOutletCollar.position.set(oocCenterX - 11.0, oocHeight + 1.0, 0);
    oocGroup.add(oocOutletCollar);

    // Organ-on-Chip Glow Light
    const chipGlow = new THREE.PointLight(0x00d2b4, 1.8, 25);
    chipGlow.position.set(oocCenterX, 3.5, 0);
    oocGroup.add(chipGlow);

    scene.add(oocGroup);

    // Bridge Tubing: connecting Cell Culture Chip Outlet (x=-16) to Sensor Manifold (x=-26)
    const oocToSensorTube = createTubeFromPoints([
      new THREE.Vector3(oocCenterX - 11.0, oocHeight + 1.0, 0),
      new THREE.Vector3(oocCenterX - 11.0, oocHeight + 2.2, 0),
      new THREE.Vector3(-25.0, oocHeight + 2.2, 0),
      new THREE.Vector3(-25.0, 3.2, 0),
    ], 0.42);
    scene.add(oocToSensorTube);

    // ==========================================
    // 7. SENSOR MANIFOLD (Left: x ~ -28)
    // Bronze Block with Electrochemical Sensor Probe (pH, DO & Flow)
    // ==========================================
    const sensorGroup = new THREE.Group();
    sensorGroup.name = 'SENSOR_MANIFOLD';
    const sensorX = -28.0;

    // Solid Bronze/Copper CNC Manifold Block (matching Image 1)
    const manifoldGeo = new THREE.BoxGeometry(9.5, 6.0, 9.5);
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Rich bronze/copper
      metalness: 0.85,
      roughness: 0.35,
    });
    const manifoldBlock = new THREE.Mesh(manifoldGeo, bronzeMat);
    manifoldBlock.position.set(sensorX, 3.0, 0);
    manifoldBlock.castShadow = true;
    sensorGroup.add(manifoldBlock);

    // Sensor Probe Well Collar (Black / Dark Slate)
    const probeCollarGeo = new THREE.CylinderGeometry(2.4, 2.6, 1.4, 32);
    const probeCollarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const probeCollar = new THREE.Mesh(probeCollarGeo, probeCollarMat);
    probeCollar.position.set(sensorX, 6.7, 0);
    sensorGroup.add(probeCollar);

    // Vertical Electrochemical Sensor Probe Stanchion
    const probeTipGeo = new THREE.CylinderGeometry(1.3, 1.3, 7.5, 32);
    const probeTipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 });
    const probeTip = new THREE.Mesh(probeTipGeo, probeTipMat);
    probeTip.position.set(sensorX, 10.5, 0);
    sensorGroup.add(probeTip);

    // Probe Top Cable Strain Relief
    const cableRelief = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.1, 1.8, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
    );
    cableRelief.position.set(sensorX, 14.8, 0);
    sensorGroup.add(cableRelief);

    // Sensor Status Telemetry Ring (Teal -> Red on bubble/alert)
    const sensorRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const sensorRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.1, 16, 32), sensorRingMat);
    sensorRing.position.set(sensorX, 7.5, 0);
    sensorRing.rotation.x = Math.PI / 2;
    sensorGroup.add(sensorRing);

    // Effluent Discharge Tube: Exiting left side marked "TO WASTE"
    const wasteTube = createTubeFromPoints([
      new THREE.Vector3(sensorX - 4.75, 2.5, 0),
      new THREE.Vector3(sensorX - 16.0, 2.5, 0),
      new THREE.Vector3(sensorX - 22.0, 0.5, 0),
    ], 0.45);
    sensorGroup.add(wasteTube);

    // Effluent Waste Container on table edge
    const wasteBeaker = new THREE.Mesh(
      new THREE.CylinderGeometry(3.0, 3.4, 6.5, 24),
      new THREE.MeshPhysicalMaterial({ color: 0x64748b, transparent: true, opacity: 0.45, transmission: 0.7 })
    );
    wasteBeaker.position.set(sensorX - 22.0, 3.25, 0);
    sensorGroup.add(wasteBeaker);

    scene.add(sensorGroup);

    // ==========================================
    // 8. FLOW PATH SPLINE & TRACER PARTICLES
    // Continuous trajectory through the whole system
    // ==========================================
    const fullFlowPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(48, 10.5, -8),
      new THREE.Vector3(38, 15.5, -8),
      new THREE.Vector3(34, 1.8, -3.2),  // Prep inlet
      new THREE.Vector3(29, 1.2, 0),     // Serpentine
      new THREE.Vector3(20, 1.2, 0),     // Bubble Trap Well
      new THREE.Vector3(10, 2.4, 0),     // Prep outlet
      new THREE.Vector3(2.0, 2.4, 0),    // OoC inlet
      new THREE.Vector3(-5.0, 2.4, 0),   // OoC center
      new THREE.Vector3(-16.0, 2.4, 0),  // OoC outlet
      new THREE.Vector3(-28.0, 3.0, 0),  // Sensor manifold
      new THREE.Vector3(-44.0, 1.0, 0),  // Waste
    ]);

    const NUM_TRACERS = 60;
    const tracerGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const tracerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const tracers: { mesh: THREE.Mesh; progress: number }[] = [];

    for (let i = 0; i < NUM_TRACERS; i++) {
      const mesh = new THREE.Mesh(tracerGeo, tracerMat);
      scene.add(mesh);
      tracers.push({ mesh, progress: i / NUM_TRACERS });
    }

    // ==========================================
    // 9. DYNAMIC 3D REFRACTIVE BUBBLE
    // ==========================================
    const bubbleGeo = new THREE.SphereGeometry(0.7, 24, 24);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      transmission: 0.95,
      roughness: 0.05,
      ior: 1.15,
      reflectivity: 0.9,
    });
    const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    bubbleMesh.visible = false;
    scene.add(bubbleMesh);

    // ==========================================
    // 10. RENDER LOOP & REAL-TIME ANIMATION
    // ==========================================
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Flow rate determination
      const isLiveHardware = envModeRef.current === 'HARDWARE_TWIN';
      const activeFlow = isLiveHardware
        ? (telemetryRef.current.flow_rate || 450)
        : (virtParamsRef.current.flow_rate || 450);

      const isFlowing = isLiveHardware ? true : isSimRef.current;
      const speed = isFlowing ? (activeFlow / 450.0) * delta * 0.15 : 0;

      // Update Organ Tissue Styling
      const currentOrgan = organRef.current || 'lung';
      const organTheme = ORGAN_THEMES[currentOrgan] || ORGAN_THEMES.lung;
      cellChamberMat.color.setHex(organTheme.tissueColor);
      cellChamberMat.emissive.setHex(organTheme.fluidColor);
      chipGlow.color.setHex(organTheme.tissueColor);

      // Heart pulsation or lung respiration flex
      if (currentOrgan === 'heart') {
        const pulse = 1.0 + Math.sin(elapsed * 6.5) * 0.03;
        cellChamber.scale.set(1.0, pulse, 1.0);
      } else if (currentOrgan === 'lung') {
        const breath = 1.0 + Math.sin(elapsed * 2.2) * 0.02;
        cellChamber.scale.set(1.0, breath, 1.0);
      } else {
        cellChamber.scale.set(1.0, 1.0, 1.0);
      }

      // Animate Fluid Tracer Particles
      tracers.forEach((t) => {
        if (isFlowing) {
          t.progress = (t.progress + speed) % 1.0;
        }
        const pt = fullFlowPath.getPoint(t.progress);
        t.mesh.position.copy(pt);
        t.mesh.visible = isFlowing;
      });

      // Animate Bubble Tracking
      let isBubbleVisible = false;
      let bubblePt = new THREE.Vector3();

      if (isLiveHardware) {
        // Hardware mode: bubble spot alert
        if (bubbleSpotRef.current || telemetryRef.current.bubble_detected) {
          isBubbleVisible = true;
          // Position right around the bubble trap well / optical zone (x=20)
          bubblePt = fullFlowPath.getPoint(0.35);
          sensorRingMat.color.setHex(0xef4444);
        } else {
          sensorRingMat.color.setHex(0x00f0ff);
        }
      } else {
        // Virtual lab simulation mode
        if (simBubbleActiveRef.current && simBubblePosRef.current > 0) {
          isBubbleVisible = true;
          const pos = Math.min(Math.max(simBubblePosRef.current, 0.01), 0.98);
          bubblePt = fullFlowPath.getPoint(pos);

          // If inside bubble trap well (pos ~ 0.3 to 0.45)
          if (pos >= 0.28 && pos <= 0.45) {
            sensorRingMat.color.setHex(0xf59e0b); // Trapping amber
          } else if (pos > 0.45) {
            sensorRingMat.color.setHex(0xef4444); // Breached red
          }
        } else {
          sensorRingMat.color.setHex(0x00f0ff);
        }
      }

      if (isBubbleVisible) {
        bubbleMesh.visible = true;
        bubbleMesh.position.copy(bubblePt);
      } else {
        bubbleMesh.visible = false;
      }

      // Smooth Camera Transitions on Preset change
      const targetPreset = presetRef.current;
      let targetCamPos = new THREE.Vector3(0, 24, 62);
      let targetLookAt = new THREE.Vector3(0, 1.5, 0);

      if (targetPreset === 'RESERVOIRS') {
        targetCamPos = new THREE.Vector3(48, 18, 30);
        targetLookAt = new THREE.Vector3(48, 6, 0);
      } else if (targetPreset === 'BUBBLE_TRAP') {
        targetCamPos = new THREE.Vector3(22, 14, 25);
        targetLookAt = new THREE.Vector3(22, 2.5, 0);
      } else if (targetPreset === 'ORGAN_ON_CHIP') {
        targetCamPos = new THREE.Vector3(-5, 12, 26);
        targetLookAt = new THREE.Vector3(-5, 2, 0);
      } else if (targetPreset === 'SENSOR_MANIFOLD') {
        targetCamPos = new THREE.Vector3(-28, 14, 26);
        targetLookAt = new THREE.Vector3(-28, 4, 0);
      } else if (targetPreset === 'INLET_OBSERVATION') {
        targetCamPos = new THREE.Vector3(20, 12, 22);
        targetLookAt = new THREE.Vector3(20, 2, 0);
      }

      camera.position.lerp(targetCamPos, 0.035);
      controls.target.lerp(targetLookAt, 0.035);
      controls.update();

      renderer.render(scene, camera);
    };

    animate();

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

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-[#070c16]">
      <div ref={containerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
}
