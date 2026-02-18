#!/usr/bin/env node

/**
 * Script pour générer les commandes SQL pour créer l'utilisateur admin
 * Ce script fonctionne SANS better-sqlite3 compilé
 * 
 * Usage: node scripts/create-admin-sql.js
 * Puis exécutez les commandes SQL dans DB Browser for SQLite ou sqlite3 CLI
 */

const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

console.log('🔐 Génération des commandes SQL pour créer l\'utilisateur admin\n')

const adminPhone = '0612345678'
const adminPhoneAlt = 'admin_phone'
const adminPassword = 'Admin123!'
const passwordHash = bcrypt.hashSync(adminPassword, 10)

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')

console.log('═══════════════════════════════════════════════════')
console.log('📋 COMMANDES SQL À EXÉCUTER')
console.log('═══════════════════════════════════════════════════\n')

console.log('-- Créer ou mettre à jour l\'utilisateur admin (0612345678)')
console.log(`INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)`)
console.log(`VALUES ('${adminPhone}', '${passwordHash}', 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP);\n`)

console.log('-- Créer ou mettre à jour l\'utilisateur admin (admin_phone)')
console.log(`INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)`)
console.log(`VALUES ('${adminPhoneAlt}', '${passwordHash}', 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP);\n`)

console.log('-- Vérifier que les utilisateurs ont été créés')
console.log('SELECT id, phone, first_name, last_name, role FROM users WHERE role = \'admin\';\n')

console.log('═══════════════════════════════════════════════════')
console.log('📋 IDENTIFIANTS ADMIN')
console.log('═══════════════════════════════════════════════════')
console.log(`📱 Téléphone: ${adminPhone} ou ${adminPhoneAlt}`)
console.log(`🔑 Mot de passe: ${adminPassword}`)
console.log(`👤 Nom: Admin INOXYA`)
console.log(`🎭 Rôle: admin`)
console.log('═══════════════════════════════════════════════════\n')

console.log('📝 INSTRUCTIONS:')
console.log('1. Ouvrez la base de données avec DB Browser for SQLite:')
console.log(`   ${dbPath}`)
console.log('2. Allez dans l\'onglet "Execute SQL"')
console.log('3. Copiez-collez les commandes SQL ci-dessus')
console.log('4. Cliquez sur "Execute SQL"')
console.log('5. Vérifiez que les utilisateurs ont été créés\n')

console.log('OU utilisez sqlite3 CLI:')
console.log(`sqlite3 "${dbPath}"`)
console.log('Puis exécutez les commandes SQL ci-dessus\n')

// Créer un fichier SQL pour faciliter l'exécution
const sqlFile = path.join(process.cwd(), 'scripts', 'create-admin.sql')
const sqlContent = `-- Script SQL pour créer l'utilisateur admin
-- Généré automatiquement le ${new Date().toISOString()}

-- Créer ou mettre à jour l'utilisateur admin (0612345678)
INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
VALUES ('${adminPhone}', '${passwordHash}', 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP);

-- Créer ou mettre à jour l'utilisateur admin (admin_phone)
INSERT OR REPLACE INTO users (phone, password_hash, first_name, last_name, role, updated_at)
VALUES ('${adminPhoneAlt}', '${passwordHash}', 'Admin', 'INOXYA', 'admin', CURRENT_TIMESTAMP);

-- Vérifier que les utilisateurs ont été créés
SELECT id, phone, first_name, last_name, role FROM users WHERE role = 'admin';
`

fs.writeFileSync(sqlFile, sqlContent, 'utf8')
console.log(`✅ Fichier SQL créé: ${sqlFile}`)
console.log('   Vous pouvez l\'ouvrir avec DB Browser for SQLite et l\'exécuter\n')

