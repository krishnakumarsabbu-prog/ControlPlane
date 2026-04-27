import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'warning'

export interface ToastMessage {
  id: string
  variant: ToastVariant
  title: string
  body?: string
}

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={15} className="text-running flex-shrink-0" />,
  error: <XCircle size={15} className="text-error flex-shrink-0" />,
  warning: <AlertTriangle size={15} className="text-starting flex-shrink-0" />,
}

const borders: Record<ToastVariant, string> = {
  success: 'border-running/30',
  error: 'border-error/30',
  warning: 'border-starting/30',
}

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true))
    const hide = setTimeout(() => setVisible(false), 3400)
    const remove = setTimeout(() => onDismiss(toast.id), 3700)
    return () => {
      cancelAnimationFrame(show)
      clearTimeout(hide)
      clearTimeout(remove)
    }
  }, [toast.id, onDismiss])

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl border bg-surface shadow-xl text-[12px] w-72 transition-all duration-300',
        borders[toast.variant],
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      {icons[toast.variant]}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary">{toast.title}</p>
        {toast.body && <p className="text-text-secondary mt-0.5 leading-snug">{toast.body}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-secondary hover:text-text-primary transition-colors mt-0.5"
      >
        <X size={12} />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
