import { useState, useCallback } from 'react'
import type { ToastMessage, ToastVariant } from '../components/Toast'

let _toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const push = useCallback((variant: ToastVariant, title: string, body?: string) => {
    const id = `toast-${++_toastId}`
    setToasts(prev => [...prev, { id, variant, title, body }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, push, dismiss }
}
