import { Cpu, MemoryStick, Bell, Command } from 'lucide-react'
import { useStats } from '../hooks/useStats'
import { useProjects } from '../hooks/useProjects'

interface TopBarProps {
  onOpenPalette?: () => void
}

export default function TopBar({ onOpenPalette }: TopBarProps) {
  const { data: stats } = useStats()
  const { data: projects = [] } = useProjects()

  const runningCount = projects.filter(p => p.status === 'running').length

  const cpu = stats ? Math.round(stats.cpu) : 0
  const cpuColor = cpu > 80 ? 'text-error' : cpu > 60 ? 'text-starting' : 'text-running'

  const ramPct = stats ? Math.round((stats.ram / stats.ramTotal) * 100) : 0
  const ramColor = ramPct > 80 ? 'text-error' : ramPct > 60 ? 'text-starting' : 'text-running'

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-sidebar/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-text-secondary">Control Plane</span>
        <span className="text-border">/</span>
        <span className="text-text-primary font-medium">Projects</span>
      </div>

      {/* Right: stats + avatar */}
      <div className="flex items-center gap-5">
        {/* CPU */}
        <div className="flex items-center gap-1.5">
          <Cpu size={13} className="text-text-secondary" />
          <span className="text-[12px] text-text-secondary font-mono">CPU</span>
          <span className={`text-[12px] font-semibold font-mono ${cpuColor} transition-colors duration-300`}>
            {stats ? `${cpu}%` : '—'}
          </span>
        </div>

        {/* RAM */}
        <div className="flex items-center gap-1.5">
          <MemoryStick size={13} className="text-text-secondary" />
          <span className="text-[12px] text-text-secondary font-mono">RAM</span>
          <span className={`text-[12px] font-semibold font-mono ${ramColor} transition-colors duration-300`}>
            {stats ? (
              <>
                {stats.ram.toFixed(1)}
                <span className="text-text-secondary font-normal">/{stats.ramTotal} GB</span>
              </>
            ) : '—'}
          </span>
        </div>

        {/* Running badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-running/10 border border-running/20">
          <span className="w-1.5 h-1.5 rounded-full bg-running animate-pulse" />
          <span className="text-[11px] font-semibold text-running">
            {runningCount} running
          </span>
        </div>

        {/* Command palette shortcut */}
        <button
          onClick={onOpenPalette}
          title="Command Palette (Ctrl+K)"
          className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-elevated border border-border rounded-md text-[11px] text-text-secondary hover:text-text-primary hover:border-border/80 transition-all duration-150"
        >
          <Command size={11} />
          <span>K</span>
        </button>

        {/* Notifications */}
        <button className="relative p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-elevated transition-all duration-150">
          <Bell size={15} />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-150">
          <span className="text-[11px] font-bold text-white">LC</span>
        </div>
      </div>
    </header>
  )
}
