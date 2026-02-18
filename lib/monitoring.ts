/**
 * Système de monitoring pour INOXYA BIJOUX
 * Intégration avec Sentry pour production (optionnel)
 * 
 * Note: Sentry est optionnel. Si @sentry/nextjs n'est pas installé,
 * le monitoring fonctionne en mode console.log uniquement.
 */

// Import conditionnel de Sentry (optionnel)
// DÉSACTIVÉ COMPLÈTEMENT pour éviter l'erreur OpenTelemetry
// Sentry sera réactivé plus tard si nécessaire avec une configuration complète
// NOTE: loadSentry() supprimé car non utilisé - Sentry complètement désactivé

// DÉSACTIVER SENTRY COMPLÈTEMENT POUR ÉVITER LES ERREURS OPENTELEMETRY
// Sentry sera réactivé plus tard si nécessaire avec une configuration complète
// NOTE: isProduction et sentryDsn supprimés car non utilisés

// NE PAS INITIALISER SENTRY - DÉSACTIVÉ TEMPORAIREMENT
// Cela évite l'erreur "Cannot find module '@opentelemetry/api'"
// Pour réactiver Sentry plus tard:
// 1. Installer toutes les dépendances OpenTelemetry
// 2. Configurer NEXT_PUBLIC_SENTRY_DSN
// 3. Décommenter le code ci-dessous

/*
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
*/

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
  // SENTRY DÉSACTIVÉ - Utiliser console.error uniquement
  // En développement ou sans Sentry, utiliser console.error
  console.error('[ERROR]', context?.operation || 'Unknown', error)
  if (context?.metadata) {
    console.error('[CONTEXT]', context.metadata)
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
  // SENTRY DÉSACTIVÉ - Utiliser console.log uniquement
  // En développement ou sans Sentry, utiliser console.log
  console.log('[INFO]', context?.operation || 'Unknown', message, context?.metadata || {})
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
  // SENTRY DÉSACTIVÉ - Exécuter la fonction directement
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args)
    } catch (error) {
      console.error('[ERROR]', operation, error)
      throw error
    }
  }) as T
}
