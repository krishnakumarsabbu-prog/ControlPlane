import type { Project, LogEntry, SystemStats } from '../types'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

interface BackendProject {
  id: string
  name: string
  path: string
  startCommand: string
  status: string
  port: number | null
  lastRunAt: string | null
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
  }
}

export async function getProjects(): Promise<Project[]> {
  const list = await request<BackendProject[]>('/projects')
  return list.map(adaptProject)
}

export async function getStats(): Promise<SystemStats> {
  return request<SystemStats>('/stats')
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
}): Promise<Project> {
  const p = await request<BackendProject>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return adaptProject(p)
}
