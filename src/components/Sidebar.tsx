import { useState } from 'react'
import { LayoutDashboard, Play, ScrollText, Network, Code as Code2, Terminal, Settings, Layers } from 'lucide-react'

type NavSection = 'projects' | 'running' | 'logs' | 'ports'

interface SidebarProps {
  active: NavSection
  onNavigate: (section: NavSection) => void
}

const navItems: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'projects', label: 'Projects', icon: LayoutDashboard },
  { id: 'running', label: 'Running', icon: Play },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'ports', label: 'Ports', icon: Network },
]

const toolItems = [
  { id: 'vscode', label: 'VS Code', icon: Code2 },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)

  return (
    <aside className="flex flex-col w-[220px] min-w-[220px] h-screen bg-sidebar border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Layers size={15} className="text-white" />
        </div>
        <div>
          <span className="text-[13px] font-semibold text-text-primary tracking-wide">Lapi Cloud</span>
          <div className="text-[10px] text-text-secondary">Control Plane</div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest px-2 mb-2">Workspace</p>
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={[
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 w-full text-left',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-secondary hover:bg-elevated hover:text-text-primary',
                ].join(' ')}
              >
                <Icon size={15} className={isActive ? 'text-primary' : ''} />
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </nav>

        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest px-2 mt-6 mb-2">Tools</p>
        <nav className="flex flex-col gap-0.5">
          {toolItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onMouseEnter={() => setHoveredTool(id)}
              onMouseLeave={() => setHoveredTool(null)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-text-secondary hover:bg-elevated hover:text-text-primary transition-all duration-150 w-full text-left"
            >
              <Icon size={15} className={hoveredTool === id ? 'text-text-primary' : ''} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="text-[10px] text-text-secondary">v0.1.0-alpha</div>
      </div>
    </aside>
  )
}
