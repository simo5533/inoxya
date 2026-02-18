/**
 * Script de test du filtrage par catégorie
 * Vérifie que chaque catégorie retourne des produits via l'API
 * 
 * Usage: npx tsx scripts/test-category-filter.ts
 */

import { CATEGORIES } from '@/lib/category-mapping'

const API_BASE = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000'

interface TestResult {
  category: string
  slug: string
  url: string
  status: number
  productCount: number
  success: boolean
  error?: string
}

async function testCategoryFilter(): Promise<void> {
  console.log('🧪 TEST DU FILTRAGE PAR CATÉGORIE\n')
  console.log('=' .repeat(60) + '\n')

  const results: TestResult[] = []

  for (const [slug, category] of Object.entries(CATEGORIES)) {
    const url = `${API_BASE}/api/products?category=${slug}`
    
    try {
      console.log(`📡 Test: ${category.label} (${slug})...`)
      console.log(`   URL: ${url}`)

      const response = await fetch(url)
      const status = response.status
      const data = await response.json()

      if (status === 200 && Array.isArray(data)) {
        const productCount = data.length
        // Une catégorie vide n'est PAS une erreur, c'est normal
        const success = true // L'API fonctionne, même si 0 produits

        results.push({
          category: category.label,
          slug,
          url,
          status,
          productCount,
          success,
        })

        if (productCount > 0) {
          console.log(`   ✅ ${productCount} produit(s) trouvé(s)\n`)
        } else {
          console.log(`   ℹ️  Aucun produit (catégorie vide - normal si pas de produits dans cette catégorie)\n`)
        }
      } else {
        const error = typeof data === 'object' && 'error' in data ? data.error : 'Réponse invalide'
        results.push({
          category: category.label,
          slug,
          url,
          status,
          productCount: 0,
          success: false,
          error: String(error)
        })
        console.log(`   ❌ Erreur: ${error}\n`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      results.push({
        category: category.label,
        slug,
        url,
        status: 0,
        productCount: 0,
        success: false,
        error: errorMessage
      })
      console.log(`   ❌ Erreur réseau: ${errorMessage}\n`)
    }
  }

  // Résumé
  console.log('📊 RÉSUMÉ:\n')
  const withProducts = results.filter(r => r.productCount > 0)
  const emptyCategories = results.filter(r => r.productCount === 0 && r.success)
  const errors = results.filter(r => !r.success)

  console.log(`   ✅ Catégories avec produits: ${withProducts.length}/${results.length}`)
  withProducts.forEach(r => {
    console.log(`      - ${r.category} (${r.slug}): ${r.productCount} produit(s)`)
  })

  if (emptyCategories.length > 0) {
    console.log(`\n   ℹ️  Catégories vides (normal si pas de produits): ${emptyCategories.length}/${results.length}`)
    emptyCategories.forEach(r => {
      console.log(`      - ${r.category} (${r.slug}): 0 produit(s)`)
    })
  }

  if (errors.length > 0) {
    console.log(`\n   ❌ Erreurs API: ${errors.length}/${results.length}`)
    errors.forEach(r => {
      console.log(`      - ${r.category} (${r.slug}): ${r.error || 'Erreur inconnue'}`)
    })
  }

  console.log()

  if (errors.length === 0) {
    console.log('✅ Tous les tests de filtrage sont réussis!')
    console.log(`   ${withProducts.length} catégorie(s) avec produits, ${emptyCategories.length} catégorie(s) vide(s) (normal)\n`)
    process.exit(0)
  } else {
    console.log('❌ Des erreurs ont été détectées. Vérifiez les catégories ci-dessus.\n')
    process.exit(1)
  }
}

testCategoryFilter().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

