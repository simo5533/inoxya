#!/usr/bin/env tsx

/**
 * Script d'initialisation complète de la base de données SQLite
 * Usage: npx tsx scripts/init-sqlite-database.ts
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'inoxya_bijoux.db')
const db = new Database(dbPath)

// Activer les clés étrangères
db.pragma('foreign_keys = ON')

console.log('🔧 Initialisation de la base de données SQLite...')
console.log(`📁 Chemin: ${dbPath}`)

try {
  // Créer la table products
  console.log('📋 Création de la table products...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ar TEXT,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      category TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      is_featured BOOLEAN DEFAULT 0,
      image_url TEXT,
      images TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Ajouter la colonne is_featured si elle n'existe pas
  try {
    db.exec(`ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT 0`)
    console.log('✅ Colonne is_featured ajoutée')
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('⚠️ Erreur lors de l\'ajout de is_featured:', e.message)
    }
  }

  // Créer la table categories
  console.log('📋 Création de la table categories...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Créer la table packs
  console.log('📋 Création de la table packs...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS packs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      is_featured BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Créer la table users
  console.log('📋 Création de la table users...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('✅ Tables créées avec succès!')

  // Vérifier si les catégories existent
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  
  if (categoryCount.count === 0) {
    console.log('📊 Insertion des catégories...')
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url) 
      VALUES (?, ?, ?, ?)
    `)

    const categories = [
      ['Bagues', 'bagues', 'Collection de bagues en acier inoxydable', '/images/categories/bagues-category.jpeg'],
      ['Colliers', 'colliers', 'Colliers élégants et durables', '/images/categories/colliers-category.jpeg'],
      ['Bracelets', 'bracelets', 'Bracelets modernes et résistants', '/images/categories/bracelets-category.jpeg'],
      ['Boucles d\'oreilles', 'boucles-oreilles', 'Boucles d\'oreilles hypoallergéniques', '/images/categories/boucles-oreilles-category.jpeg'],
      ['Parures', 'parures', 'Ensembles coordonnés de bijoux', '/images/categories/bagues-category.jpeg'],
      ['Broches', 'broches', 'Broches décoratives et élégantes', '/images/categories/broches-category.jpeg'],
      ['Montres', 'montres', 'Montres élégantes et précises', '/images/categories/montres-category.jpeg']
    ]

    categories.forEach(cat => insertCategory.run(...cat))
    console.log(`✅ ${categories.length} catégories insérées`)
  } else {
    console.log(`✅ ${categoryCount.count} catégories déjà présentes`)
  }

  // Vérifier les produits
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
  console.log(`\n📊 Produits dans la base de données: ${productCount.count}`)

  if (productCount.count > 0) {
    // Afficher quelques produits
    const products = db.prepare('SELECT id, name, price, is_active, is_featured, image_url FROM products LIMIT 5').all() as any[]
    console.log('\n📦 Exemples de produits:')
    products.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id}, Prix: ${p.price} MAD, Actif: ${p.is_active}, Vedette: ${p.is_featured})`)
      if (p.image_url) {
        console.log(`    Image: ${p.image_url}`)
      }
    })
  } else {
    console.log('⚠️ Aucun produit trouvé dans la base de données')
    console.log('💡 Vous pouvez ajouter des produits via l\'interface admin ou en utilisant un script d\'import')
  }

  // Vérifier les packs
  const packCount = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
  console.log(`\n📦 Packs dans la base de données: ${packCount.count}`)

  // Statistiques finales
  console.log('\n📊 Statistiques de la base de données:')
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number },
    products: db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number },
    productsActive: db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number },
    productsFeatured: db.prepare('SELECT COUNT(*) as count FROM products WHERE is_featured = 1').get() as { count: number },
    categories: db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number },
    packs: db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
  }

  console.log(`👥 Utilisateurs: ${stats.users.count}`)
  console.log(`💎 Produits: ${stats.products.count} (${stats.productsActive.count} actifs, ${stats.productsFeatured.count} vedettes)`)
  console.log(`📂 Catégories: ${stats.categories.count}`)
  console.log(`📦 Packs: ${stats.packs.count}`)

  console.log('\n🎉 Initialisation terminée avec succès!')
  console.log(`📁 Fichier de base de données: ${dbPath}`)

} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation:', error)
  process.exit(1)
} finally {
  db.close()
}

