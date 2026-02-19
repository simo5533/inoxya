#!/usr/bin/env node
/**
 * Script pour désactiver temporairement le middleware i18n
 * Utile pour diagnostiquer les problèmes de connexion
 */

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  }
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function main() {
  log('\n🔧 DÉSACTIVATION TEMPORAIRE DU MIDDLEWARE\n', 'cyan')
  log('='.repeat(60), 'cyan')

  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envLocalPath)) {
    log('   ⚠️  .env.local n\'existe pas, création...', 'yellow')
    fs.writeFileSync(envLocalPath, '', 'utf8')
  }

  let envContent = fs.readFileSync(envLocalPath, 'utf8')
  
  // Ajouter ou mettre à jour DISABLE_MIDDLEWARE
  if (envContent.includes('DISABLE_MIDDLEWARE')) {
    envContent = envContent.replace(/DISABLE_MIDDLEWARE=.*/g, 'DISABLE_MIDDLEWARE=1')
    log('   ✅ DISABLE_MIDDLEWARE mis à jour à 1', 'green')
  } else {
    envContent += '\n# Désactiver le middleware i18n pour diagnostic\nDISABLE_MIDDLEWARE=1\n'
    log('   ✅ DISABLE_MIDDLEWARE=1 ajouté', 'green')
  }
  
  fs.writeFileSync(envLocalPath, envContent, 'utf8')

  log('\n' + '='.repeat(60), 'cyan')
  log('✅ Middleware désactivé !', 'green')
  log('\n💡 Redémarrez le serveur:', 'cyan')
  log('   npm run dev', 'blue')
  log('\n💡 Pour réactiver le middleware:', 'cyan')
  log('   Mettez DISABLE_MIDDLEWARE=0 dans .env.local', 'blue')
  log('   Ou supprimez la ligne DISABLE_MIDDLEWARE', 'blue')
  log('\n' + '='.repeat(60) + '\n', 'cyan')
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red')
  process.exit(1)
})

