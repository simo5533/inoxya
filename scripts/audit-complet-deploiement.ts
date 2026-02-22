/**
 * AUDIT COMPLET AVANT DÉPLOIEMENT
 * Vérifie tous les aspects critiques du projet avant redéploiement sur Vercel
 */

import * as dotenv from 'dotenv'
import { getDatabaseAdapter } from '../lib/db'
import { getAllBijoux, getBijouById, getAllPacks, getDashboardStats } from '../lib/database'

dotenv.config({ path: '.env.local' })

interface AuditResult {
  category: string
  test: string
  status: '✅' | '❌' | '⚠️'
  message: string
  details?: string
}

const results: AuditResult[] = []

function addResult(category: string, test: string, status: '✅' | '❌' | '⚠️', message: string, details?: string) {
  results.push({ category, test, status, message, details })
}

async function auditEnvironmentVariables() {
  console.log('\n🔍 1. VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT\n')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
  
  const optionalVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_SITE_URL',
  ]
  
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (value && value.length > 0) {
      addResult('Variables d\'environnement', varName, '✅', 'Définie', value.substring(0, 20) + '...')
    } else {
      addResult('Variables d\'environnement', varName, '❌', 'MANQUANTE - CRITIQUE pour Vercel')
    }
  }
  
  for (const varName of optionalVars) {
    const value = process.env[varName]
    if (value && value.length > 0) {
      addResult('Variables d\'environnement', varName, '✅', 'Définie')
    } else {
      addResult('Variables d\'environnement', varName, '⚠️', 'Non définie (optionnelle)')
    }
  }
}

async function auditDatabaseConnection() {
  console.log('\n🔍 2. VÉRIFICATION DE LA CONNEXION BASE DE DONNÉES\n')
  
  try {
    const adapter = await getDatabaseAdapter()
    const isConnected = await adapter.testConnection()
    
    if (isConnected) {
      addResult('Base de données', 'Connexion', '✅', 'Connexion réussie')
      
      // Tester les opérations critiques
      try {
        const products = await adapter.getProducts()
        addResult('Base de données', 'getProducts()', '✅', `${products.length} produits récupérés`)
      } catch (error) {
        addResult('Base de données', 'getProducts()', '❌', 'Erreur lors de la récupération', error instanceof Error ? error.message : String(error))
      }
      
      try {
        const packs = await adapter.getPacks()
        addResult('Base de données', 'getPacks()', '✅', `${packs.length} packs récupérés`)
      } catch (error) {
        addResult('Base de données', 'getPacks()', '❌', 'Erreur lors de la récupération', error instanceof Error ? error.message : String(error))
      }
      
      try {
        const categories = await adapter.getCategories()
        addResult('Base de données', 'getCategories()', '✅', `${categories.length} catégories récupérées`)
      } catch (error) {
        addResult('Base de données', 'getCategories()', '❌', 'Erreur lors de la récupération', error instanceof Error ? error.message : String(error))
      }
      
    } else {
      addResult('Base de données', 'Connexion', '❌', 'Échec de connexion')
    }
  } catch (error) {
    addResult('Base de données', 'Connexion', '❌', 'Erreur lors de la connexion', error instanceof Error ? error.message : String(error))
  }
}

async function auditDatabaseFunctions() {
  console.log('\n🔍 3. VÉRIFICATION DES FONCTIONS DE BASE DE DONNÉES\n')
  
  try {
    const allProducts = await getAllBijoux()
    addResult('Fonctions DB', 'getAllBijoux()', '✅', `${allProducts.length} produits récupérés`)
    
    if (allProducts.length > 0) {
      const firstProduct = allProducts[0]
      if (firstProduct && firstProduct.id) {
        const product = await getBijouById(String(firstProduct.id))
        if (product) {
          addResult('Fonctions DB', 'getBijouById()', '✅', `Produit ${firstProduct.id} récupéré`)
        } else {
          addResult('Fonctions DB', 'getBijouById()', '❌', `Produit ${firstProduct.id} non trouvé`)
        }
      }
    }
  } catch (error) {
    addResult('Fonctions DB', 'getAllBijoux()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  try {
    const packs = await getAllPacks()
    addResult('Fonctions DB', 'getAllPacks()', '✅', `${packs.length} packs récupérés`)
  } catch (error) {
    addResult('Fonctions DB', 'getAllPacks()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  try {
    const stats = await getDashboardStats()
    addResult('Fonctions DB', 'getDashboardStats()', '✅', `Stats: ${stats.totalBijoux} bijoux, ${stats.totalPacks} packs`)
  } catch (error) {
    addResult('Fonctions DB', 'getDashboardStats()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
}

async function auditImagePaths() {
  console.log('\n🔍 4. VÉRIFICATION DES CHEMINS D\'IMAGES\n')
  
  try {
    const products = await getAllBijoux()
    let validImages = 0
    let invalidImages = 0
    
    for (const product of products.slice(0, 10)) {
      const imageUrl = product.image_url || product.main_image || ''
      if (imageUrl) {
        // Vérifier que l'URL est valide (commence par / ou http)
        if (imageUrl.startsWith('/') || imageUrl.startsWith('http')) {
          validImages++
        } else {
          invalidImages++
        }
      }
    }
    
    if (invalidImages === 0) {
      addResult('Images', 'Chemins valides', '✅', `${validImages} images valides`)
    } else {
      addResult('Images', 'Chemins valides', '⚠️', `${validImages} valides, ${invalidImages} invalides`)
    }
  } catch (error) {
    addResult('Images', 'Vérification', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
}

function printResults() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 RÉSULTATS DE L\'AUDIT COMPLET')
  console.log('='.repeat(70) + '\n')
  
  const categories = [...new Set(results.map(r => r.category))]
  
  for (const category of categories) {
    console.log(`\n📁 ${category.toUpperCase()}`)
    console.log('-'.repeat(70))
    
    const categoryResults = results.filter(r => r.category === category)
    for (const result of categoryResults) {
      console.log(`  ${result.status} ${result.test}`)
      console.log(`     ${result.message}`)
      if (result.details) {
        console.log(`     Détails: ${result.details}`)
      }
    }
  }
  
  const successCount = results.filter(r => r.status === '✅').length
  const warningCount = results.filter(r => r.status === '⚠️').length
  const errorCount = results.filter(r => r.status === '❌').length
  
  console.log('\n' + '='.repeat(70))
  console.log('📈 RÉSUMÉ')
  console.log('='.repeat(70))
  console.log(`✅ Succès: ${successCount}`)
  console.log(`⚠️  Avertissements: ${warningCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log('='.repeat(70) + '\n')
  
  if (errorCount === 0) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS ! Le projet est prêt pour le déploiement.\n')
    return 0
  } else {
    console.log('❌ DES ERREURS ONT ÉTÉ DÉTECTÉES. Corrigez-les avant de déployer.\n')
    return 1
  }
}

async function main() {
  console.log('🚀 AUDIT COMPLET AVANT DÉPLOIEMENT')
  console.log('='.repeat(70))
  
  await auditEnvironmentVariables()
  await auditDatabaseConnection()
  await auditDatabaseFunctions()
  await auditImagePaths()
  
  const exitCode = printResults()
  process.exit(exitCode)
}

main().catch((error) => {
  console.error('❌ Erreur fatale lors de l\'audit:', error)
  process.exit(1)
})

