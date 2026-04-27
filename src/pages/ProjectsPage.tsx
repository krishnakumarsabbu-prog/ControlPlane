import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Boxes, Play, CircleStop as StopCircle, Network, Server, RefreshCw } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import ProjectTable from '../components/ProjectTable'
import LogsPanel from '../components/LogsPanel'
import ProfilesPanel from '../components/ProfilesPanel'
import CommandPalette from '../components/CommandPalette'
import ConfirmDialog from '../components/ConfirmDialog'
import AddProjectModal from '../components/AddProjectModal'
import { StatsCardSkeleton } from '../components/Skeletons'
import {
  useProjects,
  useStartProject,
  useStopProject,
  useUpdateProjectConfig,
  usePorts,
  useCreateProject,
} from '../hooks/useProjects'
import { useProfiles, useCreateProfile, useDeleteProfile, useUpdateProfileProjects } from '../hooks/useProfiles'
import { useLogs, useClearLogs } from '../hooks/useLogs'
import { useStats } from '../hooks/useStats'
import { useToastPush } from '../context/ToastContext'

type OutletCtx = { paletteOpen: boolean; onPaletteClose: () => void }

type ConfirmState =
  | { type: 'stop'; id: string; name: string }
  | { type: 'stop-all'; count: number }
  | { type: 'delete-profile'; id: string; name: string }
  | null

