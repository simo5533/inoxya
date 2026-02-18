#!/usr/bin/env ts-node

/**
 * Script pour forcer la connexion SQLite et appliquer les migrations manquantes
 */

import * as fs from 'fs'
import * as path from 'path'

const dbPath = path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')

interface Migration {
  name: string
  sql: string
}

const MIGRATIONS: Migration[] = [
  {
    name: 'Ajouter colonne is_featured à products',
    sql: `ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT 0`
  },
  {
    name: 'Ajouter colonne images à products si manquante',
    sql: `ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]'`
  },
  {
    name: 'Ajouter colonne created_by à products si manquante',
    sql: `ALTER TABLE products ADD COLUMN created_by TEXT`
  }
]

async function forcerConnexionEtMigrations() {
  console.log('🔧 FORCAGE DE LA CONNEXION ET APPLICATIONS DES MIGRATIONS')
  console.log('='.repeat(80))
  console.log(`📁 Chemin DB: ${dbPath}`)
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
    console.log('   ⚠️  Le fichier DB doit être créé par initializeDatabase()')
    return
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
      console.log('✅ Connexion réussie avec better-sqlite3')
    }
  } catch (e: any) {
    console.log('⚠️  better-sqlite3 non disponible, tentative avec sql.js...')
    
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
      console.log('✅ Connexion réussie avec sql.js')
    } catch (e2: any) {
      console.log(`❌ Erreur de connexion: ${e2.message || String(e2)}`)
      return
    }
  }

  // 3. Vérifier les colonnes existantes dans products
  console.log('\n🔍 VÉRIFICATION DE LA STRUCTURE')
  console.log('-'.repeat(80))

  let columns: any[] = []
  if (engine === 'better-sqlite3' && db) {
    columns = db.prepare('PRAGMA table_info(products)').all()
  } else if (engine === 'sql.js' && sqlJsDb) {
    const pragmaResult = sqlJsDb.exec('PRAGMA table_info(products)')
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
  console.log(`   Colonnes existantes dans products: ${colonnesExistantes.join(', ')}`)

  // 4. Appliquer les migrations nécessaires
  console.log('\n🔄 APPLICATION DES MIGRATIONS')
  console.log('-'.repeat(80))

  let migrationsAppliquees = 0

  for (const migration of MIGRATIONS) {
    const colonne = migration.sql.match(/ADD COLUMN (\w+)/i)?.[1]?.toLowerCase()
    if (colonne && colonnesExistantes.includes(colonne)) {
      console.log(`   ⏭️  ${migration.name} - Déjà présente`)
      continue
    }

    try {
      if (engine === 'better-sqlite3' && db) {
        db.exec(migration.sql)
        console.log(`   ✅ ${migration.name}`)
        migrationsAppliquees++
      } else if (engine === 'sql.js' && sqlJsDb) {
        sqlJsDb.run(migration.sql)
        console.log(`   ✅ ${migration.name}`)
        migrationsAppliquees++
        
        // Sauvegarder la DB modifiée
        const data = sqlJsDb.export()
        const buffer = Buffer.from(data)
        fs.writeFileSync(dbPath, buffer)
        console.log(`   💾 Base de données sauvegardée`)
      }
    } catch (e: any) {
      const errorMsg = e.message || String(e)
      if (errorMsg.includes('duplicate column') || errorMsg.includes('already exists')) {
        console.log(`   ⏭️  ${migration.name} - Déjà présente (${errorMsg})`)
      } else {
        console.log(`   ❌ ${migration.name} - Erreur: ${errorMsg}`)
      }
    }
  }

  // 5. Vérifier les données
  console.log('\n📦 VÉRIFICATION DES DONNÉES')
  console.log('-'.repeat(80))

  let productsCount = 0
  let packsCount = 0

  if (engine === 'better-sqlite3' && db) {
    const productsResult = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1 OR is_active IS NULL').get()
    productsCount = (productsResult as any).count
    
    const packsResult = db.prepare('SELECT COUNT(*) as count FROM packs').get()
    packsCount = (packsResult as any).count
  } else if (engine === 'sql.js' && sqlJsDb) {
    const productsResult = sqlJsDb.exec('SELECT COUNT(*) as count FROM products WHERE is_active = 1 OR is_active IS NULL')
    if (productsResult.length > 0 && productsResult[0].values && productsResult[0].values[0]) {
      productsCount = productsResult[0].values[0][0] as number
    }
    
    const packsResult = sqlJsDb.exec('SELECT COUNT(*) as count FROM packs')
    if (packsResult.length > 0 && packsResult[0].values && packsResult[0].values[0]) {
      packsCount = packsResult[0].values[0][0] as number
    }
  }

  console.log(`   ✅ Produits actifs: ${productsCount}`)
  console.log(`   ✅ Packs: ${packsCount}`)

  // 6. Fermer les connexions
  if (db) {
    db.close()
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 RÉSUMÉ')
  console.log('='.repeat(80))
  console.log(`✅ Connexion: OK (${engine})`)
  console.log(`🔄 Migrations appliquées: ${migrationsAppliquees}`)
  console.log(`📦 Produits: ${productsCount}`)
  console.log(`📦 Packs: ${packsCount}`)
  console.log('')
}

forcerConnexionEtMigrations()
  .then(() => {
    console.log('✅ TERMINÉ\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ ERREUR FATALE:', error)
    process.exit(1)
  })

