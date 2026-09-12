/**
 * BioGuardian Digital Twin - 3D Three.js Visualizer & WebSocket Client (Phase 03)
 */

// ==========================================
// 1. Three.js Scene Setup & Geometry Config
// ==========================================
const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060911, 0.0035);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 35, 120);









const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Orbit Controls
let controls = null;
if (typeof THREE.OrbitControls !== 'undefined') {
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 250;
  controls.minDistance = 30;
  controls.maxPolarAngle = Math.PI / 2 + 0.1;
}

// Lighting Rig
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const mainDirLight = new THREE.DirectionalLight(0x00f0ff, 1.5);
mainDirLight.position.set(50, 80, 50);
scene.add(mainDirLight);

const accentLight = new THREE.DirectionalLight(0x00ff88, 1.0);
accentLight.position.set(-50, -40, -50);
scene.add(accentLight);

const pointLight = new THREE.PointLight(0x00f0ff, 2, 80);
pointLight.position.set(0, 15, 0);
scene.add(pointLight);

// ==========================================
// 2. Microfluidic Channel 3D Geometry
// Spec: Width: 100px/units, Height: 20px/units
// ==========================================
const CHANNEL_WIDTH = 100;
const CHANNEL_HEIGHT = 20;
const CHANNEL_DEPTH = 20;

// Outer Channel Body: Semi-transparent acrylic/PDMS microfluidic chip
const channelGeo = new THREE.BoxGeometry(CHANNEL_WIDTH, CHANNEL_HEIGHT, CHANNEL_DEPTH);
const channelMat = new THREE.MeshPhysicalMaterial({
  color: 0x1a3b5c,
  metalness: 0.1,
  roughness: 0.1,
  transmission: 0.85,
  thickness: 2.5,
  transparent: true,
  opacity: 0.45,
  depthWrite: false,
  wireframe: false,
});
const channelMesh = new THREE.Mesh(channelGeo, channelMat);
channelMesh.position.y = -8;
scene.add(channelMesh);

// Glowing Edge Outlines for High-Tech Bio-CAD Aesthetic
const edgesGeo = new THREE.EdgesGeometry(channelGeo);
const edgesMat = new THREE.LineBasicMaterial({
  color: 0x00f0ff,
  transparent: true,
  opacity: 0.75,
  linewidth: 1.5,
});
const wireframeEdges = new THREE.LineSegments(edgesGeo, edgesMat);
channelMesh.add(wireframeEdges);

// Subtle Ground Grid Reference
const gridHelper = new THREE.GridHelper(160, 32, 0x00f0ff, 0x112233);
gridHelper.position.y = -26;
scene.add(gridHelper);

// ==========================================
// 3. Dynamic Bubble Sphere Mesh
// ==========================================
// Initial placeholder sphere geometry
let currentBubbleRadius = 3.0;
const bubbleGeo = new THREE.SphereGeometry(1, 32, 32);
const bubbleMat = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  emissive: 0x00ff00,
  emissiveIntensity: 0.6,
  roughness: 0.2,
  metalness: 0.4,
  transparent: true,
  opacity: 0.9,
});
const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
bubbleMesh.visible = false; // Hidden until bubble detected
scene.add(bubbleMesh);

// Bubble Inner Glow Aura
const auraGeo = new THREE.SphereGeometry(1.2, 16, 16);
const auraMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.25,
  wireframe: true,
});
const bubbleAura = new THREE.Mesh(auraGeo, auraMat);
bubbleMesh.add(bubbleAura);

// ==========================================
// 4. Fluid Particle Flow Dynamics
// ==========================================
const PARTICLE_COUNT = 150;
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleVelocities = [];

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particlePositions[i * 3 + 0] = (Math.random() - 0.5) * (CHANNEL_WIDTH - 4);
  particlePositions[i * 3 + 1] = (Math.random() - 0.5) * (CHANNEL_HEIGHT - 4);
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * (CHANNEL_DEPTH - 4);
  particleVelocities.push(0.3 + Math.random() * 0.4);
}

const particlesGeo = new THREE.BufferGeometry();
particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particlesMat = new THREE.PointsMaterial({
  color: 0x00f0ff,
  size: 1.2,
  transparent: true,
  opacity: 0.45,
  blending: THREE.AdditiveBlending,
});
const particleSystem = new THREE.Points(particlesGeo, particlesMat);
particleSystem.position.y = -8;
scene.add(particleSystem);


