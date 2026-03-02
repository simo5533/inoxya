/**
 * Importe tous les packs depuis la base SQLite locale vers Supabase.
 * Usage: npx tsx scripts/sync-packs-to-supabase.ts
 * Prérequis: .env.local avec NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
 * La base SQLite (data/inoxya_bijoux.db ou sql.js) doit contenir des packs.
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

  console.log('1. Lecture des packs depuis la base SQLite locale...')
  let packs: Array<{
    id: string
    name: string
    slug: string
    description?: string
    price: number
    image_url?: string
    is_featured: boolean
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
    packs = await sqlite.getPacksAsync()
  } catch (e) {
    console.error('Erreur lecture SQLite:', e)
    process.exit(1)
  }

  if (packs.length === 0) {
    console.log('Aucun pack dans la base SQLite. Rien à envoyer vers Supabase.')
    console.log('Vous pouvez créer des packs via Admin → Packs sur le site.')
    process.exit(0)
  }

  console.log(`   ${packs.length} pack(s) trouvé(s).`)

  const supabase = (await import('@supabase/supabase-js')).createClient(url, key)

  const { count } = await supabase.from('packs').select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 0) {
    console.log(`\n   ⚠️  Supabase contient déjà ${count} pack(s). Les nouveaux seront ajoutés (doublons possibles si vous relancez).`)
  }

  console.log('\n2. Envoi des packs vers Supabase (par lots de ' + BATCH_SIZE + ')...')

  let inserted = 0
  let errors = 0
  const now = new Date().toISOString()

  for (let i = 0; i < packs.length; i += BATCH_SIZE) {
    const batch = packs.slice(i, i + BATCH_SIZE)
    const rows = batch.map((p) => ({
      name: p.name || 'Sans nom',
      slug: p.slug || p.name?.toLowerCase().replace(/\s+/g, '-') || `pack-${p.id}`,
      description: p.description ?? null,
      price: Number(p.price) || 0,
      image_url: p.image_url ?? null,
      is_featured: Boolean(p.is_featured),
      created_by: null,
      created_at: now,
    }))

    const { error } = await supabase.from('packs').insert(rows)
    if (error) {
      console.error('   Erreur lot', Math.floor(i / BATCH_SIZE) + 1, ':', error.message)
      errors += batch.length
    } else {
      inserted += batch.length
      console.log('   Lot', Math.floor(i / BATCH_SIZE) + 1, ':', batch.length, 'pack(s) inséré(s).')
    }
  }

  console.log('\n3. Résultat:', inserted, 'pack(s) inséré(s).')
  if (errors > 0) console.log('   Erreurs:', errors, 'ligne(s).')
  console.log('\nLa table Supabase "packs" est maintenant remplie. Rechargez /fr/packs.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
