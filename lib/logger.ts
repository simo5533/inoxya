/**
 * Système de logging pour INOXYA BIJOUX
 * Remplace console.log avec gestion des environnements
 * Supporte les logs structurés (JSON)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface StructuredLog {
  level: LogLevel
  message: string
  timestamp: string
  metadata?: Record<string, unknown>
  error?: {
    message: string
    stack?: string
  }
}

const isDevelopment = process.env['NODE_ENV'] === 'development'
const isProduction = process.env['NODE_ENV'] === 'production'
const useStructuredLogs = process.env['USE_STRUCTURED_LOGS'] === 'true'

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true
    // En production, seulement les warnings et erreurs
    return level === 'warn' || level === 'error'
  }

  private formatLog(level: LogLevel, message: string, metadata?: Record<string, unknown>, error?: Error | unknown): string | StructuredLog {
    if (useStructuredLogs) {
      const log: StructuredLog = {
        level,
        message,
        timestamp: new Date().toISOString()
      }
      if (metadata) log.metadata = metadata
      if (error) {
        log.error = {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      }
      return log
    }
    // Format texte pour compatibilité
    return `[${level.toUpperCase()}] ${message}`
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    if (this.shouldLog('debug')) {
      const log = this.formatLog('debug', message, metadata)
      if (useStructuredLogs) {
        console.debug(JSON.stringify(log))
      } else {
        console.debug(log, metadata || '')
      }
    }
  }

  info(message: string, metadata?: Record<string, unknown>) {
    if (this.shouldLog('info')) {
      const log = this.formatLog('info', message, metadata)
      if (useStructuredLogs) {
        console.info(JSON.stringify(log))
      } else {
        console.info(log, metadata || '')
      }
    }
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    if (this.shouldLog('warn')) {
      const log = this.formatLog('warn', message, metadata)
      if (useStructuredLogs) {
        console.warn(JSON.stringify(log))
      } else {
        console.warn(log, metadata || '')
      }
    }
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>) {
    if (this.shouldLog('error')) {
      try {
        const log = this.formatLog('error', message, metadata, error)
        if (useStructuredLogs) {
          console.error(JSON.stringify(log))
        } else {
          // Production: ne pas logger metadata détaillé (éviter tokens, body, etc.)
          if (isProduction) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : (error && typeof error === 'object' && 'message' in error)
                ? String((error as any).message)
                : String(error || '')
            console.error(`[ERROR] ${message}`, errorMessage)
          } else {
            // Développement: logger l'erreur complète
            let errorDisplay: string | Error
            if (error instanceof Error) {
              errorDisplay = error
            } else if (error && typeof error === 'object') {
              // Sérialiser l'objet d'erreur
              try {
                errorDisplay = JSON.stringify(error, null, 2)
              } catch {
                errorDisplay = String(error)
              }
            } else {
              errorDisplay = String(error || '')
            }
            console.error(`[ERROR] ${message}`, errorDisplay, metadata ? JSON.stringify(metadata, null, 2) : '')
          }
        }
      } catch (logError) {
        // Fallback si le logging échoue
        const errorMessage = error instanceof Error 
          ? error.message 
          : (error && typeof error === 'object' && 'message' in error)
            ? String((error as any).message)
            : String(error || 'Unknown error')
        console.error(`[ERROR] ${message}`, errorMessage)
      }
    }
  }

  // Méthodes spécialisées pour les API routes
  api(method: string, path: string, status?: number) {
    if (this.shouldLog('info')) {
      const statusEmoji = status && status >= 200 && status < 300 ? '✅' : status && status >= 400 ? '❌' : '🔍'
      console.info(`${statusEmoji} ${method} ${path}${status ? ` [${status}]` : ''}`)
    }
  }

  db(operation: string, success: boolean, details?: string) {
    if (this.shouldLog(success ? 'debug' : 'warn')) {
      const emoji = success ? '✅' : '⚠️'
      console[success ? 'debug' : 'warn'](`${emoji} DB ${operation}${details ? `: ${details}` : ''}`)
    }
  }
}

export const logger = new Logger()
export default logger

