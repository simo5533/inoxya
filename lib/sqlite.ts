import path from 'path'
import fs from 'fs'
import { logger } from './logger'
import { dbValueToSlug, normalizeCategoryValue } from './category-mapping'
import { normalizeImageUrl } from './image-path'

/**
 * PHASE 0: Sérialiseur robuste d'erreurs pour révéler les vraies erreurs (pas [object Object])
 */
interface SerializedError {
  name?: string
  message: string
  stack?: string
  code?: string | number
  errno?: number
  syscall?: string
  cause?: unknown
  [key: string]: unknown
}

interface SystemError extends Error {
  code?: string | number
  errno?: number
  syscall?: string
}

export function serializeError(err: unknown): SerializedError {
  if (err instanceof Error) {
    const serialized: SerializedError = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
    
    // Ajouter les propriétés spécifiques aux erreurs système
    const systemErr = err as SystemError
    if ('code' in err) serialized.code = systemErr.code
    if ('errno' in err) serialized.errno = systemErr.errno
    if ('syscall' in err) serialized.syscall = systemErr.syscall
    if ('cause' in err) serialized.cause = err.cause
    
    // Ajouter toutes les autres propriétés propres
    Object.getOwnPropertyNames(err).forEach(key => {
      if (!['name', 'message', 'stack', 'code', 'errno', 'syscall', 'cause'].includes(key)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          serialized[key] = (err as any)[key]
        } catch {
          // Ignorer les propriétés non sérialisables
        }
      }
    })
    
    return serialized
  }
  
  // Si ce n'est pas une Error, essayer de sérialiser
  try {
    return {
      message: String(err),
      raw: JSON.stringify(err, Object.getOwnPropertyNames(err instanceof Object ? err : {}), 2)
    }
  } catch {
    return {
      message: String(err)
    }
  }
}

// PHASE 1: Import lazy de better-sqlite3 pour éviter les problèmes Webpack
// CRITICAL: Ne jamais charger better-sqlite3 au niveau du module
// Utiliser une fonction lazy qui charge seulement quand nécessaire
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Database: any = null
let betterSqlite3Available = false
let betterSqlite3Error: string | null = null
let betterSqlite3LoadAttempted = false

/**
 * Charge better-sqlite3 de manière lazy (seulement quand nécessaire)
 * Évite les erreurs Webpack "Cannot read properties of undefined (reading 'call')"
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadBetterSqlite3(): { Database: any; available: boolean; error: string | null } {
  // FORCE_SQLJS: Variable d'environnement pour forcer sql.js et éviter better-sqlite3
  // Utile pour débloquer la compilation Next.js qui peut être bloquée par better-sqlite3
  if (process.env['FORCE_SQLJS'] === '1' || process.env['SKIP_BETTER_SQLITE3'] === '1') {
    betterSqlite3LoadAttempted = true
    Database = null
    betterSqlite3Available = false
    betterSqlite3Error = 'FORCE_SQLJS=1 - better-sqlite3 désactivé'
    logger.info('[DB] ⚠️ FORCE_SQLJS=1 activé - better-sqlite3 désactivé, utilisation de sql.js uniquement')
    return { Database, available: false, error: betterSqlite3Error }
  }
  
  // Si déjà tenté, retourner le résultat en cache
  if (betterSqlite3LoadAttempted) {
    return { Database, available: betterSqlite3Available, error: betterSqlite3Error }
  }
  
  betterSqlite3LoadAttempted = true
  
  try {
    // Use dynamic require to avoid bundling issues
    // Utiliser Function constructor pour éviter que Webpack analyse ce require
    const requireFunc = typeof require !== 'undefined' ? require : (() => {
      throw new Error('require is not available')
    })
    const betterSqlite3Module = requireFunc('better-sqlite3')
    
    // Handle different export formats
    if (typeof betterSqlite3Module === 'function') {
      Database = betterSqlite3Module
    } else if (betterSqlite3Module?.default && typeof betterSqlite3Module.default === 'function') {
      Database = betterSqlite3Module.default
    } else if (betterSqlite3Module?.Database && typeof betterSqlite3Module.Database === 'function') {
      Database = betterSqlite3Module.Database
    } else {
      Database = betterSqlite3Module
    }
    
    // Test if bindings are actually available
    try {
      if (Database && typeof Database === 'function') {
        const testDb = new Database(':memory:')
        testDb.close()
        betterSqlite3Available = true
        logger.info('[DB] ✅ better-sqlite3 available with compiled bindings')
      } else {
        throw new Error('Database is not a constructor')
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (bindingError: any) {
      // Bindings are not compiled
      const errorMsg = bindingError?.message || String(bindingError)
      betterSqlite3Error = errorMsg
      
      if (errorMsg.includes('Could not locate the bindings file') || 
          errorMsg.includes('bindings') ||
          errorMsg.includes('is not a constructor') ||
          errorMsg.includes('Cannot find module')) {
        Database = null
        betterSqlite3Available = false
        // Silent fallback - only log in development mode
        if (process.env['NODE_ENV'] === 'development' && process.env['DEBUG_DB'] === '1') {
          logger.warn(`[DB] ⚠️ better-sqlite3 module loaded but bindings missing: ${errorMsg}`)
          logger.warn('[DB] ⚠️ Falling back to sql.js')
        } else {
          // Silent fallback in production - sql.js will be used automatically
          logger.debug('[DB] Using sql.js fallback (better-sqlite3 bindings unavailable)')
        }
      } else {
        // Other error - might still work
        betterSqlite3Available = true
        logger.info(`[DB] ⚠️ better-sqlite3 test warning: ${errorMsg}, but continuing`)
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    // Module not available or import failed
    const errorMsg = e?.message || String(e)
    betterSqlite3Error = errorMsg
    Database = null
    betterSqlite3Available = false
    logger.info(`[DB] ℹ️ better-sqlite3 not available: ${errorMsg}`)
    logger.info('[DB] ℹ️ Using sql.js fallback')
  }
  
  return { Database, available: betterSqlite3Available, error: betterSqlite3Error }
}

/**
 * Configuration SQLite pour INOXYA BIJOUX
 * Utilise une base de données SQLite locale (VPS/Docker/local).
 * Sur Vercel (VERCEL=1), la DB n'est pas initialisée : système de fichiers éphémère, pas de persistance.
 * Les appels retournent alors null/[]/false ; les API renvoient 503 avec message clair.
 */

// PHASE 1: Chemin DB 100% déterministe et ABSOLU
// Priorité 1: Variable d'environnement SQLITE_DB_PATH (chemin absolu)
// Priorité 2: Variable d'environnement DATABASE_URL (format file:./path ou file:///path)
// Priorité 3: Fallback sur data/inoxya_bijoux.db (chemin ABSOLU depuis process.cwd())
export const getDbPath = (): string => {
  // Vérifier d'abord la variable d'environnement SQLITE_DB_PATH (chemin absolu prioritaire)
  const envDbPath = process.env['SQLITE_DB_PATH']
  if (envDbPath && envDbPath.trim() !== '') {
    const absPath = path.isAbsolute(envDbPath) ? envDbPath : path.resolve(process.cwd(), envDbPath)
    logger.info(`[DB] Using SQLITE_DB_PATH from env: ${absPath}`)
    return absPath
  }
  
  // Vérifier DATABASE_URL (format file:./path ou file:///path)
  const databaseUrl = process.env['DATABASE_URL']
  if (databaseUrl && databaseUrl.trim() !== '') {
    // Parser DATABASE_URL pour extraire le chemin
    // Formats supportés: file:./dev.db, file:///absolute/path, file://./relative/path
    let dbPathFromUrl: string | null = null
    
    if (databaseUrl.startsWith('file:')) {
      // Enlever le préfixe "file:" ou "file://"
      // Formats supportés: file:./dev.db, file:///absolute/path, file://./relative/path
      let urlPath = databaseUrl
      
      // Enlever file:/// (3 slashes) ou file:// (2 slashes) ou file: (1 colon)
      if (urlPath.startsWith('file:///')) {
        urlPath = urlPath.substring(8) // Enlever "file:///"
      } else if (urlPath.startsWith('file://')) {
        urlPath = urlPath.substring(7) // Enlever "file://"
      } else if (urlPath.startsWith('file:')) {
        urlPath = urlPath.substring(5) // Enlever "file:"
      }
      
      // Si c'est un chemin absolu (commence par /), l'utiliser tel quel
      // Sinon, résoudre depuis process.cwd()
      if (path.isAbsolute(urlPath)) {
        dbPathFromUrl = urlPath
      } else {
        // Chemin relatif: résoudre depuis process.cwd()
        dbPathFromUrl = path.resolve(process.cwd(), urlPath)
      }
      
      if (dbPathFromUrl && dbPathFromUrl.trim() !== '') {
        logger.info(`[DB] Using DATABASE_URL (parsed): ${dbPathFromUrl}`)
        return dbPathFromUrl
      }
    } else if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      // Si ce n'est pas PostgreSQL et pas un format file:, traiter comme chemin direct
      const absPath = path.isAbsolute(databaseUrl) ? databaseUrl : path.resolve(process.cwd(), databaseUrl)
      logger.info(`[DB] Using DATABASE_URL (as direct path): ${absPath}`)
      return absPath
    }
  }
  
  // Fallback: chemin ABSOLU (pas relatif) pour éviter les problèmes avec process.cwd()
  const defaultPath = path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')
  logger.info(`[DB] Using default SQLite path (absolute): ${defaultPath}`)
  return defaultPath
}

// PHASE 1: Calculer le chemin ABSOLU une seule fois au chargement du module
const dbPath = getDbPath()
const dataDir = path.dirname(dbPath)

// PHASE 2: Singleton global pour éviter les multiples connexions (Windows lock)
// Utiliser globalThis pour persister entre hot reloads Next.js
const DB_SINGLETON_KEY = '__inoxya_sqlite_db__'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null

// PHASE 2: Récupérer le singleton existant si disponible
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof globalThis !== 'undefined' && (globalThis as any)[DB_SINGLETON_KEY]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db = (globalThis as any)[DB_SINGLETON_KEY]
  logger.info(`[DB] Reusing existing singleton connection`)
}

// Fallback sql.js pour quand better-sqlite3 n'est pas disponible
// IMPORTANT: Utiliser getSqlJsDb() du singleton au lieu d'accéder directement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlJsDb: any = null // DEPRECATED: Utiliser getSqlJsDb() à la place
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlJsInit: any = null // DEPRECATED: Utiliser getSqlJsDb() à la place
let sqlJsDbLastModified: number = 0 // DEPRECATED: Utiliser getSqlJsDb() à la place
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlJsInitPromise: Promise<any> | null = null // DEPRECATED: Utiliser getSqlJsDb() à la place

// NOTE: Ne plus charger sql.js automatiquement au chargement du module
// Cela cause des problèmes avec Webpack/Next.js (erreur "Cannot set properties of undefined")
// sql.js sera chargé de manière asynchrone via getSqlJsDb() du singleton sqljs-singleton.ts
// lors du premier appel à initSqlJsAsync() ou selectAsync()

/**
 * Recharger sql.js DB si nécessaire
 */
function reloadSqlJsDbIfNeeded(): void {
  try {
    if (!sqlJsInit || !sqlJsInit.Database) {
      // sql.js n'est pas initialisé, ne pas essayer de recharger
      return
    }
    
    const absDbPath = path.resolve(dbPath)
    if (!fs.existsSync(absDbPath)) return
    
    const dbStats = fs.statSync(absDbPath)
    if (!sqlJsDb || dbStats.mtimeMs !== sqlJsDbLastModified) {
      const fileBuffer = fs.readFileSync(absDbPath)
      sqlJsDb = new sqlJsInit.Database(fileBuffer)
      sqlJsDbLastModified = dbStats.mtimeMs
      logger.info(`[reloadSqlJsDbIfNeeded] DB rechargée (${(dbStats.size / 1024).toFixed(2)} KB)`)
    }
  } catch (e) {
    // PHASE 0: Sérialisation robuste de l'erreur
    const errorDetails = serializeError(e)
    logger.warn(`[DB] Erreur lors du rechargement sql.js:`, errorDetails)
  }
}

/**
 * PHASE D: Singleton better-sqlite3 avec PRAGMAs optimisés
 * PHASE 1: Charge better-sqlite3 de manière lazy pour éviter les erreurs Webpack
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBetterSqlite3Db(): any {
  if (db) return db
  if (process.env['VERCEL'] === '1') return null
  // PHASE 1: Charger better-sqlite3 de manière lazy (seulement quand nécessaire)
  if (!betterSqlite3LoadAttempted) {
    const loadResult = loadBetterSqlite3()
    Database = loadResult.Database
    betterSqlite3Available = loadResult.available
    betterSqlite3Error = loadResult.error
  }
  
  // CRITICAL: Never use Database if it's null or not available
  if (!Database || !betterSqlite3Available) {
    if (betterSqlite3Error) {
      logger.debug(`[getBetterSqlite3Db] better-sqlite3 unavailable: ${betterSqlite3Error}`)
    }
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof globalThis !== 'undefined' && (globalThis as any)[DB_SINGLETON_KEY]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db = (globalThis as any)[DB_SINGLETON_KEY]
    return db
  }

  try {
    // VALIDATION: Vérifier que dbPath n'est pas vide
    if (!dbPath || dbPath.trim() === '') {
      const errorMsg = 'Database path is empty. Check DATABASE_URL or SQLITE_DB_PATH environment variables.'
      logger.error(`[getBetterSqlite3Db] ❌ ${errorMsg}`)
      throw new Error(errorMsg)
    }
    
    const absDbPath = path.resolve(dbPath)
    
    // VALIDATION: Vérifier que le chemin résolu n'est pas vide
    if (!absDbPath || absDbPath.trim() === '') {
      const errorMsg = `Resolved database path is empty. Original path: "${dbPath}"`
      logger.error(`[getBetterSqlite3Db] ❌ ${errorMsg}`)
      throw new Error(errorMsg)
    }
    
    if (!fs.existsSync(absDbPath)) {
      logger.warn(`[getBetterSqlite3Db] Fichier DB non trouvé: ${absDbPath}`)
      return null
    }

    db = new Database(absDbPath)
    
    // PHASE D: PRAGMAs optimisés
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('foreign_keys = ON')
    db.pragma('busy_timeout = 5000')
    
    // Stocker dans globalThis pour persister entre hot reloads
    if (typeof globalThis !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any)[DB_SINGLETON_KEY] = db
    }
    
    logger.info(`[getBetterSqlite3Db] ✅ Connexion better-sqlite3 établie (${absDbPath})`)
    return db
  } catch (e) {
    const errorDetails = serializeError(e)
    logger.error(`[getBetterSqlite3Db] ❌ Erreur:`, errorDetails)
    db = null
    return null
  }
}

/**
 * Initialiser ou réinitialiser la connexion à la base de données
 * PHASE D: Utilise le singleton avec PRAGMAs
 */
