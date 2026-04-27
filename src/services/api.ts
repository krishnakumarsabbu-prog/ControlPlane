import type { Project, LogEntry, SystemStats } from '../types'
import {
  handleGetProjects,
  handleGetStats,
  handleGetLogs,
  handleStartProject,
  handleStopProject,
  handleClearLogs,
} from './mockServer'

// ---------------------------------------------------------------------------
// API layer — mirrors REST routes:
//   GET  /api/projects
//   POST /api/projects/:id/start
//   POST /api/projects/:id/stop
//   GET  /api/projects/:id/logs
//   GET  /api/stats
//   POST /api/logs/clear
// ---------------------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  return handleGetProjects()
}

export async function getStats(): Promise<SystemStats> {
  return handleGetStats()
}

export async function getLogs(): Promise<LogEntry[]> {
  return handleGetLogs()
}

export async function startProject(id: string): Promise<Project> {
  return handleStartProject(id)
}

export async function stopProject(id: string): Promise<Project> {
  return handleStopProject(id)
}

export async function clearLogs(): Promise<void> {
  return handleClearLogs()
}
