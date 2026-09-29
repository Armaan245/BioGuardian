/**
 * BioGuardian Canonical Telemetry Contract and State Definitions
 */

export interface BioGuardianTelemetry {
  device_id: string;
  timestamp: string;
  ph: number;
  glucose: number;
  oxygen: number;
  pressure: number;
  flow_rate: number;
  temperature: number;
  bubble_detected: boolean;
  bubble_probability: number;
  source: 'SIMULATION' | 'REAL DEVICE';
}

export type ConnectionStatus =
  | 'CONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'STALE'
  | 'SIMULATION_ACTIVE';

export type ProviderMode = 'mock' | 'real';

export type TwinEnvironmentMode = 'HARDWARE_TWIN' | 'VIRTUAL_LAB';

export type CameraPreset =
  | 'FULL_SYSTEM'
  | 'INLET_OBSERVATION'
  | 'ORGAN_ON_CHIP'
  | 'BUBBLE_TRAP'
  | 'RESERVOIRS'
  | 'SENSOR_MANIFOLD';

export type InspectionTarget =
  | 'ORGAN_ON_CHIP'
  | 'INLET_OBSERVATION'
  | 'BUBBLE_TRAP'
  | 'RESERVOIRS'
  | 'SENSOR_MANIFOLD'
  | null;

export type ViewMode = 'STANDARD' | 'CLEAN_3D' | 'PRESENTATION';

export interface TelemetryContextValue {
  telemetry: BioGuardianTelemetry;
  status: ConnectionStatus;
  providerMode: ProviderMode;
  setProviderMode: (mode: ProviderMode) => void;
  // Environment Mode (Live Hardware Twin vs Virtual Lab Simulation)
  environmentMode: TwinEnvironmentMode;
  setEnvironmentMode: (mode: TwinEnvironmentMode) => void;
  // Simulation control actions
  triggerBubbleAlert: () => void;
  clearBubbleAlert: () => void;
  triggerBubbleSpot: (focusCamera?: boolean) => void;
  clearBubbleSpot: () => void;
  showBubbleSpotVisual: boolean;
  setSimulationFlowRate: (rate: number) => void;
  // Real API fetching
  fetchLatestFromApi: () => Promise<void>;
  isApiFetching: boolean;
  apiError: string | null;
  // 3D camera and view options
  cameraPreset: CameraPreset;
  setCameraPreset: (preset: CameraPreset) => void;
  inspectionTarget: InspectionTarget;
  setInspectionTarget: (target: InspectionTarget) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  backendUrl: string;
  // Virtual Lab In-Silico State
  virtualLabOrgan: string;
  setVirtualLabOrgan: (organ: string) => void;
  virtualLabParams: Record<string, number>;
  setVirtualLabParam: (id: string, val: number) => void;
  isSimulating: boolean;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  virtualLabElapsed: number;
  simulatedBubbleActive: boolean;
  simulatedBubblePos: number;
  injectSimulatedBubble: () => void;
}
