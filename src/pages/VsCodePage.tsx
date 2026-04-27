import { useState } from 'react'
import { Code as Code2, FolderOpen, ExternalLink, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader as Loader2, Search, ChevronRight } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { openInVsCode } from '../services/api'
import { useToastPush } from '../context/ToastContext'
import type { Project } from '../types'

function ProjectCard({ project, onOpen }: { project: Project; onOpen: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [opened, setOpened] = useState(false)

  const handleOpen = async () => {
    setLoading(true)
    try {
      await onOpen(project.id)
      setOpened(true)
      setTimeout(() => setOpened(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<Project['status'], string> = {
    running: 'text-running',
    stopped: 'text-stopped',
    starting: 'text-starting',
    error: 'text-error',
  }

  return (
    <div className="group bg-surface border border-border rounded-xl p-4 hover:border-border/80 hover:bg-elevated/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-elevated flex items-center justify-center flex-shrink-0 text-[16px]">
            {project.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-text-primary truncate">{project.name}</p>
              <span className={`text-[10px] font-medium uppercase tracking-wide ${statusColors[project.status]}`}>
                {project.status}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5 truncate font-mono">{project.path}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-elevated border border-border text-text-secondary font-mono">
                {project.tech}
              </span>
              {project.port && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-elevated border border-border text-text-secondary font-mono">
                  :{project.port}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleOpen}
          disabled={loading}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 flex-shrink-0',
            opened
              ? 'bg-running/15 text-running border border-running/30'
              : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 active:scale-95',
          ].join(' ')}
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : opened ? (
            <CheckCircle size={13} />
          ) : (
            <Code2 size={13} />
          )}
          {opened ? 'Opened' : 'Open'}
        </button>
      </div>
    </div>
  )
}

export default function VsCodePage() {
  const { data: projects = [], isLoading, isError } = useProjects()
  const push = useToastPush()
  const [search, setSearch] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [customLoading, setCustomLoading] = useState(false)

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpen = async (id: string) => {
    try {
      await openInVsCode({ projectId: id })
      const proj = projects.find(p => p.id === id)
      push('success', 'Opened in VS Code', proj ? `"${proj.name}" is now open in VS Code.` : 'Project opened.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to open VS Code'
      push('error', 'VS Code Error', msg)
      throw err
    }
  }

  const handleCustomOpen = async () => {
    if (!customPath.trim()) return
    setCustomLoading(true)
    try {
      await openInVsCode({ path: customPath.trim() })
      push('success', 'Opened in VS Code', `"${customPath.trim()}" opened in VS Code.`)
      setCustomPath('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to open VS Code'
      push('error', 'VS Code Error', msg)
    } finally {
      setCustomLoading(false)
    }
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 py-5">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
                <Code2 size={16} className="text-primary" />
              </div>
              <h1 className="text-[16px] font-semibold text-text-primary">VS Code Integration</h1>
            </div>
            <p className="text-[12px] text-text-secondary mt-1.5 ml-10">
              Open any project directly in Visual Studio Code from your control panel.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevated border border-border text-[11px] text-text-secondary">
            <div className="w-1.5 h-1.5 rounded-full bg-running animate-pulse" />
            {projects.length} projects
          </div>
        </div>

        {/* Custom path */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <FolderOpen size={13} className="text-text-secondary" />
            <span className="text-[13px] font-semibold text-text-primary">Open Custom Path</span>
          </div>
          <div className="px-4 py-4">
            <p className="text-[12px] text-text-secondary mb-3">
              Enter any file system path to open it directly in VS Code.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPath}
                onChange={e => setCustomPath(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomOpen()}
                placeholder="/path/to/your/project"
                className="flex-1 bg-elevated border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary font-mono placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button
                onClick={handleCustomOpen}
                disabled={!customPath.trim() || customLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/85 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[13px] font-semibold transition-all active:scale-95"
              >
                {customLoading ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
                Open
              </button>
            </div>
          </div>
        </div>

        {/* Projects list */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Code2 size={13} className="text-text-secondary" />
              <span className="text-[13px] font-semibold text-text-primary">Projects</span>
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="w-48 bg-elevated border border-border rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-[78px] bg-elevated/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex items-center gap-3 px-4 py-6 text-error">
                <AlertCircle size={18} />
                <span className="text-[13px]">Failed to load projects. Is the server running?</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-secondary">
                <Code2 size={28} className="opacity-30" />
                <p className="text-[13px]">{search ? 'No projects match your search.' : 'No projects configured yet.'}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map(project => (
                  <ProjectCard key={project.id} project={project} onOpen={handleOpen} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Help note */}
        <div className="flex items-start gap-3 px-4 py-3 bg-elevated/50 border border-border rounded-xl text-[12px] text-text-secondary">
          <ChevronRight size={14} className="flex-shrink-0 mt-0.5" />
          <p>
            Make sure the <code className="font-mono text-text-primary bg-elevated px-1 py-0.5 rounded text-[11px]">code</code> CLI command is available in your PATH.
            On macOS, open VS Code and run <em>Shell Command: Install 'code' command in PATH</em> from the command palette.
          </p>
        </div>
      </div>
    </main>
  )
}
