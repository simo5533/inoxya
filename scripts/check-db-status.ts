#!/usr/bin/env tsx

/**
 * Script pour vérifier l'état de la base de données SQLite
 * Usage: npx tsx scripts/check-db-status.ts
 */

import { testConnection, initializeDatabase, getProductsAsync } from '../lib/sqlite'
import { getAllCategories } from '../lib/database'

async function checkDatabaseStatus() {
  console.log('🔍 Vérification de l\'état de la base de données SQLite...\n')

  // Tester la connexion
  const isConnected = testConnection()
  if (!isConnected) {
    console.log('❌ La base de données n\'est pas accessible')
    console.log('💡 Initialisation de la base de données...')
    
    try {
      initializeDatabase()
      console.log('✅ Base de données initialisée')
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error)
      console.log('\n💡 La base de données sera initialisée automatiquement au premier démarrage du serveur Next.js')
      return
    }
  } else {
    console.log('✅ Connexion à la base de données réussie')
  }

  // Vérifier les produits
  try {
    const products = await getProductsAsync()
    console.log(`\n📦 Produits dans la base de données: ${products.length}`)
    
    if (products.length > 0) {
      const activeProducts = products.filter(p => p.is_available)
      const featuredProducts = products.filter(p => p.is_featured)
      
      console.log(`   - Actifs: ${activeProducts.length}`)
      console.log(`   - Vedettes: ${featuredProducts.length}`)
      
      console.log('\n📋 Exemples de produits:')
      products.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name} (Prix: ${p.price} MAD, Actif: ${p.is_available ? 'Oui' : 'Non'}, Vedette: ${p.is_featured ? 'Oui' : 'Non'})`)
      })
    } else {
      console.log('⚠️ Aucun produit trouvé dans la base de données')
      console.log('💡 Vous pouvez ajouter des produits via l\'interface admin (http://localhost:3000/admin/produits)')
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des produits:', error)
  }

  // Vérifier les catégories
  try {
    const categories = await getAllCategories()
    console.log(`\n📂 Catégories dans la base de données: ${categories.length}`)
    
    if (categories.length > 0) {
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`)
      })
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des catégories:', error)
  }

  console.log('\n✅ Vérification terminée')
}

checkDatabaseStatus().catch(console.error)

