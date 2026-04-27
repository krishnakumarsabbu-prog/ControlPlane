function Shimmer({ className }: { className: string }) {
  return (
    <div className={`animate-pulse bg-border/40 rounded ${className}`} />
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <Shimmer className="h-2.5 w-16" />
        <Shimmer className="h-7 w-10" />
        <Shimmer className="h-2 w-24" />
      </div>
      <Shimmer className="h-10 w-10 rounded-lg" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-border/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Shimmer className="w-8 h-8 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <Shimmer className="h-3 w-32" />
            <Shimmer className="h-2 w-44" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><Shimmer className="h-5 w-20 rounded-full" /></td>
      <td className="px-4 py-3"><Shimmer className="h-5 w-14 rounded" /></td>
      <td className="px-4 py-3"><Shimmer className="h-3 w-10" /></td>
      <td className="px-4 py-3"><Shimmer className="h-6 w-16 rounded-md" /></td>
      <td className="px-4 py-3"><Shimmer className="h-3 w-16" /></td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5">
          <Shimmer className="h-7 w-16 rounded-md" />
          <Shimmer className="h-7 w-14 rounded-md" />
          <Shimmer className="h-7 w-14 rounded-md" />
        </div>
      </td>
    </tr>
  )
}

export function LogsSkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-1 py-0.5">
      <Shimmer className="h-2.5 w-14" />
      <Shimmer className="h-2.5 w-10" />
      <Shimmer className="h-2.5 w-28" />
      <Shimmer className="h-2.5 w-48" />
    </div>
  )
}
