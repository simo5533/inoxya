/**
 * Test de l'API /api/packs pour vérifier qu'elle retourne les packs
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testApiPacks() {
  console.log('🔍 Test de l\'API /api/packs...\n')
  console.log('='.repeat(60))

  try {
    // Simuler un appel à l'API
    const baseUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000'
    const apiUrl = `${baseUrl}/api/packs`

    console.log(`\n1️⃣ Test de l'API: ${apiUrl}\n`)

    // Note: En local, on peut tester directement la fonction
    const { getAllPacks } = await import('../lib/database')
    const packs = await getAllPacks()

    console.log(`   ✅ ${packs.length} packs récupérés via getAllPacks()\n`)

    if (packs.length === 0) {
      console.log('   ⚠️  Aucun pack trouvé !')
      console.log('   Vérifiez que les packs sont bien dans Supabase.\n')
      process.exit(1)
    }

    console.log('   📦 Premiers packs:')
    packs.slice(0, 5).forEach((pack, index) => {
      console.log(`      ${index + 1}. ${pack.name}`)
      console.log(`         ID: ${pack.id}`)
      console.log(`         Prix: ${pack.price} MAD`)
      console.log(`         Image: ${pack.image_url || 'N/A'}`)
      console.log(`         Vedette: ${pack.is_featured ? 'Oui' : 'Non'}\n`)
    })

    // Vérifier le format attendu par l'API
    console.log('2️⃣ Vérification du format des packs...\n')
    if (packs.length === 0) {
      console.log('   ⚠️  Aucun pack disponible pour vérifier le format\n')
      process.exit(1)
    }
    const samplePack = packs[0]
    if (!samplePack) {
      console.log('   ❌ Erreur: samplePack est undefined\n')
      process.exit(1)
    }
    const requiredFields = ['id', 'name', 'price', 'image_url']
    const missingFields = requiredFields.filter(field => !(field in samplePack))

    if (missingFields.length > 0) {
      console.log(`   ❌ Champs manquants: ${missingFields.join(', ')}\n`)
      process.exit(1)
    } else {
      console.log('   ✅ Tous les champs requis sont présents\n')
    }

    // Vérifier les images
    console.log('3️⃣ Vérification des images...\n')
    const packsWithImages = packs.filter(p => p.image_url && p.image_url !== '/placeholder.svg')
    console.log(`   ✅ ${packsWithImages.length}/${packs.length} packs ont des images valides`)

    if (packsWithImages.length < packs.length) {
      console.log(`   ⚠️  ${packs.length - packsWithImages.length} packs sans images`)
    }

    console.log('\n✅ Tous les tests sont passés!')
    console.log(`\n✅ ${packs.length} packs sont prêts à être affichés.`)

  } catch (error) {
    console.error('❌ Erreur lors du test:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

testApiPacks().catch(console.error)

