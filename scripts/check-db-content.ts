/**
 * Script pour vérifier le contenu de la base de données SQLite
 * Utilise sql.js (pas de compilation native requise)
 */

import fs from 'fs'
import path from 'path'

// Fonction pour charger sql.js
async function loadSqlJs() {
  try {
    const initSqlJs = require('sql.js')
    if (typeof initSqlJs === 'function') {
      return await initSqlJs()
    } else if (initSqlJs.Database) {
      return initSqlJs
    } else if (initSqlJs.default && typeof initSqlJs.default === 'function') {
      return await initSqlJs.default()
    }
    throw new Error('Format sql.js non reconnu')
  } catch (e) {
    console.error('❌ Erreur lors du chargement de sql.js:', e)
    throw e
  }
}

async function main() {
  console.log('\n🔍 VÉRIFICATION DU CONTENU DE LA BASE DE DONNÉES\n')

  // Chemin DB
  const envDbPath = process.env['SQLITE_DB_PATH']
  const dbPath = envDbPath
    ? path.isAbsolute(envDbPath)
      ? envDbPath
      : path.resolve(process.cwd(), envDbPath)
    : path.join(process.cwd(), 'data', 'inoxya_bijoux.db')

  console.log(`📁 Chemin DB: ${dbPath}`)
  console.log(`📁 Chemin absolu: ${path.resolve(dbPath)}`)

  // Vérifier existence
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Le fichier DB n'existe pas: ${dbPath}`)
    process.exit(1)
  }

  const stats = fs.statSync(dbPath)
  console.log(`✅ Fichier existe: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`)

  try {
    // Charger sql.js
    console.log('\n📦 Chargement de sql.js...')
    const SQL = await loadSqlJs()
    console.log('✅ sql.js chargé')

    // Lire le fichier DB
    console.log('\n📖 Lecture du fichier DB...')
    const buffer = fs.readFileSync(dbPath)
    console.log(`✅ Fichier lu: ${buffer.length} bytes`)

    // Ouvrir la DB
    console.log('\n🔓 Ouverture de la base de données...')
    const db = new SQL.Database(buffer)
    console.log('✅ Base de données ouverte')

    // Lister les tables
    console.log('\n📋 Tables dans la DB:')
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    if (tables.length === 0) {
      console.log('   ⚠️  Aucune table trouvée')
    } else {
      tables[0].values.forEach((row: any) => {
        console.log(`   - ${row[0]}`)
      })
    }

    // Compter les produits
    console.log('\n📦 PRODUITS:')
    try {
      const productsResult = db.exec('SELECT COUNT(*) as count FROM products')
      if (productsResult.length > 0 && productsResult[0].values.length > 0) {
        const count = productsResult[0].values[0][0]
        console.log(`   Total: ${count} produit(s)`)

        if (Number(count) > 0) {
          // Afficher quelques produits
          const sampleResult = db.exec(`
            SELECT id, name, price, category, is_active, image_url 
            FROM products 
            LIMIT 5
          `)
          if (sampleResult.length > 0) {
            console.log('\n   Exemples:')
            const columns = sampleResult[0].columns
            sampleResult[0].values.forEach((row: any) => {
              const product: any = {}
              columns.forEach((col: string, i: number) => {
                product[col] = row[i]
              })
              console.log(`   - ID ${product.id}: ${product.name} (${product.price}€, cat: ${product.category}, active: ${product.is_active})`)
            })
          }
        }
      }
    } catch (e: any) {
      console.log(`   ❌ Erreur: ${e.message}`)
    }

    // Compter les packs
    console.log('\n📦 PACKS:')
    try {
      const packsResult = db.exec('SELECT COUNT(*) as count FROM packs')
      if (packsResult.length > 0 && packsResult[0].values.length > 0) {
        const count = packsResult[0].values[0][0]
        console.log(`   Total: ${count} pack(s)`)
      }
    } catch (e: any) {
      console.log(`   ❌ Erreur: ${e.message}`)
    }

    // Compter les catégories
    console.log('\n🏷️  CATÉGORIES:')
    try {
      const categoriesResult = db.exec(`
        SELECT DISTINCT category, COUNT(*) as count 
        FROM products 
        GROUP BY category
      `)
      if (categoriesResult.length > 0 && categoriesResult[0].values.length > 0) {
        console.log('   Catégories avec produits:')
        categoriesResult[0].values.forEach((row: any) => {
          console.log(`   - ${row[0]}: ${row[1]} produit(s)`)
        })
      }
    } catch (e: any) {
      console.log(`   ❌ Erreur: ${e.message}`)
    }

    // Vérifier is_active
    console.log('\n✅ PRODUITS ACTIFS:')
    try {
      const activeResult = db.exec(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE (is_active = 1 OR is_active IS NULL)
      `)
      if (activeResult.length > 0 && activeResult[0].values.length > 0) {
        const count = activeResult[0].values[0][0]
        console.log(`   Produits actifs: ${count}`)
      }
    } catch (e: any) {
      console.log(`   ❌ Erreur: ${e.message}`)
    }

    db.close()
    console.log('\n✅ Vérification terminée\n')

  } catch (e: any) {
    console.error(`\n❌ Erreur: ${e.message}`)
    console.error(e.stack)
    process.exit(1)
  }
}

main().catch(console.error)

