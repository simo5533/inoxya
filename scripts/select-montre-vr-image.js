/**
 * Script pour sélectionner manuellement la bonne image pour MONTRE VR
 * Usage: node scripts/select-montre-vr-image.js <numéro_image>
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
  const stats = fs.statSync(img)
  console.log(`${idx + 1}. ${path.basename(img)} (${(stats.size / 1024).toFixed(2)} KB)`)
})
console.log('\n')

// Récupérer le produit MONTRE VR
const product = db.prepare('SELECT * FROM products WHERE name = ?').get('MONTRE VR')

if (!product) {
  console.log('❌ Produit MONTRE VR non trouvé')
  db.close()
  process.exit(1)
}

console.log(`📦 Produit: ${product.name} (ID: ${product.id})`)
console.log(`   Image actuelle: ${path.basename(product.image_url || 'Aucune')}\n`)

// Si un numéro est fourni en argument, utiliser cette image
const args = process.argv.slice(2)
let selectedImageIndex = null

if (args.length > 0) {
  selectedImageIndex = parseInt(args[0]) - 1
  if (selectedImageIndex < 0 || selectedImageIndex >= availableImages.length) {
    console.log(`❌ Numéro invalide. Choisissez un nombre entre 1 et ${availableImages.length}`)
    db.close()
    process.exit(1)
  }
} else {
  // Sinon, demander à l'utilisateur
  console.log('💡 Pour choisir une image, utilisez:')
  console.log(`   node scripts/select-montre-vr-image.js <numéro>`)
  console.log(`   Exemple: node scripts/select-montre-vr-image.js 1\n`)
  
  // Par défaut, utiliser l'image qui n'est pas déjà utilisée par les autres produits
  // Chercher une image qui correspond à une montre Versace (généralement plus grande)
  // On va prendre une image différente de celle actuelle
  const currentMainImage = product.image_url
  const otherProducts = db.prepare('SELECT image_url FROM products WHERE name != ?').all('MONTRE VR')
  const usedImages = [currentMainImage, ...otherProducts.map(p => p.image_url)]
  
  // Trouver une image non utilisée
  for (let i = 0; i < availableImages.length; i++) {
    if (!usedImages.includes(availableImages[i])) {
      selectedImageIndex = i
      break
    }
  }
  
  // Si toutes sont utilisées, prendre la première
  if (selectedImageIndex === null) {
    selectedImageIndex = 0
  }
  
  console.log(`⚠️  Aucun numéro fourni. Utilisation de l'image ${selectedImageIndex + 1} par défaut.\n`)
}

const newMainImage = availableImages[selectedImageIndex]

// Pour les images secondaires, prendre 2 autres images différentes
const secondaryImages = []
for (const img of availableImages) {
  if (img !== newMainImage && secondaryImages.length < 2) {
    secondaryImages.push(img)
  }
}

// Mettre à jour le produit
const imagesJson = JSON.stringify(secondaryImages)

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
secondaryImages.forEach((img, idx) => {
  console.log(`     ${idx + 1}. ${path.basename(img)}`)
})

db.close()
console.log('\n✅ Mise à jour terminée!')
console.log('\n💡 Si ce n\'est pas la bonne image, indiquez le numéro de l\'image correcte:')
console.log(`   node scripts/select-montre-vr-image.js <numéro>`)

