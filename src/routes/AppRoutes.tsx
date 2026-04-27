import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ProjectsPage from '../pages/ProjectsPage'
import RunningPage from '../pages/RunningPage'
import LogsPage from '../pages/LogsPage'
import PortsPage from '../pages/PortsPage'
import SettingsPage from '../pages/SettingsPage'
import VsCodePage from '../pages/VsCodePage'
import TerminalPage from '../pages/TerminalPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route element={<Layout />}>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/running" element={<RunningPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/ports" element={<PortsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/vscode" element={<VsCodePage />} />
        <Route path="/terminal" element={<TerminalPage />} />
      </Route>
    </Routes>
  )
}
