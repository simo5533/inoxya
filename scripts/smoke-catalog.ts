#!/usr/bin/env tsx
/**
 * PHASE E: Script "anti-régression" pour tester les API après redémarrage
 * Vérifie que /api/products et /api/packs retournent toujours les données
 */

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:3000'

interface TestResult {
  name: string
  success: boolean
  message: string
  status?: number
  count?: number
}

async function testCatalogEndpoint(name: string, url: string): Promise<TestResult> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
    
    const status = response.status
    const data = await response.json()
    
    if (status !== 200) {
      return {
        name,
        success: false,
        message: `Status ${status}: ${data.error || 'Erreur inconnue'}`,
        status,
        count: 0,
      }
    }
    
    // Vérifier que la réponse contient des données
    // PHASE 6: /api/products retourne directement un tableau, /api/packs aussi
    const products = Array.isArray(data) ? data : (data.products || data.packs || [])
    const count = Array.isArray(products) ? products.length : 0
    
    return {
      name,
      success: true,
      message: `✅ ${count} élément(s) retourné(s)`,
      status: 200,
      count,
    }
  } catch (error) {
    return {
      name,
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
      count: 0,
    }
  }
}

async function main() {
  console.log('🧪 SMOKE TEST - Catalogue API\n')
  console.log(`Base URL: ${BASE_URL}\n`)
  
  const results: TestResult[] = []
  
  // Test 1: API Products
  console.log('📦 Test 1: GET /api/products')
  const productsResult = await testCatalogEndpoint('GET /api/products', `${BASE_URL}/api/products`)
  results.push(productsResult)
  console.log(`   ${productsResult.success ? '✅' : '❌'} ${productsResult.message}\n`)
  
  // Test 2: API Packs
  console.log('📦 Test 2: GET /api/packs')
  const packsResult = await testCatalogEndpoint('GET /api/packs', `${BASE_URL}/api/packs`)
  results.push(packsResult)
  console.log(`   ${packsResult.success ? '✅' : '❌'} ${packsResult.message}\n`)
  
  // Test 3: Health Check
  console.log('🏥 Test 3: GET /api/health')
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
    const healthData = await healthResponse.json()
    const healthSuccess = healthResponse.status === 200 && healthData.status === 'ok'
    const healthResult: TestResult = {
      name: 'GET /api/health',
      success: healthSuccess,
      message: healthSuccess 
        ? `✅ DB OK (${healthData.counts.products} produits, ${healthData.counts.packs} packs)`
        : `❌ Status ${healthResponse.status}: ${healthData.error || healthData.status}`,
      status: healthResponse.status,
    }
    results.push(healthResult)
    console.log(`   ${healthResult.success ? '✅' : '❌'} ${healthResult.message}\n`)
  } catch (error) {
    const healthResult: TestResult = {
      name: 'GET /api/health',
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
    }
    results.push(healthResult)
    console.log(`   ❌ ${healthResult.message}\n`)
  }
  
  // Résumé
  console.log('📊 RÉSUMÉ:')
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  
  results.forEach(r => {
    console.log(`   ${r.success ? '✅' : '❌'} ${r.name}: ${r.message}`)
  })
  
  console.log(`\n${successCount}/${totalCount} tests réussis`)
  
  if (successCount === totalCount) {
    console.log('\n✅ Tous les tests sont passés !\n')
    process.exit(0)
  } else {
    console.log('\n❌ Certains tests ont échoué\n')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
