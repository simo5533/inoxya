/**
 * Script de test pour vérifier que les produits s'affichent correctement
 */

import { getAllBijoux, getBijouxVedettes } from '../lib/database'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testProductsDisplay() {
  console.log('🔍 Test d\'affichage des produits...\n')

  try {
    // Test 1: Récupérer tous les produits
    console.log('1️⃣ Test getAllBijoux()...')
    const allProducts = await getAllBijoux()
    console.log(`   ✅ ${allProducts.length} produits récupérés`)
    
    if (allProducts.length === 0) {
      console.error('   ❌ Aucun produit trouvé!')
      return false
    }

    // Afficher les 5 premiers produits avec leurs images
    console.log('\n   📦 Premiers produits:')
    allProducts.slice(0, 5).forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.name}`)
      console.log(`         Prix: ${p.price} MAD`)
      console.log(`         Image: ${p.image_url || p.main_image || '(aucune)'}`)
      console.log(`         Disponible: ${p.is_available ? 'Oui' : 'Non'}`)
      console.log(`         Vedette: ${p.is_featured ? 'Oui' : 'Non'}`)
    })

    // Test 2: Récupérer les produits vedettes
    console.log('\n2️⃣ Test getBijouxVedettes()...')
    const featuredProducts = await getBijouxVedettes(8)
    console.log(`   ✅ ${featuredProducts.length} produits vedettes récupérés`)
    
    if (featuredProducts.length === 0) {
      console.warn('   ⚠️  Aucun produit vedette trouvé')
    } else {
      console.log('\n   ⭐ Produits vedettes:')
      featuredProducts.slice(0, 3).forEach((p, i) => {
        console.log(`      ${i + 1}. ${p.name} - ${p.image_url || p.main_image || '(aucune image)'}`)
      })
    }

    // Test 3: Vérifier les images
    console.log('\n3️⃣ Vérification des images...')
    const productsWithImages = allProducts.filter(p => {
      const img = p.image_url || p.main_image
      return img && img !== '/placeholder.svg' && !img.includes('C:\\') && !img.includes('D:\\')
    })
    console.log(`   ✅ ${productsWithImages.length}/${allProducts.length} produits ont des images valides`)
    
    const productsWithoutImages = allProducts.filter(p => {
      const img = p.image_url || p.main_image
      return !img || img === '/placeholder.svg' || img.includes('C:\\') || img.includes('D:\\')
    })
    
    if (productsWithoutImages.length > 0) {
      console.warn(`   ⚠️  ${productsWithoutImages.length} produits sans images valides:`)
      productsWithoutImages.slice(0, 3).forEach(p => {
        console.log(`      - ${p.name}: ${p.image_url || p.main_image || '(aucune)'}`)
      })
    }

    // Test 4: Vérifier les catégories
    console.log('\n4️⃣ Vérification des catégories...')
    const categories = new Set(allProducts.map(p => p.category_id || (p as { category?: string }).category || 'Général'))
    console.log(`   ✅ ${categories.size} catégories trouvées: ${Array.from(categories).join(', ')}`)

    console.log('\n🎉 Tous les tests sont passés!')
    console.log(`\n✅ ${allProducts.length} produits sont prêts à être affichés sur le site.`)
    return true

  } catch (error: any) {
    console.error('❌ Erreur lors du test:', error.message)
    console.error('   Stack:', error.stack)
    return false
  }
}

testProductsDisplay()
  .then((success) => {
    if (!success) {
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

