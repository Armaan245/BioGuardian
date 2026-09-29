// BioGuardian – Virtual Lab API Client

import type {
  OrganProfile,
  OrganParametersResponse,
  SimulationRunResponse,
  MLStatus,
  MLPredictResponse,
  ParameterValues,
} from './types';

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const envHttp = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (envHttp) {
      return `${envHttp.replace(/\/+$/, '')}/api/virtual-lab`;
    }
  }
  return '/api/virtual-lab';
}

async function fetchJSON<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${endpoint}`;
  const res = await fetch(url, { ...init, cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function fetchOrgans(): Promise<OrganProfile[]> {
  return fetchJSON<OrganProfile[]>('/organs');
}

export async function fetchOrganParameters(organId: string): Promise<OrganParametersResponse> {
  return fetchJSON<OrganParametersResponse>(`/organs/${encodeURIComponent(organId)}/parameters`);
}

export async function runSimulation(organ: string, parameters: ParameterValues): Promise<SimulationRunResponse> {
  return fetchJSON<SimulationRunResponse>('/simulation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organ, parameters }),
  });
}

export async function fetchMLStatus(): Promise<MLStatus> {
  return fetchJSON<MLStatus>('/ml/status');
}

export async function queryMLPredict(organ: string, parameters: ParameterValues): Promise<MLPredictResponse> {
  return fetchJSON<MLPredictResponse>('/ml/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organ, parameters }),
  });
}
