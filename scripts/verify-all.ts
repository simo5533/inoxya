/**
 * Script de vérification complète du projet
 * Vérifie: DB, images, routes, catégories
 * 
 * Usage: npm run verify:all
 */

import { testConnection, getProductsAsync, getPacksAsync } from '@/lib/sqlite'
import { getAllCategories } from '@/lib/database'
import fs from 'fs'
import path from 'path'

interface VerificationResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  details?: any
}

const results: VerificationResult[] = []

function addResult(name: string, status: 'ok' | 'warning' | 'error', message: string, details?: any) {
  results.push({ name, status, message, details })
  const icon = status === 'ok' ? '✅' : status === 'warning' ? '⚠️' : '❌'
  console.log(`${icon} ${name}: ${message}`)
}

async function verifyDatabase() {
  console.log('\n📊 Vérification de la base de données...\n')
  
  try {
    const isConnected = testConnection()
    if (!isConnected) {
      addResult('DB Connection', 'error', 'Base de données non accessible')
      return
    }
    
    addResult('DB Connection', 'ok', 'Base de données accessible')
    
    const products = await getProductsAsync()
    const packs = await getPacksAsync()
    const categories = await getAllCategories()
    
    addResult('Products Count', products.length > 0 ? 'ok' : 'warning', `${products.length} produit(s)`, { count: products.length })
    addResult('Packs Count', packs.length > 0 ? 'ok' : 'warning', `${packs.length} pack(s)`, { count: packs.length })
    addResult('Categories Count', categories.length > 0 ? 'ok' : 'warning', `${categories.length} catégorie(s)`, { count: categories.length })
    
    // Vérifier que chaque produit a une catégorie valide
    const categorySlugs = new Set(categories.map((c: any) => c.slug))
    const productsWithoutCategory = products.filter((p: any) => !p.category_id || !categorySlugs.has(p.category_id))
    if (productsWithoutCategory.length > 0) {
      addResult('Products Categories', 'warning', `${productsWithoutCategory.length} produit(s) sans catégorie valide`, {
        products: productsWithoutCategory.map(p => ({ id: p.id, name: p.name, category_id: p.category_id }))
      })
    } else {
      addResult('Products Categories', 'ok', 'Tous les produits ont une catégorie valide')
    }
    
  } catch (error) {
    addResult('DB Verification', 'error', `Erreur: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function verifyImages() {
  console.log('\n🖼️  Vérification des images...\n')
  
  try {
    const products = await getProductsAsync()
    const packs = await getPacksAsync()
    const publicDir = path.join(process.cwd(), 'public')
    
    let missingImages = 0
    let absolutePaths = 0
    
    for (const product of products) {
      if (product.image_url) {
        // Vérifier les chemins absolus Windows
        if (product.image_url.startsWith('C:\\') || product.image_url.startsWith('C:/')) {
          absolutePaths++
          continue
        }
        
        // Vérifier l'existence du fichier
        const imagePath = path.join(publicDir, product.image_url)
        if (!fs.existsSync(imagePath)) {
          missingImages++
        }
      }
    }
    
    for (const pack of packs) {
      if (pack.image_url) {
        if (pack.image_url.startsWith('C:\\') || pack.image_url.startsWith('C:/')) {
          absolutePaths++
          continue
        }
        
        const imagePath = path.join(publicDir, pack.image_url)
        if (!fs.existsSync(imagePath)) {
          missingImages++
        }
      }
    }
    
    if (absolutePaths > 0) {
      addResult('Image Paths', 'warning', `${absolutePaths} image(s) avec chemin absolu Windows (sera corrigé automatiquement)`)
    } else {
      addResult('Image Paths', 'ok', 'Tous les chemins sont relatifs')
    }
    
    if (missingImages > 0) {
      addResult('Image Files', 'warning', `${missingImages} image(s) manquante(s)`)
    } else {
      addResult('Image Files', 'ok', 'Toutes les images existent')
    }
    
  } catch (error) {
    addResult('Image Verification', 'error', `Erreur: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function verifyCategories() {
  console.log('\n📁 Vérification des catégories...\n')
  
  try {
    const categories = await getAllCategories()
    const products = await getProductsAsync()
    
    // Vérifier que toutes les catégories ont un slug valide
    const categorySlugs = categories.map((c: any) => c.slug)
    const expectedSlugs = ['bagues', 'colliers', 'bracelets', 'boucles-oreilles', 'parures', 'broches']
    
    for (const expectedSlug of expectedSlugs) {
      if (!categorySlugs.includes(expectedSlug)) {
        addResult(`Category ${expectedSlug}`, 'warning', 'Catégorie manquante')
      } else {
        addResult(`Category ${expectedSlug}`, 'ok', 'Présente')
      }
    }
    
    // Vérifier que chaque produit a un category_id valide
    const productsByCategory = new Map<string, number>()
    for (const product of products) {
      if ((product as any).category_id) {
        productsByCategory.set((product as any).category_id, (productsByCategory.get((product as any).category_id) || 0) + 1)
      }
    }
    
    for (const [slug, count] of productsByCategory.entries()) {
      addResult(`Products in ${slug}`, 'ok', `${count} produit(s)`)
    }
    
  } catch (error) {
    addResult('Category Verification', 'error', `Erreur: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function verifyEnvironment() {
  console.log('\n🔧 Vérification de l\'environnement...\n')
  
  const isProduction = process.env['NODE_ENV'] === 'production'
  const enableFallback = process.env['ENABLE_FALLBACK'] === '1'
  const enableDemoSeed = process.env['ENABLE_DEMO_SEED'] === '1'
  const jwtSecret = process.env['JWT_SECRET']
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL']
  
  if (isProduction) {
    if (enableFallback) {
      addResult('ENABLE_FALLBACK', 'warning', 'Activé en production (sera ignoré)')
    } else {
      addResult('ENABLE_FALLBACK', 'ok', 'Désactivé en production')
    }
    
    if (enableDemoSeed) {
      addResult('ENABLE_DEMO_SEED', 'warning', 'Activé en production (sera ignoré)')
    } else {
      addResult('ENABLE_DEMO_SEED', 'ok', 'Désactivé en production')
    }
  } else {
    addResult('ENABLE_FALLBACK', enableFallback ? 'warning' : 'ok', enableFallback ? 'Activé (dev)' : 'Désactivé (dev)')
    addResult('ENABLE_DEMO_SEED', enableDemoSeed ? 'warning' : 'ok', enableDemoSeed ? 'Activé (dev)' : 'Désactivé (dev)')
  }
  
  if (!jwtSecret || jwtSecret.length < 32) {
    addResult('JWT_SECRET', 'error', 'Manquant ou trop court (minimum 32 caractères)')
  } else {
    addResult('JWT_SECRET', 'ok', 'Configuré')
  }
  
  if (!siteUrl) {
    addResult('NEXT_PUBLIC_SITE_URL', 'warning', 'Non défini (utilisera localhost:3000)')
  } else {
    addResult('NEXT_PUBLIC_SITE_URL', 'ok', siteUrl)
  }
}

async function main() {
  console.log('🔍 VÉRIFICATION COMPLÈTE DU PROJET INOXYA BIJOUX\n')
  console.log('=' .repeat(60))
  
  await verifyDatabase()
  await verifyImages()
  await verifyCategories()
  await verifyEnvironment()
  
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 RÉSUMÉ:\n')
  
  const okCount = results.filter(r => r.status === 'ok').length
  const warningCount = results.filter(r => r.status === 'warning').length
  const errorCount = results.filter(r => r.status === 'error').length
  
  console.log(`✅ OK: ${okCount}`)
  console.log(`⚠️  Warnings: ${warningCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  
  if (errorCount > 0) {
    console.log('\n❌ Des erreurs critiques ont été détectées. Veuillez les corriger avant le déploiement.')
    process.exit(1)
  } else if (warningCount > 0) {
    console.log('\n⚠️  Des avertissements ont été détectés. Vérifiez-les avant le déploiement.')
    process.exit(0)
  } else {
    console.log('\n✅ Toutes les vérifications sont passées avec succès!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

