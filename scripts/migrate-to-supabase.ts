/**
 * Script de migration SQLite → Supabase
 * Migre les données de la base SQLite locale vers Supabase PostgreSQL.
 *
 * Fixe le chemin via SQLITE_DB_PATH avant d’ouvrir SQLite (même DB que celle détectée).
 * Ordonne les tables pour limiter les erreurs de clés étrangères.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

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

const dbPaths = [
  path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db'),
  path.resolve(process.cwd(), 'database.sqlite'),
  path.resolve(process.cwd(), 'data', 'database.sqlite'),
  path.resolve(process.cwd(), 'prisma', 'dev.db'),
  path.resolve(process.cwd(), 'db.sqlite'),
  path.resolve(process.cwd(), 'inoxya.db'),
]

let foundDb = ''
for (const p of dbPaths) {
  if (fs.existsSync(p)) {
    foundDb = p
    break
  }
}

if (!foundDb) {
  console.error('❌ No SQLite database found. Searched:')
  dbPaths.forEach((p) => console.error(`   - ${p}`))
  process.exit(1)
}

const resolvedDb = path.resolve(foundDb)
process.env['SQLITE_DB_PATH'] = resolvedDb
console.log('✅ Found database at:', resolvedDb)

const SKIP_TABLES = new Set(
  'sqlite_sequence android_metadata _migrations bijoux pack_composition custom_packs pack_reviews pack_favorites'.split(
    /\s+/
  )
)

/** Ordre proche des FK (schéma public Supabase) */
const TABLE_ORDER = [
  'users',
  'site_settings',
  'settings',
  'categories',
  'products',
  'packs',
  'orders',
  'order_items',
  'payments',
  'cart_items',
  'favorites',
  'user_sessions',
  'custom_requests',
  'reviews',
  'newsletter_subscriptions',
  'site_stats',
  'shipping_addresses',
  'notifications',
  'promo_codes',
  'contact_messages',
  'testimonials',
  'testimonials_bijoux',
  'promo_code_uses',
]

function sortTableNames(names: string[]) {
  const seen = new Set<string>()
  const out: { name: string }[] = []
  for (const t of TABLE_ORDER) {
    if (names.includes(t) && !SKIP_TABLES.has(t) && !seen.has(t)) {
      out.push({ name: t })
      seen.add(t)
    }
  }
  for (const t of names.sort()) {
    if (SKIP_TABLES.has(t) || seen.has(t)) continue
    out.push({ name: t })
    seen.add(t)
  }
  return out
}

const PRODUCT_COLS = new Set([
  'id',
  'name',
  'name_ar',
  'description',
  'price',
  'original_price',
  'category',
  'stock',
  'is_active',
  'image_url',
  'created_at',
  'updated_at',
  'images',
  'created_by',
  'is_featured',
])

const PACK_COLS = new Set([
  'id',
  'name',
  'slug',
  'description',
  'price',
  'image_url',
  'is_featured',
  'created_by',
  'created_at',
])

function pickCols(row: Record<string, unknown>, allowed: Set<string>) {
  const o: Record<string, unknown> = {}
  for (const k of Object.keys(row)) {
    if (allowed.has(k)) o[k] = row[k]
  }
  return o
}

/**
 * Ajuste les types pour le schéma Supabase (JSONB, FK entières).
 */
function refineForSupabase(table: string, row: Record<string, unknown>): Record<string, unknown> {
  if (table === 'products') {
    let o = { ...row }
    if ('created_by' in o) {
      const c = o['created_by']
      if (c == null || c === '') o['created_by'] = null
      else {
        const n = parseInt(String(c), 10)
        o['created_by'] = Number.isFinite(n) ? n : null
      }
    }
    if ('images' in o && o['images'] != null) {
      const im = o['images']
      if (typeof im === 'string') {
        try {
          o['images'] = JSON.parse(im) as unknown
        } catch {
          o['images'] = []
        }
      } else if (!Array.isArray(im) && typeof im === 'object') {
        o['images'] = im
      } else if (!Array.isArray(im)) {
        o['images'] = []
      }
    } else {
      o['images'] = []
    }
    o = pickCols(o, PRODUCT_COLS) as Record<string, unknown>
    return o
  }
  if (table === 'packs') {
    const o: Record<string, unknown> = { ...row }
    if ('created_by' in o) {
      const c = o['created_by']
      if (c == null || c === '') o['created_by'] = null
      else {
        const n = parseInt(String(c), 10)
        o['created_by'] = Number.isFinite(n) ? n : null
      }
    }
    return pickCols(o, PACK_COLS) as Record<string, unknown>
  }
  return row
}

