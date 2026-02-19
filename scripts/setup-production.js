#!/usr/bin/env node
/**
 * Script interactif pour configurer la production
 * - PostgreSQL
 * - Upstash Redis
 * - SMTP
 * - Optimisation des images
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const crypto = require('crypto')

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupPostgreSQL() {
  log('\n🐘 Configuration PostgreSQL', 'cyan')
  log('='.repeat(60), 'cyan')
  
  const usePostgres = await question('Utiliser PostgreSQL en production? (o/n): ')
  if (usePostgres.toLowerCase() !== 'o') {
    log('   ⏭️  PostgreSQL ignoré', 'yellow')
    return null
  }
  
  log('\n📋 Options de configuration:', 'blue')
  log('   1. Vercel Postgres (recommandé pour Vercel)', 'blue')
  log('   2. Supabase (gratuit jusqu\'à 500MB)', 'blue')
  log('   3. Railway / Render / Autre', 'blue')
  log('   4. URL complète DATABASE_URL', 'blue')
  
  const choice = await question('\nVotre choix (1-4): ')
  
  let databaseUrl = ''
  
  switch (choice) {
    case '1':
      log('\n💡 Vercel Postgres:', 'blue')
      log('   1. Allez sur https://vercel.com/dashboard', 'blue')
      log('   2. Créez un projet Postgres', 'blue')
      log('   3. Copiez la variable DATABASE_URL', 'blue')
      databaseUrl = await question('\nDATABASE_URL: ')
      break
      
    case '2':
      log('\n💡 Supabase:', 'blue')
      log('   1. Allez sur https://supabase.com', 'blue')
      log('   2. Créez un projet', 'blue')
      log('   3. Settings > Database > Connection string', 'blue')
      databaseUrl = await question('\nDATABASE_URL (postgresql://...): ')
      break
      
    case '3':
      log('\n💡 Autre service:', 'blue')
      databaseUrl = await question('DATABASE_URL complet: ')
      break
      
    case '4':
      databaseUrl = await question('DATABASE_URL complet: ')
      break
      
    default:
      log('   ⚠️  Choix invalide', 'yellow')
      return null
  }
  
  if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
    log('   ❌ DATABASE_URL invalide', 'red')
    return null
  }
  
  log('   ✅ PostgreSQL configuré', 'green')
  return { DATABASE_URL: databaseUrl }
}

async function setupUpstashRedis() {
  log('\n🔴 Configuration Upstash Redis', 'cyan')
  log('='.repeat(60), 'cyan')
  
  const useRedis = await question('Utiliser Upstash Redis pour rate limiting? (o/n): ')
  if (useRedis.toLowerCase() !== 'o') {
    log('   ⏭️  Redis ignoré (rate limiting en mémoire)', 'yellow')
    return null
  }
  
  log('\n💡 Créer un compte Upstash:', 'blue')
  log('   1. Allez sur https://upstash.com', 'blue')
  log('   2. Créez un compte gratuit', 'blue')
  log('   3. Créez une base Redis', 'blue')
  log('   4. Copiez REST URL et REST Token', 'blue')
  
  const restUrl = await question('\nUPSTASH_REDIS_REST_URL: ')
  const restToken = await question('UPSTASH_REDIS_REST_TOKEN: ')
  
  if (!restUrl || !restToken) {
    log('   ❌ Configuration incomplète', 'red')
    return null
  }
  
  log('   ✅ Upstash Redis configuré', 'green')
  return {
    UPSTASH_REDIS_REST_URL: restUrl,
    UPSTASH_REDIS_REST_TOKEN: restToken
  }
}

async function setupSMTP() {
  log('\n📧 Configuration SMTP (Email)', 'cyan')
  log('='.repeat(60), 'cyan')
  
  const useSmtp = await question('Configurer SMTP pour les emails? (o/n): ')
  if (useSmtp.toLowerCase() !== 'o') {
    log('   ⏭️  SMTP ignoré (emails désactivés)', 'yellow')
    return null
  }
  
  log('\n📋 Fournisseurs supportés:', 'blue')
  log('   - Gmail (smtp.gmail.com:587)', 'blue')
  log('   - Outlook (smtp-mail.outlook.com:587)', 'blue')
  log('   - SendGrid, Mailgun, etc.', 'blue')
  
  const smtpHost = await question('\nSMTP_HOST (ex: smtp.gmail.com): ')
  const smtpPort = await question('SMTP_PORT (ex: 587): ')
  const smtpUser = await question('SMTP_USER (votre email): ')
  const smtpPass = await question('SMTP_PASS (mot de passe app): ')
  const adminEmail = await question('ADMIN_EMAIL (destinataire, optionnel): ')
  
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    log('   ❌ Configuration incomplète', 'red')
    return null
  }
  
  log('\n💡 Pour Gmail:', 'blue')
  log('   1. Activez l\'authentification à 2 facteurs', 'blue')
  log('   2. Générez un "Mot de passe d\'application"', 'blue')
  log('   3. Utilisez ce mot de passe pour SMTP_PASS', 'blue')
  
  log('   ✅ SMTP configuré', 'green')
  return {
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_USER: smtpUser,
    SMTP_PASS: smtpPass,
    ADMIN_EMAIL: adminEmail || smtpUser
  }
}

async function optimizeImages() {
  log('\n🖼️  Optimisation des images', 'cyan')
  log('='.repeat(60), 'cyan')
  
  const optimize = await question('Optimiser les images existantes? (o/n): ')
  if (optimize.toLowerCase() !== 'o') {
    log('   ⏭️  Optimisation ignorée', 'yellow')
    return false
  }
  
  log('   ✅ Script d\'optimisation disponible: npm run optimize:images', 'green')
  return true
}

async function main() {
  log('\n🚀 Configuration Production - INOXYA BIJOUX', 'magenta')
  log('='.repeat(60), 'cyan')
  log('Ce script vous guide pour configurer:', 'blue')
  log('  • PostgreSQL (base de données)', 'blue')
  log('  • Upstash Redis (rate limiting)', 'blue')
  log('  • SMTP (emails)', 'blue')
  log('  • Optimisation des images', 'blue')
  
  const envVars = {}
  
  // PostgreSQL
  const pgConfig = await setupPostgreSQL()
  if (pgConfig) Object.assign(envVars, pgConfig)
  
  // Redis
  const redisConfig = await setupUpstashRedis()
  if (redisConfig) Object.assign(envVars, redisConfig)
  
  // SMTP
  const smtpConfig = await setupSMTP()
  if (smtpConfig) Object.assign(envVars, smtpConfig)
  
  // Images
  await optimizeImages()
  
  // Sauvegarder dans .env.production
  if (Object.keys(envVars).length > 0) {
    log('\n💾 Sauvegarde de la configuration...', 'cyan')
    
    const envProductionPath = path.join(process.cwd(), '.env.production')
    let existingContent = ''
    
    if (fs.existsSync(envProductionPath)) {
      existingContent = fs.readFileSync(envProductionPath, 'utf8')
    }
    
    let newContent = existingContent
    for (const [key, value] of Object.entries(envVars)) {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      if (regex.test(newContent)) {
        newContent = newContent.replace(regex, `${key}=${value}`)
      } else {
        newContent += `\n${key}=${value}`
      }
    }
    
    fs.writeFileSync(envProductionPath, newContent.trim() + '\n', 'utf8')
    log(`   ✅ Configuration sauvegardée dans .env.production`, 'green')
    log('   ⚠️  NE JAMAIS COMMITER CE FICHIER DANS GIT', 'yellow')
  }
  
  // Résumé
  log('\n' + '='.repeat(60), 'cyan')
  log('📊 RÉSUMÉ DE LA CONFIGURATION\n', 'magenta')
  
  log(`   ${pgConfig ? '✅' : '⏭️ '} PostgreSQL`, pgConfig ? 'green' : 'yellow')
  log(`   ${redisConfig ? '✅' : '⏭️ '} Upstash Redis`, redisConfig ? 'green' : 'yellow')
  log(`   ${smtpConfig ? '✅' : '⏭️ '} SMTP`, smtpConfig ? 'green' : 'yellow')
  
  log('\n💡 Prochaines étapes:', 'cyan')
  log('   1. Vérifiez .env.production', 'blue')
  log('   2. Ajoutez ces variables sur Vercel (Settings > Environment Variables)', 'blue')
  log('   3. Testez la connexion: npm run test:production', 'blue')
  log('   4. Déployez: vercel --prod', 'blue')
  
  log('\n' + '='.repeat(60) + '\n', 'cyan')
  
  rl.close()
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red')
  rl.close()
  process.exit(1)
})

