import type { Project, LogEntry, SystemStats } from '../types'
import { initialProjects, initialLogs, getNextFakeLog } from '../data/mockData'

// ---------------------------------------------------------------------------
// In-memory mock server state — simulates a real REST backend
// ---------------------------------------------------------------------------

let _projects: Project[] = [...initialProjects]
let _logs: LogEntry[] = [...initialLogs]
let _stats: SystemStats = { cpu: 24, ram: 4.2, ramTotal: 16 }
let _logId = 200
let _logSeq = 100

const PORT_MAP: Record<string, number> = {
  'proj-3': 5173,
  'proj-4': 4000,
  'proj-5': 8001,
}

function genId() {
  return `log-${++_logId}`
}

function nowTs() {
  return new Date().toTimeString().slice(0, 8)
}

function pushLog(entry: Omit<LogEntry, 'id' | 'seq' | 'projectId'> & { projectId?: string }) {
  _logs = [..._logs.slice(-499), { ...entry, id: genId(), seq: ++_logSeq, projectId: entry.projectId ?? 'mock' }]
}

setInterval(() => {
  if (_projects.some(p => p.status === 'running')) pushLog(getNextFakeLog())
}, 1000)

setInterval(() => {
  _stats = {
    cpu: Math.max(5, Math.min(95, _stats.cpu + (Math.random() * 10 - 5))),
    ram: Math.max(1, Math.min(_stats.ramTotal - 0.5, _stats.ram + (Math.random() * 0.6 - 0.3))),
    ramTotal: _stats.ramTotal,
  }
}, 2000)

// ---------------------------------------------------------------------------
// Handler functions called by the API layer
// ---------------------------------------------------------------------------

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export async function handleGetProjects(): Promise<Project[]> {
  await delay(60)
  return [..._projects]
}

export async function handleGetStats(): Promise<SystemStats> {
  await delay(30)
  return { ..._stats, cpu: Math.round(_stats.cpu), ram: parseFloat(_stats.ram.toFixed(1)) }
}

export async function handleGetLogs(since = 0): Promise<{ logs: LogEntry[]; seq: number }> {
  await delay(30)
  const logs = since === 0 ? [..._logs] : _logs.filter(e => e.seq > since)
  return { logs, seq: _logSeq }
}

export async function handleStartProject(id: string): Promise<Project> {
  await delay(80)
  const project = _projects.find(p => p.id === id)
  if (!project) throw new Error(`Project ${id} not found`)
  if (project.status !== 'stopped' && project.status !== 'error') {
    throw new Error(`Cannot start project in state: ${project.status}`)
  }

  _projects = _projects.map(p => (p.id === id ? { ...p, status: 'starting' as const } : p))
  pushLog({ timestamp: nowTs(), level: 'info', project: project.name, message: `Starting ${project.name}...` })

  setTimeout(() => {
    _projects = _projects.map(p =>
      p.id === id
        ? { ...p, status: 'running' as const, port: p.port ?? PORT_MAP[p.id] ?? 9000, lastRun: 'just now' }
        : p,
    )
    const proj = _projects.find(p => p.id === id)!
    pushLog({
      timestamp: nowTs(),
      level: 'success',
      project: proj.name,
      message: `${proj.name} is now running on port ${proj.port}`,
    })
  }, 1500)

  return _projects.find(p => p.id === id)!
}

export async function handleStopProject(id: string): Promise<Project> {
  await delay(80)
  const project = _projects.find(p => p.id === id)
  if (!project) throw new Error(`Project ${id} not found`)
  if (project.status !== 'running') {
    throw new Error(`Cannot stop project in state: ${project.status}`)
  }

  _projects = _projects.map(p =>
    p.id === id ? { ...p, status: 'stopped' as const, port: null, lastRun: 'just now' } : p,
  )
  pushLog({ timestamp: nowTs(), level: 'warn', project: project.name, message: `${project.name} stopped.` })

  return _projects.find(p => p.id === id)!
}

export async function handleClearLogs(): Promise<void> {
  await delay(20)
  _logs = []
}

export async function handleUpdateProjectConfig(
  id: string,
  config: { autoRestart?: boolean; maxRetries?: number },
): Promise<Project> {
  await delay(40)
  const project = _projects.find(p => p.id === id)
  if (!project) throw new Error(`Project ${id} not found`)
  _projects = _projects.map(p =>
    p.id === id
      ? {
          ...p,
          autoRestart: config.autoRestart !== undefined ? config.autoRestart : p.autoRestart,
          maxRetries: config.maxRetries !== undefined ? config.maxRetries : p.maxRetries,
        }
      : p,
  )
  return _projects.find(p => p.id === id)!
}

export async function handleGetPorts(): Promise<Record<number, { projectId: string; projectName: string }>> {
  await delay(30)
  const ports: Record<number, { projectId: string; projectName: string }> = {}
  for (const p of _projects) {
    if (p.port !== null && p.status === 'running') {
      ports[p.port] = { projectId: p.id, projectName: p.name }
    }
  }
  return ports
}
