#!/usr/bin/env node
/**
 * Script pour exécuter les migrations SQL
 * Supporte PostgreSQL (via DATABASE_URL) et SQLite
 */

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

async function runMigration() {
  const migrationFile = process.argv[2] || 'scripts/migrations/001_add_performance_indexes.sql'
  
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Fichier de migration introuvable: ${migrationFile}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationFile, 'utf-8')
  const databaseUrl = process.env.DATABASE_URL

  // Si DATABASE_URL est défini, utiliser PostgreSQL
  if (databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
    console.log('📊 Connexion à PostgreSQL...')
    
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })

    try {
      // Exécuter chaque commande SQL séparément (séparées par ;)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          await pool.query(statement)
          console.log(`✅ Exécuté: ${statement.substring(0, 50)}...`)
        }
      }

      console.log('✅ Migration PostgreSQL terminée avec succès')
      await pool.end()
    } catch (error) {
      console.error('❌ Erreur lors de la migration PostgreSQL:', error.message)
      await pool.end()
      process.exit(1)
    }
  } else {
    // SQLite - utiliser better-sqlite3 ou sql.js
    console.log('📊 Connexion à SQLite...')
    
    try {
      const Database = require('better-sqlite3')
      const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
      
      if (!fs.existsSync(dbPath)) {
        console.error(`❌ Base de données SQLite introuvable: ${dbPath}`)
        console.log('💡 Créez d\'abord la base de données ou utilisez PostgreSQL avec DATABASE_URL')
        process.exit(1)
      }

      const db = new Database(dbPath)
      
      // SQLite supporte CREATE INDEX IF NOT EXISTS
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          db.exec(statement)
          console.log(`✅ Exécuté: ${statement.substring(0, 50)}...`)
        }
      }

      db.close()
      console.log('✅ Migration SQLite terminée avec succès')
    } catch (error) {
      console.error('❌ Erreur lors de la migration SQLite:', error.message)
      console.log('💡 Assurez-vous que better-sqlite3 est installé: npm install better-sqlite3')
      process.exit(1)
    }
  }
}

runMigration().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

