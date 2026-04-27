import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal, Trash2, Pause, Play, ChevronDown } from 'lucide-react'
import type { LogEntry } from '../types'
import type { LogFilter } from '../hooks/useLogs'

interface LogsPanelProps {
  logs: LogEntry[]
  onClear: () => void
}

const LEVEL_COLORS: Record<string, string> = {
  info:    '#9ca3af',
  warn:    '#f59e0b',
  error:   '#ef4444',
  success: '#22c55e',
  debug:   '#60a5fa',
  system:  '#a78bfa',
}

const LEVEL_BG: Record<string, string> = {
  info:    'transparent',
  warn:    'rgba(245,158,11,0.05)',
  error:   'rgba(239,68,68,0.07)',
  success: 'rgba(34,197,94,0.05)',
  debug:   'rgba(96,165,250,0.05)',
  system:  'rgba(167,139,250,0.08)',
}

const LEVEL_LABELS: Record<string, string> = {
  info:    'INFO  ',
  warn:    'WARN  ',
  error:   'ERROR ',
  success: 'OK    ',
  debug:   'DEBUG ',
  system:  'SYS   ',
}

const FILTERS: { value: LogFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' },
  { value: 'success', label: 'OK' },
  { value: 'debug', label: 'Debug' },
  { value: 'system', label: 'System' },
]

// Hash a project name to a stable color
const PROJECT_PALETTE = [
  '#61dafb', '#22c55e', '#f59e0b', '#60a5fa', '#f472b6',
  '#34d399', '#fb923c', '#a3e635', '#38bdf8', '#c084fc',
]
const projectColorCache = new Map<string, string>()
function projectColor(name: string): string {
  if (!projectColorCache.has(name)) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
    projectColorCache.set(name, PROJECT_PALETTE[hash % PROJECT_PALETTE.length])
  }
  return projectColorCache.get(name)!
}

export default function LogsPanel({ logs, onClear }: LogsPanelProps) {
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState<LogFilter>('all')
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Auto-scroll when new logs arrive (unless paused)
  useEffect(() => {
    if (!pausedRef.current) {
      scrollToBottom()
    }
  }, [logs, scrollToBottom])

  // Detect manual scroll up → auto-pause
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (!atBottom && !pausedRef.current) {
      setPaused(true)
    }
  }, [])

  const handleResumeScroll = useCallback(() => {
    setPaused(false)
    scrollToBottom()
  }, [scrollToBottom])

  const filtered = filter === 'all' ? logs : logs.filter(e => e.level === filter)

  const errorCount = logs.filter(e => e.level === 'error').length
  const warnCount = logs.filter(e => e.level === 'warn').length

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: '300px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-elevated/50 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Terminal size={13} className="text-text-secondary" />
          <span className="text-[12px] font-semibold text-text-primary tracking-wide">Activity Log</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-border/50 text-text-secondary font-mono">
            {filtered.length}
          </span>
          {errorCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-error/15 text-error font-mono">
              {errorCount} err
            </span>
          )}
          {warnCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono">
              {warnCount} warn
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Filter pills */}
          <div className="flex items-center gap-0.5 mr-1">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={filter === f.value && f.value !== 'all' ? {
                  color: LEVEL_COLORS[f.value],
                  background: LEVEL_BG[f.value] === 'transparent' ? 'rgba(255,255,255,0.06)' : LEVEL_BG[f.value],
                  borderColor: LEVEL_COLORS[f.value] + '55',
                } : {}}
                className={`text-[10px] px-2 py-0.5 rounded border transition-all duration-150 font-mono ${
                  filter === f.value
                    ? 'border-border/80 text-text-primary bg-border/40'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-elevated/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Live / Paused indicator */}
          {paused ? (
            <button
              onClick={handleResumeScroll}
              className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md hover:bg-amber-400/20 transition-all duration-150"
              title="Resume auto-scroll"
            >
              <Pause size={10} />
              Paused
            </button>
          ) : (
            <button
              onClick={() => setPaused(true)}
              className="flex items-center gap-1 text-[11px] text-running"
              title="Pause auto-scroll"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-running animate-pulse" />
              Live
            </button>
          )}

          {/* Scroll to bottom (when paused) */}
          {paused && (
            <button
              onClick={handleResumeScroll}
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-elevated/50 transition-all duration-150"
              title="Scroll to bottom"
            >
              <ChevronDown size={13} />
            </button>
          )}

          {/* Clear */}
          <button
            onClick={onClear}
            className="p-1.5 rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-all duration-150"
            title="Clear logs"
          >
            <Trash2 size={12} />
          </button>

          {/* Pause/resume scroll toggle */}
          <button
            onClick={() => paused ? handleResumeScroll() : setPaused(true)}
            className={`p-1.5 rounded-md transition-all duration-150 ${
              paused
                ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'
            }`}
            title={paused ? 'Resume scroll' : 'Pause scroll'}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-1.5 log-panel"
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[11px] text-text-secondary font-mono opacity-40">
            {filter === 'all' ? '— no logs yet —' : `— no ${filter} logs —`}
          </div>
        ) : (
          filtered.map(entry => (
            <LogLine key={entry.id} entry={entry} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  const color = LEVEL_COLORS[entry.level] ?? '#9ca3af'
  const bg = LEVEL_BG[entry.level] ?? 'transparent'
  const label = LEVEL_LABELS[entry.level] ?? 'INFO  '
  const pColor = projectColor(entry.project)

  return (
    <div
      className="flex items-start gap-2 px-1 py-[2px] rounded text-[11px] leading-[1.6] hover:brightness-110 transition-all duration-75"
      style={{ background: bg, fontFamily: 'inherit' }}
    >
      <span className="text-[#4b5563] flex-shrink-0 select-none tabular-nums">{entry.timestamp}</span>
      <span
        className="font-bold flex-shrink-0 select-none tracking-wider"
        style={{ color, minWidth: '3.8rem' }}
      >
        {label}
      </span>
      <span
        className="flex-shrink-0 font-semibold select-none"
        style={{ color: pColor }}
      >
        [{entry.project}]
      </span>
      <span
        className="break-all min-w-0"
        style={{ color: entry.level === 'error' ? '#fca5a5' : entry.level === 'warn' ? '#fcd34d' : '#d1d5db' }}
      >
        {entry.message}
      </span>
    </div>
  )
}
