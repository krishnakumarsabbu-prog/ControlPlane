export type ProjectStatus = 'running' | 'stopped' | 'starting' | 'error'

export interface Project {
  id: string
  name: string
  path: string
  status: ProjectStatus
  tech: string
  techColor: string
  port: number | null
  lastRun: string
  icon: string
  autoRestart: boolean
  maxRetries: number
  restartCount: number
}

export interface LogEntry {
  id: string
  seq: number
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success' | 'debug' | 'system'
  project: string
  projectId: string
  message: string
}

export interface SystemStats {
  cpu: number
  ram: number
  ramTotal: number
}

export interface PortEntry {
  projectId: string
  projectName: string
}

export type PortRegistry = Record<number, PortEntry>
