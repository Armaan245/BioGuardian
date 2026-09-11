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
    // 7. REAL SCIENTIFIC DUAL-LAYER ORGAN-ON-CHIP
    // (Matching Wyss Institute / Standard OOC Architecture)
    // - Borosilicate Microscope Slide Glass Base (76mm x 26mm format)
    // - Optically Clear PDMS Elastomeric Polymer Block
    // - Upper Microchannel (Blue - Apical / Epithelial / Treatment)
    // - Micro-Porous Permeable Membrane (Central Cell-Culture Interface)
    // - Lower Microchannel (Peach/Orange - Endothelial / Vascular Shear Flow)
    // - Dual Side Vacuum Chambers (Cyclic Physiological Breathing / Peristalsis)
    // ==========================================
    const oocGroup = new THREE.Group();
    oocGroup.name = 'ORGAN_ON_CHIP';

    const chipWidth = 40;
    const chipHeight = 5.4;
    const chipDepth = 20;
    const chipCenterX = 21.0;

    // A. Procedural Micro-Porous Membrane Texture (Porous grid array)
    const createPorousMembraneTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Pearlescent membrane sheet
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 256);

      // Microscopic pore matrix (regular micro-apertures)
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

    // B. Standard 76mm x 26mm Borosilicate Microscope Slide Base
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

    // Frosted label area on microscope slide edge (scientific detail)
    const frostedLabelGeo = new THREE.BoxGeometry(8.5, 1.25, chipDepth + 3.8);
    const frostedLabelMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.85,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
    });
    const frostedLabel = new THREE.Mesh(frostedLabelGeo, frostedLabelMat);
    frostedLabel.position.set(chipCenterX + chipWidth / 2 + 1.5, -chipHeight / 2 - 0.6, 0);
    oocGroup.add(frostedLabel);

    // C. Ultra-Clear Optical PDMS Elastomer Body
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

    // Beveled Chamfer Edge Accents
    const chipEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(chipBodyGeo),
      new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.55,
      })
    );
    chipBodyMesh.add(chipEdges);

    // D. MICRO-POROUS MEMBRANE (Central Scaffold Interface at y = 0)
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

    // Fine border frame around membrane
    const membraneFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(26.2, 0.15, 9.7)),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
    );
    membraneFrame.position.set(chipCenterX, 0, 0);
    oocGroup.add(membraneFrame);

    // E. UPPER LAYER (Blue Channel - Apical / Epithelial / Treatment)
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

    // Central Straight Upper Channel (y = +0.8)
    const upperMainGeo = new THREE.BoxGeometry(24, 1.15, 2.6);
    const upperMainMesh = new THREE.Mesh(upperMainGeo, upperChMat);
    upperMainMesh.position.set(chipCenterX, 0.8, 0);
    upperChannelGroup.add(upperMainMesh);

    // Upper Channel Bifurcated Inlets (Y-branch split as in Figure A)
    [-3.8, 3.8].forEach((zOffset) => {
      // Diagonal feeder branch
      const branchGeo = new THREE.BoxGeometry(4.8, 1.0, 1.2);
      const branchMesh = new THREE.Mesh(branchGeo, upperChMat);
      branchMesh.position.set(chipCenterX - 13.5, 0.8, zOffset * 0.55);
      branchMesh.rotation.y = zOffset > 0 ? 0.45 : -0.45;
      upperChannelGroup.add(branchMesh);

      // Vertical Inlet Port Well (punched through top of PDMS)
      const portWellGeo = new THREE.CylinderGeometry(1.2, 1.2, chipHeight / 2 - 0.3, 24);
      const portWellMesh = new THREE.Mesh(portWellGeo, upperChMat);
      portWellMesh.position.set(chipCenterX - 15.5, chipHeight / 4 + 0.6, zOffset);
      upperChannelGroup.add(portWellMesh);

      // Top Stainless Steel Fluidic Luer Ferrule Collar
      const collarGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24);
      const collarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.2 });
      const collarMesh = new THREE.Mesh(collarGeo, collarMat);
      collarMesh.position.set(chipCenterX - 15.5, chipHeight / 2 + 0.4, zOffset);
      upperChannelGroup.add(collarMesh);
    });

    // Upper Channel Bifurcated Outlets (Y-branch split at right)
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
      const collarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.2 });
      const collarMesh = new THREE.Mesh(collarGeo, collarMat);
      collarMesh.position.set(chipCenterX + 15.5, chipHeight / 2 + 0.4, zOffset);
      upperChannelGroup.add(collarMesh);
    });

    oocGroup.add(upperChannelGroup);

    // F. LOWER LAYER (Peach / Orange Channel - Endothelial / Vascular Shear Flow)
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

    // Central Straight Lower Channel (y = -0.8, directly under membrane)
    const lowerMainGeo = new THREE.BoxGeometry(24, 1.15, 2.6);
    const lowerMainMesh = new THREE.Mesh(lowerMainGeo, lowerChMat);
    lowerMainMesh.position.set(chipCenterX, -0.8, 0);
    lowerChannelGroup.add(lowerMainMesh);

    // Lower Channel Staggered Inlet & Outlet ports (as in Figure A & C)
    const lowerInletStemGeo = new THREE.BoxGeometry(5.2, 1.0, 1.4);
    const lowerInletStem = new THREE.Mesh(lowerInletStemGeo, lowerChMat);
    lowerInletStem.position.set(chipCenterX - 14.5, -0.8, 0);
    lowerChannelGroup.add(lowerInletStem);

    const lowerInletWellGeo = new THREE.CylinderGeometry(1.2, 1.2, chipHeight - 1.2, 24);
    const lowerInletWell = new THREE.Mesh(lowerInletWellGeo, lowerChMat);
    lowerInletWell.position.set(chipCenterX - 17.0, 0, 0);
    lowerChannelGroup.add(lowerInletWell);

    const lowerInletCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24),
      new THREE.MeshStandardMaterial({ color: 0xfb923c, metalness: 0.8, roughness: 0.3 })
    );
    lowerInletCollar.position.set(chipCenterX - 17.0, chipHeight / 2 + 0.4, 0);
    lowerChannelGroup.add(lowerInletCollar);

    // Lower Channel Outlet port
    const lowerOutletStemGeo = new THREE.BoxGeometry(5.2, 1.0, 1.4);
    const lowerOutletStem = new THREE.Mesh(lowerOutletStemGeo, lowerChMat);
    lowerOutletStem.position.set(chipCenterX + 14.5, -0.8, 0);
    lowerChannelGroup.add(lowerOutletStem);

    const lowerOutletWellGeo = new THREE.CylinderGeometry(1.2, 1.2, chipHeight - 1.2, 24);
    const lowerOutletWell = new THREE.Mesh(lowerOutletWellGeo, lowerChMat);
    lowerOutletWell.position.set(chipCenterX + 17.0, 0, 0);
    lowerChannelGroup.add(lowerOutletWell);

    const lowerOutletCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.8, 24),
      new THREE.MeshStandardMaterial({ color: 0xfb923c, metalness: 0.8, roughness: 0.3 })
    );
    lowerOutletCollar.position.set(chipCenterX + 17.0, chipHeight / 2 + 0.4, 0);
    lowerChannelGroup.add(lowerOutletCollar);

    oocGroup.add(lowerChannelGroup);

    // G. DUAL SIDE VACUUM CHAMBERS ("Side chambers" from Figure A Cross-section)
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

    const sideChamberLeftEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(sideChamberGeo),
      new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.45 })
    );
    sideChamberLeft.add(sideChamberLeftEdges);

    const sideChamberRight = new THREE.Mesh(sideChamberGeo, sideChamberMat);
    sideChamberRight.position.set(chipCenterX, 0, 4.8);
    oocGroup.add(sideChamberRight);

    const sideChamberRightEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(sideChamberGeo),
      new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.45 })
    );
    sideChamberRight.add(sideChamberRightEdges);

    // Side Chamber Vacuum Actuation Ports on top surface
    [-4.8, 4.8].forEach((zOffset) => {
      const vacPortGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.2, 20);
      const vacPortMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
      const vacPortMesh = new THREE.Mesh(vacPortGeo, vacPortMat);
      vacPortMesh.position.set(chipCenterX, chipHeight / 2 + 0.6, zOffset);
      oocGroup.add(vacPortMesh);
    });

    // Connecting Tubing from Main Line to Chip Inlets
    const bridgeTubeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transmission: 0.92,
      roughness: 0.05,
      transparent: true,
      opacity: 0.5,
    });
    const bridgeTubeGeo = new THREE.CylinderGeometry(1.1, 1.1, 4.0, 16);
    bridgeTubeGeo.rotateZ(Math.PI / 2);
    const bridgeTube = new THREE.Mesh(bridgeTubeGeo, bridgeTubeMat);
    bridgeTube.position.set(chipCenterX - 19.2, 0, 0);
    oocGroup.add(bridgeTube);

    // Outlet Drain Tubing on right side
    const outletTubeGeo = new THREE.CylinderGeometry(1.2, 1.2, 12, 24);
    outletTubeGeo.rotateZ(Math.PI / 2);
    const outletTubeMesh = new THREE.Mesh(outletTubeGeo, bridgeTubeMat);
    outletTubeMesh.position.set(chipCenterX + chipWidth / 2 + 6, 0, 0);
    oocGroup.add(outletTubeMesh);

    scene.add(oocGroup);

    // ==========================================
    // 8. REALISTIC DUAL-STREAM MICRO-PIV PARTICLES
    // Upper blue stream (Epithelial fluid) & lower peach stream (Vascular shear)
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

    // 1. Upper Flow Stream Particles (Inlet line + Upper blue channel)
    const PARTICLE_COUNT = 140;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleProgress = new Float32Array(PARTICLE_COUNT);
    const particleSpeeds = new Float32Array(PARTICLE_COUNT);
    const particleOffsetsY = new Float32Array(PARTICLE_COUNT);
    const particleOffsetsZ = new Float32Array(PARTICLE_COUNT);

    const pathStartX = -44;
    const pathEndX = chipCenterX + 16;
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
      size: 0.85,
      transparent: true,
      opacity: 0.82,
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
    // 9. ANIMATION & TELEMETRY FLOW LOOP
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

    // Zoom & Preset Transition Control
    const MIN_DIST = 10;
    const MAX_DIST = 110;
    let targetDistance = camera.position.distanceTo(controls.target);
    let isZoomAnimating = false;

    let activePreset = presetRef.current;
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

      // Preserve the user's current zoom distance!
      // Presets only re-center the target; zoom distance is strictly controlled by the zoom bar.
      const currentDist = camera.position.distanceTo(controls.target);
      const viewDir = p.pos.clone().sub(p.target).normalize();

      presetTargetTarget.copy(p.target);
      presetTargetPos.copy(p.target).add(viewDir.multiplyScalar(currentDist));

      isTransitioningPreset = true;
      presetProgress = 0;
      isZoomAnimating = false;
    };

    // Synchronize UI zoom slider with current camera distance
    let lastNotifiedLevel = -1;
    const notifyZoomChanged = () => {
      const d = camera.position.distanceTo(controls.target);
      const level = THREE.MathUtils.clamp((MAX_DIST - d) / (MAX_DIST - MIN_DIST), 0, 1);
      if (Math.abs(level - lastNotifiedLevel) > 0.008) {
        lastNotifiedLevel = level;
        window.dispatchEvent(
          new CustomEvent('bioguardian:zoom_changed', { detail: { level, distance: d } })
        );
      }
    };

    controls.addEventListener('start', () => {
      isZoomAnimating = false;
      isTransitioningPreset = false;
    });

    controls.addEventListener('change', () => {
      if (!isTransitioningPreset && !isZoomAnimating) {
        targetDistance = camera.position.distanceTo(controls.target);
        notifyZoomChanged();
      }
    });

    // Custom Event Listeners for On-Screen Zoom Controls
    const handleZoomStep = (e: Event) => {
      const customEvent = e as CustomEvent<{ direction: 'in' | 'out'; amount?: number }>;
      const dir = customEvent.detail?.direction || 'in';
      const factor = customEvent.detail?.amount || 0.2;
      const currentD = camera.position.distanceTo(controls.target);
      targetDistance = currentD;
      if (dir === 'in') {
        targetDistance = Math.max(MIN_DIST, targetDistance * (1 - factor));
      } else {
        targetDistance = Math.min(MAX_DIST, targetDistance * (1 + factor));
      }
      isZoomAnimating = true;
    };

    const handleSetZoomLevel = (e: Event) => {
      const customEvent = e as CustomEvent<{ level: number }>;
      const lvl = THREE.MathUtils.clamp(customEvent.detail?.level ?? 0.5, 0, 1);
      targetDistance = MAX_DIST - lvl * (MAX_DIST - MIN_DIST);
      isZoomAnimating = true;
    };

    const handleResetZoom = () => {
      triggerPresetTransition(presetRef.current);
    };

    window.addEventListener('bioguardian:zoom_step', handleZoomStep);
    window.addEventListener('bioguardian:set_zoom_level', handleSetZoomLevel);
    window.addEventListener('bioguardian:reset_zoom', handleResetZoom);

    // Initial sync
    setTimeout(notifyZoomChanged, 100);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const currentTelemetry = telemetryRef.current;

      // 1. Preset smooth transition
      if (activePreset !== presetRef.current) {
        activePreset = presetRef.current;
        triggerPresetTransition(activePreset);
      }

      if (isTransitioningPreset) {
        presetProgress += delta * 2.2;
        if (presetProgress >= 1.0) {
          presetProgress = 1.0;
          isTransitioningPreset = false;
        }
        const t = presetProgress;
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        camera.position.lerpVectors(presetStartPos, presetTargetPos, ease);
        controls.target.lerpVectors(presetStartTarget, presetTargetTarget, ease);
        controls.update();
        notifyZoomChanged();
      } else if (isZoomAnimating) {
        // 2. Smooth zoom in / out animation
        const offset = camera.position.clone().sub(controls.target);
        const currentDist = offset.length();
        if (Math.abs(currentDist - targetDistance) > 0.08) {
          const newDist = THREE.MathUtils.lerp(currentDist, targetDistance, 0.16);
          offset.setLength(newDist);
          camera.position.copy(controls.target).add(offset);
          controls.update();
          notifyZoomChanged();
        } else {
          isZoomAnimating = false;
        }
      } else {
        controls.update();
      }

      // Flow speed factor
      const flowRate = Math.max(0, currentTelemetry.flow_rate || 0);
      const flowSpeedFactor = flowRate / 450.0;

      // 1. Upper stream particle movement along microfluidic path & upper blue channel
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

        // When entering the chip (currX > 0), particles flow through the upper blue channel
        if (currX > 0) {
          currY = 0.8 + particleOffsetsY[i] * 0.35;
          currZ = particleOffsetsZ[i] * 0.7;
        }

        posArr[i * 3 + 0] = currX;
        posArr[i * 3 + 1] = currY;
        posArr[i * 3 + 2] = currZ;
      }
      particlesGeo.attributes.position.needsUpdate = true;

      // 2. Lower stream particle movement through peach/orange vascular channel
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
      window.removeEventListener('bioguardian:zoom_step', handleZoomStep);
      window.removeEventListener('bioguardian:set_zoom_level', handleSetZoomLevel);
      window.removeEventListener('bioguardian:reset_zoom', handleResetZoom);
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
