/**
 * Script de vérification de la connexion PostgreSQL
 * PHASE 5 - Database & Deployment
 * 
 * Usage: npx tsx scripts/verify-postgres-connection.ts
 */

import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config()

const pgPool = new Pool({
  host: process.env['DB_HOST'] || process.env['DATABASE_URL']?.match(/@([^:]+)/)?.[1] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || process.env['DATABASE_URL']?.match(/:(\d+)\//)?.[1] || '5432'),
  database: process.env['DB_NAME'] || process.env['DATABASE_URL']?.match(/\/([^?]+)/)?.[1] || 'inoxya_bijoux',
  user: process.env['DB_USER'] || process.env['DATABASE_URL']?.match(/:\/\/([^:]+):/)?.[1] || 'inoxya_user',
  password: process.env['DB_PASSWORD'] || process.env['DATABASE_URL']?.match(/:[^:]+:([^@]+)@/)?.[1] || 'inoxya_password_2024',
  connectionTimeoutMillis: 5000,
})

async function verifyConnection() {
  console.log('🔍 Vérification de la connexion PostgreSQL...\n')
  
  // Afficher la configuration (sans le mot de passe)
  console.log('📋 Configuration:')
  console.log(`   Host: ${pgPool.options.host}`)
  console.log(`   Port: ${pgPool.options.port}`)
  console.log(`   Database: ${pgPool.options.database}`)
  console.log(`   User: ${pgPool.options.user}`)
  console.log(`   Password: ${pgPool.options.password ? '***' : 'non défini'}\n`)
  
  try {
    // Test de connexion
    const result = await pgPool.query('SELECT NOW() as current_time, version() as pg_version')
    console.log('✅ Connexion réussie!')
    console.log(`   Heure serveur: ${result.rows[0].current_time}`)
    console.log(`   Version PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}\n`)
    
    // Vérifier les tables
    console.log('📊 Vérification des tables...')
    const tablesResult = await pgPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    const tables = tablesResult.rows.map(row => row.table_name)
    
    if (tables.length === 0) {
      console.log('   ⚠️  Aucune table trouvée. La base de données doit être initialisée.')
      console.log('   💡 Exécutez: npm run db:setup\n')
    } else {
      console.log(`   ✅ ${tables.length} table(s) trouvée(s):`)
      tables.forEach(table => {
        console.log(`      - ${table}`)
      })
      console.log()
    }
    
    // Vérifier les données
    const requiredTables = ['users', 'categories', 'products', 'packs']
    console.log('📦 Vérification des données...')
    
    for (const table of requiredTables) {
      if (tables.includes(table)) {
        const countResult = await pgPool.query(`SELECT COUNT(*) as count FROM ${table}`)
        const count = parseInt(countResult.rows[0].count)
        console.log(`   ${count > 0 ? '✅' : '⚠️ '} ${table}: ${count} enregistrement(s)`)
      } else {
        console.log(`   ❌ ${table}: table manquante`)
      }
    }
    
    console.log('\n✅ Vérification terminée avec succès!')
    
  } catch (error: any) {
    console.error('❌ Erreur de connexion:', error.message)
    console.error('\n💡 Vérifiez:')
    console.error('   1. PostgreSQL est démarré (npm run db:start)')
    console.error('   2. Les variables d\'environnement sont correctes')
    console.error('   3. Les credentials sont valides')
    process.exit(1)
  } finally {
    await pgPool.end()
  }
}

verifyConnection().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

