#!/usr/bin/env node

/**
 * Script de test de connexion à PostgreSQL
 * pour le projet INOXYA BIJOUX
 */

const { Pool } = require('pg')

// Configuration PostgreSQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'inoxya_bijoux',
  user: process.env.DB_USER || 'inoxya_user',
  password: process.env.DB_PASSWORD || 'inoxya_password_2024',
}

console.log('🔍 Test de connexion à PostgreSQL...')
console.log('📡 Host:', dbConfig.host)
console.log('🔌 Port:', dbConfig.port)
console.log('🗄️ Database:', dbConfig.database)
console.log('👤 User:', dbConfig.user)

async function testPostgreSQLConnection() {
  const pool = new Pool(dbConfig)
  
  try {
    // Test 1: Connexion de base
    console.log('\n🔍 Test 1: Connexion de base...')
    const client = await pool.connect()
    console.log('✅ Connexion PostgreSQL réussie!')
    
    // Test 2: Vérifier l'heure actuelle
    console.log('\n🔍 Test 2: Vérification de l\'heure...')
    const timeResult = await client.query('SELECT NOW() as current_time')
    console.log('⏰ Heure actuelle:', timeResult.rows[0].current_time)
    
    // Test 3: Lister les bases de données
    console.log('\n🔍 Test 3: Liste des bases de données...')
    const dbResult = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false')
    console.log('📚 Bases de données disponibles:', dbResult.rows.map(row => row.datname))
    
    // Test 4: Vérifier les tables existantes
    console.log('\n🔍 Test 4: Tables existantes...')
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('📋 Tables existantes:', tablesResult.rows.map(row => row.table_name))
    
    // Test 5: Créer la table products si elle n'existe pas
    console.log('\n🔍 Test 5: Création de la table products...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255),
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        category VARCHAR(100) NOT NULL,
        stock INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Table products créée/vérifiée')
    
    // Test 6: Insérer un produit de test
    console.log('\n🔍 Test 6: Insertion d\'un produit de test...')
    const insertResult = await client.query(`
      INSERT INTO products (name, description, price, category, stock, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      'Test Produit - ' + new Date().toISOString(),
      'Produit de test pour vérifier la connexion PostgreSQL',
      99.99,
      'Test',
      1,
      true
    ])
    console.log('✅ Produit de test inséré:', insertResult.rows[0].name)
    
    // Test 7: Récupérer les produits
    console.log('\n🔍 Test 7: Récupération des produits...')
    const selectResult = await client.query('SELECT * FROM products ORDER BY created_at DESC LIMIT 5')
    console.log('📦 Produits trouvés:', selectResult.rows.length)
    selectResult.rows.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ${product.price} MAD`)
    })
    
    // Test 8: Nettoyer le produit de test
    console.log('\n🔍 Test 8: Nettoyage du produit de test...')
    await client.query('DELETE FROM products WHERE name LIKE $1', ['Test Produit - %'])
    console.log('✅ Produit de test supprimé')
    
    client.release()
    
    console.log('\n🎉 Test PostgreSQL terminé avec succès!')
    console.log('\n📋 Résumé:')
    console.log('   - Connexion: ✅ Réussie')
    console.log('   - Base de données: ✅ Accessible')
    console.log('   - Table products: ✅ Créée')
    console.log('   - Insertion: ✅ Fonctionnelle')
    console.log('   - Sélection: ✅ Fonctionnelle')
    console.log('   - Suppression: ✅ Fonctionnelle')
    
  } catch (error) {
    console.error('❌ Erreur lors du test PostgreSQL:', error.message)
    console.log('\n🔧 Solutions possibles:')
    console.log('   1. Vérifiez que PostgreSQL est installé et démarré')
    console.log('   2. Vérifiez que la base de données "inoxya_bijoux" existe')
    console.log('   3. Vérifiez que l\'utilisateur "inoxya_user" existe et a les permissions')
    console.log('   4. Vérifiez les paramètres de connexion dans .env.local')
    console.log('\n📝 Commandes pour créer la base de données:')
    console.log('   - Ouvrez psql en tant qu\'administrateur')
    console.log('   - CREATE DATABASE inoxya_bijoux;')
    console.log('   - CREATE USER inoxya_user WITH PASSWORD \'inoxya_password_2024\';')
    console.log('   - GRANT ALL PRIVILEGES ON DATABASE inoxya_bijoux TO inoxya_user;')
  } finally {
    await pool.end()
  }
}

// Exécuter le test
testPostgreSQLConnection()
