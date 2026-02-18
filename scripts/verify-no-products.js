/**
 * Script pour vérifier qu'il n'y a plus de produits dans la base de données
 */

const Database = require('better-sqlite3')
const path = require('path')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

console.log('🔍 Vérification de la base de données...\n')
console.log('='.repeat(80))

// Compter les produits
const count = db.prepare('SELECT COUNT(*) as count FROM products').get()
console.log(`📦 Nombre de produits dans la base de données: ${count.count}`)

if (count.count === 0) {
  console.log('✅ Aucun produit trouvé - La base de données est vide!')
} else {
  console.log(`⚠️  ${count.count} produit(s) trouvé(s):`)
  const products = db.prepare('SELECT id, name, price FROM products').all()
  products.forEach((product, index) => {
    console.log(`   ${index + 1}. ID: ${product.id} - ${product.name} (${product.price} MAD)`)
  })
}

// Vérifier aussi la structure de la table
console.log('\n📋 Structure de la table products:')
const tableInfo = db.prepare('PRAGMA table_info(products)').all()
console.log(`   Colonnes: ${tableInfo.length}`)
tableInfo.forEach(col => {
  console.log(`   - ${col.name} (${col.type})`)
})

db.close()
console.log('\n' + '='.repeat(80))
console.log('✅ Vérification terminée!')

