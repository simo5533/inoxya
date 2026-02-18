#!/usr/bin/env node

/**
 * Script pour visualiser la base de données SQLite
 * pour le projet INOXYA BIJOUX
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Chemin vers la base de données SQLite
const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')

console.log('🗄️ VISUALISATEUR DE BASE DE DONNÉES - INOXYA BIJOUX')
console.log('=' .repeat(60))

function viewDatabase() {
  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Fichier de base de données non trouvé!')
      console.log('📁 Chemin attendu:', dbPath)
      console.log('💡 Exécutez d\'abord: node scripts/test-sqlite-connection.js')
      return
    }

    console.log('📁 Fichier de base:', dbPath)
    console.log('📊 Taille du fichier:', (fs.statSync(dbPath).size / 1024).toFixed(2) + ' KB')
    console.log('')

    // Connexion à la base
    const db = new Database(dbPath)

    // 1. Lister toutes les tables
    console.log('📋 TABLES DISPONIBLES:')
    console.log('-' .repeat(30))
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()

    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name}`)
    })
    console.log('')

    // 2. Afficher les produits
    console.log('📦 PRODUITS:')
    console.log('-' .repeat(30))
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all()
    
    if (products.length === 0) {
      console.log('Aucun produit trouvé')
    } else {
      console.log(`Total: ${products.length} produits`)
      console.log('')
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`)
        console.log(`   ID: ${product.id}`)
        console.log(`   Prix: ${product.price} MAD`)
        console.log(`   Catégorie: ${product.category}`)
        console.log(`   Stock: ${product.stock}`)
        console.log(`   Actif: ${product.is_active ? 'Oui' : 'Non'}`)
        console.log(`   Créé: ${product.created_at}`)
        if (product.name_ar) {
          console.log(`   Nom AR: ${product.name_ar}`)
        }
        console.log('')
      })
    }

    // 3. Afficher les catégories
    console.log('📂 CATÉGORIES:')
    console.log('-' .repeat(30))
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all()
    
    if (categories.length === 0) {
      console.log('Aucune catégorie trouvée')
    } else {
      console.log(`Total: ${categories.length} catégories`)
      console.log('')
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name}`)
        console.log(`   Slug: ${category.slug}`)
        console.log(`   Description: ${category.description || 'Aucune'}`)
        console.log('')
      })
    }

    // 4. Afficher les packs
    console.log('🎁 PACKS:')
    console.log('-' .repeat(30))
    const packs = db.prepare('SELECT * FROM packs ORDER BY name').all()
    
    if (packs.length === 0) {
      console.log('Aucun pack trouvé')
    } else {
      console.log(`Total: ${packs.length} packs`)
      console.log('')
      packs.forEach((pack, index) => {
        console.log(`${index + 1}. ${pack.name}`)
        console.log(`   Prix: ${pack.price} MAD`)
        console.log(`   Vedette: ${pack.is_featured ? 'Oui' : 'Non'}`)
        console.log(`   Slug: ${pack.slug}`)
        console.log('')
      })
    }

    // 5. Statistiques générales
    console.log('📊 STATISTIQUES GÉNÉRALES:')
    console.log('-' .repeat(30))
    
    const stats = {
      totalProducts: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
      activeProducts: db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count,
      totalStock: db.prepare('SELECT SUM(stock) as total FROM products').get().total || 0,
      totalValue: db.prepare('SELECT SUM(price * stock) as total FROM products').get().total || 0,
      categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
      packs: db.prepare('SELECT COUNT(*) as count FROM packs').get().count
    }

    console.log(`📦 Produits totaux: ${stats.totalProducts}`)
    console.log(`✅ Produits actifs: ${stats.activeProducts}`)
    console.log(`📊 Stock total: ${stats.totalStock} unités`)
    console.log(`💰 Valeur stock: ${stats.totalValue.toFixed(2)} MAD`)
    console.log(`📂 Catégories: ${stats.categories}`)
    console.log(`🎁 Packs: ${stats.packs}`)
    console.log('')

    // 6. Produits par catégorie
    console.log('📊 PRODUITS PAR CATÉGORIE:')
    console.log('-' .repeat(30))
    const productsByCategory = db.prepare(`
      SELECT category, COUNT(*) as count, SUM(stock) as total_stock, AVG(price) as avg_price
      FROM products 
      GROUP BY category 
      ORDER BY count DESC
    `).all()

    productsByCategory.forEach((item, index) => {
      console.log(`${index + 1}. ${item.category}`)
      console.log(`   Produits: ${item.count}`)
      console.log(`   Stock: ${item.total_stock}`)
      console.log(`   Prix moyen: ${item.avg_price.toFixed(2)} MAD`)
      console.log('')
    })

    db.close()

    console.log('✅ Visualisation terminée!')
    console.log('')
    console.log('💡 Commandes utiles:')
    console.log('   - node scripts/view-database.js (ce script)')
    console.log('   - node scripts/test-sqlite-connection.js (test complet)')
    console.log('   - node scripts/test-final-integration.js (test d\'intégration)')

  } catch (error) {
    console.error('❌ Erreur lors de la visualisation:', error.message)
  }
}

// Exécuter la visualisation
viewDatabase()
