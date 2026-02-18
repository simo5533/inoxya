/**
 * Script pour vérifier que la base de données est vide
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')

if (!fs.existsSync(dbPath)) {
  console.log('❌ Base de données non trouvée')
  process.exit(1)
}

const db = new Database(dbPath)

try {
  const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count
  const packsCount = db.prepare('SELECT COUNT(*) as count FROM packs').get().count
  const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count
  
  console.log('📊 État de la base de données:\n')
  console.log(`   Produits: ${productsCount}`)
  console.log(`   Packs: ${packsCount}`)
  console.log(`   Catégories: ${categoriesCount}\n`)
  
  if (productsCount === 0 && packsCount === 0) {
    console.log('✅ Base de données prête pour créer de nouveaux produits et packs!')
  } else {
    console.log('⚠️  Il reste des produits ou packs dans la base de données.')
  }
} catch (error) {
  console.error('❌ Erreur:', error)
} finally {
  db.close()
}

