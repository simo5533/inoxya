/**
 * Importe tous les produits depuis la base SQLite locale vers Supabase.
 * Usage: npx tsx scripts/sync-products-to-supabase.ts
 * Prérequis: .env.local avec NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
 * La base SQLite (data/inoxya_bijoux.db ou sql.js) doit contenir des produits.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const BATCH_SIZE = 10

async function main() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) {
    console.error('Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises dans .env.local')
    process.exit(1)
  }

  console.log('1. Lecture des produits depuis la base SQLite locale...')
  let products: Array<{
    id: string
    name: string
    name_ar?: string
    description?: string
    price: number
    original_price?: number
    image_url?: string
    images?: string | string[]
    category?: string
    is_available: boolean
    is_featured: boolean
    created_at?: string
  }> = []

  try {
    const sqlite = await import('../lib/sqlite')
    let isConnected = sqlite.forceConnection()
    if (!isConnected) {
      isConnected = await sqlite.initSqlJsAsync()
      if (isConnected) isConnected = sqlite.forceConnection()
    }
    if (!isConnected) {
      console.error('Impossible de se connecter à la base SQLite (data/inoxya_bijoux.db ou sql.js).')
      process.exit(1)
    }
    products = await sqlite.getProductsAsync()
  } catch (e) {
    console.error('Erreur lecture SQLite:', e)
    process.exit(1)
  }

  if (products.length === 0) {
    console.log('Aucun produit dans la base SQLite. Rien à envoyer vers Supabase.')
    process.exit(0)
  }

  console.log(`   ${products.length} produit(s) trouvé(s).`)

  const supabase = (await import('@supabase/supabase-js')).createClient(url, key)

  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 0) {
    console.log(`\n   ⚠️  Supabase contient déjà ${count} produit(s). Les nouveaux seront ajoutés (doublons possibles si vous relancez).`)
  }

  console.log('\n2. Envoi des produits vers Supabase (par lots de ' + BATCH_SIZE + ')...')

  let inserted = 0
  let errors = 0
  const now = new Date().toISOString()

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    const rows = batch.map((p) => ({
      name: p.name || 'Sans nom',
      name_ar: p.name_ar ?? null,
      description: p.description ?? null,
      price: Number(p.price) || 0,
      original_price: p.original_price != null ? Number(p.original_price) : null,
      category: p.category || 'Général',
      stock: 0,
      is_active: p.is_available !== false,
      image_url: p.image_url ?? null,
      images: typeof p.images === 'string' ? p.images : JSON.stringify(Array.isArray(p.images) ? p.images : []),
      created_by: null,
      is_featured: Boolean(p.is_featured),
      created_at: p.created_at || now,
      updated_at: now,
    }))

    const { error } = await supabase.from('products').insert(rows)
    if (error) {
      console.error('   Erreur lot', Math.floor(i / BATCH_SIZE) + 1, ':', error.message)
      errors += batch.length
    } else {
      inserted += batch.length
      console.log('   Lot', Math.floor(i / BATCH_SIZE) + 1, ':', batch.length, 'produit(s) inséré(s).')
    }
  }

  console.log('\n3. Résultat:', inserted, 'produit(s) inséré(s).')
  if (errors > 0) console.log('   Erreurs:', errors, 'ligne(s).')
  console.log('\nVous pouvez recharger /fr/bijoux : les produits doivent maintenant venir de Supabase.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