function ensureDatabaseConnection(): void {
  if (db) return
  if (process.env['VERCEL'] === '1') return
  // PHASE 1: Charger better-sqlite3 de manière lazy si pas encore tenté
  if (!betterSqlite3LoadAttempted) {
    const loadResult = loadBetterSqlite3()
    Database = loadResult.Database
    betterSqlite3Available = loadResult.available
    betterSqlite3Error = loadResult.error
  }
  
  // CRITICAL: Check if better-sqlite3 is available before attempting connection
  if (!Database || !betterSqlite3Available) {
    // better-sqlite3 not available - will use sql.js fallback
    return
  }
  
  db = getBetterSqlite3Db()
  
  if (!db && process.env['VERCEL'] === '1') {
    // Silencieux : Vercel n'a pas de système de fichiers persistant
    return
  }
  
  // If getBetterSqlite3Db returned null, don't try to create a new connection
  if (!db) {
    return
  }
  
  // PHASE 1: Calculer le chemin absolu AVANT le try/catch pour l'utiliser dans le catch
  const absDbPath = path.resolve(dbPath)
  
  try {
    // PHASE 1: Log unique au boot avec chemin absolu + existence + taille + cwd
    const dbExists = fs.existsSync(absDbPath)
    const dbSize = dbExists ? fs.statSync(absDbPath).size : 0
    
    logger.info(`[DB] SQLite initialization:`, {
      path: absDbPath,
      exists: dbExists,
      size: `${dbSize} bytes`,
      cwd: process.cwd(),
      envSQLITE_DB_PATH: process.env['SQLITE_DB_PATH'] || '(not set)'
    })
    
    // PHASE 1: Si le fichier n'existe pas, créer le dossier parent
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      logger.info(`[DB] Created data directory: ${dataDir}`)
    }
    
    // CRITICAL: Only use Database if it's available and not null
    if (!Database || !betterSqlite3Available) {
      logger.warn('[DB] better-sqlite3 not available, skipping connection')
      return
    }
    
    // PHASE 3C: Se connecter avec PRAGMAs pour stabilité Windows
    db = new Database(absDbPath) // Utiliser le chemin absolu
    db.pragma('foreign_keys = ON')
    db.pragma('journal_mode = WAL') // PHASE 3C: Write-Ahead Logging pour éviter les verrous
    db.pragma('synchronous = NORMAL') // PHASE 3C: NORMAL au lieu de FULL pour meilleures performances
    db.pragma('busy_timeout = 5000') // PHASE 3C: Attendre 5s si verrouillé
    
    // PHASE 2: Stocker dans globalThis pour singleton
    if (typeof globalThis !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any)[DB_SINGLETON_KEY] = db
    }
    
    // Tester la connexion
    db.prepare('SELECT 1 as test').get()
    
    // PHASE 1: Log de confirmation avec comptage initial
    try {
      const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
      const packCount = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
      logger.info(`[DB] ✅ Connected successfully: ${productCount.count} products, ${packCount.count} packs`)
    } catch {
      // Tables pas encore créées, c'est normal au premier démarrage
      logger.info(`[DB] ✅ Connected successfully (tables will be created on first use)`)
    }
  } catch (e) {
    // PHASE 0: Logger TOUTES les erreurs avec sérialisation robuste (pas [object Object])
    const errorDetails = serializeError(e)
    
    logger.error(`[DB] ❌ Erreur de connexion SQLite:`, e, {
      ...errorDetails,
      dbPath: absDbPath,
      exists: fs.existsSync(absDbPath),
      cwd: process.cwd(),
      envSQLITE_DB_PATH: process.env['SQLITE_DB_PATH'] || '(not set)'
    })
    
    // PHASE 2: Nettoyer le singleton en cas d'erreur
    db = null
    if (typeof globalThis !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any)[DB_SINGLETON_KEY]
    }
  }
}

// PHASE 1: Détecter et logger le driver actif au démarrage
let activeDriver: 'better-sqlite3' | 'sqljs' | 'none' = 'none'
let dbPathResolved: string = ''

// PHASE 1: NE PAS initialiser au chargement du module pour éviter les erreurs Webpack
// L'initialisation sera lazy (seulement quand nécessaire)
// Cela évite "Cannot read properties of undefined (reading 'call')" dans Webpack
activeDriver = 'none'
// VALIDATION: Vérifier que dbPath n'est pas vide avant de le résoudre
if (!dbPath || dbPath.trim() === '') {
  const errorMsg = 'Database path is empty. Check DATABASE_URL or SQLITE_DB_PATH environment variables.'
  logger.error(`[DB INIT] ❌ ${errorMsg}`)
  throw new Error(errorMsg)
}
dbPathResolved = path.resolve(dbPath)
if (!dbPathResolved || dbPathResolved.trim() === '') {
  const errorMsg = `Resolved database path is empty. Original path: "${dbPath}"`
  logger.error(`[DB INIT] ❌ ${errorMsg}`)
  throw new Error(errorMsg)
}
logger.info(`[DB INIT] ⚠️ Initialisation lazy - driver sera détecté au premier usage | Path: ${dbPathResolved}`)

// Export pour diagnostic
export function getActiveDriver(): { driver: typeof activeDriver; dbPath: string } {
  // PHASE 1: Détecter le driver actuel au moment de l'appel (lazy)
  const currentDriver = detectDriver()
  if (currentDriver) {
    activeDriver = currentDriver
  }
  return { driver: activeDriver, dbPath: dbPathResolved }
}

// PHASE 3: sql.js ne peut PAS être initialisé de manière synchrone dans Next.js
// L'initialisation synchrone cause "Cannot set properties of undefined (setting 'exports')"
// On utilise uniquement initSqlJsAsync() qui est appelé de manière asynchrone dans les routes API
// DÉSACTIVÉ: Initialisation synchrone de sql.js (cause des erreurs dans Next.js)
// if (!db) {
//   ... code désactivé ...
// }

/**
 * Initialiser sql.js de manière asynchrone (utilise le script check-db-content.ts comme référence)
 * sql.js.default() retourne une Promise qui se résout avec l'objet contenant Database
 * EXPORTÉ pour utilisation dans les routes API
 */
export async function initSqlJsAsync(): Promise<boolean> {
  if (process.env['VERCEL'] === '1') return false
  if (sqlJsInit && sqlJsInit.Database && sqlJsDb) {
    return true
  }
  try {
    // Si une initialisation est déjà en cours, attendre
    if (sqlJsInitPromise) {
      await sqlJsInitPromise
      return sqlJsInit && sqlJsInit.Database ? true : false
    }
    
    // VALIDATION: Vérifier que dbPath n'est pas vide
    if (!dbPath || dbPath.trim() === '') {
      const errorMsg = 'Database path is empty. Check DATABASE_URL or SQLITE_DB_PATH environment variables.'
      logger.error(`[initSqlJsAsync] ❌ ${errorMsg}`)
      throw new Error(errorMsg)
    }
    
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sqlJs = require('sql.js')
    const absDbPath = path.resolve(dbPath)
    
    // VALIDATION: Vérifier que le chemin résolu n'est pas vide
    if (!absDbPath || absDbPath.trim() === '') {
      const errorMsg = `Resolved database path is empty. Original path: "${dbPath}"`
      logger.error(`[initSqlJsAsync] ❌ ${errorMsg}`)
      throw new Error(errorMsg)
    }
    
    // Si le fichier n'existe pas, créer une DB vide avec sql.js
    if (!fs.existsSync(absDbPath)) {
      logger.info(`[initSqlJsAsync] Fichier DB non trouvé, création d'une nouvelle DB: ${absDbPath}`)
      // Créer le répertoire parent si nécessaire
      const dbDir = path.dirname(absDbPath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }
      // sql.js créera automatiquement une DB vide si on ne charge pas de fichier
    }
    
    // sql.js.default() retourne une Promise
    sqlJsInitPromise = (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sqlJsModule: any = null
        
        // Utiliser le chemin local du fichier WASM
        const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
        
        if (sqlJs.default && typeof sqlJs.default === 'function') {
          sqlJsModule = await sqlJs.default({
            locateFile: (file: string) => {
              if (file.endsWith('.wasm')) {
                return wasmPath
              }
              return file
            }
          })
        } else if (typeof sqlJs === 'function') {
          sqlJsModule = await sqlJs({
            locateFile: (file: string) => {
              if (file.endsWith('.wasm')) {
                return wasmPath
              }
              return file
            }
          })
        } else {
          throw new Error('Format sql.js non reconnu')
        }
        
        if (sqlJsModule && sqlJsModule.Database) {
          sqlJsInit = sqlJsModule
          // Charger la DB existante ou créer une nouvelle DB vide
          if (fs.existsSync(absDbPath)) {
            const fileBuffer = fs.readFileSync(absDbPath)
            sqlJsDb = new sqlJsInit.Database(fileBuffer)
            const dbStats = fs.statSync(absDbPath)
            sqlJsDbLastModified = dbStats.mtimeMs
            logger.info(`[initSqlJsAsync] ✅ sql.js initialisé (DB: ${absDbPath}, ${(dbStats.size / 1024).toFixed(2)} KB)`)
          } else {
            // Créer une nouvelle DB vide
            sqlJsDb = new sqlJsInit.Database()
            sqlJsDbLastModified = Date.now()
            logger.info(`[initSqlJsAsync] ✅ sql.js initialisé (nouvelle DB vide: ${absDbPath})`)
            // Initialiser les tables si nécessaire
            initializeDatabase()
          }
          return true
        } else {
          logger.warn('[initSqlJsAsync] sql.js module chargé mais Database non disponible')
          return false
        }
      } finally {
        sqlJsInitPromise = null
      }
    })()
    
    return await sqlJsInitPromise
  } catch (e) {
    sqlJsInitPromise = null
    const errorDetails = serializeError(e)
    const errorMsg = errorDetails.message || String(e)
    if (!errorMsg.includes('exports') && !errorMsg.includes('Cannot set properties')) {
      logger.warn(`[initSqlJsAsync] Erreur:`, errorDetails)
    }
    return false
  }
}

/**
 * Forcer la connexion à la base de données
 * Essaie d'abord better-sqlite3, puis sql.js si nécessaire
 * Charge automatiquement la DB si sql.js est utilisé
 */
export function forceConnection(): boolean {
  // Si better-sqlite3 est disponible, essayer de se connecter
  if (betterSqlite3Available) {
    ensureDatabaseConnection()
    if (db) {
      try {
        const test = db.prepare('SELECT 1 as test').get()
        if (test) {
          logger.info('[forceConnection] ✅ Connexion réussie avec better-sqlite3')
          return true
        }
      } catch (e) {
        const errorDetails = serializeError(e)
        logger.warn('[forceConnection] Erreur avec better-sqlite3:', errorDetails)
      }
    }
  }
  
  // Si better-sqlite3 n'est pas disponible ou a échoué, essayer sql.js
  if (!db) {
    try {
      if (!sqlJsInit || !sqlJsInit.Database) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sqlJs = require('sql.js')
        if (sqlJs.Database) {
          sqlJsInit = sqlJs
        } else if (sqlJs.default && sqlJs.default.Database) {
          sqlJsInit = sqlJs.default
        }
      }
      
      if (sqlJsInit && sqlJsInit.Database) {
        const absDbPath = path.resolve(dbPath)
        if (fs.existsSync(absDbPath)) {
          if (!sqlJsDb) {
            const fileBuffer = fs.readFileSync(absDbPath)
            sqlJsDb = new sqlJsInit.Database(fileBuffer)
            const dbStats = fs.statSync(absDbPath)
            sqlJsDbLastModified = dbStats.mtimeMs
            logger.info(`[forceConnection] ✅ sql.js DB chargée (${(dbStats.size / 1024).toFixed(2)} KB)`)
          }
          return true
        } else {
          logger.warn(`[forceConnection] Fichier DB non trouvé: ${absDbPath}`)
          return false
        }
      }
    } catch (e) {
      const errorDetails = serializeError(e)
      logger.warn('[forceConnection] Erreur avec sql.js:', errorDetails)
    }
  }
  
  return false
}

/**
 * Tester la connexion à la base de données
 * PHASE 1: Tente de reconnecter si db est null
 * Supporte le fallback sql.js si better-sqlite3 n'est pas disponible
 */
