/**
 * Point d'entrée pour la couche d'abstraction DB
 * Choisit automatiquement SQLite (dev) ou Postgres (prod) selon DATABASE_URL
 */

import { logger } from '../logger'
import type { DatabaseAdapter } from './adapter'

let adapter: DatabaseAdapter | null = null
let adapterType: 'sqlite' | 'postgres' | null = null

/**
 * Initialise et retourne l'adapter approprié
 */
export async function getDatabaseAdapter(): Promise<DatabaseAdapter> {
  if (adapter) {
    return adapter
  }

  const databaseUrl = process.env['DATABASE_URL']

  // Si DATABASE_URL est défini et commence par postgres, utiliser Postgres
  if (databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
    try {
      const { PostgresAdapter } = await import('./postgres-adapter')
      adapter = new PostgresAdapter(databaseUrl)
      adapterType = 'postgres'
      logger.info('[DB] ✅ Utilisation de PostgreSQL')
      
      // Tester la connexion
      const isConnected = await adapter.testConnection()
      if (!isConnected) {
        logger.error('[DB] ❌ Échec de connexion PostgreSQL, fallback vers SQLite')
        adapter = null
        adapterType = null
      }
    } catch (error) {
      logger.error('[DB] ❌ Erreur lors de l\'initialisation PostgreSQL:', error)
      logger.warn('[DB] ⚠️  Fallback vers SQLite')
      adapter = null
      adapterType = null
    }
  }

  // Si pas de Postgres ou échec, utiliser SQLite
  if (!adapter) {
    try {
      const { SqliteAdapter } = await import('./sqlite-adapter')
      adapter = new SqliteAdapter()
      adapterType = 'sqlite'
      logger.info('[DB] ✅ Utilisation de SQLite')
      
      // Tester la connexion
      const isConnected = await adapter.testConnection()
      if (!isConnected) {
        logger.error('[DB] ❌ Échec de connexion SQLite')
        // En développement, ne pas lancer d'erreur mais logger un avertissement
        // Les fonctions appelantes géreront le fallback
        if (process.env['NODE_ENV'] === 'production') {
          throw new Error('Impossible de se connecter à la base de données')
        } else {
          logger.warn('[DB] ⚠️  Mode développement: connexion SQLite échouée, les fonctions utiliseront le fallback')
          // Retourner null pour permettre aux fonctions appelantes de gérer le fallback
          adapter = null
          adapterType = null
        }
      }
    } catch (error) {
      logger.error('[DB] ❌ Erreur lors de l\'initialisation SQLite:', error)
      // En développement, permettre le fallback
      if (process.env['NODE_ENV'] === 'production') {
        throw new Error('Impossible d\'initialiser la base de données')
      } else {
        logger.warn('[DB] ⚠️  Mode développement: erreur SQLite, les fonctions utiliseront le fallback')
        adapter = null
        adapterType = null
      }
    }
  }

  // Si toujours pas d'adapter, lancer une erreur seulement en production
  // En développement, permettre aux fonctions appelantes d'utiliser le fallback
  if (!adapter) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('Impossible de se connecter à la base de données')
    }
    // En développement, lancer quand même une erreur mais avec un message plus clair
    // Les fonctions appelantes doivent gérer cette erreur avec un try-catch
    throw new Error('Base de données non disponible (mode développement - utilisez le fallback)')
  }

  return adapter
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

