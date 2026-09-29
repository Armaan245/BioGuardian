'use client';

/**
 * BioGuardian 3D Digital Twin - Photorealistic Microfluidic Engine
 *
 * Visually authentic scientific laboratory visualization:
 * - 1. RESERVOIR BOTTLES (Left: x ~ -78): Cell Media & Drug/Reagent with GL45 blue caps & 90° stainless pickup tubes
 * - 2. PREP & BUBBLE TRAP CHIP (x ~ -48): 3-layer laminated cartridge with dual vertical inlets,
 *      Y-junction mixer, serpentine chaotic mixing channel, and central passive bubble trap/vent well
 * - 3. OPTICAL OBSERVATION ZONE (x ~ -20): Machine-vision camera (brushed aluminum, knurled lens, C-mount, laser reticle)
 * - 4. CELL CULTURE CHIP (Center: x ~ 21): Full original high-fidelity Organ-on-Chip (76x26mm borosilicate slide base,
 *      PDMS elastomer block, micro-porous membrane, upper apical channel, lower vascular channel, vacuum side chambers)
 * - 5. SENSOR MANIFOLD (Right: x ~ 56): CNC bronze block with vertical electrochemical sensor probe (pH, DO & Flow)
 * - 6. EFFLUENT DRAIN (x ~ 68): Drainage tube to glass beaker labeled TO WASTE
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

  // State refs for render loop
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
    // 1. SCENE & ENVIRONMENT
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1120);
    scene.fog = new THREE.FogExp2(0x0a1120, 0.005);

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(-4, 18, 54);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 140;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(-4, 0, 0);

    // ==========================================
    // 2. STUDIO LABORATORY LIGHTING RIG
    // ==========================================
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.8);
    scene.add(hemiLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    mainKeyLight.position.set(25, 50, 35);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.bias = -0.0001;
    scene.add(mainKeyLight);

    const frontFillLight = new THREE.DirectionalLight(0xe2e8f0, 1.8);
    frontFillLight.position.set(-15, 20, 45);
    scene.add(frontFillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimLight.position.set(-35, -10, -40);
    scene.add(rimLight);

    const chipTopLight = new THREE.PointLight(0x2dd4bf, 2.2, 50);
    chipTopLight.position.set(17.5, 10, 8);
    scene.add(chipTopLight);

    const inspectionLight = new THREE.PointLight(0x00f0ff, 3.0, 35);
    inspectionLight.position.set(-20, 7, 3);
    scene.add(inspectionLight);

    const prepChipLight = new THREE.PointLight(0x00d4c8, 2.2, 40);
    prepChipLight.position.set(-48, 8, 4);
    scene.add(prepChipLight);

    // ==========================================
    // 3. OPTICAL BREADBOARD LABORATORY STAGE
    // ==========================================
    const stageGroup = new THREE.Group();
    const breadboardWidth = 190;
    const breadboardDepth = 110;
    const breadboardThickness = 2.5;

    const breadboardGeo = new THREE.BoxGeometry(breadboardWidth, breadboardThickness, breadboardDepth);
    const breadboardMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.28,
    });
    const breadboard = new THREE.Mesh(breadboardGeo, breadboardMat);
    breadboard.position.y = -8 - breadboardThickness / 2;
    breadboard.receiveShadow = true;
    stageGroup.add(breadboard);

    const rimGeo = new THREE.BoxGeometry(breadboardWidth + 1.2, 0.6, breadboardDepth + 1.2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.15 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = -8 + 0.1;
    stageGroup.add(rimMesh);

    const gridHelper = new THREE.GridHelper(breadboardWidth - 8, 38, 0x38bdf8, 0x334155);
    gridHelper.position.y = -7.95;
    stageGroup.add(gridHelper);

    [-80, 80].forEach((posX) => {
      [-44, 44].forEach((posZ) => {
        const footGeo = new THREE.CylinderGeometry(3.0, 3.4, 3, 24);
        const footMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 });
        const foot = new THREE.Mesh(footGeo, footMat);
        foot.position.set(posX, -11, posZ);
        stageGroup.add(foot);
      });
    });

    const floorGeo = new THREE.PlaneGeometry(800, 800);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x080f1e, roughness: 0.5, metalness: 0.7 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -12.5;
    floor.receiveShadow = true;
    stageGroup.add(floor);

    const labGrid = new THREE.GridHelper(600, 60, 0x1e293b, 0x0f172a);
    labGrid.position.y = -12.45;
    stageGroup.add(labGrid);

    scene.add(stageGroup);

    // Reusable Materials
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.18 });
    const tubingMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.95,
      roughness: 0.04,
      metalness: 0.02,
      ior: 1.46,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });

    // Helper: Create 3D Tube Mesh from CatmullRom Curve
    const createTube = (points: THREE.Vector3[], radius = 0.5) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, 36, radius, 16, false);
      return new THREE.Mesh(geo, tubingMat);
    };

    // ==========================================
    // 4. RESERVOIR BOTTLES (Far Left: x ~ -76)
    // Cell Media (Bottle 1) & Drug/Reagent (Bottle 2)
    // ==========================================
    const bottlesGroup = new THREE.Group();
    bottlesGroup.name = 'RESERVOIRS';

    const bottleBodyGeo = new THREE.CylinderGeometry(3.6, 3.8, 12, 32);
    const bottleGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.6,
      transmission: 0.88,
      roughness: 0.08,
      ior: 1.5,
    });
    const blueCapMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.2 });
    const bottleCapGeo = new THREE.CylinderGeometry(4.0, 4.0, 2.0, 32);

    // Media Bottle (Pink DMEM fluid)
    const mediaBottle = new THREE.Mesh(bottleBodyGeo, bottleGlassMat);
    mediaBottle.position.set(-76, -2.0, -8);
    bottlesGroup.add(mediaBottle);

    const mediaFluidGeo = new THREE.CylinderGeometry(3.4, 3.6, 9.5, 24);
    const mediaFluidMat = new THREE.MeshPhysicalMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.65, transmission: 0.75 });
    const mediaFluid = new THREE.Mesh(mediaFluidGeo, mediaFluidMat);
    mediaFluid.position.set(-76, -3.2, -8);
    bottlesGroup.add(mediaFluid);

    const mediaCap = new THREE.Mesh(bottleCapGeo, blueCapMat);
    mediaCap.position.set(-76, 5.0, -8);
    bottlesGroup.add(mediaCap);

    // Drug Bottle (Purple compound)
    const drugBottle = new THREE.Mesh(bottleBodyGeo, bottleGlassMat);
    drugBottle.position.set(-76, -2.0, 8);
    bottlesGroup.add(drugBottle);

    const drugFluidMat = new THREE.MeshPhysicalMaterial({ color: 0xa855f7, transparent: true, opacity: 0.65, transmission: 0.75 });
    const drugFluid = new THREE.Mesh(mediaFluidGeo, drugFluidMat);
    drugFluid.position.set(-76, -3.2, 8);
    bottlesGroup.add(drugFluid);

    const drugCap = new THREE.Mesh(bottleCapGeo, blueCapMat);
    drugCap.position.set(-76, 5.0, 8);
    bottlesGroup.add(drugCap);

    // 90° Overhead Inflow Tubing from Bottles into Prep Chip Inlets
    const mediaTube = createTube([
      new THREE.Vector3(-76, 5.5, -8),
      new THREE.Vector3(-76, 8.5, -8),
      new THREE.Vector3(-66, 8.5, -4.5),
      new THREE.Vector3(-60, 4.0, -4.5),
      new THREE.Vector3(-60, -0.5, -4.5),
    ], 0.42);
    bottlesGroup.add(mediaTube);

    const drugTube = createTube([
      new THREE.Vector3(-76, 5.5, 8),
      new THREE.Vector3(-76, 7.5, 8),
      new THREE.Vector3(-66, 7.5, 4.5),
      new THREE.Vector3(-60, 4.0, 4.5),
      new THREE.Vector3(-60, -0.5, 4.5),
    ], 0.42);
    bottlesGroup.add(drugTube);

    scene.add(bottlesGroup);

    // ==========================================
    // 5. PREP & BUBBLE TRAP CHIP (x ~ -48)
    // 3-Layer Laminated Cartridge: Y-Mixer, Serpentine Channel, Passive Vent Well
    // ==========================================
    const prepGroup = new THREE.Group();
    prepGroup.name = 'BUBBLE_TRAP';
    const prepX = -46.0;
    const prepW = 30.0;
    const prepH = 3.2;
    const prepD = 15.0;

    // Cartridge Body: Light greenish-teal tinted PDMS/PMMA (Image 1 & 2)
    const prepBodyGeo = new THREE.BoxGeometry(prepW, prepH, prepD);
    const prepBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xccfbf1,
      transparent: true,
      opacity: 0.65,
      transmission: 0.9,
      roughness: 0.08,
      ior: 1.48,
    });
    const prepBody = new THREE.Mesh(prepBodyGeo, prepBodyMat);
    prepBody.position.set(prepX, -2.5, 0);
    prepBody.castShadow = true;
    prepGroup.add(prepBody);

    // Slide Edge Framing
    const prepEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(prepBodyGeo),
      new THREE.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.5 })
    );
    prepBody.add(prepEdges);

    // Dual Inlet Gaskets at x = -59
    [-4.5, 4.5].forEach((zOff) => {
      const gasket = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.2, 20), steelMat);
      gasket.position.set(-59.0, -0.5, zOff);
      prepGroup.add(gasket);
    });

    // Internal Channel: Y-Junction -> Serpentine Mixer -> Vent Chamber -> Outlet
    const channelMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d4c8,
      emissive: 0x0f766e,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.9,
    });

    // Y-Junction Feeder Branches
    const yBranch1 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.45, 0.8), channelMat);
    yBranch1.position.set(-55.5, -2.5, -2.5);
    yBranch1.rotation.y = 0.45;
    prepGroup.add(yBranch1);

    const yBranch2 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.45, 0.8), channelMat);
    yBranch2.position.set(-55.5, -2.5, 2.5);
    yBranch2.rotation.y = -0.45;
    prepGroup.add(yBranch2);

    // Serpentine Chaotic Mixer (Square-wave zigzags between x=-52 and x=-44)
    const serpentineGroup = new THREE.Group();
    const zigzags = [[-2.5, 2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, -2.5]];
    let sx = -52.0;
    zigzags.forEach(([z1, z2]) => {
      const zBar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, Math.abs(z2 - z1)), channelMat);
      zBar.position.set(sx, -2.5, (z1 + z2) / 2);
      serpentineGroup.add(zBar);

      const xBar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.6), channelMat);
      xBar.position.set(sx + 1.0, -2.5, z2);
      serpentineGroup.add(xBar);
      sx += 2.0;
    });
    prepGroup.add(serpentineGroup);

    // Passive Bubble Trap Chamber / Vent Well (at x = -42)
    const ventWellRad = 2.6;
    const ventWell = new THREE.Mesh(
      new THREE.CylinderGeometry(ventWellRad, ventWellRad, prepH + 0.4, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, transmission: 0.85 })
    );
    ventWell.position.set(-42.0, -2.5, 0);
    prepGroup.add(ventWell);

    // Hydrophobic Vent Filter Disc on top
    const ventFilter = new THREE.Mesh(
      new THREE.CircleGeometry(ventWellRad - 0.2, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    ventFilter.position.set(-42.0, -0.85, 0);
    ventFilter.rotation.x = -Math.PI / 2;
    prepGroup.add(ventFilter);

    // Vent Aperture Collar Ring
    const ventRing = new THREE.Mesh(new THREE.TorusGeometry(ventWellRad, 0.22, 16, 32), steelMat);
    ventRing.position.set(-42.0, -0.7, 0);
    ventRing.rotation.x = Math.PI / 2;
    prepGroup.add(ventRing);

    // Outflow Channel from Vent to Outlet Port at x = -34
    const prepExitChannel = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.45, 0.8), channelMat);
    prepExitChannel.position.set(-38.0, -2.5, 0);
    prepGroup.add(prepExitChannel);

    const prepOutletCollar = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.2, 20), steelMat);
    prepOutletCollar.position.set(-34.0, -0.5, 0);
    prepGroup.add(prepOutletCollar);

    scene.add(prepGroup);

    // ==========================================
    // 6. INLET TUBE & OBSERVATION ZONE (x ~ -34 to 0)
    // Preserved original high-precision machine-vision camera & observation tube
    // ==========================================
    const inletGroup = new THREE.Group();
    inletGroup.name = 'INLET_OBSERVATION';

    const tubeLength = 34;
    const tubeOuterRadius = 1.75;
    const tubeInnerRadius = 1.25;

    const tubeOuterGeo = new THREE.CylinderGeometry(tubeOuterRadius, tubeOuterRadius, tubeLength, 36);
    tubeOuterGeo.rotateZ(Math.PI / 2);
    const tubeOuterMesh = new THREE.Mesh(tubeOuterGeo, tubingMat);
    tubeOuterMesh.position.set(-tubeLength / 2, 0, 0);
    inletGroup.add(tubeOuterMesh);

    const tubeFluidGeo = new THREE.CylinderGeometry(tubeInnerRadius, tubeInnerRadius, tubeLength, 24);
    tubeFluidGeo.rotateZ(Math.PI / 2);
    const tubeFluidMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d4c8,
      transmission: 0.85,
      roughness: 0.1,
      metalness: 0.05,
      ior: 1.333,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const tubeFluidMesh = new THREE.Mesh(tubeFluidGeo, tubeFluidMat);
    tubeFluidMesh.position.set(-tubeLength / 2, 0, 0);
    inletGroup.add(tubeFluidMesh);

    // Precision CNC Stainless Steel Luer-Lock Fitting at Chip Port (x = 0)
    const fittingGeo = new THREE.CylinderGeometry(2.4, 2.1, 4.8, 24);
    fittingGeo.rotateZ(Math.PI / 2);
    const fittingMesh = new THREE.Mesh(fittingGeo, steelMat);
    fittingMesh.position.set(-2.2, 0, 0);
    fittingMesh.castShadow = true;
    inletGroup.add(fittingMesh);

    const hexNutGeo = new THREE.CylinderGeometry(2.65, 2.65, 1.8, 6);
    hexNutGeo.rotateZ(Math.PI / 2);
    const hexNut = new THREE.Mesh(hexNutGeo, steelMat);
    hexNut.position.set(-3.6, 0, 0);
    inletGroup.add(hexNut);

    const accentRingGeo = new THREE.TorusGeometry(2.6, 0.25, 16, 32);
    const accentRingMat = new THREE.MeshStandardMaterial({ color: 0x00d4c8, metalness: 0.85, roughness: 0.25 });
    const accentRing = new THREE.Mesh(accentRingGeo, accentRingMat);
    accentRing.position.set(-1.0, 0, 0);
    accentRing.rotation.y = Math.PI / 2;
    inletGroup.add(accentRing);

    scene.add(inletGroup);

    // Bridge Tube connecting Prep Chip Outlet (x=-34) to Main Inlet Line (x=-34)
    const prepBridge = createTube([
      new THREE.Vector3(-34.0, -0.5, 0),
      new THREE.Vector3(-34.0, 0.0, 0),
    ], 0.6);
    scene.add(prepBridge);

    // Machine-Vision Optical Inspection Camera at x = -20
    const obsZoneGroup = new THREE.Group();
    obsZoneGroup.name = 'INLET_OBSERVATION';
    const obsX = -20;

    const clampGeo = new THREE.CylinderGeometry(2.9, 2.9, 5.5, 32);
    clampGeo.rotateZ(Math.PI / 2);
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.28 });
    const clampMesh = new THREE.Mesh(clampGeo, clampMat);
    clampMesh.position.set(obsX, 0, 0);
    obsZoneGroup.add(clampMesh);

    const quartzWindowGeo = new THREE.CylinderGeometry(2.92, 2.92, 2.2, 32, 1, false, 0, Math.PI);
    quartzWindowGeo.rotateZ(Math.PI / 2);
    const quartzWindowMat = new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, transmission: 0.96, roughness: 0.04, transparent: true, opacity: 0.45 });
    const quartzWindow = new THREE.Mesh(quartzWindowGeo, quartzWindowMat);
    quartzWindow.position.set(obsX, 0, 0);
    obsZoneGroup.add(quartzWindow);

    const camBodyGeo = new THREE.BoxGeometry(5.2, 5.8, 5.2);
    const camBodyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.82, roughness: 0.24 });
    const camBody = new THREE.Mesh(camBodyGeo, camBodyMat);
    camBody.position.set(obsX, 6.2, 0);
    camBody.castShadow = true;
    obsZoneGroup.add(camBody);

    [-1.2, 0, 1.2].forEach((offsetY) => {
      const finGeo = new THREE.BoxGeometry(5.4, 0.4, 5.4);
      const finMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.88, roughness: 0.3 });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(obsX, 6.2 + offsetY, 0);
      obsZoneGroup.add(fin);
    });

    const lensBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.1, 1.4, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.92, roughness: 0.2 })
    );
    lensBase.position.set(obsX, 3.2, 0);
    obsZoneGroup.add(lensBase);

    const knurlRing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 1.85, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.96, roughness: 0.15 })
    );
    knurlRing.position.set(obsX, 2.7, 0);
    obsZoneGroup.add(knurlRing);

    const lensFront = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.7, 1.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.92, roughness: 0.2 })
    );
    lensFront.position.set(obsX, 1.9, 0);
    obsZoneGroup.add(lensFront);

    const glassElem = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.25, 0.2, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x10b981, transmission: 0.85, roughness: 0.05, metalness: 0.2, ior: 1.65, transparent: true, opacity: 0.85 })
    );
    glassElem.position.set(obsX, 1.3, 0);
    obsZoneGroup.add(glassElem);

    const laserBeamMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 3.2, 16),
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45 })
    );
    laserBeamMesh.position.set(obsX, 1.8, 0);
    laserBeamMesh.visible = false;
    obsZoneGroup.add(laserBeamMesh);

    const targetSpotRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.06, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 })
    );
    targetSpotRing.rotation.x = Math.PI / 2;
    targetSpotRing.position.set(obsX, 0, 0);
    targetSpotRing.visible = false;
    obsZoneGroup.add(targetSpotRing);

    const stanchion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.2 })
    );
    stanchion.position.set(obsX, 2, -3.2);
    obsZoneGroup.add(stanchion);

    scene.add(obsZoneGroup);

    // ==========================================
    // 7. REAL SCIENTIFIC DUAL-LAYER ORGAN-ON-CHIP (x ~ 21)
    // 100% Original Pristine Organ-on-Chip Model
    // ==========================================
    const oocGroup = new THREE.Group();
    oocGroup.name = 'ORGAN_ON_CHIP';

    const chipWidth = 40;
    const chipHeight = 5.4;
    const chipDepth = 20;
    const chipCenterX = 21.0;

    // Procedural Porous Membrane Texture
    const createPorousMembraneTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#1e293b';
      for (let px = 4; px < 512; px += 8) {
        for (let py = 4; py < 256; py += 8) {
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(3, 1.5);
      return t;
    };
    const membraneTexture = createPorousMembraneTexture();

    // Microscope Slide Base
    const slideBaseGeo = new THREE.BoxGeometry(chipWidth + 10, 1.2, chipDepth + 4);
    const slideBaseMat = new THREE.MeshPhysicalMaterial({
      color: 0xecfdf5,
      transmission: 0.95,
      roughness: 0.04,
      metalness: 0.08,
      ior: 1.515,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const slideBaseMesh = new THREE.Mesh(slideBaseGeo, slideBaseMat);
    slideBaseMesh.position.set(chipCenterX, -chipHeight / 2 - 0.6, 0);
    slideBaseMesh.receiveShadow = true;
    oocGroup.add(slideBaseMesh);

    // Frosted label area on microscope slide edge
    const frostedLabel = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 1.25, chipDepth + 3.8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85, metalness: 0.1, transparent: true, opacity: 0.75 })
    );
    frostedLabel.position.set(chipCenterX + chipWidth / 2 + 1.5, -chipHeight / 2 - 0.6, 0);
    oocGroup.add(frostedLabel);

    // Optical PDMS Elastomer Body
    const chipBodyGeo = new THREE.BoxGeometry(chipWidth, chipHeight, chipDepth);
    const chipBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0fdfa,
      transmission: 0.97,
      roughness: 0.03,
      metalness: 0.02,
      ior: 1.43,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const chipBodyMesh = new THREE.Mesh(chipBodyGeo, chipBodyMat);
    chipBodyMesh.position.set(chipCenterX, 0, 0);
    chipBodyMesh.castShadow = true;
    oocGroup.add(chipBodyMesh);

    const chipEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(chipBodyGeo),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
    );
    chipBodyMesh.add(chipEdges);

    // Central Porous Membrane Scaffold
    const membraneGeo = new THREE.PlaneGeometry(26, 9.5);
    const membraneMat = new THREE.MeshStandardMaterial({
      map: membraneTexture || undefined,
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const membraneMesh = new THREE.Mesh(membraneGeo, membraneMat);
    membraneMesh.rotation.x = -Math.PI / 2;
    membraneMesh.position.set(chipCenterX, 0, 0);
    oocGroup.add(membraneMesh);

    const membraneFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(26.2, 0.15, 9.7)),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
    );
    membraneFrame.position.set(chipCenterX, 0, 0);
    oocGroup.add(membraneFrame);

    // Upper Apical Microchannel (Blue)
    const upperChannelGroup = new THREE.Group();
    const upperChMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      transmission: 0.65,
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });

    const upperMainGeo = new THREE.BoxGeometry(24, 1.15, 2.6);
    const upperMainMesh = new THREE.Mesh(upperMainGeo, upperChMat);
    upperMainMesh.position.set(chipCenterX, 0.8, 0);
    upperChannelGroup.add(upperMainMesh);

    [-3.8, 3.8].forEach((zOffset) => {
      const branchGeo = new THREE.BoxGeometry(4.8, 1.0, 1.2);
      const branchMesh = new THREE.Mesh(branchGeo, upperChMat);
      branchMesh.position.set(chipCenterX - 13.5, 0.8, zOffset * 0.55);
      branchMesh.rotation.y = zOffset > 0 ? 0.45 : -0.45;
      upperChannelGroup.add(branchMesh);

      const portWellGeo = new THREE.CylinderGeometry(1.2, 1.2, chipHeight / 2 - 0.3, 24);
      const portWellMesh = new THREE.Mesh(portWellGeo, upperChMat);
      portWellMesh.position.set(chipCenterX - 15.5, chipHeight / 4 + 0.6, zOffset);
      upperChannelGroup.add(portWellMesh);

      const collarGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24);
      const collarMesh = new THREE.Mesh(collarGeo, steelMat);
      collarMesh.position.set(chipCenterX - 15.5, chipHeight / 2 + 0.4, zOffset);
      upperChannelGroup.add(collarMesh);
    });

    [-3.8, 3.8].forEach((zOffset) => {
      const branchGeo = new THREE.BoxGeometry(4.8, 1.0, 1.2);
      const branchMesh = new THREE.Mesh(branchGeo, upperChMat);
      branchMesh.position.set(chipCenterX + 13.5, 0.8, zOffset * 0.55);
      branchMesh.rotation.y = zOffset > 0 ? -0.45 : 0.45;
      upperChannelGroup.add(branchMesh);

      const portWellGeo = new THREE.CylinderGeometry(1.2, 1.2, chipHeight / 2 - 0.3, 24);
      const portWellMesh = new THREE.Mesh(portWellGeo, upperChMat);
      portWellMesh.position.set(chipCenterX + 15.5, chipHeight / 4 + 0.6, zOffset);
      upperChannelGroup.add(portWellMesh);

      const collarGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24);
      const collarMesh = new THREE.Mesh(collarGeo, steelMat);
      collarMesh.position.set(chipCenterX + 15.5, chipHeight / 2 + 0.4, zOffset);
      upperChannelGroup.add(collarMesh);
    });

    oocGroup.add(upperChannelGroup);

    // Lower Vascular Channel (Orange)
    const lowerChannelGroup = new THREE.Group();
    const lowerChMat = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      emissive: 0xc2410c,
      emissiveIntensity: 0.75,
      transmission: 0.65,
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });

    const lowerMainGeo = new THREE.BoxGeometry(24, 1.15, 2.6);
    const lowerMainMesh = new THREE.Mesh(lowerMainGeo, lowerChMat);
    lowerMainMesh.position.set(chipCenterX, -0.8, 0);
    lowerChannelGroup.add(lowerMainMesh);

    const lowerInletStem = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 1.4), lowerChMat);
    lowerInletStem.position.set(chipCenterX - 14.5, -0.8, 0);
    lowerChannelGroup.add(lowerInletStem);

    const lowerInletWell = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, chipHeight - 1.2, 24), lowerChMat);
    lowerInletWell.position.set(chipCenterX - 17.0, 0, 0);
    lowerChannelGroup.add(lowerInletWell);

    const lowerInletCollar = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24), steelMat);
    lowerInletCollar.position.set(chipCenterX - 17.0, chipHeight / 2 + 0.4, 0);
    lowerChannelGroup.add(lowerInletCollar);

    const lowerOutletStem = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 1.4), lowerChMat);
    lowerOutletStem.position.set(chipCenterX + 14.5, -0.8, 0);
    lowerChannelGroup.add(lowerOutletStem);

    const lowerOutletWell = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, chipHeight - 1.2, 24), lowerChMat);
    lowerOutletWell.position.set(chipCenterX + 17.0, 0, 0);
    lowerChannelGroup.add(lowerOutletWell);

    const lowerOutletCollar = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24), steelMat);
    lowerOutletCollar.position.set(chipCenterX + 17.0, chipHeight / 2 + 0.4, 0);
    lowerChannelGroup.add(lowerOutletCollar);

    oocGroup.add(lowerChannelGroup);

    // Side Vacuum Chambers
    const sideChamberMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, transmission: 0.82, roughness: 0.2, transparent: true, opacity: 0.45 });
    const sideChamberGeo = new THREE.BoxGeometry(22, 3.4, 2.2);

    const sideChamberLeft = new THREE.Mesh(sideChamberGeo, sideChamberMat);
    sideChamberLeft.position.set(chipCenterX, 0, -4.8);
    oocGroup.add(sideChamberLeft);

    const sideChamberRight = new THREE.Mesh(sideChamberGeo, sideChamberMat);
    sideChamberRight.position.set(chipCenterX, 0, 4.8);
    oocGroup.add(sideChamberRight);

    scene.add(oocGroup);

    // ==========================================
    // 8. SENSOR MANIFOLD (Right: x ~ 56)
    // Bronze CNC block with Electrochemical Sensor Probe (pH, DO & Flow)
    // ==========================================
    const sensorGroup = new THREE.Group();
    sensorGroup.name = 'SENSOR_MANIFOLD';
    const sensorX = 56.0;

    // Bronze Manifold Block (Image 1)
    const manifoldBlock = new THREE.Mesh(
      new THREE.BoxGeometry(10.0, 6.5, 10.0),
      new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.32 })
    );
    manifoldBlock.position.set(sensorX, -4.75, 0);
    manifoldBlock.castShadow = true;
    sensorGroup.add(manifoldBlock);

    // Probe Collar & Sensing Stanchion
    const probeCollar = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 1.6, 32), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
    probeCollar.position.set(sensorX, -1.0, 0);
    sensorGroup.add(probeCollar);

    const probeBody = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 8.5, 32), steelMat);
    probeBody.position.set(sensorX, 3.5, 0);
    sensorGroup.add(probeBody);

    const probeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 2.0, 24), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }));
    probeCap.position.set(sensorX, 8.0, 0);
    sensorGroup.add(probeCap);

    // Bridge tube from OoC outlet (x=41) to Sensor Manifold (x=51)
    const oocToSensor = createTube([
      new THREE.Vector3(41.0, 0, 0),
      new THREE.Vector3(46.0, 1.2, 0),
      new THREE.Vector3(51.0, -4.5, 0),
    ], 0.5);
    sensorGroup.add(oocToSensor);

    // Effluent tube to Waste Beaker
    const wasteTube = createTube([
      new THREE.Vector3(61.0, -4.5, 0),
      new THREE.Vector3(70.0, -4.5, 0),
      new THREE.Vector3(76.0, -2.0, 0),
    ], 0.5);
    sensorGroup.add(wasteTube);

    // Glass Waste Collection Beaker labeled TO WASTE
    const wasteBeaker = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.0, 8.5, 24),
      new THREE.MeshPhysicalMaterial({ color: 0x64748b, transparent: true, opacity: 0.45, transmission: 0.7 })
    );
    wasteBeaker.position.set(76.0, -3.75, 0);
    sensorGroup.add(wasteBeaker);

    scene.add(sensorGroup);

    // ==========================================
    // 9. DYNAMIC TRACER PARTICLES & REFRACTIVE BUBBLE
    // ==========================================
    const createCircularParticleTexture = () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.3, 'rgba(0, 240, 255, 0.9)');
      grad.addColorStop(0.6, 'rgba(0, 200, 230, 0.35)');
      grad.addColorStop(1, 'rgba(0, 160, 210, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    };
    const particleTexture = createCircularParticleTexture();

    const PARTICLE_COUNT = 160;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleProgress = new Float32Array(PARTICLE_COUNT);
    const particleSpeeds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particleProgress[i] = Math.random();
      particleSpeeds[i] = 0.8 + Math.random() * 0.4;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMat = new THREE.PointsMaterial({
      map: particleTexture || undefined,
      color: 0x00f0ff,
      size: 0.95,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // Dynamic 3D Refractive Bubble
    const bubbleGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.97,
      roughness: 0.03,
      metalness: 0.05,
      ior: 1.15,
      transparent: true,
      opacity: 0.92,
      clearcoat: 1.0,
    });
    const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    bubbleMesh.position.set(-20, 0, 0);
    bubbleMesh.visible = false;
    scene.add(bubbleMesh);

    // Full Fluid Flow Trajectory Spline
    const flowSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-76, 5.0, -8),
      new THREE.Vector3(-66, 8.5, -4.5),
      new THREE.Vector3(-60, -0.5, -4.5),  // Prep inlet
      new THREE.Vector3(-55, -2.5, 0),     // Y-junction
      new THREE.Vector3(-42, -2.5, 0),     // Bubble trap well
      new THREE.Vector3(-34, 0, 0),        // Observation tube entry
      new THREE.Vector3(-20, 0, 0),        // Camera observation spot
      new THREE.Vector3(0, 0, 0),          // OoC entry
      new THREE.Vector3(chipCenterX, 0.8, 0), // OoC apical chamber
      new THREE.Vector3(41.0, 0, 0),       // OoC outlet
      new THREE.Vector3(56.0, -4.5, 0),    // Sensor manifold
      new THREE.Vector3(76.0, -3.75, 0),   // Waste
    ]);

    // ==========================================
    // 10. ANIMATION & TELEMETRY FLOW LOOP
    // ==========================================
    let reqId: number;
    const clock = new THREE.Clock();

    // Camera Presets
    const PRESETS: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
      FULL_SYSTEM:       { pos: new THREE.Vector3(-4, 18, 54), target: new THREE.Vector3(-4, 0, 0) },
      RESERVOIRS:        { pos: new THREE.Vector3(-74, 14, 28), target: new THREE.Vector3(-74, 1, 0) },
      BUBBLE_TRAP:       { pos: new THREE.Vector3(-46, 12, 26), target: new THREE.Vector3(-46, -1, 0) },
      INLET_OBSERVATION: { pos: new THREE.Vector3(-20, 4, 20), target: new THREE.Vector3(-20, 0, 0) },
      ORGAN_ON_CHIP:     { pos: new THREE.Vector3(chipCenterX, 6, 26), target: new THREE.Vector3(chipCenterX, 0, 0) },
      SENSOR_MANIFOLD:   { pos: new THREE.Vector3(56, 14, 28), target: new THREE.Vector3(56, -1, 0) },
    };

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Flow Rate Evaluation
      const isLiveHardware = envModeRef.current === 'HARDWARE_TWIN';
      const activeFlow = isLiveHardware
        ? (telemetryRef.current.flow_rate || 450)
        : (virtParamsRef.current.flow_rate || 450);

      const isFlowing = isLiveHardware ? true : isSimRef.current;
      const speed = isFlowing ? (activeFlow / 450.0) * delta * 0.16 : 0;

      // Update Tissue Morphology & Color
      const currentOrgan = organRef.current || 'lung';
      const organTheme = ORGAN_THEMES[currentOrgan] || ORGAN_THEMES.lung;
      upperChMat.color.setHex(organTheme.tissueColor);
      upperChMat.emissive.setHex(organTheme.fluidColor);
      chipTopLight.color.setHex(organTheme.tissueColor);

      if (currentOrgan === 'heart') {
        const pulse = 1.0 + Math.sin(elapsed * 6.5) * 0.04;
        upperMainMesh.scale.set(1.0, pulse, 1.0);
      } else if (currentOrgan === 'lung') {
        const breath = 1.0 + Math.sin(elapsed * 2.2) * 0.025;
        upperMainMesh.scale.set(1.0, breath, 1.0);
      } else {
        upperMainMesh.scale.set(1.0, 1.0, 1.0);
      }

      // Animate Fluid Tracer Particles
      const posAttr = particlesGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (isFlowing) {
          particleProgress[i] = (particleProgress[i] + speed * particleSpeeds[i]) % 1.0;
        }
        const pt = flowSpline.getPoint(particleProgress[i]);
        posAttr.setXYZ(i, pt.x, pt.y, pt.z);
      }
      posAttr.needsUpdate = true;
      particles.visible = isFlowing;

      // Animate Bubble Tracking
      let isBubbleVisible = false;
      let bubblePoint = new THREE.Vector3();

      if (isLiveHardware) {
        if (bubbleSpotRef.current || telemetryRef.current.bubble_detected) {
          isBubbleVisible = true;
          bubblePoint.set(-20, 0, 0); // Positioned directly under observation camera
          laserBeamMesh.visible = true;
          targetSpotRing.visible = true;
        } else {
          laserBeamMesh.visible = false;
          targetSpotRing.visible = false;
        }
      } else {
        if (simBubbleActiveRef.current && simBubblePosRef.current > 0) {
          isBubbleVisible = true;
          const pos = Math.min(Math.max(simBubblePosRef.current, 0.01), 0.98);
          bubblePoint = flowSpline.getPoint(pos);

          // If bubble is in observation zone (-25 to -15)
          const inObs = bubblePoint.x >= -24 && bubblePoint.x <= -16;
          laserBeamMesh.visible = inObs;
          targetSpotRing.visible = inObs;
        } else {
          laserBeamMesh.visible = false;
          targetSpotRing.visible = false;
        }
      }

      if (isBubbleVisible) {
        bubbleMesh.visible = true;
        bubbleMesh.position.copy(bubblePoint);
      } else {
        bubbleMesh.visible = false;
      }

      // Smooth Camera Transition to preset
      const preset = PRESETS[presetRef.current] || PRESETS.FULL_SYSTEM;
      camera.position.lerp(preset.pos, 0.035);
      controls.target.lerp(preset.target, 0.035);
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
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-[#0a1120]">
      <div ref={containerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
}
