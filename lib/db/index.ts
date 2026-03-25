/**
 * Point d'entrée pour la couche d'abstraction DB
 * Choisit automatiquement SQLite (dev) ou Postgres (prod) selon DATABASE_URL
 */
import 'server-only'

import { logger } from '../logger'
import { IS_PRODUCTION } from '../env'
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

  // Timeout global d’init : doit rester > timeout test Supabase (15s) + marge Postgres/SQLite
  const timeoutPromise = new Promise<DatabaseAdapter>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout initialisation adapter (25s)'))
    }, 25000)
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
            setTimeout(() => reject(new Error('Timeout test connexion Supabase (15s)')), 15000)
          })

          const isConnected = await Promise.race([
            connectionTestPromise,
            connectionTimeoutPromise,
          ]) as boolean

          if (!isConnected) {
            logger.warn('[DB] Supabase indisponible ou test échoué, fallback PostgreSQL/SQLite')
            localAdapter = null
            localAdapterType = null
          } else {
            logger.info('[DB] ✅ Connexion Supabase réussie')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logger.warn('[DB] Supabase indisponible, fallback PostgreSQL/SQLite', {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
          })
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

      // Si pas de Postgres ou échec, utiliser SQLite UNIQUEMENT en développement
      // En production (Vercel), ne jamais tenter SQLite : pas de fichier .db → ENOENT
      if (!localAdapter && !IS_PRODUCTION) {
        try {
          const { SqliteAdapter } = await import('./sqlite-adapter')
          localAdapter = new SqliteAdapter()
          localAdapterType = 'sqlite'
          logger.info('[DB] ✅ Utilisation de SQLite')
          
          const isConnected = await localAdapter.testConnection()
          if (!isConnected) {
            logger.warn(
              '[DB] Test SQLite échoué, conservation de l’adapter SQLite en dev (fallback sql.js possible)'
            )
            // En dev, garder l’adapter pour éviter un throw inutile ; les appels utiliseront sqlite/sql.js
          }
        } catch (error) {
          if (process.env['DEBUG_DB'] === '1') {
            const err = error instanceof Error ? error : new Error(String(error))
            logger.warn('[DB] ⚠️  Mode développement: erreur SQLite, fallback sql.js', { error: err.message })
          }
          localAdapter = null
          localAdapterType = null
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
        logger.warn(
          '[DB] Aucun adapter distant (Supabase/Postgres) ; en dev, les appels utiliseront le fallback SQLite/sql.js'
        )
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
    if (!IS_PRODUCTION) {
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

