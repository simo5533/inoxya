#!/usr/bin/env node

/**
 * Script pour créer un compte admin avec sql.js (fallback si better-sqlite3 n'est pas disponible)
 */

const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs').promises

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
const dataDir = path.join(process.cwd(), 'data')

console.log('🔐 Création du compte admin avec sql.js\n')

async function createAdmin() {
  try {
    // Vérifier que le dossier data existe
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
      console.log('✅ Dossier data créé')
    }

    // Vérifier que la DB existe
    try {
      await fs.access(dbPath)
      console.log('✅ Base de données trouvée')
    } catch {
      console.error('❌ Base de données non trouvée:', dbPath)
      console.log('   Créez d\'abord la base de données en démarrant l\'application')
      process.exit(1)
    }

    // Charger sql.js
    let SQL
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sqlJsModule = require('sql.js')
      if (typeof sqlJsModule === 'function') {
        SQL = await sqlJsModule()
      } else if (sqlJsModule.default && typeof sqlJsModule.default === 'function') {
        SQL = await sqlJsModule.default()
      } else if (sqlJsModule.Database) {
        SQL = sqlJsModule
      } else {
        throw new Error('Format sql.js non reconnu')
      }
      console.log('✅ sql.js chargé')
    } catch (error) {
      console.error('❌ Erreur chargement sql.js:', error.message)
      process.exit(1)
    }

    // Charger la base de données
    const fileBuffer = await fs.readFile(dbPath)
    const db = new SQL.Database(fileBuffer)
    console.log('✅ Base de données chargée\n')

    // Créer admin avec numéro simple
    const adminPhone = '0612345678'
    const adminPassword = 'Admin123!'
    const passwordHash = bcrypt.hashSync(adminPassword, 10)

    // Vérifier si existe
    let stmt = db.prepare('SELECT id, phone, role FROM users WHERE phone = ?')
    stmt.bind([adminPhone])
    let existing = null
    if (stmt.step()) {
      existing = stmt.getAsObject()
    }
    stmt.free()

    if (existing) {
      // Mettre à jour
      stmt = db.prepare(`
        UPDATE users 
        SET password_hash = ?, role = 'admin', first_name = 'Admin', last_name = 'INOXYA', updated_at = CURRENT_TIMESTAMP
        WHERE phone = ?
      `)
      stmt.bind([passwordHash, adminPhone])
      stmt.step()
      stmt.free()
      console.log('✅ Compte admin mis à jour\n')
    } else {
      // Créer
      stmt = db.prepare(`
        INSERT INTO users (phone, password_hash, first_name, last_name, role)
        VALUES (?, ?, 'Admin', 'INOXYA', 'admin')
      `)
      stmt.bind([adminPhone, passwordHash])
      stmt.step()
      stmt.free()
      console.log('✅ Compte admin créé\n')
    }

    // Afficher les infos
    stmt = db.prepare('SELECT * FROM users WHERE phone = ?')
    stmt.bind([adminPhone])
    let admin = null
    if (stmt.step()) {
      admin = stmt.getAsObject()
    }
    stmt.free()

    if (admin) {
      console.log('═══════════════════════════════════════════════════')
      console.log('📋 IDENTIFIANTS ADMIN')
      console.log('═══════════════════════════════════════════════════')
      console.log(`📱 Téléphone: ${adminPhone}`)
      console.log(`🔑 Mot de passe: ${adminPassword}`)
      console.log(`👤 Nom: ${admin.first_name || 'Admin'} ${admin.last_name || 'INOXYA'}`)
      console.log(`🎭 Rôle: ${admin.role}`)
      console.log('═══════════════════════════════════════════════════\n')

      console.log('🌐 URLs:')
      console.log('   Login: http://localhost:3000/fr/login')
      console.log('   Admin: http://localhost:3000/admin\n')
    }

    // Sauvegarder la base de données
    const data = db.export()
    const buffer = Buffer.from(data)
    await fs.writeFile(dbPath, buffer)
    console.log('✅ Base de données sauvegardée')

    db.close()
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

createAdmin()

