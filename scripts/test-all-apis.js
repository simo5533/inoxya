#!/usr/bin/env node

/**
 * Script de test complet de toutes les APIs INOXYA BIJOUX
 * Vérifie que toutes les routes API fonctionnent correctement
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
const ADMIN_PHONE = process.env.ADMIN_PHONE || '0612345678'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!'

let authToken = null
let authCookie = null

const results = {
  passed: 0,
  failed: 0,
  errors: []
}

// Fonction pour faire des requêtes HTTP
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (authCookie) {
      options.headers['Cookie'] = authCookie
    }

    const protocol = url.protocol === 'https:' ? https : http
    const req = protocol.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          })
        }
      })
    })

    req.on('error', reject)
    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

// Test de connexion admin
async function testAdminLogin() {
  console.log('\n🔐 Test: Connexion Admin')
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      phone: ADMIN_PHONE,
      password: ADMIN_PASSWORD
    })

    if (response.status === 200 && response.body.success) {
      authCookie = response.headers['set-cookie']?.join('; ') || null
      results.passed++
      console.log('  ✅ Connexion admin réussie')
      return true
    } else {
      results.failed++
      results.errors.push('Login admin échoué')
      console.log('  ❌ Connexion admin échouée:', response.body)
      return false
    }
  } catch (error) {
    results.failed++
    results.errors.push(`Login admin: ${error.message}`)
    console.log('  ❌ Erreur:', error.message)
    return false
  }
}

// Tests des APIs Produits
async function testProductsAPIs() {
  console.log('\n📦 Tests: APIs Produits')
  
  // GET /api/products
  try {
    const response = await makeRequest('GET', '/api/products')
    if (response.status === 200 && Array.isArray(response.body)) {
      results.passed++
      console.log(`  ✅ GET /api/products - ${response.body.length} produits`)
    } else {
      results.failed++
      console.log('  ❌ GET /api/products - Échec')
    }
  } catch (error) {
    results.failed++
    console.log('  ❌ GET /api/products - Erreur:', error.message)
  }

  // GET /api/products/[id] (premier produit)
  try {
    const listResponse = await makeRequest('GET', '/api/products')
    if (listResponse.status === 200 && Array.isArray(listResponse.body) && listResponse.body.length > 0) {
      const firstProductId = listResponse.body[0].id
      const response = await makeRequest('GET', `/api/products/${firstProductId}`)
      if (response.status === 200 && response.body.id) {
        results.passed++
        console.log(`  ✅ GET /api/products/${firstProductId}`)
      } else {
        results.failed++
        console.log('  ❌ GET /api/products/[id] - Échec')
      }
    }
  } catch (error) {
    results.failed++
    console.log('  ❌ GET /api/products/[id] - Erreur:', error.message)
  }
}

// Tests des APIs Commandes
async function testOrdersAPIs() {
  console.log('\n📋 Tests: APIs Commandes')
  
  // GET /api/orders (admin)
  try {
    const response = await makeRequest('GET', '/api/orders')
    if (response.status === 200 || response.status === 403) {
      results.passed++
      console.log(`  ✅ GET /api/orders - ${response.status === 200 ? 'OK' : 'Protection admin OK'}`)
    } else {
      results.failed++
      console.log('  ❌ GET /api/orders - Échec')
    }
  } catch (error) {
    results.failed++
    console.log('  ❌ GET /api/orders - Erreur:', error.message)
  }
}

// Tests des APIs Paiements
async function testPaymentsAPIs() {
  console.log('\n💳 Tests: APIs Paiements')
  
  // GET /api/payments (admin)
  try {
    const response = await makeRequest('GET', '/api/payments')
    if (response.status === 200 || response.status === 403) {
      results.passed++
      console.log(`  ✅ GET /api/payments - ${response.status === 200 ? 'OK' : 'Protection admin OK'}`)
    } else {
      results.failed++
      console.log('  ❌ GET /api/payments - Échec')
    }
  } catch (error) {
    results.failed++
    console.log('  ❌ GET /api/payments - Erreur:', error.message)
  }
}

// Tests des APIs Admin
async function testAdminAPIs() {
  console.log('\n👑 Tests: APIs Admin')
  
  // GET /api/admin/stats
  try {
    const response = await makeRequest('GET', '/api/admin/stats')
    if (response.status === 200 || response.status === 403) {
      results.passed++
      console.log(`  ✅ GET /api/admin/stats - ${response.status === 200 ? 'OK' : 'Protection admin OK'}`)
    } else {
      results.failed++
      console.log('  ❌ GET /api/admin/stats - Échec')
    }
  } catch (error) {
    results.failed++
    console.log('  ❌ GET /api/admin/stats - Erreur:', error.message)
  }
}

// Tests des APIs Publiques
async function testPublicAPIs() {
  console.log('\n🌐 Tests: APIs Publiques')
  
  // GET /api/categories
  try {
    const response = await makeRequest('GET', '/api/categories')
    if (response.status === 200) {
      results.passed++
      console.log('  ✅ GET /api/categories')
    } else {
      results.failed++
      console.log('  ❌ GET /api/categories - Échec')
    }
  } catch (error) {
    results.failed++
    console.log('  ❌ GET /api/categories - Erreur:', error.message)
  }

  // GET /api/packs
  try {
    const response = await makeRequest('GET', '/api/packs')
    if (response.status === 200) {
      results.passed++
      console.log('  ✅ GET /api/packs')
    } else {
      results.failed++
      console.log('  ❌ GET /api/packs - Échec')
    }
  } catch (error) {
    results.failed++
    console.log('  ❌ GET /api/packs - Erreur:', error.message)
  }
}

// Test de santé
async function testHealth() {
  console.log('\n🏥 Test: Santé de l\'application')
  try {
    const response = await makeRequest('GET', '/')
    if (response.status === 200 || response.status === 404) {
      results.passed++
      console.log('  ✅ Application accessible')
    } else {
      results.failed++
      console.log('  ❌ Application inaccessible')
    }
  } catch (error) {
    results.failed++
    console.log('  ❌ Erreur:', error.message)
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🧪 TESTS COMPLETS DES APIs - INOXYA BIJOUX')
  console.log('═'.repeat(60))
  console.log(`URL de test: ${BASE_URL}`)
  console.log(`Admin: ${ADMIN_PHONE}`)
  console.log('═'.repeat(60))

  // Test de santé
  await testHealth()

  // Test de connexion admin
  const loginSuccess = await testAdminLogin()

  // Tests des APIs
  await testPublicAPIs()
  await testProductsAPIs()
  
  if (loginSuccess) {
    await testOrdersAPIs()
    await testPaymentsAPIs()
    await testAdminAPIs()
  } else {
    console.log('\n⚠️  Tests admin ignorés (connexion échouée)')
  }

  // Résumé
  console.log('\n' + '═'.repeat(60))
  console.log('📊 RÉSUMÉ DES TESTS')
  console.log('═'.repeat(60))
  console.log(`✅ Tests réussis: ${results.passed}`)
  console.log(`❌ Tests échoués: ${results.failed}`)
  console.log(`📈 Taux de réussite: ${Math.round(results.passed / (results.passed + results.failed) * 100)}%`)

  if (results.errors.length > 0) {
    console.log('\n⚠️  Erreurs détectées:')
    results.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`)
    })
  }

  if (results.failed === 0) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !\n')
    process.exit(0)
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) ont échoué.\n`)
    process.exit(1)
  }
}

// Exécuter les tests
runAllTests().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

