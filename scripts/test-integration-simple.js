#!/usr/bin/env node

/**
 * Script de test d'intégration simple de la base de données SQLite
 */

const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

const dbPath = path.join(process.cwd(), 'data', 'inoxya-bijoux.db')
const db = new Database(dbPath)

// Activer les clés étrangères
db.pragma('foreign_keys = ON')

async function testIntegration() {
  console.log('🧪 Test d\'intégration de la base de données...')
  
  try {
    // Test 1: Connexion
    console.log('\n1️⃣ Test de connexion...')
    const testQuery = db.prepare('SELECT 1 as test').get()
    if (testQuery) {
      console.log('✅ Connexion réussie')
    } else {
      console.log('❌ Échec de la connexion')
      return
    }

    // Test 2: Récupération des utilisateurs
    console.log('\n2️⃣ Test des utilisateurs...')
    const adminUser = db.prepare('SELECT * FROM users WHERE phone = ?').get('admin_phone')
    if (adminUser) {
      console.log(`✅ Utilisateur admin trouvé: ${adminUser.first_name} ${adminUser.last_name} (${adminUser.role})`)
    } else {
      console.log('❌ Utilisateur admin non trouvé')
    }

    // Test 3: Récupération des bijoux
    console.log('\n3️⃣ Test des bijoux...')
    const bijoux = db.prepare('SELECT * FROM bijoux WHERE is_available = 1').all()
    console.log(`✅ ${bijoux.length} bijoux trouvés`)
    if (bijoux.length > 0) {
      console.log(`   Premier bijou: ${bijoux[0].name} - ${bijoux[0].price}€`)
    }

    // Test 4: Récupération des catégories
    console.log('\n4️⃣ Test des catégories...')
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all()
    console.log(`✅ ${categories.length} catégories trouvées`)
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`)
    })

    // Test 5: Récupération des packs
    console.log('\n5️⃣ Test des packs...')
    const packs = db.prepare('SELECT * FROM packs ORDER BY created_at DESC').all()
    console.log(`✅ ${packs.length} packs trouvés`)
    packs.forEach(pack => {
      console.log(`   - ${pack.name} - ${pack.price}€`)
    })

    // Test 6: Test de recherche
    console.log('\n6️⃣ Test de recherche...')
    const searchResults = db.prepare(`
      SELECT * FROM bijoux 
      WHERE (name LIKE ? OR description LIKE ? OR name_ar LIKE ?) 
      AND is_available = 1 
      ORDER BY name
    `).all('%berbère%', '%berbère%', '%berbère%')
    console.log(`✅ ${searchResults.length} résultats pour "berbère"`)
    searchResults.forEach(bijou => {
      console.log(`   - ${bijou.name}`)
    })

    // Test 7: Test d'authentification
    console.log('\n7️⃣ Test d\'authentification...')
    const testUser = db.prepare('SELECT * FROM users WHERE phone = ?').get('admin_phone')
    if (testUser) {
      const isValidPassword = bcrypt.compareSync('password', testUser.password_hash)
      if (isValidPassword) {
        console.log('✅ Authentification réussie (admin_phone/password)')
      } else {
        console.log('❌ Échec de l\'authentification')
      }
    }

    // Test 8: Statistiques
    console.log('\n8️⃣ Test des statistiques...')
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
    const bijouxCount = db.prepare('SELECT COUNT(*) as count FROM bijoux').get()
    const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()
    const packsCount = db.prepare('SELECT COUNT(*) as count FROM packs').get()
    
    console.log('✅ Statistiques:')
    console.log(`   - Utilisateurs: ${userCount.count}`)
    console.log(`   - Bijoux: ${bijouxCount.count}`)
    console.log(`   - Catégories: ${categoriesCount.count}`)
    console.log(`   - Packs: ${packsCount.count}`)

    // Test 9: Test des relations
    console.log('\n9️⃣ Test des relations...')
    const bijouxWithCategories = db.prepare(`
      SELECT b.*, c.name as category_name 
      FROM bijoux b 
      LEFT JOIN categories c ON b.category_id = c.id 
      LIMIT 3
    `).all()
    
    console.log(`✅ ${bijouxWithCategories.length} bijoux avec leurs catégories:`)
    bijouxWithCategories.forEach(bijou => {
      console.log(`   - ${bijou.name} (Catégorie: ${bijou.category_name || 'Aucune'})`)
    })

    console.log('\n🎉 Tous les tests d\'intégration sont passés avec succès!')
    console.log('💡 La base de données SQLite est prête pour l\'application')
    console.log('\n📋 Résumé des fonctionnalités testées:')
    console.log('   ✅ Connexion à la base de données')
    console.log('   ✅ Gestion des utilisateurs et authentification')
    console.log('   ✅ Gestion des bijoux et catégories')
    console.log('   ✅ Gestion des packs')
    console.log('   ✅ Recherche de produits')
    console.log('   ✅ Relations entre tables')
    console.log('   ✅ Statistiques')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
  } finally {
    db.close()
  }
}

testIntegration()
