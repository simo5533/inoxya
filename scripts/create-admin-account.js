#!/usr/bin/env node

/**
 * Script pour créer un compte administrateur INOXYA BIJOUX
 * Usage: node scripts/create-admin-account.js
 */

const bcrypt = require('bcryptjs')
const path = require('path')
const Database = require('better-sqlite3')
const fs = require('fs')

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
const dataDir = path.join(process.cwd(), 'data')

console.log('🔐 Création du compte administrateur INOXYA BIJOUX\n')

// Vérifier que le dossier data existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log('✅ Dossier data créé')
}

// Connexion à la base de données
let db
try {
  db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  console.log('✅ Connexion à la base de données réussie\n')
} catch (error) {
  console.error('❌ Erreur de connexion à la base de données:', error.message)
  process.exit(1)
}

// Initialiser les tables si elles n'existent pas
try {
  // Table users
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
  console.log('✅ Table users vérifiée')
} catch (error) {
  console.error('❌ Erreur lors de la création des tables:', error.message)
}

// Informations du compte admin
const adminPhone = '0612345678' // Numéro facile à retenir
const adminPassword = 'Admin123!' // Mot de passe sécurisé
const adminFirstName = 'Admin'
const adminLastName = 'INOXYA'

// Hacher le mot de passe
const passwordHash = bcrypt.hashSync(adminPassword, 10)

// Vérifier si l'admin existe déjà
const existingAdmin = db.prepare('SELECT id, phone, role FROM users WHERE phone = ? OR role = ?').get(adminPhone, 'admin')

if (existingAdmin) {
  // Mettre à jour le mot de passe et le rôle
  try {
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, role = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE phone = ? OR role = 'admin'
    `).run(passwordHash, 'admin', adminFirstName, adminLastName, adminPhone)
    console.log('✅ Compte admin mis à jour avec succès\n')
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message)
  }
} else {
  // Créer le compte admin
  try {
    db.prepare(`
      INSERT INTO users (phone, password_hash, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(adminPhone, passwordHash, adminFirstName, adminLastName, 'admin')
    console.log('✅ Compte admin créé avec succès\n')
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message)
  }
}

// Vérifier le compte créé
const admin = db.prepare('SELECT id, phone, first_name, last_name, role, created_at FROM users WHERE role = ?').get('admin')

if (admin) {
  console.log('📋 INFORMATIONS DE CONNEXION ADMIN\n')
  console.log('═'.repeat(50))
  console.log(`📱 Téléphone: ${admin.phone}`)
  console.log(`🔑 Mot de passe: ${adminPassword}`)
  console.log(`👤 Nom: ${admin.first_name} ${admin.last_name}`)
  console.log(`🎭 Rôle: ${admin.role}`)
  console.log('═'.repeat(50))
  console.log('\n🌐 URL de connexion: http://localhost:3000/login')
  console.log('🌐 URL Admin: http://localhost:3000/admin\n')
} else {
  console.error('❌ Erreur: Le compte admin n\'a pas pu être créé')
}

// Vérifier les autres tables importantes
console.log('🔍 Vérification de la base de données...\n')

const tables = ['products', 'categories', 'packs', 'orders', 'payments', 'notifications']
tables.forEach(table => {
  try {
    const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table)
    if (result) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get()
      console.log(`✅ Table ${table}: ${count.count} enregistrements`)
    } else {
      console.log(`⚠️  Table ${table}: non trouvée (sera créée automatiquement)`)
    }
  } catch (error) {
    console.log(`⚠️  Table ${table}: erreur de vérification`)
  }
})

// Fermer la connexion
db.close()

console.log('\n✅ Script terminé avec succès!')
console.log('\n📝 Instructions:')
console.log('1. Démarrez le serveur: npm run dev')
console.log('2. Allez sur http://localhost:3000/login')
console.log('3. Connectez-vous avec les identifiants ci-dessus')
console.log('4. Accédez à l\'admin via http://localhost:3000/admin\n')

