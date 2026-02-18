'use client'

import { useEffect } from 'react'

/**
 * Provider pour initialiser le monitoring côté client
 * Note: Le monitoring est optionnel (Sentry) et ne doit pas bloquer le rendu
 */
export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialiser le monitoring de manière conditionnelle
    // pour éviter les erreurs si Sentry n'est pas installé
    let mounted = true
    
    const initMonitoring = async () => {
      try {
        // Import dynamique pour éviter les erreurs au build
        const monitoringModule = await import('@/lib/monitoring').catch((err) => {
          // Le module n'existe pas ou ne peut pas être chargé
          if (process.env.NODE_ENV === 'development') {
            console.debug('[MonitoringProvider] Monitoring module not available:', err.message)
          }
          return null
        })
        
        if (mounted && monitoringModule?.initMonitoring) {
          try {
            monitoringModule.initMonitoring()
          } catch (initError) {
            // L'initialisation a échoué, mais ce n'est pas grave
            if (process.env.NODE_ENV === 'development') {
              console.debug('[MonitoringProvider] Monitoring init failed:', initError)
            }
          }
        }
      } catch (error) {
        // Erreur générale, ignorer silencieusement
        if (process.env.NODE_ENV === 'development') {
          console.debug('[MonitoringProvider] Error loading monitoring:', error)
        }
      }
    }
    
    // Délai pour éviter les problèmes de chargement initial
    const timeoutId = setTimeout(() => {
      initMonitoring()
    }, 100)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  return <>{children}</>
}

