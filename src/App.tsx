import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './store/queryClient'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { ToastContainer } from './components/Toast'
import ProjectsPage from './pages/ProjectsPage'
import { useToast } from './hooks/useToast'

type NavSection = 'projects' | 'running' | 'logs' | 'ports'

function AppShell() {
  const [activeNav, setActiveNav] = useState<NavSection>('projects')
  const { toasts, push, dismiss } = useToast()

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <ProjectsPage onToast={push} />
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  )
}
