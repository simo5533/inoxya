/**
 * Script pour supprimer tous les produits et packs de la base de données
 * Réinitialise les tables pour repartir à zéro
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')

// Vérifier que la base existe
if (!fs.existsSync(dbPath)) {
  console.log('❌ Base de données non trouvée:', dbPath)
  process.exit(1)
}

// Connexion à la base de données
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

try {
  console.log('🗑️  Suppression de tous les produits et packs...\n')
  
  // Compter avant suppression
  const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count
  const packsCount = db.prepare('SELECT COUNT(*) as count FROM packs').get().count
  
  console.log(`📊 Avant suppression:`)
  console.log(`   - Produits: ${productsCount}`)
  console.log(`   - Packs: ${packsCount}\n`)
  
  // Supprimer tous les produits
  console.log('🗑️  Suppression des produits...')
  const deleteProducts = db.prepare('DELETE FROM products')
  const productsResult = deleteProducts.run()
  console.log(`   ✅ ${productsResult.changes} produit(s) supprimé(s)`)
  
  // Supprimer tous les packs
  console.log('🗑️  Suppression des packs...')
  const deletePacks = db.prepare('DELETE FROM packs')
  const packsResult = deletePacks.run()
  console.log(`   ✅ ${packsResult.changes} pack(s) supprimé(s)`)
  
  // Réinitialiser les séquences auto-increment
  console.log('\n🔄 Réinitialisation des séquences...')
  
  // Vérifier si sqlite_sequence existe
  const sequenceCheck = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='sqlite_sequence'
  `).get()
  
  if (sequenceCheck) {
    // Réinitialiser la séquence pour products
    db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run('products')
    console.log('   ✅ Séquence products réinitialisée')
    
    // Réinitialiser la séquence pour packs
    db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run('packs')
    console.log('   ✅ Séquence packs réinitialisée')
  }
  
  // Vérifier après suppression
  const productsAfter = db.prepare('SELECT COUNT(*) as count FROM products').get().count
  const packsAfter = db.prepare('SELECT COUNT(*) as count FROM packs').get().count
  
  console.log(`\n📊 Après suppression:`)
  console.log(`   - Produits: ${productsAfter}`)
  console.log(`   - Packs: ${packsAfter}`)
  
  if (productsAfter === 0 && packsAfter === 0) {
    console.log('\n✅ Tous les produits et packs ont été supprimés avec succès!')
    console.log('✨ Vous pouvez maintenant créer de nouveaux produits et packs à zéro.')
  } else {
    console.log('\n⚠️  Certains enregistrements restent. Vérifiez la base de données.')
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la suppression:', error)
  process.exit(1)
} finally {
  db.close()
}

