/**
 * Script de migration SQLite → Supabase
 * Migre toutes les données de la base SQLite locale vers Supabase PostgreSQL
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { getBetterSqlite3Db } from '../lib/sqlite'
import { getSqlJsDb } from '../lib/sqljs-singleton'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('💡 Add these to .env.local:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Trouver la base SQLite locale
const dbPaths = [
  path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db'),
  path.resolve(process.cwd(), 'database.sqlite'),
  path.resolve(process.cwd(), 'data', 'database.sqlite'),
  path.resolve(process.cwd(), 'prisma', 'dev.db'),
  path.resolve(process.cwd(), 'db.sqlite'),
  path.resolve(process.cwd(), 'inoxya.db'),
]

let dbPath = ''
for (const p of dbPaths) {
  if (fs.existsSync(p)) {
    dbPath = p
    break
  }
}

if (!dbPath) {
  console.error('❌ No SQLite database found. Searched:')
  dbPaths.forEach(p => console.error(`   - ${p}`))
  process.exit(1)
}

console.log('✅ Found database at:', dbPath)

// Utiliser better-sqlite3 ou sql.js comme fallback
async function initDb() {
  const betterSqlite3Db = getBetterSqlite3Db()
  if (betterSqlite3Db) {
    return { type: 'better-sqlite3' as const, db: betterSqlite3Db }
  }
  
  // Fallback sur sql.js
  const sqlJsDb = await getSqlJsDb()
  return { type: 'sql.js' as const, db: sqlJsDb.db }
}

async function migrate(dbConn: { type: 'better-sqlite3' | 'sql.js', db: any }) {
  console.log('🚀 Starting migration to Supabase...\n')

  // Obtenir toutes les tables
  let tables: { name: string }[] = []
  
  if (dbConn.type === 'better-sqlite3') {
    tables = dbConn.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all() as { name: string }[]
  } else {
    // sql.js
    const result = dbConn.db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
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

  console.log('📋 Tables found:', tables.map(t => t.name).join(', '))
  console.log('')

  for (const { name } of tables) {
    console.log(`📤 Migrating table: ${name}`)
    try {
      let rows: any[] = []
      
      if (dbConn.type === 'better-sqlite3') {
        rows = dbConn.db.prepare(`SELECT * FROM ${name}`).all() as any[]
      } else {
        // sql.js
        const result = dbConn.db.exec(`SELECT * FROM ${name}`)
        if (result.length > 0 && result[0].values) {
          const columns = result[0].columns
          rows = result[0].values.map((row: any[]) => {
            const obj: any = {}
            columns.forEach((col: string, i: number) => {
              obj[col] = row[i]
            })
            return obj
          })
        }
      }
      console.log(`   Found ${rows.length} rows`)
      
      if (rows.length === 0) {
        console.log(`   ⏭️  Skipping empty table`)
        continue
      }

      // Convertir les données pour PostgreSQL
      const convertedRows = rows.map(row => {
        const converted: any = {}
        for (const [key, value] of Object.entries(row)) {
          // Convertir les booléens SQLite (0/1) en vrais booléens
          if (typeof value === 'number' && (value === 0 || value === 1)) {
            // Vérifier si la colonne est censée être booléenne (par nom de colonne)
            const isBooleanColumn = key.toLowerCase().includes('is_') || 
                                   key.toLowerCase().includes('has_') ||
                                   key.toLowerCase().includes('active') ||
                                   key.toLowerCase().includes('featured') ||
                                   key.toLowerCase().includes('approved') ||
                                   key.toLowerCase().includes('read') ||
                                   key.toLowerCase().includes('default') ||
                                   key.toLowerCase().includes('public')
            
            if (isBooleanColumn) {
              converted[key] = value === 1
            } else {
              converted[key] = value
            }
          } else {
            converted[key] = value
          }
        }
        return converted
      })

      // Insérer par lots de 100
      const batchSize = 100
      let inserted = 0
      for (let i = 0; i < convertedRows.length; i += batchSize) {
        const batch = convertedRows.slice(i, i + batchSize)
        const { error } = await supabase.from(name).upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        if (error) {
          console.error(`   ⚠️  Error in ${name} batch ${i + 1}:`, error.message)
        } else {
          inserted += batch.length
          console.log(`   ✅ Inserted rows ${i + 1} to ${Math.min(i + batchSize, convertedRows.length)} (${inserted}/${convertedRows.length})`)
        }
      }
      console.log(`   ✅ Completed: ${inserted}/${convertedRows.length} rows migrated\n`)
    } catch (err: any) {
      console.error(`   ❌ Failed to migrate ${name}:`, err.message || err)
      console.log('')
    }
  }

  console.log('🎉 Migration complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Add these to Vercel Environment Variables:')
  console.log('   - NEXT_PUBLIC_SUPABASE_URL =', supabaseUrl)
  console.log('   - SUPABASE_SERVICE_ROLE_KEY = [your key]')
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY = [your anon key]')
  console.log('2. Redeploy: vercel --prod --force')
}

async function main() {
  const dbConn = await initDb()
  await migrate(dbConn)
  if (dbConn.type === 'better-sqlite3' && dbConn.db.close) {
    dbConn.db.close()
  }
}

main().catch(console.error)

