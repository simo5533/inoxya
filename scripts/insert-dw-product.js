/**
 * Script pour insérer le produit PETITE LUMINE DW GOLD avec copie automatique des images
 */

const { insertProduct } = require('./insert-product-safe')
const Database = require('better-sqlite3')

// Chemin vers la base de données
const dbPath = require('path').join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Produit à insérer
const productData = {
  "name": "PETITE LUMINE DW GOLD",
  "name_ar": "",
  "description": "Montre élégante PETITE LUMINE DW en or, alliant minimalisme et sophistication. Cette pièce raffinée de Daniel Wellington incarne l'essence du style scandinave avec son cadran épuré et son bracelet doré délicat. Parfaite pour toutes les occasions, cette montre devient un accessoire essentiel qui complète avec grâce votre tenue quotidienne ou de soirée. Un design intemporel qui transcende les tendances.",
  "price": 199,
  "original_price": 290,
  "category": "MONTRE",
  "stock": 10,
  "main_image": "C:\\Users\\hassa\\Downloads\\WhatsApp Image 2025-12-03 at 18.10.51.jpeg",
  "secondary_images": [
    "C:\\Users\\hassa\\Downloads\\WhatsApp Image 2025-12-03 at 18.10.51 (2).jpeg",
    "C:\\Users\\hassa\\Downloads\\WhatsApp Image 2025-12-03 at 18.10.51.jpeg"
  ]
}

// Insérer le produit (les images seront copiées automatiquement)
const productId = insertProduct(productData)

// Récupérer le produit créé
const createdProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)

console.log(`\n📦 Détails du produit:`)
console.log(`   ID: ${createdProduct.id}`)
console.log(`   Nom: ${createdProduct.name}`)
console.log(`   Prix: ${createdProduct.price} MAD`)
console.log(`   Prix original: ${createdProduct.original_price || 'N/A'} MAD`)
console.log(`   Catégorie: ${createdProduct.category}`)
console.log(`   Stock: ${createdProduct.stock}`)
console.log(`   Image principale: ${createdProduct.image_url}`)

let imagesArray = []
if (createdProduct.images) {
  try {
    imagesArray = JSON.parse(createdProduct.images)
  } catch (e) {
    imagesArray = []
  }
}
console.log(`   Images secondaires: ${imagesArray.length}`)

db.close()
console.log('\n✅ Terminé!')

