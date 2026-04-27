import type { Project, LogEntry, SystemStats, PortRegistry } from '../types'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504])
const MAX_RETRIES = 3
const RETRY_BASE_MS = 400

async function request<T>(path: string, init?: RequestInit, attempt = 0): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch (networkErr) {
    if (attempt < MAX_RETRIES) {
      await delay(RETRY_BASE_MS * 2 ** attempt)
      return request<T>(path, init, attempt + 1)
    }
    throw new Error('Network error — server may be unreachable')
  }

  if (!res.ok) {
    if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_RETRIES && isSafeToRetry(init)) {
      await delay(RETRY_BASE_MS * 2 ** attempt)
      return request<T>(path, init, attempt + 1)
    }
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isSafeToRetry(init?: RequestInit) {
  const method = init?.method?.toUpperCase() ?? 'GET'
  return method === 'GET'
}

interface BackendProject {
  id: string
  name: string
  path: string
  startCommand: string
  status: string
  port: number | null
  lastRunAt: string | null
  autoRestart: boolean
  maxRetries: number
  restartCount: number
}

function adaptProject(p: BackendProject): Project {
  return {
    id: p.id,
    name: p.name,
    path: p.path,
    status: p.status as Project['status'],
    tech: 'Node.js',
    techColor: '#68a063',
    port: p.port,
    lastRun: p.lastRunAt ? new Date(p.lastRunAt).toLocaleTimeString() : 'never',
    icon: '⬡',
    autoRestart: p.autoRestart ?? false,
    maxRetries: p.maxRetries ?? 3,
    restartCount: p.restartCount ?? 0,
  }
}

export async function getProjects(): Promise<Project[]> {
  const list = await request<BackendProject[]>('/projects')
  return list.map(adaptProject)
}

export async function getStats(): Promise<SystemStats> {
  return request<SystemStats>('/stats')
}

export async function getPorts(): Promise<PortRegistry> {
  return request<PortRegistry>('/ports')
}

interface LogsResponse {
  logs: LogEntry[]
  seq: number
}

export async function getLogs(since = 0): Promise<LogsResponse> {
  return request<LogsResponse>(`/logs?since=${since}`)
}

export async function clearProjectLogs(id: string): Promise<void> {
  await request(`/projects/${id}/logs/clear`, { method: 'POST' })
}

export async function startProject(id: string): Promise<Project> {
  const p = await request<BackendProject>(`/projects/${id}/start`, { method: 'POST' })
  return adaptProject(p)
}

export async function stopProject(id: string): Promise<Project> {
  const p = await request<BackendProject>(`/projects/${id}/stop`, { method: 'POST' })
  return adaptProject(p)
}

export async function clearLogs(): Promise<void> {
  await request('/logs/clear', { method: 'POST' })
}

export async function createProject(data: {
  name: string
  path: string
  startCommand: string
  port?: number
  autoRestart?: boolean
  maxRetries?: number
}): Promise<Project> {
  const p = await request<BackendProject>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return adaptProject(p)
}

export async function updateProjectConfig(
  id: string,
  config: { autoRestart?: boolean; maxRetries?: number },
): Promise<Project> {
  const p = await request<BackendProject>(`/projects/${id}/config`, {
    method: 'PATCH',
    body: JSON.stringify(config),
  })
  return adaptProject(p)
}
