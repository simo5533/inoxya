#!/usr/bin/env node

/**
 * Script pour vérifier les tables existantes dans la base de données SQLite
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(process.cwd(), 'data', 'inoxya-bijoux.db')
const db = new Database(dbPath)

try {
  console.log('🔍 Vérification des tables dans la base de données SQLite...')
  
  // Récupérer toutes les tables
  const tables = db.prepare(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all()
  
  console.log('\n📊 Tables existantes:')
  tables.forEach(table => {
    console.log(`  ✅ ${table.name}`)
  })
  
  // Vérifier la structure de chaque table
  console.log('\n🔍 Structure des tables:')
  
  tables.forEach(table => {
    console.log(`\n📋 Table: ${table.name}`)
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all()
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`)
    })
  })
  
  // Compter les enregistrements
  console.log('\n📈 Nombre d\'enregistrements par table:')
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get()
    console.log(`  ${table.name}: ${count.count} enregistrements`)
  })
  
} catch (error) {
  console.error('❌ Erreur:', error.message)
} finally {
  db.close()
}
