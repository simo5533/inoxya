/**
 * Point d'entrée pour la couche d'abstraction DB
 * Choisit automatiquement SQLite (dev) ou Postgres (prod) selon DATABASE_URL
 */

import { logger } from '../logger'
import type { DatabaseAdapter } from './adapter'

let adapter: DatabaseAdapter | null = null
let adapterType: 'sqlite' | 'postgres' | 'supabase' | null = null
let adapterInitializing = false
let adapterInitPromise: Promise<DatabaseAdapter> | null = null

/**
 * Initialise et retourne l'adapter approprié
 * Avec timeout pour éviter les blocages
 * Thread-safe: évite les race conditions
 */
export async function getDatabaseAdapter(): Promise<DatabaseAdapter> {
  // Si déjà initialisé, retourner immédiatement
  if (adapter) {
    return adapter
  }

  // Si en cours d'initialisation, attendre la promesse existante
  if (adapterInitializing && adapterInitPromise) {
    return await adapterInitPromise
  }

  // Timeout de 10 secondes pour l'initialisation (augmenté pour Vercel)
  const timeoutPromise = new Promise<DatabaseAdapter>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout initialisation adapter (10s)'))
    }, 10000)
  })

  // Marquer comme en cours d'initialisation
  adapterInitializing = true

  const initPromise = (async (): Promise<DatabaseAdapter> => {
    try {
      const databaseUrl = process.env['DATABASE_URL']
      const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
      const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
      let localAdapter: DatabaseAdapter | null = null
      let localAdapterType: 'sqlite' | 'postgres' | 'supabase' | null = null

      // PRIORITÉ 1: Si Supabase est configuré, utiliser Supabase
      if (supabaseUrl && supabaseKey) {
        try {
          const { SupabaseAdapter } = await import('./supabase-adapter')
          localAdapter = new SupabaseAdapter(supabaseUrl, supabaseKey)
          localAdapterType = 'supabase'
          logger.info('[DB] ✅ Initialisation Supabase...')
          
          // Tester la connexion avec timeout
          const connectionTestPromise = localAdapter.testConnection()
          const connectionTimeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout test connexion Supabase (5s)')), 5000)
          })
          
          const isConnected = await Promise.race([connectionTestPromise, connectionTimeoutPromise]) as boolean
          
          if (!isConnected) {
            logger.error('[DB] ❌ Échec de connexion Supabase, fallback vers PostgreSQL/SQLite')
            localAdapter = null
            localAdapterType = null
          } else {
            logger.info('[DB] ✅ Connexion Supabase réussie')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logger.error('[DB] ❌ Erreur lors de l\'initialisation Supabase:', { 
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          })
          logger.warn('[DB] ⚠️  Fallback vers PostgreSQL/SQLite')
          localAdapter = null
          localAdapterType = null
        }
      }

      // PRIORITÉ 2: Si DATABASE_URL est défini et commence par postgres, utiliser Postgres
      if (!localAdapter && databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
        try {
          const { PostgresAdapter } = await import('./postgres-adapter')
          localAdapter = new PostgresAdapter(databaseUrl)
          localAdapterType = 'postgres'
          logger.info('[DB] ✅ Utilisation de PostgreSQL')
          
          // Tester la connexion
          const isConnected = await localAdapter.testConnection()
          if (!isConnected) {
            logger.error('[DB] ❌ Échec de connexion PostgreSQL, fallback vers SQLite')
            localAdapter = null
            localAdapterType = null
          }
        } catch (error) {
          logger.error('[DB] ❌ Erreur lors de l\'initialisation PostgreSQL:', error)
          logger.warn('[DB] ⚠️  Fallback vers SQLite')
          localAdapter = null
          localAdapterType = null
        }
      }

      // Si pas de Postgres ou échec, utiliser SQLite
      if (!localAdapter) {
        try {
          const { SqliteAdapter } = await import('./sqlite-adapter')
          localAdapter = new SqliteAdapter()
          localAdapterType = 'sqlite'
          logger.info('[DB] ✅ Utilisation de SQLite')
          
          // Tester la connexion
          const isConnected = await localAdapter.testConnection()
          if (!isConnected) {
            // En développement, ne pas logger d'erreur (seulement en mode DEBUG_DB)
            // Le projet fonctionne avec le fallback sql.js
            if (process.env['NODE_ENV'] === 'production') {
              logger.error('[DB] ❌ Échec de connexion SQLite')
              throw new Error('Impossible de se connecter à la base de données')
            } else {
              // Mode développement: logger seulement si DEBUG_DB=1
              if (process.env['DEBUG_DB'] === '1') {
                logger.warn('[DB] ⚠️  Mode développement: connexion SQLite échouée, les fonctions utiliseront le fallback sql.js')
              }
              localAdapter = null
              localAdapterType = null
            }
          }
        } catch (error) {
          // En développement, ne pas logger d'erreur (seulement en mode DEBUG_DB)
          // Le projet fonctionne avec le fallback sql.js
          if (process.env['NODE_ENV'] === 'production') {
            logger.error('[DB] ❌ Erreur lors de l\'initialisation SQLite:', error)
            throw new Error('Impossible d\'initialiser la base de données')
          } else {
            // Mode développement: logger seulement si DEBUG_DB=1
            if (process.env['DEBUG_DB'] === '1') {
              // logger.warn() n'accepte pas error directement, utiliser logger.error() ou convertir en metadata
              if (error instanceof Error) {
                logger.warn('[DB] ⚠️  Mode développement: erreur SQLite, les fonctions utiliseront le fallback sql.js', { error: error.message, stack: error.stack })
              } else {
                logger.warn('[DB] ⚠️  Mode développement: erreur SQLite, les fonctions utiliseront le fallback sql.js', { error: String(error) })
              }
            }
            localAdapter = null
            localAdapterType = null
          }
        }
      }

      // Si toujours pas d'adapter, lancer une erreur seulement en production
      // En développement, permettre aux fonctions appelantes d'utiliser le fallback sql.js
      if (!localAdapter) {
        if (process.env['NODE_ENV'] === 'production') {
          throw new Error('Impossible de se connecter à la base de données')
        }
        // En développement, vérifier si sql.js est disponible avant de lancer l'erreur
        // Silent check - only log in debug mode
        try {
          const { forceConnection } = await import('../sqlite')
          const sqlJsAvailable = forceConnection()
          if (sqlJsAvailable && process.env['DEBUG_DB'] === '1') {
            logger.debug('[DB] sql.js disponible comme fallback')
          }
        } catch {
          // Ignorer les erreurs de vérification sql.js
        }
        // Lancer l'erreur pour que les fonctions appelantes utilisent le fallback
        // Silent warning - only log in debug mode
        if (process.env['DEBUG_DB'] !== '1') {
          // Ne pas logger en mode normal pour éviter les warnings bruyants
        }
        throw new Error('Base de données non disponible (mode développement - utilisez le fallback)')
      }

      // Assigner une seule fois à la fin (thread-safe)
      adapter = localAdapter
      adapterType = localAdapterType
      adapterInitializing = false
      
      return adapter
    } catch (error) {
      adapterInitializing = false
      throw error
    }
  })()

  adapterInitPromise = Promise.race([initPromise, timeoutPromise])

  try {
    return await adapterInitPromise
  } catch (error) {
    // Si timeout ou erreur, lancer l'erreur (les fonctions appelantes géreront avec try-catch)
    adapterInitializing = false
    adapterInitPromise = null
    if (process.env['NODE_ENV'] !== 'production') {
      logger.warn('[DB] ⚠️  Timeout ou erreur initialisation adapter, fallback activé')
    }
    throw error
  }
}

/**
 * Retourne le type d'adapter actuel
 */
export function getAdapterType(): 'sqlite' | 'postgres' | 'supabase' | null {
  return adapterType
}

/**
 * Réinitialise l'adapter (utile pour les tests)
 */
export function resetAdapter(): void {
  adapter = null
  adapterType = null
}

