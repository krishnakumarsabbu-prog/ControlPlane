import type { Project, LogEntry } from '../types'

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'react-dashboard',
    path: '~/projects/react-dashboard',
    status: 'running',
    tech: 'React',
    techColor: '#61dafb',
    port: 3000,
    lastRun: '2 min ago',
    icon: '⚛',
    autoRestart: true,
    maxRetries: 3,
    restartCount: 0,
  },
  {
    id: 'proj-2',
    name: 'fastapi-backend',
    path: '~/projects/fastapi-backend',
    status: 'running',
    tech: 'FastAPI',
    techColor: '#009688',
    port: 8000,
    lastRun: '5 min ago',
    icon: '🐍',
    autoRestart: false,
    maxRetries: 3,
    restartCount: 0,
  },
  {
    id: 'proj-3',
    name: 'vue-storefront',
    path: '~/projects/vue-storefront',
    status: 'stopped',
    tech: 'Vue',
    techColor: '#42b883',
    port: null,
    lastRun: '1 hour ago',
    icon: '💚',
    autoRestart: false,
    maxRetries: 3,
    restartCount: 0,
  },
  {
    id: 'proj-4',
    name: 'node-gateway',
    path: '~/projects/node-gateway',
    status: 'stopped',
    tech: 'Node.js',
    techColor: '#68a063',
    port: null,
    lastRun: '3 hours ago',
    icon: '⬡',
    autoRestart: false,
    maxRetries: 3,
    restartCount: 0,
  },
  {
    id: 'proj-5',
    name: 'django-api',
    path: '~/projects/django-api',
    status: 'stopped',
    tech: 'Django',
    techColor: '#0c4b33',
    port: null,
    lastRun: 'Yesterday',
    icon: '🎸',
    autoRestart: false,
    maxRetries: 3,
    restartCount: 0,
  },
]

const now = new Date()
function ts(offsetSec: number) {
  const d = new Date(now.getTime() - offsetSec * 1000)
  return d.toTimeString().slice(0, 8)
}

export const initialLogs: LogEntry[] = [
  { id: 'l1', seq: 1, timestamp: ts(30), level: 'success', project: 'react-dashboard', projectId: 'mock-1', message: 'Server started on port 3000' },
  { id: 'l2', seq: 2, timestamp: ts(28), level: 'info', project: 'react-dashboard', projectId: 'mock-1', message: 'Compiled successfully in 412ms' },
  { id: 'l3', seq: 3, timestamp: ts(25), level: 'success', project: 'fastapi-backend', projectId: 'mock-2', message: 'Uvicorn running on http://0.0.0.0:8000' },
  { id: 'l4', seq: 4, timestamp: ts(22), level: 'info', project: 'fastapi-backend', projectId: 'mock-2', message: 'Application startup complete.' },
  { id: 'l5', seq: 5, timestamp: ts(18), level: 'info', project: 'react-dashboard', projectId: 'mock-1', message: 'GET / 200 OK 3ms' },
  { id: 'l6', seq: 6, timestamp: ts(15), level: 'warn', project: 'fastapi-backend', projectId: 'mock-2', message: 'Rate limit approaching for /api/v1/data' },
  { id: 'l7', seq: 7, timestamp: ts(12), level: 'info', project: 'react-dashboard', projectId: 'mock-1', message: 'Hot module replacement applied.' },
  { id: 'l8', seq: 8, timestamp: ts(8), level: 'info', project: 'fastapi-backend', projectId: 'mock-2', message: 'POST /api/v1/users 201 Created 18ms' },
  { id: 'l9', seq: 9, timestamp: ts(4), level: 'debug', project: 'react-dashboard', projectId: 'mock-1', message: 'WebSocket connection established' },
  { id: 'l10', seq: 10, timestamp: ts(1), level: 'info', project: 'fastapi-backend', projectId: 'mock-2', message: 'GET /api/v1/health 200 OK 2ms' },
]

const fakeLogs: Array<{ level: LogEntry['level']; project: string; projectId: string; message: string }> = [
  { level: 'info', project: 'react-dashboard', projectId: 'mock-1', message: 'GET /api/metrics 200 OK 4ms' },
  { level: 'info', project: 'fastapi-backend', projectId: 'mock-2', message: 'Database query executed in 12ms' },
  { level: 'debug', project: 'react-dashboard', projectId: 'mock-1', message: 'Re-rendering component <ProjectTable />' },
  { level: 'info', project: 'fastapi-backend', projectId: 'mock-2', message: 'GET /api/v1/projects 200 OK 7ms' },
  { level: 'warn', project: 'react-dashboard', projectId: 'mock-1', message: 'Bundle size increased by 2KB' },
  { level: 'info', project: 'fastapi-backend', projectId: 'mock-2', message: 'Cache hit for key: user_session_42' },
  { level: 'debug', project: 'react-dashboard', projectId: 'mock-1', message: 'State update: projects[]' },
  { level: 'info', project: 'fastapi-backend', projectId: 'mock-2', message: 'POST /api/v1/auth/token 200 OK 31ms' },
  { level: 'info', project: 'react-dashboard', projectId: 'mock-1', message: 'WebSocket message received' },
  { level: 'error', project: 'fastapi-backend', projectId: 'mock-2', message: 'Retrying connection to Redis (attempt 1/3)' },
  { level: 'info', project: 'fastapi-backend', projectId: 'mock-2', message: 'Redis connection restored' },
  { level: 'debug', project: 'react-dashboard', projectId: 'mock-1', message: 'Idle — awaiting input' },
  { level: 'info', project: 'fastapi-backend', projectId: 'mock-2', message: 'Background task: cleanup completed' },
  { level: 'info', project: 'react-dashboard', projectId: 'mock-1', message: 'Compiled with 0 warnings' },
]

let fakeLogSeq = 11
let fakeLogIndex = 0
export function getNextFakeLog(): Omit<LogEntry, 'id'> {
  const entry = fakeLogs[fakeLogIndex % fakeLogs.length]
  fakeLogIndex++
  const d = new Date()
  return {
    seq: fakeLogSeq++,
    timestamp: d.toTimeString().slice(0, 8),
    ...entry,
  }
}
