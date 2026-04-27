import { Search, Plus, Play, Square } from 'lucide-react'
import ProjectRow from './ProjectRow'
import { TableRowSkeleton } from './Skeletons'
import type { Project } from '../types'

interface ProjectTableProps {
  projects: Project[]
  isLoading?: boolean
  onStart: (id: string) => void
  onStop: (id: string) => void
  onToggleAutoRestart: (id: string, enabled: boolean) => void
  onStartAll: () => void
  onStopAll: () => void
  search: string
  onSearch: (val: string) => void
  pendingId?: string
}

export default function ProjectTable({
  projects,
  isLoading,
  onStart,
  onStop,
  onToggleAutoRestart,
  onStartAll,
  onStopAll,
  search,
  onSearch,
  pendingId,
}: ProjectTableProps) {
  const filtered = projects.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tech.toLowerCase().includes(search.toLowerCase()),
  )

  const anyRunning = projects.some(p => p.status === 'running')
  const anyStartable = projects.some(p => p.status !== 'running' && p.status !== 'starting')

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        {/* Search */}
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-3 text-text-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="bg-elevated border border-border rounded-md pl-8 pr-3 py-1.5 text-[12px] text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 w-56 transition-all duration-150"
          />
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onStartAll}
            disabled={!anyStartable || isLoading}
            title="Start all stopped projects"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-running/10 hover:bg-running/20 text-running text-[12px] font-semibold rounded-md transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={12} />
            Start All
          </button>
          <button
            onClick={onStopAll}
            disabled={!anyRunning || isLoading}
            title="Stop all running projects"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error text-[12px] font-semibold rounded-md transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Square size={12} />
            Stop All
          </button>
        </div>

        <div className="ml-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/80 text-white text-[12px] font-semibold rounded-md transition-all duration-150 active:scale-95">
            <Plus size={13} />
            Add POC
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-elevated/50 sticky top-0 z-10">
              {['Project', 'Status', 'Tech', 'Port', 'Auto Restart', 'Last Run', 'Actions'].map(col => (
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
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-text-secondary">
                  No projects match your search.
                </td>
              </tr>
            ) : (
              filtered.map(project => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onStart={onStart}
                  onStop={onStop}
                  onToggleAutoRestart={onToggleAutoRestart}
                  isPending={pendingId === project.id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
        {isLoading ? (
          <span className="opacity-50">Loading...</span>
        ) : (
          <>
            <span>{filtered.length} of {projects.length} projects</span>
            {search && (
              <button
                onClick={() => onSearch('')}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Clear filter
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
