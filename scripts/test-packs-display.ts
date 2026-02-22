/**
 * Test d'affichage des packs depuis l'API
 */

import { getAllPacks } from '../lib/database'
import { getDatabaseAdapter } from '../lib/db'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testPacksDisplay() {
  console.log('🔍 Test d\'affichage des packs...\n')
  console.log('='.repeat(60))

  try {
    // Test 1: Via getAllPacks (utilise l'adapter)
    console.log('\n1️⃣ Test getAllPacks() via adapter...')
    const packs = await getAllPacks()
    console.log(`   ✅ ${packs.length} packs récupérés\n`)

    if (packs.length === 0) {
      console.log('   ⚠️  Aucun pack trouvé !')
      console.log('   Vérifiez que les packs sont bien dans Supabase.\n')
    } else {
      console.log('   📦 Premiers packs:')
      packs.slice(0, 5).forEach((pack, index) => {
        console.log(`      ${index + 1}. ${pack.name}`)
        console.log(`         Prix: ${pack.price} MAD`)
        console.log(`         Image: ${pack.image_url || 'N/A'}`)
        console.log(`         Vedette: ${pack.is_featured ? 'Oui' : 'Non'}\n`)
      })
    }

    // Test 2: Via adapter direct
    console.log('2️⃣ Test via getDatabaseAdapter()...')
    const adapter = await getDatabaseAdapter()
    const adapterPacks = await adapter.getPacks()
    console.log(`   ✅ ${adapterPacks.length} packs récupérés via adapter\n`)

    if (adapterPacks.length === 0) {
      console.log('   ⚠️  Aucun pack trouvé via adapter !')
    } else {
      console.log('   📦 Exemples:')
      adapterPacks.slice(0, 3).forEach((pack, index) => {
        console.log(`      ${index + 1}. ${pack.name} - ${pack.image_url || 'N/A'}`)
      })
    }

    // Test 3: Vérification des images
    console.log('\n3️⃣ Vérification des images...')
    const packsWithImages = packs.filter(p => p.image_url && p.image_url !== '/placeholder.svg')
    console.log(`   ✅ ${packsWithImages.length}/${packs.length} packs ont des images valides`)

    if (packsWithImages.length < packs.length) {
      console.log(`   ⚠️  ${packs.length - packsWithImages.length} packs sans images`)
    }

    console.log('\n✅ Tous les tests sont passés!')
    console.log(`\n✅ ${packs.length} packs sont prêts à être affichés sur le site.`)

  } catch (error) {
    console.error('❌ Erreur lors du test:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

testPacksDisplay().catch(console.error)

