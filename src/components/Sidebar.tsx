import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Play, ScrollText, Network, Code as Code2, Terminal, Settings, Layers } from 'lucide-react'

const navItems = [
  { to: '/projects', label: 'Projects', icon: LayoutDashboard },
  { to: '/running', label: 'Running', icon: Play },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/ports', label: 'Ports', icon: Network },
]

export default function Sidebar() {
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
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => [
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 w-full text-left',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-secondary hover:bg-elevated hover:text-text-primary',
              ].join(' ')}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className={isActive ? 'text-primary' : ''} />
                  {label}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest px-2 mt-6 mb-2">Tools</p>
        <nav className="flex flex-col gap-0.5">
          <NavLink
            to="/settings"
            className={({ isActive }) => [
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 w-full text-left',
              isActive
                ? 'bg-primary/15 text-primary'
                : 'text-text-secondary hover:bg-elevated hover:text-text-primary',
            ].join(' ')}
          >
            {({ isActive }) => (
              <>
                <Settings size={15} className={isActive ? 'text-primary' : ''} />
                Settings
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </>
            )}
          </NavLink>
          {[{ id: 'vscode', label: 'VS Code', icon: Code2 }, { id: 'terminal', label: 'Terminal', icon: Terminal }].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-text-secondary hover:bg-elevated hover:text-text-primary transition-all duration-150 w-full text-left"
            >
              <Icon size={15} />
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