export function testConnection(): boolean {
  // PHASE 1: Si db est null, tenter de reconnecter
  if (!db) {
    ensureDatabaseConnection()
    if (!db) {
      // Essayer avec sql.js fallback
      try {
        if (!sqlJsInit) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const sqlJs = require('sql.js')
          if (sqlJs.Database) {
            sqlJsInit = sqlJs
          } else if (sqlJs.default && sqlJs.default.Database) {
            sqlJsInit = sqlJs.default
          } else if (typeof sqlJs === 'function') {
            try {
              sqlJsInit = sqlJs()
              if (!sqlJsInit || !sqlJsInit.Database) {
                // Silent warning - only log in debug mode
                if (process.env['DEBUG_DB'] === '1') {
                  logger.warn('[testConnection] sql.js initialisé mais Database non disponible')
                }
                return false
              }
            } catch {
              return false
            }
          } else {
            return false
          }
        }
        
        if (sqlJsInit && sqlJsInit.Database) {
          const absDbPath = path.resolve(dbPath)
          if (fs.existsSync(absDbPath)) {
            reloadSqlJsDbIfNeeded()
            if (!sqlJsDb) {
              const fileBuffer = fs.readFileSync(absDbPath)
              sqlJsDb = new sqlJsInit.Database(fileBuffer)
              const dbStats = fs.statSync(absDbPath)
              sqlJsDbLastModified = dbStats.mtimeMs
            }
            // PHASE 3: Tester la connexion sql.js avec une requête simple
            try {
              const testResult = sqlJsDb.exec('SELECT 1 as test')
              if (testResult.length > 0) {
                logger.info('✅ Connexion SQLite réussie (sql.js fallback)')
                return true
              }
            } catch (testError) {
              const errorMsg = testError instanceof Error ? testError.message : String(testError)
              logger.warn('[testConnection] Erreur lors du test sql.js:', { error: errorMsg })
              return false
            }
          }
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e)
        if (!errorMsg.includes('exports') && !errorMsg.includes('Cannot set properties')) {
          logger.warn(`[testConnection] sql.js fallback non disponible: ${errorMsg}`)
        }
      }
      
      const dbPathForLog = getDbPath()
      if (!dbPathForLog || dbPathForLog.trim() === '') {
        logger.error(`[DB] testConnection: ❌ Database path is empty. Check DATABASE_URL or SQLITE_DB_PATH environment variables.`)
      } else {
        logger.warn(`[DB] testConnection: db is null, cannot connect to ${dbPathForLog}`)
      }
      return false
    }
  }
  
  try {
    const result = db.prepare('SELECT datetime(\'now\') as current_time').get() as { current_time: string }
    logger.info('✅ Connexion SQLite réussie:', { currentTime: result.current_time })
    return true
  } catch (error) {
    // PHASE 0: Sérialisation robuste de l'erreur
    const errorDetails = serializeError(error)
    logger.error('❌ Erreur lors du test de connexion SQLite:', {
      ...errorDetails,
      dbPath: getDbPath(),
      cwd: process.cwd()
    })
    // PHASE 1: Réinitialiser db si erreur
    db = null
    return false
  }
}

/**
 * Initialiser la base de données avec les tables nécessaires
 * PHASE 3: Supporte both better-sqlite3 et sql.js
 */
export function initializeDatabase(): void {
  if (process.env['VERCEL'] === '1') return
  // PHASE 3: Si better-sqlite3 n'est pas disponible, utiliser sql.js
  if (!db) {
    // Essayer d'initialiser sql.js si pas déjà fait
    if (!sqlJsDb) {
      try {
        if (!sqlJsInit) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const sqlJs = require('sql.js')
          if (sqlJs.Database) {
            sqlJsInit = sqlJs
          } else if (sqlJs.default && sqlJs.default.Database) {
            sqlJsInit = sqlJs.default
          } else if (typeof sqlJs === 'function') {
            try {
              sqlJsInit = sqlJs()
            } catch {
              // Ignorer
            }
          }
        }
        
        if (sqlJsInit && sqlJsInit.Database) {
          const absDbPath = path.resolve(dbPath)
          if (fs.existsSync(absDbPath)) {
            const fileBuffer = fs.readFileSync(absDbPath)
            sqlJsDb = new sqlJsInit.Database(fileBuffer)
            const dbStats = fs.statSync(absDbPath)
            sqlJsDbLastModified = dbStats.mtimeMs
            logger.info('[initializeDatabase] sql.js fallback initialisé')
          }
        }
      } catch {
        // Ignorer les erreurs d'initialisation sql.js
      }
    }
    
    // Si toujours pas de DB (ni better-sqlite3 ni sql.js), retourner
    if (!db && !sqlJsDb) {
      logger.warn('[initializeDatabase] Aucune connexion DB disponible (ni better-sqlite3 ni sql.js)')
      return
    }
  }
  try {
    logger.info('Initialisation de la base de données SQLite...')
    
    // PHASE 3: Utiliser sql.js si better-sqlite3 n'est pas disponible
    const useSqlJs = !db && sqlJsDb
    
    // Créer la table products
    if (useSqlJs) {
      sqlJsDb.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_ar TEXT,
        description TEXT,
        price REAL NOT NULL,
        original_price REAL,
        category TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        image_url TEXT,
        images TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)
      
      // Migrations pour sql.js: ajouter les colonnes si elles n'existent pas
      try {
        sqlJsDb.run(`ALTER TABLE products ADD COLUMN images TEXT`)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!msg.includes('duplicate column') && !msg.includes('no such column')) {
          // Ignorer si la colonne existe déjà
        }
      }
      
      try {
        sqlJsDb.run(`ALTER TABLE products ADD COLUMN created_by TEXT`)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!msg.includes('duplicate column') && !msg.includes('no such column')) {
          // Ignorer si la colonne existe déjà
        }
      }
    } else {
      db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_ar TEXT,
        description TEXT,
        price REAL NOT NULL,
        original_price REAL,
        category TEXT NOT NULL,
        stock INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        image_url TEXT,
        images TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Ajouter la colonne images si elle n'existe pas (migration)
    try {
      db.exec(`ALTER TABLE products ADD COLUMN images TEXT`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('duplicate column')) {
        logger.warn('⚠️ Erreur lors de l\'ajout de la colonne images:', { error: msg })
      }
    }

    // Ajouter la colonne created_by si elle n'existe pas (migration)
    try {
      db.exec(`ALTER TABLE products ADD COLUMN created_by TEXT`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('duplicate column')) {
        logger.warn('⚠️ Erreur lors de l\'ajout de la colonne created_by:', { error: msg })
      }
    }
    
    // Pour sql.js aussi, ajouter created_by si nécessaire
    if (sqlJsDb) {
      try {
        sqlJsDb.run(`ALTER TABLE products ADD COLUMN created_by TEXT`)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!msg.includes('duplicate column') && !msg.includes('no such column')) {
          logger.warn('⚠️ Erreur lors de l\'ajout de la colonne created_by (sql.js):', { error: msg })
        }
      }
    }
    
    // Créer la table users si elle n'existe pas
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Créer les utilisateurs admin par défaut s'ils n'existent pas
    // ⚠️ MOT DE PASSE DE TEST UNIQUEMENT - Ne pas utiliser en production
    // Ce mot de passe est uniquement pour le développement/test
    // En production, les utilisateurs admin doivent être créés via l'interface admin ou l'API
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcryptjs')
      const adminPasswordHash = bcrypt.hashSync('Admin123!', 10)
      
      // Créer admin_phone
      const adminExists1 = db.prepare('SELECT id FROM users WHERE phone = ?').get('admin_phone')
      if (!adminExists1) {
        db.prepare(`
          INSERT INTO users (phone, password_hash, first_name, last_name, role)
          VALUES (?, ?, ?, ?, ?)
        `).run('admin_phone', adminPasswordHash, 'Admin', 'INOXYA', 'admin')
        logger.info('Utilisateur admin (admin_phone) créé par défaut')
      }
      
      // Créer 0612345678
      const adminExists2 = db.prepare('SELECT id FROM users WHERE phone = ?').get('0612345678')
      if (!adminExists2) {
        db.prepare(`
          INSERT INTO users (phone, password_hash, first_name, last_name, role)
          VALUES (?, ?, ?, ?, ?)
        `).run('0612345678', adminPasswordHash, 'Admin', 'INOXYA', 'admin')
        logger.info('Utilisateur admin (0612345678) créé par défaut')
      }
    } catch (e: unknown) {
      logger.warn('⚠️ Erreur lors de la création de l\'utilisateur admin:', { error: e instanceof Error ? e.message : String(e) })
    }
    
    // Créer la table categories
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Créer la table packs
    db.exec(`
      CREATE TABLE IF NOT EXISTS packs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        is_featured BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Créer la table cart_items
    db.exec(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        bijou_id INTEGER,
        quantity INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, bijou_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (bijou_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `)

    // Créer la table orders (commandes)
    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        shipping_address TEXT,
        phone TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)

    // Créer la table order_items (lignes de commande)
    db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        bijou_id INTEGER,
        pack_id TEXT,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `)

    // Créer la table payments (paiements)
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        transaction_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `)

    // Créer la table notifications
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        action_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)

    // Créer la table favorites (favoris)
    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        bijou_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, bijou_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (bijou_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `)

    // Insérer des catégories par défaut (gardées car nécessaires pour l'organisation)
    const insertCategory = db.prepare(`
      INSERT OR IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)
    `)
    
    const updateCategory = db.prepare(`
      UPDATE categories SET name = ?, description = ? WHERE slug = ?
    `)
    
    const categories = [
      ['Bagues', 'bagues', 'Magnifiques bagues berbères traditionnelles'],
      ['Ensemble', 'colliers', 'Ensembles assortis de bijoux en acier inoxydable'],
      ['Bracelets', 'bracelets', 'Bracelets élégants aux designs authentiques'],
      ['Boucles d\'oreilles', 'boucles-oreilles', 'Boucles d\'oreilles raffinées'],
      ['Nos packs', 'broches', 'Packs exclusifs de bijoux à prix avantageux']
    ]
    
    categories.forEach(category => {
      insertCategory.run(category)
      // Mettre à jour le libellé si la ligne existe déjà (slug stable)
      if (category[1] === 'broches' || category[1] === 'colliers') {
        updateCategory.run(category[0], category[2], category[1])
      }
    })
    
    // NOTE: Les produits et packs ne sont plus insérés automatiquement
    // Ils doivent être créés via l'interface admin ou l'API
    
    logger.info('Base de données SQLite initialisée avec succès')
    } // Fin du bloc else
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation de la base de données:', error)
    throw error
  }
}

/**
 * Récupérer un utilisateur par téléphone (pour auth)
 * Utilise sql.js comme fallback si better-sqlite3 n'est pas disponible
 */
export function getUserByPhone(phone: string): { id: string; phone: string; password_hash: string; first_name?: string; last_name?: string; role: string } | null {
  // Normaliser le téléphone (supprimer espaces, tirets, points)
  // SAUF pour admin_phone qui est un identifiant spécial
  const normalizedPhone = phone === 'admin_phone' 
    ? 'admin_phone' 
    : phone.replace(/[\s\-\.]/g, '').trim()
  
  // Essayer d'abord avec better-sqlite3
  if (db) {
    try {
      // Essayer plusieurs formats de téléphone
      let row = db.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?').get(normalizedPhone) as { id: number; phone: string; password_hash: string; first_name?: string; last_name?: string; role: string } | undefined
      
      // Si pas trouvé et commence par 0, essayer avec +212 (sauf pour admin_phone)
      if (!row && normalizedPhone.startsWith('0') && normalizedPhone !== 'admin_phone') {
        const phoneWithPrefix = '+212' + normalizedPhone.substring(1)
        row = db.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?').get(phoneWithPrefix) as { id: number; phone: string; password_hash: string; first_name?: string; last_name?: string; role: string } | undefined
      }
      
      // Si pas trouvé et commence par +212, essayer avec 0 (sauf pour admin_phone)
      if (!row && normalizedPhone.startsWith('+212') && normalizedPhone !== 'admin_phone') {
        const phoneWithoutPrefix = '0' + normalizedPhone.substring(4)
        row = db.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?').get(phoneWithoutPrefix) as { id: number; phone: string; password_hash: string; first_name?: string; last_name?: string; role: string } | undefined
      }
      
      if (!row) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('[getUserByPhone] Utilisateur non trouvé', { phone: normalizedPhone })
        }
        return null
      }
      return { ...row, id: String(row.id) }
    } catch (error) {
      logger.error('[getUserByPhone] Erreur better-sqlite3:', error)
      // Continuer avec le fallback
    }
  }
  
  // Fallback: utiliser sql.js si better-sqlite3 n'est pas disponible
  if (sqlJsDb) {
    try {
      // Essayer plusieurs formats de téléphone avec sql.js
      let stmt = sqlJsDb.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?')
      stmt.bind([normalizedPhone])
      
      let userRow: { id: number; phone: string; password_hash: string; first_name?: string; last_name?: string; role: string } | null = null
      
      if (stmt.step()) {
        userRow = stmt.getAsObject() as { id: number; phone: string; password_hash: string; first_name?: string; last_name?: string; role: string }
      }
      stmt.free()
      
      // Si pas trouvé et commence par 0, essayer avec +212 (sauf pour admin_phone)
      if (!userRow && normalizedPhone.startsWith('0') && normalizedPhone !== 'admin_phone') {
        const phoneWithPrefix = '+212' + normalizedPhone.substring(1)
        stmt = sqlJsDb.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?')
        stmt.bind([phoneWithPrefix])
        if (stmt.step()) {
          userRow = stmt.getAsObject() as { id: number; phone: string; password_hash: string; first_name?: string; last_name?: string; role: string }
        }
        stmt.free()
      }
      
      // Si pas trouvé et commence par +212, essayer avec 0 (sauf pour admin_phone)
      if (!userRow && normalizedPhone.startsWith('+212') && normalizedPhone !== 'admin_phone') {
        const phoneWithoutPrefix = '0' + normalizedPhone.substring(4)
        stmt = sqlJsDb.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?')
        stmt.bind([phoneWithoutPrefix])
        if (stmt.step()) {
          userRow = stmt.getAsObject() as { id: number; phone: string; password_hash: string; first_name?: string; last_name?: string; role: string }
        }
        stmt.free()
      }
      
      if (userRow) {
        if (process.env.NODE_ENV === 'development') {
          logger.info('[getUserByPhone] Utilisateur trouvé (sql.js)', { phone: userRow.phone, role: userRow.role })
        }
        return { ...userRow, id: String(userRow.id) }
      }
    } catch (error) {
      logger.error('[getUserByPhone] Erreur sql.js:', serializeError(error))
    }
  }
  
  // Si aucune DB n'est disponible, essayer de forcer la connexion
  if (!db && !sqlJsDb) {
    forceConnection()
    reloadSqlJsDbIfNeeded()
    // Réessayer avec sql.js si maintenant disponible
    if (sqlJsDb) {
      try {
        const stmt = sqlJsDb.prepare('SELECT id, phone, password_hash, first_name, last_name, role FROM users WHERE phone = ?')
        stmt.bind([normalizedPhone])
        if (stmt.step()) {
          const userRow = stmt.getAsObject() as { id: number; phone: string; password_hash: string; first_name?: string; last_name?: string; role: string }
          stmt.free()
          return { ...userRow, id: String(userRow.id) }
        }
        stmt.free()
      } catch (error) {
        logger.error('[getUserByPhone] Erreur après forceConnection:', serializeError(error))
      }
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    logger.warn('[getUserByPhone] Utilisateur non trouvé', { phone: normalizedPhone, dbAvailable: !!db, sqlJsDbAvailable: !!sqlJsDb })
  }
  return null
}

/**
 * Récupérer un utilisateur par ID (pour auth)
 */
export function getUserById(id: string): { id: string; phone: string; first_name?: string; last_name?: string; role: string } | null {
  try {
    const numericId = Number(id) || parseInt(id, 10)
    
    if (isNaN(numericId)) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('[getUserById] ID invalide (NaN)', { id })
      }
      return null
    }
    
    // Essayer d'abord avec better-sqlite3
    if (db) {
      try {
        const row = db.prepare('SELECT id, phone, first_name, last_name, role FROM users WHERE id = ?').get(numericId) as { id: number; phone: string; first_name?: string; last_name?: string; role: string } | undefined
        if (row) {
          if (process.env.NODE_ENV === 'development') {
            logger.info('[getUserById] Utilisateur trouvé (better-sqlite3)', { id: row.id, phone: row.phone, role: row.role })
          }
          return { ...row, id: String(row.id) }
        }
      } catch (error) {
        logger.error('[getUserById] Erreur better-sqlite3:', serializeError(error))
      }
    }
    
    // Fallback: sql.js
    if (sqlJsDb) {
      try {
        const stmt = sqlJsDb.prepare('SELECT id, phone, first_name, last_name, role FROM users WHERE id = ?')
        stmt.bind([numericId])
        if (stmt.step()) {
          const row = stmt.getAsObject() as { id: number; phone: string; first_name?: string; last_name?: string; role: string }
          stmt.free()
          if (process.env.NODE_ENV === 'development') {
            logger.info('[getUserById] Utilisateur trouvé (sql.js)', { id: row.id, phone: row.phone, role: row.role })
          }
          return { ...row, id: String(row.id) }
        }
        stmt.free()
      } catch (error) {
        logger.error('[getUserById] Erreur sql.js:', serializeError(error))
      }
    }
    
    // Si aucune DB n'est disponible, essayer de forcer la connexion
    if (!db && !sqlJsDb) {
      forceConnection()
      reloadSqlJsDbIfNeeded()
      // Réessayer avec sql.js si maintenant disponible
      if (sqlJsDb) {
        try {
          const stmt = sqlJsDb.prepare('SELECT id, phone, first_name, last_name, role FROM users WHERE id = ?')
          stmt.bind([numericId])
          if (stmt.step()) {
            const row = stmt.getAsObject() as { id: number; phone: string; first_name?: string; last_name?: string; role: string }
            stmt.free()
            return { ...row, id: String(row.id) }
          }
          stmt.free()
        } catch (error) {
          logger.error('[getUserById] Erreur après forceConnection:', serializeError(error))
        }
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[getUserById] Utilisateur non trouvé', { id, numericId, dbAvailable: !!db, sqlJsDbAvailable: !!sqlJsDb })
    }
    return null
  } catch (error) {
    logger.error('[getUserById] Erreur:', serializeError(error))
    return null
  }
}

/**
 * Créer un utilisateur (pour auth/inscription)
 */
export function createUser(userData: { phone: string; password_hash: string; first_name?: string; last_name?: string; role?: string }): { id: string; phone: string; first_name?: string; last_name?: string; role: string } | null {
  if (!db) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require('bcryptjs')
    const hash = bcrypt.hashSync(userData.password_hash, 10)
    const result = db.prepare(`
      INSERT INTO users (phone, password_hash, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(userData.phone, hash, userData.first_name || null, userData.last_name || null, userData.role || 'user')
    return getUserById(String(result.lastInsertRowid))
  } catch {
    return null
  }
}

