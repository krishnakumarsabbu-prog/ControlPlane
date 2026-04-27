import { createContext, useContext } from 'react'
import type { ToastVariant } from '../components/Toast'

type PushFn = (variant: ToastVariant, title: string, body?: string) => void

export const ToastContext = createContext<PushFn>(() => {})

export function useToastPush() {
  return useContext(ToastContext)
}
