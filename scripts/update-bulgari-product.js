/**
 * Script pour mettre à jour le produit Bulgari (ID: 5) avec les bonnes images
 */

const { copyImageToPublic } = require('./insert-product-safe')
const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Chemins des images pour le produit ID 5 (MONTRE BULGARI)
const productImages = {
  main_image: "C:\\Users\\hassa\\Downloads\\WhatsApp Image 2025-12-03 at 18.10.51.jpeg",
  secondary_images: [
    "C:\\Users\\hassa\\Downloads\\WhatsApp Image 2025-12-03 at 18.10.51 (2).jpeg",
    "C:\\Users\\hassa\\Downloads\\WhatsApp Image 2025-12-03 at 18.10.51 (1).jpeg"
  ]
}

console.log('🔄 Mise à jour du produit Bulgari (ID: 5)...\n')

// Récupérer le produit
const product = db.prepare('SELECT * FROM products WHERE id = ?').get(5)

if (!product) {
  console.log('❌ Produit ID 5 non trouvé')
  db.close()
  process.exit(1)
}

console.log(`📦 Produit trouvé: ${product.name}\n`)

// Copier l'image principale
console.log('📸 Copie de l\'image principale...')
const mainImage = copyImageToPublic(productImages.main_image)
console.log(`   ✅ ${mainImage}\n`)

// Copier les images secondaires
console.log('📸 Copie des images secondaires...')
const secondaryImages = productImages.secondary_images.map((img, idx) => {
  const copied = copyImageToPublic(img)
  console.log(`   ${idx + 1}. ✅ ${copied}`)
  return copied
}).filter(img => img !== '/placeholder.svg')

console.log('')

// Mettre à jour le produit dans la base de données
const imagesJson = JSON.stringify(secondaryImages)

db.prepare(`
  UPDATE products 
  SET image_url = ?, images = ?, updated_at = ?
  WHERE id = ?
`).run(
  mainImage,
  imagesJson,
  new Date().toISOString(),
  5
)

console.log('✅ Produit mis à jour avec succès!\n')

// Afficher le résultat
const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(5)
let imagesArray = []
if (updatedProduct.images) {
  try {
    imagesArray = JSON.parse(updatedProduct.images)
  } catch (e) {
    imagesArray = []
  }
}

console.log('📦 Détails du produit mis à jour:')
console.log(`   ID: ${updatedProduct.id}`)
console.log(`   Nom: ${updatedProduct.name}`)
console.log(`   Image principale: ${updatedProduct.image_url}`)
console.log(`   Images secondaires: ${imagesArray.length}`)
imagesArray.forEach((img, idx) => {
  console.log(`     ${idx + 1}. ${img}`)
})

db.close()
console.log('\n✅ Terminé!')

