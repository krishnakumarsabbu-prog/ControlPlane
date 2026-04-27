import { useState } from 'react'
import { Play, ExternalLink, Clock } from 'lucide-react'
import { useProjects, useStopProject } from '../hooks/useProjects'
import { useToastPush } from '../context/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusPill from '../components/StatusPill'
import { TableRowSkeleton } from '../components/Skeletons'

function formatUptime(lastRun: string): string {
  if (lastRun === 'never') return '—'
  return lastRun
}

export default function RunningPage() {
  const { data: projects = [], isLoading } = useProjects()
  const stopMutation = useStopProject()
  const push = useToastPush()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const running = projects.filter(p => p.status === 'running' || p.status === 'starting')
  const confirmProject = projects.find(p => p.id === confirmId)

  const handleStop = (id: string) => setConfirmId(id)

  const handleConfirm = () => {
    if (!confirmId) return
    stopMutation.mutate(confirmId, {
      onSuccess: (p) => push('warning', `${p.name} stopped`, 'Process terminated.'),
      onError: (err) => push('error', 'Failed to stop', (err as Error).message),
    })
    setConfirmId(null)
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-semibold text-text-primary">Running Projects</h1>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {isLoading ? 'Loading...' : `${running.length} active process${running.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-running/10 border border-running/20">
            <span className="w-2 h-2 rounded-full bg-running animate-pulse" />
            <span className="text-[12px] font-semibold text-running">{running.length} running</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-elevated/50">
                  {['Project', 'Status', 'Port', 'Last Run', 'Actions'].map(col => (
                    <th
                      key={col}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} />)
                ) : running.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center">
                          <Play size={20} className="text-text-secondary/40" />
                        </div>
                        <p className="text-[13px] font-medium text-text-secondary">No running projects</p>
                        <p className="text-[11px] text-text-secondary/60">Start a project from the Projects page</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  running.map(project => (
                    <tr
                      key={project.id}
                      className="border-b border-border/50 last:border-0 hover:bg-elevated/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[16px]">{project.icon}</span>
                          <div>
                            <p className="text-[13px] font-medium text-text-primary">{project.name}</p>
                            <p className="text-[11px] text-text-secondary font-mono truncate max-w-[200px]">{project.path}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={project.status} />
                      </td>
                      <td className="px-4 py-3">
                        {project.port ? (
                          <span className="font-mono text-[12px] text-text-primary">:{project.port}</span>
                        ) : (
                          <span className="text-[12px] text-text-secondary">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                          <Clock size={11} />
                          {formatUptime(project.lastRun)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {project.port && (
                            <button
                              onClick={() => window.open(`http://localhost:${project.port}`, '_blank')}
                              title="Open in browser"
                              className="p-1.5 rounded text-text-secondary hover:text-primary hover:bg-primary/10 transition-all"
                            >
                              <ExternalLink size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleStop(project.id)}
                            disabled={stopMutation.isPending && stopMutation.variables === project.id}
                            className="flex items-center gap-1 px-2.5 py-1 bg-error/10 hover:bg-error/20 text-error text-[12px] font-medium rounded-md transition-all disabled:opacity-50"
                          >
                            Stop
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && running.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border text-[11px] text-text-secondary">
              {running.length} active process{running.length !== 1 ? 'es' : ''}
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={confirmId !== null}
        title={`Stop "${confirmProject?.name}"?`}
        message="The process will be terminated immediately."
        confirmLabel="Stop"
        variant="warning"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmId(null)}
      />
    </>
  )
}
