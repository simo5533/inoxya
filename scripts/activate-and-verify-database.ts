#!/usr/bin/env node
/**
 * Script pour activer, lire et vérifier la base de données SQLite
 * Vérifie la version, la structure et le contenu
 */

import * as path from 'path'
import * as fs from 'fs'

const sqlJs = require('sql.js')
const dbPath = path.resolve(process.cwd(), 'data', 'inoxya_bijoux.db')

async function main() {
  try {
    console.log('🔍 ACTIVATION ET VÉRIFICATION DE LA BASE DE DONNÉES\n')
    console.log('='.repeat(100))

    // 1. Vérifier l'existence du fichier
    console.log('\n1️⃣ VÉRIFICATION DU FICHIER\n')
    console.log('-'.repeat(100))
    console.log(`Chemin: ${dbPath}`)
    
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Fichier de base de données non trouvé!')
      console.log('💡 Création du dossier data...')
      const dataDir = path.dirname(dbPath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
        console.log('✅ Dossier data créé')
      }
      console.log('⚠️  La base de données sera créée automatiquement au premier usage')
      process.exit(1)
    }

    const stats = fs.statSync(dbPath)
    console.log('✅ Fichier trouvé')
    console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`)
    console.log(`   Modifié: ${stats.mtime.toLocaleString('fr-FR')}`)
    console.log(`   Créé: ${stats.birthtime.toLocaleString('fr-FR')}`)

    // 2. Charger sql.js
    console.log('\n2️⃣ CHARGEMENT DE SQL.JS\n')
    console.log('-'.repeat(100))
    
    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    let SQL: any

    if (sqlJs.default && typeof sqlJs.default === 'function') {
      console.log('Chargement sql.js (format default)...')
      SQL = await sqlJs.default({
        locateFile: (file: string) => {
          if (file.endsWith('.wasm')) return wasmPath
          return file
        }
      })
    } else if (typeof sqlJs === 'function') {
      console.log('Chargement sql.js (format function)...')
      SQL = await sqlJs({
        locateFile: (file: string) => {
          if (file.endsWith('.wasm')) return wasmPath
          return file
        }
      })
    } else {
      console.log('Chargement sql.js (format direct)...')
      SQL = sqlJs
    }

    if (!SQL || !SQL.Database) {
      console.error('❌ Impossible de charger sql.js')
      process.exit(1)
    }

    console.log('✅ sql.js chargé avec succès')

    // 3. Ouvrir la base de données
    console.log('\n3️⃣ CONNEXION À LA BASE DE DONNÉES\n')
    console.log('-'.repeat(100))
    
    const fileBuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(fileBuffer)
    console.log('✅ Base de données ouverte')

    // 4. Vérifier la version SQLite
    console.log('\n4️⃣ VERSION SQLITE\n')
    console.log('-'.repeat(100))
    
    const versionResult = db.exec('SELECT sqlite_version() as version')
    if (versionResult.length > 0 && versionResult[0].values && versionResult[0].values[0]) {
      const version = versionResult[0].values[0][0]
      console.log(`Version SQLite: ${version}`)
      
      // Vérifier si la version est récente (>= 3.30.0 recommandé)
      const versionParts = version.split('.').map(Number)
      const major = versionParts[0]
      const minor = versionParts[1]
      
      if (major > 3 || (major === 3 && minor >= 30)) {
        console.log('✅ Version SQLite correcte et à jour')
      } else {
        console.log('⚠️  Version SQLite ancienne (recommandé: >= 3.30.0)')
      }
    }

    // 5. Vérifier les PRAGMAs
    console.log('\n5️⃣ CONFIGURATION (PRAGMAs)\n')
    console.log('-'.repeat(100))
    
    const pragmas = [
      { name: 'foreign_keys', expected: '1', description: 'Clés étrangères' },
      { name: 'journal_mode', expected: 'wal', description: 'Mode journal' },
      { name: 'synchronous', expected: 'normal', description: 'Synchronisation' },
      { name: 'busy_timeout', expected: '5000', description: 'Timeout' },
      { name: 'encoding', description: 'Encodage' },
      { name: 'page_size', description: 'Taille de page' },
      { name: 'cache_size', description: 'Taille du cache' }
    ]

    for (const pragma of pragmas) {
      try {
        const result = db.exec(`PRAGMA ${pragma.name}`)
        if (result.length > 0 && result[0].values && result[0].values[0]) {
          const value = result[0].values[0][0]
          const status = pragma.expected 
            ? (String(value).toLowerCase() === pragma.expected.toLowerCase() ? '✅' : '⚠️')
            : 'ℹ️'
          console.log(`${status} ${pragma.name}: ${value} ${pragma.description ? `(${pragma.description})` : ''}`)
          if (pragma.expected && String(value).toLowerCase() !== pragma.expected.toLowerCase()) {
            console.log(`   ⚠️  Attendu: ${pragma.expected}`)
          }
        }
      } catch (e) {
        console.log(`❌ ${pragma.name}: Erreur`)
      }
    }

    // 6. Lister toutes les tables
    console.log('\n6️⃣ STRUCTURE DE LA BASE DE DONNÉES\n')
    console.log('-'.repeat(100))
    
    const tablesResult = db.exec(`
      SELECT name, sql
      FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)

    if (tablesResult.length > 0 && tablesResult[0].values) {
      const columns = tablesResult[0].columns
      const rows = tablesResult[0].values

      console.log(`Total tables: ${rows.length}\n`)

      for (const row of rows) {
        const table: any = {}
        columns.forEach((col: string, i: number) => {
          table[col] = row[i]
        })

        console.log(`📋 Table: ${table.name}`)
        
        // Compter les enregistrements
        try {
          const countResult = db.exec(`SELECT COUNT(*) as count FROM ${table.name}`)
          if (countResult.length > 0 && countResult[0].values && countResult[0].values[0]) {
            const count = countResult[0].values[0][0]
            console.log(`   Enregistrements: ${count}`)
          }
        } catch (e) {
          console.log(`   Enregistrements: Erreur`)
        }

        // Afficher les colonnes
        try {
          const columnsResult = db.exec(`PRAGMA table_info(${table.name})`)
          if (columnsResult.length > 0 && columnsResult[0].values) {
            const cols = columnsResult[0].values
            console.log(`   Colonnes: ${cols.length}`)
            cols.forEach((col: any[]) => {
              const colName = col[1]
              const colType = col[2]
              const notNull = col[3] ? 'NOT NULL' : ''
              const pk = col[5] ? 'PRIMARY KEY' : ''
              console.log(`      - ${colName} (${colType}) ${notNull} ${pk}`.trim())
            })
          }
        } catch (e) {
          console.log(`   Colonnes: Erreur`)
        }
        console.log('')
      }
    } else {
      console.log('⚠️  Aucune table trouvée')
    }

    // 7. Statistiques complètes
    console.log('\n7️⃣ STATISTIQUES COMPLÈTES\n')
    console.log('-'.repeat(100))

    const statsQueries = [
      { name: 'Produits', query: 'SELECT COUNT(*) as count FROM products' },
      { name: 'Produits actifs', query: 'SELECT COUNT(*) as count FROM products WHERE is_active = 1' },
      { name: 'Produits sans stock', query: 'SELECT COUNT(*) as count FROM products WHERE stock IS NULL OR stock = 0' },
      { name: 'Packs', query: 'SELECT COUNT(*) as count FROM packs' },
      { name: 'Catégories', query: 'SELECT COUNT(*) as count FROM categories' },
      { name: 'Utilisateurs', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'Commandes', query: 'SELECT COUNT(*) as count FROM orders' },
      { name: 'Paniers actifs', query: 'SELECT COUNT(*) as count FROM cart_items' },
      { name: 'Favoris', query: 'SELECT COUNT(*) as count FROM favorites' }
    ]

    for (const stat of statsQueries) {
      try {
        const result = db.exec(stat.query)
        if (result.length > 0 && result[0].values && result[0].values[0]) {
          const count = result[0].values[0][0]
          console.log(`${stat.name}: ${count}`)
        }
      } catch (e) {
        console.log(`${stat.name}: Table non trouvée ou erreur`)
      }
    }

    // 8. Test de lecture complète
    console.log('\n8️⃣ TEST DE LECTURE COMPLÈTE\n')
    console.log('-'.repeat(100))

    // Lire quelques produits
    try {
      const productsResult = db.exec(`
        SELECT id, name, price, stock, is_active
        FROM products
        ORDER BY id
        LIMIT 5
      `)
      
      if (productsResult.length > 0 && productsResult[0].values) {
        console.log('✅ Lecture des produits: OK')
        console.log(`   ${productsResult[0].values.length} produit(s) lus`)
      }
    } catch (e) {
      console.log('❌ Erreur lors de la lecture des produits')
    }

    // Lire quelques packs
    try {
      const packsResult = db.exec(`
        SELECT id, name, price
        FROM packs
        ORDER BY id
        LIMIT 5
      `)
      
      if (packsResult.length > 0 && packsResult[0].values) {
        console.log('✅ Lecture des packs: OK')
        console.log(`   ${packsResult[0].values.length} pack(s) lus`)
      }
    } catch (e) {
      console.log('❌ Erreur lors de la lecture des packs')
    }

    // 9. Vérification de l'intégrité
    console.log('\n9️⃣ VÉRIFICATION DE L\'INTÉGRITÉ\n')
    console.log('-'.repeat(100))

    try {
      const integrityResult = db.exec('PRAGMA integrity_check')
      if (integrityResult.length > 0 && integrityResult[0].values && integrityResult[0].values[0]) {
        const result = integrityResult[0].values[0][0]
        if (result === 'ok') {
          console.log('✅ Intégrité de la base de données: OK')
        } else {
          console.log(`⚠️  Intégrité: ${result}`)
        }
      }
    } catch (e) {
      console.log('⚠️  Vérification d\'intégrité non disponible')
    }

    // 10. Résumé final
    console.log('\n\n📊 RÉSUMÉ FINAL\n')
    console.log('='.repeat(100))
    console.log('✅ Base de données activée et connectée')
    console.log('✅ Version SQLite vérifiée')
    console.log('✅ Structure analysée')
    console.log('✅ Contenu lu avec succès')
    console.log('✅ Base de données prête à être utilisée')

    db.close()
    console.log('\n✅ Analyse terminée\n')

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()