// ==========================================
// 5. Physics Engine Client Mirror (Phase 02)
// ==========================================
function computeTheoreticalPressure(flow_uL_min) {
  if (!flow_uL_min || flow_uL_min <= 0) return 0.0;
  const L = 0.05;      // 50 mm
  const W = 0.001;     // 1.0 mm
  const H = 0.0002;    // 0.2 mm
  const mu = 0.00089;  // Pa.s
  const Q = (flow_uL_min * 1e-9) / 60.0;
  const geomFactor = W * Math.pow(H, 3) * (1.0 - 0.630 * (H / W));
  const dp_pa = (12.0 * mu * L * Q) / geomFactor;
  return dp_pa / 100.0; // mbar
}

function verifyChannelHealth(actual_p_mbar, flow_uL_min) {
  const p_ideal = computeTheoreticalPressure(flow_uL_min);
  if (p_ideal === 0.0) {
    return {
      status: actual_p_mbar === 0 ? "NOMINAL" : "CHANNEL_DEGRADATION_OR_CLOGGING",
      health_score: actual_p_mbar === 0 ? 1.0 : 0.0,
      deviation: 0.0,
      p_ideal: 0.0,
    };
  }
  const deviation = Math.abs(actual_p_mbar - p_ideal) / p_ideal;
  if (deviation > 0.25) {
    return {
      status: "CHANNEL_DEGRADATION_OR_CLOGGING",
      health_score: Math.max(0.0, 1.0 - deviation),
      deviation: deviation,
      p_ideal: p_ideal,
    };
  }
  return {
    status: "NOMINAL",
    health_score: 1.0,
    deviation: deviation,
    p_ideal: p_ideal,
  };
}

// ==========================================
// 6. UI Update & Telemetry Binding
// ==========================================
// Cache DOM Elements
const elPressure = document.getElementById('val-pressure');
const elFlow = document.getElementById('val-flow');
const elFlowSi = document.getElementById('val-flow-si');
const elPrediction = document.getElementById('val-prediction');
const elConfidence = document.getElementById('val-confidence');
const elLatency = document.getElementById('val-latency');
const elHealthScore = document.getElementById('val-health-score');
const elHealthStatus = document.getElementById('val-health-status');
const elDeviation = document.getElementById('val-deviation');
const elTheoryP = document.getElementById('val-theory-p');
const elIR = document.getElementById('val-ir');
const elTemp = document.getElementById('val-temp');
const elDeviceId = document.getElementById('device-id-val');
const elWsDot = document.getElementById('ws-status-dot');
const elWsText = document.getElementById('ws-status-text');
const elClock = document.getElementById('live-utc-clock');
const elBubbleBadge = document.getElementById('vision-detection-badge');
const elBubbleDiameter = document.getElementById('val-bubble-diameter');
const elBubbleVolume = document.getElementById('val-bubble-volume');
const elBubblePos = document.getElementById('val-bubble-pos');













// Update Live UTC Clock
setInterval(() => {
  const now = new Date();
  elClock.innerText = now.toISOString().substring(11, 19) + ' UTC';
}, 1000);

/**
 * Core Telemetry Ingestion Handler
 * Processes incoming JSON frames from WebSocket relay
 */
