#!/usr/bin/env node

/**
 * Script simplifié de configuration de la base de données SQLite locale
 */

const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'inoxya-bijoux.db')
const db = new Database(dbPath)

// Activer les clés étrangères
db.pragma('foreign_keys = ON')

console.log('🔧 Configuration de la base de données SQLite...')

try {
  // Créer les tables
  console.log('📋 Création des tables...')
  
  // Table des utilisateurs
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Table des catégories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Table des bijoux
  db.exec(`
    CREATE TABLE IF NOT EXISTS bijoux (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      name TEXT NOT NULL,
      name_ar TEXT,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      image_url TEXT,
      images TEXT DEFAULT '[]',
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      category_id TEXT REFERENCES categories(id),
      is_available BOOLEAN DEFAULT TRUE,
      is_featured BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  console.log('✅ Tables créées avec succès!')

  // Vérifier si les données existent déjà
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (userCount.count > 0) {
    console.log('📊 Données déjà présentes')
  } else {
    console.log('📊 Insertion des données initiales...')
    
    // Insérer les catégories
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url) 
      VALUES (?, ?, ?, ?)
    `)

    insertCategory.run('Bagues', 'bagues', 'Collection de bagues en acier inoxydable', '/placeholder.svg?height=300&width=300')
    insertCategory.run('Colliers', 'colliers', 'Colliers élégants et durables', '/placeholder.svg?height=300&width=300')
    insertCategory.run('Bracelets', 'bracelets', 'Bracelets modernes et résistants', '/placeholder.svg?height=300&width=300')
    insertCategory.run('Boucles d\'oreilles', 'boucles-oreilles', 'Boucles d\'oreilles hypoallergéniques', '/placeholder.svg?height=300&width=300')
    insertCategory.run('Parures', 'parures', 'Ensembles coordonnés de bijoux', '/placeholder.svg?height=300&width=300')
    insertCategory.run('Broches', 'broches', 'Broches décoratives et élégantes', '/placeholder.svg?height=300&width=300')
    
    console.log('✅ Catégories insérées')

    // Récupérer les IDs des catégories
    const categoryIds = db.prepare('SELECT id, slug FROM categories').all()
    const categoryMap = new Map(categoryIds.map(c => [c.slug, c.id]))

    // Insérer les bijoux
    const insertBijou = db.prepare(`
      INSERT INTO bijoux (name, name_ar, description, price, original_price, image_url, images, rating, reviews_count, category_id, is_featured) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const baguesId = categoryMap.get('bagues')
    const colliersId = categoryMap.get('colliers')
    const braceletsId = categoryMap.get('bracelets')
    const bouclesId = categoryMap.get('boucles-oreilles')
    const paruresId = categoryMap.get('parures')

    insertBijou.run('Bague Berbère Or 18K', 'خاتم بربري ذهب', 'Bague traditionnelle berbère en or 18K avec motifs gravés authentiques.', 2999, 3999, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop', '["promo", "bestseller"]', 4.8, 127, baguesId, 1)
    insertBijou.run('Collier Filigrane Argent', 'قلادة فضية مشغولة', 'Collier traditionnel en filigrane d\'argent 925, motifs floraux délicats.', 1890, null, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop', '["bestseller"]', 4.7, 178, colliersId, 1)
    insertBijou.run('Bracelet Khomsa Protection', 'سوار خمسة للحماية', 'Bracelet traditionnel avec main de Fatma, symbole de protection.', 890, null, 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop', '["bestseller"]', 4.6, 134, braceletsId, 1)
    insertBijou.run('Boucles Créoles Berbères', 'أقراط دائرية بربرية', 'Créoles traditionnelles avec motifs berbères gravés, diamètre 4cm.', 599, null, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop', '["nouveau"]', 4.5, 89, bouclesId, 1)
    insertBijou.run('Parure Mariée Royale', 'طقم عروس ملكي', 'Ensemble complet : collier, boucles, bracelet et bague.', 5999, null, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop', '["premium", "bestseller"]', 4.9, 267, paruresId, 1)
    
    console.log('✅ Bijoux insérés')

    // Insérer les utilisateurs de test
    const insertUser = db.prepare(`
      INSERT INTO users (phone, password_hash, first_name, last_name, role) 
      VALUES (?, ?, ?, ?, ?)
    `)

    const hashedPassword = bcrypt.hashSync('password', 10)
    insertUser.run('admin_phone', hashedPassword, 'Admin', 'Principal', 'admin')
    insertUser.run('0698765432', hashedPassword, 'Modérateur', 'Test', 'moderator')
    insertUser.run('0612345678', hashedPassword, 'Utilisateur', 'Standard', 'user')
    
    console.log('✅ Utilisateurs insérés')
  }

  // Afficher les statistiques
  console.log('\n📊 Statistiques de la base de données:')
  
  const userStats = db.prepare('SELECT COUNT(*) as count FROM users').get()
  console.log(`👥 Utilisateurs: ${userStats.count}`)
  
  const bijouxStats = db.prepare('SELECT COUNT(*) as count FROM bijoux').get()
  console.log(`💎 Bijoux: ${bijouxStats.count}`)
  
  const categoriesStats = db.prepare('SELECT COUNT(*) as count FROM categories').get()
  console.log(`📂 Catégories: ${categoriesStats.count}`)

  // Afficher les utilisateurs créés
  const users = db.prepare('SELECT phone, first_name, last_name, role FROM users ORDER BY role').all()
  console.log('\n👤 Utilisateurs créés:')
  users.forEach(user => {
    console.log(`  - ${user.phone} (${user.first_name} ${user.last_name}) - ${user.role}`)
  })

  console.log('\n🎉 Base de données SQLite configurée avec succès!')
  console.log(`📁 Fichier de base de données: ${dbPath}`)
  console.log('💡 Vous pouvez maintenant utiliser l\'application avec la base de données locale')

} catch (error) {
  console.error('❌ Erreur lors de la configuration:', error)
  process.exit(1)
} finally {
  db.close()
}
