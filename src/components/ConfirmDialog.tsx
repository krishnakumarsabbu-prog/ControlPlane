import { useEffect, useRef } from 'react'
import { TriangleAlert as AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onConfirm, onCancel])

  if (!open) return null

  const isError = variant === 'danger'
  const confirmCls = isError
    ? 'bg-error/10 hover:bg-error/20 text-error border border-error/20 hover:border-error/40'
    : 'bg-starting/10 hover:bg-starting/20 text-starting border border-starting/20 hover:border-starting/40'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-sm mx-4 bg-surface border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isError ? 'bg-error/10' : 'bg-starting/10'}`}>
            <AlertTriangle size={16} className={isError ? 'text-error' : 'text-starting'} />
          </div>
          <div className="flex-1 min-w-0">
            <p id="confirm-title" className="text-[13px] font-semibold text-text-primary">{title}</p>
            <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-[12px] font-semibold text-text-secondary hover:text-text-primary bg-elevated hover:bg-border/30 border border-border rounded-lg transition-all duration-150"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-150 active:scale-95 ${confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