function handleTelemetryFrame(frame) {
  if (!frame) return;

  // 1. Device & Timestamp
  if (frame.device_id) elDeviceId.innerText = frame.device_id;

  // 2. Physical Sensor State
  const phys = frame.physical_state || {};
  const pressure = typeof phys.pressure_mbar === 'number' ? phys.pressure_mbar : 980.0;
  const flow = typeof phys.flow_uL_min === 'number' ? phys.flow_uL_min : 400.0;
  const ir = typeof phys.ir_transmittance_mv === 'number' ? phys.ir_transmittance_mv : 480.0;
  const temp = typeof phys.temperature_c === 'number' ? phys.temperature_c : 25.0;

  elPressure.innerText = pressure.toFixed(1);
  elFlow.innerText = flow.toFixed(1);
  elIR.innerText = ir.toFixed(0);
  elTemp.innerText = temp.toFixed(1);

  const flowSi = (flow * 1e-9) / 60.0;
  elFlowSi.innerText = flowSi.toExponential(2);

  // 3. Physics Health Validation
  const health = verifyChannelHealth(pressure, flow);
  elTheoryP.innerText = health.p_ideal.toFixed(2);
  elDeviation.innerText = (health.deviation * 100).toFixed(1) + '%';
  elHealthScore.innerText = (health.health_score * 100).toFixed(0) + '%';
  elHealthStatus.innerText = health.status === "NOMINAL" ? "NOMINAL" : "CLOGGED/WARN";

  if (health.status === "NOMINAL") {
    elHealthScore.style.color = "var(--accent-emerald)";
    elHealthStatus.style.color = "var(--accent-emerald)";
  } else {
    elHealthScore.style.color = "var(--accent-red)";
    elHealthStatus.style.color = "var(--accent-red)";
  }

  // 4. Edge AI Prediction
  const ai = frame.edge_ai || {};
  const prediction = ai.prediction || "NOMINAL";
  const confidence = typeof ai.confidence === 'number' ? ai.confidence : 0.98;
  const latency = typeof ai.latency_ns === 'number' ? Math.round(ai.latency_ns / 1000) : 85;

  elPrediction.innerText = prediction;
  elConfidence.innerText = (confidence * 100).toFixed(1) + '%';
  elLatency.innerText = latency;

  if (prediction === "BUBBLE_RISK") {
    elPrediction.className = "status-pill status-alert";
  } else {
    elPrediction.className = "status-pill status-nominal";
  }

  // 5. Spatial Vision & 3D Bubble Mesh Update
  const vision = frame.spatial_vision || {};
  const bubbleDetected = Boolean(vision.bubble_detected);
  const diameter_mm = typeof vision.diameter_mm === 'number' ? vision.diameter_mm : 0.0;
  const volume_uL = typeof vision.volume_uL === 'number' ? vision.volume_uL : 0.0;
  const pos_x_mm = typeof vision.position_x_mm === 'number' ? vision.position_x_mm : 0.0;

  elBubbleDiameter.innerText = diameter_mm.toFixed(2);
  elBubbleVolume.innerText = volume_uL.toFixed(3);
  elBubblePos.innerText = pos_x_mm.toFixed(2);

  if (bubbleDetected) {
    elBubbleBadge.innerText = "BUBBLE DETECTED";
    elBubbleBadge.className = "status-pill status-alert";

    // Show 3D Sphere Mesh
    bubbleMesh.visible = true;

    // Radius scaling: scale proportional to diameter_mm (with minimum visible size 2.5 and max 7.5 to fit inside 20px channel)
    const targetScale = Math.max(2.0, Math.min(8.0, (diameter_mm || 0.6) * 7.0));
    bubbleMesh.scale.set(targetScale, targetScale, targetScale);

    // Position X: Map position_x_mm to 3D channel length [-40, +40]
    // If position is in 0..5 range or 0..50 range:
    let mappedX = 0;
    if (pos_x_mm <= 5.0) {
      mappedX = (pos_x_mm / 5.0) * 80.0 - 40.0;
    } else {
      mappedX = (pos_x_mm / 50.0) * 80.0 - 40.0;
    }
    // Clamp inside channel
    mappedX = Math.max(-42, Math.min(42, mappedX));
    bubbleMesh.position.set(mappedX, -8, 0);

    // Set Sphere Color based on requirement:
    // GREEN (#00FF00) if prediction is "NOMINAL", RED (#FF0000) if "BUBBLE_RISK"
    if (prediction === "BUBBLE_RISK") {
      bubbleMat.color.setHex(0xff0000);
      bubbleMat.emissive.setHex(0xff0000);
      bubbleAura.material.color.setHex(0xff0000);
      pointLight.color.setHex(0xff3366);
    } else {
      bubbleMat.color.setHex(0x00ff00);
      bubbleMat.emissive.setHex(0x00ff00);
      bubbleAura.material.color.setHex(0x00ff00);
      pointLight.color.setHex(0x00ff88);
    }
  } else {
    elBubbleBadge.innerText = "NO BUBBLE";
    elBubbleBadge.className = "status-pill status-nominal";
    bubbleMesh.visible = false;
    pointLight.color.setHex(0x00f0ff);
  }
}

// ==========================================
// 7. WebSocket Client Connection
// ==========================================
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.host || 'localhost:8080';
const wsUrl = `${wsProtocol}//${wsHost}`;

let socket = null;
let reconnectTimer = null;