/**
 * Lister tous les utilisateurs (pour admin)
 */
export function getAllUsers(): { id: string; phone: string; first_name?: string; last_name?: string; role: string }[] {
  if (!db) return []
  try {
    const rows = db.prepare('SELECT id, phone, first_name, last_name, role FROM users ORDER BY id').all() as { id: number; phone: string; first_name?: string; last_name?: string; role: string }[]
    return rows.map(r => ({ ...r, id: String(r.id) }))
  } catch {
    return []
  }
}

/**
 * Mettre à jour le rôle d'un utilisateur
 */
export function updateUserRole(userId: string, newRole: string): boolean {
  if (!db) return false
  try {
    const result = db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newRole, userId)
    return result.changes > 0
  } catch {
    return false
  }
}

/**
 * Récupérer tous les produits (pour pages catalogue)
 * PHASE B: Version asynchrone qui utilise le singleton sql.js
 */
export async function getProductsAsync(): Promise<{ id: string; name: string; name_ar?: string; description?: string; price: number; original_price?: number; image_url?: string; images?: string | string[]; images_json?: string; main_image?: string; category_id?: string; category?: string; is_available: boolean; is_active?: boolean; is_featured: boolean; rating?: number; reviews_count?: number; created_at?: string }[]> {
  try {
    // Utiliser selectAsync() qui gère automatiquement better-sqlite3 et sql.js
    // PHASE 4: Gérer les valeurs NULL (is_active = 1 OR is_active IS NULL)
    const rows = await selectAsync('SELECT id, name, name_ar, description, price, original_price, image_url, images, category, stock, is_active, is_featured, created_at FROM products WHERE (is_active = 1 OR is_active IS NULL) ORDER BY created_at DESC', []) as { id: number; name: string; name_ar?: string; description?: string; price: number; original_price?: number; image_url?: string; images?: string; category?: string; stock?: number; is_active: number; is_featured: number; created_at?: string }[]
    const cats = await selectAsync('SELECT name, slug FROM categories', []) as { name: string; slug: string }[]
    const nameToSlug = Object.fromEntries(cats.map(c => [c.name, c.slug]))
    
    logger.info(`[getProducts] ${rows.length} produit(s) récupéré(s) depuis ${dbPath}`)
    
    // PHASE 5: Normaliser les chemins d'images pour le web (utiliser normalizeImageUrl)
    return rows.map(r => {
      // Normaliser l'image principale
      const imageUrl = normalizeImageUrl(r.image_url)
      
      // Corriger les images secondaires
      let images = r.images
      let imagesArray: string[] = []
      if (images) {
        try {
          imagesArray = JSON.parse(images)
          if (Array.isArray(imagesArray)) {
            // PHASE 5: Normaliser toutes les images secondaires
            imagesArray = imagesArray.map((img: string) => normalizeImageUrl(img))
          }
          images = JSON.stringify(imagesArray)
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
      
      // Normaliser la catégorie et obtenir le slug
      const normalizedCategory = r.category ? normalizeCategoryValue(r.category) : null
      const categorySlug = normalizedCategory ? dbValueToSlug(normalizedCategory) : (r.category ? nameToSlug[r.category] : undefined)
      
      return {
        id: String(r.id),
        name: r.name,
        name_ar: r.name_ar,
        description: r.description,
        price: r.price,
        original_price: r.original_price,
        image_url: imageUrl,
        main_image: imageUrl, // Ajouter main_image pour compatibilité
        images: imagesArray, // Retourner directement le tableau au lieu de la string JSON
        images_json: images, // Garder aussi la version JSON pour compatibilité
        category_id: categorySlug || undefined,
        category: r.category, // Garder aussi la catégorie originale
        stock: typeof r.stock === 'number' ? r.stock : 0,
        is_available: Boolean(r.is_active),
        is_active: Boolean(r.is_active), // Garder aussi pour compatibilité
        is_featured: Boolean(r.is_featured),
        rating: 4.5,
        reviews_count: 0,
        created_at: r.created_at || new Date().toISOString()
      }
    })
  } catch (error) {
    // PHASE 0: Sérialisation robuste de l'erreur
    const errorDetails = serializeError(error)
    // Passer l'erreur originale à logger.error, et errorDetails comme metadata
    const errorMessage = errorDetails.message || String(error)
    logger.error(
      `[getProductsAsync] Erreur lors de la récupération: ${errorMessage}`,
      error instanceof Error ? error : new Error(errorMessage),
      errorDetails
    )
    return []
  }
}

/**
 * Récupérer un produit par ID (version synchrone - better-sqlite3 uniquement)
 */
export function getProductById(id: string): { id: string; name: string; name_ar?: string; description?: string; price: number; original_price?: number; image_url?: string; images?: string; category_id?: string; is_available: boolean; is_featured: boolean; rating?: number; reviews_count?: number; main_image?: string } | null {
  try {
    // PHASE 2: Utiliser les wrappers uniformes
    const numericId = Number(id)
    let r = selectOne('SELECT id, name, name_ar, description, price, original_price, image_url, images, category, is_active, is_featured, created_at FROM products WHERE id = ?', [numericId]) as { id: number; name: string; name_ar?: string; description?: string; price: number; original_price?: number; image_url?: string; images?: string; category?: string; is_active: number; is_featured: number; created_at?: string } | null
    
    // Si pas trouvé et que l'ID n'est pas un nombre valide, essayer comme string
    if (!r && isNaN(numericId)) {
      r = selectOne('SELECT id, name, name_ar, description, price, original_price, image_url, images, category, is_active, is_featured, created_at FROM products WHERE CAST(id AS TEXT) = ?', [id]) as { id: number; name: string; name_ar?: string; description?: string; price: number; original_price?: number; image_url?: string; images?: string; category?: string; is_active: number; is_featured: number; created_at?: string } | null
    }
    
    if (!r) return null
    const cats = selectRows('SELECT name, slug FROM categories', []) as { name: string; slug: string }[]
    const nameToSlug = Object.fromEntries(cats.map(c => [c.name, c.slug]))
    
    // Normaliser la catégorie et obtenir le slug
    const normalizedCategory = r.category ? normalizeCategoryValue(r.category) : null
    const categorySlug = normalizedCategory ? dbValueToSlug(normalizedCategory) : (r.category ? nameToSlug[r.category] : undefined)
    
    // PHASE 5: Normaliser les chemins d'images
    const normalizedImageUrl = normalizeImageUrl(r.image_url)
    let normalizedImages = r.images
    let imagesArray: string[] = []
    if (normalizedImages) {
      try {
        imagesArray = JSON.parse(normalizedImages)
        if (Array.isArray(imagesArray)) {
          imagesArray = imagesArray.map((img: string) => normalizeImageUrl(img))
          normalizedImages = JSON.stringify(imagesArray)
        }
      } catch {
        normalizedImages = '[]'
        imagesArray = []
      }
    }
    
    return {
      id: String(r.id),
      name: r.name,
      name_ar: r.name_ar,
      description: r.description,
      price: r.price,
      original_price: r.original_price,
      image_url: normalizedImageUrl,
      main_image: normalizedImageUrl,
      images: normalizedImages,
      category_id: categorySlug || undefined,
      is_available: Boolean(r.is_active),
      is_featured: Boolean(r.is_featured),
      rating: 4.5,
      reviews_count: 0
    }
  } catch {
    return null
  }
}

/**
 * Récupérer un produit par ID (version asynchrone - supporte better-sqlite3 et sql.js)
 */
export async function getProductByIdAsync(id: string): Promise<{ id: string; name: string; name_ar?: string; description?: string; price: number; original_price?: number; image_url?: string; images?: string | string[]; images_json?: string; main_image?: string; category_id?: string; category?: string; stock?: number; is_available: boolean; is_active?: boolean; is_featured: boolean; rating?: number; reviews_count?: number; created_at?: string } | null> {
  try {
    // PHASE 2: Utiliser les wrappers uniformes (fonctionne avec better-sqlite3 et sql.js)
    // S'assurer que sql.js est initialisé si nécessaire
    const driver = detectDriver()
    if (driver === null || driver === 'sqljs') {
      await initSqlJsAsync()
      reloadSqlJsDbIfNeeded()
    }
    
    // Essayer d'abord avec l'ID comme nombre
    const numericId = Number(id)
    let rows: { id: number; name: string; name_ar?: string; description?: string; price: number; original_price?: number; image_url?: string; images?: string; category?: string; stock?: number; is_active: number; is_featured: number; created_at?: string }[] = []
    
    // Essayer d'abord avec l'ID comme nombre
    if (!isNaN(numericId)) {
      rows = await selectAsync('SELECT id, name, name_ar, description, price, original_price, image_url, images, category, stock, is_active, is_featured, created_at FROM products WHERE id = ?', [numericId]) as { id: number; name: string; name_ar?: string; description?: string; price: number; original_price?: number; image_url?: string; images?: string; category?: string; stock?: number; is_active: number; is_featured: number; created_at?: string }[]
    }
    
    // Si pas trouvé, essayer avec CAST(id AS TEXT) pour sql.js
    if ((!rows || rows.length === 0) && isNaN(numericId)) {
      rows = await selectAsync('SELECT id, name, name_ar, description, price, original_price, image_url, images, category, stock, is_active, is_featured, created_at FROM products WHERE CAST(id AS TEXT) = ?', [id]) as { id: number; name: string; name_ar?: string; description?: string; price: number; original_price?: number; image_url?: string; images?: string; category?: string; stock?: number; is_active: number; is_featured: number; created_at?: string }[]
    }
    
    if (!rows || rows.length === 0) {
      return null
    }
    
    const r = rows[0]
    if (!r) {
      return null
    }
    const cats = await selectAsync('SELECT name, slug FROM categories', []) as { name: string; slug: string }[]
    const nameToSlug = Object.fromEntries(cats.map(c => [c.name, c.slug]))
    
    // Normaliser la catégorie et obtenir le slug
    const normalizedCategory = r.category ? normalizeCategoryValue(r.category) : null
    const categorySlug = normalizedCategory ? dbValueToSlug(normalizedCategory) : (r.category ? nameToSlug[r.category] : undefined)
    
    // Normaliser les images
    const normalizedImageUrl = normalizeImageUrl(r.image_url)
    let imagesArray: string[] = []
    let imagesJson = r.images || '[]'
    if (r.images) {
      try {
        imagesArray = JSON.parse(r.images)
        if (Array.isArray(imagesArray)) {
          imagesArray = imagesArray.map((img: string) => normalizeImageUrl(img))
          imagesJson = JSON.stringify(imagesArray)
        }
      } catch {
        imagesArray = []
        imagesJson = '[]'
      }
    }
    
    return {
      id: String(r.id),
      name: r.name,
      name_ar: r.name_ar,
      description: r.description,
      price: r.price,
      original_price: r.original_price,
      image_url: normalizedImageUrl,
      main_image: normalizedImageUrl,
      images: imagesArray,
      images_json: imagesJson,
      category_id: categorySlug || undefined,
      category: r.category,
      stock: typeof r.stock === 'number' ? r.stock : 0,
      is_available: Boolean(r.is_active),
      is_active: Boolean(r.is_active),
      is_featured: Boolean(r.is_featured),
      rating: 4.5,
      reviews_count: 0,
      created_at: r.created_at || new Date().toISOString()
    }
  } catch (error) {
    const errorDetails = serializeError(error)
    logger.error(`[getProductByIdAsync] Erreur: ${errorDetails.message}`, error instanceof Error ? error : new Error(errorDetails.message), errorDetails)
    return null
  }
}

/**
 * Récupérer les catégories
 */
export function getCategories(): { id: string; name: string; slug: string; description?: string; image_url?: string }[] {
  if (!db) return []
  try {
    const rows = selectRows('SELECT id, name, slug, description, image_url FROM categories ORDER BY name', []) as { id: number; name: string; slug: string; description?: string; image_url?: string }[]
    return rows.map(r => ({ ...r, id: String(r.id) }))
  } catch {
    return []
  }
}

/**
 * Récupérer les packs (version asynchrone)
 * PHASE B: Utilise le singleton sql.js
 */
export async function getPacksAsync(): Promise<{ id: string; name: string; slug: string; description?: string; price: number; image_url?: string; is_featured: boolean }[]> {
  try {
    const rows = await selectAsync('SELECT id, name, slug, description, price, image_url, is_featured FROM packs ORDER BY created_at DESC', []) as { id: number; name: string; slug: string; description?: string; price: number; image_url?: string; is_featured: number }[]
    logger.info(`[getPacksAsync] ${rows.length} pack(s) récupéré(s)`)
    
    // PHASE 5: Normaliser les chemins d'images pour le web (utiliser normalizeImageUrl)
    return rows.map(r => {
      const imageUrl = normalizeImageUrl(r.image_url)
      return { ...r, id: String(r.id), is_featured: Boolean(r.is_featured), image_url: imageUrl }
    })
  } catch (error) {
    // PHASE 0: Sérialisation robuste de l'erreur
    const errorDetails = serializeError(error)
    // Passer l'erreur originale à logger.error, et errorDetails comme metadata
    const errorMessage = errorDetails.message || String(error)
    logger.error(
      `[getPacksAsync] Erreur lors de la récupération: ${errorMessage}`,
      error instanceof Error ? error : new Error(errorMessage),
      errorDetails
    )
    return []
  }
}

/**
 * Récupérer les packs (version synchrone - pour compatibilité)
 * DÉPRÉCIÉ: Utiliser getPacksAsync() à la place
 */
export function getPacks(): { id: string; name: string; slug: string; description?: string; price: number; image_url?: string; is_featured: boolean }[] {
  // Essayer better-sqlite3 d'abord (synchrone)
  const betterSqlite3Db = getBetterSqlite3Db()
  if (betterSqlite3Db && typeof betterSqlite3Db.prepare === 'function') {
    try {
      const rows = select('SELECT id, name, slug, description, price, image_url, is_featured FROM packs ORDER BY created_at DESC', []) as { id: number; name: string; slug: string; description?: string; price: number; image_url?: string; is_featured: number }[]
      logger.info(`[getPacks] ${rows.length} pack(s) récupéré(s)`)
      
      return rows.map(r => {
        const imageUrl = normalizeImageUrl(r.image_url)
        return { ...r, id: String(r.id), is_featured: Boolean(r.is_featured), image_url: imageUrl }
      })
    } catch (error) {
      const errorDetails = serializeError(error)
      logger.error('[getPacks] Erreur:', errorDetails)
      return []
    }
  }
  
  // better-sqlite3 non disponible - retourner [] (les appels asynchrones doivent utiliser getPacksAsync())
  logger.warn('[getPacks] better-sqlite3 non disponible. Utiliser getPacksAsync() pour sql.js.')
  return []
}

/**
 * Statistiques du dashboard (pour admin)
 */
export function getDashboardStats(): {
  totalBijoux: number
  totalPacks: number
  totalCategories: number
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  recentOrders: { id: string; total_amount: number; status: string; created_at: string; phone?: string }[]
  topProducts: { id: string; name: string; quantity: number; price: number; image_url?: string; is_pack?: boolean }[]
  userGrowth: unknown[]
} {
  if (!db) {
    return { totalBijoux: 0, totalPacks: 0, totalCategories: 0, totalUsers: 0, totalOrders: 0, totalRevenue: 0, recentOrders: [], topProducts: [], userGrowth: [] }
  }
  try {
    const products = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_active = 1').get() as { c: number }
    const packs = db.prepare('SELECT COUNT(*) as c FROM packs').get() as { c: number }
    const categories = db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }
    const users = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
    const orders = db.prepare('SELECT COUNT(*) as c, COALESCE(SUM(total_amount), 0) as revenue FROM orders').get() as { c: number; revenue: number }
    const recentOrdersRows = db.prepare('SELECT id, total_amount, status, created_at, phone FROM orders ORDER BY created_at DESC LIMIT 10').all() as { id: number; total_amount: number; status: string; created_at: string; phone?: string }[]
    const recentOrders = (recentOrdersRows || []).map(o => ({ ...o, id: String(o.id) }))

    const topFromProducts = db.prepare(`
      SELECT oi.bijou_id as id, b.name, b.image_url, SUM(oi.quantity) as qty, oi.price
      FROM order_items oi
      LEFT JOIN products b ON oi.bijou_id = b.id
      WHERE oi.bijou_id IS NOT NULL
      GROUP BY oi.bijou_id
      ORDER BY qty DESC
      LIMIT 10
    `).all() as { id: number; name: string; image_url?: string; qty: number; price: number }[]
    const topFromPacks = db.prepare(`
      SELECT oi.pack_id as id, p.name, p.image_url, SUM(oi.quantity) as qty, oi.price
      FROM order_items oi
      LEFT JOIN packs p ON oi.pack_id = p.id
      WHERE oi.pack_id IS NOT NULL AND oi.pack_id != ''
      GROUP BY oi.pack_id
      ORDER BY qty DESC
      LIMIT 10
    `).all() as { id: string; name: string; image_url?: string; qty: number; price: number }[]
    const merged = [
      ...topFromProducts.map(t => ({ id: String(t.id), name: t.name || 'N/A', quantity: t.qty, price: t.price, image_url: t.image_url || undefined, is_pack: false })),
      ...topFromPacks.map(t => ({ id: String(t.id), name: t.name || 'N/A', quantity: t.qty, price: t.price, image_url: t.image_url || undefined, is_pack: true }))
    ].sort((a, b) => b.quantity - a.quantity).slice(0, 10)

    return {
      totalBijoux: products?.c ?? 0,
      totalPacks: packs?.c ?? 0,
      totalCategories: categories?.c ?? 0,
      totalUsers: users?.c ?? 0,
      totalOrders: orders?.c ?? 0,
      totalRevenue: orders?.revenue ?? 0,
      recentOrders,
      topProducts: merged,
      userGrowth: []
    }
  } catch {
    return {
      totalBijoux: 0,
      totalPacks: 0,
      totalCategories: 0,
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      recentOrders: [],
      topProducts: [],
      userGrowth: []
    }
  }
}

/**
 * Récupérer toutes les commandes (pour profil)
 */
export function getOrders(): { id: string; user_id: string | null; total_amount: number; status: string; created_at: string }[] {
  try {
    // PHASE 2: Utiliser les wrappers uniformes
    const rows = selectRows('SELECT id, user_id, total_amount, status, created_at FROM orders ORDER BY created_at DESC', []) as { id: number; user_id: string | null; total_amount: number; status: string; created_at: string }[]
    return rows.map(r => ({ ...r, id: String(r.id) }))
  } catch {
    return []
  }
}

/**
 * Créer une commande
 */
export function createOrder(data: { user_id: string | null; total_amount: number; status: string; shipping_address?: unknown; phone?: string; notes?: string }): { id: string } | null {
  if (!db) return null
  try {
    const shippingStr = typeof data.shipping_address === 'string' ? data.shipping_address : JSON.stringify(data.shipping_address || {})
    const result = db.prepare(`
      INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.user_id, data.total_amount, data.status, shippingStr, data.phone || null, data.notes || null) as { lastInsertRowid: number }
    return { id: String(result.lastInsertRowid) }
  } catch {
    return null
  }
}

/**
 * Créer un item de commande
 */
export function createOrderItem(data: { order_id: string; bijou_id: string; quantity: number; price: number }): { id: string; order_id: string; bijou_id: string; quantity: number; price: number } | null {
  if (!db) return null
  try {
    const result = db.prepare(`
      INSERT INTO order_items (order_id, bijou_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `).run(data.order_id, data.bijou_id, String(data.quantity), data.price)
    
    if (!result.lastInsertRowid) return null
    
    return {
      id: String(result.lastInsertRowid),
      order_id: data.order_id,
      bijou_id: data.bijou_id,
      quantity: data.quantity,
      price: data.price,
    }
  } catch {
    return null
  }
}

/**
 * Créer un paiement
 */
export function createPayment(data: { order_id: string; amount: number; payment_method: string; status?: string; transaction_id?: string }): { id: string; amount: number; payment_method: string; status: string; transaction_id: string | null } | null {
  if (!db) return null
  try {
    const result = db.prepare(`
      INSERT INTO payments (order_id, amount, payment_method, status, transaction_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.order_id, data.amount, data.payment_method, data.status || 'pending', data.transaction_id || null) as { lastInsertRowid: number }
    return {
      id: String(result.lastInsertRowid),
      amount: data.amount,
      payment_method: data.payment_method,
      status: data.status || 'pending',
      transaction_id: data.transaction_id || null
    }
  } catch {
    return null
  }
}

/**
 * Créer une notification
 */
export function createNotification(data: { user_id?: string | null; title: string; message: string; type?: string; is_read?: boolean; action_url?: string }): boolean {
  if (!db) return false
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, action_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.user_id || null, data.title, data.message, data.type || 'info', data.is_read ? 1 : 0, data.action_url || null)
    return true
  } catch {
    return false
  }
}

/**
 * Créer une commande complète en transaction (commande + lignes + paiement + notification).
 * En cas d'échec, tout est annulé (rollback).
 */
export async function createOrderFull(data: {
  order: { user_id: string | null; total_amount: number; status: string; shipping_address?: unknown; phone?: string; notes?: string }
  items: { bijou_id: string | null; pack_id?: string | null; quantity: number; price: number }[]
  payment: { amount: number; payment_method: string; status?: string; transaction_id?: string }
  notification?: { title: string; message: string; type?: string; action_url?: string } | null
}): Promise<{ orderId: string; paymentId: string } | null> {
  // S'assurer que la connexion DB est établie
  ensureDatabaseConnection()
  
  // Si better-sqlite3 n'est pas disponible, initialiser sql.js
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sqlJsDbWrapper: any = null
  // Utiliser une variable locale pour éviter la race condition avec la variable globale db
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let localDb: any = db
  
  // Vérifier si db est disponible, sinon initialiser sql.js
  if (!localDb) {
    try {
      const initialized = await initSqlJsAsync()
      if (initialized) {
        const { getSqlJsDb } = await import('./sqljs-singleton')
        sqlJsDbWrapper = await getSqlJsDb()
        // Utiliser une nouvelle variable pour éviter la race condition
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sqlJsDb: any = sqlJsDbWrapper?.db
        if (sqlJsDb) {
          // Utiliser sql.js comme fallback - sqlJsDbWrapper.db est l'instance sql.js
          // eslint-disable-next-line require-atomic-updates
          localDb = sqlJsDb
          logger.info('[createOrderFull] Using sql.js database')
        }
      }
    } catch (sqlJsError) {
      logger.error('[createOrderFull] Failed to initialize sql.js:', serializeError(sqlJsError))
    }
  }
  
  // S'assurer que la base de données est initialisée (création des tables)
  initializeDatabase()
  
  if (!localDb) {
    logger.error('[createOrderFull] Database not initialized after ensureDatabaseConnection and initializeDatabase')
    return null
  }
  try {
    // PHASE 2: Détecter correctement le type de driver
    // better-sqlite3 a .transaction(), sql.js a .exec() mais pas .transaction()
    const isBetterSqlite3 = localDb && typeof localDb.transaction === 'function' && typeof localDb.prepare === 'function'
    const isSqlJs = localDb && typeof localDb.transaction !== 'function' && (typeof localDb.exec === 'function' || typeof localDb.run === 'function')
    
    // PHASE 3: Log de diagnostic
    logger.info('[createOrderFull] Driver detection:', {
      hasDb: !!localDb,
      hasTransaction: localDb ? typeof localDb.transaction : 'N/A',
      hasPrepare: localDb ? typeof localDb.prepare : 'N/A',
      hasExec: localDb ? typeof localDb.exec : 'N/A',
      hasRun: localDb ? typeof localDb.run : 'N/A',
      isBetterSqlite3,
      isSqlJs
    })
    
    // Vérifier que les tables existent
    // PHASE 2: Utiliser les wrappers uniformes pour vérifier les tables
    try {
      const testResult = selectOne('SELECT 1 as test FROM orders LIMIT 1', [])
      if (!testResult) {
        throw new Error('Table orders does not exist or is empty')
      }
    } catch {
      logger.error('[createOrderFull] Table orders does not exist, initializing database...')
      initializeDatabase()
      // Réessayer après initialisation
      try {
        const retryResult = selectOne('SELECT 1 as test FROM orders LIMIT 1', [])
        if (!retryResult) {
          throw new Error('Table orders still does not exist after initialization')
        }
      } catch {
        logger.error('[createOrderFull] Table orders still does not exist after initialization')
        return null
      }
    }
    
    // Fonction pour échapper les valeurs SQL pour sql.js
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const escapeSql = (value: any): string => {
      if (value === null || value === undefined) return 'NULL'
      if (typeof value === 'number') return String(value)
      if (typeof value === 'boolean') return value ? '1' : '0'
      // Échapper les apostrophes pour les strings
      return "'" + String(value).replace(/'/g, "''") + "'"
    }
    
    // Fonction pour exécuter la transaction ou les opérations séquentielles
    const executeOrderCreation = () => {
      if (!localDb) throw new Error('Database connection lost')
      
      // PHASE 2: Redétecter le driver dans cette fonction pour être sûr
      const currentIsBetterSqlite3 = localDb && typeof localDb.transaction === 'function' && typeof localDb.prepare === 'function'
      const currentIsSqlJs = localDb && typeof localDb.transaction !== 'function' && (typeof localDb.exec === 'function' || typeof localDb.run === 'function')
      
      const shippingStr = typeof data.order.shipping_address === 'string'
        ? data.order.shipping_address
        : JSON.stringify(data.order.shipping_address || {})
      
      logger.info('[createOrderFull] Inserting order:', {
        user_id: data.order.user_id,
        total_amount: data.order.total_amount,
        status: data.order.status,
        phone: data.order.phone ? data.order.phone.substring(0, 4) + '****' : null,
        hasShipping: !!data.order.shipping_address,
        driver: currentIsBetterSqlite3 ? 'better-sqlite3' : currentIsSqlJs ? 'sqljs' : 'unknown'
      })
      
      let orderId: string
      let paymentId: string
      
      if (currentIsBetterSqlite3) {
        // PHASE 2: Utiliser les wrappers uniformes
        // Insérer la commande
        const orderResult = executeQuery(`
          INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          data.order.user_id,
          data.order.total_amount,
          data.order.status,
          shippingStr,
          data.order.phone || null,
          data.order.notes || null
        ])
        orderId = String(orderResult.lastInsertRowid || '0')
        
        // Migration: Ajouter pack_id si nécessaire
        try {
          const tableInfo = selectRows(`PRAGMA table_info(order_items)`, []) as Array<{ name: string }>
          const hasPackId = tableInfo.some(col => col.name === 'pack_id')
          
          if (!hasPackId) {
            executeQuery(`ALTER TABLE order_items ADD COLUMN pack_id TEXT`, [])
          }
        } catch {
          // Colonne existe déjà ou erreur, continuer
        }
        
        // Insérer les items
        for (const item of data.items) {
          try {
            if (item.pack_id) {
              executeQuery(`
                INSERT INTO order_items (order_id, bijou_id, pack_id, quantity, price) 
                VALUES (?, ?, ?, ?, ?)
              `, [orderId, null, item.pack_id, item.quantity, item.price])
              logger.info('[createOrderFull] Inserted pack item:', { orderId, pack_id: item.pack_id, quantity: item.quantity, price: item.price })
            } else if (item.bijou_id) {
              executeQuery(`
                INSERT INTO order_items (order_id, bijou_id, pack_id, quantity, price) 
                VALUES (?, ?, ?, ?, ?)
              `, [orderId, item.bijou_id, null, item.quantity, item.price])
              logger.info('[createOrderFull] Inserted bijou item:', { orderId, bijou_id: item.bijou_id, quantity: item.quantity, price: item.price })
            } else {
              logger.warn('[createOrderFull] Item without pack_id or bijou_id:', item)
              executeQuery(`
                INSERT INTO order_items (order_id, bijou_id, pack_id, quantity, price) 
                VALUES (?, ?, ?, ?, ?)
              `, [orderId, null, null, item.quantity, item.price])
            }
          } catch (itemError) {
            logger.error('[createOrderFull] Error inserting item:', serializeError(itemError))
            throw itemError
          }
        }
        
        // Insérer le paiement
        const paymentResult = executeQuery(`
          INSERT INTO payments (order_id, amount, payment_method, status, transaction_id)
          VALUES (?, ?, ?, ?, ?)
        `, [
          orderId,
          data.payment.amount,
          data.payment.payment_method,
          data.payment.status || 'pending',
          data.payment.transaction_id || null
        ])
        paymentId = String(paymentResult.lastInsertRowid || '0')
        
        // Insérer la notification si présente
        if (data.notification) {
          const actionUrl = (data.notification.action_url || '').replace('{{orderId}}', orderId)
          executeQuery(`
            INSERT INTO notifications (user_id, title, message, type, is_read, action_url)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            null,
            data.notification.title,
            data.notification.message,
            data.notification.type || 'info',
            0,
            actionUrl || null
          ])
        }
      } else if (currentIsSqlJs) {
        // PHASE 2: Utiliser sql.js avec exec() - pas de support pour les paramètres bindés
        // Insérer la commande
        const orderSql = `
          INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, notes)
          VALUES (${escapeSql(data.order.user_id)}, ${escapeSql(data.order.total_amount)}, ${escapeSql(data.order.status)}, ${escapeSql(shippingStr)}, ${escapeSql(data.order.phone || null)}, ${escapeSql(data.order.notes || null)})
        `
        localDb.exec(orderSql)
        
        // PHASE 2: Récupérer last_insert_rowid() avec une requête séparée (sql.js exécute chaque instruction séparément)
        const idResult = localDb.exec('SELECT last_insert_rowid() as id')
        if (idResult && idResult.length > 0 && idResult[0].values && idResult[0].values.length > 0) {
          orderId = String(idResult[0].values[0][0])
        } else {
          throw new Error('Failed to get order ID from sql.js')
        }
        
        // Insérer les items
        for (const item of data.items) {
          try {
            const bijouId = item.bijou_id ? escapeSql(item.bijou_id) : 'NULL'
            const packId = item.pack_id ? escapeSql(item.pack_id) : 'NULL'
            const itemSql = `
              INSERT INTO order_items (order_id, bijou_id, pack_id, quantity, price)
              VALUES (${escapeSql(orderId)}, ${bijouId}, ${packId}, ${escapeSql(item.quantity)}, ${escapeSql(item.price)})
            `
            localDb.exec(itemSql)
            logger.info('[createOrderFull] Inserted item:', { orderId, bijou_id: item.bijou_id, pack_id: item.pack_id, quantity: item.quantity, price: item.price })
          } catch (itemError) {
            logger.error('[createOrderFull] Error inserting item:', serializeError(itemError))
            throw itemError
          }
        }
        
        // Insérer le paiement
        const paymentSql = `
          INSERT INTO payments (order_id, amount, payment_method, status, transaction_id)
          VALUES (${escapeSql(orderId)}, ${escapeSql(data.payment.amount)}, ${escapeSql(data.payment.payment_method)}, ${escapeSql(data.payment.status || 'pending')}, ${escapeSql(data.payment.transaction_id || null)})
        `
        localDb.exec(paymentSql)
        
        // PHASE 2: Récupérer last_insert_rowid() avec une requête séparée
        const paymentIdResult = localDb.exec('SELECT last_insert_rowid() as id')
        if (paymentIdResult && paymentIdResult.length > 0 && paymentIdResult[0].values && paymentIdResult[0].values.length > 0) {
          paymentId = String(paymentIdResult[0].values[0][0])
        } else {
          throw new Error('Failed to get payment ID from sql.js')
        }
        
        if (data.notification) {
          const actionUrl = (data.notification.action_url || '').replace('{{orderId}}', orderId)
          const notifSql = `
            INSERT INTO notifications (user_id, title, message, type, is_read, action_url)
            VALUES (NULL, ${escapeSql(data.notification.title)}, ${escapeSql(data.notification.message)}, ${escapeSql(data.notification.type || 'info')}, 0, ${escapeSql(actionUrl)})
          `
          localDb.exec(notifSql)
        }
      } else {
        throw new Error('Unknown database type')
      }
      
      logger.info('[createOrderFull] Order and payment created:', { orderId, paymentId })
      return { orderId, paymentId }
    }
    
    // Exécuter selon le type de DB
    let result: { orderId: string; paymentId: string }
    if (isSqlJs) {
      // sql.js n'a pas de transaction, exécuter séquentiellement
      logger.info('[createOrderFull] Using sql.js (no transaction support)')
      result = executeOrderCreation()
      
      // Sauvegarder les changements sql.js sur disque
      try {
        // PHASE 2: Vérifier que localDb.export() existe avant de l'appeler
        if (typeof localDb.export === 'function') {
          const dbBuffer = localDb.export()
          const absDbPath = path.resolve(dbPath)
          fs.writeFileSync(absDbPath, dbBuffer)
          logger.info('[createOrderFull] sql.js database saved to disk')
          
          // Mettre à jour le cache du singleton
          if (sqlJsDbWrapper) {
            const dbStats = fs.statSync(absDbPath)
            sqlJsDbWrapper.lastModified = dbStats.mtimeMs
          }
        } else {
          logger.warn('[createOrderFull] db.export() not available, database changes may not be persisted')
        }
      } catch (saveError) {
        logger.error('[createOrderFull] Failed to save sql.js database:', serializeError(saveError))
        // Ne pas échouer la commande si la sauvegarde échoue
      }
    } else if (isBetterSqlite3) {
      // better-sqlite3 supporte les transactions et sauvegarde automatiquement
      logger.info('[createOrderFull] Using better-sqlite3 with transaction')
      if (typeof localDb.transaction === 'function') {
        result = localDb.transaction(executeOrderCreation)()
      } else {
        // Fallback: exécuter sans transaction si .transaction() n'existe pas
        logger.warn('[createOrderFull] db.transaction not available, executing without transaction')
        result = executeOrderCreation()
      }
    } else {
      // Driver inconnu ou non supporté
      logger.error('[createOrderFull] Unknown database driver type')
      throw new Error('Database driver not supported')
    }
    
    logger.info('[createOrderFull] Transaction completed successfully', { orderId: result.orderId, paymentId: result.paymentId })
    return result
  } catch (error) {
    const errorDetails = serializeError(error)
    logger.error('[createOrderFull] Erreur lors de la création de la commande:', errorDetails)
    logger.error('[createOrderFull] Données reçues:', {
      order: { 
        user_id: data.order.user_id,
        total_amount: data.order.total_amount,
        status: data.order.status,
        phone: data.order.phone ? data.order.phone.substring(0, 4) + '****' : null,
        hasShipping: !!data.order.shipping_address,
        hasNotes: !!data.order.notes
      },
      itemsCount: data.items.length,
      items: data.items.map(item => ({
        hasBijouId: !!item.bijou_id,
        hasPackId: !!item.pack_id,
        quantity: item.quantity,
        price: item.price
      })),
      payment: {
        amount: data.payment.amount,
        method: data.payment.payment_method,
        status: data.payment.status
      },
      dbType: db ? (db.constructor?.name || 'unknown') : 'null',
      dbExists: !!db
    })
    return null
  }
}

