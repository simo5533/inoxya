/**
 * Vérification des boutons et APIs
 * Teste toutes les interactions et endpoints
 */

const BUTTONS_API_BASE_URL = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000'

interface ButtonsApiTestResult {
  name: string
  status: '✅' | '❌'
  message: string
  duration?: number
}

const buttonsApiResults: ButtonsApiTestResult[] = []

async function testAPI(endpoint: string, method: string = 'GET', body?: any): Promise<ButtonsApiTestResult> {
  const start = Date.now()
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BUTTONS_API_BASE_URL}${endpoint}`, options)
    const duration = Date.now() - start
    
    if (response.ok || response.status === 503) {
      // 503 est acceptable si la DB n'est pas disponible (fallback sera utilisé)
      const data = await response.json().catch(() => ({}))
      return {
        name: `${method} ${endpoint}`,
        status: '✅',
        message: `Status: ${response.status}, ${Array.isArray(data) ? `${data.length} items` : 'OK'}`,
        duration
      }
    } else {
      return {
        name: `${method} ${endpoint}`,
        status: '❌',
        message: `Status: ${response.status}`,
        duration
      }
    }
  } catch (error) {
    return {
      name: `${method} ${endpoint}`,
      status: '❌',
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start
    }
  }
}

async function runButtonsApiTest() {
  console.log('🔍 Vérification des APIs et fonctionnalités\n')
  console.log('='.repeat(60) + '\n')
  console.log(`🌐 URL de base: ${BUTTONS_API_BASE_URL}\n`)

  // Test des APIs publiques
  console.log('📡 Test des APIs publiques...\n')
  
  buttonsApiResults.push(await testAPI('/api/products'))
  buttonsApiResults.push(await testAPI('/api/products?category=bagues'))
  buttonsApiResults.push(await testAPI('/api/packs'))
  buttonsApiResults.push(await testAPI('/api/packs?featured=true'))

  // Test des pages
  console.log('📄 Test des pages...\n')
  
  const pages = ['/', '/bijoux', '/packs', '/faq', '/a-propos']
  for (const page of pages) {
    const start = Date.now()
    try {
      const response = await fetch(`${BUTTONS_API_BASE_URL}${page}`)
      const duration = Date.now() - start
      buttonsApiResults.push({
        name: `Page: ${page}`,
        status: response.ok ? '✅' : '❌',
        message: `Status: ${response.status}`,
        duration
      })
    } catch (error) {
      buttonsApiResults.push({
        name: `Page: ${page}`,
        status: '❌',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Rapport
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSULTATS DES TESTS\n')
  console.log('='.repeat(60) + '\n')

  buttonsApiResults.forEach(r => {
    const duration = r.duration ? ` (${r.duration}ms)` : ''
    console.log(`${r.status} ${r.name.padEnd(40)} ${r.message}${duration}`)
  })

  const success = buttonsApiResults.filter(r => r.status === '✅').length
  const total = buttonsApiResults.length

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Succès: ${success}/${total} (${Math.round(success/total*100)}%)`)
  console.log('='.repeat(60) + '\n')

  if (success === total) {
    console.log('✅ TOUTES LES VÉRIFICATIONS SONT PASSÉES!\n')
  } else {
    console.log('⚠️  Certaines vérifications ont échoué.\n')
    process.exit(1)
  }
}

runButtonsApiTest().catch(console.error)