export default function ProjectsPage() {
  const { paletteOpen, onPaletteClose } = useOutletContext<OutletCtx>()
  const push = useToastPush()

  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const { data: projects = [], isLoading: projectsLoading, isError: projectsError } = useProjects()
  const { data: portRegistry = {} } = usePorts()
  const { entries: logs, clear: clearLogsLocally } = useLogs()
  const { data: profiles = [] } = useProfiles()
  useStats()

  const startMutation = useStartProject()
  const stopMutation = useStopProject()
  const configMutation = useUpdateProjectConfig()
  const clearLogsMutation = useClearLogs(clearLogsLocally)
  const createMutation = useCreateProject()
  const createProfileMutation = useCreateProfile()
  const deleteProfileMutation = useDeleteProfile()
  const updateProfileProjectsMutation = useUpdateProfileProjects()

  const handleStart = (id: string) => {
    startMutation.mutate(id, {
      onSuccess: (project) => push('success', `Starting ${project.name}`, 'Project is initializing...'),
      onError: (err) => push('error', 'Failed to start project', (err as Error).message),
    })
  }

  const handleStopConfirmed = (id: string) => {
    stopMutation.mutate(id, {
      onSuccess: (project) => push('warning', `${project.name} stopped`, 'Process terminated.'),
      onError: (err) => push('error', 'Failed to stop project', (err as Error).message),
    })
  }

  const handleStop = (id: string) => {
    const project = projects.find(p => p.id === id)
    if (!project) return
    setConfirm({ type: 'stop', id, name: project.name })
  }

  const handleStartAll = () => {
    const stoppable = projects.filter(p => p.status !== 'running' && p.status !== 'starting')
    if (stoppable.length === 0) return
    stoppable.forEach(p => startMutation.mutate(p.id))
    push('success', `Starting ${stoppable.length} project${stoppable.length !== 1 ? 's' : ''}`, 'All stopped projects are initializing...')
  }

  const handleStopAll = () => {
    const running = projects.filter(p => p.status === 'running')
    if (running.length === 0) return
    setConfirm({ type: 'stop-all', count: running.length })
  }

  const handleStopAllConfirmed = () => {
    const running = projects.filter(p => p.status === 'running')
    running.forEach(p => stopMutation.mutate(p.id))
    push('warning', `Stopping ${running.length} project${running.length !== 1 ? 's' : ''}`, 'All running processes will be terminated.')
  }

  const handleStartGroup = (projectIds: string[]) => {
    const targets = projects.filter(p => projectIds.includes(p.id) && p.status !== 'running' && p.status !== 'starting')
    targets.forEach(p => startMutation.mutate(p.id))
    if (targets.length > 0) push('success', `Starting ${targets.length} project${targets.length !== 1 ? 's' : ''}`, 'Profile projects are initializing...')
  }

  const handleStopGroup = (projectIds: string[]) => {
    const targets = projects.filter(p => projectIds.includes(p.id) && p.status === 'running')
    targets.forEach(p => stopMutation.mutate(p.id))
    if (targets.length > 0) push('warning', `Stopping ${targets.length} project${targets.length !== 1 ? 's' : ''}`, 'Profile projects will be terminated.')
  }

  const handleToggleAutoRestart = (id: string, enabled: boolean) => {
    configMutation.mutate(
      { id, config: { autoRestart: enabled } },
      {
        onSuccess: (project) => push('success', `Auto-restart ${enabled ? 'enabled' : 'disabled'}`, `${project.name} will ${enabled ? 'automatically restart on crash' : 'stay stopped on crash'}`),
        onError: (err) => push('error', 'Failed to update config', (err as Error).message),
      },
    )
  }

  const handleAddProject = (data: { name: string; path: string; startCommand: string }) => {
    createMutation.mutate(data, {
      onSuccess: (project) => {
        push('success', `Added ${project.name}`, 'Project registered successfully.')
        setAddModalOpen(false)
      },
      onError: (err) => push('error', 'Failed to add project', (err as Error).message),
    })
  }

  const handleConfirmOk = () => {
    if (!confirm) return
    if (confirm.type === 'stop') {
      handleStopConfirmed(confirm.id)
    } else if (confirm.type === 'stop-all') {
      handleStopAllConfirmed()
    } else if (confirm.type === 'delete-profile') {
      deleteProfileMutation.mutate(confirm.id, {
        onSuccess: () => push('warning', 'Profile deleted'),
        onError: (err) => push('error', 'Failed to delete profile', (err as Error).message),
      })
    }
    setConfirm(null)
  }

  const runningCount = projects.filter(p => p.status === 'running').length
  const stoppedCount = projects.filter(p => p.status === 'stopped').length
  const portsUsed = Object.keys(portRegistry).length
  const autoRestartCount = projects.filter(p => p.autoRestart).length

  const confirmTitle = !confirm ? ''
    : confirm.type === 'stop' ? `Stop "${confirm.name}"?`
    : confirm.type === 'stop-all' ? `Stop all ${confirm.count} running projects?`
    : `Delete profile "${confirm.name}"?`

  const confirmMessage = !confirm ? ''
    : confirm.type === 'stop' ? 'The process will be terminated immediately.'
    : confirm.type === 'stop-all' ? 'All running processes will be terminated immediately.'
    : 'This will remove the profile and all its project assignments.'

  const confirmLabel = !confirm ? 'Confirm'
    : confirm.type === 'delete-profile' ? 'Delete' : 'Stop'

  return (
    <>
      <main className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Stats */}
        {projectsLoading ? (
          <div className="grid grid-cols-4 gap-4">
            <StatsCardSkeleton /><StatsCardSkeleton /><StatsCardSkeleton /><StatsCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <StatsCard label="Total POCs" value={projects.length} icon={Boxes} color="text-primary" bgColor="bg-primary/10" delta="All environments" />
            <StatsCard label="Running" value={runningCount} icon={Play} color="text-running" bgColor="bg-running/10" delta={runningCount > 0 ? 'Active' : 'None active'} />
            <StatsCard label="Stopped" value={stoppedCount} icon={StopCircle} color="text-stopped" bgColor="bg-stopped/10" delta="Idle processes" />
            <StatsCard label="Ports Used" value={portsUsed} icon={Network} color="text-starting" bgColor="bg-starting/10" delta="Active listeners" />
          </div>
        )}

        {projectsError && (
          <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-[13px] text-error">
            Failed to load projects. Retrying automatically...
          </div>
        )}

        <ProjectTable
          projects={projects}
          isLoading={projectsLoading}
          onStart={handleStart}
          onStop={handleStop}
          onToggleAutoRestart={handleToggleAutoRestart}
          onStartAll={handleStartAll}
          onStopAll={handleStopAll}
          onAddProject={() => setAddModalOpen(true)}
          search={search}
          onSearch={setSearch}
          pendingId={startMutation.isPending ? startMutation.variables : stopMutation.variables}
        />

        <ProfilesPanel
          profiles={profiles}
          projects={projects}
          onCreateProfile={(name, color) => {
            createProfileMutation.mutate({ name, color }, {
              onSuccess: () => push('success', 'Profile created'),
              onError: (err) => push('error', 'Failed to create profile', (err as Error).message),
            })
          }}
          onDeleteProfile={(id) => {
            const profile = profiles.find(p => p.id === id)
            setConfirm({ type: 'delete-profile', id, name: profile?.name ?? '' })
          }}
          onUpdateProjectIds={(profileId, projectIds) => updateProfileProjectsMutation.mutate({ profileId, projectIds })}
          onStartGroup={handleStartGroup}
          onStopGroup={handleStopGroup}
        />

        {portsUsed > 0 && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Server size={13} className="text-text-secondary" />
              <span className="text-[12px] font-semibold text-text-primary">Active Ports</span>
              <span className="ml-auto text-[11px] text-text-secondary">{portsUsed} listener{portsUsed !== 1 ? 's' : ''}</span>
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {Object.entries(portRegistry).map(([port, entry]) => (
                <div key={port} className="flex items-center gap-2 px-3 py-1.5 bg-elevated border border-border rounded-lg text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-running flex-shrink-0" />
                  <span className="font-mono text-text-primary">:{port}</span>
                  <span className="text-text-secondary">{entry.projectName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {autoRestartCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-running/5 border border-running/15 rounded-xl text-[12px] text-running">
            <RefreshCw size={12} />
            <span>
              <span className="font-semibold">{autoRestartCount}</span> project{autoRestartCount !== 1 ? 's' : ''} configured for auto-restart on crash
            </span>
          </div>
        )}

        <LogsPanel logs={logs} onClear={() => clearLogsMutation.mutate()} />
      </main>

      <AddProjectModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddProject}
        isSubmitting={createMutation.isPending}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={onPaletteClose}
        projects={projects}
        onStart={handleStart}
        onStop={handleStop}
      />

      <ConfirmDialog
        open={confirm !== null}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        variant={confirm?.type === 'delete-profile' ? 'danger' : 'warning'}
        onConfirm={handleConfirmOk}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
