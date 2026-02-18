#!/usr/bin/env node

/**
 * Script pour ajouter les tables manquantes à la base de données SQLite
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(process.cwd(), 'data', 'inoxya-bijoux.db')
const db = new Database(dbPath)

// Activer les clés étrangères
db.pragma('foreign_keys = ON')

console.log('🔧 Ajout des tables manquantes...')

try {
  // Table des packs
  console.log('📦 Création de la table packs...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS packs (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      is_featured BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Table du panier
  console.log('🛒 Création de la table cart_items...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      bijou_id TEXT REFERENCES bijoux(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, bijou_id)
    )
  `)

  // Table des favoris
  console.log('❤️ Création de la table favorites...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      bijou_id TEXT REFERENCES bijoux(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, bijou_id)
    )
  `)

  // Table des commandes
  console.log('📋 Création de la table orders...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      user_id TEXT REFERENCES users(id),
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Table des items de commande
  console.log('📦 Création de la table order_items...')
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
      bijou_id TEXT REFERENCES bijoux(id),
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Ajouter la colonne pack_id à la table bijoux si elle n'existe pas
  console.log('🔗 Ajout de la colonne pack_id à la table bijoux...')
  try {
    db.exec('ALTER TABLE bijoux ADD COLUMN pack_id TEXT REFERENCES packs(id)')
    console.log('✅ Colonne pack_id ajoutée')
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ Colonne pack_id existe déjà')
    } else {
      throw error
    }
  }

  // Ajouter la colonne is_custom à la table bijoux si elle n'existe pas
  console.log('🎨 Ajout de la colonne is_custom à la table bijoux...')
  try {
    db.exec('ALTER TABLE bijoux ADD COLUMN is_custom BOOLEAN DEFAULT FALSE')
    console.log('✅ Colonne is_custom ajoutée')
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ Colonne is_custom existe déjà')
    } else {
      throw error
    }
  }

  // Insérer des packs de test
  console.log('📦 Insertion des packs de test...')
  const insertPack = db.prepare(`
    INSERT INTO packs (name, slug, description, price, image_url, is_featured) 
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const packs = [
    ['Pack Mariage', 'pack-mariage', 'Ensemble complet pour votre jour J', 149.99, '/placeholder.svg?height=400&width=400', 1],
    ['Pack Élégance', 'pack-elegance', 'Pour toutes vos occasions spéciales', 99.99, '/placeholder.svg?height=400&width=400', 1],
    ['Pack Quotidien', 'pack-quotidien', 'Bijoux pour tous les jours', 69.99, '/placeholder.svg?height=400&width=400', 0],
    ['Pack Cadeau', 'pack-cadeau', 'Le cadeau parfait pour vos proches', 89.99, '/placeholder.svg?height=400&width=400', 1]
  ]

  packs.forEach(pack => {
    try {
      insertPack.run(...pack)
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log(`ℹ️ Pack ${pack[0]} existe déjà`)
      } else {
        throw error
      }
    }
  })

  console.log('✅ Packs insérés')

  // Vérifier les tables finales
  console.log('\n📊 Vérification finale des tables:')
  const tables = db.prepare(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all()

  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get()
    console.log(`  ✅ ${table.name}: ${count.count} enregistrements`)
  })

  console.log('\n🎉 Toutes les tables ont été créées avec succès!')

} catch (error) {
  console.error('❌ Erreur:', error.message)
} finally {
  db.close()
}
