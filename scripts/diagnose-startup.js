#!/usr/bin/env node
/**
 * Script de diagnostic rapide pour identifier pourquoi le site ne s'affiche pas
 */

const http = require('http')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const fs = require('fs')
const path = require('path')

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

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 500) // Premiers 500 caractères
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

async function checkServer() {
  log('\n🔍 DIAGNOSTIC DU SERVEUR\n', 'magenta')
  log('='.repeat(60), 'cyan')

  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000

  // 1. Vérifier si le port est utilisé
  log('\n1️⃣  Vérification du port...', 'cyan')
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr ":${port}"`)
    if (stdout.includes('LISTENING')) {
      log(`   ✅ Port ${port} est en écoute`, 'green')
    } else {
      log(`   ❌ Port ${port} n'est pas en écoute`, 'red')
      log('   💡 Démarrez le serveur: npm run dev', 'yellow')
      return
    }
  } catch {
    log(`   ❌ Port ${port} n'est pas utilisé`, 'red')
    log('   💡 Démarrez le serveur: npm run dev', 'yellow')
    return
  }

  // 2. Tester l'API health
  log('\n2️⃣  Test de l\'API /api/health...', 'cyan')
  try {
    const response = await makeRequest(`http://localhost:${port}/api/health`)
    if (response.status === 200) {
      log('   ✅ API /api/health répond', 'green')
      try {
        const data = JSON.parse(response.body)
        log(`   📊 Base de données: ${data.database ? '✅ Connectée' : '❌ Non connectée'}`, data.database ? 'green' : 'red')
      } catch {
        log('   ⚠️  Réponse non-JSON', 'yellow')
      }
    } else {
      log(`   ⚠️  Status: ${response.status}`, 'yellow')
    }
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red')
  }

  // 3. Tester la page d'accueil (avec locale)
  log('\n3️⃣  Test de la page d\'accueil /fr...', 'cyan')
  try {
    const response = await makeRequest(`http://localhost:${port}/fr`)
    if (response.status === 200) {
      log('   ✅ Page /fr accessible', 'green')
      if (response.body.includes('INOXYA') || response.body.includes('Bijoux')) {
        log('   ✅ Contenu détecté (INOXYA/Bijoux)', 'green')
      } else {
        log('   ⚠️  Contenu vide ou différent', 'yellow')
        log(`   📄 Premiers caractères: ${response.body.substring(0, 100)}`, 'blue')
      }
    } else if (response.status === 307 || response.status === 308) {
      log(`   ⚠️  Redirection détectée (${response.status})`, 'yellow')
      log('   💡 Le middleware i18n redirige peut-être', 'blue')
    } else {
      log(`   ⚠️  Status: ${response.status}`, 'yellow')
    }
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red')
  }

  // 4. Tester la racine (sans locale)
  log('\n4️⃣  Test de la racine /...', 'cyan')
  try {
    const response = await makeRequest(`http://localhost:${port}/`)
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

  // 5. Vérifier la base de données
  log('\n5️⃣  Vérification de la base de données...', 'cyan')
  const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath)
    log(`   ✅ Base de données existe (${(stats.size / 1024).toFixed(2)} KB)`, 'green')
  } else {
    log('   ⚠️  Base de données non trouvée', 'yellow')
    log('   💡 Elle sera créée au premier démarrage', 'blue')
  }

  // 6. Vérifier .env.local
  log('\n6️⃣  Vérification de .env.local...', 'cyan')
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    log('   ✅ .env.local existe', 'green')
    const envContent = fs.readFileSync(envPath, 'utf8')
    if (envContent.includes('JWT_SECRET=')) {
      log('   ✅ JWT_SECRET configuré', 'green')
    } else {
      log('   ⚠️  JWT_SECRET manquant', 'yellow')
    }
  } else {
    log('   ⚠️  .env.local n\'existe pas', 'yellow')
    log('   💡 Créez-le avec: npm run setup:complete', 'blue')
  }

  // Résumé et solutions
  log('\n' + '='.repeat(60), 'cyan')
  log('💡 SOLUTIONS\n', 'magenta')

  log('1. Accédez à:', 'cyan')
  log(`   ✅ http://localhost:${port}/fr (avec locale)`, 'green')
  log(`   ⚠️  http://localhost:${port}/ (redirige vers /fr)`, 'yellow')

  log('\n2. Si la page est blanche:', 'cyan')
  log('   • Ouvrez la console du navigateur (F12)', 'blue')
  log('   • Vérifiez les erreurs JavaScript', 'blue')
  log('   • Vérifiez l\'onglet Network pour les erreurs', 'blue')

  log('\n3. Si le serveur ne démarre pas:', 'cyan')
  log('   • Arrêtez tous les processus: npm run clean:node', 'blue')
  log('   • Redémarrez: npm run dev', 'blue')

  log('\n4. Si la base de données est vide:', 'cyan')
  log('   • Vérifiez: npm run db:verify', 'blue')
  log('   • Initialisez: node scripts/init-db-via-api.js', 'blue')

  log('\n' + '='.repeat(60) + '\n', 'cyan')
}

checkServer().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red')
  process.exit(1)
})

