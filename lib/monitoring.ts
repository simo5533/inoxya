/**
 * Système de monitoring pour INOXYA BIJOUX
 * Intégration avec Sentry pour production (optionnel)
 * 
 * Note: Sentry est optionnel. Si @sentry/nextjs n'est pas installé,
 * le monitoring fonctionne en mode console.log uniquement.
 */

// Import conditionnel de Sentry (optionnel)
// Utiliser une fonction pour éviter l'erreur au build si le module n'existe pas
function loadSentry(): any {
  // Ne jamais charger Sentry au build - seulement au runtime si disponible
  // Cela évite les erreurs Webpack avec les dépendances optionnelles
  if (typeof window === 'undefined' && process.env['NEXT_PHASE'] !== 'phase-production-build') {
    // Côté serveur uniquement, et pas pendant le build
    try {
      // Vérifier d'abord si NEXT_PUBLIC_SENTRY_DSN est défini
      // Si non, ne pas essayer de charger Sentry du tout
      if (!process.env['NEXT_PUBLIC_SENTRY_DSN']) {
        return null
      }
      
      // Utiliser Function constructor pour éviter que Webpack analyse ce require
      const requireFunc = new Function('moduleName', 'return require(moduleName)')
      const sentry = requireFunc('@sentry/nextjs')
      
      // Vérifier que Sentry est bien chargé
      if (!sentry || typeof sentry.init !== 'function') {
        return null
      }
      
      return sentry
    } catch (error: any) {
      // Si erreur (module manquant, dépendances manquantes, etc.), ignorer silencieusement
      // Ne pas logger pour éviter le spam dans les logs
      return null
    }
  }
  return null
}

const isProduction = process.env.NODE_ENV === 'production'
const sentryDsn = process.env['NEXT_PUBLIC_SENTRY_DSN']

// Initialiser Sentry si DSN est configuré et package disponible
// IMPORTANT: Ne jamais bloquer le site si Sentry échoue
if (isProduction && sentryDsn) {
  try {
    const Sentry = loadSentry()
    if (Sentry && typeof Sentry.init === 'function') {
      try {
        Sentry.init({
          dsn: sentryDsn,
          environment: process.env.NODE_ENV || 'production',
          tracesSampleRate: 0.1, // 10% des transactions pour performance
          beforeSend(event: any) {
            // Filtrer les données sensibles
            if (event.request) {
              // Ne pas logger les tokens, passwords, etc.
              if (event.request.headers) {
                delete event.request.headers['authorization']
                delete event.request.headers['cookie']
              }
              if (event.request.data) {
                const data = event.request.data as Record<string, unknown>
                if (data['password']) data['password'] = '[REDACTED]'
                if (data['password_hash']) data['password_hash'] = '[REDACTED]'
                if (data['token']) data['token'] = '[REDACTED]'
              }
            }
            return event
          },
        })
      } catch (initError) {
        // Erreur lors de l'init - ignorer silencieusement
        // Ne pas logger pour éviter le spam
      }
    }
  } catch (error) {
    // Erreur lors du chargement - ignorer silencieusement
    // Le site doit fonctionner même sans Sentry
  }
}

/**
 * Initialiser le monitoring côté client (pour MonitoringProvider)
 */
export function initMonitoring() {
  // L'initialisation est déjà faite au chargement du module
  // Cette fonction existe pour compatibilité avec MonitoringProvider
}

/**
 * Logger une erreur avec contexte
 */
export function logError(
  error: Error | unknown,
  context?: {
    userId?: string
    operation?: string
    metadata?: Record<string, unknown>
  }
) {
  const Sentry = loadSentry()
  if (isProduction && sentryDsn && Sentry) {
    try {
      Sentry.withScope((scope: any) => {
        if (context?.userId) {
          scope.setUser({ id: context.userId })
        }
        if (context?.operation) {
          scope.setTag('operation', context.operation)
        }
        if (context?.metadata) {
          Object.entries(context.metadata).forEach(([key, value]) => {
            scope.setExtra(key, value)
          })
        }
        Sentry.captureException(error)
      })
    } catch (sentryError) {
      // Fallback si Sentry échoue
      console.error('[ERROR]', context?.operation || 'Unknown', error)
      if (context?.metadata) {
        console.error('[CONTEXT]', context.metadata)
      }
    }
  } else {
    // En développement ou sans Sentry, utiliser console.error
    console.error('[ERROR]', context?.operation || 'Unknown', error)
    if (context?.metadata) {
      console.error('[CONTEXT]', context.metadata)
    }
  }
}

/**
 * Logger un message d'information
 */
export function logInfo(
  message: string,
  context?: {
    userId?: string
    operation?: string
    metadata?: Record<string, unknown>
  }
) {
  const Sentry = loadSentry()
  if (isProduction && sentryDsn && Sentry) {
    try {
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data: context?.metadata || {},
      })
    } catch (sentryError) {
      // Fallback si Sentry échoue
      console.log('[INFO]', context?.operation || 'Unknown', message, context?.metadata || {})
    }
  } else {
    // En développement ou sans Sentry, utiliser console.log
    console.log('[INFO]', context?.operation || 'Unknown', message, context?.metadata || {})
  }
}

/**
 * Mesurer le temps d'exécution d'une fonction
 */
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    logInfo(`Operation ${operation} completed`, {
      operation,
      metadata: { duration: `${duration}ms` },
    })
    return result
  } catch (error) {
    const duration = Date.now() - start
    logError(error, {
      operation,
      metadata: { duration: `${duration}ms` },
    })
    throw error
  }
}

/**
 * Wrapper pour monitorer une fonction avec Sentry
 */
export function withMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  operation: string
): T {
  return ((...args: Parameters<T>) => {
    const Sentry = loadSentry()
    if (isProduction && sentryDsn && Sentry) {
      return Sentry.withScope((scope: any) => {
        scope.setTag('operation', operation)
        try {
          return fn(...args)
        } catch (error) {
          Sentry.captureException(error)
          throw error
        }
      })
    } else {
      return fn(...args)
    }
  }) as T
}
