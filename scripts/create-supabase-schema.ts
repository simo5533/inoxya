/**
 * Script pour générer le schéma PostgreSQL depuis SQLite
 * Génère le SQL à exécuter dans Supabase SQL Editor
 */

import { getSqlJsDb } from '../lib/sqljs-singleton'
import { getBetterSqlite3Db } from '../lib/sqlite'
import * as fs from 'fs'
import * as path from 'path'

// Trouver la base SQLite locale
const dbPaths = [
  path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db'),
  path.resolve(process.cwd(), 'database.sqlite'),
  path.resolve(process.cwd(), 'data', 'database.sqlite'),
  path.resolve(process.cwd(), 'prisma', 'dev.db'),
  path.resolve(process.cwd(), 'db.sqlite'),
  path.resolve(process.cwd(), 'inoxya.db'),
]

let dbPath = dbPaths.find(p => fs.existsSync(p))

if (!dbPath) {
  console.error('❌ No SQLite DB found. Searched:')
  dbPaths.forEach(p => console.error(`   - ${p}`))
  process.exit(1)
}

console.log('✅ Found database at:', dbPath)

async function initDb() {
  // Essayer better-sqlite3 d'abord, sinon sql.js
  let db: any = null
  let dbType: 'better-sqlite3' | 'sql.js' = 'sql.js'

  const betterSqlite3Db = getBetterSqlite3Db()
  if (betterSqlite3Db) {
    db = betterSqlite3Db
    dbType = 'better-sqlite3'
  } else {
    // Utiliser sql.js
    const sqlJsDb = await getSqlJsDb()
    db = sqlJsDb.db
    dbType = 'sql.js'
  }
  
  return { db, dbType }
}

