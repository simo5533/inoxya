/**
 * Script pour tester que les images peuvent être chargées correctement
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

console.log('🧪 Test du système de chargement d\'images...\n')
console.log('='.repeat(80))

// 1. Vérifier que le dossier existe
console.log('\n1️⃣ Vérification du dossier public/images/products:')
if (fs.existsSync(publicImagesDir)) {
  console.log('   ✅ Dossier existe')
} else {
  console.log('   ❌ Dossier n\'existe pas')
  process.exit(1)
}

// 2. Lister les fichiers images
const imageFiles = fs.readdirSync(publicImagesDir).filter(file => {
  const ext = path.extname(file).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
})

console.log(`   📸 ${imageFiles.length} fichier(s) image trouvé(s)\n`)

if (imageFiles.length > 0) {
  console.log('   Fichiers:')
  imageFiles.forEach((file, idx) => {
    const filePath = path.join(publicImagesDir, file)
    const stats = fs.statSync(filePath)
    console.log(`   ${idx + 1}. ${file} (${(stats.size / 1024).toFixed(2)} KB)`)
  })
}

// 3. Vérifier les produits
console.log('\n2️⃣ Vérification des produits:')
const products = db.prepare('SELECT id, name, image_url, images FROM products').all()
console.log(`   📦 ${products.length} produit(s)\n`)

let allValid = true

products.forEach((product, index) => {
  console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`)
  
  // Vérifier l'image principale
  if (product.image_url) {
    if (product.image_url.startsWith('/images/products/')) {
      const filename = product.image_url.replace('/images/products/', '')
      const filePath = path.join(publicImagesDir, filename)
      
      if (fs.existsSync(filePath)) {
        console.log(`      ✅ Image principale: ${product.image_url}`)
        console.log(`         → Fichier existe: ${filename}`)
      } else {
        console.log(`      ❌ Image principale: ${product.image_url}`)
        console.log(`         → Fichier manquant: ${filename}`)
        allValid = false
      }
    } else if (product.image_url === '/placeholder.svg') {
      console.log(`      ⚠️  Image principale: Placeholder (pas d'image réelle)`)
    } else {
      console.log(`      ❌ Image principale: Format invalide - ${product.image_url}`)
      allValid = false
    }
  } else {
    console.log(`      ⚠️  Aucune image principale`)
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
      if (img.startsWith('/images/products/')) {
        const filename = img.replace('/images/products/', '')
        const filePath = path.join(publicImagesDir, filename)
        
        if (fs.existsSync(filePath)) {
          console.log(`         ${idx + 1}. ✅ ${img}`)
        } else {
          console.log(`         ${idx + 1}. ❌ ${img} (fichier manquant)`)
          allValid = false
        }
      } else {
        console.log(`         ${idx + 1}. ⚠️  ${img} (format inattendu)`)
      }
    })
  }
  console.log('')
})

// 4. Test des URLs
console.log('3️⃣ Test des URLs:')
console.log('   Les images devraient être accessibles via:')
console.log('   http://localhost:3000/images/products/filename.jpg')
console.log('   (Next.js sert automatiquement les fichiers depuis /public)\n')

// 5. Résumé
console.log('='.repeat(80))
if (allValid) {
  console.log('\n✅ Tous les tests sont passés! Le système d\'images est opérationnel.')
} else {
  console.log('\n⚠️  Certains problèmes ont été détectés. Vérifiez les messages ci-dessus.')
}

db.close()

