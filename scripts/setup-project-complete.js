#!/usr/bin/env node
/**
 * Script complet pour configurer et vérifier le projet INOXYA BIJOUX
 * Vérifie et corrige tous les points critiques
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

const projectRoot = process.cwd()
const envLocalPath = path.join(projectRoot, '.env.local')
const envExamplePath = path.join(projectRoot, '.env.example')

// Couleurs pour la console
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

function generateJwtSecret() {
  return crypto.randomBytes(64).toString('base64')
}

async function checkEnvFile() {
  log('\n📋 1. Vérification du fichier .env.local...', 'cyan')
  
  if (fs.existsSync(envLocalPath)) {
    log('   ✅ .env.local existe', 'green')
    
    // Vérifier JWT_SECRET
    const envContent = fs.readFileSync(envLocalPath, 'utf8')
    const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/)
    
    if (jwtSecretMatch) {
      const jwtSecret = jwtSecretMatch[1].trim()
      if (jwtSecret.length >= 32 && jwtSecret !== 'votre-cle-secrete-minimum-32-caracteres-changez-en-production') {
        log('   ✅ JWT_SECRET est configuré et valide', 'green')
        return true
      } else {
        log('   ⚠️  JWT_SECRET est trop court ou utilise la valeur par défaut', 'yellow')
        return false
      }
    } else {
      log('   ⚠️  JWT_SECRET non trouvé dans .env.local', 'yellow')
      return false
    }
  } else {
    log('   ❌ .env.local n\'existe pas', 'red')
    return false
  }
}

async function createEnvFile() {
  log('\n🔧 2. Création/amélioration de .env.local...', 'cyan')
  
  let envContent = ''
  const jwtSecret = generateJwtSecret()
  
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8')
    // Remplacer le JWT_SECRET placeholder
    envContent = envContent.replace(
      /JWT_SECRET=.*/,
      `JWT_SECRET=${jwtSecret}`
    )
  } else {
    // Créer un fichier .env.local basique
    envContent = `# Configuration INOXYA BIJOUX - Généré automatiquement
# Date: ${new Date().toISOString()}

# APPLICATION
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# SÉCURITÉ
JWT_SECRET=${jwtSecret}

# BASE DE DONNÉES
# SQLite sera utilisé automatiquement si DATABASE_URL n'est pas défini
# Pour PostgreSQL, décommentez et configurez:
# DATABASE_URL=postgresql://inoxya_user:inoxya_password@localhost:5432/inoxya_bijoux

# EMAIL (Optionnel)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# ADMIN_EMAIL=admin@inoxya-bijoux.com
`
  }
  
  fs.writeFileSync(envLocalPath, envContent, 'utf8')
  log(`   ✅ .env.local créé avec JWT_SECRET généré (${jwtSecret.length} caractères)`, 'green')
  log('   ⚠️  NE JAMAIS COMMITER CE FICHIER DANS GIT', 'yellow')
}

async function checkDatabase() {
  log('\n🗄️  3. Vérification de la base de données...', 'cyan')
  
  try {
    // Vérifier si le fichier DB existe
    const dbPath = path.join(projectRoot, 'data', 'inoxya_bijoux.db')
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath)
      log(`   ✅ Base de données SQLite trouvée (${(stats.size / 1024).toFixed(2)} KB)`, 'green')
      return true
    } else {
      log('   ⚠️  Base de données SQLite non trouvée', 'yellow')
      log('   💡 Elle sera créée automatiquement au premier démarrage', 'blue')
      return false
    }
  } catch (error) {
    log(`   ❌ Erreur lors de la vérification: ${error.message}`, 'red')
    return false
  }
}

async function checkTranslations() {
  log('\n🌐 4. Vérification des traductions...', 'cyan')
  
  const frPath = path.join(projectRoot, 'messages', 'fr.json')
  const arPath = path.join(projectRoot, 'messages', 'ar.json')
  
  let allOk = true
  
  if (fs.existsSync(frPath)) {
    const frContent = fs.readFileSync(frPath, 'utf8')
    const frData = JSON.parse(frContent)
    const frKeys = Object.keys(flattenObject(frData))
    log(`   ✅ fr.json: ${frKeys.length} clés de traduction`, 'green')
  } else {
    log('   ❌ fr.json manquant', 'red')
    allOk = false
  }
  
  if (fs.existsSync(arPath)) {
    const arContent = fs.readFileSync(arPath, 'utf8')
    const arData = JSON.parse(arContent)
    const arKeys = Object.keys(flattenObject(arData))
    log(`   ✅ ar.json: ${arKeys.length} clés de traduction`, 'green')
  } else {
    log('   ❌ ar.json manquant', 'red')
    allOk = false
  }
  
  return allOk
}

