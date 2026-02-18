/**
 * Script de migration SQLite → Postgres
 * 
 * Fonctionnalités:
 * - Mode dry-run pour tester sans modifier
 * - Idempotent (peut être relancé en toute sécurité)
 * - Validation des comptes (rows migrated)
 * - Logs détaillés sans données sensibles
 * - Gestion correcte des colonnes JSON
 * 
 * Usage:
 *   npm run db:migrate                    # Mode dry-run (par défaut)
 *   npm run db:migrate -- --execute       # Migration réelle
 */

import { Pool } from 'pg'
import * as fs from 'fs'
import { getDbPath, getBetterSqlite3Db } from '../lib/sqlite'
import { getSqlJsDb } from '../lib/sqljs-singleton'
import { logger } from '../lib/logger'

interface MigrationStats {
  tables: Record<string, { source: number; migrated: number; errors: number }>
  totalRows: number
  totalErrors: number
  duration: number
}

/**
 * Obtenir la connexion Postgres depuis DATABASE_URL
 */
function getPostgresPool(): Pool {
  const databaseUrl = process.env['DATABASE_URL']
  if (!databaseUrl) {
    throw new Error('DATABASE_URL non défini. Configurez votre base Postgres sur Vercel.')
  }

  return new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  })
}

/**
 * Obtenir la connexion SQLite
 */
async function getSqliteConnection() {
  // Essayer better-sqlite3 d'abord
  const betterSqlite3Db = getBetterSqlite3Db()
  if (betterSqlite3Db) {
    return { type: 'better-sqlite3' as const, db: betterSqlite3Db }
  }

  // Fallback sur sql.js
  const sqlJsDb = await getSqlJsDb()
  return { type: 'sql.js' as const, db: sqlJsDb.db }
}

/**
 * Créer les tables Postgres si elles n'existent pas
 */