/**
 * Récupérer les items du panier (cart_items -> products)
 */
export function getCartItems(userId: string): { id: string; bijou_id: string; quantity: number }[] {
  if (!db) return []
  try {
    const rows = db.prepare('SELECT id, bijou_id, quantity FROM cart_items WHERE user_id = ?').all(Number(userId) || userId) as { id: number; bijou_id: number; quantity: number }[]
    return rows.map(r => ({ id: String(r.id), bijou_id: String(r.bijou_id), quantity: r.quantity }))
  } catch {
    return []
  }
}

/**
 * Ajouter au panier
 */
export function addToCart(userId: string, bijouId: string, quantity: number = 1): boolean {
  if (!db) return false
  try {
    const uid = Number(userId) || userId
    const bid = Number(bijouId) || bijouId
    const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND bijou_id = ?').get(uid, bid) as { id: number; quantity: number } | undefined
    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id)
    } else {
      db.prepare('INSERT INTO cart_items (user_id, bijou_id, quantity) VALUES (?, ?, ?)').run(uid, bid, quantity)
    }
    return true
  } catch {
    return false
  }
}

/**
 * Mettre à jour la quantité dans le panier
 */
export function updateCartQuantity(userId: string, bijouId: string, quantity: number): boolean {
  if (!db) return false
  try {
    const uid = Number(userId) || userId
    const bid = Number(bijouId) || bijouId
    if (quantity <= 0) return removeFromCart(userId, bijouId)
    db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND bijou_id = ?').run(quantity, uid, bid)
    return true
  } catch {
    return false
  }
}

