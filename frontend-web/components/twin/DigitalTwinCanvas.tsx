'use client';

/**
 * BioGuardian 3D Digital Twin - Photorealistic Microfluidic Engine
 *
 * Visually authentic scientific laboratory visualization:
 * - Precision Machine-Vision Optical Inspection Camera (brushed aluminum, knurled lens, C-mount)
 * - Thorlabs-style Optical Breadboard Stage with illuminated brushed metal finish
 * - Micro-PIV Spherical Tracer Beads with smooth soft circular alpha gradients (no square blocks!)
 * - Clear FEP/PDMS Microfluidic Tubing with surgical stainless-steel luer-lock fittings
 * - Detailed Transparent Organ-on-Chip with micro-etched channels and living cell membrane
 * - Dynamic 3D Refractive Bubble moving in physical microfluidic flow
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
    cameraPreset,
    setCameraPreset,
    setInspectionTarget,
    showBubbleSpotVisual,
  } = useTelemetry();

  const telemetryRef = useRef(telemetry);
  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  const presetRef = useRef<CameraPreset>(cameraPreset);
  useEffect(() => {
    presetRef.current = cameraPreset;
  }, [cameraPreset]);

  const bubbleSpotRef = useRef(showBubbleSpotVisual);
  useEffect(() => {
    bubbleSpotRef.current = showBubbleSpotVisual;
  }, [showBubbleSpotVisual]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ==========================================
    // 1. SCENE & ENVIRONMENT
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1120);
    scene.fog = new THREE.FogExp2(0x0a1120, 0.0055);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(-2, 10, 44);

    // High-Fidelity WebGL Renderer
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
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 140;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(-2, 0, 0);

    // ==========================================
    // 2. STUDIO LABORATORY LIGHTING RIG
    // (Eliminates pitch-black silhouettes)
    // ==========================================
    // Hemisphere Light ensures no surface is ever pure black
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.8);
    scene.add(hemiLight);

    // Main Overhead Laboratory Key Light
    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    mainKeyLight.position.set(25, 50, 35);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.bias = -0.0001;
    scene.add(mainKeyLight);

    // Front-Face Fill Light (illuminates front of camera housing & fittings)
    const frontFillLight = new THREE.DirectionalLight(0xe2e8f0, 1.8);
    frontFillLight.position.set(-15, 20, 45);
    scene.add(frontFillLight);

    // Rear Cyan Rim Light (produces clean glass & liquid refraction rim)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimLight.position.set(-35, -10, -40);
    scene.add(rimLight);

    // Top Organ-on-Chip Luminescence
    const chipTopLight = new THREE.PointLight(0x2dd4bf, 2.2, 50);
    chipTopLight.position.set(17.5, 10, 8);
    scene.add(chipTopLight);

    // Optical Inspection Zone Spotlight
    const inspectionLight = new THREE.PointLight(0x00f0ff, 3.0, 35);
    inspectionLight.position.set(-20, 7, 3);
    scene.add(inspectionLight);

    // ==========================================
    // 3. OPTICAL BREADBOARD LABORATORY STAGE
    // (Thorlabs-style anodized aluminum plate)
    // ==========================================
    const stageGroup = new THREE.Group();

    // Solid Brushed Aluminum Optical Isolation Breadboard Plate
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

    // Beveled Border Rim
    const rimGeo = new THREE.BoxGeometry(breadboardWidth + 1.2, 0.6, breadboardDepth + 1.2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.95,
      roughness: 0.15,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = -8 + 0.1;
    stageGroup.add(rimMesh);

    // Subtle M6 Optical Grid Pattern on stage
    const gridHelper = new THREE.GridHelper(breadboardWidth - 8, 38, 0x38bdf8, 0x334155);
    gridHelper.position.y = -7.95;
    stageGroup.add(gridHelper);

    // Stainless Steel Vibration Isolation Mounting Posts
    [-80, 80].forEach((posX) => {
      [-44, 44].forEach((posZ) => {
        const footGeo = new THREE.CylinderGeometry(3.0, 3.4, 3, 24);
        const footMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.95,
          roughness: 0.2,
        });
        const foot = new THREE.Mesh(footGeo, footMat);
        foot.position.set(posX, -11, posZ);
        stageGroup.add(foot);
      });
    });

    // Extensive Laboratory Isolation Bench Floor (eliminates bottom cut-offs)
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
    // 4. INLET MICROFLUIDIC TUBE & SURGICAL FITTINGS
    // ==========================================
    const inletGroup = new THREE.Group();
    inletGroup.name = 'INLET_OBSERVATION';

    const tubeLength = 45;
    const tubeOuterRadius = 1.75;
    const tubeInnerRadius = 1.25;

    // Ultra-Clear Fluorinated FEP/PDMS Flexible Tubing
    const tubeOuterGeo = new THREE.CylinderGeometry(tubeOuterRadius, tubeOuterRadius, tubeLength, 36);
    tubeOuterGeo.rotateZ(Math.PI / 2);
    const tubeOuterMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.95,
      roughness: 0.04,
      metalness: 0.02,
      ior: 1.46,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    const tubeOuterMesh = new THREE.Mesh(tubeOuterGeo, tubeOuterMat);
    tubeOuterMesh.position.set(-tubeLength / 2, 0, 0);
    inletGroup.add(tubeOuterMesh);

    // Liquid Core inside Inlet Tube
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
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.18,
    });

    // Main threaded barrel
    const fittingGeo = new THREE.CylinderGeometry(2.4, 2.1, 4.8, 24);
    fittingGeo.rotateZ(Math.PI / 2);
    const fittingMesh = new THREE.Mesh(fittingGeo, steelMat);
    fittingMesh.position.set(-2.2, 0, 0);
    fittingMesh.castShadow = true;
    inletGroup.add(fittingMesh);

    // Hexagonal compression nut
    const hexNutGeo = new THREE.CylinderGeometry(2.65, 2.65, 1.8, 6);
    hexNutGeo.rotateZ(Math.PI / 2);
    const hexNut = new THREE.Mesh(hexNutGeo, steelMat);
    hexNut.position.set(-3.6, 0, 0);
    inletGroup.add(hexNut);

    // Anodized Teal Accent Ring
    const accentRingGeo = new THREE.TorusGeometry(2.6, 0.25, 16, 32);
    const accentRingMat = new THREE.MeshStandardMaterial({
      color: 0x00d4c8,
      metalness: 0.85,
      roughness: 0.25,
    });
    const accentRing = new THREE.Mesh(accentRingGeo, accentRingMat);
    accentRing.position.set(-1.0, 0, 0);
    accentRing.rotation.y = Math.PI / 2;
    inletGroup.add(accentRing);

    scene.add(inletGroup);

    // ==========================================
    // 5. MACHINE-VISION OPTICAL INSPECTION CAMERA
    // (Industrial Brushed Anodized Aluminum - NO BLACK MONOLITHS)
    // ==========================================
    const obsZoneGroup = new THREE.Group();
    obsZoneGroup.name = 'INLET_OBSERVATION';
    const obsX = -20;

    // Optical Tube Mounting Clamp Block (Anodized Satin Slate Metal)
    const clampGeo = new THREE.CylinderGeometry(2.9, 2.9, 5.5, 32);
    clampGeo.rotateZ(Math.PI / 2);
    const clampMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.28,
    });
    const clampMesh = new THREE.Mesh(clampGeo, clampMat);
    clampMesh.position.set(obsX, 0, 0);
    obsZoneGroup.add(clampMesh);

    // Dual-Sided Optical Quartz Glass Viewing Windows
    const quartzWindowGeo = new THREE.CylinderGeometry(2.92, 2.92, 2.2, 32, 1, false, 0, Math.PI);
    quartzWindowGeo.rotateZ(Math.PI / 2);
    const quartzWindowMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      transmission: 0.96,
      roughness: 0.04,
      transparent: true,
      opacity: 0.45,
    });
    const quartzWindow = new THREE.Mesh(quartzWindowGeo, quartzWindowMat);
    quartzWindow.position.set(obsX, 0, 0);
    obsZoneGroup.add(quartzWindow);

    // Main Camera Body: High-Precision Industrial Machine Vision Housing
    // Made of brushed silver/titanium anodized aluminum (bright, technical, detailed)
    const camBodyGeo = new THREE.BoxGeometry(5.2, 5.8, 5.2);
    const camBodyMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.82,
      roughness: 0.24,
    });
    const camBody = new THREE.Mesh(camBodyGeo, camBodyMat);
    camBody.position.set(obsX, 6.2, 0);
    camBody.castShadow = true;
    obsZoneGroup.add(camBody);

    // Camera Heat-Dissipation Fins (CNC cooling grooves on side)
    [-1.2, 0, 1.2].forEach((offsetY) => {
      const finGeo = new THREE.BoxGeometry(5.4, 0.4, 5.4);
      const finMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.88,
        roughness: 0.3,
      });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(obsX, 6.2 + offsetY, 0);
      obsZoneGroup.add(fin);
    });

    // Camera Corner Hex Screws
    [
      [-2.1, 2.4],
      [2.1, 2.4],
      [-2.1, -2.4],
      [2.1, -2.4],
    ].forEach(([dx, dz]) => {
      const screwGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 12);
      const screwMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.15,
      });
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.position.set(obsX + dx, 9.15, dz);
      obsZoneGroup.add(screw);
    });

    // C-Mount Precision Optical Lens Barrel (Stepped metallic cylinders)
    const lensBaseGeo = new THREE.CylinderGeometry(1.8, 2.1, 1.4, 32);
    const lensBarrelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.92,
      roughness: 0.2,
    });
    const lensBase = new THREE.Mesh(lensBaseGeo, lensBarrelMat);
    lensBase.position.set(obsX, 3.2, 0);
    obsZoneGroup.add(lensBase);

    // Knurled Focus Adjustment Ring (Silver anodized ring)
    const knurlGeo = new THREE.CylinderGeometry(1.85, 1.85, 0.6, 32);
    const knurlMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.96,
      roughness: 0.15,
    });
    const knurlRing = new THREE.Mesh(knurlGeo, knurlMat);
    knurlRing.position.set(obsX, 2.7, 0);
    obsZoneGroup.add(knurlRing);

    // Front Objective Lens Barrel
    const lensFrontGeo = new THREE.CylinderGeometry(1.4, 1.7, 1.2, 32);
    const lensFront = new THREE.Mesh(lensFrontGeo, lensBarrelMat);
    lensFront.position.set(obsX, 1.9, 0);
    obsZoneGroup.add(lensFront);

    // Coated Optical Glass Front Element (Multi-coated green/cyan reflection)
    const glassElemGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.2, 32);
    const glassElemMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      transmission: 0.85,
      roughness: 0.05,
      metalness: 0.2,
      ior: 1.65,
      transparent: true,
      opacity: 0.85,
    });
    const glassElem = new THREE.Mesh(glassElemGeo, glassElemMat);
    glassElem.position.set(obsX, 1.3, 0);
    obsZoneGroup.add(glassElem);

    // Optical Status LED Ring on Camera Head
    const ledRingGeo = new THREE.TorusGeometry(1.9, 0.18, 16, 32);
    const ledRingMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const ledRingMesh = new THREE.Mesh(ledRingGeo, ledRingMat);
    ledRingMesh.position.set(obsX, 4.8, 0);
    ledRingMesh.rotation.x = Math.PI / 2;
    obsZoneGroup.add(ledRingMesh);

    // Vertical Optical Laser Beam (from camera lens down through tubing) - visible on anomaly
    const laserBeamGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.2, 16);
    const laserBeamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.45,
    });
    const laserBeamMesh = new THREE.Mesh(laserBeamGeo, laserBeamMat);
    laserBeamMesh.position.set(obsX, 1.8, 0);
    laserBeamMesh.visible = false;
    obsZoneGroup.add(laserBeamMesh);

    // Horizontal Bubble Spot Target Reticle Ring - visible on anomaly
    const targetSpotRingGeo = new THREE.TorusGeometry(2.0, 0.06, 16, 48);
    targetSpotRingGeo.rotateX(Math.PI / 2);
    const targetSpotRingMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.8,
    });
    const targetSpotRing = new THREE.Mesh(targetSpotRingGeo, targetSpotRingMat);
    targetSpotRing.position.set(obsX, 0, 0);
    targetSpotRing.visible = false;
    obsZoneGroup.add(targetSpotRing);

    // Stainless Steel Mounting Stanchion / Post connecting camera to breadboard
    const postGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 24);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.95,
      roughness: 0.2,
    });
    const stanchion = new THREE.Mesh(postGeo, postMat);
    stanchion.position.set(obsX, 2, -3.2);
    obsZoneGroup.add(stanchion);

    scene.add(obsZoneGroup);

    // ==========================================
    // 6. DYNAMIC 3D BUBBLE (Refractive Sphere)
    // ==========================================
    const bubbleGeo = new THREE.SphereGeometry(1.1, 32, 32);
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
    const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    bubbleMesh.position.set(-36, 0, 0);
    bubbleMesh.visible = false;

    // Subtle Internal Red Warning Aura during Alert
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
    // 7. DETAILED ORGAN-ON-CHIP (PDMS & Glass)
    // ==========================================
    const oocGroup = new THREE.Group();
    oocGroup.name = 'ORGAN_ON_CHIP';

    const chipWidth = 36;
    const chipHeight = 5.2;
    const chipDepth = 22;
    const chipCenterX = chipWidth / 2; // ~18.0

    // Transparent PDMS Chip Body (Ultra-clear scientific polymer)
    const chipBodyGeo = new THREE.BoxGeometry(chipWidth, chipHeight, chipDepth);
    const chipBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0fdfa,
      transmission: 0.95,
      roughness: 0.05,
      metalness: 0.04,
      ior: 1.48,
      thickness: 4.0,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const chipBodyMesh = new THREE.Mesh(chipBodyGeo, chipBodyMat);
    chipBodyMesh.position.set(chipCenterX, 0, 0);
    chipBodyMesh.castShadow = true;
    oocGroup.add(chipBodyMesh);

    // Precision Polished Chamfer Edges
    const chipEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(chipBodyGeo),
      new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.65,
      })
    );
    chipBodyMesh.add(chipEdges);

    // Standard 75x25mm Microscope Slide Borosilicate Glass Base
    const slideBaseGeo = new THREE.BoxGeometry(chipWidth + 5, 1.1, chipDepth + 4);
    const slideBaseMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: 0.96,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.515,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const slideBaseMesh = new THREE.Mesh(slideBaseGeo, slideBaseMat);
    slideBaseMesh.position.set(chipCenterX, -chipHeight / 2 - 0.55, 0);
    oocGroup.add(slideBaseMesh);

    // Chip Fluid Inlet Port (x = 2.5)
    const portGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.8, 24);
    const portMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.18,
    });
    const inletPortMesh = new THREE.Mesh(portGeo, portMat);
    inletPortMesh.position.set(2.5, chipHeight / 2 + 1.2, 0);
    oocGroup.add(inletPortMesh);

    // Chip Fluid Outlet Port (x = 33.5)
    const outletPortMesh = new THREE.Mesh(portGeo, portMat);
    outletPortMesh.position.set(chipWidth - 2.5, chipHeight / 2 + 1.2, 0);
    oocGroup.add(outletPortMesh);

    // Outlet Drain Tubing
    const outletTubeGeo = new THREE.CylinderGeometry(1.5, 1.5, 18, 24);
    outletTubeGeo.rotateZ(Math.PI / 2);
    const outletTubeMesh = new THREE.Mesh(outletTubeGeo, tubeOuterMat);
    outletTubeMesh.position.set(chipWidth + 7, 0, 0);
    oocGroup.add(outletTubeMesh);

    // Outlet Luer Fitting
    const outletFitting = new THREE.Mesh(fittingGeo, steelMat);
    outletFitting.position.set(chipWidth + 2.2, 0, 0);
    outletFitting.rotation.y = Math.PI;
    oocGroup.add(outletFitting);

    // INTERNAL MICROFLUIDIC CHANNELS
    const channelGroup = new THREE.Group();

    // Microchannel material with soft cyan luminescence
    const chMat = new THREE.MeshStandardMaterial({
      color: 0x00d4c8,
      emissive: 0x005c56,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88,
    });

    // 1. Channel Inflow (x: 2.5 to 12.0)
    const chInflowGeo = new THREE.BoxGeometry(9.5, 0.8, 1.2);
    const chInflow = new THREE.Mesh(chInflowGeo, chMat);
    chInflow.position.set(7.25, 0, 0);
    channelGroup.add(chInflow);

    // Serpentine Capillary Channels
    [-3.2, 3.2].forEach((offsetZ) => {
      const branchGeo = new THREE.BoxGeometry(6.0, 0.5, 0.75);
      const branchMesh = new THREE.Mesh(branchGeo, chMat);
      branchMesh.position.set(10.0, 0, offsetZ);
      channelGroup.add(branchMesh);
    });

    // 2. Central Micro-Culture Organ Chamber (x = 18.0)
    const chamberGeo = new THREE.CylinderGeometry(5.2, 5.2, 1.6, 36);
    const chamberMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.75,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.78,
    });
    const chamberMesh = new THREE.Mesh(chamberGeo, chamberMat);
    chamberMesh.position.set(chipCenterX, 0, 0);
    channelGroup.add(chamberMesh);

    // Micropatterned Porous Membrane (Endothelial Partition)
    const membraneGeo = new THREE.CylinderGeometry(5.0, 5.0, 0.1, 32);
    const membraneMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x0f766e,
      emissiveIntensity: 1.0,
      wireframe: true,
    });
    const membraneMesh = new THREE.Mesh(membraneGeo, membraneMat);
    membraneMesh.position.set(chipCenterX, 0, 0);
    channelGroup.add(membraneMesh);

    // Cellular Monolayer Luminescent Ring
    const cellRingGeo = new THREE.TorusGeometry(3.6, 0.35, 16, 32);
    const cellMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const cellRing = new THREE.Mesh(cellRingGeo, cellMat);
    cellRing.position.set(chipCenterX, 0.2, 0);
    cellRing.rotation.x = Math.PI / 2;
    channelGroup.add(cellRing);

    // 3. Channel Outflow (x: 23.0 to 33.5)
    const chOutflowGeo = new THREE.BoxGeometry(10.5, 0.8, 1.2);
    const chOutflow = new THREE.Mesh(chOutflowGeo, chMat);
    chOutflow.position.set(28.25, 0, 0);
    channelGroup.add(chOutflow);

    oocGroup.add(channelGroup);
    scene.add(oocGroup);

    // ==========================================
    // 8. REALISTIC SPHERICAL MICRO-PIV TRACER BEADS
    // (Smooth circular alpha sprite - NO CHUNKY SQUARES!)
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

    const PARTICLE_COUNT = 150;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleProgress = new Float32Array(PARTICLE_COUNT);
    const particleSpeeds = new Float32Array(PARTICLE_COUNT);
    const particleOffsetsY = new Float32Array(PARTICLE_COUNT);
    const particleOffsetsZ = new Float32Array(PARTICLE_COUNT);

    const pathStartX = -44;
    const pathEndX = 44;
    const pathTotalLen = pathEndX - pathStartX;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particleProgress[i] = Math.random();
      particleSpeeds[i] = 0.85 + Math.random() * 0.35;
      particleOffsetsY[i] = (Math.random() - 0.5) * 1.1;
      particleOffsetsZ[i] = (Math.random() - 0.5) * 1.1;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particlesMat = new THREE.PointsMaterial({
      map: particleTexture || undefined,
      color: 0x00f0ff,
      size: 0.85, // Realistic delicate micro-spheres
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // ==========================================
    // 9. RAYCASTING INTERACTION
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([obsZoneGroup, oocGroup, inletGroup], true);

      if (intersects.length > 0) {
        let currentObj: THREE.Object3D | null = intersects[0].object;
        while (currentObj && !currentObj.name && currentObj.parent) {
          currentObj = currentObj.parent;
        }

        if (currentObj?.name === 'ORGAN_ON_CHIP') {
          setInspectionTarget('ORGAN_ON_CHIP');
          setCameraPreset('ORGAN_ON_CHIP');
        } else if (currentObj?.name === 'INLET_OBSERVATION') {
          setInspectionTarget('INLET_OBSERVATION');
          setCameraPreset('INLET_OBSERVATION');
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);

    // ==========================================
    // 10. ANIMATION & TELEMETRY FLOW LOOP
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let bubbleLocalX = -36;

    // Perfectly centered & framed camera presets filling 100% of the screen
    const PRESETS = {
      FULL_SYSTEM: { pos: new THREE.Vector3(-2, 10, 44), target: new THREE.Vector3(-2, 0, 0) },
      // Balanced eye-level observation angle directly centering the tube, sensor clamp & bubble detection
      INLET_OBSERVATION: { pos: new THREE.Vector3(-18, 3, 21), target: new THREE.Vector3(-18, 0, 0) },
      ORGAN_ON_CHIP: { pos: new THREE.Vector3(chipCenterX, 5, 22), target: new THREE.Vector3(chipCenterX, 0, 0) },
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const currentTelemetry = telemetryRef.current;

      // Camera interpolation towards selected preset
      const targetPreset = PRESETS[presetRef.current] || PRESETS.FULL_SYSTEM;
      camera.position.lerp(targetPreset.pos, 0.05);
      controls.target.lerp(targetPreset.target, 0.05);
      controls.update();

      // Flow speed factor
      const flowRate = Math.max(0, currentTelemetry.flow_rate || 0);
      const flowSpeedFactor = flowRate / 450.0;

      // Particle movement along microfluidic path
      const posArr = particlesGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (flowSpeedFactor > 0.01) {
          particleProgress[i] += delta * 0.16 * flowSpeedFactor * particleSpeeds[i];
          if (particleProgress[i] > 1.0) {
            particleProgress[i] = 0.0;
          }
        }

        const currX = pathStartX + particleProgress[i] * pathTotalLen;
        let currY = particleOffsetsY[i];
        let currZ = particleOffsetsZ[i];

        // Chamber expansion widening
        if (currX > 12 && currX < 24) {
          const chamberRatio = Math.sin(((currX - 12) / 12) * Math.PI);
          currZ *= 1.0 + chamberRatio * 2.2;
        }

        posArr[i * 3 + 0] = currX;
        posArr[i * 3 + 1] = currY;
        posArr[i * 3 + 2] = currZ;
      }
      particlesGeo.attributes.position.needsUpdate = true;

      // Optical Observation Status Ring & LED
      const prob = currentTelemetry.bubble_probability;
      const detected = currentTelemetry.bubble_detected;
      const isBubbleSpotted = detected || bubbleSpotRef.current || prob > 0.8;

      if (isBubbleSpotted) {
        // Red alert optical pulse & laser target spotting
        const pulse = 0.6 + Math.sin(time * 9) * 0.4;
        ledRingMat.color.setHex(0xef4444);
        ledRingMat.emissive.setHex(0xef4444);
        ledRingMat.emissiveIntensity = 2.4 * pulse;
        inspectionLight.color.setHex(0xef4444);
        inspectionLight.intensity = 4.2 * pulse;

        // Warning reticle & laser strobe (visible only when bubble is spotted)
        targetSpotRing.visible = true;
        targetSpotRing.scale.setScalar(1.0 + Math.sin(time * 8) * 0.12);
        laserBeamMesh.visible = true;
        laserBeamMat.opacity = 0.55 + Math.sin(time * 12) * 0.25;
      } else if (prob > 0.35) {
        // Amber warning
        ledRingMat.color.setHex(0xf59e0b);
        ledRingMat.emissive.setHex(0xf59e0b);
        ledRingMat.emissiveIntensity = 1.2;
        inspectionLight.color.setHex(0xf59e0b);
        inspectionLight.intensity = 2.2;

        targetSpotRing.visible = false;
        laserBeamMesh.visible = false;
      } else {
        // Cyan nominal
        ledRingMat.color.setHex(0x00f0ff);
        ledRingMat.emissive.setHex(0x00f0ff);
        ledRingMat.emissiveIntensity = 1.0;
        inspectionLight.color.setHex(0x00f0ff);
        inspectionLight.intensity = 1.8;

        targetSpotRing.visible = false;
        laserBeamMesh.visible = false;
      }

      // Dynamic 3D Bubble Motion
      if (isBubbleSpotted) {
        bubbleMesh.visible = true;
        if (flowSpeedFactor > 0.01) {
          bubbleLocalX += delta * 5.0 * flowSpeedFactor;
          if (bubbleLocalX > 1.5) {
            bubbleLocalX = -38;
          }
        }
        bubbleMesh.position.x = bubbleLocalX;
        bubbleMesh.position.y = Math.sin(time * 5) * 0.12;
        bubbleMesh.position.z = Math.cos(time * 4) * 0.12;

        bubbleInnerAura.visible = true;
        (bubbleInnerAura.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
      } else {
        bubbleMesh.visible = false;
        bubbleLocalX = -38;
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
      domElement.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      particleTexture?.dispose();
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
