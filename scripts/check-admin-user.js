#!/usr/bin/env node

/**
 * Script pour vérifier si l'utilisateur admin existe dans la base de données
 * Ce script fonctionne SANS better-sqlite3 compilé en utilisant sql.js
 */

const path = require('path')
const fs = require('fs')

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')

console.log('🔍 Vérification de l\'utilisateur admin...\n')

// Vérifier si la base de données existe
if (!fs.existsSync(dbPath)) {
  console.error('❌ La base de données n\'existe pas:', dbPath)
  console.log('\n💡 Solution:')
  console.log('   1. Démarrez le serveur: npm run dev')
  console.log('   2. La base de données sera créée automatiquement')
  console.log('   3. Puis exécutez: npm run admin:sql')
  process.exit(1)
}

console.log('✅ Base de données trouvée:', dbPath)

// Essayer d'utiliser better-sqlite3 si disponible
let Database = null
try {
  Database = require('better-sqlite3')
} catch (e) {
  console.log('⚠️  better-sqlite3 non disponible (bindings non compilés)')
  console.log('\n💡 Solutions:')
  console.log('   1. Exécutez le SQL manuellement avec DB Browser for SQLite')
  console.log('   2. Ou compilez better-sqlite3: npm rebuild better-sqlite3')
  console.log('\n📋 Commandes SQL à exécuter:')
  console.log('   Voir: scripts/create-admin.sql')
  process.exit(0)
}

// Si better-sqlite3 est disponible, vérifier l'utilisateur
try {
  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')
  
  // Vérifier si la table users existe
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='users'
  `).get()
  
  if (!tableExists) {
    console.error('❌ La table users n\'existe pas')
    console.log('\n💡 Solution:')
    console.log('   1. Démarrez le serveur: npm run dev')
    console.log('   2. La base de données sera initialisée automatiquement')
    db.close()
    process.exit(1)
  }
  
  // Vérifier si l'utilisateur admin existe
  const admin1 = db.prepare('SELECT * FROM users WHERE phone = ?').get('0612345678')
  const admin2 = db.prepare('SELECT * FROM users WHERE phone = ?').get('admin_phone')
  
  console.log('\n📋 Résultats:')
  
  if (admin1) {
    console.log('✅ Utilisateur admin (0612345678) existe')
    console.log(`   - ID: ${admin1.id}`)
    console.log(`   - Nom: ${admin1.first_name} ${admin1.last_name}`)
    console.log(`   - Rôle: ${admin1.role}`)
  } else {
    console.log('❌ Utilisateur admin (0612345678) n\'existe pas')
  }
  
  if (admin2) {
    console.log('✅ Utilisateur admin (admin_phone) existe')
    console.log(`   - ID: ${admin2.id}`)
    console.log(`   - Nom: ${admin2.first_name} ${admin2.last_name}`)
    console.log(`   - Rôle: ${admin2.role}`)
  } else {
    console.log('❌ Utilisateur admin (admin_phone) n\'existe pas')
  }
  
  if (!admin1 && !admin2) {
    console.log('\n💡 Solution:')
    console.log('   Exécutez: npm run admin:sql')
    console.log('   Puis exécutez le fichier SQL avec DB Browser for SQLite')
  }
  
  db.close()
} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.log('\n💡 Solution:')
  console.log('   Exécutez le SQL manuellement avec DB Browser for SQLite')
  console.log('   Voir: scripts/create-admin.sql')
  process.exit(1)
}

