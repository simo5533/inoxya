/**
 * Singleton pour sql.js - Garantit une initialisation unique et asynchrone
 * Élimine tous les warnings "sql.js nécessite une initialisation asynchrone"
 */

import * as fs from 'fs'
import * as path from 'path'
import { logger } from './logger'

// Chemin DB résolu une seule fois
const DB_PATH = process.env['SQLITE_DB_PATH'] 
  ? (path.isAbsolute(process.env['SQLITE_DB_PATH']) 
      ? process.env['SQLITE_DB_PATH'] 
      : path.resolve(process.cwd(), process.env['SQLITE_DB_PATH']))
  : path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')

/** Minimal type for sql.js Database instance (exec return shape used in this file) */
interface SqlJsDatabaseInstance {
  exec(sql: string): { values?: unknown[][] }[]
}

interface SqlJsDb {
  db: SqlJsDatabaseInstance
  init: unknown
  lastModified: number
}

let initPromise: Promise<SqlJsDb> | null = null
let cachedDb: SqlJsDb | null = null

/**
 * Obtenir l'instance sql.js DB (singleton asynchrone)
 * Garantit une seule initialisation, même en cas d'appels concurrents
 */
export async function getSqlJsDb(): Promise<SqlJsDb> {
  if (process.env['VERCEL'] === '1') {
    throw new Error('SQLite file not available on Vercel')
  }
  if (cachedDb) {
    try {
      const absDbPath = path.resolve(DB_PATH)
      if (fs.existsSync(absDbPath)) {
        const dbStats = fs.statSync(absDbPath)
        if (dbStats.mtimeMs === cachedDb.lastModified) {
          return cachedDb
        }
        // Fichier modifié, recharger
        logger.info('[getSqlJsDb] Fichier DB modifié, rechargement...')
        cachedDb = null
      }
    } catch {
      // Ignorer les erreurs de stat
    }
  }

  // Si une initialisation est en cours, attendre
  if (initPromise) {
    return await initPromise
  }

  // Créer une nouvelle promesse d'initialisation
  initPromise = (async (): Promise<SqlJsDb> => {
    try {
      const absDbPath = path.resolve(DB_PATH)
      
      if (!fs.existsSync(absDbPath)) {
        throw new Error(`Fichier DB non trouvé: ${absDbPath}`)
      }

      // Utiliser import dynamique au lieu de require pour compatibilité Next.js/Webpack
      let sqlJs: unknown
      try {
        sqlJs = await import('sql.js')
      } catch (importError) {
        const importErr = importError instanceof Error ? importError : new Error(String(importError))
        throw new Error(`Erreur lors de l'import de sql.js: ${importErr.message}`)
      }
      
      const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
      
      if (!fs.existsSync(wasmPath)) {
        throw new Error(`Fichier WASM non trouvé: ${wasmPath}`)
      }

      let sqlJsModule: { Database: new (data?: ArrayBuffer | Uint8Array) => unknown } | null = null

      try {
        // sql.js peut être exporté de différentes façons selon la version
        const js = sqlJs as { default?: unknown; initSqlJs?: unknown; Database?: unknown }
        const initSqlJs = js.default || js.initSqlJs || sqlJs
        
        if (typeof initSqlJs === 'function') {
          sqlJsModule = await (initSqlJs as (opts: { locateFile: (file: string) => string }) => Promise<{ Database: new (data?: ArrayBuffer | Uint8Array) => unknown }>)({
            locateFile: (file: string) => {
              if (file.endsWith('.wasm')) {
                return wasmPath
              }
              return file
            }
          })
        } else if (js.Database) {
          sqlJsModule = js as { Database: new (data?: ArrayBuffer | Uint8Array) => unknown }
        } else if (js.default && (js.default as { Database?: unknown }).Database) {
          sqlJsModule = js.default as { Database: new (data?: ArrayBuffer | Uint8Array) => unknown }
        } else {
          const availableKeys = Object.keys(js as object).join(', ')
          throw new Error(`Format sql.js non reconnu. Clés disponibles: ${availableKeys || 'aucune'}`)
        }
      } catch (initError) {
        const initErr = initError instanceof Error ? initError : new Error(String(initError))
        throw new Error(`Erreur lors de l'initialisation sql.js: ${initErr.message}. WASM path: ${wasmPath}`)
      }

      if (!sqlJsModule || !sqlJsModule.Database) {
        throw new Error('sql.js module chargé mais Database non disponible')
      }

      const fileBuffer = fs.readFileSync(absDbPath)
      
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error(`Fichier DB vide ou corrompu: ${absDbPath}`)
      }
      
      let db: SqlJsDatabaseInstance
      try {
        db = new sqlJsModule.Database(fileBuffer) as SqlJsDatabaseInstance
      } catch (dbError) {
        const dbErr = dbError instanceof Error ? dbError : new Error(String(dbError))
        throw new Error(`Erreur lors de la création de la base de données sql.js: ${dbErr.message}`)
      }
      
      const dbStats = fs.statSync(absDbPath)

      const result: SqlJsDb = {
        db,
        init: sqlJsModule,
        lastModified: dbStats.mtimeMs
      }

      logger.info(`[getSqlJsDb] ✅ sql.js initialisé (DB: ${absDbPath}, ${(dbStats.size / 1024).toFixed(2)} KB)`)
      
      cachedDb = result
      return result
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      logger.error(`[getSqlJsDb] ❌ Erreur d'initialisation:`, error, {
        message: error.message,
        stack: error.stack,
        dbPath: DB_PATH
      })
      throw error
    } finally {
      initPromise = null
    }
  })()

  return await initPromise
}

/**
 * Vérifier que la DB est accessible et retourner des infos
 */
export async function verifyDb(): Promise<{
  exists: boolean
  sizeBytes: number
  tables: string[]
  productsCount: number
  packsCount: number
  error?: string
}> {
  const result = {
    exists: false,
    sizeBytes: 0,
    tables: [] as string[],
    productsCount: 0,
    packsCount: 0,
    error: undefined as string | undefined
  }

  try {
    const absDbPath = path.resolve(DB_PATH)
    result.exists = fs.existsSync(absDbPath)
    
    if (!result.exists) {
      result.error = `Fichier DB non trouvé: ${absDbPath}`
      return result
    }

    const stats = fs.statSync(absDbPath)
    result.sizeBytes = stats.size

    const sqlJsDb = await getSqlJsDb()
    
    // Lister les tables
    const tablesResult = sqlJsDb.db.exec(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    
    const firstTableRow = tablesResult[0]?.values
    if (firstTableRow) {
      result.tables = firstTableRow.map((row: unknown[]) => row[0] as string)
    }

    // Compter les produits
    try {
      const productsResult = sqlJsDb.db.exec('SELECT COUNT(*) as count FROM products WHERE (is_active = 1 OR is_active IS NULL)')
      const countVal = productsResult[0]?.values?.[0]?.[0]
      if (countVal !== undefined) result.productsCount = countVal as number
    } catch {
      // Table products n'existe pas ou erreur
    }

    // Compter les packs
    try {
      const packsResult = sqlJsDb.db.exec('SELECT COUNT(*) as count FROM packs')
      const packCountVal = packsResult[0]?.values?.[0]?.[0]
      if (packCountVal !== undefined) result.packsCount = packCountVal as number
    } catch {
      // Table packs n'existe pas ou erreur
    }

  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e)
  }

  return result
}

export { DB_PATH }

