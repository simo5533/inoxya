/**
 * Script pour déplacer le produit Blgari de l'ID 1 vers l'ID 2
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)

try {
  console.log('🔄 Déplacement du produit Blgari de l\'ID 1 vers l\'ID 2...\n')
  
  // Vérifier le produit à l'ID 1
  const product1 = db.prepare('SELECT * FROM products WHERE id = 1').get()
  
  if (!product1) {
    console.log('❌ Aucun produit trouvé à l\'ID 1')
    process.exit(1)
  }
  
  console.log(`📦 Produit trouvé à l'ID 1: ${product1.name}`)
  
  // Vérifier s'il y a déjà un produit à l'ID 2
  const product2 = db.prepare('SELECT * FROM products WHERE id = 2').get()
  
  if (product2) {
    console.log(`⚠️  Un produit existe déjà à l'ID 2: ${product2.name}`)
    console.log('   Suppression du produit existant...')
    db.prepare('DELETE FROM products WHERE id = 2').run()
  }
  
  // Mettre à jour l'ID du produit
  console.log('\n💾 Mise à jour de l\'ID...')
  
  // SQLite ne permet pas de modifier directement l'ID, donc on doit:
  // 1. Insérer une nouvelle ligne avec l'ID 2
  // 2. Supprimer l'ancienne ligne
  
  db.prepare(`
    INSERT INTO products (
      id, name, name_ar, description, price, original_price, 
      category, stock, is_active, image_url, images, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    2,
    product1.name,
    product1.name_ar,
    product1.description,
    product1.price,
    product1.original_price,
    product1.category,
    product1.stock,
    product1.is_active,
    product1.image_url,
    product1.images,
    product1.created_at,
    new Date().toISOString()
  )
  
  // Supprimer l'ancien produit à l'ID 1
  console.log('🗑️  Suppression de l\'ancien produit à l\'ID 1...')
  db.prepare('DELETE FROM products WHERE id = 1').run()
  
  // Vérifier le résultat
  const newProduct = db.prepare('SELECT * FROM products WHERE id = 2').get()
  
  console.log('\n✅ Produit déplacé avec succès!')
  console.log(`   Nouvel ID: ${newProduct.id}`)
  console.log(`   Nom: ${newProduct.name}`)
  console.log(`   Prix: ${newProduct.price}`)
  console.log(`   Main image: ${newProduct.image_url}`)
  
  // Vérifier que l'ID 1 est maintenant vide
  const checkId1 = db.prepare('SELECT * FROM products WHERE id = 1').get()
  if (!checkId1) {
    console.log('   ✅ L\'ID 1 est maintenant libre')
  }
  
} catch (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
} finally {
  db.close()
}

















