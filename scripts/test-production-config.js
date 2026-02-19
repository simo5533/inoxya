#!/usr/bin/env node
/**
 * Script pour tester la configuration de production
 * - Test connexion PostgreSQL
 * - Test connexion Upstash Redis
 * - Test SMTP
 */

const { Pool } = require('pg')
const http = require('http')
const https = require('https')

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

async function testPostgreSQL() {
  log('\n🐘 Test PostgreSQL...', 'cyan')
  
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    log('   ⏭️  DATABASE_URL non configuré', 'yellow')
    return false
  }
  
  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
    
    const result = await pool.query('SELECT NOW() as now, version() as version')
    log(`   ✅ PostgreSQL connecté`, 'green')
    log(`   📅 Serveur: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`, 'blue')
    log(`   🕐 Heure serveur: ${result.rows[0].now}`, 'blue')
    
    await pool.end()
    return true
  } catch (error) {
    log(`   ❌ Erreur PostgreSQL: ${error.message}`, 'red')
    return false
  }
}

async function testUpstashRedis() {
  log('\n🔴 Test Upstash Redis...', 'cyan')
  
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN
  
  if (!restUrl || !restToken) {
    log('   ⏭️  Upstash Redis non configuré', 'yellow')
    return false
  }
  
  try {
    // Test avec une requête HTTP REST
    const url = new URL(restUrl)
    const testKey = 'test:connection'
    const testValue = Date.now().toString()
    
    // SET command
    const setUrl = `${restUrl}/set/${testKey}/${testValue}`
    const setResponse = await fetch(setUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${restToken}`
      }
    })
    
    if (!setResponse.ok) {
      throw new Error(`SET failed: ${setResponse.status}`)
    }
    
    // GET command
    const getUrl = `${restUrl}/get/${testKey}`
    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${restToken}`
      }
    })
    
    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status}`)
    }
    
    const data = await getResponse.json()
    if (data.result === testValue) {
      log('   ✅ Upstash Redis connecté', 'green')
      log(`   🔑 Test réussi: ${testKey} = ${data.result}`, 'blue')
      
      // Cleanup
      await fetch(`${restUrl}/del/${testKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${restToken}`
        }
      })
      
      return true
    } else {
      throw new Error('Test value mismatch')
    }
  } catch (error) {
    log(`   ❌ Erreur Upstash Redis: ${error.message}`, 'red')
    log('   💡 Vérifiez UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN', 'yellow')
    return false
  }
}

async function testSMTP() {
  log('\n📧 Test SMTP...', 'cyan')
  
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    log('   ⏭️  SMTP non configuré', 'yellow')
    return false
  }
  
  try {
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
    
    // Test de connexion
    await transporter.verify()
    log('   ✅ SMTP connecté', 'green')
    log(`   📮 Serveur: ${smtpHost}:${smtpPort}`, 'blue')
    log(`   👤 Utilisateur: ${smtpUser}`, 'blue')
    
    return true
  } catch (error) {
    log(`   ❌ Erreur SMTP: ${error.message}`, 'red')
    log('   💡 Vérifiez vos identifiants SMTP', 'yellow')
    return false
  }
}

async function main() {
  log('\n🧪 Test de la Configuration Production', 'magenta')
  log('='.repeat(60), 'cyan')
  
  // Charger .env.production si existe
  const envProductionPath = require('path').join(process.cwd(), '.env.production')
  if (require('fs').existsSync(envProductionPath)) {
    require('dotenv').config({ path: envProductionPath })
    log('   📋 .env.production chargé', 'blue')
  }
  
  const results = {
    postgres: await testPostgreSQL(),
    redis: await testUpstashRedis(),
    smtp: await testSMTP()
  }
  
  log('\n' + '='.repeat(60), 'cyan')
  log('📊 RÉSULTATS DES TESTS\n', 'magenta')
  
  log(`   ${results.postgres ? '✅' : '❌'} PostgreSQL`, results.postgres ? 'green' : 'red')
  log(`   ${results.redis ? '✅' : '❌'} Upstash Redis`, results.redis ? 'green' : 'red')
  log(`   ${results.smtp ? '✅' : '❌'} SMTP`, results.smtp ? 'green' : 'red')
  
  const allOk = Object.values(results).every(v => v)
  
  if (allOk) {
    log('\n✅ Tous les services sont configurés et fonctionnels !', 'green')
  } else {
    log('\n⚠️  Certains services nécessitent une configuration', 'yellow')
    log('   Utilisez: npm run setup:production', 'blue')
  }
  
  log('\n' + '='.repeat(60) + '\n', 'cyan')
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red')
  process.exit(1)
})

