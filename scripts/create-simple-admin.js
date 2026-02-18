#!/usr/bin/env node

/**
 * Script pour créer un compte admin simple avec numéro facile
 */

const bcrypt = require('bcryptjs')
const path = require('path')
const Database = require('better-sqlite3')
const fs = require('fs')

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
const dataDir = path.join(process.cwd(), 'data')

console.log('🔐 Création du compte admin simple\n')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db
try {
  db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
} catch (error) {
  console.error('❌ Erreur:', error.message)
  process.exit(1)
}

// Créer admin avec numéro simple
const adminPhone = '0612345678'
const adminPassword = 'Admin123!'
const passwordHash = bcrypt.hashSync(adminPassword, 10)

try {
  // Vérifier si existe
  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(adminPhone)
  
  if (existing) {
    // Mettre à jour
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, role = 'admin', first_name = 'Admin', last_name = 'INOXYA', updated_at = CURRENT_TIMESTAMP
      WHERE phone = ?
    `).run(passwordHash, adminPhone)
    console.log('✅ Compte admin mis à jour\n')
  } else {
    // Créer
    db.prepare(`
      INSERT INTO users (phone, password_hash, first_name, last_name, role)
      VALUES (?, ?, 'Admin', 'INOXYA', 'admin')
    `).run(adminPhone, passwordHash)
    console.log('✅ Compte admin créé\n')
  }
  
  // Afficher les infos
  const admin = db.prepare('SELECT * FROM users WHERE phone = ?').get(adminPhone)
  
  console.log('═══════════════════════════════════════════════════')
  console.log('📋 IDENTIFIANTS ADMIN')
  console.log('═══════════════════════════════════════════════════')
  console.log(`📱 Téléphone: ${adminPhone}`)
  console.log(`🔑 Mot de passe: ${adminPassword}`)
  console.log(`👤 Nom: ${admin.first_name} ${admin.last_name}`)
  console.log(`🎭 Rôle: ${admin.role}`)
  console.log('═══════════════════════════════════════════════════\n')
  
  console.log('🌐 URLs:')
  console.log('   Login: http://localhost:3000/login')
  console.log('   Admin: http://localhost:3000/admin\n')
  
} catch (error) {
  console.error('❌ Erreur:', error.message)
}

db.close()

