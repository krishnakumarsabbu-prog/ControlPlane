import { Play, Square, ExternalLink, Loader as Loader2, RefreshCw } from 'lucide-react'
import StatusPill from './StatusPill'
import type { Project } from '../types'

interface ProjectRowProps {
  project: Project
  onStart: (id: string) => void
  onStop: (id: string) => void
  onToggleAutoRestart: (id: string, enabled: boolean) => void
  isPending?: boolean
}

export default function ProjectRow({ project, onStart, onStop, onToggleAutoRestart, isPending }: ProjectRowProps) {
  const isStarting = project.status === 'starting' || isPending
  const canStart = (project.status === 'stopped' || project.status === 'error') && !isPending
  const canStop = project.status === 'running' && !isPending
  const canOpen = project.status === 'running' && project.port !== null

  return (
    <tr className="border-b border-border/50 hover:bg-elevated/50 transition-colors duration-150 group">
      {/* Project */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-elevated border border-border flex items-center justify-center text-[14px] flex-shrink-0">
            {project.icon}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-text-primary">{project.name}</p>
            <p className="text-[11px] text-text-secondary font-mono">{project.path}</p>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <StatusPill status={project.status} />
          {project.restartCount > 0 && (
            <span className="text-[10px] text-warning font-mono">
              restarted {project.restartCount}x
            </span>
          )}
        </div>
      </td>

      {/* Tech */}
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border"
          style={{
            color: project.techColor,
            backgroundColor: `${project.techColor}18`,
            borderColor: `${project.techColor}35`,
          }}
        >
          {project.tech}
        </span>
      </td>

      {/* Port */}
      <td className="px-4 py-3">
        {project.port ? (
          <span className="text-[12px] font-mono text-text-secondary">
            :{project.port}
          </span>
        ) : (
          <span className="text-[12px] text-border">—</span>
        )}
      </td>

      {/* Auto Restart */}
      <td className="px-4 py-3">
        <button
          onClick={() => onToggleAutoRestart(project.id, !project.autoRestart)}
          title={project.autoRestart ? `Auto-restart on (max ${project.maxRetries} retries)` : 'Auto-restart off'}
          className={[
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all duration-150',
            project.autoRestart
              ? 'bg-running/10 text-running border-running/25 hover:bg-running/20'
              : 'bg-border/10 text-text-secondary border-border/20 hover:bg-border/20',
          ].join(' ')}
        >
          <RefreshCw size={10} className={project.autoRestart ? 'animate-spin-slow' : ''} />
          {project.autoRestart ? `On / ${project.maxRetries}` : 'Off'}
        </button>
      </td>

      {/* Last Run */}
      <td className="px-4 py-3">
        <span className="text-[12px] text-text-secondary">{project.lastRun}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {/* Start */}
          <button
            onClick={() => onStart(project.id)}
            disabled={!canStart}
            title="Start"
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150',
              canStart
                ? 'bg-running/10 text-running border border-running/20 hover:bg-running/20 hover:border-running/40 cursor-pointer'
                : 'bg-border/20 text-border border border-transparent cursor-not-allowed opacity-40',
            ].join(' ')}
          >
            {isStarting ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Play size={11} />
            )}
            {isStarting ? 'Starting' : 'Start'}
          </button>

          {/* Stop */}
          <button
            onClick={() => onStop(project.id)}
            disabled={!canStop}
            title="Stop"
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150',
              canStop
                ? 'bg-error/10 text-error border border-error/20 hover:bg-error/20 hover:border-error/40 cursor-pointer'
                : 'bg-border/20 text-border border border-transparent cursor-not-allowed opacity-40',
            ].join(' ')}
          >
            <Square size={11} />
            Stop
          </button>

          {/* Open */}
          <button
            disabled={!canOpen}
            title={canOpen ? `Open localhost:${project.port}` : 'Not running'}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-150',
              canOpen
                ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40 cursor-pointer'
                : 'bg-border/20 text-border border border-transparent cursor-not-allowed opacity-40',
            ].join(' ')}
          >
            <ExternalLink size={11} />
            Open
          </button>
        </div>
      </td>
    </tr>
  )
}
