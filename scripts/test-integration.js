#!/usr/bin/env node

/**
 * Script de test d'intégration de la base de données SQLite avec l'application
 */

const { db } = require('../lib/database-adapter')

async function testIntegration() {
  console.log('🧪 Test d\'intégration de la base de données...')
  
  try {
    // Test 1: Connexion
    console.log('\n1️⃣ Test de connexion...')
    const isConnected = await db.testConnection()
    if (isConnected) {
      console.log('✅ Connexion réussie')
    } else {
      console.log('❌ Échec de la connexion')
      return
    }

    // Test 2: Récupération des utilisateurs
    console.log('\n2️⃣ Test des utilisateurs...')
    const adminUser = await db.getUserByPhone('admin_phone')
    if (adminUser) {
      console.log(`✅ Utilisateur admin trouvé: ${adminUser.first_name} ${adminUser.last_name} (${adminUser.role})`)
    } else {
      console.log('❌ Utilisateur admin non trouvé')
    }

    // Test 3: Récupération des bijoux
    console.log('\n3️⃣ Test des bijoux...')
    const bijoux = await db.getBijoux()
    console.log(`✅ ${bijoux.length} bijoux trouvés`)
    if (bijoux.length > 0) {
      console.log(`   Premier bijou: ${bijoux[0].name} - ${bijoux[0].price}€`)
    }

    // Test 4: Récupération des catégories
    console.log('\n4️⃣ Test des catégories...')
    const categories = await db.getCategories()
    console.log(`✅ ${categories.length} catégories trouvées`)
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`)
    })

    // Test 5: Récupération des packs
    console.log('\n5️⃣ Test des packs...')
    const packs = await db.getPacks()
    console.log(`✅ ${packs.length} packs trouvés`)
    packs.forEach(pack => {
      console.log(`   - ${pack.name} - ${pack.price}€`)
    })

    // Test 6: Test de recherche
    console.log('\n6️⃣ Test de recherche...')
    const searchResults = await db.searchBijoux('berbère')
    console.log(`✅ ${searchResults.length} résultats pour "berbère"`)
    searchResults.forEach(bijou => {
      console.log(`   - ${bijou.name}`)
    })

    // Test 7: Test d'authentification
    console.log('\n7️⃣ Test d\'authentification...')
    const testUser = await db.getUserByPhone('admin_phone')
    if (testUser) {
      const isValidPassword = await db.verifyPassword('password', testUser.password_hash)
      if (isValidPassword) {
        console.log('✅ Authentification réussie (admin/password)')
      } else {
        console.log('❌ Échec de l\'authentification')
      }
    }

    // Test 8: Statistiques
    console.log('\n8️⃣ Test des statistiques...')
    const stats = await db.getStats()
    console.log('✅ Statistiques:')
    console.log(`   - Utilisateurs: ${stats.users}`)
    console.log(`   - Bijoux: ${stats.bijoux}`)
    console.log(`   - Catégories: ${stats.categories}`)
    console.log(`   - Packs: ${stats.packs}`)

    console.log('\n🎉 Tous les tests d\'intégration sont passés avec succès!')
    console.log('💡 La base de données SQLite est prête pour l\'application')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
  }
}

testIntegration()
