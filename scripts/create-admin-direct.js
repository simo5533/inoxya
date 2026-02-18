#!/usr/bin/env node

/**
 * Script pour créer l'utilisateur admin directement
 * Utilise sql.js (SQLite en JavaScript pur) si disponible
 * Sinon, génère les instructions pour DB Browser
 */

const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
const scriptDir = path.join(process.cwd(), 'scripts')

console.log('🔐 Création de l\'utilisateur admin...\n')

// Vérifier que la base de données existe
if (!fs.existsSync(dbPath)) {
  console.error('❌ Base de données non trouvée:', dbPath)
  console.log('\n💡 Démarrez le serveur: npm run dev')
  process.exit(1)
}

console.log('✅ Base de données trouvée:', dbPath)

// Essayer d'utiliser sql.js (SQLite en JavaScript pur)
let initSqlJs = null
try {
  initSqlJs = require('sql.js')
} catch (e) {
  // sql.js non disponible
}

async function createAdminWithSqlJs() {
  try {
    // Lire la base de données
    const fileBuffer = fs.readFileSync(dbPath)
    const SQL = await initSqlJs()
    const db = new SQL.Database(fileBuffer)
    
    // Hacher le mot de passe
    const adminPasswordHash = bcrypt.hashSync('Admin123!', 10)
    
    // Créer ou mettre à jour les utilisateurs admin
    db.run(`
      INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
      VALUES ('0612345678', ?, 'Admin', 'INOXYA', 'admin', datetime('now'))
    `, [adminPasswordHash])
    
    db.run(`
      INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
      VALUES ('admin_phone', ?, 'Admin', 'INOXYA', 'admin', datetime('now'))
    `, [adminPasswordHash])
    
    // Vérifier
    const result = db.exec("SELECT id, phone, first_name, last_name, role FROM users WHERE role = 'admin'")
    if (result.length > 0) {
      console.log('✅ Utilisateurs admin créés:')
      result[0].values.forEach(row => {
        console.log(`   - ${row[1]} (${row[2]} ${row[3]})`)
      })
    }
    
    // Sauvegarder la base de données
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
    
    console.log('\n✅ Base de données mise à jour avec succès!')
    console.log('\n📱 Identifiants:')
    console.log('   Téléphone: 0612345678 ou admin_phone')
    console.log('   Mot de passe: Admin123!')
    
  } catch (error) {
    console.error('❌ Erreur avec sql.js:', error.message)
    throw error
  }
}

function createAdminWithBetterSqlite3() {
  const Database = require('better-sqlite3')
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  
  // Hacher le mot de passe
  const adminPasswordHash = bcrypt.hashSync('Admin123!', 10)
  
  // Créer ou mettre à jour les utilisateurs admin
  db.prepare(`
    INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
    VALUES ('0612345678', ?, 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP)
  `).run(adminPasswordHash)
  
  db.prepare(`
    INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
    VALUES ('admin_phone', ?, 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP)
  `).run(adminPasswordHash)
  
  // Vérifier
  const admins = db.prepare("SELECT id, phone, first_name, last_name, role FROM users WHERE role = 'admin'").all()
  if (admins.length > 0) {
    console.log('✅ Utilisateurs admin créés:')
    admins.forEach(admin => {
      console.log(`   - ${admin.phone} (${admin.first_name} ${admin.last_name})`)
    })
  }
  
  db.close()
  
  console.log('\n✅ Base de données mise à jour avec succès!')
  console.log('\n📱 Identifiants:')
  console.log('   Téléphone: 0612345678 ou admin_phone')
  console.log('   Mot de passe: Admin123!')
}

// Essayer sql.js d'abord
if (initSqlJs) {
  console.log('📝 Utilisation de sql.js...\n')
  createAdminWithSqlJs().catch(error => {
    console.error('❌ Erreur:', error.message)
    console.log('\n💡 Utilisez DB Browser for SQLite (voir GUIDE_CREATION_ADMIN.md)')
    process.exit(1)
  })
} else {
  // Essayer better-sqlite3
  let Database = null
  try {
    Database = require('better-sqlite3')
  } catch (e) {
    // better-sqlite3 non compilé
  }
  
  if (Database) {
    console.log('📝 Utilisation de better-sqlite3...\n')
    try {
      createAdminWithBetterSqlite3()
    } catch (error) {
      console.error('❌ Erreur avec better-sqlite3:', error.message)
      console.log('\n💡 Utilisez DB Browser for SQLite (voir GUIDE_CREATION_ADMIN.md)')
      process.exit(1)
    }
  } else {
    console.log('⚠️  Aucune bibliothèque SQLite disponible\n')
    console.log('💡 Solutions:')
    console.log('   1. Installez sql.js: npm install sql.js')
    console.log('   2. OU utilisez DB Browser for SQLite:')
    console.log('      - Téléchargez: https://sqlitebrowser.org/')
    console.log('      - Ouvrez:', dbPath)
    console.log('      - Exécutez:', path.join(scriptDir, 'create-admin.sql'))
    console.log('\n📋 Commandes SQL:')
    const sqlContent = fs.readFileSync(path.join(scriptDir, 'create-admin.sql'), 'utf8')
    console.log(sqlContent)
    process.exit(1)
  }
}
