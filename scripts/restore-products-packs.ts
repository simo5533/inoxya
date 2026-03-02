/**
 * Restaure produits et packs dans Supabase.
 * 1) Vide les tables concernées dans Supabase (cart_items, favorites, reviews, testimonials, products, packs).
 * 2) Si la base SQLite locale a des données → envoi vers Supabase.
 * 3) Sinon → indique d'exécuter supabase-seed-full-catalog.sql dans le SQL Editor.
 *
 * Usage: npx tsx scripts/restore-products-packs.ts
 * Prérequis: .env.local avec NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const BATCH_SIZE = 10

async function main() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!url || !key) {
    console.error('❌ Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises dans .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  console.log('1. Vidage des tables Supabase (products, packs et dépendances)...\n')

  const tablesToClear = ['cart_items', 'favorites', 'reviews', 'testimonials', 'products', 'packs'] as const
  for (const table of tablesToClear) {
    const { error } = await supabase.from(table).delete().gte('id', 0)
    if (error) {
      console.error(`   Erreur suppression ${table}:`, error.message)
    } else {
      console.log(`   ✓ ${table} vidé`)
    }
  }

  console.log('\n2. Lecture de la base SQLite locale...')
  let products: Array<Record<string, unknown>> = []
  let packs: Array<Record<string, unknown>> = []

  try {
    const sqlite = await import('../lib/sqlite')
    let isConnected = sqlite.forceConnection()
    if (!isConnected) {
      isConnected = await sqlite.initSqlJsAsync()
      if (isConnected) isConnected = sqlite.forceConnection()
    }
    if (isConnected) {
      products = await sqlite.getProductsAsync?.() ?? []
      packs = await sqlite.getPacksAsync?.() ?? []
    }
  } catch {
    // SQLite non disponible
  }

  const hasLocalData = products.length > 0 || packs.length > 0
  if (!hasLocalData) {
    console.log('   Aucune donnée dans la SQLite locale.\n')
    console.log('3. SOLUTION : exécutez le catalogue de démo dans Supabase.\n')
    console.log('   → Ouvrez Supabase → SQL Editor')
    console.log('   → Copiez tout le contenu du fichier :')
    console.log('     scripts/supabase-seed-full-catalog.sql')
    console.log('   → Collez et exécutez.\n')
    console.log('   Ensuite rechargez /fr/bijoux et /fr/packs.')
    process.exit(0)
  }

  const now = new Date().toISOString()
  console.log(`   ${products.length} produit(s), ${packs.length} pack(s) trouvés.\n`)

  if (products.length > 0) {
    console.log('3. Envoi des produits vers Supabase...')
    let inserted = 0
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE)
      const rows = batch.map((p: Record<string, unknown>) => ({
        name: (p.name as string) || 'Sans nom',
        name_ar: (p.name_ar as string) ?? null,
        description: (p.description as string) ?? null,
        price: Number(p.price) || 0,
        original_price: p.original_price != null ? Number(p.original_price) : null,
        category: (p.category as string) || 'Général',
        stock: 0,
        is_active: p.is_available !== false,
        image_url: (p.image_url as string) ?? null,
        images: typeof p.images === 'string' ? p.images : JSON.stringify(Array.isArray(p.images) ? p.images : []),
        created_by: null,
        is_featured: Boolean(p.is_featured),
        created_at: (p.created_at as string) || now,
        updated_at: now,
      }))
      const { error } = await supabase.from('products').insert(rows)
      if (error) console.error('   Erreur:', error.message)
      else {
        inserted += batch.length
        console.log(`   Lot ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} produit(s) inséré(s).`)
      }
    }
    console.log(`   Total: ${inserted} produit(s).\n`)
  }

  if (packs.length > 0) {
    console.log('4. Envoi des packs vers Supabase...')
    let inserted = 0
    for (let i = 0; i < packs.length; i += BATCH_SIZE) {
      const batch = packs.slice(i, i + BATCH_SIZE)
      const rows = batch.map((p: Record<string, unknown>) => ({
        name: (p.name as string) || 'Sans nom',
        slug: (p.slug as string) || ((p.name as string)?.toLowerCase().replace(/\s+/g, '-') ?? `pack-${i}`),
        description: (p.description as string) ?? null,
        price: Number(p.price) || 0,
        image_url: (p.image_url as string) ?? null,
        is_featured: Boolean(p.is_featured),
        created_by: null,
        created_at: now,
      }))
      const { error } = await supabase.from('packs').insert(rows)
      if (error) console.error('   Erreur:', error.message)
      else {
        inserted += batch.length
        console.log(`   Lot ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} pack(s) inséré(s).`)
      }
    }
    console.log(`   Total: ${inserted} pack(s).\n`)
  }

  console.log('✓ Terminé. Rechargez /fr/bijoux et /fr/packs.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
