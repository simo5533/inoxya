/**
 * Script pour vérifier que le système d'images fonctionne correctement
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

console.log('🔍 Vérification du système d\'images...\n')
console.log('='.repeat(80))

// 1. Vérifier le dossier public/images/products
console.log('\n1️⃣ Vérification du dossier public/images/products:')
if (fs.existsSync(publicImagesDir)) {
  const files = fs.readdirSync(publicImagesDir).filter(file => {
    const ext = path.extname(file).toLowerCase()
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
  })
  console.log(`   ✅ Dossier existe`)
  console.log(`   📸 ${files.length} fichier(s) image trouvé(s)`)
} else {
  console.log(`   ❌ Dossier n'existe pas`)
}

// 2. Vérifier les produits dans la base de données
console.log('\n2️⃣ Vérification des produits dans la base de données:')
const products = db.prepare('SELECT id, name, image_url, images FROM products').all()
console.log(`   📦 ${products.length} produit(s) trouvé(s)\n`)

let validImages = 0
let invalidImages = 0
let absolutePaths = 0

products.forEach((product, index) => {
  console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`)
  
  // Vérifier l'image principale
  if (product.image_url) {
    if (product.image_url.includes(':\\') || product.image_url.startsWith('C:\\')) {
      console.log(`      ❌ Image principale: Chemin absolu Windows détecté`)
      console.log(`         ${product.image_url}`)
      absolutePaths++
      invalidImages++
    } else if (product.image_url.startsWith('/images/')) {
      const filePath = path.join(__dirname, '..', 'public', product.image_url)
      if (fs.existsSync(filePath)) {
        console.log(`      ✅ Image principale: ${product.image_url}`)
        validImages++
      } else {
        console.log(`      ❌ Image principale: Fichier non trouvé - ${product.image_url}`)
        invalidImages++
      }
    } else {
      console.log(`      ⚠️  Image principale: Format inattendu - ${product.image_url}`)
      invalidImages++
    }
  } else {
    console.log(`      ⚠️  Aucune image principale`)
    invalidImages++
  }
  
  // Vérifier les images secondaires
  let imagesArray = []
  if (product.images) {
    try {
      imagesArray = JSON.parse(product.images)
    } catch (e) {
      imagesArray = []
    }
  }
  
  if (imagesArray.length > 0) {
    console.log(`      🖼️  Images secondaires (${imagesArray.length}):`)
    imagesArray.forEach((img, idx) => {
      if (img.includes(':\\') || img.startsWith('C:\\')) {
        console.log(`         ${idx + 1}. ❌ Chemin absolu Windows: ${img}`)
        absolutePaths++
        invalidImages++
      } else if (img.startsWith('/images/')) {
        const filePath = path.join(__dirname, '..', 'public', img)
        if (fs.existsSync(filePath)) {
          console.log(`         ${idx + 1}. ✅ ${img}`)
          validImages++
        } else {
          console.log(`         ${idx + 1}. ❌ Fichier non trouvé: ${img}`)
          invalidImages++
        }
      } else {
        console.log(`         ${idx + 1}. ⚠️  Format inattendu: ${img}`)
        invalidImages++
      }
    })
  } else {
    console.log(`      🖼️  Aucune image secondaire`)
  }
  console.log('')
})

// 3. Résumé
console.log('='.repeat(80))
console.log('\n📊 RÉSUMÉ:')
console.log(`   ✅ Images valides: ${validImages}`)
console.log(`   ❌ Images invalides: ${invalidImages}`)
console.log(`   ⚠️  Chemins absolus Windows: ${absolutePaths}`)
console.log(`   📦 Produits: ${products.length}`)

if (absolutePaths > 0) {
  console.log('\n⚠️  ATTENTION: Des chemins absolus Windows ont été détectés!')
  console.log('   Exécutez: node scripts/migrate-images-to-public.js')
}

if (invalidImages === 0 && absolutePaths === 0) {
  console.log('\n✅ Le système d\'images est correctement configuré!')
} else {
  console.log('\n❌ Des problèmes ont été détectés. Veuillez les corriger.')
}

db.close()

