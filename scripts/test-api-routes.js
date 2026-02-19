#!/usr/bin/env node
/**
 * Script pour tester les routes API principales
 */

const http = require('http')

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

function makeRequest(port, path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        })
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (body) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

async function testRoute(port, path, method = 'GET', body = null, expectedStatus = 200) {
  try {
    const response = await makeRequest(port, path, method, body)
    const success = response.status === expectedStatus || (expectedStatus === 'any' && response.status < 500)
    
    if (success) {
      log(`   ✅ ${method} ${path} - Status: ${response.status}`, 'green')
      return true
    } else {
      log(`   ⚠️  ${method} ${path} - Status: ${response.status} (attendu: ${expectedStatus})`, 'yellow')
      return false
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`   ❌ ${method} ${path} - Serveur non démarré`, 'red')
    } else if (error.message === 'Request timeout') {
      log(`   ⚠️  ${method} ${path} - Timeout`, 'yellow')
    } else {
      log(`   ❌ ${method} ${path} - Erreur: ${error.message}`, 'red')
    }
    return false
  }
}

async function main() {
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000
  
  log('\n🧪 Test des routes API principales\n', 'cyan')
  log('='.repeat(60), 'cyan')
  log(`Port: ${port}\n`, 'blue')
  
  const routes = [
    { path: '/api/health', method: 'GET', expectedStatus: 200, name: 'Health Check' },
    { path: '/api/categories', method: 'GET', expectedStatus: 200, name: 'Catégories' },
    { path: '/api/products', method: 'GET', expectedStatus: 200, name: 'Produits' },
    { path: '/api/packs', method: 'GET', expectedStatus: 200, name: 'Packs' },
    { path: '/api/csrf-token', method: 'GET', expectedStatus: 200, name: 'CSRF Token' },
  ]
  
  let successCount = 0
  let totalCount = routes.length
  
  for (const route of routes) {
    log(`\n📡 Test: ${route.name}`, 'blue')
    const success = await testRoute(port, route.path, route.method, null, route.expectedStatus)
    if (success) successCount++
    // Petit délai entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  log('\n' + '='.repeat(60), 'cyan')
  log(`\n📊 Résultats: ${successCount}/${totalCount} routes fonctionnelles\n`, 'blue')
  
  if (successCount === totalCount) {
    log('✅ Toutes les routes API fonctionnent correctement !', 'green')
  } else if (successCount > 0) {
    log('⚠️  Certaines routes nécessitent une attention', 'yellow')
    log('   Assurez-vous que le serveur est démarré: npm run dev', 'yellow')
  } else {
    log('❌ Aucune route ne répond', 'red')
    log('   Le serveur n\'est probablement pas démarré', 'red')
    log('   Démarrez-le avec: npm run dev', 'red')
  }
  
  log('\n' + '='.repeat(60) + '\n', 'cyan')
}

main().catch((error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red')
  process.exit(1)
})
