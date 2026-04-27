import { Component, type ReactNode } from 'react'
import { TriangleAlert as AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error.message, error.stack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
              <AlertTriangle size={22} className="text-error" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-text-primary">Something went wrong</p>
              <p className="text-[12px] text-text-secondary mt-1 font-mono break-all">
                {this.state.error.message}
              </p>
            </div>
            <button
              onClick={this.reset}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-[12px] font-semibold rounded-lg transition-colors"
            >
              <RefreshCw size={12} />
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
