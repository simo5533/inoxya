#!/usr/bin/env node
/**
 * Script pour tester que le serveur Next.js répond correctement
 * Compatible Windows PowerShell
 */

const http = require('http')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 1000) // Premiers 1000 caractères
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
  })
}

async function testServer() {
  log('\n🧪 TEST DU SERVEUR NEXT.JS\n', 'magenta')
  log('='.repeat(60), 'cyan')

  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000
  const baseUrl = `http://localhost:${port}`

  // Test 1: API Health
  log('\n1️⃣  Test API /api/health...', 'cyan')
  try {
    const response = await makeRequest(`${baseUrl}/api/health`)
    if (response.status === 200) {
      log('   ✅ API /api/health répond (Status: 200)', 'green')
      try {
        const data = JSON.parse(response.body)
        log(`   📊 Driver: ${data.driver || 'unknown'}`, 'blue')
        log(`   📊 DB Status: ${data.status || 'unknown'}`, 'blue')
        if (data.tables !== undefined) {
          log(`   📊 Tables: ${data.tables}`, 'blue')
        }
      } catch {
        log('   ⚠️  Réponse non-JSON', 'yellow')
      }
    } else {
      log(`   ⚠️  Status: ${response.status}`, 'yellow')
    }
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red')
    log('   💡 Assurez-vous que le serveur est démarré (npm run dev)', 'yellow')
    return
  }

  // Test 2: Page d'accueil /fr
  log('\n2️⃣  Test page d\'accueil /fr...', 'cyan')
  try {
    const response = await makeRequest(`${baseUrl}/fr`, 10000) // 10s timeout pour la page
    if (response.status === 200) {
      log('   ✅ Page /fr accessible (Status: 200)', 'green')
      if (response.body.includes('INOXYA') || response.body.includes('Bijoux') || response.body.includes('inoxya')) {
        log('   ✅ Contenu détecté (INOXYA/Bijoux)', 'green')
      } else if (response.body.includes('<html') || response.body.includes('<!DOCTYPE')) {
        log('   ✅ Page HTML détectée', 'green')
        log('   💡 La page se charge mais le contenu peut être vide (DB vide)', 'blue')
      } else {
        log('   ⚠️  Contenu inattendu', 'yellow')
        log(`   📄 Début: ${response.body.substring(0, 100)}`, 'blue')
      }
    } else if (response.status === 307 || response.status === 308) {
      log(`   ✅ Redirection détectée (${response.status})`, 'green')
      log('   💡 C\'est normal avec i18n', 'blue')
    } else {
      log(`   ⚠️  Status: ${response.status}`, 'yellow')
    }
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red')
    if (error.message.includes('timeout')) {
      log('   💡 La page prend trop de temps à charger (peut être normal si DB lente)', 'yellow')
    }
  }

  // Test 3: Racine /
  log('\n3️⃣  Test racine /...', 'cyan')
  try {
    const response = await makeRequest(`${baseUrl}/`)
    if (response.status === 200) {
      log('   ✅ Page / accessible', 'green')
    } else if (response.status === 307 || response.status === 308) {
      log(`   ✅ Redirection vers /fr (${response.status})`, 'green')
      log('   💡 C\'est normal avec i18n', 'blue')
    } else {
      log(`   ⚠️  Status: ${response.status}`, 'yellow')
    }
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red')
  }

  log('\n' + '='.repeat(60), 'cyan')
  log('✅ Tests terminés !', 'green')
  log('\n💡 Accédez au site:', 'cyan')
  log(`   ${baseUrl}/fr`, 'green')
  log('\n' + '='.repeat(60) + '\n', 'cyan')
}

testServer().catch((error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red')
  process.exit(1)
})

