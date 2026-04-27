import { useEffect, useRef } from 'react'
import { Terminal, Trash2 } from 'lucide-react'
import type { LogEntry } from '../types'

interface LogsPanelProps {
  logs: LogEntry[]
  onClear: () => void
}

const levelColors: Record<LogEntry['level'], string> = {
  info: 'text-[#9ca3af]',
  warn: 'text-[#f59e0b]',
  error: 'text-[#ef4444]',
  success: 'text-[#22c55e]',
  debug: 'text-[#6366f1]',
}

const levelLabels: Record<LogEntry['level'], string> = {
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
  success: 'OK   ',
  debug: 'DEBUG',
}

const projectColors: Record<string, string> = {
  'react-dashboard': 'text-[#61dafb]',
  'fastapi-backend': 'text-[#009688]',
  'vue-storefront': 'text-[#42b883]',
  'node-gateway': 'text-[#68a063]',
  'django-api': 'text-[#0c4b33]',
}

export default function LogsPanel({ logs, onClear }: LogsPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: '260px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-elevated/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-text-secondary" />
          <span className="text-[12px] font-semibold text-text-primary">Activity Log</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-border/50 text-text-secondary font-mono">
            {logs.length} entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-running">
            <span className="w-1.5 h-1.5 rounded-full bg-running animate-pulse" />
            Live
          </span>
          <button
            onClick={onClear}
            className="p-1.5 rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-all duration-150"
            title="Clear logs"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto px-4 py-2 log-panel text-[11px] leading-relaxed">
        {logs.map(entry => (
          <div key={entry.id} className="flex items-start gap-3 hover:bg-elevated/30 px-1 py-0.5 rounded transition-colors duration-100">
            <span className="text-border flex-shrink-0 select-none">{entry.timestamp}</span>
            <span className={`font-semibold flex-shrink-0 select-none ${levelColors[entry.level]}`}>
              {levelLabels[entry.level]}
            </span>
            <span className={`flex-shrink-0 font-medium select-none ${projectColors[entry.project] ?? 'text-text-secondary'}`}>
              [{entry.project}]
            </span>
            <span className="text-text-secondary break-all">{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