async function createPostgresTables(pool: Pool, dryRun: boolean): Promise<void> {
  const createTablesSQL = `
    -- Table products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      category TEXT,
      stock INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      image_url TEXT,
      images TEXT, -- JSON string
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT
    );

    -- Table packs
    CREATE TABLE IF NOT EXISTS packs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      image_url TEXT,
      is_featured INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      stock_quantity INTEGER DEFAULT 0,
      min_items INTEGER DEFAULT 1,
      max_items INTEGER DEFAULT 5,
      discount TEXT, -- JSON string
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table orders
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_address TEXT,
      shipping_phone TEXT,
      shipping_name TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Table order_items
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT,
      pack_id TEXT,
      product_name TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    -- Table cart_items
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Table favorites
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, product_id)
    );

    -- Table payments
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      transaction_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    -- Table notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      action_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  if (dryRun) {
    logger.info('[DRY-RUN] Tables Postgres seraient créées')
    return
  }

  await pool.query(createTablesSQL)
  logger.info('✅ Tables Postgres créées/vérifiées')
}

/**
 * Migrer une table depuis SQLite vers Postgres
 */
async function migrateTable(
  tableName: string,
  sqliteConn: { type: 'better-sqlite3' | 'sql.js'; db: any },
  postgresPool: Pool,
  dryRun: boolean
): Promise<{ source: number; migrated: number; errors: number }> {
  let sourceRows: any[] = []
  let sourceCount = 0

  // Lire depuis SQLite
  try {
    if (sqliteConn.type === 'better-sqlite3') {
      sourceRows = sqliteConn.db.prepare(`SELECT * FROM ${tableName}`).all() as any[]
      sourceCount = sourceRows.length
    } else {
      // sql.js
      const result = sqliteConn.db.exec(`SELECT * FROM ${tableName}`)
      if (result.length > 0 && result[0].values) {
        const columns = result[0].columns
        sourceRows = result[0].values.map((row: any[]) => {
          const obj: any = {}
          columns.forEach((col: string, i: number) => {
            obj[col] = row[i]
          })
          return obj
        })
        sourceCount = sourceRows.length
      }
    }
  } catch (error) {
    logger.warn(`⚠️ Table ${tableName} non trouvée dans SQLite (ignorée)`)
    return { source: 0, migrated: 0, errors: 0 }
  }

  if (sourceCount === 0) {
    logger.info(`ℹ️ Table ${tableName}: 0 ligne (ignorée)`)
    return { source: 0, migrated: 0, errors: 0 }
  }

  logger.info(`📦 Table ${tableName}: ${sourceCount} ligne(s) à migrer`)

  if (dryRun) {
    logger.info(`[DRY-RUN] ${sourceCount} ligne(s) de ${tableName} seraient migrées`)
    return { source: sourceCount, migrated: 0, errors: 0 }
  }

  // Insérer dans Postgres
  let migrated = 0
  let errors = 0

  for (const row of sourceRows) {
    try {
      // Construire la requête INSERT dynamique
      const columns = Object.keys(row).filter(k => row[k] !== null && row[k] !== undefined)
      const values = columns.map((_, i) => `$${i + 1}`).join(', ')
      const columnNames = columns.join(', ')
      const rowValues = columns.map(col => {
        const val = row[col]
        // Gérer les JSON strings
        if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
          try {
            JSON.parse(val) // Valider que c'est du JSON valide
            return val // Garder comme string, Postgres peut le parser
          } catch {
            return val // Pas du JSON, garder comme string
          }
        }
        return val
      })

      const insertSQL = `
        INSERT INTO ${tableName} (${columnNames})
        VALUES (${values})
        ON CONFLICT (id) DO NOTHING
      `

      await postgresPool.query(insertSQL, rowValues)
      migrated++
    } catch (error) {
      errors++
      logger.warn(`⚠️ Erreur migration ligne ${tableName}:`, {
        error: error instanceof Error ? error.message : String(error),
        rowId: row.id || 'unknown'
      })
    }
  }

  logger.info(`✅ Table ${tableName}: ${migrated}/${sourceCount} ligne(s) migrée(s)${errors > 0 ? `, ${errors} erreur(s)` : ''}`)

  return { source: sourceCount, migrated, errors }
}

/**
 * Fonction principale de migration
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  logger.info(`🚀 Migration SQLite → Postgres (${dryRun ? 'DRY-RUN' : 'EXECUTION'})`)

  // Vérifier DATABASE_URL
  if (!process.env['DATABASE_URL']) {
    logger.error('❌ DATABASE_URL non défini')
    logger.info('💡 Configurez DATABASE_URL sur Vercel ou dans .env.local')
    process.exit(1)
  }

  // Vérifier que le fichier SQLite existe
  const dbPath = getDbPath()
  if (!fs.existsSync(dbPath)) {
    logger.error(`❌ Fichier SQLite non trouvé: ${dbPath}`)
    process.exit(1)
  }

  logger.info(`📁 Source SQLite: ${dbPath}`)
  logger.info(`📁 Destination Postgres: ${process.env['DATABASE_URL'].replace(/:[^:@]+@/, ':****@')}`)

  const startTime = Date.now()
  const stats: MigrationStats = {
    tables: {},
    totalRows: 0,
    totalErrors: 0,
    duration: 0
  }

  try {
    // Connexions
    const sqliteConn = await getSqliteConnection()
    const postgresPool = getPostgresPool()

    // Tester la connexion Postgres
    try {
      await postgresPool.query('SELECT 1')
      logger.info('✅ Connexion Postgres OK')
    } catch (error) {
      logger.error('❌ Erreur connexion Postgres:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    }

    // Créer les tables Postgres
    await createPostgresTables(postgresPool, dryRun)

    // Liste des tables à migrer (dans l'ordre de dépendance)
    const tablesToMigrate = [
      'categories',
      'users',
      'products',
      'packs',
      'orders',
      'order_items',
      'cart_items',
      'favorites',
      'payments',
      'notifications'
    ]

    // Migrer chaque table
    for (const tableName of tablesToMigrate) {
      const result = await migrateTable(tableName, sqliteConn, postgresPool, dryRun)
      stats.tables[tableName] = result
      stats.totalRows += result.source
      stats.totalErrors += result.errors
    }

    // Fermer les connexions
    await postgresPool.end()
    if (sqliteConn.type === 'better-sqlite3') {
      sqliteConn.db.close()
    }

    stats.duration = Date.now() - startTime

    // Rapport final
    logger.info('\n📊 RAPPORT DE MIGRATION')
    logger.info('='.repeat(50))
    logger.info(`Mode: ${dryRun ? 'DRY-RUN (aucune modification)' : 'EXECUTION'}`)
    logger.info(`Durée: ${(stats.duration / 1000).toFixed(2)}s`)
    logger.info(`Total lignes source: ${stats.totalRows}`)
    logger.info(`Total erreurs: ${stats.totalErrors}`)
    logger.info('\nDétails par table:')
    for (const [table, result] of Object.entries(stats.tables)) {
      if (result.source > 0) {
        logger.info(`  ${table}: ${result.migrated}/${result.source}${result.errors > 0 ? ` (${result.errors} erreurs)` : ''}`)
      }
    }

    if (dryRun) {
      logger.info('\n💡 Pour exécuter la migration réelle, utilisez: npm run db:migrate -- --execute')
    } else {
      logger.info('\n✅ Migration terminée avec succès!')
    }

  } catch (error) {
    logger.error('❌ Erreur fatale lors de la migration:', error)
    process.exit(1)
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch((error) => {
    logger.error('Erreur non gérée:', error)
    process.exit(1)
  })
}

export { main as migrateSqliteToPostgres }
