import { useState, useRef, useEffect } from 'react'
import { ScrollText, Filter, Trash2, Pause, Play } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useLogs, useClearLogs } from '../hooks/useLogs'
import { useToastPush } from '../context/ToastContext'
import type { LogEntry } from '../types'

type LevelFilter = 'all' | 'info' | 'error' | 'warn' | 'debug' | 'success' | 'system'

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  success: 'text-green-400',
  debug: 'text-text-secondary',
  system: 'text-text-secondary/70',
}

const LEVEL_BG: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warn: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  debug: 'bg-elevated text-text-secondary border-border',
  system: 'bg-elevated text-text-secondary/70 border-border',
}

function LogLine({ entry }: { entry: LogEntry }) {
  return (
    <div className="flex items-start gap-3 px-3 py-1 hover:bg-elevated/30 rounded transition-colors font-mono text-[11px]">
      <span className="text-text-secondary/50 shrink-0 w-20 tabular-nums">{entry.timestamp}</span>
      <span className={`shrink-0 w-14 uppercase font-semibold ${LEVEL_COLORS[entry.level] ?? 'text-text-secondary'}`}>
        {entry.level}
      </span>
      <span className="text-text-secondary/70 shrink-0 w-28 truncate">[{entry.project}]</span>
      <span className="text-text-primary/90 break-words min-w-0">{entry.message}</span>
    </div>
  )
}

export default function LogsPage() {
  const { data: projects = [] } = useProjects()
  const { entries: allLogs, clear: clearLocally } = useLogs()
  const clearMutation = useClearLogs(clearLocally)
  const push = useToastPush()

  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [paused, setPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const filteredLogs = allLogs.filter(entry => {
    if (selectedProjectId !== 'all' && entry.projectId !== selectedProjectId) return false
    if (levelFilter !== 'all' && entry.level !== levelFilter) return false
    return true
  })

  const displayedLogs = paused ? filteredLogs : filteredLogs

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayedLogs, autoScroll])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(atBottom)
  }

  const handleClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => push('success', 'Logs cleared'),
      onError: (err) => push('error', 'Failed to clear logs', (err as Error).message),
    })
  }

  const levelCounts = allLogs.reduce<Record<string, number>>((acc, e) => {
    acc[e.level] = (acc[e.level] ?? 0) + 1
    return acc
  }, {})

  return (
    <main className="flex-1 overflow-hidden flex flex-col px-6 py-5 gap-4 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[16px] font-semibold text-text-primary">Logs Explorer</h1>
          <p className="text-[12px] text-text-secondary mt-0.5">{allLogs.length} total entries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border',
              paused
                ? 'bg-running/10 text-running border-running/20 hover:bg-running/20'
                : 'bg-elevated border-border text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={handleClear}
            disabled={clearMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 border border-error/20 text-error rounded-lg text-[12px] font-medium hover:bg-error/20 transition-all disabled:opacity-50"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: project list */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-1 bg-surface border border-border rounded-xl p-2 overflow-y-auto">
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest px-2 py-1">Projects</p>
          <button
            onClick={() => setSelectedProjectId('all')}
            className={[
              'flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left',
              selectedProjectId === 'all'
                ? 'bg-primary/15 text-primary'
                : 'text-text-secondary hover:bg-elevated hover:text-text-primary',
            ].join(' ')}
          >
            <span>All Projects</span>
            <span className="text-[10px] tabular-nums">{allLogs.length}</span>
          </button>
          {projects.map(p => {
            const count = allLogs.filter(e => e.projectId === p.id).length
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={[
                  'flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left',
                  selectedProjectId === p.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-secondary hover:bg-elevated hover:text-text-primary',
                ].join(' ')}
              >
                <span className="truncate">{p.name}</span>
                <span className="text-[10px] tabular-nums ml-2">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Right: log viewer */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface border border-border rounded-xl overflow-hidden">
          {/* Filters */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border flex-shrink-0">
            <Filter size={11} className="text-text-secondary" />
            <span className="text-[11px] text-text-secondary font-medium mr-1">Filter:</span>
            {(['all', 'info', 'warn', 'error', 'debug', 'success', 'system'] as LevelFilter[]).map(level => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={[
                  'px-2 py-0.5 rounded text-[10px] font-semibold border transition-all uppercase',
                  levelFilter === level
                    ? (level === 'all' ? 'bg-primary/20 text-primary border-primary/30' : (LEVEL_BG[level] ?? 'bg-primary/10 text-primary border-primary/20'))
                    : 'bg-elevated text-text-secondary border-border hover:border-border/80',
                ].join(' ')}
              >
                {level}
                {level !== 'all' && levelCounts[level] ? (
                  <span className="ml-1 opacity-70">({levelCounts[level]})</span>
                ) : null}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              {!autoScroll && (
                <button
                  onClick={() => {
                    setAutoScroll(true)
                    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                  }}
                  className="text-[10px] text-primary hover:text-primary/80 border border-primary/30 px-2 py-0.5 rounded transition-all"
                >
                  Scroll to bottom
                </button>
              )}
              <span className="text-[10px] text-text-secondary/60">{filteredLogs.length} entries</span>
            </div>
          </div>

          {/* Log output */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-2 min-h-0"
          >
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center">
                  <ScrollText size={18} className="text-text-secondary/40" />
                </div>
                <p className="text-[13px] text-text-secondary">No log entries</p>
                <p className="text-[11px] text-text-secondary/60">
                  {selectedProjectId !== 'all' ? 'No logs for this project' : 'Start a project to see logs here'}
                </p>
              </div>
            ) : (
              filteredLogs.map(entry => <LogLine key={entry.id} entry={entry} />)
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
