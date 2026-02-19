#!/usr/bin/env node
/**
 * Script pour corriger les problèmes de démarrage
 * - Force sql.js si better-sqlite3 bloque
 * - Vérifie la configuration
 * - Redémarre proprement
 */

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

async function main() {
  log('\n🔧 CORRECTION DES PROBLÈMES DE DÉMARRAGE\n', 'magenta')
  log('='.repeat(60), 'cyan')

  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  // 1. Forcer sql.js si better-sqlite3 bloque
  log('\n1️⃣  Configuration pour éviter les blocages...', 'cyan')
  
  if (fs.existsSync(envLocalPath)) {
    let envContent = fs.readFileSync(envLocalPath, 'utf8')
    let modified = false

    // Ajouter FORCE_SQLJS si pas présent
    if (!envContent.includes('FORCE_SQLJS')) {
      envContent += '\n# Force sql.js pour éviter les blocages better-sqlite3\nFORCE_SQLJS=1\n'
      modified = true
      log('   ✅ FORCE_SQLJS=1 ajouté', 'green')
    } else {
      log('   ✅ FORCE_SQLJS déjà configuré', 'green')
    }

    // S'assurer que NEXT_PUBLIC_SITE_URL est défini
    if (!envContent.includes('NEXT_PUBLIC_SITE_URL')) {
      envContent += '\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\n'
      modified = true
      log('   ✅ NEXT_PUBLIC_SITE_URL ajouté', 'green')
    }

    if (modified) {
      fs.writeFileSync(envLocalPath, envContent, 'utf8')
      log('   ✅ .env.local mis à jour', 'green')
    }
  } else {
    log('   ⚠️  .env.local n\'existe pas', 'yellow')
    log('   💡 Créez-le avec: npm run setup:complete', 'blue')
  }

  // 2. Vérifier la base de données
  log('\n2️⃣  Vérification de la base de données...', 'cyan')
  const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath)
    log(`   ✅ Base de données existe (${(stats.size / 1024).toFixed(2)} KB)`, 'green')
    
    if (stats.size === 0) {
      log('   ⚠️  Base de données vide', 'yellow')
      log('   💡 Initialisez-la avec: node scripts/init-db-via-api.js', 'blue')
    }
  } else {
    log('   ⚠️  Base de données non trouvée', 'yellow')
    log('   💡 Elle sera créée au premier démarrage', 'blue')
  }

  // 3. Instructions de redémarrage
  log('\n' + '='.repeat(60), 'cyan')
  log('🚀 PROCHAINES ÉTAPES\n', 'magenta')

  log('1. Arrêtez le serveur actuel (Ctrl+C dans le terminal)', 'cyan')
  log('2. Nettoyez les processus:', 'cyan')
  log('   npm run clean:node', 'blue')
  log('3. Redémarrez le serveur:', 'cyan')
  log('   npm run dev', 'blue')
  log('4. Attendez le message "Ready in X.Xs"', 'cyan')
  log('5. Accédez à:', 'cyan')
  log('   http://localhost:3000/fr', 'green')

  log('\n💡 Si le problème persiste:', 'yellow')
  log('   • Ouvrez la console du navigateur (F12)', 'blue')
  log('   • Vérifiez les erreurs dans l\'onglet Console', 'blue')
  log('   • Vérifiez l\'onglet Network pour les requêtes bloquées', 'blue')
  log('   • Vérifiez les logs du serveur dans le terminal', 'blue')

  log('\n' + '='.repeat(60) + '\n', 'cyan')
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red')
  process.exit(1)
})

