// BioGuardian – Virtual Lab TypeScript types

export interface OrganProfile {
  id: string;
  name: string;
  status: 'prototype' | 'validated';
}

export interface ParameterSchema {
  id: string;
  label: string;
  unit: string;
  min?: number;
  max?: number;
  default?: number;
}

export interface OrganParametersResponse {
  organ: string;
  parameters: ParameterSchema[];
}

export interface SimulationState {
  flow_active: boolean;
  flow_rate: number;
  pressure: number;
  ph: number;
  oxygen: number;
  temperature: number;
  elapsed_time: number;
  bubble_detected: boolean;
  bubble_position: number;
}

export interface SimulationRunResponse {
  simulation_id: string;
  status: string;
  organ: string;
  parameters: Record<string, number>;
  simulation_state: SimulationState;
}

export interface MLStatus {
  connected: boolean;
  status: 'available' | 'not_configured' | 'unreachable';
  message: string;
}

export interface MLPredictResponse {
  available: boolean;
  message?: string;
  prediction?: unknown;
}

export interface ParameterValues {
  [key: string]: number;
}

export interface SimDataPoint {
  t: number;
  flow_rate: number;
  pressure: number;
  ph: number;
  oxygen: number;
  bubble_position: number;
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'bubble';
