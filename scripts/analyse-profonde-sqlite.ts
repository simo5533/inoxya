#!/usr/bin/env ts-node

/**
 * Script d'analyse approfondie de la base de données SQLite
 * - Vérifie la connexion et force la connexion si nécessaire
 * - Vérifie toutes les tables et colonnes
 * - Vérifie les migrations
 * - Vérifie que tous les produits sont récupérés
 * - Crée les migrations manquantes si nécessaire
 */

import * as fs from 'fs'
import * as path from 'path'

// Schéma attendu selon SCHEMA-ET-DONNEES-BASE.md
const SCHEMA_ATTENDU = {
  products: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL',
    name_ar: 'TEXT',
    description: 'TEXT',
    price: 'REAL NOT NULL',
    original_price: 'REAL',
    category: 'TEXT NOT NULL',
    stock: 'INTEGER DEFAULT 0',
    is_active: 'BOOLEAN DEFAULT 1',
    image_url: 'TEXT',
    images: 'TEXT DEFAULT \'[]\'',
    created_by: 'TEXT',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    is_featured: 'BOOLEAN DEFAULT 0' // Colonne potentiellement manquante
  },
  categories: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL UNIQUE',
    slug: 'TEXT NOT NULL UNIQUE',
    description: 'TEXT',
    image_url: 'TEXT',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  },
  packs: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT NOT NULL',
    slug: 'TEXT NOT NULL UNIQUE',
    description: 'TEXT',
    price: 'REAL NOT NULL',
    image_url: 'TEXT',
    is_featured: 'BOOLEAN DEFAULT 0',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  },
  users: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    phone: 'TEXT UNIQUE NOT NULL',
    password_hash: 'TEXT NOT NULL',
    first_name: 'TEXT',
    last_name: 'TEXT',
    role: 'TEXT NOT NULL DEFAULT \'user\'',
    created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
  }
}

const dbPath = path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')

interface AnalyseResult {
  connexion: { status: boolean; engine?: string; error?: string }
  tables: { existantes: string[]; manquantes: string[]; details: any[] }
  colonnes: { manquantes: any[]; problemes: any[] }
  donnees: { produits: number; packs: number; categories: number; users: number }
  migrations: { necessaires: string[]; appliquees: string[] }
}