async function createSchema(db: any, dbType: 'better-sqlite3' | 'sql.js') {
  let tables: { name: string, sql: string | null }[] = []
  
  if (dbType === 'better-sqlite3') {
    tables = db.prepare(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all() as { name: string, sql: string | null }[]
  } else {
    // sql.js
    const result = db.exec(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    if (result.length > 0 && result[0].values) {
      const columns = result[0].columns
      tables = result[0].values.map((row: any[]) => {
        const obj: any = {}
        columns.forEach((col: string, i: number) => {
          obj[col] = row[i]
        })
        return obj
      })
    }
  }

  // Créer un fichier SQL propre
  const sqlFilePath = path.resolve(process.cwd(), 'supabase-schema.sql')
  let sqlContent = '-- ============================================\n'
  sqlContent += '-- INOXYA BIJOUX - Auto-generated PostgreSQL Schema\n'
  sqlContent += '-- Run this in Supabase SQL Editor\n'
  sqlContent += '-- ============================================\n\n'
  
  console.log('\n' + '='.repeat(80))
  console.log('📋 INOXYA BIJOUX - Auto-generated PostgreSQL Schema')
  console.log('='.repeat(80))
  console.log('\n📝 SQL généré dans: supabase-schema.sql')
  console.log('   Copiez le contenu de ce fichier dans Supabase SQL Editor\n')
  
  for (const { name, sql } of tables) {
    if (!sql) continue
    
    sqlContent += `-- Table: ${name}\n`
    sqlContent += `DROP TABLE IF EXISTS "${name}" CASCADE;\n`
    
    // Convertir SQLite syntax vers PostgreSQL
    let pgSql = sql
      // Types - d'abord les PRIMARY KEY
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/INTEGER PRIMARY KEY/gi, 'SERIAL PRIMARY KEY')
      // Puis les autres types
      .replace(/INTEGER\s+/gi, 'INTEGER ')
      .replace(/DATETIME/gi, 'TIMESTAMP')
      .replace(/BOOLEAN/gi, 'BOOLEAN')
      .replace(/REAL/gi, 'DECIMAL(10,2)')
      .replace(/BLOB/gi, 'BYTEA')
      // Contraintes - corriger les timestamps
      .replace(/DEFAULT CURRENT_TIMESTAMP/gi, 'DEFAULT NOW()')
      .replace(/DEFAULT\s*\(TIMESTAMP\(['"]now['"]\)\)/gi, 'DEFAULT NOW()')
      .replace(/DEFAULT\s*\(datetime\(['"]now['"]\)\)/gi, 'DEFAULT NOW()')
      .replace(/DEFAULT\s+(\d+)/gi, 'DEFAULT $1')
      // Noms de tables avec guillemets
      .replace(/CREATE TABLE\s+(\w+)/gi, 'CREATE TABLE IF NOT EXISTS "$1"')
      .replace(/REFERENCES\s+(\w+)/gi, 'REFERENCES "$1"')
    
    // Corriger les colonnes created_at/updated_at qui sont TEXT au lieu de TIMESTAMP
    // D'abord corriger les cas avec DEFAULT (TIMESTAMP('now'))
    pgSql = pgSql.replace(/(\w+)\s+TEXT\s+DEFAULT\s*\(TIMESTAMP\(['"]now['"]\)\)/gi, (match, colName) => {
      if (colName.toLowerCase().includes('created_at') || colName.toLowerCase().includes('updated_at') || colName.toLowerCase().includes('expires_at') || colName.toLowerCase().includes('subscribed_at')) {
        return `"${colName}" TIMESTAMP DEFAULT NOW()`
      }
      return match
    })
    // Puis corriger les cas avec DEFAULT NOW()
    pgSql = pgSql.replace(/(\w+)\s+TEXT\s+DEFAULT\s+NOW\(\)/gi, (match, colName) => {
      if (colName.toLowerCase().includes('created_at') || colName.toLowerCase().includes('updated_at') || colName.toLowerCase().includes('expires_at') || colName.toLowerCase().includes('subscribed_at')) {
        return `"${colName}" TIMESTAMP DEFAULT NOW()`
      }
      return match
    })
    // Enfin corriger les TEXT sans DEFAULT mais avec nom de timestamp
    pgSql = pgSql.replace(/(\w+)\s+TEXT(?!\s+DEFAULT)/gi, (match, colName) => {
      if (colName.toLowerCase().includes('created_at') || colName.toLowerCase().includes('updated_at') || colName.toLowerCase().includes('expires_at') || colName.toLowerCase().includes('subscribed_at')) {
        return `"${colName}" TIMESTAMP`
      }
      return match
    })
    
    // Corriger les valeurs par défaut BOOLEAN : 0 → false, 1 → true
    pgSql = pgSql.replace(/BOOLEAN\s+DEFAULT\s+0/gi, 'BOOLEAN DEFAULT false')
    pgSql = pgSql.replace(/BOOLEAN\s+DEFAULT\s+1/gi, 'BOOLEAN DEFAULT true')
    pgSql = pgSql.replace(/BOOLEAN\s+DEFAULT\s+'0'/gi, 'BOOLEAN DEFAULT false')
    pgSql = pgSql.replace(/BOOLEAN\s+DEFAULT\s+'1'/gi, 'BOOLEAN DEFAULT true')
    
    // Corriger les colonnes date qui sont DATE
    pgSql = pgSql.replace(/(\w+)\s+TEXT/gi, (match, colName) => {
      if (colName.toLowerCase() === 'date') {
        return `"${colName}" DATE`
      }
      return match
    })
    
    // Nettoyer les virgules en fin de ligne avant les parenthèses fermantes
    pgSql = pgSql.replace(/,\s*\)/g, ')')
    
    // Ajouter les guillemets aux noms de colonnes (mais pas aux types déjà convertis)
    pgSql = pgSql.replace(/([^"])(\w+)\s+(TEXT|INTEGER|SERIAL|BOOLEAN|DECIMAL|TIMESTAMP|BYTEA|DATE)/gi, '$1"$2" $3')
    
    sqlContent += pgSql + ';\n\n'
  }
  
  sqlContent += '-- ============================================\n'
  sqlContent += '-- Schema generation complete!\n'
  sqlContent += `-- Total tables: ${tables.length}\n`
  sqlContent += '-- ============================================\n'
  
  // Écrire le fichier SQL
  fs.writeFileSync(sqlFilePath, sqlContent, 'utf-8')
  
  console.log('✅ Fichier SQL créé: supabase-schema.sql')
  console.log('📊 Tables à migrer:', tables.map(t => t.name).join(', '))
  console.log(`📦 Total tables: ${tables.length}\n`)
  console.log('💡 Ouvrez supabase-schema.sql et copiez son contenu dans Supabase SQL Editor\n')
}

async function main() {
  const { db, dbType } = await initDb()
  await createSchema(db, dbType)
  if (dbType === 'better-sqlite3' && db.close) {
    db.close()
  }
}

main().catch(console.error)

