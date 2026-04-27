import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { ToastContainer } from './Toast'
import ErrorBoundary from './ErrorBoundary'
import { useToast } from '../hooks/useToast'
import { ToastContext } from '../context/ToastContext'

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { toasts, push, dismiss } = useToast()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      <div className="flex h-screen bg-bg overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar
            onOpenPalette={() => setPaletteOpen(true)}
            paletteOpen={paletteOpen}
            onPaletteClose={() => setPaletteOpen(false)}
          />
          <ErrorBoundary>
            <Outlet context={{ paletteOpen, onPaletteClose: () => setPaletteOpen(false) }} />
          </ErrorBoundary>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </div>
    </ToastContext.Provider>
  )
}
