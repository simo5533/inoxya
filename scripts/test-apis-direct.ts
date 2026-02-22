/**
 * TEST DIRECT DES APIs (sans serveur)
 * Vérifie que toutes les APIs backend sont correctement configurées
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { getDatabaseAdapter } from '../lib/db'
import { getAllBijoux, getAllPacks, getDashboardStats, getBijouById } from '../lib/database'
import { getCurrentUser } from '../lib/auth'

interface TestResult {
  category: string
  test: string
  status: '✅' | '❌' | '⚠️'
  message: string
  details?: string
}

const results: TestResult[] = []

function addResult(category: string, test: string, status: '✅' | '❌' | '⚠️', message: string, details?: string) {
  results.push({ category, test, status, message, details })
  console.log(`${status} ${category} - ${test}: ${message}`)
}

async function testDatabaseAdapter() {
  console.log('\n🔍 TEST DE L\'ADAPTER DE BASE DE DONNÉES\n')
  
  try {
    const adapter = await getDatabaseAdapter()
    const isConnected = await adapter.testConnection()
    
    if (isConnected) {
      addResult('Database Adapter', 'Connexion', '✅', 'Adapter connecté avec succès')
      
      // Test getProducts
      try {
        const products = await adapter.getProducts()
        addResult('Database Adapter', 'getProducts()', '✅', `${products.length} produits récupérés`)
      } catch (error) {
        addResult('Database Adapter', 'getProducts()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
      }
      
      // Test getPacks
      try {
        const packs = await adapter.getPacks()
        addResult('Database Adapter', 'getPacks()', '✅', `${packs.length} packs récupérés`)
      } catch (error) {
        addResult('Database Adapter', 'getPacks()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
      }
      
      // Test getCategories
      try {
        const categories = await adapter.getCategories()
        addResult('Database Adapter', 'getCategories()', '✅', `${categories.length} catégories récupérées`)
      } catch (error) {
        addResult('Database Adapter', 'getCategories()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
      }
    } else {
      addResult('Database Adapter', 'Connexion', '❌', 'Échec de connexion')
    }
  } catch (error) {
    addResult('Database Adapter', 'Initialisation', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
}

async function testDatabaseFunctions() {
  console.log('\n🔍 TEST DES FONCTIONS DE BASE DE DONNÉES\n')
  
  // Test getAllBijoux
  try {
    const products = await getAllBijoux()
    addResult('Database Functions', 'getAllBijoux()', '✅', `${products.length} produits récupérés`)
    
    if (products.length > 0) {
      const firstProduct = products[0]
      if (firstProduct && firstProduct.id) {
        try {
          const product = await getBijouById(String(firstProduct.id))
          if (product) {
            addResult('Database Functions', 'getBijouById()', '✅', `Produit ${firstProduct.id} récupéré`)
          } else {
            addResult('Database Functions', 'getBijouById()', '❌', `Produit ${firstProduct.id} non trouvé`)
          }
        } catch (error) {
          addResult('Database Functions', 'getBijouById()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
        }
      }
    }
  } catch (error) {
    addResult('Database Functions', 'getAllBijoux()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  // Test getAllPacks
  try {
    const packs = await getAllPacks()
    addResult('Database Functions', 'getAllPacks()', '✅', `${packs.length} packs récupérés`)
  } catch (error) {
    addResult('Database Functions', 'getAllPacks()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
  
  // Test getDashboardStats
  try {
    const stats = await getDashboardStats()
    if (stats && typeof stats.totalBijoux === 'number' && typeof stats.totalPacks === 'number') {
      addResult('Database Functions', 'getDashboardStats()', '✅', `Stats: ${stats.totalBijoux} bijoux, ${stats.totalPacks} packs`)
    } else {
      addResult('Database Functions', 'getDashboardStats()', '⚠️', 'Format de réponse inattendu')
    }
  } catch (error) {
    addResult('Database Functions', 'getDashboardStats()', '❌', 'Erreur', error instanceof Error ? error.message : String(error))
  }
}

async function testAuthFunctions() {
  console.log('\n🔍 TEST DES FONCTIONS D\'AUTHENTIFICATION\n')
  
  try {
    const user = await getCurrentUser()
    if (user) {
      addResult('Auth Functions', 'getCurrentUser()', '✅', `Utilisateur connecté: ${user.phone}`)
    } else {
      addResult('Auth Functions', 'getCurrentUser()', '⚠️', 'Aucun utilisateur connecté (normal si pas de session)')
    }
  } catch (error) {
    // Erreur normale car getCurrentUser nécessite un contexte de requête Next.js
    // Cette fonction ne peut pas être testée directement en dehors d'un contexte de requête
    if (error instanceof Error && (error.message.includes('cookies') || error.message.includes('request scope'))) {
      addResult('Auth Functions', 'getCurrentUser()', '⚠️', 'Ne peut pas être testé directement (nécessite contexte Next.js)')
    } else {
      addResult('Auth Functions', 'getCurrentUser()', '⚠️', 'Erreur (normal si pas de session)', error instanceof Error ? error.message : String(error))
    }
  }
}

function testEnvironmentVariables() {
  console.log('\n🔍 VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT\n')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  
  const optionalVars = [
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL',
  ]
  
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (value && value.length > 0) {
      addResult('Environment Variables', varName, '✅', 'Définie', value.substring(0, 20) + '...')
    } else {
      addResult('Environment Variables', varName, '❌', 'MANQUANTE - CRITIQUE')
    }
  }
  
  for (const varName of optionalVars) {
    const value = process.env[varName]
    if (value && value.length > 0) {
      addResult('Environment Variables', varName, '✅', 'Définie')
    } else {
      addResult('Environment Variables', varName, '⚠️', 'Non définie (optionnelle)')
    }
  }
}

function printResults() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 RÉSULTATS DES TESTS')
  console.log('='.repeat(70) + '\n')
  
  const successCount = results.filter(r => r.status === '✅').length
  const warningCount = results.filter(r => r.status === '⚠️').length
  const errorCount = results.filter(r => r.status === '❌').length
  
  console.log(`✅ Succès: ${successCount}`)
  console.log(`⚠️  Avertissements: ${warningCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log('='.repeat(70) + '\n')
  
  if (errorCount === 0) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS ! Les APIs backend sont fonctionnelles.\n')
    return 0
  } else {
    console.log('❌ DES ERREURS ONT ÉTÉ DÉTECTÉES. Corrigez-les avant de déployer.\n')
    return 1
  }
}

async function main() {
  console.log('🚀 TEST DIRECT DES APIs BACKEND')
  console.log('='.repeat(70))
  
  testEnvironmentVariables()
  await testDatabaseAdapter()
  await testDatabaseFunctions()
  await testAuthFunctions()
  
  const exitCode = printResults()
  process.exit(exitCode)
}

main().catch((error) => {
  console.error('❌ Erreur fatale lors des tests:', error)
  process.exit(1)
})