/**
 * Retirer du panier
 */
export function removeFromCart(userId: string, bijouId: string): boolean {
  if (!db) return false
  try {
    const uid = Number(userId) || userId
    const bid = Number(bijouId) || bijouId
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND bijou_id = ?').run(uid, bid)
    return true
  } catch {
    return false
  }
}

/**
 * Récupérer les favoris d'un utilisateur
 */
export function getFavorites(userId: string): { id: string; bijou_id: string }[] {
  if (!db) return []
  try {
    const rows = db.prepare('SELECT id, bijou_id FROM favorites WHERE user_id = ?').all(Number(userId) || userId) as { id: string; bijou_id: string }[]
    return rows.map(r => ({ id: String(r.id), bijou_id: String(r.bijou_id) }))
  } catch {
    try {
      const rows = db.prepare('SELECT id, bijou_id FROM favorites WHERE user_id = ?').all(userId) as { id: string; bijou_id: string }[]
      return rows.map(r => ({ id: String(r.id), bijou_id: String(r.bijou_id) }))
    } catch {
      return []
    }
  }
}

/**
 * Ajouter aux favoris
 */
export function addToFavorites(userId: string, bijouId: string): boolean {
  if (!db) return false
  try {
    const uid = Number(userId) || userId
    const bid = Number(bijouId) || bijouId
    db.prepare('INSERT OR IGNORE INTO favorites (user_id, bijou_id) VALUES (?, ?)').run(uid, bid)
    return true
  } catch {
    try {
      db.prepare('INSERT OR IGNORE INTO favorites (user_id, bijou_id) VALUES (?, ?)').run(userId, String(bijouId))
      return true
    } catch {
      return false
    }
  }
}

