import { ExternalLink, Network } from 'lucide-react'
import { usePorts, useProjects } from '../hooks/useProjects'
import StatusPill from '../components/StatusPill'

export default function PortsPage() {
  const { data: portRegistry = {}, isLoading } = usePorts()
  const { data: projects = [] } = useProjects()

  const entries = Object.entries(portRegistry).map(([port, entry]) => {
    const project = projects.find(p => p.id === entry.projectId)
    return { port: Number(port), projectName: entry.projectName, projectId: entry.projectId, status: project?.status ?? 'running' }
  })

  return (
    <main className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-semibold text-text-primary">Port Usage</h1>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {isLoading ? 'Loading...' : `${entries.length} port${entries.length !== 1 ? 's' : ''} in use`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-starting/10 border border-starting/20">
          <Network size={13} className="text-starting" />
          <span className="text-[12px] font-semibold text-starting">{entries.length} active</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-elevated/50">
                {['Port', 'Project', 'Status', 'Actions'].map(col => (
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
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-elevated rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center">
                        <Network size={20} className="text-text-secondary/40" />
                      </div>
                      <p className="text-[13px] font-medium text-text-secondary">No ports in use</p>
                      <p className="text-[11px] text-text-secondary/60">Start a project to see ports here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map(({ port, projectName, status }) => (
                  <tr
                    key={port}
                    className="border-b border-border/50 last:border-0 hover:bg-elevated/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-running flex-shrink-0" />
                        <span className="font-mono text-[13px] font-semibold text-text-primary">:{port}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-text-primary">{projectName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={status as 'running' | 'stopped' | 'starting' | 'error'} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => window.open(`http://localhost:${port}`, '_blank')}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-elevated border border-border rounded-md text-[11px] text-text-secondary hover:text-primary hover:border-primary/30 transition-all"
                      >
                        <ExternalLink size={11} />
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && entries.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border text-[11px] text-text-secondary">
            {entries.length} port{entries.length !== 1 ? 's' : ''} registered
          </div>
        )}
      </div>
    </main>
  )
}
