#!/usr/bin/env node

/**
 * Script de test de connexion à la base de données PostgreSQL locale
 * Usage: npm run db:test
 */

const { Pool } = require('pg')

async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données PostgreSQL...')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://inoxya_user:inoxya_password_2024@localhost:5432/inoxya_bijoux',
    ssl: false,
  })

  try {
    // Test de connexion
    const client = await pool.connect()
    console.log('✅ Connexion PostgreSQL établie avec succès!')
    
    // Test de requête
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version')
    console.log('📅 Heure actuelle:', result.rows[0].current_time)
    console.log('🐘 Version PostgreSQL:', result.rows[0].postgres_version.split(' ')[0])
    
    // Test des tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('📊 Tables disponibles:')
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    // Test des utilisateurs
    const usersResult = await client.query('SELECT COUNT(*) as user_count FROM users')
    console.log(`👥 Nombre d'utilisateurs: ${usersResult.rows[0].user_count}`)
    
    // Test des produits
    const bijouxResult = await client.query('SELECT COUNT(*) as bijoux_count FROM bijoux')
    console.log(`💎 Nombre de bijoux: ${bijouxResult.rows[0].bijoux_count}`)
    
    client.release()
    console.log('🎉 Test de connexion réussi!')
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    console.log('\n💡 Solutions possibles:')
    console.log('  1. Vérifiez que Docker est démarré')
    console.log('  2. Lancez la base de données: npm run db:start')
    console.log('  3. Attendez que PostgreSQL soit prêt (30 secondes)')
    console.log('  4. Vérifiez les logs: npm run db:logs')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testDatabaseConnection()