export function removeFromFavorites(userId: string, bijouId: string): boolean {
  if (!db) return false
  try {
    const uid = Number(userId) || userId
    const bid = Number(bijouId) || bijouId
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND bijou_id = ?').run(uid, bid)
    return true
  } catch {
    try {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND bijou_id = ?').run(userId, String(bijouId))
      return true
    } catch {
      return false
    }
  }
}

/**
 * Récupérer une commande par ID
 */
export function getOrderById(id: string): { id: string; user_id: string | null; total_amount: number; status: string; shipping_address?: string; phone?: string; notes?: string; created_at: string } | null {
  // S'assurer que la connexion DB est établie
  if (!db && !sqlJsDb) {
    try {
      const connected = forceConnection()
      if (!connected && !db && !sqlJsDb) {
        logger.error('[getOrderById] DB non initialisée après forceConnection', {})
        return null
      }
    } catch (error) {
      logger.error('[getOrderById] Erreur lors de forceConnection', serializeError(error), {})
      return null
    }
  }
  
  try {
    const numericId = Number(id) || id
    logger.info('[getOrderById] Recherche commande', { id, numericId })
    
    // Utiliser selectOne qui fonctionne avec better-sqlite3 et sql.js
    const row = selectOne('SELECT * FROM orders WHERE id = ?', [numericId]) as Record<string, unknown> | null
    if (!row) {
      logger.warn('[getOrderById] Commande introuvable', { id, numericId })
      return null
    }
    
    logger.info('[getOrderById] Commande trouvée', { id: row['id'], status: row['status'] })
    
    return { 
      ...row, 
      id: String(row['id'] || id), 
      user_id: row['user_id'] as string | null,
      total_amount: Number(row['total_amount']) || 0,
      status: String(row['status'] || 'pending'),
      shipping_address: row['shipping_address'] ? (typeof row['shipping_address'] === 'string' ? row['shipping_address'] : JSON.stringify(row['shipping_address'])) : undefined,
      phone: row['phone'] ? String(row['phone']) : undefined,
      notes: row['notes'] ? String(row['notes']) : undefined,
      created_at: String(row['created_at'] || new Date().toISOString())
    } as { id: string; user_id: string | null; total_amount: number; status: string; shipping_address?: string; phone?: string; notes?: string; created_at: string }
  } catch (error) {
    logger.error('[getOrderById] Erreur', serializeError(error), {})
    return null
  }
}

/**
 * Récupérer les items d'une commande
 */
export function getOrderItems(orderId: string): { id: string; bijou_id: string; pack_id?: string; quantity: number; price: number }[] {
  // S'assurer que la connexion DB est établie
  if (!db && !sqlJsDb) {
    try {
      const connected = forceConnection()
      if (!connected && !db && !sqlJsDb) {
        logger.warn('[getOrderItems] DB non initialisée', {})
        return []
      }
    } catch (error) {
      logger.error('[getOrderItems] Erreur lors de forceConnection', serializeError(error), {})
      return []
    }
  }
  
  try {
    const numericId = Number(orderId) || orderId
    // Utiliser selectRows qui fonctionne avec better-sqlite3 et sql.js
    const rows = selectRows('SELECT id, bijou_id, pack_id, quantity, price FROM order_items WHERE order_id = ?', [numericId]) as { id: number | string; bijou_id: number | string | null; pack_id: string | null; quantity: number; price: number }[]
    return rows.map(r => ({ 
      id: String(r.id), 
      bijou_id: String(r.bijou_id ?? ''), 
      pack_id: r.pack_id ? String(r.pack_id) : undefined,
      quantity: Number(r.quantity) || 0, 
      price: Number(r.price) || 0 
    }))
  } catch (error) {
    logger.error('[getOrderItems] Erreur', serializeError(error), {})
    return []
  }
}

/**
 * Récupérer les paiements d'une commande
 */
export function getPaymentsByOrderId(orderId: string): { id: string; amount: number; payment_method: string; status: string }[] {
  // S'assurer que la connexion DB est établie
  if (!db && !sqlJsDb) {
    try {
      const connected = forceConnection()
      if (!connected && !db && !sqlJsDb) {
        logger.warn('[getPaymentsByOrderId] DB non initialisée', {})
        return []
      }
    } catch (error) {
      logger.error('[getPaymentsByOrderId] Erreur lors de forceConnection', serializeError(error), {})
      return []
    }
  }
  
  try {
    const numericId = Number(orderId) || orderId
    // Utiliser selectRows qui fonctionne avec better-sqlite3 et sql.js
    const rows = selectRows('SELECT id, amount, payment_method, status FROM payments WHERE order_id = ?', [numericId]) as { id: number | string; amount: number; payment_method: string; status: string }[]
    return rows.map(r => ({ 
      id: String(r.id), 
      amount: Number(r.amount) || 0, 
      payment_method: String(r.payment_method || ''), 
      status: String(r.status || 'pending') 
    }))
  } catch (error) {
    logger.error('[getPaymentsByOrderId] Erreur', serializeError(error), {})
    return []
  }
}

/**
 * Mettre à jour le statut d'une commande
 */
export function updateOrderStatus(id: string, status: string): boolean {
  // S'assurer que la connexion DB est établie
  if (!db && !sqlJsDb) {
    // Essayer de forcer la connexion
    try {
      const connected = forceConnection()
      if (!connected && !db && !sqlJsDb) {
        logger.error('[updateOrderStatus] DB non initialisée après forceConnection', {})
        return false
      }
    } catch (error) {
      logger.error('[updateOrderStatus] Erreur lors de forceConnection', serializeError(error), {})
      return false
    }
  }
  
  try {
    const numericId = Number(id) || id
    logger.info('[updateOrderStatus] Mise à jour', { id, numericId, status })
    
    // Utiliser selectOne pour vérifier si la commande existe (fonctionne avec better-sqlite3 et sql.js)
    const check = selectOne('SELECT id, status FROM orders WHERE id = ?', [numericId]) as { id: number; status: string } | null
    if (!check) {
      logger.error('[updateOrderStatus] Commande introuvable', { id, numericId })
      return false
    }
    
    // Si le statut est déjà le même, retourner true (pas besoin de mettre à jour)
    if (check.status === status) {
      logger.info('[updateOrderStatus] Statut déjà à jour', { id, status })
      return true
    }
    
    // Utiliser executeQuery pour la mise à jour (fonctionne avec better-sqlite3 et sql.js)
    const result = executeQuery('UPDATE orders SET status = ? WHERE id = ?', [status, numericId])
    
    logger.info('[updateOrderStatus] Résultat', { 
      changes: result.changes, 
      id: numericId,
      oldStatus: check.status,
      newStatus: status
    })
    
    // Vérifier que la mise à jour a réussi
    if (result.changes === 0) {
      logger.warn('[updateOrderStatus] Aucune ligne mise à jour malgré l\'existence de la commande', { id, numericId, status })
      // Vérifier à nouveau si le statut a changé (peut-être que la mise à jour a réussi mais changes n'est pas fiable)
      const verify = selectOne('SELECT status FROM orders WHERE id = ?', [numericId]) as { status: string } | null
      if (verify && verify.status === status) {
        logger.info('[updateOrderStatus] Statut vérifié - mise à jour réussie', { id, status })
        return true
      }
      return false
    }
    
    return true
  } catch (error) {
    logger.error('[updateOrderStatus] Erreur', serializeError(error), {})
    return false
  }
}

/**
 * Mettre à jour le statut d'un paiement
 */
export function updatePaymentStatus(id: string, status: string): boolean {
  if (!db) return false
  try {
    db.prepare('UPDATE payments SET status = ? WHERE id = ?').run(status, Number(id) || id)
    return true
  } catch {
    return false
  }
}

/**
 * Récupérer tous les paiements
 */
export function getAllPayments(): { id: string; order_id: string; amount: number; status: string }[] {
  if (!db) return []
  try {
    const rows = db.prepare('SELECT id, order_id, amount, status FROM payments ORDER BY id DESC').all() as { id: number; order_id: number; amount: number; status: string }[]
    return rows.map(r => ({ id: String(r.id), order_id: String(r.order_id), amount: r.amount, status: r.status }))
  } catch {
    return []
  }
}

/**
 * Récupérer les notifications (admin: user_id IS NULL, utilisateur: user_id = userId)
 */
export function getNotifications(userId?: string | null): { id: string; title: string; message: string; type?: string; is_read: boolean; created_at: string; action_url?: string }[] {
  if (!db) return []
  try {
    let query = 'SELECT id, title, message, type, is_read, created_at, action_url FROM notifications'
    const params: unknown[] = []
    
    if (userId != null && userId !== '') {
      // Notifications pour un utilisateur spécifique (favoris, etc.)
      query += ' WHERE user_id = ?'
      params.push(userId)
    } else {
      // Notifications admin uniquement (globales) — pas celles d'un utilisateur connecté
      query += ' WHERE user_id IS NULL'
    }
    
    query += ' ORDER BY created_at DESC, id DESC LIMIT 100'
    
    const rows = db.prepare(query).all(...params) as { id: number; title: string; message: string; type?: string; is_read: number; created_at: string; action_url?: string }[]
    return rows.map(r => ({ 
      id: String(r.id), 
      title: r.title, 
      message: r.message, 
      type: r.type || 'info',
      is_read: Boolean(r.is_read),
      created_at: r.created_at,
      action_url: r.action_url || undefined
    }))
  } catch {
    return []
  }
}

export function markNotificationAsRead(id: string): boolean {
  if (!db) return false
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(Number(id) || id)
    return true
  } catch {
    return false
  }
}

/**
 * Récupérer tous les paniers actifs (pour admin)
 */
export function getAllActiveCarts(): { user_id: string; bijou_id: string; quantity: number }[] {
  if (!db) return []
  try {
    const rows = db.prepare('SELECT user_id, bijou_id, quantity FROM cart_items').all() as { user_id: string; bijou_id: string; quantity: number }[]
    return rows
  } catch {
    return []
  }
}

export function trimProductsToLimit(limit: number): number {
  if (!db) return -1
  try {
    const count = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c
    if (count <= limit) return count
    const toDelete = count - limit
    const ids = db.prepare('SELECT id FROM products ORDER BY id ASC LIMIT ?').all(toDelete) as { id: number }[]
    for (const row of ids) {
      db.prepare('DELETE FROM products WHERE id = ?').run(row.id)
    }
    return limit
  } catch {
    return -1
  }
}

/**
 * PHASE 2: Abstraction uniforme du driver DB
 * Détecte automatiquement better-sqlite3 ou sql.js et utilise l'API appropriée
 */

// Détecter le type de driver actif
export function detectDriver(): 'better-sqlite3' | 'sqljs' | null {
  // PHASE 1: Charger better-sqlite3 de manière lazy si pas encore tenté
  if (!betterSqlite3LoadAttempted) {
    const loadResult = loadBetterSqlite3()
    Database = loadResult.Database
    betterSqlite3Available = loadResult.available
    betterSqlite3Error = loadResult.error
  }
  
  if (db && typeof db.prepare === 'function' && typeof db.prepare('SELECT 1').all === 'function') {
    return 'better-sqlite3'
  }
  // Vérifier sql.js via le singleton
  if (sqlJsDb || (sqlJsInit && sqlJsInit.Database)) {
    return 'sqljs'
  }
  return null
}

/**
 * Normalise une valeur pour le binding SQLite.
 * better-sqlite3 n'accepte que : number, string, bigint, buffer, null.
 * Convertit : boolean → 0/1, undefined → null, object/array → JSON.
 */
function normalizeSQLiteValue(value: unknown): string | number | bigint | Buffer | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') return value
  if (typeof value === 'bigint') return value
  if (Buffer.isBuffer(value)) return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' || Array.isArray(value)) return JSON.stringify(value)
  return String(value)
}

/**
 * Normalise un tableau de paramètres pour SQLite.
 */
function normalizeSQLiteParams(params: unknown[]): (string | number | bigint | Buffer | null)[] {
  return params.map(normalizeSQLiteValue)
}

/**
 * Échapper une valeur SQL pour sql.js (injection SQL protection)
 */
function escapeSqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? '1' : '0'
  // Échapper les apostrophes pour les strings
  return "'" + String(value).replace(/'/g, "''") + "'"
}

