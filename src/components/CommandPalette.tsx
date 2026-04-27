import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Play, Square, ScrollText, ExternalLink, Layers } from 'lucide-react'
import type { Project } from '../types'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  projects: Project[]
  onStart: (id: string) => void
  onStop: (id: string) => void
  onOpenLogs: () => void
}

interface CommandItem {
  id: string
  label: string
  sublabel?: string
  icon: React.ReactNode
  action: () => void
  group: string
}

export default function CommandPalette({
  open,
  onClose,
  projects,
  onStart,
  onStop,
  onOpenLogs,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands: CommandItem[] = [
    ...projects
      .filter(p => p.status !== 'running' && p.status !== 'starting')
      .map(p => ({
        id: `start-${p.id}`,
        label: `Start ${p.name}`,
        sublabel: p.path,
        icon: <Play size={13} className="text-running" />,
        action: () => { onStart(p.id); onClose() },
        group: 'Start Project',
      })),
    ...projects
      .filter(p => p.status === 'running')
      .map(p => ({
        id: `stop-${p.id}`,
        label: `Stop ${p.name}`,
        sublabel: p.path,
        icon: <Square size={13} className="text-error" />,
        action: () => { onStop(p.id); onClose() },
        group: 'Stop Project',
      })),
    ...projects
      .filter(p => p.port)
      .map(p => ({
        id: `browser-${p.id}`,
        label: `Open ${p.name} in browser`,
        sublabel: `http://localhost:${p.port}`,
        icon: <ExternalLink size={13} className="text-starting" />,
        action: () => { window.open(`http://localhost:${p.port}`, '_blank'); onClose() },
        group: 'Open in Browser',
      })),
    {
      id: 'open-logs',
      label: 'Open Logs',
      sublabel: 'View all project logs',
      icon: <ScrollText size={13} className="text-text-secondary" />,
      action: () => { onOpenLogs(); onClose() },
      group: 'Navigation',
    },
  ]

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c.sublabel?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
        c.group.toLowerCase().includes(query.toLowerCase()),
      )
    : commands

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  const flat = Object.values(grouped).flat()

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const runSelected = useCallback(() => {
    flat[selectedIndex]?.action()
  }, [flat, selectedIndex])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, flat.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        runSelected()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, flat, runSelected, onClose])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[560px] mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-150">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={15} className="text-text-secondary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-[13px] text-text-primary placeholder-text-secondary outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-elevated border border-border rounded text-[10px] text-text-secondary font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-text-secondary">
              No commands found
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-1.5 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                  {group}
                </div>
                {items.map(item => {
                  const globalIndex = flat.indexOf(item)
                  const isSelected = globalIndex === selectedIndex
                  return (
                    <button
                      key={item.id}
                      data-index={globalIndex}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={[
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75',
                        isSelected ? 'bg-primary/10' : 'hover:bg-elevated',
                      ].join(' ')}
                    >
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {item.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] text-text-primary">{item.label}</span>
                        {item.sublabel && (
                          <span className="block text-[11px] text-text-secondary truncate">{item.sublabel}</span>
                        )}
                      </span>
                      {isSelected && (
                        <kbd className="flex-shrink-0 flex items-center px-1.5 py-0.5 bg-elevated border border-border rounded text-[10px] text-text-secondary font-mono">
                          Enter
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-elevated/50">
          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <Layers size={11} />
            <span>{flat.length} command{flat.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {[['↑↓', 'navigate'], ['↵', 'run'], ['esc', 'close']].map(([key, label]) => (
              <span key={key} className="flex items-center gap-1 text-[11px] text-text-secondary">
                <kbd className="px-1 py-0.5 bg-elevated border border-border rounded text-[10px] font-mono">{key}</kbd>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
