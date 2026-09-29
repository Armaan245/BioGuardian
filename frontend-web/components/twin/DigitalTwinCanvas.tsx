'use client';

/**
 * BioGuardian 3D Digital Twin & Virtual Lab Engine (Three.js WebGL)
 * 
 * Hardware Twin & In-Silico Virtual Lab Microfluidic Rig:
 * 1. Dual Reservoir Bottles: Cell Media & Drug/Reagent with blue GL45 caps & PEEK dip tubes
 * 2. Prep & Bubble Trap Chip (Matching CAD media_1790691024153.png):
 *    - 3-Layer Laminated Architecture (Top frosted cover with 4 ports, Middle PDMS with cyan channels, Bottom glass slide)
 *    - Dual vertical inlet posts (Media + Drug)
 *    - Converging Y-junction mixer
 *    - Serpentine square-wave mixing channel
 *    - Vertical cylindrical Bubble Trap Chamber (passive debubbler well)
 *    - Vertical outlet port
 * 3. Connecting FEP Bridge Tubing & Precision Luer-lock compression fittings
 * 4. High-Magnification Machine-Vision Optical Camera with knurled C-mount lens & alert laser
 * 5. Refractive 3D Micro-Bubble tracking with optical warning aura
 * 6. Untouched Pristine Dual-Layer Organ-on-Chip:
 *    - 76x26mm Borosilicate Glass Slide Base
 *    - Optically Clear PDMS Block with beveled chamfers
 *    - Micro-Porous Permeable Membrane with procedural pore matrix
 *    - Upper Apical Microchannel (Blue) with bifurcated ports
 *    - Lower Vascular Microchannel (Peach/Orange) with staggered ports
 *    - Dual Side Vacuum Chambers with physiological cyclic breathing actuation
 * 7. Downstream CNC Electrochemical Sensor Manifold & Laboratory Waste Beaker
 * 8. Dual-Stream Micro-PIV Particles flowing proportionally to telemetry flow_rate
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTelemetry } from '@/lib/telemetry/TelemetryContext';
import { CameraPreset } from '@/lib/telemetry/types';

export function DigitalTwinCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    telemetry,
    showBubbleSpotVisual,
    cameraPreset,
    setCameraPreset,
    environmentMode,
  } = useTelemetry();

  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const bubbleSpotRef = useRef(showBubbleSpotVisual);
  bubbleSpotRef.current = showBubbleSpotVisual;

  const presetRef = useRef<CameraPreset>(cameraPreset);
  presetRef.current = cameraPreset;

  const envModeRef = useRef(environmentMode);
  envModeRef.current = environmentMode;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ==========================================
    // 1. SCENE, CAMERA & WEBGL RENDERER SETUP
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1120);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // Initial camera position for comprehensive full-system view (framing reservoirs, Y-chip, OoC, manifold, waste)
    camera.position.set(-2, 18, 92);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
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

    // ==========================================
    // 2. LABORATORY ILLUMINATION RIG
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 1.25);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(30, 45, 35);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-45, 20, -35);
    scene.add(rimLight);

    const inspectionLight = new THREE.PointLight(0x00f0ff, 2.5, 30);
    inspectionLight.position.set(-12, 6, 0);
    scene.add(inspectionLight);

    const oocAccentLight = new THREE.PointLight(0x38bdf8, 1.8, 35);
    oocAccentLight.position.set(21, 8, 4);
    scene.add(oocAccentLight);

    // ==========================================
    // 3. OPTICAL BREADBOARD & LAB WORKSTATION
    // ==========================================
    const stageGroup = new THREE.Group();

    const stageGeo = new THREE.BoxGeometry(160, 4.0, 70);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x111c30,
      roughness: 0.35,
      metalness: 0.85,
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.set(0, -4, 0);
    stageMesh.receiveShadow = true;
    stageGroup.add(stageMesh);

    // Optical M6 mounting hole matrix on breadboard
    const holeGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 12);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x070b14 });
    const holeInstanced = new THREE.InstancedMesh(holeGeo, holeMat, 280);
    const dummy = new THREE.Object3D();
    let holeIdx = 0;
    for (let x = -72; x <= 72; x += 8) {
      for (let z = -28; z <= 28; z += 4) {
        if (holeIdx < 280) {
          dummy.position.set(x, -1.96, z);
          dummy.updateMatrix();
          holeInstanced.setMatrixAt(holeIdx++, dummy.matrix);
        }
      }
    }
    holeInstanced.instanceMatrix.needsUpdate = true;
    stageGroup.add(holeInstanced);

    // Floor and isolation grid
    const floorGeo = new THREE.PlaneGeometry(800, 800);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080f1e,
      roughness: 0.5,
      metalness: 0.7,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -12.5;
    floor.receiveShadow = true;
    stageGroup.add(floor);

    const labGrid = new THREE.GridHelper(600, 60, 0x1e293b, 0x0f172a);
    labGrid.position.y = -12.45;
    stageGroup.add(labGrid);

    scene.add(stageGroup);

    // ==========================================
    // 4. UPSTREAM RESERVOIR BOTTLES (Media + Drug)
    // ==========================================
    const reservoirGroup = new THREE.Group();
    reservoirGroup.name = 'RESERVOIRS';

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.94,
      roughness: 0.06,
      metalness: 0.02,
      ior: 1.52,
      transparent: true,
      opacity: 0.65,
    });

    const blueCapMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.3,
      metalness: 0.2,
    });

    const peekFittingMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.2,
    });

    // A. Bottle 1: Cell Culture Media (DMEM / RPMI pink fluid)
    const mediaBottle = new THREE.Group();
    mediaBottle.position.set(-62, -2.0, -10.0);

    const mediaGlassMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.6, 9.0, 32),
      glassMat
    );
    mediaGlassMesh.position.y = 4.5;
    mediaBottle.add(mediaGlassMesh);

    const mediaLiquidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(3.3, 3.3, 6.5, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xf43f5e,
        transmission: 0.75,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      })
    );
    mediaLiquidMesh.position.y = 3.3;
    mediaBottle.add(mediaLiquidMesh);

    const mediaCapMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 1.8, 24),
      blueCapMat
    );
    mediaCapMesh.position.y = 9.8;
    mediaBottle.add(mediaCapMesh);

    const mediaFittingMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16),
      peekFittingMat
    );
    mediaFittingMesh.position.set(0, 11.0, 0);
    mediaBottle.add(mediaFittingMesh);

    reservoirGroup.add(mediaBottle);

    // B. Bottle 2: Drug / Reagent Agent (Cyan active solution)
    const drugBottle = new THREE.Group();
    drugBottle.position.set(-62, -2.0, 10.0);

    const drugGlassMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 8.0, 32),
      glassMat
    );
    drugGlassMesh.position.y = 4.0;
    drugBottle.add(drugGlassMesh);

    const drugLiquidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.9, 2.9, 5.5, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4,
        transmission: 0.8,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      })
    );
    drugLiquidMesh.position.y = 2.8;
    drugBottle.add(drugLiquidMesh);

    const drugCapMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 1.6, 24),
      blueCapMat
    );
    drugCapMesh.position.y = 8.6;
    drugBottle.add(drugCapMesh);

    const drugFittingMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16),
      peekFittingMat
    );
    drugFittingMesh.position.set(0, 9.8, 0);
    drugBottle.add(drugFittingMesh);

    reservoirGroup.add(drugBottle);

    // C. Dual Reservoir FEP Tubing to Y-Junction Inlets
    const tubeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.92,
      roughness: 0.05,
      transparent: true,
      opacity: 0.55,
      ior: 1.45,
    });

    const createTubeCurve = (start: THREE.Vector3, mid: THREE.Vector3, end: THREE.Vector3) => {
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      return new THREE.TubeGeometry(curve, 24, 0.45, 12, false);
    };

    const mediaTube = new THREE.Mesh(
      createTubeCurve(
        new THREE.Vector3(-62, 8.8, -10.0),
        new THREE.Vector3(-55, 6.0, -5.0),
        new THREE.Vector3(-44.0, 1.6, -3.0)
      ),
      tubeMat
    );
    reservoirGroup.add(mediaTube);

    const drugTube = new THREE.Mesh(
      createTubeCurve(
        new THREE.Vector3(-62, 7.8, 10.0),
        new THREE.Vector3(-55, 5.0, 5.0),
        new THREE.Vector3(-44.0, 1.6, 3.0)
      ),
      tubeMat
    );
    reservoirGroup.add(drugTube);

    scene.add(reservoirGroup);

    // ==========================================
    // 5. PREP & BUBBLE TRAP CHIP (Y-JUNCTION CHIP)
    // Matches CAD Diagram media_1790691024153.png
    // 3-Layer Structure:
    // - Bottom: Glass Microscope Slide Substrate
    // - Middle: Optical Clear PDMS with Cyan Fluidic Channel:
    //   * Dual vertical inlet posts (Media + Drug)
    //   * Y-junction angled convergence
    //   * Serpentine square-wave mixing channel
    //   * Cylindrical Bubble Trap Chamber (passive debubbler well)
    //   * Straight exit conduit & vertical outlet post
    // - Top: Frosted Semi-Transparent Cover Plate with 4 Drilled Ports
    // ==========================================
    const yChipGroup = new THREE.Group();
    yChipGroup.name = 'BUBBLE_TRAP';
    const yChipCenterX = -33.5;
    const yChipWidth = 26.0;
    const yChipDepth = 14.0;

    // 1. Bottom Layer: Glass microscope slide substrate
    const yBottomGlassGeo = new THREE.BoxGeometry(yChipWidth, 0.8, yChipDepth);
    const yBottomGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xecfdf5,
      transmission: 0.95,
      roughness: 0.05,
      ior: 1.515,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const yBottomGlassMesh = new THREE.Mesh(yBottomGlassGeo, yBottomGlassMat);
    yBottomGlassMesh.position.set(yChipCenterX, -1.6, 0);
    yBottomGlassMesh.receiveShadow = true;
    yChipGroup.add(yBottomGlassMesh);

    // 2. Middle Layer: Optical Clear PDMS Body
    const yPdmsBodyGeo = new THREE.BoxGeometry(yChipWidth, 2.4, yChipDepth);
    const yPdmsBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0fdfa,
      transmission: 0.94,
      roughness: 0.08,
      metalness: 0.02,
      ior: 1.43,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const yPdmsBodyMesh = new THREE.Mesh(yPdmsBodyGeo, yPdmsBodyMat);
    yPdmsBodyMesh.position.set(yChipCenterX, 0, 0);
    yChipGroup.add(yPdmsBodyMesh);

    // Beveled cyan chamfer wireframe on PDMS slab
    const yPdmsEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(yPdmsBodyGeo),
      new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 })
    );
    yPdmsBodyMesh.add(yPdmsEdges);

    // --- Internal Cyan Microchannel System ---
    const cyanChannelMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      transmission: 0.6,
      roughness: 0.08,
      transparent: true,
      opacity: 0.92,
    });

    const yChannelGroup = new THREE.Group();

    // A. Dual Vertical Inlet Posts
    const inPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.3, 20), cyanChannelMat);
    inPost1.position.set(yChipCenterX - 10.5, 0.2, -3.0);
    yChannelGroup.add(inPost1);

    const inPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.3, 20), cyanChannelMat);
    inPost2.position.set(yChipCenterX - 10.5, 0.2, 3.0);
    yChannelGroup.add(inPost2);

    // B. Y-Junction Converging Diagonal Channels
    const yArm1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 0.9), cyanChannelMat);
    yArm1.position.set(yChipCenterX - 8.2, 0, -1.5);
    yArm1.rotation.y = 0.62;
    yChannelGroup.add(yArm1);

    const yArm2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.65, 0.9), cyanChannelMat);
    yArm2.position.set(yChipCenterX - 8.2, 0, 1.5);
    yArm2.rotation.y = -0.62;
    yChannelGroup.add(yArm2);

    // C. Serpentine Square-Wave Mixing Channel (Zigzag mixer)
    const mixerStartX = yChipCenterX - 6.0;
    const addSegment = (w: number, d: number, px: number, pz: number) => {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, 0.65, d), cyanChannelMat);
      seg.position.set(px, 0, pz);
      yChannelGroup.add(seg);
    };

    // Square wave loops:
    addSegment(1.5, 0.9, mixerStartX + 0.75, 0);
    addSegment(0.9, 3.8, mixerStartX + 1.5, 1.4);
    addSegment(1.8, 0.9, mixerStartX + 2.4, 2.8);
    addSegment(0.9, 5.6, mixerStartX + 3.3, 0);
    addSegment(1.8, 0.9, mixerStartX + 4.2, -2.8);
    addSegment(0.9, 5.6, mixerStartX + 5.1, 0);
    addSegment(1.8, 0.9, mixerStartX + 6.0, 2.8);
    addSegment(0.9, 3.8, mixerStartX + 6.9, 1.4);
    addSegment(2.2, 0.9, mixerStartX + 8.0, 0);

    // D. Vertical Cylindrical Bubble Trap Chamber (passive debubbler well)
    const bubbleTrapChamberGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.2, 32);
    const bubbleTrapChamber = new THREE.Mesh(bubbleTrapChamberGeo, cyanChannelMat);
    bubbleTrapChamber.position.set(yChipCenterX + 4.2, 0.2, 0);
    yChannelGroup.add(bubbleTrapChamber);

    // E. Straight Exit Conduit & Vertical Outlet Post
    const exitConduit = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.65, 0.9), cyanChannelMat);
    exitConduit.position.set(yChipCenterX + 7.3, 0, 0);
    yChannelGroup.add(exitConduit);

    const outPost = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.3, 20), cyanChannelMat);
    outPost.position.set(yChipCenterX + 10.0, 0.2, 0);
    yChannelGroup.add(outPost);

    yChipGroup.add(yChannelGroup);

    // 3. Top Layer: Semi-transparent frosted white cover plate with 4 drilled circular ports
    const yTopCoverGeo = new THREE.BoxGeometry(yChipWidth, 0.55, yChipDepth);
    const yTopCoverMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.88,
      roughness: 0.15,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    const yTopCoverMesh = new THREE.Mesh(yTopCoverGeo, yTopCoverMat);
    yTopCoverMesh.position.set(yChipCenterX, 1.5, 0);
    yChipGroup.add(yTopCoverMesh);

    // Drilled aperture rings on top cover plate
    const createPortAperture = (px: number, pz: number, radius = 0.75) => {
      const ringGeo = new THREE.RingGeometry(radius * 0.7, radius, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(px, 1.78, pz);
      return ring;
    };

    yChipGroup.add(createPortAperture(yChipCenterX - 10.5, -3.0)); // Inlet 1
    yChipGroup.add(createPortAperture(yChipCenterX - 10.5, 3.0));  // Inlet 2
    yChipGroup.add(createPortAperture(yChipCenterX + 4.2, 0, 1.8)); // Bubble Vent
    yChipGroup.add(createPortAperture(yChipCenterX + 10.0, 0));   // Outlet

    scene.add(yChipGroup);

    // ==========================================
    // 6. CONNECTING FEP BRIDGE TUBING & SURGICAL FITTINGS
    // From Y-Chip outlet into OoC inlet
    // ==========================================
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'INLET_OBSERVATION';

    const bridgeStartX = yChipCenterX + 10.0; // -23.5
    const bridgeEndX = 0;
    const bridgeLen = bridgeEndX - bridgeStartX;

    const bridgeOuterGeo = new THREE.CylinderGeometry(1.4, 1.4, bridgeLen, 24);
    bridgeOuterGeo.rotateZ(Math.PI / 2);
    const bridgeOuterMesh = new THREE.Mesh(bridgeOuterGeo, tubeMat);
    bridgeOuterMesh.position.set(bridgeStartX + bridgeLen / 2, 0, 0);
    bridgeGroup.add(bridgeOuterMesh);

    // Liquid core inside bridge tube
    const bridgeFluidGeo = new THREE.CylinderGeometry(0.95, 0.95, bridgeLen, 20);
    bridgeFluidGeo.rotateZ(Math.PI / 2);
    const bridgeFluidMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d4c8,
      transmission: 0.85,
      roughness: 0.1,
      transparent: true,
      opacity: 0.65,
    });
    const bridgeFluidMesh = new THREE.Mesh(bridgeFluidGeo, bridgeFluidMat);
    bridgeFluidMesh.position.set(bridgeStartX + bridgeLen / 2, 0, 0);
    bridgeGroup.add(bridgeFluidMesh);

    // Precision CNC Stainless Steel Luer-Lock Fitting at OoC interface (x = 0)
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.18,
    });

    const fittingGeo = new THREE.CylinderGeometry(2.4, 2.1, 4.8, 24);
    fittingGeo.rotateZ(Math.PI / 2);
    const fittingMesh = new THREE.Mesh(fittingGeo, steelMat);
    fittingMesh.position.set(-2.2, 0, 0);
    fittingMesh.castShadow = true;
    bridgeGroup.add(fittingMesh);

    const hexNutGeo = new THREE.CylinderGeometry(2.65, 2.65, 1.8, 6);
    hexNutGeo.rotateZ(Math.PI / 2);
    const hexNut = new THREE.Mesh(hexNutGeo, steelMat);
    hexNut.position.set(-3.6, 0, 0);
    bridgeGroup.add(hexNut);

    scene.add(bridgeGroup);

    // ==========================================
    // 7. MACHINE-VISION OPTICAL CAMERA & SENSOR CLAMP
    // Inspects fluid exiting the Bubble Trap before entering OoC
    // ==========================================
    const obsZoneGroup = new THREE.Group();
    const obsX = -12.0;

    // Optical Camera Head Assembly
    const camHousingGeo = new THREE.CylinderGeometry(2.8, 2.8, 6.5, 32);
    const camHousingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.25,
    });
    const cameraHousing = new THREE.Mesh(camHousingGeo, camHousingMat);
    cameraHousing.position.set(obsX, 8.5, 0);
    cameraHousing.castShadow = true;
    obsZoneGroup.add(cameraHousing);

    // Knurled Metal Aperture & Focus Rings
    [-1.2, 0.4, 2.0].forEach((yOff) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.85, 0.12, 16, 32),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.35 })
      );
      ring.position.set(obsX, 8.5 + yOff, 0);
      ring.rotation.x = Math.PI / 2;
      obsZoneGroup.add(ring);
    });

    // Optical C-Mount Objective Lens
    const lensFront = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.2, 3.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.2 })
    );
    lensFront.position.set(obsX, 3.6, 0);
    obsZoneGroup.add(lensFront);

    // Coated Optical Glass Front Element
    const glassElem = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.25, 0.2, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        transmission: 0.85,
        roughness: 0.05,
        ior: 1.65,
        transparent: true,
        opacity: 0.85,
      })
    );
    glassElem.position.set(obsX, 1.9, 0);
    obsZoneGroup.add(glassElem);

    // Optical Status LED Ring
    const ledRingMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const ledRingMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.18, 16, 32),
      ledRingMat
    );
    ledRingMesh.position.set(obsX, 5.4, 0);
    ledRingMesh.rotation.x = Math.PI / 2;
    obsZoneGroup.add(ledRingMesh);

    // Laser Anomaly Strobe Beam
    const laserBeamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.45,
    });
    const laserBeamMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 3.2, 16),
      laserBeamMat
    );
    laserBeamMesh.position.set(obsX, 2.4, 0);
    laserBeamMesh.visible = false;
    obsZoneGroup.add(laserBeamMesh);

    // Target reticle ring on tubing
    const targetSpotRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.06, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 })
    );
    targetSpotRing.rotation.x = Math.PI / 2;
    targetSpotRing.position.set(obsX, 0, 0);
    targetSpotRing.visible = false;
    obsZoneGroup.add(targetSpotRing);

    // Mounting stanchion post
    const stanchion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.95, roughness: 0.2 })
    );
    stanchion.position.set(obsX, 2, -3.2);
    obsZoneGroup.add(stanchion);

    scene.add(obsZoneGroup);

    // ==========================================
    // 8. DYNAMIC 3D BUBBLE (Refractive Sphere)
    // ==========================================
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.97,
      roughness: 0.03,
      metalness: 0.05,
      ior: 1.15,
      transparent: true,
      opacity: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const bubbleMesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 32), bubbleMat);
    bubbleMesh.position.set(obsX, 0, 0);
    bubbleMesh.visible = false;

    const bubbleInnerAura = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      })
    );
    bubbleMesh.add(bubbleInnerAura);
    scene.add(bubbleMesh);

    // ==========================================
    // 9. UNTOUCHED DUAL-LAYER ORGAN-ON-CHIP (OoC)
    // Preserved 100% in pristine scientific architecture:
    // - Standard 76mm x 26mm Borosilicate Slide Base
    // - Clear Optical PDMS Body
    // - Micro-Porous Permeable Membrane (y = 0)
    // - Upper Microchannel (Blue, y = +0.8)
    // - Lower Microchannel (Peach/Orange, y = -0.8)
    // - Dual Side Vacuum Chambers (breathing actuation)
    // ==========================================
    const oocGroup = new THREE.Group();
    oocGroup.name = 'ORGAN_ON_CHIP';

    const chipWidth = 40;
    const chipHeight = 5.4;
    const chipDepth = 20;
    const chipCenterX = 21.0;

    // A. Procedural Micro-Porous Membrane Texture
    const createPorousMembraneTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 256);

      ctx.fillStyle = '#1e293b';
      const poreStep = 8;
      const poreRad = 1.5;
      for (let px = 4; px < 512; px += poreStep) {
        for (let py = 4; py < 256; py += poreStep) {
          ctx.beginPath();
          ctx.arc(px, py, poreRad, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 1.5);
      return tex;
    };
    const membraneTexture = createPorousMembraneTexture();

    // B. Borosilicate Microscope Slide Base
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

    // Frosted label area on slide edge
    const frostedLabel = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 1.25, chipDepth + 3.8),
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.85,
        metalness: 0.1,
        transparent: true,
        opacity: 0.75,
      })
    );
    frostedLabel.position.set(chipCenterX + chipWidth / 2 + 1.5, -chipHeight / 2 - 0.6, 0);
    oocGroup.add(frostedLabel);

    // C. Optical PDMS Body
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

    // D. Micro-Porous Membrane (Interface at y = 0)
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

    // E. Upper Layer (Blue Channel - Apical / Epithelial)
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

    const upperMainMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 1.15, 2.6), upperChMat);
    upperMainMesh.position.set(chipCenterX, 0.8, 0);
    upperChannelGroup.add(upperMainMesh);

    // Upper Bifurcated Inlets
    [-3.8, 3.8].forEach((zOffset) => {
      const branchMesh = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.0, 1.2), upperChMat);
      branchMesh.position.set(chipCenterX - 13.5, 0.8, zOffset * 0.55);
      branchMesh.rotation.y = zOffset > 0 ? 0.45 : -0.45;
      upperChannelGroup.add(branchMesh);

      const portWellMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, chipHeight / 2 - 0.3, 24),
        upperChMat
      );
      portWellMesh.position.set(chipCenterX - 15.5, chipHeight / 4 + 0.6, zOffset);
      upperChannelGroup.add(portWellMesh);

      const collarMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.2 })
      );
      collarMesh.position.set(chipCenterX - 15.5, chipHeight / 2 + 0.4, zOffset);
      upperChannelGroup.add(collarMesh);
    });

    // Upper Bifurcated Outlets
    [-3.8, 3.8].forEach((zOffset) => {
      const branchMesh = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.0, 1.2), upperChMat);
      branchMesh.position.set(chipCenterX + 13.5, 0.8, zOffset * 0.55);
      branchMesh.rotation.y = zOffset > 0 ? -0.45 : 0.45;
      upperChannelGroup.add(branchMesh);

      const portWellMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, chipHeight / 2 - 0.3, 24),
        upperChMat
      );
      portWellMesh.position.set(chipCenterX + 15.5, chipHeight / 4 + 0.6, zOffset);
      upperChannelGroup.add(portWellMesh);

      const collarMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.2 })
      );
      collarMesh.position.set(chipCenterX + 15.5, chipHeight / 2 + 0.4, zOffset);
      upperChannelGroup.add(collarMesh);
    });

    oocGroup.add(upperChannelGroup);

    // F. Lower Layer (Peach / Orange Channel - Endothelial / Vascular)
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

    const lowerMainMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 1.15, 2.6), lowerChMat);
    lowerMainMesh.position.set(chipCenterX, -0.8, 0);
    lowerChannelGroup.add(lowerMainMesh);

    // Lower Inlet
    const lowerInletStem = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 1.4), lowerChMat);
    lowerInletStem.position.set(chipCenterX - 14.5, -0.8, 0);
    lowerChannelGroup.add(lowerInletStem);

    const lowerInletWell = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, chipHeight - 1.2, 24),
      lowerChMat
    );
    lowerInletWell.position.set(chipCenterX - 17.0, 0, 0);
    lowerChannelGroup.add(lowerInletWell);

    const lowerInletCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24),
      new THREE.MeshStandardMaterial({ color: 0xfb923c, metalness: 0.8, roughness: 0.3 })
    );
    lowerInletCollar.position.set(chipCenterX - 17.0, chipHeight / 2 + 0.4, 0);
    lowerChannelGroup.add(lowerInletCollar);

    // Lower Outlet
    const lowerOutletStem = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.0, 1.4), lowerChMat);
    lowerOutletStem.position.set(chipCenterX + 14.5, -0.8, 0);
    lowerChannelGroup.add(lowerOutletStem);

    const lowerOutletWell = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, chipHeight - 1.2, 24),
      lowerChMat
    );
    lowerOutletWell.position.set(chipCenterX + 17.0, 0, 0);
    lowerChannelGroup.add(lowerOutletWell);

    const lowerOutletCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24),
      new THREE.MeshStandardMaterial({ color: 0xfb923c, metalness: 0.8, roughness: 0.3 })
    );
    lowerOutletCollar.position.set(chipCenterX + 17.0, chipHeight / 2 + 0.4, 0);
    lowerChannelGroup.add(lowerOutletCollar);

    oocGroup.add(lowerChannelGroup);

    // G. Dual Side Vacuum Chambers (Breathing Actuation)
    const sideChamberMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transmission: 0.82,
      roughness: 0.2,
      metalness: 0.15,
      transparent: true,
      opacity: 0.45,
    });
    const sideChamberGeo = new THREE.BoxGeometry(22, 3.4, 2.2);

    const sideChamberLeft = new THREE.Mesh(sideChamberGeo, sideChamberMat);
    sideChamberLeft.position.set(chipCenterX, 0, -4.8);
    oocGroup.add(sideChamberLeft);

    const sideChamberRight = new THREE.Mesh(sideChamberGeo, sideChamberMat);
    sideChamberRight.position.set(chipCenterX, 0, 4.8);
    oocGroup.add(sideChamberRight);

    // Vacuum Actuation Ports on top surface
    [-4.8, 4.8].forEach((zOffset) => {
      const vacPort = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 1.2, 20),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 })
      );
      vacPort.position.set(chipCenterX, chipHeight / 2 + 0.6, zOffset);
      oocGroup.add(vacPort);
    });

    // Tubing from bridge fitting into chip port
    const chipInletTube = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 4.0, 16),
      tubeMat
    );
    chipInletTube.geometry.rotateZ(Math.PI / 2);
    chipInletTube.position.set(chipCenterX - 19.2, 0, 0);
    oocGroup.add(chipInletTube);

    scene.add(oocGroup);

    // ==========================================
    // 10. DOWNSTREAM SENSOR MANIFOLD & WASTE
    // ==========================================
    const downstreamGroup = new THREE.Group();
    downstreamGroup.name = 'SENSOR_MANIFOLD';

    // Connecting tube from OoC outlet into Sensor Manifold
    const drainTube = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 8.0, 16),
      tubeMat
    );
    drainTube.geometry.rotateZ(Math.PI / 2);
    drainTube.position.set(chipCenterX + chipWidth / 2 + 4.0, 0, 0);
    downstreamGroup.add(drainTube);

    // Solid CNC Bronze / Gold Sensor Manifold Block
    const manifoldGeo = new THREE.BoxGeometry(8.0, 7.0, 8.0);
    const manifoldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.22,
    });
    const manifoldMesh = new THREE.Mesh(manifoldGeo, manifoldMat);
    manifoldMesh.position.set(50.0, 0.5, 0);
    manifoldMesh.castShadow = true;
    downstreamGroup.add(manifoldMesh);

    // Electrochemical Probe (pH / DO Sensor) inserted on top
    const probeGeo = new THREE.CylinderGeometry(1.4, 1.4, 7.5, 24);
    const probeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.25,
    });
    const probeMesh = new THREE.Mesh(probeGeo, probeMat);
    probeMesh.position.set(50.0, 6.0, 0);
    downstreamGroup.add(probeMesh);

    // Sensor status indicator LED on manifold
    const probeLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 2.0,
      })
    );
    probeLed.position.set(50.0, 9.8, 0);
    downstreamGroup.add(probeLed);

    // Tube from Manifold to Waste Beaker
    const wasteTube = new THREE.Mesh(
      createTubeCurve(
        new THREE.Vector3(54.0, 0, 0),
        new THREE.Vector3(60.0, 2.0, 0),
        new THREE.Vector3(64.0, 4.0, 0)
      ),
      tubeMat
    );
    downstreamGroup.add(wasteTube);

    // Laboratory Waste Collection Beaker
    const wasteBeaker = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.2, 9.0, 32),
      glassMat
    );
    wasteBeaker.position.set(64.0, 2.5, 0);
    downstreamGroup.add(wasteBeaker);

    // Effluent Liquid inside waste beaker
    const effluentMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.0, 4.5, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        transmission: 0.8,
        roughness: 0.1,
        transparent: true,
        opacity: 0.6,
      })
    );
    effluentMesh.position.set(64.0, 0.5, 0);
    downstreamGroup.add(effluentMesh);

    scene.add(downstreamGroup);

    // ==========================================
    // 11. DUAL-STREAM MICRO-PIV PARTICLES
    // Upper blue stream & lower peach stream
    // ==========================================
    const createCircularParticleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.25, 'rgba(0, 240, 255, 0.9)');
      grad.addColorStop(0.55, 'rgba(0, 200, 230, 0.35)');
      grad.addColorStop(0.85, 'rgba(0, 160, 210, 0.08)');
      grad.addColorStop(1, 'rgba(0, 160, 210, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    };
    const particleTexture = createCircularParticleTexture();

    // 1. Upper Flow Stream Particles (Traverses Y-chip, bridge tube & OoC upper channel)
    const PARTICLE_COUNT = 160;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleProgress = new Float32Array(PARTICLE_COUNT);
    const particleSpeeds = new Float32Array(PARTICLE_COUNT);
    const particleOffsetsY = new Float32Array(PARTICLE_COUNT);
    const particleOffsetsZ = new Float32Array(PARTICLE_COUNT);

    const pathStartX = -46.0;
    const pathEndX = chipCenterX + 16.0;
    const pathTotalLen = pathEndX - pathStartX;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particleProgress[i] = Math.random();
      particleSpeeds[i] = 0.85 + Math.random() * 0.35;
      particleOffsetsY[i] = (Math.random() - 0.5) * 0.9;
      particleOffsetsZ[i] = (Math.random() - 0.5) * 0.9;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particlesMat = new THREE.PointsMaterial({
      map: particleTexture || undefined,
      color: 0x00f0ff,
      size: 0.85,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // 2. Lower Flow Stream Particles (Peach / Orange vascular capillary channel)
    const LOWER_PARTICLE_COUNT = 70;
    const lowerParticlePositions = new Float32Array(LOWER_PARTICLE_COUNT * 3);
    const lowerParticleProgress = new Float32Array(LOWER_PARTICLE_COUNT);
    const lowerParticleSpeeds = new Float32Array(LOWER_PARTICLE_COUNT);
    const lowerOffsetsZ = new Float32Array(LOWER_PARTICLE_COUNT);

    for (let i = 0; i < LOWER_PARTICLE_COUNT; i++) {
      lowerParticleProgress[i] = Math.random();
      lowerParticleSpeeds[i] = 0.85 + Math.random() * 0.35;
      lowerOffsetsZ[i] = (Math.random() - 0.5) * 1.6;
    }

    const lowerParticlesGeo = new THREE.BufferGeometry();
    lowerParticlesGeo.setAttribute('position', new THREE.BufferAttribute(lowerParticlePositions, 3));

    const lowerParticlesMat = new THREE.PointsMaterial({
      map: particleTexture || undefined,
      color: 0xf97316,
      size: 0.85,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lowerParticles = new THREE.Points(lowerParticlesGeo, lowerParticlesMat);
    scene.add(lowerParticles);

    // ==========================================
    // 12. CAMERA PRESETS & TRANSITIONS
    // ==========================================
    const PRESETS = {
      FULL_SYSTEM: { pos: new THREE.Vector3(-2, 18, 92), target: new THREE.Vector3(-2, 0, 0) },
      RESERVOIRS: { pos: new THREE.Vector3(-62, 10, 35), target: new THREE.Vector3(-62, 3, 0) },
      BUBBLE_TRAP: { pos: new THREE.Vector3(yChipCenterX, 10, 32), target: new THREE.Vector3(yChipCenterX, 0, 0) },
      INLET_OBSERVATION: { pos: new THREE.Vector3(obsX, 6, 26), target: new THREE.Vector3(obsX, 0, 0) },
      ORGAN_ON_CHIP: { pos: new THREE.Vector3(chipCenterX, 8, 30), target: new THREE.Vector3(chipCenterX, 0, 0) },
      SENSOR_MANIFOLD: { pos: new THREE.Vector3(56, 8, 32), target: new THREE.Vector3(56, 1, 0) },
    };

    let isTransitioningPreset = false;
    let presetProgress = 0;
    const presetStartPos = new THREE.Vector3();
    const presetStartTarget = new THREE.Vector3();
    const presetTargetPos = new THREE.Vector3();
    const presetTargetTarget = new THREE.Vector3();

    const triggerPresetTransition = (presetKey: CameraPreset) => {
      const p = PRESETS[presetKey] || PRESETS.FULL_SYSTEM;
      presetStartPos.copy(camera.position);
      presetStartTarget.copy(controls.target);

      presetTargetTarget.copy(p.target);
      presetTargetPos.copy(p.pos);

      isTransitioningPreset = true;
      presetProgress = 0;
    };

    controls.addEventListener('start', () => {
      isTransitioningPreset = false;
    });

    let prevPreset = presetRef.current;

    // ==========================================
    // 13. ANIMATION & TELEMETRY FLOW LOOP
    // ==========================================
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let bubbleLocalX = obsX - 8.0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Check for camera preset change
      if (presetRef.current !== prevPreset) {
        prevPreset = presetRef.current;
        triggerPresetTransition(presetRef.current);
      }

      // Smooth camera interpolation
      if (isTransitioningPreset) {
        presetProgress += delta * 2.2;
        if (presetProgress >= 1.0) {
          presetProgress = 1.0;
          isTransitioningPreset = false;
        }
        const t = THREE.MathUtils.smoothstep(presetProgress, 0, 1);
        camera.position.lerpVectors(presetStartPos, presetTargetPos, t);
        controls.target.lerpVectors(presetStartTarget, presetTargetTarget, t);
      }

      controls.update();

      // Telemetry-driven flow velocity
      const currentTelemetry = telemetryRef.current;
      const rawFlowRate = currentTelemetry.flow_rate || 450;
      const flowSpeedFactor = Math.max(0.05, Math.min(rawFlowRate / 450.0, 2.5));

      // 1. Upper stream particle movement
      const posArr = particlesGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (flowSpeedFactor > 0.01) {
          particleProgress[i] += delta * 0.14 * flowSpeedFactor * particleSpeeds[i];
          if (particleProgress[i] > 1.0) {
            particleProgress[i] = 0.0;
          }
        }

        const currX = pathStartX + particleProgress[i] * pathTotalLen;
        let currY = particleOffsetsY[i];
        let currZ = particleOffsetsZ[i];

        // Inside the Organ-on-Chip (currX > 0)
        if (currX > 0) {
          currY = 0.8 + particleOffsetsY[i] * 0.35;
          currZ = particleOffsetsZ[i] * 0.7;
        }

        posArr[i * 3 + 0] = currX;
        posArr[i * 3 + 1] = currY;
        posArr[i * 3 + 2] = currZ;
      }
      particlesGeo.attributes.position.needsUpdate = true;

      // 2. Lower stream particle movement through peach vascular channel
      const lowerPosArr = lowerParticlesGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < LOWER_PARTICLE_COUNT; i++) {
        if (flowSpeedFactor > 0.01) {
          lowerParticleProgress[i] += delta * 0.14 * flowSpeedFactor * lowerParticleSpeeds[i];
          if (lowerParticleProgress[i] > 1.0) {
            lowerParticleProgress[i] = 0.0;
          }
        }
        const lx = (chipCenterX - 12.0) + lowerParticleProgress[i] * 24.0;
        const ly = -0.8;
        const lz = lowerOffsetsZ[i] * 0.55;
        lowerPosArr[i * 3 + 0] = lx;
        lowerPosArr[i * 3 + 1] = ly;
        lowerPosArr[i * 3 + 2] = lz;
      }
      lowerParticlesGeo.attributes.position.needsUpdate = true;

      // 3. Physiological Cyclic Membrane & Side Chamber Breathing Actuation
      const breathPhase = Math.sin(time * 2.4);
      sideChamberLeft.scale.z = 1.0 + breathPhase * 0.05;
      sideChamberRight.scale.z = 1.0 + breathPhase * 0.05;
      membraneMesh.position.y = breathPhase * 0.025;

      // 4. Optical Observation Status & Anomaly Alert
      const prob = currentTelemetry.bubble_probability;
      const detected = currentTelemetry.bubble_detected;
      const isBubbleSpotted = detected || bubbleSpotRef.current || prob > 0.8;

      if (isBubbleSpotted) {
        const pulse = 0.6 + Math.sin(time * 9) * 0.4;
        ledRingMat.color.setHex(0xef4444);
        ledRingMat.emissive.setHex(0xef4444);
        ledRingMat.emissiveIntensity = 2.4 * pulse;
        inspectionLight.color.setHex(0xef4444);
        inspectionLight.intensity = 4.2 * pulse;

        targetSpotRing.visible = true;
        targetSpotRing.scale.setScalar(1.0 + Math.sin(time * 8) * 0.12);
        laserBeamMesh.visible = true;
        laserBeamMat.opacity = 0.55 + Math.sin(time * 12) * 0.25;

        // Dynamic 3D Bubble Motion
        bubbleMesh.visible = true;
        if (flowSpeedFactor > 0.01) {
          bubbleLocalX += delta * 5.0 * flowSpeedFactor;
          if (bubbleLocalX > 1.5) {
            bubbleLocalX = obsX - 8.0;
          }
        }
        bubbleMesh.position.x = bubbleLocalX;
        bubbleMesh.position.y = Math.sin(time * 5) * 0.12;
        bubbleMesh.position.z = Math.cos(time * 4) * 0.12;
        bubbleInnerAura.visible = true;
      } else {
        ledRingMat.color.setHex(0x00f0ff);
        ledRingMat.emissive.setHex(0x00f0ff);
        ledRingMat.emissiveIntensity = 1.0;
        inspectionLight.color.setHex(0x00f0ff);
        inspectionLight.intensity = 1.8;

        targetSpotRing.visible = false;
        laserBeamMesh.visible = false;
        bubbleMesh.visible = false;
        bubbleLocalX = obsX - 8.0;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      particleTexture?.dispose();
      membraneTexture?.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex-1 min-h-0 overflow-hidden bg-[#0a1120] select-none">
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
