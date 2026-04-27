import { useState } from 'react'
import { Boxes, Play, CircleStop as StopCircle, Network } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import ProjectTable from '../components/ProjectTable'
import LogsPanel from '../components/LogsPanel'
import { StatsCardSkeleton } from '../components/Skeletons'
import { useProjects, useStartProject, useStopProject } from '../hooks/useProjects'
import { useLogs, useClearLogs } from '../hooks/useLogs'
import { useStats } from '../hooks/useStats'
import type { ToastVariant } from '../components/Toast'

interface ProjectsPageProps {
  onToast: (variant: ToastVariant, title: string, body?: string) => void
}

export default function ProjectsPage({ onToast }: ProjectsPageProps) {
  const [search, setSearch] = useState('')

  const { data: projects = [], isLoading: projectsLoading, isError: projectsError } = useProjects()
  const { data: logs = [], isError: logsError } = useLogs()
  useStats()

  const startMutation = useStartProject()
  const stopMutation = useStopProject()
  const clearLogsMutation = useClearLogs()

  const handleStart = (id: string) => {
    startMutation.mutate(id, {
      onSuccess: (project) => {
        onToast('success', `Starting ${project.name}`, 'Project is initializing...')
      },
      onError: (err) => {
        onToast('error', 'Failed to start project', (err as Error).message)
      },
    })
  }

  const handleStop = (id: string) => {
    stopMutation.mutate(id, {
      onSuccess: (project) => {
        onToast('warning', `${project.name} stopped`, 'Process terminated.')
      },
      onError: (err) => {
        onToast('error', 'Failed to stop project', (err as Error).message)
      },
    })
  }

  const handleClearLogs = () => {
    clearLogsMutation.mutate()
  }

  const runningCount = projects.filter(p => p.status === 'running').length
  const stoppedCount = projects.filter(p => p.status === 'stopped').length
  const portsUsed = projects.filter(p => p.port !== null).length

  return (
    <main className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      {/* Stats */}
      {projectsLoading ? (
        <div className="grid grid-cols-4 gap-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      ) : (
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
            delta={runningCount > 0 ? 'Active' : 'None active'}
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
      )}

      {/* Error banner for projects */}
      {projectsError && (
        <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-[13px] text-error">
          Failed to load projects. Retrying automatically...
        </div>
      )}

      {/* Table */}
      <ProjectTable
        projects={projects}
        isLoading={projectsLoading}
        onStart={handleStart}
        onStop={handleStop}
        search={search}
        onSearch={setSearch}
        pendingId={startMutation.isPending ? startMutation.variables : stopMutation.variables}
      />

      {/* Logs error */}
      {logsError && (
        <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-[13px] text-error">
          Failed to load logs. Retrying automatically...
        </div>
      )}

      {/* Logs */}
      <LogsPanel logs={logs} onClear={handleClearLogs} />
    </main>
  )
}
