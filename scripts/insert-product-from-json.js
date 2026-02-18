/**
 * Script pour insérer un produit depuis un JSON avec copie automatique des images
 */

const { insertProduct } = require('./insert-product-safe')
const Database = require('better-sqlite3')
const path = require('path')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Produit à insérer
const productData = {
  "name": "MONTRE BULGARI SER PENTI GOLD",
  "name_ar": "ساعة بلجاري",
  "description": "Montre de luxe Bulgari Serpenti en or, symbole d'élégance intemporelle. Cette pièce exceptionnelle allie savoir-faire artisanal italien et design audacieux. Le bracelet serpent caractéristique de la collection Serpenti enveloppe délicatement le poignet, créant une silhouette sensuelle et sophistiquée. Le cadran doré reflète la lumière avec élégance, tandis que les détails finement ciselés témoignent de l'excellence de la maison Bulgari. Une montre qui transcende le temps et devient un véritable bijou à porter au quotidien.",
  "price": 199,
  "original_price": 250,
  "category": "MONTRE",
  "stock": 10,
  "main_image": "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 at 18.11.23.jpeg",
  "secondary_images": [
    "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 at 18.11.22.jpeg",
    "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 at 18.11.21.jpeg"
  ]
}

// Insérer le produit (les images seront copiées automatiquement)
const productId = insertProduct(productData)

// Récupérer le produit créé
const createdProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)

console.log(`\n📦 Détails du produit:`)
console.log(`   ID: ${createdProduct.id}`)
console.log(`   Nom: ${createdProduct.name}`)
console.log(`   Nom (AR): ${createdProduct.name_ar || 'N/A'}`)
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

