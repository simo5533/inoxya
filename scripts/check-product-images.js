/**
 * Script pour vérifier les chemins d'images de tous les produits
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

console.log('🔍 Vérification des chemins d\'images des produits...\n')
console.log('='.repeat(80))

// Récupérer tous les produits
const products = db.prepare('SELECT id, name, price, image_url, images FROM products ORDER BY id').all()

if (products.length === 0) {
  console.log('❌ Aucun produit trouvé dans la base de données')
  db.close()
  process.exit(0)
}

console.log(`📦 Total: ${products.length} produit(s)\n`)

let validCount = 0
let invalidCount = 0

products.forEach((product, index) => {
  console.log(`\n${index + 1}. Produit ID: ${product.id}`)
  console.log(`   Nom: ${product.name}`)
  console.log(`   Prix: ${product.price} MAD`)
  console.log(`   ──────────────────────────────────────────────────────────────`)
  
  // Vérifier l'image principale
  const mainImage = product.image_url
  if (mainImage) {
    const mainImageExists = fs.existsSync(mainImage)
    console.log(`   📸 Image principale:`)
    console.log(`      Chemin: ${mainImage}`)
    console.log(`      Existe: ${mainImageExists ? '✅ OUI' : '❌ NON'}`)
    if (mainImageExists) {
      const stats = fs.statSync(mainImage)
      console.log(`      Taille: ${(stats.size / 1024).toFixed(2)} KB`)
      validCount++
    } else {
      invalidCount++
    }
  } else {
    console.log(`   📸 Image principale: ❌ AUCUNE`)
    invalidCount++
  }
  
  // Vérifier les images secondaires
  let imagesArray = []
  if (product.images && typeof product.images === 'string') {
    try {
      imagesArray = JSON.parse(product.images)
    } catch (e) {
      imagesArray = []
    }
  } else if (Array.isArray(product.images)) {
    imagesArray = product.images
  }
  
  if (imagesArray.length > 0) {
    console.log(`   🖼️  Images secondaires (${imagesArray.length}):`)
    imagesArray.forEach((img, idx) => {
      const imgExists = fs.existsSync(img)
      console.log(`      ${idx + 1}. ${img}`)
      console.log(`         Existe: ${imgExists ? '✅ OUI' : '❌ NON'}`)
      if (imgExists) {
        const stats = fs.statSync(img)
        console.log(`         Taille: ${(stats.size / 1024).toFixed(2)} KB`)
        validCount++
      } else {
        invalidCount++
      }
    })
  } else {
    console.log(`   🖼️  Images secondaires: Aucune`)
  }
})

console.log('\n' + '='.repeat(80))
console.log(`\n📊 RÉSUMÉ:`)
console.log(`   ✅ Images valides: ${validCount}`)
console.log(`   ❌ Images manquantes: ${invalidCount}`)
console.log(`   📦 Produits: ${products.length}`)

// Suggestions
if (invalidCount > 0) {
  console.log(`\n💡 SUGGESTIONS:`)
  console.log(`   - Vérifiez que les fichiers existent aux emplacements indiqués`)
  console.log(`   - Vérifiez les permissions d'accès aux fichiers`)
  console.log(`   - Utilisez le script add-sample-products.js pour mettre à jour les chemins`)
}

db.close()
console.log('\n✅ Vérification terminée!')

