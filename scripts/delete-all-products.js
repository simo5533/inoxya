/**
 * Script pour supprimer tous les produits de la base de données
 */

const Database = require('better-sqlite3')
const path = require('path')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

console.log('🗑️  Suppression de tous les produits...\n')

// Compter les produits avant suppression
const countBefore = db.prepare('SELECT COUNT(*) as count FROM products').get()
console.log(`📦 Produits avant suppression: ${countBefore.count}`)

// Supprimer tous les produits
const result = db.prepare('DELETE FROM products').run()

// Compter les produits après suppression
const countAfter = db.prepare('SELECT COUNT(*) as count FROM products').get()
console.log(`📦 Produits après suppression: ${countAfter.count}`)

console.log(`\n✅ ${result.changes} produit(s) supprimé(s) avec succès!`)

db.close()
console.log('\n✅ Terminé! La base de données est maintenant vide.')

