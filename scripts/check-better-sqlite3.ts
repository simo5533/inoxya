#!/usr/bin/env node
/**
 * Script de diagnostic pour vérifier l'état de better-sqlite3
 * Vérifie l'installation, les bindings, et la connexion
 */

import * as path from 'path'
import * as fs from 'fs'

console.log('🔍 Diagnostic better-sqlite3\n')
console.log('='.repeat(60))

// 1. Vérifier si le package est installé
console.log('\n1️⃣ Vérification de l\'installation...')
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
  )
  
  const hasBetterSqlite3 = packageJson.dependencies?.['better-sqlite3'] || 
                          packageJson.devDependencies?.['better-sqlite3']
  
  if (hasBetterSqlite3) {
    console.log(`✅ better-sqlite3 trouvé dans package.json: ${hasBetterSqlite3}`)
  } else {
    console.log('❌ better-sqlite3 non trouvé dans package.json')
    process.exit(1)
  }
  
  const hasTypes = packageJson.devDependencies?.['@types/better-sqlite3']
  if (hasTypes) {
    console.log(`✅ @types/better-sqlite3 trouvé: ${hasTypes}`)
  } else {
    console.log('⚠️  @types/better-sqlite3 non trouvé (optionnel)')
  }
} catch (error) {
  console.error('❌ Erreur lors de la lecture de package.json:', error)
  process.exit(1)
}

// 2. Vérifier si le module peut être chargé
console.log('\n2️⃣ Vérification du chargement du module...')
let Database: any = null
let betterSqlite3Available = false

try {
  Database = require('better-sqlite3')
  console.log('✅ Module better-sqlite3 chargé avec succès')
  
  // Vérifier si Database est disponible
  if (Database && typeof Database === 'function') {
    console.log('✅ Database constructor disponible')
    betterSqlite3Available = true
  } else {
    console.log('❌ Database constructor non disponible')
  }
} catch (error: any) {
  console.log('❌ Erreur lors du chargement du module:')
  console.error('   Message:', error.message)
  if (error.code) {
    console.error('   Code:', error.code)
  }
  if (error.message.includes('bindings')) {
    console.error('\n⚠️  PROBLÈME: Les bindings natifs ne sont pas compilés!')
    console.error('   Solution: Exécutez "npm rebuild better-sqlite3"')
  }
  process.exit(1)
}

// 3. Tester la création d'une base de données en mémoire
console.log('\n3️⃣ Test de création d\'une base de données (mémoire)...')
try {
  const testDb = new Database(':memory:')
  console.log('✅ Base de données en mémoire créée')
  
  // Tester une requête simple
  testDb.prepare('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)').run()
  console.log('✅ Table de test créée')
  
  const insert = testDb.prepare('INSERT INTO test (name) VALUES (?)')
  insert.run('test')
  console.log('✅ Insertion de test réussie')
  
  const result = testDb.prepare('SELECT * FROM test').all()
  console.log('✅ Requête SELECT réussie:', result)
  
  testDb.close()
  console.log('✅ Base de données fermée correctement')
} catch (error: any) {
  console.error('❌ Erreur lors du test de base de données:')
  console.error('   Message:', error.message)
  if (error.code) {
    console.error('   Code:', error.code)
  }
  process.exit(1)
}

// 4. Vérifier la base de données du projet
console.log('\n4️⃣ Vérification de la base de données du projet...')
const dbPath = process.env['SQLITE_DB_PATH'] 
  ? (path.isAbsolute(process.env['SQLITE_DB_PATH']) 
      ? process.env['SQLITE_DB_PATH'] 
      : path.resolve(process.cwd(), process.env['SQLITE_DB_PATH']))
  : path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')

console.log(`   Chemin: ${dbPath}`)
console.log(`   Existe: ${fs.existsSync(dbPath) ? '✅ Oui' : '❌ Non'}`)

if (fs.existsSync(dbPath)) {
  try {
    const stats = fs.statSync(dbPath)
    console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`)
    console.log(`   Modifié: ${stats.mtime.toLocaleString('fr-FR')}`)
    
    // Tester la connexion à la vraie base
    const db = new Database(dbPath)
    console.log('✅ Connexion à la base de données réussie')
    
    // Tester une requête
    try {
      const tables = db.prepare(`
        SELECT name 
        FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all() as { name: string }[]
      
      console.log(`✅ Tables trouvées: ${tables.length}`)
      if (tables.length > 0) {
        console.log('   Tables:', tables.map(t => t.name).join(', '))
      }
      
      // Compter les produits
      try {
        const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
        console.log(`✅ Produits: ${productCount.count}`)
      } catch (e) {
        console.log('⚠️  Table products non trouvée ou erreur')
      }
      
      // Compter les packs
      try {
        const packCount = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
        console.log(`✅ Packs: ${packCount.count}`)
      } catch (e) {
        console.log('⚠️  Table packs non trouvée ou erreur')
      }
      
    } catch (queryError: any) {
      console.log('⚠️  Erreur lors de la requête:', queryError.message)
    }
    
    db.close()
    console.log('✅ Base de données fermée correctement')
  } catch (error: any) {
    console.error('❌ Erreur lors de la connexion à la base de données:')
    console.error('   Message:', error.message)
    if (error.code) {
      console.error('   Code:', error.code)
    }
  }
} else {
  console.log('⚠️  La base de données n\'existe pas encore')
  console.log('   Elle sera créée automatiquement au premier usage')
}

// 5. Vérifier les PRAGMAs
console.log('\n5️⃣ Test des PRAGMAs SQLite...')
try {
  const db = new Database(':memory:')
  
  const pragmas = [
    'foreign_keys',
    'journal_mode',
    'synchronous',
    'busy_timeout'
  ]
  
  for (const pragma of pragmas) {
    try {
      const result = db.prepare(`PRAGMA ${pragma}`).get()
      console.log(`✅ PRAGMA ${pragma}:`, result)
    } catch (e) {
      console.log(`⚠️  PRAGMA ${pragma}: erreur`)
    }
  }
  
  db.close()
} catch (error: any) {
  console.error('❌ Erreur lors du test des PRAGMAs:', error.message)
}

// Résumé
console.log('\n' + '='.repeat(60))
console.log('📊 RÉSUMÉ')
console.log('='.repeat(60))

if (betterSqlite3Available) {
  console.log('✅ better-sqlite3 est FONCTIONNEL')
  console.log('✅ Les bindings natifs sont compilés')
  console.log('✅ Prêt à être utilisé dans l\'application')
} else {
  console.log('❌ better-sqlite3 n\'est PAS fonctionnel')
  console.log('⚠️  L\'application utilisera sql.js en fallback')
}

console.log('\n💡 Pour forcer la réinstallation:')
console.log('   npm rebuild better-sqlite3')
console.log('   ou')
console.log('   npm uninstall better-sqlite3 && npm install better-sqlite3')

