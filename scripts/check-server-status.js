#!/usr/bin/env node
/**
 * Script pour vérifier l'état du serveur Next.js
 */

const http = require('http')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

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

async function checkPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr ":${port}"`)
    return stdout.includes('LISTENING')
  } catch {
    return false
  }
}

async function testConnection(url, timeout = 3000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      resolve({ success: true, status: res.statusCode })
    })
    
    req.on('error', () => {
      resolve({ success: false })
    })
    
    req.on('timeout', () => {
      req.destroy()
      resolve({ success: false, timeout: true })
    })
  })
}

async function main() {
  log('\n🔍 VÉRIFICATION DU SERVEUR\n', 'cyan')
  log('='.repeat(50), 'cyan')
  
  const port = 3000
  
  // Vérifier le port
  log('\n1. Vérification du port 3000...', 'blue')
  const portInUse = await checkPort(port)
  if (portInUse) {
    log('   ✅ Port 3000 est en écoute', 'green')
  } else {
    log('   ❌ Port 3000 n\'est pas utilisé', 'red')
    log('   💡 Démarrez le serveur: npm run dev', 'yellow')
    return
  }
  
  // Tester la connexion
  log('\n2. Test de connexion...', 'blue')
  const result = await testConnection(`http://localhost:${port}/api/health`, 5000)
  
  if (result.success) {
    log(`   ✅ Serveur répond (Status: ${result.status})`, 'green')
    log('\n✅ Le serveur fonctionne correctement !', 'green')
    log(`\n💡 Accédez au site: http://localhost:${port}/fr`, 'cyan')
  } else if (result.timeout) {
    log('   ⚠️  Timeout - Le serveur ne répond pas', 'yellow')
    log('   💡 Le serveur peut être bloqué lors de l\'initialisation', 'yellow')
    log('   💡 Vérifiez les logs du serveur dans le terminal npm run dev', 'yellow')
  } else {
    log('   ❌ Le serveur ne répond pas', 'red')
    log('   💡 Vérifiez que le serveur est démarré: npm run dev', 'yellow')
  }
  
  log('\n' + '='.repeat(50) + '\n', 'cyan')
}

main().catch(console.error)

