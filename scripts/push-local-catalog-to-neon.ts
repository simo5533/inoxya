/**
 * Copie le catalogue local vers Neon PostgreSQL.
 * Lit data/produits-reels.json (pas de better-sqlite3 requis).
 *
 * Prérequis .env.local :
 *   NEON_DATABASE_URL=postgresql://...
 *
 * Usage:
 *   npm run db:push:neon
 *   npm run db:push:neon:dry
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { Pool } from 'pg'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

const dryRun = process.argv.includes('--dry-run')
const jsonPath = path.join(process.cwd(), 'data', 'produits-reels.json')

interface CatalogJson {
  bijoux?: Array<Record<string, unknown>>
  packs?: Array<Record<string, unknown>>
}

function getNeonUrl(): string {
  const url =
    process.env['NEON_DATABASE_URL']?.trim() ||
    process.env['DATABASE_URL']?.trim() ||
    ''
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
    console.error(
      '❌ Ajoutez NEON_DATABASE_URL dans .env.local (connection string Neon).\n' +
        '   Exemple: NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require'
    )
    process.exit(1)
  }
  return url
}

function loadCatalog(): { products: Array<Record<string, unknown>>; packs: Array<Record<string, unknown>> } {
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Fichier introuvable: ${jsonPath}`)
    console.error('   Exportez vos produits ou copiez data/produits-reels.json')
    process.exit(1)
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as CatalogJson
  const products = data.bijoux ?? []
  const packs = data.packs ?? []
  if (products.length === 0) {
    console.error('❌ Aucun produit dans produits-reels.json')
    process.exit(1)
  }
  return { products, packs }
}

async function ensureCatalogTables(pool: Pool): Promise<void> {
  const sql = `
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS packs CASCADE;

    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      name_ar VARCHAR(200),
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2),
      category VARCHAR(100),
      stock_quantity INTEGER DEFAULT 100,
      image_url TEXT,
      images JSONB DEFAULT '[]',
      rating DECIMAL(3,2) DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      is_available BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      is_featured BOOLEAN DEFAULT FALSE,
      is_custom BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE packs (
      id TEXT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      slug VARCHAR(200) UNIQUE NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image_url TEXT,
      is_featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
  if (dryRun) {
    console.log('[dry-run] Tables products + packs seraient recréées')
    return
  }
  await pool.query(sql)
}

function parseImages(raw: unknown): unknown {
  if (raw == null || raw === '') return []
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return raw
}

function isTruthy(v: unknown): boolean {
  return v === 1 || v === true || v === '1'
}

async function main() {
  const { products, packs } = loadCatalog()
  console.log(`📦 Local (JSON): ${products.length} produits, ${packs.length} packs`)

  const pool = new Pool({
    connectionString: getNeonUrl(),
    ssl: { rejectUnauthorized: false },
  })

  try {
    await ensureCatalogTables(pool)

    if (dryRun) {
      console.log(`[dry-run] ${products.length} produits et ${packs.length} packs seraient importés`)
      return
    }

    for (const p of products) {
      const images = parseImages(p['images'])
      const isActive = p['is_active'] !== undefined ? isTruthy(p['is_active']) : isTruthy(p['is_available'] ?? 1)
      await pool.query(
        `INSERT INTO products (
          id, name, name_ar, description, price, original_price, category, stock_quantity,
          image_url, images, is_active, is_available, is_featured, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15)`,
        [
          String(p['id']),
          p['name'],
          p['name_ar'] ?? null,
          p['description'] ?? null,
          p['price'],
          p['original_price'] ?? null,
          p['category'] ?? null,
          p['stock'] ?? 100,
          p['image_url'] ?? null,
          JSON.stringify(images),
          isActive,
          isTruthy(p['is_available'] ?? 1),
          isTruthy(p['is_featured'] ?? 0),
          p['created_at'] ?? new Date().toISOString(),
          p['updated_at'] ?? new Date().toISOString(),
        ]
      )
    }

    for (const pack of packs) {
      await pool.query(
        `INSERT INTO packs (id, name, slug, description, price, image_url, is_featured, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          String(pack['id']),
          pack['name'],
          pack['slug'],
          pack['description'] ?? null,
          pack['price'],
          pack['image_url'] ?? null,
          isTruthy(pack['is_featured'] ?? 0),
          pack['created_at'] ?? new Date().toISOString(),
        ]
      )
    }

    const check = await pool.query(
      `SELECT
        (SELECT COUNT(*)::text FROM products) AS products,
        (SELECT COUNT(*)::text FROM packs) AS packs`
    )
    const row = check.rows[0] as { products: string; packs: string }
    console.log(`✅ Neon: ${row.products} produits, ${row.packs} packs`)
    console.log('✅ Images: chemins /images/... (déjà sur Vercel via public/)')
    console.log('→ Redeploy Vercel puis testez https://inoxya-bijoux.vercel.app/fr/bijoux')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('❌', err instanceof Error ? err.message : err)
  process.exit(1)
})
