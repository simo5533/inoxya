/**
 * TEST COMPLET DE TOUTES LES APIs CRITIQUES
 * Vérifie que toutes les routes API fonctionnent correctement
 */

import * as dotenv from 'dotenv'
import { logger } from '../lib/logger'

dotenv.config({ path: '.env.local' })

interface ApiTest {
  name: string
  url: string
  method: string
  body?: unknown
  expectedStatus: number
  status: '✅' | '❌' | '⚠️'
  message: string
}

const tests: ApiTest[] = []

async function checkServerRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/csrf-token', {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // Timeout de 2 secondes
    })
    return response.ok
  } catch {
    return false
  }
}

async function testApi(name: string, url: string, method: string, body?: unknown, expectedStatus = 200) {
  try {
    const response = await fetch(`http://localhost:3000${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
    })
    
    const status = response.status === expectedStatus ? '✅' : '❌'
    const message = response.status === expectedStatus 
      ? `Status ${response.status} (attendu: ${expectedStatus})`
      : `Status ${response.status} (attendu: ${expectedStatus})`
    
    tests.push({ name, url, method, body, expectedStatus, status, message })
    
    if (response.status !== expectedStatus) {
      const errorData = await response.json().catch(() => ({}))
      logger.error(`[TEST] ${name} échoué:`, errorData)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isConnectionError = errorMessage.includes('fetch failed') || 
                             errorMessage.includes('ECONNREFUSED') ||
                             errorMessage.includes('timeout')
    
    tests.push({
      name,
      url,
      method,
      body,
      expectedStatus,
      status: '❌',
      message: isConnectionError 
        ? 'Serveur non accessible (lancez: npm run dev)'
        : `Erreur: ${errorMessage}`
    })
  }
}

async function main() {
  console.log('🧪 TEST COMPLET DE TOUTES LES APIs\n')
  
  // Vérifier si le serveur est en cours d'exécution
  console.log('🔍 Vérification du serveur Next.js...')
  const serverRunning = await checkServerRunning()
  
  if (!serverRunning) {
    console.log('❌ Serveur Next.js non accessible sur http://localhost:3000\n')
    console.log('💡 SOLUTIONS:')
    console.log('   1. Démarrer le serveur: npm run dev')
    console.log('   2. Utiliser test:apis-direct (teste sans serveur): npm run test:apis-direct\n')
    console.log('='.repeat(70))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(70))
    console.log('✅ Succès: 0')
    console.log('❌ Erreurs: 6 (serveur non démarré)')
    console.log('='.repeat(70) + '\n')
    console.log('⚠️  Pour tester les APIs sans serveur, utilisez: npm run test:apis-direct\n')
    process.exit(0)
  }
  
  console.log('✅ Serveur détecté, lancement des tests...\n')
  
  // Test 1: API Products
  await testApi('GET /api/products', '/api/products', 'GET', undefined, 200)
  
  // Test 2: API Products by ID
  await testApi('GET /api/products/[id]', '/api/products/1', 'GET', undefined, 200)
  
  // Test 3: API Packs
  await testApi('GET /api/packs', '/api/packs', 'GET', undefined, 200)
  
  // Test 4: API Categories
  await testApi('GET /api/categories', '/api/categories', 'GET', undefined, 200)
  
  // Test 5: API Health
  await testApi('GET /api/health', '/api/health', 'GET', undefined, 200)
  
  // Test 6: API CSRF Token
  await testApi('GET /api/csrf-token', '/api/csrf-token', 'GET', undefined, 200)
  
  console.log('\n' + '='.repeat(70))
  console.log('📊 RÉSULTATS DES TESTS')
  console.log('='.repeat(70) + '\n')
  
  for (const test of tests) {
    console.log(`${test.status} ${test.name}`)
    console.log(`   ${test.message}`)
  }
  
  const successCount = tests.filter(t => t.status === '✅').length
  const errorCount = tests.filter(t => t.status === '❌').length
  
  console.log('\n' + '='.repeat(70))
  console.log('📈 RÉSUMÉ')
  console.log('='.repeat(70))
  console.log(`✅ Succès: ${successCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log('='.repeat(70) + '\n')
  
  if (errorCount === 0) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !\n')
    process.exit(0)
  } else {
    console.log('❌ DES ERREURS ONT ÉTÉ DÉTECTÉES.\n')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale lors des tests:', error)
  process.exit(1)
})

