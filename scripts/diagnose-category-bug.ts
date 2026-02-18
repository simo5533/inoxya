/**
 * Script de diagnostic du bug de filtrage par catégorie
 * PHASE 0 - Analyse sans modification
 * 
 * Usage: npx tsx scripts/diagnose-category-bug.ts
 */

import Database from 'better-sqlite3'
import { existsSync } from 'fs'
import { join } from 'path'

const dbPath = join(process.cwd(), 'data', 'inoxya_bijoux.db')

interface DiagnosticResult {
  dbCategories: string[]
  categoryTable: Array<{ id: number; name: string; slug: string }>
  productsByCategory: Record<string, number>
  mappingIssues: Array<{ productCategory: string; categorySlug: string | null; hasMatch: boolean }>
}

async function diagnoseCategoryBug(): Promise<DiagnosticResult> {
  console.log('🔍 DIAGNOSTIC DU BUG DE FILTRAGE PAR CATÉGORIE\n')
  console.log('=' .repeat(60) + '\n')

  if (!existsSync(dbPath)) {
    console.error(`❌ Base de données non trouvée: ${dbPath}`)
    process.exit(1)
  }

  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  try {
    // 1. Récupérer toutes les valeurs distinctes de products.category
    console.log('📊 1. Valeurs distinctes dans products.category:\n')
    const distinctCategories = db.prepare(`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM products 
      WHERE is_active = 1 
      GROUP BY category 
      ORDER BY count DESC
    `).all() as Array<{ category: string; count: number }>

    const dbCategories = distinctCategories.map(r => r.category)
    distinctCategories.forEach(({ category, count }) => {
      console.log(`   - "${category}": ${count} produit(s)`)
    })
    console.log()

    // 2. Récupérer toutes les catégories de la table categories
    console.log('📋 2. Catégories dans la table categories:\n')
    const categoryTable = db.prepare('SELECT id, name, slug FROM categories ORDER BY name').all() as Array<{
      id: number
      name: string
      slug: string
    }>

    categoryTable.forEach(({ id, name, slug }) => {
      console.log(`   - ID: ${id}, Name: "${name}", Slug: "${slug}"`)
    })
    console.log()

    // 3. Créer un mapping name -> slug
    const nameToSlug = Object.fromEntries(categoryTable.map(c => [c.name, c.slug]))

    console.log('🔗 3. Mapping name -> slug:\n')
    Object.entries(nameToSlug).forEach(([name, slug]) => {
      console.log(`   "${name}" → "${slug}"`)
    })
    console.log()

    // 4. Analyser les produits par catégorie
    console.log('📦 4. Produits par catégorie (DB):\n')
    const productsByCategory: Record<string, number> = {}
    distinctCategories.forEach(({ category, count }) => {
      productsByCategory[category] = count
      const slug = nameToSlug[category]
      const status = slug ? '✅' : '❌'
      console.log(`   ${status} "${category}" → ${count} produit(s) → slug: "${slug || 'NON TROUVÉ'}"`)
    })
    console.log()

    // 5. Identifier les problèmes de mapping
    console.log('⚠️  5. Problèmes de mapping identifiés:\n')
    const mappingIssues: Array<{ productCategory: string; categorySlug: string | null; hasMatch: boolean }> = []
    
    distinctCategories.forEach(({ category }) => {
      const slug = nameToSlug[category]
      const hasMatch = !!slug
      mappingIssues.push({
        productCategory: category,
        categorySlug: slug || null,
        hasMatch
      })

      if (!hasMatch) {
        console.log(`   ❌ "${category}" n'a pas de correspondance dans la table categories`)
      } else {
        // Vérifier si les produits ont le bon category_id
        const products = db.prepare(`
          SELECT id, name, category 
          FROM products 
          WHERE category = ? AND is_active = 1 
          LIMIT 3
        `).all(category) as Array<{ id: number; name: string; category: string }>
        
        if (products.length > 0) {
          console.log(`   ✅ "${category}" → "${slug}" (${products.length} produit(s) trouvé(s))`)
        }
      }
    })
    console.log()

    // 6. Test de filtrage par slug
    console.log('🧪 6. Test de filtrage par slug:\n')
    categoryTable.forEach(({ slug, name }) => {
      // Compter les produits qui devraient correspondre
      const expectedCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE category = ? AND is_active = 1
      `).get(name) as { count: number }

      console.log(`   Slug: "${slug}" (name: "${name}")`)
      console.log(`      → ${expectedCount.count} produit(s) attendu(s)`)
    })
    console.log()

    // 7. Résumé
    console.log('📊 RÉSUMÉ:\n')
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
    const totalCategories = categoryTable.length
    const unmatchedCategories = mappingIssues.filter(m => !m.hasMatch).length

    console.log(`   - Total produits actifs: ${totalProducts.count}`)
    console.log(`   - Total catégories dans DB: ${totalCategories}`)
    console.log(`   - Catégories sans correspondance: ${unmatchedCategories}`)
    console.log()

    if (unmatchedCategories > 0) {
      console.log('❌ PROBLÈME DÉTECTÉ: Certaines catégories de produits ne correspondent pas aux slugs.\n')
      console.log('💡 SOLUTION: Normaliser les valeurs de products.category pour correspondre aux noms de categories.name\n')
    } else {
      console.log('✅ Toutes les catégories ont une correspondance.\n')
      console.log('💡 Vérifier que le filtrage frontend utilise bien les slugs.\n')
    }

    return {
      dbCategories,
      categoryTable,
      productsByCategory,
      mappingIssues
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
    throw error
  } finally {
    db.close()
  }
}

diagnoseCategoryBug()
  .then(() => {
    console.log('✅ Diagnostic terminé.\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

