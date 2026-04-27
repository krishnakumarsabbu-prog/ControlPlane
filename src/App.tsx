import { useState, useEffect, useCallback } from 'react'
import { Boxes, Play, CircleStop as StopCircle, Network } from 'lucide-react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import StatsCard from './components/StatsCard'
import ProjectTable from './components/ProjectTable'
import LogsPanel from './components/LogsPanel'
import { initialProjects, initialLogs, getNextFakeLog } from './data/mockData'
import type { Project, LogEntry, SystemStats } from './types'

type NavSection = 'projects' | 'running' | 'logs' | 'ports'

let logCounter = 100

function makeId() {
  return `log-${++logCounter}`
}

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('projects')
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<SystemStats>({ cpu: 24, ram: 4.2, ramTotal: 16 })

  const appendLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLogs(prev => [...prev.slice(-199), { ...entry, id: makeId() }])
  }, [])

  // Simulate CPU/RAM every 2 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setStats(prev => ({
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
        ram: Math.max(1, Math.min(prev.ramTotal - 0.5, prev.ram + (Math.random() * 0.6 - 0.3))),
        ramTotal: prev.ramTotal,
      }))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // Append fake logs every 1 second (only for running projects)
  useEffect(() => {
    const id = setInterval(() => {
      const hasRunning = projects.some(p => p.status === 'running')
      if (!hasRunning) return
      const entry = getNextFakeLog()
      appendLog(entry)
    }, 1000)
    return () => clearInterval(id)
  }, [projects, appendLog])

  const handleStart = useCallback((id: string) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, status: 'starting' as const } : p)),
    )
    const project = projects.find(p => p.id === id)!
    appendLog({
      timestamp: new Date().toTimeString().slice(0, 8),
      level: 'info',
      project: project.name,
      message: `Starting ${project.name}...`,
    })

    setTimeout(() => {
      // Assign a port if not set
      const portMap: Record<string, number> = {
        'proj-3': 5173,
        'proj-4': 4000,
        'proj-5': 8001,
      }
      setProjects(prev =>
        prev.map(p =>
          p.id === id
            ? {
                ...p,
                status: 'running' as const,
                port: p.port ?? portMap[p.id] ?? 9000,
                lastRun: 'just now',
              }
            : p,
        ),
      )
      const proj = projects.find(p => p.id === id)!
      appendLog({
        timestamp: new Date().toTimeString().slice(0, 8),
        level: 'success',
        project: proj.name,
        message: `${proj.name} is now running`,
      })
    }, 1500)
  }, [projects, appendLog])

  const handleStop = useCallback((id: string) => {
    const project = projects.find(p => p.id === id)!
    setProjects(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: 'stopped' as const, port: null, lastRun: 'just now' }
          : p,
      ),
    )
    appendLog({
      timestamp: new Date().toTimeString().slice(0, 8),
      level: 'warn',
      project: project.name,
      message: `${project.name} stopped.`,
    })
  }, [projects, appendLog])

  const runningCount = projects.filter(p => p.status === 'running').length
  const stoppedCount = projects.filter(p => p.status === 'stopped').length
  const portsUsed = projects.filter(p => p.port !== null).length

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar stats={{ ...stats, cpu: Math.round(stats.cpu), ram: parseFloat(stats.ram.toFixed(1)) }} projects={projects} />

        <main className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatsCard
              label="Total POCs"
              value={projects.length}
              icon={Boxes}
              color="text-primary"
              bgColor="bg-primary/10"
              delta="All environments"
            />
            <StatsCard
              label="Running"
              value={runningCount}
              icon={Play}
              color="text-running"
              bgColor="bg-running/10"
              delta={`${runningCount > 0 ? 'Active' : 'None active'}`}
            />
            <StatsCard
              label="Stopped"
              value={stoppedCount}
              icon={StopCircle}
              color="text-stopped"
              bgColor="bg-stopped/10"
              delta="Idle processes"
            />
            <StatsCard
              label="Ports Used"
              value={portsUsed}
              icon={Network}
              color="text-starting"
              bgColor="bg-starting/10"
              delta="Active listeners"
            />
          </div>

          {/* Table */}
          <ProjectTable
            projects={projects}
            onStart={handleStart}
            onStop={handleStop}
            search={search}
            onSearch={setSearch}
          />

          {/* Logs */}
          <LogsPanel logs={logs} onClear={() => setLogs([])} />
        </main>
      </div>
    </div>
  )
}
