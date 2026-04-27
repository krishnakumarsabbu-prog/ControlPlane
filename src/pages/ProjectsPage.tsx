import { useState } from 'react'
import { Boxes, Play, CircleStop as StopCircle, Network, Server, RefreshCw } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import ProjectTable from '../components/ProjectTable'
import LogsPanel from '../components/LogsPanel'
import ProfilesPanel from '../components/ProfilesPanel'
import CommandPalette from '../components/CommandPalette'
import { StatsCardSkeleton } from '../components/Skeletons'
import { useProjects, useStartProject, useStopProject, useUpdateProjectConfig, usePorts } from '../hooks/useProjects'
import { useProfiles, useCreateProfile, useDeleteProfile, useUpdateProfileProjects } from '../hooks/useProfiles'
import { useLogs, useClearLogs } from '../hooks/useLogs'
import { useStats } from '../hooks/useStats'
import type { ToastVariant } from '../components/Toast'

interface ProjectsPageProps {
  onToast: (variant: ToastVariant, title: string, body?: string) => void
  onOpenLogs: () => void
  paletteOpen: boolean
  onPaletteClose: () => void
}

export default function ProjectsPage({ onToast, onOpenLogs, paletteOpen, onPaletteClose }: ProjectsPageProps) {
  const [search, setSearch] = useState('')

  const { data: projects = [], isLoading: projectsLoading, isError: projectsError } = useProjects()
  const { data: portRegistry = {} } = usePorts()
  const { entries: logs, clear: clearLogsLocally } = useLogs()
  const { data: profiles = [] } = useProfiles()
  useStats()

  const startMutation = useStartProject()
  const stopMutation = useStopProject()
  const configMutation = useUpdateProjectConfig()
  const clearLogsMutation = useClearLogs(clearLogsLocally)
  const createProfileMutation = useCreateProfile()
  const deleteProfileMutation = useDeleteProfile()
  const updateProfileProjectsMutation = useUpdateProfileProjects()


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

  const handleStartAll = () => {
    const stoppable = projects.filter(p => p.status !== 'running' && p.status !== 'starting')
    if (stoppable.length === 0) return
    stoppable.forEach(p => startMutation.mutate(p.id))
    onToast('success', `Starting ${stoppable.length} project${stoppable.length !== 1 ? 's' : ''}`, 'All stopped projects are initializing...')
  }

  const handleStopAll = () => {
    const running = projects.filter(p => p.status === 'running')
    if (running.length === 0) return
    running.forEach(p => stopMutation.mutate(p.id))
    onToast('warning', `Stopping ${running.length} project${running.length !== 1 ? 's' : ''}`, 'All running processes will be terminated.')
  }

  const handleStartGroup = (projectIds: string[]) => {
    const targets = projects.filter(p => projectIds.includes(p.id) && p.status !== 'running' && p.status !== 'starting')
    targets.forEach(p => startMutation.mutate(p.id))
    if (targets.length > 0) {
      onToast('success', `Starting ${targets.length} project${targets.length !== 1 ? 's' : ''}`, 'Profile projects are initializing...')
    }
  }

  const handleStopGroup = (projectIds: string[]) => {
    const targets = projects.filter(p => projectIds.includes(p.id) && p.status === 'running')
    targets.forEach(p => stopMutation.mutate(p.id))
    if (targets.length > 0) {
      onToast('warning', `Stopping ${targets.length} project${targets.length !== 1 ? 's' : ''}`, 'Profile projects will be terminated.')
    }
  }

  const handleToggleAutoRestart = (id: string, enabled: boolean) => {
    configMutation.mutate(
      { id, config: { autoRestart: enabled } },
      {
        onSuccess: (project) => {
          onToast(
            'success',
            `Auto-restart ${enabled ? 'enabled' : 'disabled'}`,
            `${project.name} will ${enabled ? 'automatically restart on crash' : 'stay stopped on crash'}`,
          )
        },
        onError: (err) => {
          onToast('error', 'Failed to update config', (err as Error).message)
        },
      },
    )
  }

  const handleClearLogs = () => {
    clearLogsMutation.mutate()
  }

  const runningCount = projects.filter(p => p.status === 'running').length
  const stoppedCount = projects.filter(p => p.status === 'stopped').length
  const portsUsed = Object.keys(portRegistry).length
  const autoRestartCount = projects.filter(p => p.autoRestart).length

  return (
    <>
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

        {/* Error banner */}
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
          onToggleAutoRestart={handleToggleAutoRestart}
          onStartAll={handleStartAll}
          onStopAll={handleStopAll}
          search={search}
          onSearch={setSearch}
          pendingId={startMutation.isPending ? startMutation.variables : stopMutation.variables}
        />

        {/* Profiles */}
        <ProfilesPanel
          profiles={profiles}
          projects={projects}
          onCreateProfile={(name, color) => {
            createProfileMutation.mutate({ name, color }, {
              onSuccess: () => onToast('success', 'Profile created'),
              onError: (err) => onToast('error', 'Failed to create profile', (err as Error).message),
            })
          }}
          onDeleteProfile={(id) => {
            deleteProfileMutation.mutate(id, {
              onSuccess: () => onToast('warning', 'Profile deleted'),
              onError: (err) => onToast('error', 'Failed to delete profile', (err as Error).message),
            })
          }}
          onUpdateProjectIds={(profileId, projectIds) => {
            updateProfileProjectsMutation.mutate({ profileId, projectIds })
          }}
          onStartGroup={handleStartGroup}
          onStopGroup={handleStopGroup}
        />

        {/* Port Registry Panel */}
        {portsUsed > 0 && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Server size={13} className="text-text-secondary" />
              <span className="text-[12px] font-semibold text-text-primary">Active Ports</span>
              <span className="ml-auto text-[11px] text-text-secondary">{portsUsed} listener{portsUsed !== 1 ? 's' : ''}</span>
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {Object.entries(portRegistry).map(([port, entry]) => (
                <div
                  key={port}
                  className="flex items-center gap-2 px-3 py-1.5 bg-elevated border border-border rounded-lg text-[11px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-running flex-shrink-0" />
                  <span className="font-mono text-text-primary">:{port}</span>
                  <span className="text-text-secondary">{entry.projectName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-restart summary */}
        {autoRestartCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-running/5 border border-running/15 rounded-xl text-[12px] text-running">
            <RefreshCw size={12} />
            <span>
              <span className="font-semibold">{autoRestartCount}</span> project{autoRestartCount !== 1 ? 's' : ''} configured for auto-restart on crash
            </span>
          </div>
        )}

        {/* Logs */}
        <LogsPanel logs={logs} onClear={handleClearLogs} />
      </main>

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={onPaletteClose}
        projects={projects}
        onStart={handleStart}
        onStop={handleStop}
        onOpenLogs={onOpenLogs}
      />
    </>
  )
}
