import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './store/queryClient'
import AppRoutes from './routes/AppRoutes'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
