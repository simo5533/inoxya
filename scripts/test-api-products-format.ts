/**
 * Test du format de réponse de l'API /api/products
 * Vérifie que l'API retourne bien { products: [...], total: ... }
 */

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testApiProductsFormat() {
  console.log('🔍 Test du format de réponse de l\'API /api/products...\n')

  try {
    const baseUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000'
    const url = `${baseUrl}/api/products`
    
    console.log(`1️⃣ Appel de l'API: ${url}`)
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log('\n2️⃣ Analyse du format de réponse:')
    console.log(`   Type: ${Array.isArray(data) ? 'Array' : typeof data}`)
    
    if (Array.isArray(data)) {
      console.log(`   ❌ PROBLÈME: L'API retourne un array directement`)
      console.log(`   ✅ Format attendu: { products: [...], total: ... }`)
      console.log(`   📦 Nombre de produits: ${data.length}`)
    } else if (data && typeof data === 'object') {
      if ('products' in data && 'total' in data) {
        console.log(`   ✅ Format correct: { products: [...], total: ... }`)
        console.log(`   📦 Nombre de produits: ${data.total}`)
        console.log(`   📋 Produits dans l'array: ${Array.isArray(data.products) ? data.products.length : 'N/A'}`)
        
        if (data.products && data.products.length > 0) {
          console.log(`\n3️⃣ Premiers produits:`)
          data.products.slice(0, 3).forEach((p: { id?: string | number; name?: string; price?: number }, index: number) => {
            console.log(`   ${index + 1}. ID: ${p.id}, Nom: ${p.name}, Prix: ${p.price} MAD`)
          })
        } else {
          console.log(`\n⚠️  ATTENTION: Aucun produit dans la réponse`)
        }
      } else {
        console.log(`   ❌ PROBLÈME: Format inattendu`)
        console.log(`   Clés présentes: ${Object.keys(data).join(', ')}`)
      }
    } else {
      console.log(`   ❌ PROBLÈME: Format inattendu (${typeof data})`)
    }

    console.log('\n✅ Test terminé !')
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

testApiProductsFormat()

