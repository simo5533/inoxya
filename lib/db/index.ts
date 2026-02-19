/**
 * Point d'entrée pour la couche d'abstraction DB
 * Choisit automatiquement SQLite (dev) ou Postgres (prod) selon DATABASE_URL
 */

import { logger } from '../logger'
import type { DatabaseAdapter } from './adapter'

let adapter: DatabaseAdapter | null = null
let adapterType: 'sqlite' | 'postgres' | null = null
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

  // Timeout de 2 secondes pour l'initialisation
  const timeoutPromise = new Promise<DatabaseAdapter>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout initialisation adapter (2s)'))
    }, 2000)
  })

  // Marquer comme en cours d'initialisation
  adapterInitializing = true

  const initPromise = (async (): Promise<DatabaseAdapter> => {
    try {
      const databaseUrl = process.env['DATABASE_URL']
      let localAdapter: DatabaseAdapter | null = null
      let localAdapterType: 'sqlite' | 'postgres' | null = null

      // Si DATABASE_URL est défini et commence par postgres, utiliser Postgres
      if (databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
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
            logger.error('[DB] ❌ Échec de connexion SQLite')
            // En développement, ne pas lancer d'erreur mais logger un avertissement
            // Les fonctions appelantes géreront le fallback
            if (process.env['NODE_ENV'] === 'production') {
              throw new Error('Impossible de se connecter à la base de données')
            } else {
              logger.warn('[DB] ⚠️  Mode développement: connexion SQLite échouée, les fonctions utiliseront le fallback')
              localAdapter = null
              localAdapterType = null
            }
          }
        } catch (error) {
          logger.error('[DB] ❌ Erreur lors de l\'initialisation SQLite:', error)
          // En développement, permettre le fallback
          if (process.env['NODE_ENV'] === 'production') {
            throw new Error('Impossible d\'initialiser la base de données')
          } else {
            logger.warn('[DB] ⚠️  Mode développement: erreur SQLite, les fonctions utiliseront le fallback')
            localAdapter = null
            localAdapterType = null
          }
        }
      }

      // Si toujours pas d'adapter, lancer une erreur seulement en production
      // En développement, permettre aux fonctions appelantes d'utiliser le fallback
      if (!localAdapter) {
        if (process.env['NODE_ENV'] === 'production') {
          throw new Error('Impossible de se connecter à la base de données')
        }
        // En développement, lancer quand même une erreur mais avec un message plus clair
        // Les fonctions appelantes doivent gérer cette erreur avec un try-catch
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
export function getAdapterType(): 'sqlite' | 'postgres' | null {
  return adapterType
}

/**
 * Réinitialise l'adapter (utile pour les tests)
 */
export function resetAdapter(): void {
  adapter = null
  adapterType = null
}