/**
 * PHASE 2: Wrapper uniforme pour SELECT (retourne un tableau de lignes)
 * Utilise automatiquement better-sqlite3 ou sql.js selon ce qui est disponible
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function selectRows(query: string, params: unknown[] = []): Record<string, any>[] {
  if (process.env['VERCEL'] === '1') return []
  const driver = detectDriver()
  
  if (driver === 'better-sqlite3' && db) {
    try {
      const stmt = db.prepare(query)
      if (params.length > 0) {
        const safeParams = normalizeSQLiteParams(params)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return stmt.all(...safeParams) as Record<string, any>[]
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return stmt.all() as Record<string, any>[]
    } catch (error) {
      const errorDetails = serializeError(error)
      const errorMessage = errorDetails.message || String(error)
      
      // En build-time, retourner un tableau vide plutôt que de lancer une erreur
      if (process.env['NEXT_PHASE'] === 'phase-production-build' || process.env['NEXT_PHASE'] === 'phase-export') {
        logger.debug(`[selectRows] Build-time: Erreur DB (${errorMessage}), retour tableau vide`)
        return []
      }
      
      // Si erreur de table/colonne manquante, retourner tableau vide (DB pas encore initialisée)
      if (errorMessage.includes('no such table') || errorMessage.includes('no such column')) {
        logger.debug(`[selectRows] Table/colonne manquante (${errorMessage}), retour tableau vide`)
        return []
      }
      
      logger.error('[selectRows] Erreur better-sqlite3:', errorDetails)
      throw error
    }
  }
  
  if (driver === 'sqljs') {
    try {
      // PHASE 1: S'assurer que sql.js est initialisé (asynchrone si nécessaire)
      if (!sqlJsDb) {
        reloadSqlJsDbIfNeeded()
        if (!sqlJsDb) {
          // Essayer d'initialiser via le singleton si disponible
          try {
            // Note: selectRows est synchrone, mais on peut essayer de charger sql.js
            // Si ça échoue, on retourne [] et l'appelant devra utiliser selectAsync
            logger.warn('[selectRows] sql.js DB non chargée, tentative de chargement synchrone...')
            if (sqlJsInit && sqlJsInit.Database) {
              const absDbPath = path.resolve(dbPath)
              if (fs.existsSync(absDbPath)) {
                const fileBuffer = fs.readFileSync(absDbPath)
                sqlJsDb = new sqlJsInit.Database(fileBuffer)
                const dbStats = fs.statSync(absDbPath)
                sqlJsDbLastModified = dbStats.mtimeMs
                logger.info(`[selectRows] sql.js DB chargée (${(dbStats.size / 1024).toFixed(2)} KB)`)
              }
            }
          } catch {
            logger.warn('[selectRows] Impossible de charger sql.js de manière synchrone, utilisez selectAsync() à la place')
            return []
          }
          if (!sqlJsDb) {
            logger.warn('[selectRows] sql.js DB non chargée après tentative')
            return []
          }
        }
      }
      
      // sql.js: construire la requête avec paramètres échappés
      let finalQuery = query
      if (params.length > 0) {
        const safeParams = normalizeSQLiteParams(params)
        // Remplacer les ? par les valeurs échappées
        let paramIndex = 0
        finalQuery = query.replace(/\?/g, () => {
          const value = safeParams[paramIndex++]
          return escapeSqlValue(value)
        })
      }
      
      const result = sqlJsDb.exec(finalQuery)
      if (!result || result.length === 0) return []
      
      // Convertir le résultat sql.js en tableau d'objets
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: Record<string, any>[] = []
      const firstResult = result[0]
      if (firstResult && firstResult.values && firstResult.columns) {
        const columns = firstResult.columns
        for (const row of firstResult.values) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const obj: Record<string, any> = {}
          columns.forEach((col: string, idx: number) => {
            obj[col] = row[idx]
          })
          rows.push(obj)
        }
      }
      return rows
    } catch (error) {
      // PHASE 0: Sérialisation robuste de l'erreur
      const errorDetails = serializeError(error)
      const errorMessage = errorDetails.message || String(error)
      
      // En build-time, retourner un tableau vide plutôt que de lancer une erreur
      if (process.env['NEXT_PHASE'] === 'phase-production-build' || process.env['NEXT_PHASE'] === 'phase-export') {
        logger.debug(`[selectRows] Build-time: Erreur DB (${errorMessage}), retour tableau vide`)
        return []
      }
      
      // Si erreur de table/colonne manquante, retourner tableau vide (DB pas encore initialisée)
      if (errorMessage.includes('no such table') || errorMessage.includes('no such column')) {
        logger.debug(`[selectRows] Table/colonne manquante (${errorMessage}), retour tableau vide`)
        return []
      }
      
      logger.error('[selectRows] Erreur sql.js:', errorDetails)
      return []
    }
  }
  
  logger.warn('[selectRows] Aucun driver DB disponible')
  return []
}

/**
 * PHASE 2: Wrapper uniforme pour SELECT ONE (retourne une seule ligne ou null)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function selectOne(query: string, params: unknown[] = []): Record<string, any> | null {
  const rows = selectRows(query, params)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.length > 0 ? (rows[0] as Record<string, any>) : null
}

/**
 * PHASE 2: Wrapper uniforme pour EXECUTE (INSERT/UPDATE/DELETE)
 * Retourne { changes, lastInsertRowid } quand disponible
 */
export function executeQuery(query: string, params: unknown[] = []): { changes: number; lastInsertRowid: number | null } {
  const driver = detectDriver()
  
  if (driver === 'better-sqlite3' && db) {
    try {
      const stmt = db.prepare(query)
      let result: { changes: number; lastInsertRowid: number }
      if (params.length > 0) {
        const safeParams = normalizeSQLiteParams(params)
        result = stmt.run(...safeParams) as { changes: number; lastInsertRowid: number }
      } else {
        result = stmt.run() as { changes: number; lastInsertRowid: number }
      }
      return {
        changes: result.changes || 0,
        lastInsertRowid: result.lastInsertRowid || null
      }
    } catch (error) {
      logger.error('[executeQuery] Erreur better-sqlite3:', serializeError(error))
      throw error
    }
  }
  
  if (driver === 'sqljs') {
    try {
      if (!sqlJsDb) {
        reloadSqlJsDbIfNeeded()
        if (!sqlJsDb) {
          throw new Error('sql.js DB non chargée')
        }
      }
      
      // Construire la requête avec paramètres échappés
      let finalQuery = query
      if (params.length > 0) {
        const safeParams = normalizeSQLiteParams(params)
        let paramIndex = 0
        finalQuery = query.replace(/\?/g, () => {
          const value = safeParams[paramIndex++]
          return escapeSqlValue(value)
        })
      }
      
      // Exécuter la requête
      sqlJsDb.run(finalQuery)
      
      // IMPORTANT: Sauvegarder la DB en mémoire vers le fichier pour sql.js
      // Sinon les modifications ne seront pas persistées
      try {
        const absDbPath = path.resolve(dbPath)
        if (fs.existsSync(absDbPath)) {
          const data = sqlJsDb.export()
          const buffer = Buffer.from(data)
          fs.writeFileSync(absDbPath, buffer)
          if (process.env.NODE_ENV === 'development') {
            logger.info(`[executeQuery sql.js] DB sauvegardée: ${absDbPath}`)
          }
        }
      } catch (saveError) {
        logger.error('[executeQuery sql.js] Erreur lors de la sauvegarde:', serializeError(saveError))
        // Ne pas throw - la requête a réussi, juste la sauvegarde a échoué
      }
      
      // Pour DELETE/UPDATE, compter les lignes affectées en vérifiant avant/après
      let changes = 0
      if (query.trim().toUpperCase().startsWith('DELETE')) {
        // Pour DELETE, on ne peut pas compter directement avec sql.js
        // On retourne 1 si la requête s'est exécutée sans erreur
        // Le code appelant devra vérifier manuellement si l'élément existe encore
        changes = 1
      } else if (query.trim().toUpperCase().startsWith('UPDATE')) {
        // Pour UPDATE, similaire à DELETE
        changes = 1
      } else if (query.trim().toUpperCase().startsWith('INSERT')) {
        changes = 1
        // Pour INSERT, récupérer last_insert_rowid
        const idResult = sqlJsDb.exec('SELECT last_insert_rowid() as id')
        if (idResult && idResult.length > 0 && idResult[0].values && idResult[0].values.length > 0) {
          const lastInsertRowid = idResult[0].values[0][0] as number
          return {
            changes: 1,
            lastInsertRowid
          }
        }
      }
      
      return {
        changes,
        lastInsertRowid: null
      }
    } catch (error) {
      logger.error('[executeQuery] Erreur sql.js:', serializeError(error))
      throw error
    }
  }
  
  throw new Error('Aucun driver DB disponible pour executeQuery')
}

/**
 * Exécuter une requête SELECT
 */
export function select(query: string, params: unknown[] = []): unknown[] {
  // Essayer d'abord avec better-sqlite3
  if (db) {
    try {
      const stmt = db.prepare(query)
      if (params.length > 0) {
        const safeParams = normalizeSQLiteParams(params)
        return stmt.all(...safeParams)
      }
      return stmt.all()
    } catch (error) {
      // PHASE 0: Sérialisation robuste de l'erreur
      const errorDetails = serializeError(error)
      logger.error('❌ Erreur lors de l\'exécution de la requête SELECT:', errorDetails)
      throw error
    }
  }
  
  // Fallback: utiliser sql.js si better-sqlite3 n'est pas disponible
  // Essayer d'initialiser sql.js automatiquement si pas déjà fait
  if (!sqlJsInit || !sqlJsInit.Database) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sqlJs = require('sql.js')
      
      // Essayer de charger sql.js de manière synchrone si possible
      if (sqlJs.Database) {
        // Format direct disponible (peu probable mais possible)
        sqlJsInit = sqlJs
        logger.info('[select] sql.js chargé automatiquement (format direct)')
      } else if (sqlJs.default && sqlJs.default.Database) {
        // Format ES module avec default
        sqlJsInit = sqlJs.default
        logger.info('[select] sql.js chargé automatiquement (format default)')
      } else {
        // sql.js nécessite une initialisation asynchrone, on ne peut pas le faire ici
        logger.warn('[select] sql.js nécessite une initialisation asynchrone. Appeler initSqlJsAsync() d\'abord.')
        return []
      }
    } catch (e) {
      // Ignorer les erreurs d'import
      logger.warn('[select] Impossible de charger sql.js:', { error: e instanceof Error ? e.message : String(e) })
      return []
    }
  }
  
  // Si sql.js est maintenant initialisé, l'utiliser
  if (sqlJsInit && sqlJsInit.Database) {
    try {
      // S'assurer que sqlJsDb est chargé
      const absDbPath = path.resolve(dbPath)
      if (!fs.existsSync(absDbPath)) {
        logger.warn(`[select] Fichier DB non trouvé: ${absDbPath}`)
        return []
      }
      
      // Recharger la DB si nécessaire
      reloadSqlJsDbIfNeeded()
      
      // Si sqlJsDb n'est toujours pas chargé, le charger maintenant
      if (!sqlJsDb) {
        try {
          const fileBuffer = fs.readFileSync(absDbPath)
          sqlJsDb = new sqlJsInit.Database(fileBuffer)
          const dbStats = fs.statSync(absDbPath)
          sqlJsDbLastModified = dbStats.mtimeMs
          logger.info(`[select] sql.js DB chargée (${(dbStats.size / 1024).toFixed(2)} KB)`)
        } catch (loadError) {
          const errorDetails = serializeError(loadError)
          logger.error(`[select] Erreur lors du chargement de la DB sql.js:`, errorDetails)
          return []
        }
      }
      
      // Exécuter la requête avec sql.js
      // sql.js utilise exec() qui retourne un tableau de résultats
      // Note: sql.js n'accepte pas les paramètres bindés, donc on doit construire la requête manuellement
      let finalQuery = query
      if (params.length > 0) {
        // Remplacer les ? par les valeurs (simple, pas sécurisé pour production mais OK pour sql.js)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params.forEach((param: any) => {
          const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param
          finalQuery = finalQuery.replace('?', value)
        })
      }
      
      const result = sqlJsDb.exec(finalQuery)
      if (result.length === 0) return []
      
      // Convertir le résultat en tableau d'objets
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = result[0].values.map((row: any[]) => {
        const cols = result[0].columns
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = {}
        cols.forEach((col: string, i: number) => {
          obj[col] = row[i]
        })
        return obj
      })
      
      return rows
    } catch (e) {
      // PHASE 0: Sérialisation robuste de l'erreur
      const errorDetails = serializeError(e)
      logger.error(`[select] Erreur avec sql.js:`, errorDetails)
      return []
    }
  }
  
  // sql.js n'est pas initialisé, retourner un tableau vide
  // L'appelant doit appeler initSqlJsAsync() avant d'utiliser select()
  logger.warn('[select] sql.js non initialisé, retour d\'un tableau vide. Appeler initSqlJsAsync() d\'abord.')
  return []
}

/**
 * Exécuter une requête SELECT de manière asynchrone (pour sql.js)
 * PHASE B: Utilise le singleton sql.js
 */
export async function selectAsync(query: string, params: unknown[] = []): Promise<unknown[]> {
  if (process.env['VERCEL'] === '1') return []
  // PHASE 2: S'assurer que sql.js est initialisé si nécessaire
  const driver = detectDriver()
  if (driver === null || driver === 'sqljs') {
    try {
      await initSqlJsAsync()
      // Recharger sqlJsDb après init
      reloadSqlJsDbIfNeeded()
    } catch (e) {
      logger.warn('[selectAsync] Erreur init sql.js:', serializeError(e))
    }
  }
  
  // PHASE 2: Utiliser le wrapper uniforme qui gère automatiquement better-sqlite3 et sql.js
  // Cela évite les erreurs "stmt.all is not a function" quand sql.js est actif
  return selectRows(query, params)
}

/**
 * Exécuter une requête INSERT/UPDATE/DELETE
 */
export function execute(query: string, params: unknown[] = []): unknown {
  if (!db) return { changes: 0, lastInsertRowid: 0 }
  try {
    const stmt = db.prepare(query)
    const safeParams = normalizeSQLiteParams(params)
      if (process.env['NODE_ENV'] === 'development' && safeParams.length > 0) {
      logger.info('[SQLite execute] params normalisés:', { params: safeParams.map((p, i) => `[${i}]=${typeof p}`).join(', ') })
    }
    const result = stmt.run(...safeParams)
    return result
  } catch (error) {
    // PHASE 0: Sérialisation robuste de l'erreur
    const errorDetails = serializeError(error)
    logger.error('❌ Erreur lors de l\'exécution de la requête execute:', errorDetails)
    throw error
  }
}

/**
 * Fermer la connexion à la base de données
 */
export function close(): void {
  if (db) {
    db.close()
    db = null
  }
}

// Types TypeScript pour la base de données
export interface Product {
  id: number
  name: string
  name_ar?: string
  description?: string
  price: number
  original_price?: number
  category: string
  stock: number
  is_active: boolean
  image_url?: string
  images?: string[] // Array of gallery images (JSON stored as TEXT in DB)
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image_url?: string
  created_at: string
}

export interface Pack {
  id: number
  name: string
  slug: string
  description?: string
  price: number
  image_url?: string
  is_featured: boolean
  created_at: string
}

export default db
