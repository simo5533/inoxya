/**
 * Script pour créer/réinitialiser l'utilisateur admin
 * Usage: npx tsx scripts/create-admin-user.ts
 */

import { initializeDatabase } from '@/lib/sqlite'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

// Import conditionnel de better-sqlite3
let Database: any = null
try {
  Database = require('better-sqlite3')
} catch (e) {
  logger.error('❌ better-sqlite3 non disponible. Installez-le avec: npm install better-sqlite3')
  process.exit(1)
}

async function createAdminUser() {
  try {
    logger.info('🔧 Création/réinitialisation de l\'utilisateur admin...')
    
    // Vérifier que la base de données existe
    const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
    const dataDir = path.join(process.cwd(), 'data')
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Initialiser la base de données
    initializeDatabase()
    
    // Ouvrir la connexion directement pour les opérations
    let db: any
    try {
      db = new Database(dbPath)
      db.pragma('foreign_keys = ON')
      // Tester la connexion
      db.prepare('SELECT 1 as test').get()
    } catch (dbError) {
      logger.error('❌ Impossible de se connecter à la base de données:', dbError)
      process.exit(1)
    }
    
    // Hacher le mot de passe
    const adminPasswordHash = bcrypt.hashSync('Admin123!', 10)
    
    // Créer ou mettre à jour l'utilisateur admin_phone
    const adminExists1 = db.prepare('SELECT id FROM users WHERE phone = ?').get('admin_phone')
    if (adminExists1) {
      db.prepare(`
        UPDATE users 
        SET password_hash = ?, first_name = ?, last_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE phone = ?
      `).run(adminPasswordHash, 'Admin', 'INOXYA', 'admin', 'admin_phone')
      logger.info('✅ Utilisateur admin (admin_phone) mis à jour')
    } else {
      db.prepare(`
        INSERT INTO users (phone, password_hash, first_name, last_name, role)
        VALUES (?, ?, ?, ?, ?)
      `).run('admin_phone', adminPasswordHash, 'Admin', 'INOXYA', 'admin')
      logger.info('✅ Utilisateur admin (admin_phone) créé')
    }
    
    // Créer ou mettre à jour l'utilisateur 0612345678
    const adminExists2 = db.prepare('SELECT id FROM users WHERE phone = ?').get('0612345678')
    if (adminExists2) {
      db.prepare(`
        UPDATE users 
        SET password_hash = ?, first_name = ?, last_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE phone = ?
      `).run(adminPasswordHash, 'Admin', 'INOXYA', 'admin', '0612345678')
      logger.info('✅ Utilisateur admin (0612345678) mis à jour')
    } else {
      db.prepare(`
        INSERT INTO users (phone, password_hash, first_name, last_name, role)
        VALUES (?, ?, ?, ?, ?)
      `).run('0612345678', adminPasswordHash, 'Admin', 'INOXYA', 'admin')
      logger.info('✅ Utilisateur admin (0612345678) créé')
    }
    
    db.close()
    
    logger.info('🎉 Utilisateurs admin créés avec succès!')
    logger.info('📱 Identifiants:')
    logger.info('   - Téléphone: 0612345678 ou admin_phone')
    logger.info('   - Mot de passe: Admin123!')
    
  } catch (error) {
    logger.error('❌ Erreur lors de la création de l\'utilisateur admin:', error)
    process.exit(1)
  }
}

createAdminUser()

