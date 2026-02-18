#!/usr/bin/env ts-node

/**
 * Script pour appliquer toutes les migrations nécessaires à la base de données
 */

const fs = require('fs')
const path = require('path')

// Utiliser require pour CommonJS
const sqliteModule = require('../lib/sqlite')
const sqljsSingleton = require('../lib/sqljs-singleton')

const getDbPath = sqliteModule.getDbPath
const getSqlJsDb = sqljsSingleton.getSqlJsDb
const getBetterSqlite3Db = sqliteModule.getBetterSqlite3Db || (() => null)

const dbPath = getDbPath()

interface Migration {
  name: string
  sql: string
  checkColumn?: string
  checkTable?: string
}

const MIGRATIONS: Migration[] = [
  {
    name: 'Ajouter colonne is_featured à products',
    sql: `ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT 0`,
    checkColumn: 'is_featured'
  },
  {
    name: 'Ajouter colonne images à products si manquante',
    sql: `ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]'`,
    checkColumn: 'images'
  },
  {
    name: 'Ajouter colonne created_by à products si manquante',
    sql: `ALTER TABLE products ADD COLUMN created_by TEXT`,
    checkColumn: 'created_by'
  },
  {
    name: 'Créer table orders si manquante',
    sql: `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    checkTable: 'orders'
  },
  {
    name: 'Créer table order_items si manquante',
    sql: `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      bijou_id INTEGER,
      pack_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (bijou_id) REFERENCES products(id),
      FOREIGN KEY (pack_id) REFERENCES packs(id)
    )`,
    checkTable: 'order_items'
  },
  {
    name: 'Créer table payments si manquante',
    sql: `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      transaction_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`,
    checkTable: 'payments'
  },
  {
    name: 'Créer table notifications si manquante',
    sql: `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    checkTable: 'notifications'
  },
  {
    name: 'Créer table favorites si manquante',
    sql: `CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bijou_id INTEGER,
      pack_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, bijou_id, pack_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (bijou_id) REFERENCES products(id),
      FOREIGN KEY (pack_id) REFERENCES packs(id)
    )`,
    checkTable: 'favorites'
  }
]

async function checkColumnExists(tableName: string, columnName: string, db: any, engine: string): Promise<boolean> {
  try {
    if (engine === 'better-sqlite3') {
      const result = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[]
      return result.some((col: any) => col.name.toLowerCase() === columnName.toLowerCase())
    } else {
      // sql.js
      const result = db.exec(`PRAGMA table_info(${tableName})`)
      if (result.length > 0 && result[0].values) {
        return result[0].values.some((row: any[]) => row[1]?.toLowerCase() === columnName.toLowerCase())
      }
      return false
    }
  } catch {
    return false
  }
}

