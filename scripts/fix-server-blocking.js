#!/usr/bin/env node
/**
 * Script pour corriger le blocage du serveur
 * - Vérifie FORCE_SQLJS
 * - Supprime la DB si nécessaire
 * - Vérifie la configuration
 */

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

async function fixServerBlocking() {
  console.log(chalk.blue('\n🔧 CORRECTION DU BLOCAGE DU SERVEUR\n'))
  console.log(chalk.cyan('='.repeat(60)))

  const envLocalPath = path.join(process.cwd(), '.env.local')
  const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')

  // 1. Vérifier/Créer .env.local avec FORCE_SQLJS
  console.log(chalk.cyan('\n1️⃣  Configuration .env.local...'))
  let envContent = ''
  
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8')
    console.log(chalk.green('   ✅ .env.local existe'))
  } else {
    console.log(chalk.yellow('   ⚠️  .env.local n\'existe pas, création...'))
    envContent = `# Configuration INOXYA BIJOUX
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
`
  }

  // Forcer FORCE_SQLJS=1
  if (!envContent.includes('FORCE_SQLJS=1')) {
    if (envContent.includes('FORCE_SQLJS')) {
      envContent = envContent.replace(/FORCE_SQLJS=.*/g, 'FORCE_SQLJS=1')
      console.log(chalk.green('   ✅ FORCE_SQLJS mis à jour à 1'))
    } else {
      envContent += '\n# Force sql.js pour éviter les blocages better-sqlite3\nFORCE_SQLJS=1\n'
      console.log(chalk.green('   ✅ FORCE_SQLJS=1 ajouté'))
    }
    fs.writeFileSync(envLocalPath, envContent, 'utf8')
  } else {
    console.log(chalk.green('   ✅ FORCE_SQLJS=1 déjà configuré'))
  }

  // 2. Vérifier la base de données
  console.log(chalk.cyan('\n2️⃣  Vérification de la base de données...'))
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath)
    const sizeKB = Math.round(stats.size / 1024)
    console.log(chalk.blue(`   📊 Taille: ${sizeKB} KB`))
    
    if (sizeKB === 0) {
      console.log(chalk.yellow('   ⚠️  Base de données vide'))
      console.log(chalk.yellow('   💡 Suppression pour recréation...'))
      try {
        fs.unlinkSync(dbPath)
        console.log(chalk.green('   ✅ Base de données supprimée'))
      } catch (error) {
        console.error(chalk.red(`   ❌ Erreur suppression: ${error.message}`))
      }
    } else {
      console.log(chalk.green('   ✅ Base de données existe'))
    }
  } else {
    console.log(chalk.yellow('   ⚠️  Base de données n\'existe pas'))
    console.log(chalk.blue('   💡 Elle sera créée au premier démarrage'))
  }

  // 3. Instructions finales
  console.log(chalk.cyan('\n' + '='.repeat(60)))
  console.log(chalk.blue('\n🚀 PROCHAINES ÉTAPES\n'))
  
  console.log(chalk.cyan('1. Arrêtez le serveur actuel (Ctrl+C)'))
  console.log(chalk.cyan('2. Redémarrez:'))
  console.log(chalk.green('   npm run dev'))
  console.log(chalk.cyan('3. Attendez: ✓ Ready in X.Xs'))
  console.log(chalk.cyan('4. Testez dans le navigateur:'))
  console.log(chalk.green('   http://localhost:3000/fr'))
  
  console.log(chalk.cyan('\n💡 Si le problème persiste:'))
  console.log(chalk.blue('   • Ouvrez la console du navigateur (F12)'))
  console.log(chalk.blue('   • Vérifiez les erreurs dans l\'onglet Console'))
  console.log(chalk.blue('   • Vérifiez l\'onglet Network pour les requêtes'))
  console.log(chalk.blue('   • Regardez les logs du serveur pour les erreurs [DB]'))
  
  console.log(chalk.cyan('\n' + '='.repeat(60) + '\n'))
}

fixServerBlocking().catch((error) => {
  console.error(chalk.red(`\n❌ Erreur: ${error.message}`))
  process.exit(1)
})

