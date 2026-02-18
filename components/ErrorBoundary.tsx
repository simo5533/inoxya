'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Envoyer à un service de logging si configuré
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Exemple: envoyer à Sentry ou autre service
      // Sentry.captureException(error, { contexts: { react: errorInfo } })
    }
    
    // Appeler le callback personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback error={this.state.error} onReset={() => {
        this.setState({ hasError: false, error: undefined })
      }} />
    }

    return this.props.children
  }
}

function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {
  const router = useRouter()

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-lg font-semibold">Une erreur est survenue</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">
            {error?.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.'}
          </p>
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Détails techniques (développement uniquement)
              </summary>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                {error.stack}
              </pre>
            </details>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => {
            onReset()
            window.location.reload()
          }}
          variant="default"
          className="flex-1"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          className="flex-1"
        >
          <Home className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Button>
      </div>
    </div>
  )
}

// Hook pour utiliser ErrorBoundary dans les composants fonctionnels
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    // Ici vous pouvez envoyer l'erreur à un service de logging
    throw error // Re-throw pour que ErrorBoundary le capture
  }
}

