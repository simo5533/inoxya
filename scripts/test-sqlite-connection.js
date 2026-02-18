#!/usr/bin/env node

/**
 * Script de test de connexion à la base de données SQLite locale
 * Usage: npm run db:test
 */

const { initializeDatabase, testConnection, queryDatabase } = require('../lib/database-sqlite')

async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données SQLite...')
  
  try {
    // Initialiser la base de données
    const initialized = initializeDatabase()
    if (!initialized) {
      console.error('❌ Échec de l\'initialisation de la base de données')
      process.exit(1)
    }
    
    // Test de connexion
    const connected = testConnection()
    if (!connected) {
      console.error('❌ Échec du test de connexion')
      process.exit(1)
    }
    
    // Test des tables
    const tablesResult = queryDatabase(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    
    console.log('📊 Tables disponibles:')
    tablesResult.forEach(row => {
      console.log(`  - ${row.name}`)
    })
    
    // Test des utilisateurs
    const usersResult = queryDatabase('SELECT COUNT(*) as user_count FROM users')
    console.log(`👥 Nombre d'utilisateurs: ${usersResult[0].user_count}`)
    
    // Test des produits
    const bijouxResult = queryDatabase('SELECT COUNT(*) as bijoux_count FROM bijoux')
    console.log(`💎 Nombre de bijoux: ${bijouxResult[0].bijoux_count}`)
    
    // Test des catégories
    const categoriesResult = queryDatabase('SELECT COUNT(*) as categories_count FROM categories')
    console.log(`📂 Nombre de catégories: ${categoriesResult[0].categories_count}`)
    
    // Afficher les utilisateurs créés
    const users = queryDatabase('SELECT phone, first_name, last_name, role FROM users ORDER BY role')
    console.log('\n👤 Utilisateurs créés:')
    users.forEach(user => {
      console.log(`  - ${user.phone} (${user.first_name} ${user.last_name}) - ${user.role}`)
    })
    
    console.log('\n🎉 Test de connexion réussi!')
    console.log('💡 Vous pouvez maintenant utiliser l\'application avec la base de données locale')
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    console.log('\n💡 Solutions possibles:')
    console.log('  1. Vérifiez que le dossier data/ existe')
    console.log('  2. Vérifiez les permissions d\'écriture')
    console.log('  3. Redémarrez l\'application')
    process.exit(1)
  }
}

testDatabaseConnection()