function connectWebSocket() {
  console.log(`[WS] Connecting to WebSocket relay at ${wsUrl}...`);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('[WS] Connected successfully.');
    elWsDot.classList.remove('disconnected');
    elWsText.innerText = 'WS: LIVE (8080)';
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'RELAY_CONNECTED') {
        console.log('[WS Relay Handshake]:', data);
        return;
      }
      handleTelemetryFrame(data);
    } catch (err) {
      console.warn('[WS Parse Error]:', err);
    }
  };

  socket.onerror = (err) => {
    console.warn('[WS Error]:', err);
  };

  socket.onclose = () => {
    console.warn('[WS Disconnected]. Scheduling reconnect in 2s...');
    elWsDot.classList.add('disconnected');
    elWsText.innerText = 'WS: RECONNECTING';
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(connectWebSocket, 2000);
    }
  };
}

// Start WebSocket connection
connectWebSocket();

// ==========================================
// 8. Interactive UI Button Triggers (Demo Helpers)
// ==========================================
document.getElementById('btn-inject-nominal').addEventListener('click', () => {
  handleTelemetryFrame({
    timestamp_utc: new Date().toISOString(),
    device_id: "BioGuardian-PiZero-01",
    physical_state: {
      pressure_mbar: 981.2,
      flow_uL_min: 405.0,
      ir_transmittance_mv: 490.0,
      temperature_c: 25.2,
    },
    edge_ai: {
      prediction: "NOMINAL",
      confidence: 0.994,
      latency_ns: 78000,
    },
    spatial_vision: {
      bubble_detected: true,
      diameter_mm: 0.35,
      volume_uL: 0.022,
      position_x_mm: 2.1,
    },
  });
});

document.getElementById('btn-inject-bubble').addEventListener('click', () => {
  handleTelemetryFrame({
    timestamp_utc: new Date().toISOString(),
    device_id: "BioGuardian-PiZero-01",
    physical_state: {
      pressure_mbar: 1048.5,
      flow_uL_min: 310.0,
      ir_transmittance_mv: 115.0,
      temperature_c: 26.3,
    },
    edge_ai: {
      prediction: "BUBBLE_RISK",
      confidence: 0.988,
      latency_ns: 94000,
    },
    spatial_vision: {
      bubble_detected: true,
      diameter_mm: 0.72,
      volume_uL: 0.195,
      position_x_mm: 3.4,
    },
  });
});

document.getElementById('btn-reset-cam').addEventListener('click', () => {
  camera.position.set(0, 35, 120);
  if (controls) controls.target.set(0, 0, 0);
});

// ==========================================
// 9. Animation & Render Loop
// ==========================================
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  // Subtle floating wobble on channel
  channelMesh.rotation.y = Math.sin(elapsedTime * 0.4) * 0.04;
  channelMesh.rotation.x = Math.sin(elapsedTime * 0.3) * 0.02;

  // Particle fluid flow inside channel
  const positions = particleSystem.geometry.attributes.position.array;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3 + 0] += particleVelocities[i] * 0.8;
    // Reset particle once it reaches end of channel
    if (positions[i * 3 + 0] > CHANNEL_WIDTH / 2) {
      positions[i * 3 + 0] = -CHANNEL_WIDTH / 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * (CHANNEL_HEIGHT - 4);
      positions[i * 3 + 2] = (Math.random() - 0.5) * (CHANNEL_DEPTH - 4);
    }
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;

  // Pulsing bubble aura
  if (bubbleMesh.visible) {
    const auraPulse = 1.1 + Math.sin(elapsedTime * 6.0) * 0.15;
    bubbleAura.scale.set(auraPulse, auraPulse, auraPulse);
  }

  if (controls) controls.update();
  renderer.render(scene, camera);
}

animate();

// Handle Window Resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize with nominal frame
handleTelemetryFrame({
  timestamp_utc: new Date().toISOString(),
  device_id: "BioGuardian-PiZero-01",
  physical_state: {
    pressure_mbar: 980.5,
    flow_uL_min: 400.0,
    ir_transmittance_mv: 485.0,
    temperature_c: 25.1,
  },
  edge_ai: {
    prediction: "NOMINAL",
    confidence: 0.985,
    latency_ns: 82000,
  },
  spatial_vision: {
    bubble_detected: false,
    diameter_mm: 0.0,
    volume_uL: 0.0,
    position_x_mm: 0.0,
  },
});
