#!/usr/bin/env node
/**
 * Test simple du serveur - route /api/test qui ne dépend pas de la DB
 */

const http = require('http')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function testRoute(url, timeout = 5000) {
  return new Promise((resolve) => {
    try {
      const req = http.get(url, { timeout }, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          resolve({
            success: true,
            status: res.statusCode,
            body: data
          })
        })
      })

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message || String(error),
          code: error.code,
          syscall: error.syscall,
          address: error.address,
          port: error.port
        })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          success: false,
          timeout: true,
          error: 'Request timeout'
        })
      })
    } catch (error) {
      resolve({
        success: false,
        error: error.message || String(error),
        code: error.code
      })
    }
  })
}

async function main() {
  log('\n🧪 TEST SIMPLE DU SERVEUR\n', 'cyan')
  log('='.repeat(50), 'cyan')

  const port = 3000
  // Essayer plusieurs adresses car Next.js peut écouter sur IPv6
  const baseUrls = [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
    `http://[::1]:${port}`
  ]
  const baseUrl = baseUrls[0] // Par défaut localhost

  // Test 1: Route /api/test (simple, pas de DB)
  log('\n1. Test route /api/test (simple)...', 'blue')
  let test1 = null
  let workingUrl = null
  
  // Essayer toutes les adresses
  for (const url of baseUrls) {
    log(`   🔍 Essai avec ${url}...`, 'cyan')
    test1 = await testRoute(`${url}/api/test`, 5000)
    if (test1.success) {
      workingUrl = url
      break
    }
  }
  
  if (!test1 || !test1.success) {
    test1 = await testRoute(`${baseUrl}/api/test`, 5000)
  }
  
  if (test1.success) {
    log(`   ✅ Serveur répond (Status: ${test1.status})`, 'green')
    try {
      const data = JSON.parse(test1.body)
      log(`   📊 Message: ${data.message}`, 'blue')
    } catch {
      log(`   📄 Réponse: ${test1.body.substring(0, 100)}`, 'blue')
    }
  } else if (test1.timeout) {
    log('   ❌ TIMEOUT - Le serveur ne répond pas', 'red')
    log('   💡 Le serveur est probablement bloqué', 'yellow')
  } else {
    log(`   ❌ Erreur: ${test1.error}`, 'red')
  }

  // Test 2: Route /api/health (avec DB)
  log('\n2. Test route /api/health (avec DB)...', 'blue')
  const testUrl = workingUrl || baseUrl
  const test2 = await testRoute(`${testUrl}/api/health`, 10000)
  
  if (test2.success) {
    log(`   ✅ API Health répond (Status: ${test2.status})`, 'green')
  } else if (test2.timeout) {
    log('   ⚠️  TIMEOUT - La route /api/health bloque', 'yellow')
    log('   💡 Probablement bloqué par l\'initialisation DB', 'yellow')
  } else {
    log(`   ❌ Erreur: ${test2.error}`, 'red')
  }

  // Résumé
  log('\n' + '='.repeat(50), 'cyan')
  if (test1 && test1.success) {
    log('✅ Le serveur fonctionne !', 'green')
    const finalUrl = workingUrl || baseUrl
    log(`\n💡 Accédez au site: ${finalUrl}/fr`, 'cyan')
    if (workingUrl && workingUrl !== baseUrl) {
      log(`   (Serveur écoute sur ${workingUrl})`, 'blue')
    }
  } else {
    log('❌ Le serveur ne répond pas', 'red')
    log('\n💡 Solutions:', 'yellow')
    log('   1. Vérifiez que le serveur est démarré: npm run dev', 'blue')
    log('   2. Vérifiez les logs du serveur pour les erreurs', 'blue')
    log('   3. Essayez: npm run fix:blocking', 'blue')
  }
  log('\n' + '='.repeat(50) + '\n', 'cyan')
}

main().catch(console.error)