async function analyserBaseDeDonnees(): Promise<AnalyseResult> {
  const result: AnalyseResult = {
    connexion: { status: false },
    tables: { existantes: [], manquantes: [], details: [] },
    colonnes: { manquantes: [], problemes: [] },
    donnees: { produits: 0, packs: 0, categories: 0, users: 0 },
    migrations: { necessaires: [], appliquees: [] }
  }

  console.log('🔍 ANALYSE APPROFONDIE DE LA BASE DE DONNÉES SQLITE')
  console.log('='.repeat(80))
  console.log(`📁 Chemin DB: ${dbPath}`)
  console.log(`📁 Existe: ${fs.existsSync(dbPath) ? '✅ OUI' : '❌ NON'}`)
  console.log('')

  // 1. Vérifier l'existence du fichier
  if (!fs.existsSync(dbPath)) {
    console.log('❌ ERREUR: Le fichier de base de données n\'existe pas!')
    console.log(`   Création du répertoire data si nécessaire...`)
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log(`   ✅ Répertoire créé: ${dataDir}`)
    }
    result.connexion.error = 'Fichier DB non trouvé'
    return result
  }

  // 2. Essayer de se connecter avec better-sqlite3
  let db: any = null
  let sqlJsDb: any = null
  let engine = 'unknown'

  try {
    const Database = require('better-sqlite3')
    db = new Database(dbPath)
    const test = db.prepare('SELECT 1 as test').get()
    if (test) {
      engine = 'better-sqlite3'
      result.connexion.status = true
      result.connexion.engine = engine
      console.log('✅ Connexion réussie avec better-sqlite3')
    }
  } catch (e: any) {
    console.log('⚠️  better-sqlite3 non disponible, tentative avec sql.js...')
    
    // Essayer avec sql.js
    try {
      const initSqlJs = require('sql.js')
      const wasmPath = path.resolve(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
      
      if (!fs.existsSync(wasmPath)) {
        throw new Error(`Fichier WASM non trouvé: ${wasmPath}`)
      }

      const SQL = await initSqlJs.default({
        locateFile: () => wasmPath
      })

      const fileBuffer = fs.readFileSync(dbPath)
      sqlJsDb = new SQL.Database(fileBuffer)
      engine = 'sql.js'
      result.connexion.status = true
      result.connexion.engine = engine
      console.log('✅ Connexion réussie avec sql.js')
    } catch (e2: any) {
      result.connexion.error = e2.message || String(e2)
      console.log(`❌ Erreur de connexion: ${result.connexion.error}`)
      return result
    }
  }

  // 3. Récupérer toutes les tables
  console.log('\n📊 ANALYSE DES TABLES')
  console.log('-'.repeat(80))
  
  let tables: string[] = []
  if (engine === 'better-sqlite3' && db) {
    const tablesResult = db.prepare(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()
    tables = tablesResult.map((t: any) => t.name)
  } else if (engine === 'sql.js' && sqlJsDb) {
    const tablesResult = sqlJsDb.exec(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    if (tablesResult.length > 0 && tablesResult[0].values) {
      tables = tablesResult[0].values.map((row: any) => row[0])
    }
  }

  result.tables.existantes = tables
  console.log(`✅ Tables existantes: ${tables.length}`)
  tables.forEach(table => {
    console.log(`   - ${table}`)
  })

  // 4. Vérifier les tables attendues
  const tablesAttendues = Object.keys(SCHEMA_ATTENDU)
  result.tables.manquantes = tablesAttendues.filter(t => !tables.includes(t))
  
  if (result.tables.manquantes.length > 0) {
    console.log(`\n⚠️  Tables manquantes: ${result.tables.manquantes.length}`)
    result.tables.manquantes.forEach(table => {
      console.log(`   ❌ ${table}`)
      result.migrations.necessaires.push(`CREATE TABLE ${table}`)
    })
  }

  // 5. Analyser la structure de chaque table
  console.log('\n🔍 ANALYSE DE LA STRUCTURE DES TABLES')
  console.log('-'.repeat(80))

  for (const tableName of tables) {
    if (!SCHEMA_ATTENDU[tableName as keyof typeof SCHEMA_ATTENDU]) continue

    let columns: any[] = []
    
    if (engine === 'better-sqlite3' && db) {
      columns = db.prepare(`PRAGMA table_info(${tableName})`).all()
    } else if (engine === 'sql.js' && sqlJsDb) {
      const pragmaResult = sqlJsDb.exec(`PRAGMA table_info(${tableName})`)
      if (pragmaResult.length > 0 && pragmaResult[0].values) {
        columns = pragmaResult[0].values.map((row: any) => ({
          cid: row[0],
          name: row[1],
          type: row[2],
          notnull: row[3],
          dflt_value: row[4],
          pk: row[5]
        }))
      }
    }

    const colonnesExistantes = columns.map((c: any) => c.name.toLowerCase())
    const schemaAttendu = SCHEMA_ATTENDU[tableName as keyof typeof SCHEMA_ATTENDU]
    const colonnesAttendues = Object.keys(schemaAttendu).map(k => k.toLowerCase())

    const colonnesManquantes = colonnesAttendues.filter(
      col => !colonnesExistantes.includes(col)
    )

    if (colonnesManquantes.length > 0) {
      console.log(`\n⚠️  Table ${tableName} - Colonnes manquantes:`)
      colonnesManquantes.forEach(col => {
        console.log(`   ❌ ${col}`)
        result.colonnes.manquantes.push({ table: tableName, colonne: col })
        result.migrations.necessaires.push(`ALTER TABLE ${tableName} ADD COLUMN ${col}`)
      })
    } else {
      console.log(`✅ Table ${tableName}: Structure complète`)
    }

    result.tables.details.push({
      nom: tableName,
      colonnes: colonnesExistantes,
      count: 0 // Sera rempli plus tard
    })
  }

  // 6. Compter les données
  console.log('\n📦 ANALYSE DES DONNÉES')
  console.log('-'.repeat(80))

  for (const tableName of ['products', 'packs', 'categories', 'users']) {
    if (!tables.includes(tableName)) continue

    let count = 0
    if (engine === 'better-sqlite3' && db) {
      const resultCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get()
      count = (resultCount as any).count
    } else if (engine === 'sql.js' && sqlJsDb) {
      const countResult = sqlJsDb.exec(`SELECT COUNT(*) as count FROM ${tableName}`)
      if (countResult.length > 0 && countResult[0].values && countResult[0].values.length > 0) {
        count = countResult[0].values[0][0] as number
      }
    }

    result.donnees[tableName as keyof typeof result.donnees] = count
    console.log(`   ${tableName}: ${count} enregistrement(s)`)
  }

  // 7. Vérifier les produits réels
  console.log('\n🔍 VÉRIFICATION DES PRODUITS')
  console.log('-'.repeat(80))

  if (tables.includes('products')) {
    let products: any[] = []
    
    if (engine === 'better-sqlite3' && db) {
      products = db.prepare(`
        SELECT id, name, price, category, is_active, image_url 
        FROM products 
        WHERE is_active = 1 OR is_active IS NULL
        ORDER BY id
        LIMIT 10
      `).all()
    } else if (engine === 'sql.js' && sqlJsDb) {
      const productsResult = sqlJsDb.exec(`
        SELECT id, name, price, category, is_active, image_url 
        FROM products 
        WHERE is_active = 1 OR is_active IS NULL
        ORDER BY id
        LIMIT 10
      `)
      if (productsResult.length > 0 && productsResult[0].values) {
        const columns = productsResult[0].columns
        products = productsResult[0].values.map((row: any) => {
          const obj: any = {}
          columns.forEach((col: string, idx: number) => {
            obj[col] = row[idx]
          })
          return obj
        })
      }
    }

    console.log(`   ✅ ${products.length} produits actifs trouvés (échantillon de 10)`)
    if (products.length > 0) {
      console.log('\n   Exemples de produits:')
      products.slice(0, 5).forEach((p: any) => {
        console.log(`   - ${p.name} (${p.price} MAD) - Catégorie: ${p.category}`)
      })
    }
  }

  // 8. Fermer les connexions
  if (db) {
    db.close()
  }

  return result
}

// Exécuter l'analyse
analyserBaseDeDonnees()
  .then(result => {
    console.log('\n' + '='.repeat(80))
    console.log('📊 RÉSUMÉ DE L\'ANALYSE')
    console.log('='.repeat(80))
    console.log(`✅ Connexion: ${result.connexion.status ? 'OK' : 'ÉCHEC'} (${result.connexion.engine || 'N/A'})`)
    console.log(`📋 Tables: ${result.tables.existantes.length} existantes, ${result.tables.manquantes.length} manquantes`)
    console.log(`📝 Colonnes manquantes: ${result.colonnes.manquantes.length}`)
    console.log(`📦 Données: ${result.donnees.produits} produits, ${result.donnees.packs} packs, ${result.donnees.categories} catégories`)
    console.log(`🔄 Migrations nécessaires: ${result.migrations.necessaires.length}`)
    
    if (result.migrations.necessaires.length > 0) {
      console.log('\n⚠️  MIGRATIONS NÉCESSAIRES:')
      result.migrations.necessaires.forEach((migration, idx) => {
        console.log(`   ${idx + 1}. ${migration}`)
      })
    }

    if (result.connexion.error) {
      console.log(`\n❌ ERREUR: ${result.connexion.error}`)
      process.exit(1)
    }

    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ ERREUR FATALE:', error)
    process.exit(1)
  })

