import { useState, useRef, useEffect, useCallback } from 'react'
import { Terminal, Play, Square, Trash2, ChevronRight, Loader as Loader2, CircleAlert as AlertCircle, Download } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { runCommand, getCommandHistory, type CommandHistoryEntry } from '../services/api'
import { useToastPush } from '../context/ToastContext'

interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'system'
  text: string
  timestamp: string
}

function useTerminalLines() {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'welcome',
      type: 'system',
      text: 'Lapi Cloud Terminal — type a command and press Enter to execute.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ])

  const append = useCallback((line: Omit<TerminalLine, 'id' | 'timestamp'>) => {
    setLines(prev => [
      ...prev,
      { ...line, id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString() },
    ])
  }, [])

  const clear = useCallback(() => {
    setLines([{
      id: crypto.randomUUID(),
      type: 'system',
      text: 'Terminal cleared.',
      timestamp: new Date().toLocaleTimeString(),
    }])
  }, [])

  return { lines, append, clear }
}

export default function TerminalPage() {
  const { data: projects = [] } = useProjects()
  const push = useToastPush()
  const { lines, append, clear } = useTerminalLines()
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [running, setRunning] = useState(false)
  const [history, setHistory] = useState<CommandHistoryEntry[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [inputHistory, setInputHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'terminal' | 'history'>('terminal')
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  useEffect(() => {
    if (selectedProject) setCwd(selectedProject.path)
  }, [selectedProject?.id])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  const loadHistory = useCallback(async () => {
    try {
      const h = await getCommandHistory(selectedProjectId || undefined)
      setHistory(h)
    } catch {
      // history is optional
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (activeTab === 'history') loadHistory()
  }, [activeTab, loadHistory])

  const execute = async () => {
    const cmd = input.trim()
    if (!cmd || running) return

    append({ type: 'input', text: `$ ${cmd}` })
    setInputHistory(prev => [cmd, ...prev.slice(0, 49)])
    setHistoryIdx(-1)
    setInput('')
    setRunning(true)

    try {
      const result = await runCommand({
        command: cmd,
        cwd: cwd || undefined,
        projectId: selectedProjectId || undefined,
      })

      if (result.stdout) {
        result.stdout.split('\n').filter(Boolean).forEach(line =>
          append({ type: 'output', text: line })
        )
      }
      if (result.stderr) {
        result.stderr.split('\n').filter(Boolean).forEach(line =>
          append({ type: 'error', text: line })
        )
      }
      append({
        type: 'system',
        text: `Process exited with code ${result.exitCode}`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Command failed'
      append({ type: 'error', text: msg })
      push('error', 'Command Failed', msg)
    } finally {
      setRunning(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      execute()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIdx = Math.min(historyIdx + 1, inputHistory.length - 1)
      setHistoryIdx(newIdx)
      if (inputHistory[newIdx] !== undefined) setInput(inputHistory[newIdx])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newIdx = Math.max(historyIdx - 1, -1)
      setHistoryIdx(newIdx)
      setInput(newIdx === -1 ? '' : inputHistory[newIdx])
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      clear()
    }
  }

  const exportLog = () => {
    const text = lines.map(l => `[${l.timestamp}] ${l.text}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `terminal-${Date.now()}.log`
    a.click()
    URL.revokeObjectURL(url)
  }

  const lineColors: Record<TerminalLine['type'], string> = {
    input: 'text-primary',
    output: 'text-text-primary',
    error: 'text-error',
    system: 'text-text-secondary',
  }

  return (
    <main className="flex-1 overflow-hidden flex flex-col px-6 py-5 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Terminal size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-[16px] font-semibold text-text-primary">Terminal</h1>
            <p className="text-[11px] text-text-secondary mt-0.5">Execute commands in the context of your projects</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevated border border-border text-text-secondary hover:text-text-primary text-[12px] transition-all hover:bg-elevated/80"
          >
            <Download size={12} />
            Export
          </button>
          <button
            onClick={clear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevated border border-border text-text-secondary hover:text-text-primary text-[12px] transition-all hover:bg-elevated/80"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* Context bar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <label className="text-[11px] text-text-secondary font-medium w-16 flex-shrink-0">Project</label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="flex-1 max-w-[200px] bg-surface border border-border rounded-lg px-3 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="">— No project —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <label className="text-[11px] text-text-secondary font-medium w-16 flex-shrink-0">Working dir</label>
          <input
            type="text"
            value={cwd}
            onChange={e => setCwd(e.target.value)}
            placeholder="Leave empty for server default"
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-[12px] text-text-primary font-mono placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className="flex gap-1 bg-elevated border border-border rounded-lg p-0.5 flex-shrink-0">
          {(['terminal', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-3 py-1 rounded-md text-[12px] font-medium transition-all capitalize',
                activeTab === tab
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal / History panel */}
      <div className="flex-1 min-h-0 bg-[#080a0e] border border-border rounded-xl overflow-hidden flex flex-col">
        {activeTab === 'terminal' ? (
          <>
            {/* Output */}
            <div
              ref={outputRef}
              className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-5 cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              {lines.map(line => (
                <div key={line.id} className={`flex gap-2 ${lineColors[line.type]}`}>
                  <span className="text-text-secondary/40 flex-shrink-0 select-none tabular-nums w-16 text-right">
                    {line.timestamp}
                  </span>
                  <span className="break-all whitespace-pre-wrap">{line.text}</span>
                </div>
              ))}
              {running && (
                <div className="flex items-center gap-2 text-starting mt-1">
                  <span className="text-text-secondary/40 flex-shrink-0 select-none tabular-nums w-16 text-right">
                    {new Date().toLocaleTimeString()}
                  </span>
                  <Loader2 size={11} className="animate-spin" />
                  <span>Running…</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-[#0a0c11]">
              <ChevronRight size={13} className="text-primary flex-shrink-0" />
              {cwd && (
                <span className="text-text-secondary/60 font-mono text-[11px] truncate max-w-[200px] flex-shrink-0">
                  {cwd.split('/').pop() || cwd}
                </span>
              )}
              {cwd && <span className="text-border flex-shrink-0">›</span>}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={running}
                autoFocus
                placeholder={running ? 'Running…' : 'Type a command…'}
                className="flex-1 bg-transparent text-text-primary font-mono text-[12px] focus:outline-none placeholder:text-text-secondary/30 disabled:opacity-50"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
              />
              <button
                onClick={execute}
                disabled={!input.trim() || running}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed text-primary rounded-md text-[11px] font-medium transition-all"
              >
                {running ? <Square size={11} /> : <Play size={11} />}
                Run
              </button>
            </div>
          </>
        ) : (
          /* History tab */
          <div className="flex-1 overflow-y-auto p-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-text-secondary">
                <Terminal size={28} className="opacity-30" />
                <p className="text-[13px]">No command history yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map(entry => (
                  <div
                    key={entry.id}
                    className="bg-elevated/50 border border-border rounded-lg p-3 hover:border-border/80 transition-all cursor-pointer group"
                    onClick={() => {
                      setActiveTab('terminal')
                      setInput(entry.command)
                      if (entry.cwd) setCwd(entry.cwd)
                      setTimeout(() => inputRef.current?.focus(), 50)
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.exitCode === 0 ? 'bg-running' : 'bg-error'}`} />
                        <code className="text-[12px] text-text-primary font-mono truncate">{entry.command}</code>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {entry.projectName && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono">
                            {entry.projectName}
                          </span>
                        )}
                        <span className="text-[10px] text-text-secondary tabular-nums">
                          {new Date(entry.executedAt).toLocaleTimeString()}
                        </span>
                        <span className={`text-[10px] font-mono px-1 py-0.5 rounded ${entry.exitCode === 0 ? 'text-running bg-running/10' : 'text-error bg-error/10'}`}>
                          exit {entry.exitCode}
                        </span>
                      </div>
                    </div>
                    {entry.cwd && (
                      <p className="text-[10px] text-text-secondary/60 font-mono mt-1 ml-3.5 truncate">{entry.cwd}</p>
                    )}
                    {(entry.stdout || entry.stderr) && (
                      <pre className="mt-2 ml-3.5 text-[10px] text-text-secondary/70 font-mono truncate">
                        {(entry.stdout || entry.stderr).split('\n')[0]}
                      </pre>
                    )}
                    <div className="mt-1.5 ml-3.5">
                      <span className="text-[10px] text-primary/60 group-hover:text-primary transition-colors">
                        Click to reuse →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center gap-4 flex-shrink-0 text-[10px] text-text-secondary/50">
        <span><kbd className="font-mono bg-elevated border border-border px-1 py-0.5 rounded text-[10px]">↑↓</kbd> history</span>
        <span><kbd className="font-mono bg-elevated border border-border px-1 py-0.5 rounded text-[10px]">Ctrl+L</kbd> clear</span>
        <span><kbd className="font-mono bg-elevated border border-border px-1 py-0.5 rounded text-[10px]">Enter</kbd> run</span>
        {running && (
          <span className="flex items-center gap-1 text-starting">
            <AlertCircle size={10} />
            Command running — please wait
          </span>
        )}
      </div>
    </main>
  )
}
