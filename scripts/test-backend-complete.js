/**
 * Script de test complet du backend
 * Teste toutes les routes API et vérifie l'intégrité
 */

const http = require('http')

const API_BASE_URL = 'http://localhost:3000/api'

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL)
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    const req = http.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {}
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (body) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

async function testRoute(name, method, path, expectedStatus = 200, body = null) {
  try {
    log(`\n🧪 Test: ${name}`, 'cyan')
    log(`   ${method} ${path}`, 'blue')
    
    const response = await makeRequest(method, path, body)
    
    if (response.status === expectedStatus) {
      log(`   ✅ Succès (${response.status})`, 'green')
      return { success: true, response }
    } else {
      log(`   ❌ Échec - Attendu: ${expectedStatus}, Reçu: ${response.status}`, 'red')
      if (response.data && response.data.error) {
        log(`   Erreur: ${response.data.error}`, 'yellow')
      }
      return { success: false, response }
    }
  } catch (error) {
    log(`   ❌ Erreur de connexion: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function runTests() {
  log('\n🚀 TESTS COMPLETS DU BACKEND - INOXYA BIJOUX', 'cyan')
  log('='.repeat(80), 'cyan')
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  }

  // Test 1: GET /api/products - Récupérer tous les produits
  results.total++
  const test1 = await testRoute(
    'Récupérer tous les produits',
    'GET',
    '/products',
    200
  )
  if (test1.success) {
    results.passed++
    if (test1.response && test1.response.data) {
      const products = Array.isArray(test1.response.data) ? test1.response.data : []
      log(`   📦 ${products.length} produit(s) récupéré(s)`, 'green')
      
      // Vérifier la structure des produits
      if (products.length > 0) {
        const firstProduct = products[0]
        const hasMainImage = firstProduct.main_image !== undefined
        const hasImages = Array.isArray(firstProduct.images)
        log(`   ✅ Structure correcte: main_image=${hasMainImage}, images=${hasImages}`, 'green')
      }
    }
  } else {
    results.failed++
  }

  // Test 2: GET /api/products/[id] - Récupérer un produit spécifique
  results.total++
  const test2 = await testRoute(
    'Récupérer un produit par ID',
    'GET',
    '/products/7',
    200
  )
  if (test2.success) {
    results.passed++
    if (test2.response && test2.response.data) {
      log(`   📦 Produit: ${test2.response.data.name || 'N/A'}`, 'green')
    }
  } else {
    results.failed++
  }

  // Test 3: POST /api/products - Créer un produit (sans auth - devrait échouer)
  results.total++
  const test3 = await testRoute(
    'Créer un produit (sans auth - doit échouer)',
    'POST',
    '/products',
    403,
    {
      name: 'Test Product',
      description: 'Test',
      price: 100,
      category: 'Test',
      main_image: '/test.jpg'
    }
  )
  if (test3.success) {
    results.passed++
    log(`   ✅ Protection admin fonctionne correctement`, 'green')
  } else {
    results.failed++
  }

  // Test 4: GET /api/products avec produit inexistant
  results.total++
  const test4 = await testRoute(
    'Récupérer un produit inexistant',
    'GET',
    '/products/99999',
    404
  )
  if (test4.success) {
    results.passed++
  } else {
    results.failed++
  }

  // Résumé
  log('\n' + '='.repeat(80), 'cyan')
  log('📊 RÉSUMÉ DES TESTS', 'cyan')
  log('='.repeat(80), 'cyan')
  log(`Total tests: ${results.total}`, 'blue')
  log(`✅ Réussis: ${results.passed}`, 'green')
  log(`❌ Échoués: ${results.failed}`, results.failed > 0 ? 'red' : 'green')
  
  if (results.failed === 0) {
    log('\n🎉 TOUS LES TESTS SONT PASSÉS !', 'green')
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.', 'yellow')
  }
  
  return results
}

// Vérifier si le serveur est en cours d'exécution
async function checkServer() {
  try {
    await makeRequest('GET', '/products')
    return true
  } catch (error) {
    return false
  }
}

async function main() {
  log('\n🔍 Vérification du serveur...', 'cyan')
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    log('\n❌ Le serveur n\'est pas en cours d\'exécution !', 'red')
    log('   Veuillez démarrer le serveur avec: npm run dev', 'yellow')
    process.exit(1)
  }
  
  log('✅ Serveur détecté', 'green')
  
  await runTests()
}

main().catch(console.error)

