import type { ProjectStatus } from '../types'

interface StatusPillProps {
  status: ProjectStatus
}

const config: Record<ProjectStatus, { label: string; dot: string; pill: string }> = {
  running: {
    label: 'Running',
    dot: 'bg-running animate-pulse',
    pill: 'bg-running/10 text-running border-running/20',
  },
  stopped: {
    label: 'Stopped',
    dot: 'bg-stopped',
    pill: 'bg-stopped/10 text-stopped border-stopped/20',
  },
  starting: {
    label: 'Starting',
    dot: 'bg-starting animate-ping',
    pill: 'bg-starting/10 text-starting border-starting/20',
  },
  error: {
    label: 'Error',
    dot: 'bg-error animate-pulse',
    pill: 'bg-error/10 text-error border-error/20',
  },
}

export default function StatusPill({ status }: StatusPillProps) {
  const { label, dot, pill } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${pill} transition-all duration-150`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