async function initDb() {
  const { getBetterSqlite3Db } = await import('../lib/sqlite')
  const { getSqlJsDb } = await import('../lib/sqljs-singleton')
  const betterSqlite3Db = getBetterSqlite3Db()
  if (betterSqlite3Db) {
    return { type: 'better-sqlite3' as const, db: betterSqlite3Db }
  }
  const sqlJsDb = await getSqlJsDb()
  return { type: 'sql.js' as const, db: sqlJsDb.db }
}

async function migrate(dbConn: { type: 'better-sqlite3' | 'sql.js'; db: any }) {
  console.log('🚀 Démarrage migration vers Supabase…\n')

  let tables: { name: string }[] = []
  if (dbConn.type === 'better-sqlite3') {
    tables = dbConn.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[]
  } else {
    const result = dbConn.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    if (result.length > 0 && result[0].values && result[0].columns) {
      const columns = result[0].columns
      tables = result[0].values.map((row: unknown[]) => {
        const obj: Record<string, unknown> = {}
        columns.forEach((col: string, i: number) => {
          obj[col] = row[i]
        })
        return obj as { name: string }
      })
    }
  }

  const sorted = sortTableNames(tables.map((t) => t.name))
  console.log('📋 Ordre de migration:', sorted.map((t) => t.name).join(', '))
  console.log('')

  for (const { name } of sorted) {
    if (SKIP_TABLES.has(name)) {
      console.log(`⏭️  Table ignorée: ${name}`)
      continue
    }
    console.log(`📤 Table: ${name}`)
    try {
      let rows: any[] = []
      if (dbConn.type === 'better-sqlite3') {
        rows = dbConn.db.prepare(`SELECT * FROM "${name}"`).all() as any[]
      } else {
        const result = dbConn.db.exec(`SELECT * FROM "${name}"`)
        if (result.length > 0 && result[0].values && result[0].columns) {
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
      console.log(`   Lignes: ${rows.length}`)

      if (rows.length === 0) {
        console.log('   ⏭️  Vide — ignorée\n')
        continue
      }

      const convertedRows = rows.map((row) => {
        const converted: any = {}
        for (const [key, value] of Object.entries(row)) {
          if (typeof value === 'number' && (value === 0 || value === 1)) {
            const isBooleanColumn =
              key.toLowerCase().includes('is_') ||
              key.toLowerCase().includes('has_') ||
              key.toLowerCase().includes('active') ||
              key.toLowerCase().includes('featured') ||
              key.toLowerCase().includes('approved') ||
              key.toLowerCase().includes('read') ||
              (key.toLowerCase().includes('default') && !key.toLowerCase().includes('price')) ||
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
        return refineForSupabase(name, converted) as any
      })

      const batchSize = 100
      let inserted = 0
      for (let i = 0; i < convertedRows.length; i += batchSize) {
        const batch = convertedRows.slice(i, i + batchSize)
        const { error } = await supabase.from(name).upsert(batch, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        if (error) {
          console.error(`   ⚠️  Erreur lot ${i + 1} (${name}):`, error.message)
        } else {
          inserted += batch.length
          console.log(
            `   ✅ ${Math.min(i + batchSize, convertedRows.length)}/${convertedRows.length} (cumul: ${inserted})`
          )
        }
      }
      console.log(`   ✅ ${name}: ${inserted}/${convertedRows.length} lignes\n`)
    } catch (err: any) {
      console.error(`   ❌ ${name}:`, err?.message || err, '\n')
    }
  }

  console.log('🎉 Migration terminée.')
  console.log('\n📝 Puis: npm run db:sync:local-images  (ou npm run db:deploy:local)')
  console.log('   Variables Vercel: NEXT_PUBLIC_SUPABASE_*, BLOB_READ_WRITE_TOKEN, NEXT_PUBLIC_SITE_URL (si Blob private)\n')
}

async function main() {
  const dbConn = await initDb()
  await migrate(dbConn)
  if (dbConn.type === 'better-sqlite3' && dbConn.db?.close) {
    dbConn.db.close()
  }
}

main().catch(console.error)
