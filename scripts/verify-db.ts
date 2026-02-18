/**
 * Script de vérification de la base de données
 * Vérifie l'intégrité des données, catégories, images, etc.
 */

import { testConnection, select } from '@/lib/sqlite'
import fs from 'fs'
import path from 'path'

interface VerificationResult {
  category: string
  status: '✅' | '⚠️' | '❌'
  message: string
  details?: any
}

const results: VerificationResult[] = []

function addResult(category: string, status: '✅' | '⚠️' | '❌', message: string, details?: any) {
  results.push({ category, status, message, details })
}

async function verifyDatabaseConnection() {
  console.log('🔍 Vérification de la connexion à la base de données...\n')
  
  const isConnected = testConnection()
  if (!isConnected) {
    addResult('Connexion DB', '❌', 'Base de données non accessible')
    return false
  }
  
  addResult('Connexion DB', '✅', 'Base de données accessible')
  return true
}

function verifySchema() {
  console.log('📋 Vérification du schéma...\n')
  
  try {
    // Vérifier que les tables existent
    const tables = select(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('products', 'packs', 'categories', 'users')
    `) as Array<{ name: string }>
    
    const tableNames = tables.map(t => t.name)
    const requiredTables = ['products', 'packs', 'categories', 'users']
    const missingTables = requiredTables.filter(t => !tableNames.includes(t))
    
    if (missingTables.length > 0) {
      addResult('Schéma', '❌', `Tables manquantes: ${missingTables.join(', ')}`)
      return false
    }
    
    addResult('Schéma', '✅', `Toutes les tables présentes: ${tableNames.join(', ')}`)
    return true
  } catch (error) {
    addResult('Schéma', '❌', `Erreur lors de la vérification: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

function verifyProducts() {
  console.log('📦 Vérification des produits...\n')
  
  try {
    const products = select('SELECT id, name, category, image_url, is_active FROM products') as Array<{
      id: number
      name: string
      category: string | null
      image_url: string | null
      is_active: number
    }>
    
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.is_active === 1).length
    const productsWithImages = products.filter(p => p.image_url).length
    const productsWithoutImages = totalProducts - productsWithImages
    
    // Vérifier les catégories
    const categories = select('SELECT DISTINCT category FROM products WHERE category IS NOT NULL') as Array<{ category: string }>
    const categoryList = categories.map(c => c.category)
    
    // Détecter les produits de démonstration
    const demoPatterns = [
      /^test/i,
      /^demo/i,
      /^sample/i,
      /^exemple/i,
      /berbère or 18k/i,
      /filigrane argent/i,
      /khomsa protection/i
    ]
    
    const demoProducts = products.filter(p => 
      demoPatterns.some(pattern => pattern.test(p.name))
    )
    
    addResult('Produits', '✅', `Total: ${totalProducts}, Actifs: ${activeProducts}`, {
      total: totalProducts,
      active: activeProducts,
      withImages: productsWithImages,
      withoutImages: productsWithoutImages,
      categories: categoryList,
      demoProducts: demoProducts.length
    })
    
    if (demoProducts.length > 0) {
      addResult('Produits Demo', '⚠️', `${demoProducts.length} produit(s) de démonstration détecté(s)`, {
        names: demoProducts.map(p => p.name)
      })
    }
    
    if (productsWithoutImages > 0) {
      addResult('Images Produits', '⚠️', `${productsWithoutImages} produit(s) sans image`)
    }
    
    return true
  } catch (error) {
    addResult('Produits', '❌', `Erreur: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

function verifyPacks() {
  console.log('📦 Vérification des packs...\n')
  
  try {
    const packs = select('SELECT id, name, image_url, is_featured FROM packs') as Array<{
      id: number
      name: string
      image_url: string | null
      is_featured: number
    }>
    
    const totalPacks = packs.length
    const featuredPacks = packs.filter(p => p.is_featured === 1).length
    const packsWithImages = packs.filter(p => p.image_url).length
    
    addResult('Packs', '✅', `Total: ${totalPacks}, Vedettes: ${featuredPacks}`, {
      total: totalPacks,
      featured: featuredPacks,
      withImages: packsWithImages
    })
    
    return true
  } catch (error) {
    addResult('Packs', '❌', `Erreur: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

function verifyCategories() {
  console.log('🏷️  Vérification des catégories...\n')
  
  try {
    const categories = select('SELECT id, name, slug FROM categories') as Array<{
      id: number
      name: string
      slug: string
    }>
    
    // Vérifier le mapping canonique
    const { CATEGORIES } = require('@/lib/category-mapping')
    const canonicalSlugs = Object.keys(CATEGORIES)
    
    const dbSlugs = categories.map(c => c.slug)
    const missingSlugs = canonicalSlugs.filter(slug => !dbSlugs.includes(slug))
    const extraSlugs = dbSlugs.filter(slug => !canonicalSlugs.includes(slug))
    
    addResult('Catégories', '✅', `Total: ${categories.length}`, {
      categories: categories.map(c => ({ name: c.name, slug: c.slug })),
      missingSlugs,
      extraSlugs
    })
    
    if (missingSlugs.length > 0) {
      addResult('Catégories Mapping', '⚠️', `Slugs manquants dans DB: ${missingSlugs.join(', ')}`)
    }
    
    return true
  } catch (error) {
    addResult('Catégories', '❌', `Erreur: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

function verifyImages() {
  console.log('🖼️  Vérification des images...\n')
  
  try {
    const products = select('SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL') as Array<{
      id: number
      name: string
      image_url: string
    }>
    
    const publicDir = path.join(process.cwd(), 'public')
    const missingImages: Array<{ id: number; name: string; image_url: string }> = []
    
    for (const product of products) {
      const imagePath = product.image_url.startsWith('/') 
        ? path.join(publicDir, product.image_url)
        : path.join(publicDir, product.image_url)
      
      if (!fs.existsSync(imagePath)) {
        missingImages.push(product)
      }
    }
    
    const validImages = products.length - missingImages.length
    
    addResult('Images', validImages === products.length ? '✅' : '⚠️', 
      `${validImages}/${products.length} images valides`, {
        valid: validImages,
        missing: missingImages.length,
        missingDetails: missingImages.slice(0, 10) // Limiter à 10 pour l'affichage
      })
    
    if (missingImages.length > 0) {
      addResult('Images Manquantes', '⚠️', `${missingImages.length} image(s) manquante(s)`, {
        count: missingImages.length,
        examples: missingImages.slice(0, 5).map(p => ({ name: p.name, path: p.image_url }))
      })
    }
    
    return true
  } catch (error) {
    addResult('Images', '❌', `Erreur: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 RAPPORT DE VÉRIFICATION DE LA BASE DE DONNÉES\n')
  console.log('='.repeat(60) + '\n')
  
  const categories = [...new Set(results.map(r => r.category))]
  
  categories.forEach(category => {
    console.log(`\n📂 ${category.toUpperCase()}`)
    console.log('-'.repeat(60))
    
    const categoryResults = results.filter(r => r.category === category)
    categoryResults.forEach(r => {
      console.log(`${r.status} ${r.message}`)
      if (r.details) {
        console.log(`   Détails:`, JSON.stringify(r.details, null, 2))
      }
    })
  })
  
  const total = results.length
  const success = results.filter(r => r.status === '✅').length
  const warning = results.filter(r => r.status === '⚠️').length
  const error = results.filter(r => r.status === '❌').length
  
  console.log('\n' + '='.repeat(60))
  console.log('📈 RÉSUMÉ')
  console.log('='.repeat(60))
  console.log(`Total: ${total}`)
  console.log(`✅ Succès: ${success} (${Math.round(success/total*100)}%)`)
  console.log(`⚠️  Avertissements: ${warning} (${Math.round(warning/total*100)}%)`)
  console.log(`❌ Erreurs: ${error} (${Math.round(error/total*100)}%)`)
  console.log('='.repeat(60) + '\n')
  
  if (error === 0 && warning === 0) {
    console.log('✅ BASE DE DONNÉES PRÊTE POUR LA PRODUCTION!\n')
    process.exit(0)
  } else if (error === 0) {
    console.log('⚠️  Des avertissements nécessitent votre attention.\n')
    process.exit(0)
  } else {
    console.log('❌ Des erreurs critiques doivent être corrigées.\n')
    process.exit(1)
  }
}

async function main() {
  console.log('🔍 VÉRIFICATION COMPLÈTE DE LA BASE DE DONNÉES\n')
  console.log('='.repeat(60) + '\n')
  
  const isConnected = await verifyDatabaseConnection()
  if (!isConnected) {
    console.log('❌ Impossible de continuer sans connexion à la base de données.\n')
    process.exit(1)
  }
  
  verifySchema()
  verifyProducts()
  verifyPacks()
  verifyCategories()
  verifyImages()
  
  generateReport()
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

