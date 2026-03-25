'use client'

import type { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MonitoringProvider } from '@/components/MonitoringProvider'
import { SessionRefresh } from '@/components/SessionRefresh'

/**
 * Wrapper client pour ErrorBoundary et MonitoringProvider
 * Nécessaire car ces composants nécessitent 'use client'
 * et ne peuvent pas être utilisés directement dans un Server Component
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <MonitoringProvider>
        <SessionRefresh />
        {children}
      </MonitoringProvider>
    </ErrorBoundary>
  )
}
ClientProviders.displayName = 'ClientProviders'

