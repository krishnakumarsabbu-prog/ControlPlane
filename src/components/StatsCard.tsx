import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color: string
  bgColor: string
  delta?: string
}

export default function StatsCard({ label, value, icon: Icon, color, bgColor, delta }: StatsCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-start justify-between hover:border-border/80 hover:bg-elevated transition-all duration-150 group cursor-default">
      <div>
        <p className="text-[12px] text-text-secondary font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[28px] font-bold text-text-primary leading-none">{value}</p>
        {delta && (
          <p className="text-[11px] text-text-secondary mt-1.5">{delta}</p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor} transition-transform duration-150 group-hover:scale-110`}>
        <Icon size={18} className={color} />
      </div>
    </div>
  )
}