async function checkTableExists(tableName: string, db: any, engine: string): Promise<boolean> {
  try {
    if (engine === 'better-sqlite3') {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(tableName)
      return !!result
    } else {
      // sql.js
      const result = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='${tableName}'
      `)
      return result.length > 0 && result[0].values && result[0].values.length > 0
    }
  } catch {
    return false
  }
}

async function applyMigrations() {
  console.log('🔄 APPLICATION DES MIGRATIONS')
  console.log('='.repeat(80))
  console.log(`📁 Chemin DB: ${dbPath}`)
  console.log('')

  if (!fs.existsSync(dbPath)) {
    console.log('❌ ERREUR: Le fichier de base de données n\'existe pas!')
    console.log(`   Création du répertoire data si nécessaire...`)
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log(`   ✅ Répertoire créé: ${dataDir}`)
    }
    console.log('   ⚠️  Le fichier DB doit être créé par initializeDatabase()')
    return
  }

  // Détecter le moteur DB
  let db: any = null
  let engine: 'better-sqlite3' | 'sql.js' = 'sql.js'

  if (getBetterSqlite3Db) {
    try {
      const betterSqlite3Db = getBetterSqlite3Db()
      if (betterSqlite3Db) {
        db = betterSqlite3Db
        engine = 'better-sqlite3'
        console.log('✅ Utilisation de better-sqlite3')
      }
    } catch {
      // Continuer avec sql.js
    }
  }

  if (!db) {
    try {
      const sqlJsDbInstance = await getSqlJsDb()
      db = sqlJsDbInstance.db
      engine = 'sql.js'
      console.log('✅ Utilisation de sql.js')
    } catch (e) {
      console.log(`❌ Erreur de connexion: ${e instanceof Error ? e.message : String(e)}`)
      return
    }
  }

  console.log('')
  console.log('📊 VÉRIFICATION DES MIGRATIONS')
  console.log('-'.repeat(80))

  let migrationsAppliquees = 0
  let migrationsDejaPresentes = 0

  for (const migration of MIGRATIONS) {
    let doitAppliquer = false

    if (migration.checkColumn) {
      // Vérifier si la colonne existe
      const tableName = migration.sql.match(/ALTER TABLE (\w+)/i)?.[1] || 'products'
      const existe = await checkColumnExists(tableName, migration.checkColumn, db, engine)
      doitAppliquer = !existe
    } else if (migration.checkTable) {
      // Vérifier si la table existe
      const existe = await checkTableExists(migration.checkTable, db, engine)
      doitAppliquer = !existe
    } else {
      // Pas de vérification, toujours appliquer
      doitAppliquer = true
    }

    if (!doitAppliquer) {
      console.log(`   ⏭️  ${migration.name} - Déjà présente`)
      migrationsDejaPresentes++
      continue
    }

    try {
      if (engine === 'better-sqlite3') {
        db.exec(migration.sql)
        console.log(`   ✅ ${migration.name}`)
        migrationsAppliquees++
      } else {
        // sql.js
        db.run(migration.sql)
        console.log(`   ✅ ${migration.name}`)
        migrationsAppliquees++
        
        // Sauvegarder la DB modifiée
        const sqlJsDbInstance = await getSqlJsDb()
        const data = sqlJsDbInstance.db.export()
        const buffer = Buffer.from(data)
        fs.writeFileSync(dbPath, buffer)
      }
    } catch (e: any) {
      const errorMsg = e.message || String(e)
      if (errorMsg.includes('duplicate column') || errorMsg.includes('already exists')) {
        console.log(`   ⏭️  ${migration.name} - Déjà présente (${errorMsg})`)
        migrationsDejaPresentes++
      } else {
        console.log(`   ❌ ${migration.name} - Erreur: ${errorMsg}`)
      }
    }
  }

  // Vérifier les données
  console.log('')
  console.log('📦 VÉRIFICATION DES DONNÉES')
  console.log('-'.repeat(80))

  let productsCount = 0
  let packsCount = 0

  try {
    if (engine === 'better-sqlite3') {
      const productsResult = db.prepare('SELECT COUNT(*) as count FROM products WHERE (is_active = 1 OR is_active IS NULL)').get() as { count: number }
      productsCount = productsResult?.count || 0
      
      const packsResult = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
      packsCount = packsResult?.count || 0
    } else {
      // sql.js
      const productsResult = db.exec('SELECT COUNT(*) as count FROM products WHERE (is_active = 1 OR is_active IS NULL)')
      if (productsResult.length > 0 && productsResult[0].values && productsResult[0].values[0]) {
        productsCount = productsResult[0].values[0][0] as number
      }
      
      const packsResult = db.exec('SELECT COUNT(*) as count FROM packs')
      if (packsResult.length > 0 && packsResult[0].values && packsResult[0].values[0]) {
        packsCount = packsResult[0].values[0][0] as number
      }
    }

    console.log(`   ✅ Produits actifs: ${productsCount}`)
    console.log(`   ✅ Packs: ${packsCount}`)
  } catch (e) {
    console.log(`   ⚠️  Erreur lors du comptage: ${e instanceof Error ? e.message : String(e)}`)
  }

  console.log('')
  console.log('='.repeat(80))
  console.log('📊 RÉSUMÉ')
  console.log('='.repeat(80))
  console.log(`✅ Connexion: OK (${engine})`)
  console.log(`🔄 Migrations appliquées: ${migrationsAppliquees}`)
  console.log(`⏭️  Migrations déjà présentes: ${migrationsDejaPresentes}`)
  console.log(`📦 Produits: ${productsCount}`)
  console.log(`📦 Packs: ${packsCount}`)
  console.log('')
}

applyMigrations()
  .then(() => {
    console.log('✅ TERMINÉ\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ ERREUR FATALE:', error)
    process.exit(1)
  })
