#!/usr/bin/env node
/**
 * Script de test complet de toutes les routes après désactivation du middleware
 */

const http = require('http')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function testRoute(url, timeout = 5000, description = '') {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const req = http.get(url, { timeout }, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        const duration = Date.now() - startTime
        resolve({
          success: true,
          status: res.statusCode,
          body: data.substring(0, 200),
          duration,
        })
      })
    })

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message || String(error),
        code: error.code,
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({
        success: false,
        timeout: true,
        error: 'Request timeout',
      })
    })
  })
}

async function main() {
  log('\n🧪 TEST COMPLET DES ROUTES (Middleware Désactivé)\n', 'magenta')
  log('='.repeat(70), 'cyan')

  const port = 3000
  // Essayer IPv6 d'abord car le serveur écoute sur [::1]
  const baseUrls = [
    `http://[::1]:${port}`,  // IPv6 localhost
    `http://localhost:${port}`,  // IPv4/IPv6 localhost
    `http://127.0.0.1:${port}`,  // IPv4 uniquement
  ]
  const baseUrl = baseUrls[0] // Par défaut IPv6
  const results = []

  // Test 1: Route API simple - Essayer toutes les adresses
  log('\n1️⃣  Test /api/test (route API simple)...', 'cyan')
  let test1 = null
  let workingUrl = null
  
  for (const url of baseUrls) {
    log(`   🔍 Essai avec ${url}...`, 'blue')
    test1 = await testRoute(`${url}/api/test`, 5000)
    if (test1.success) {
      workingUrl = url
      log(`   ✅ Trouvé sur ${url}`, 'green')
      break
    }
  }
  
  if (!test1 || !test1.success) {
    test1 = await testRoute(`${baseUrl}/api/test`, 5000)
  }
  
  results.push({ name: '/api/test', ...test1 })
  
  if (test1.success) {
    log(`   ✅ Répond (Status: ${test1.status}, ${test1.duration}ms)`, 'green')
    try {
      const data = JSON.parse(test1.body)
      log(`   📊 Message: ${data.message}`, 'blue')
    } catch {
      log(`   📄 Réponse: ${test1.body.substring(0, 50)}...`, 'blue')
    }
  } else if (test1.timeout) {
    log('   ❌ TIMEOUT', 'red')
  } else {
    log(`   ❌ Erreur: ${test1.error}`, 'red')
    if (test1.code) {
      log(`   📋 Code: ${test1.code}`, 'blue')
    }
  }

  // Test 2: Route test-simple
  log('\n2️⃣  Test /test-simple (route sans middleware)...', 'cyan')
  const testUrl2 = workingUrl || baseUrl
  const test2 = await testRoute(`${testUrl2}/test-simple`, 5000)
  results.push({ name: '/test-simple', ...test2 })
  
  if (test2.success) {
    log(`   ✅ Répond (Status: ${test2.status}, ${test2.duration}ms)`, 'green')
  } else if (test2.timeout) {
    log('   ❌ TIMEOUT', 'red')
  } else {
    log(`   ❌ Erreur: ${test2.error}`, 'red')
  }

  // Test 3: Route API health
  log('\n3️⃣  Test /api/health (avec DB)...', 'cyan')
  const testUrl3 = workingUrl || baseUrl
  const test3 = await testRoute(`${testUrl3}/api/health`, 10000)
  results.push({ name: '/api/health', ...test3 })
  
  if (test3.success) {
    log(`   ✅ Répond (Status: ${test3.status}, ${test3.duration}ms)`, 'green')
  } else if (test3.timeout) {
    log('   ⚠️  TIMEOUT (DB peut être lente)', 'yellow')
  } else {
    log(`   ❌ Erreur: ${test3.error}`, 'red')
  }

  // Test 4: Page /fr (sans middleware, devrait fonctionner)
  log('\n4️⃣  Test /fr (page d\'accueil, middleware désactivé)...', 'cyan')
  const testUrl4 = workingUrl || baseUrl
  const test4 = await testRoute(`${testUrl4}/fr`, 15000)
  results.push({ name: '/fr', ...test4 })
  
  if (test4.success) {
    log(`   ✅ Répond (Status: ${test4.status}, ${test4.duration}ms)`, 'green')
    if (test4.body.includes('INOXYA') || test4.body.includes('Bijoux')) {
      log('   ✅ Contenu détecté', 'green')
    } else if (test4.body.includes('<html')) {
      log('   ✅ Page HTML détectée', 'green')
    }
  } else if (test4.timeout) {
    log('   ⚠️  TIMEOUT (page peut être lente à charger)', 'yellow')
  } else {
    log(`   ❌ Erreur: ${test4.error}`, 'red')
  }

  // Test 5: Page racine /
  log('\n5️⃣  Test / (racine, middleware désactivé)...', 'cyan')
  const testUrl5 = workingUrl || baseUrl
  const test5 = await testRoute(`${testUrl5}/`, 5000)
  results.push({ name: '/', ...test5 })
  
  if (test5.success) {
    log(`   ✅ Répond (Status: ${test5.status})`, 'green')
  } else if (test5.timeout) {
    log('   ⚠️  TIMEOUT', 'yellow')
  } else {
    log(`   ❌ Erreur: ${test5.error}`, 'red')
  }

  // Résumé
  log('\n' + '='.repeat(70), 'cyan')
  log('📊 RÉSUMÉ\n', 'magenta')
  
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  
  log(`Routes testées: ${totalCount}`, 'cyan')
  log(`Routes fonctionnelles: ${successCount}`, successCount > 0 ? 'green' : 'red')
  log(`Routes en échec: ${totalCount - successCount}`, (totalCount - successCount) > 0 ? 'red' : 'green')
  
  log('\n' + '='.repeat(70), 'cyan')
  
  if (successCount === 0) {
    log('❌ Aucune route ne répond', 'red')
    log('\n💡 Le serveur ne traite aucune requête HTTP', 'yellow')
    log('💡 Vérifiez:', 'yellow')
    log('   1. Que le serveur est démarré (npm run dev)', 'blue')
    log('   2. Les logs du serveur pour les erreurs', 'blue')
    log('   3. Que le port 3000 n\'est pas bloqué par un firewall', 'blue')
  } else if (successCount < totalCount) {
    log('⚠️  Certaines routes fonctionnent, d\'autres non', 'yellow')
    log('\n💡 Routes fonctionnelles:', 'cyan')
    results.filter(r => r.success).forEach(r => {
      log(`   ✅ ${r.name}`, 'green')
    })
    log('\n💡 Routes en échec:', 'cyan')
    results.filter(r => !r.success).forEach(r => {
      log(`   ❌ ${r.name} - ${r.error || 'timeout'}`, 'red')
    })
  } else {
    log('✅ Toutes les routes fonctionnent !', 'green')
    if (workingUrl) {
      log(`\n💡 Serveur accessible sur: ${workingUrl}`, 'green')
    }
    log('💡 Le serveur répond correctement', 'green')
    log('💡 Si le problème était le middleware, vous pouvez maintenant le réactiver', 'blue')
    log('   et corriger le problème i18n spécifiquement', 'blue')
  }
  
  log('\n' + '='.repeat(70) + '\n', 'cyan')
}

main().catch((error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red')
  process.exit(1)
})

