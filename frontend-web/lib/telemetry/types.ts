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
  | 'RESERVOIRS'
  | 'BUBBLE_TRAP'
  | 'INLET_OBSERVATION'
  | 'ORGAN_ON_CHIP'
  | 'SENSOR_MANIFOLD';

export type InspectionTarget = 'ORGAN_ON_CHIP' | 'INLET_OBSERVATION' | 'BUBBLE_TRAP' | 'RESERVOIRS' | null;

export type ViewMode = 'STANDARD' | 'CLEAN_3D' | 'PRESENTATION';

export interface TelemetryContextValue {
  telemetry: BioGuardianTelemetry;
  status: ConnectionStatus;
  providerMode: ProviderMode;
  setProviderMode: (mode: ProviderMode) => void;
  // Environment Mode (Physical Digital Twin vs In-Silico Virtual Lab Simulation)
  environmentMode: TwinEnvironmentMode;
  setEnvironmentMode: (mode: TwinEnvironmentMode) => void;
  // Virtual Lab Simulation State
  virtualLabOrgan: string;
  setVirtualLabOrgan: (organId: string) => void;
  virtualLabParameters: Record<string, any>;
  setVirtualLabParameters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isSimulating: boolean;
  startSimulation: () => void;
  pauseSimulation: () => void;
  injectSimulatedBubble: () => void;
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
  setTelemetry: React.Dispatch<React.SetStateAction<BioGuardianTelemetry>>;
}
