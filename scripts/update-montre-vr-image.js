/**
 * Script pour mettre à jour l'image de MONTRE VR avec la bonne photo
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Trouver toutes les images disponibles sur le Desktop
function findImagesOnDesktop() {
  const desktopPath = path.join(process.env.USERPROFILE || '', 'Desktop')
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP']
  const files = fs.readdirSync(desktopPath)
  
  return files
    .filter(file => {
      const ext = path.extname(file)
      return imageExtensions.includes(ext)
    })
    .map(file => path.join(desktopPath, file))
    .filter(filePath => fs.statSync(filePath).isFile())
}

const availableImages = findImagesOnDesktop()
console.log('📸 Images disponibles sur le Desktop:\n')
availableImages.forEach((img, idx) => {
  console.log(`${idx + 1}. ${path.basename(img)}`)
})
console.log('\n')

// Récupérer le produit MONTRE VR
const product = db.prepare('SELECT * FROM products WHERE name = ?').get('MONTRE VR')

if (!product) {
  console.log('❌ Produit MONTRE VR non trouvé')
  db.close()
  process.exit(1)
}

console.log(`📦 Produit trouvé: ${product.name} (ID: ${product.id})`)
console.log(`   Image actuelle: ${path.basename(product.image_url || 'Aucune')}\n`)

// L'utilisateur doit choisir la bonne image
// Pour l'instant, je vais utiliser une image différente de celle actuelle
// En cherchant une image qui pourrait être la montre Versace (généralement plus grande ou différente)

// Trouver une image différente de l'actuelle
let newMainImage = null
let newSecondaryImages = []

// Essayer de trouver une image qui n'est pas déjà utilisée comme image principale
const currentMainImage = product.image_url
const usedImages = [currentMainImage]

// Prendre une image qui n'est pas l'actuelle
for (const img of availableImages) {
  if (img !== currentMainImage && !usedImages.includes(img)) {
    newMainImage = img
    break
  }
}

if (!newMainImage && availableImages.length > 0) {
  // Si toutes les images sont utilisées, prendre la première disponible
  newMainImage = availableImages[0]
}

// Pour les images secondaires, prendre 2 autres images différentes
for (const img of availableImages) {
  if (img !== newMainImage && newSecondaryImages.length < 2) {
    newSecondaryImages.push(img)
  }
}

if (newMainImage) {
  const imagesJson = JSON.stringify(newSecondaryImages)
  
  db.prepare(`
    UPDATE products 
    SET image_url = ?, images = ?, updated_at = ?
    WHERE id = ?
  `).run(
    newMainImage,
    imagesJson,
    new Date().toISOString(),
    product.id
  )
  
  console.log('✅ Image mise à jour pour MONTRE VR:')
  console.log(`   Nouvelle image principale: ${path.basename(newMainImage)}`)
  console.log(`   Images secondaires:`)
  newSecondaryImages.forEach((img, idx) => {
    console.log(`     ${idx + 1}. ${path.basename(img)}`)
  })
} else {
  console.log('❌ Aucune image disponible pour la mise à jour')
}

db.close()
console.log('\n✅ Mise à jour terminée!')

