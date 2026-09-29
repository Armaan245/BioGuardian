// BioGuardian – Virtual Lab API Client

import type {
  OrganProfile,
  OrganParametersResponse,
  SimulationRunResponse,
  MLStatus,
  MLPredictResponse,
  ParameterValues,
} from './types';

const BASE = '/api/virtual-lab';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function fetchOrgans(): Promise<OrganProfile[]> {
  return fetchJSON<OrganProfile[]>(`${BASE}/organs`);
}

export async function fetchOrganParameters(organId: string): Promise<OrganParametersResponse> {
  return fetchJSON<OrganParametersResponse>(`${BASE}/organs/${encodeURIComponent(organId)}/parameters`);
}

export async function runSimulation(organ: string, parameters: ParameterValues): Promise<SimulationRunResponse> {
  return fetchJSON<SimulationRunResponse>(`${BASE}/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organ, parameters }),
  });
}

export async function fetchMLStatus(): Promise<MLStatus> {
  return fetchJSON<MLStatus>(`${BASE}/ml/status`);
}

export async function queryMLPredict(organ: string, parameters: ParameterValues): Promise<MLPredictResponse> {
  return fetchJSON<MLPredictResponse>(`${BASE}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organ, parameters }),
  });
}