function flattenObject(obj, prefix = '') {
  const flattened = {}
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], newKey))
    } else {
      flattened[newKey] = obj[key]
    }
  }
  return flattened
}

async function improveI18n() {
  log('\n🔧 5. Amélioration de la configuration i18n...', 'cyan')
  
  const i18nRequestPath = path.join(projectRoot, 'i18n', 'request.ts')
  
  if (fs.existsSync(i18nRequestPath)) {
    let content = fs.readFileSync(i18nRequestPath, 'utf8')
    let modified = false
    
    // Augmenter le timeout de 2s à 5s
    if (content.includes('timeoutMs = 2000')) {
      content = content.replace(/timeoutMs = 2000/g, 'timeoutMs = 5000')
      modified = true
      log('   ✅ Timeout i18n augmenté à 5 secondes', 'green')
    }
    
    // Améliorer le fallback avec messages par défaut
    if (content.includes('messages = {}')) {
      const defaultMessages = `{
      common: {
        language: 'Langue',
        search: 'Recherche',
        cart: 'Panier',
        login: 'Connexion'
      },
      header: {
        freeShipping: 'Livraison gratuite',
        navigation: {
          jewelry: 'Bijoux',
          collections: 'Collections',
          custom: 'Sur Mesure',
          about: 'À propos'
        }
      }
    }`
      
      content = content.replace(
        /messages = \{\}/g,
        `messages = ${defaultMessages}`
      )
      modified = true
      log('   ✅ Fallback i18n amélioré avec messages par défaut', 'green')
    }
    
    if (modified) {
      fs.writeFileSync(i18nRequestPath, content, 'utf8')
    } else {
      log('   ✅ Configuration i18n déjà optimale', 'green')
    }
  } else {
    log('   ⚠️  i18n/request.ts non trouvé', 'yellow')
  }
}

async function testBuild() {
  log('\n🏗️  6. Test de compilation TypeScript...', 'cyan')
  
  try {
    await execAsync('npx tsc --noEmit', { cwd: projectRoot, timeout: 30000 })
    log('   ✅ Compilation TypeScript réussie', 'green')
    return true
  } catch (error) {
    log(`   ⚠️  Erreurs TypeScript détectées: ${error.message.split('\n').slice(0, 3).join(' ')}`, 'yellow')
    return false
  }
}

async function main() {
  log('🚀 Configuration complète du projet INOXYA BIJOUX\n', 'blue')
  log('='.repeat(60), 'cyan')
  
  const results = {
    env: false,
    database: false,
    translations: false,
    build: false
  }
  
  // 1. Vérifier/créer .env.local
  results.env = await checkEnvFile()
  if (!results.env) {
    await createEnvFile()
    results.env = true
  }
  
  // 2. Vérifier la base de données
  results.database = await checkDatabase()
  
  // 3. Vérifier les traductions
  results.translations = await checkTranslations()
  
  // 4. Améliorer i18n
  await improveI18n()
  
  // 5. Test de compilation
  results.build = await testBuild()
  
  // Résumé
  log('\n' + '='.repeat(60), 'cyan')
  log('📊 RÉSUMÉ DE LA CONFIGURATION\n', 'blue')
  
  log(`   ${results.env ? '✅' : '❌'} Variables d'environnement`, results.env ? 'green' : 'red')
  log(`   ${results.database ? '✅' : '⚠️ '} Base de données`, results.database ? 'green' : 'yellow')
  log(`   ${results.translations ? '✅' : '❌'} Traductions`, results.translations ? 'green' : 'red')
  log(`   ${results.build ? '✅' : '⚠️ '} Compilation TypeScript`, results.build ? 'green' : 'yellow')
  
  const allOk = Object.values(results).every(v => v)
  
  if (allOk) {
    log('\n✅ Projet configuré avec succès !', 'green')
    log('\n💡 Prochaines étapes:', 'cyan')
    log('   1. npm run dev - Démarrer le serveur de développement', 'blue')
    log('   2. Visiter http://localhost:3000/fr', 'blue')
    log('   3. Tester les routes API: npm run test:apis', 'blue')
  } else {
    log('\n⚠️  Certains éléments nécessitent une attention', 'yellow')
    log('   Le projet peut quand même fonctionner, mais vérifiez les points signalés', 'yellow')
  }
  
  log('\n' + '='.repeat(60) + '\n', 'cyan')
}

main().catch((error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red')
  process.exit(1)
})

