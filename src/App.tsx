import { useState, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './store/queryClient'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { ToastContainer } from './components/Toast'
import ProjectsPage from './pages/ProjectsPage'
import ErrorBoundary from './components/ErrorBoundary'
import { useToast } from './hooks/useToast'

type NavSection = 'projects' | 'running' | 'logs' | 'ports'

function AppShell() {
  const [activeNav, setActiveNav] = useState<NavSection>('projects')
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
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onOpenPalette={() => setPaletteOpen(true)} />
        <ErrorBoundary>
          <ProjectsPage
            onToast={push}
            onOpenLogs={() => setActiveNav('logs')}
            paletteOpen={paletteOpen}
            onPaletteClose={() => setPaletteOpen(false)}
          />
        </ErrorBoundary>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
