/**
 * Smoke test rapide des endpoints API
 * Vérifie que les routes principales répondent correctement
 */

const SMOKE_TEST_BASE_URL = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000'

interface SmokeTestResult {
  endpoint: string
  method: string
  status: number
  success: boolean
  duration: number
  name: string
  message: string
  error?: string
}

const smokeTestResults: SmokeTestResult[] = []

async function testEndpoint(endpoint: string, method: string = 'GET'): Promise<SmokeTestResult> {
  const start = Date.now()
  try {
    const response = await fetch(`${SMOKE_TEST_BASE_URL}${endpoint}`, { method })
    const duration = Date.now() - start
    const success = response.ok || response.status === 503 // 503 acceptable si DB non disponible
    
    return {
      endpoint,
      method,
      status: response.status,
      success,
      duration,
      name: `${method} ${endpoint}`,
      message: `Status: ${response.status}`
    }
  } catch (error) {
    return {
      endpoint,
      method,
      status: 0,
      success: false,
      duration: Date.now() - start,
      name: `${method} ${endpoint}`,
      message: error instanceof Error ? error.message : String(error),
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function runSmokeTest() {
  console.log('🧪 SMOKE TEST - Vérification rapide des APIs\n')
  console.log('='.repeat(60) + '\n')
  console.log(`🌐 URL de base: ${SMOKE_TEST_BASE_URL}\n`)

  // Tests des APIs publiques
  console.log('📡 Test des APIs publiques...\n')
  
  smokeTestResults.push(await testEndpoint('/api/products'))
  smokeTestResults.push(await testEndpoint('/api/products?category=bagues'))
  smokeTestResults.push(await testEndpoint('/api/packs'))
  
  // Tests des pages
  console.log('📄 Test des pages...\n')
  
  const pages = ['/', '/bijoux', '/packs', '/faq', '/a-propos']
  for (const page of pages) {
    smokeTestResults.push(await testEndpoint(page))
  }

  // Rapport
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSULTATS DES TESTS\n')
  console.log('='.repeat(60) + '\n')

  smokeTestResults.forEach(r => {
    const icon = r.success ? '✅' : '❌'
    const statusText = r.status > 0 ? `Status: ${r.status}` : 'Erreur'
    const durationText = `(${r.duration}ms)`
    const errorText = r.error ? ` - ${r.error}` : ''
    console.log(`${icon} ${r.method} ${r.endpoint.padEnd(40)} ${statusText} ${durationText}${errorText}`)
  })

  const success = smokeTestResults.filter(r => r.success).length
  const total = smokeTestResults.length

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Succès: ${success}/${total} (${Math.round(success/total*100)}%)`)
  console.log('='.repeat(60) + '\n')

  if (success === total) {
    console.log('✅ TOUS LES TESTS SONT PASSÉS!\n')
    process.exit(0)
  } else {
    console.log('⚠️  Certains tests ont échoué.\n')
    process.exit(1)
  }
}

runSmokeTest().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

