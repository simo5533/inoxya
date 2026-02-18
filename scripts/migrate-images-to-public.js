/**
 * Script pour migrer toutes les images vers public/images/products
 * et mettre à jour la base de données avec les chemins relatifs
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Chemins
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

// Créer le dossier public/images/products s'il n'existe pas
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true })
  console.log('✅ Dossier créé: public/images/products')
}

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Fonction pour générer un nom de fichier unique
function generateUniqueFilename(originalPath) {
  const ext = path.extname(originalPath).toLowerCase()
  const hash = crypto.createHash('md5').update(originalPath + Date.now()).digest('hex').substring(0, 8)
  const timestamp = Date.now()
  return `product-${timestamp}-${hash}${ext}`
}

// Fonction pour copier une image
function copyImage(sourcePath, targetDir) {
  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️  Image non trouvée: ${sourcePath}`)
    return null
  }

  const filename = generateUniqueFilename(sourcePath)
  const targetPath = path.join(targetDir, filename)

  try {
    fs.copyFileSync(sourcePath, targetPath)
    return `/images/products/${filename}`
  } catch (error) {
    console.error(`❌ Erreur lors de la copie de ${sourcePath}:`, error.message)
    return null
  }
}

console.log('🚀 Migration des images vers public/images/products...\n')

// Récupérer tous les produits
const products = db.prepare('SELECT * FROM products').all()

if (products.length === 0) {
  console.log('⚠️  Aucun produit trouvé dans la base de données')
  db.close()
  process.exit(0)
}

console.log(`📦 ${products.length} produit(s) à traiter\n`)

let updated = 0
let errors = 0

products.forEach((product, index) => {
  console.log(`\n${index + 1}. Produit ID: ${product.id} - ${product.name}`)
  
  // Traiter l'image principale
  let newMainImage = null
  if (product.image_url) {
    // Si c'est déjà un chemin relatif, le garder
    if (product.image_url.startsWith('/images/')) {
      newMainImage = product.image_url
      console.log(`   ✅ Image principale déjà migrée: ${newMainImage}`)
    } else {
      // C'est un chemin absolu, le copier
      const relativePath = copyImage(product.image_url, publicImagesDir)
      if (relativePath) {
        newMainImage = relativePath
        console.log(`   ✅ Image principale migrée: ${path.basename(product.image_url)} → ${relativePath}`)
      } else {
        newMainImage = '/placeholder.svg'
        console.log(`   ⚠️  Image principale non trouvée, utilisation du placeholder`)
        errors++
      }
    }
  } else {
    newMainImage = '/placeholder.svg'
    console.log(`   ⚠️  Aucune image principale, utilisation du placeholder`)
  }

  // Traiter les images secondaires
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

  const newSecondaryImages = []
  imagesArray.forEach((imgPath, idx) => {
    if (imgPath.startsWith('/images/')) {
      // Déjà migré
      newSecondaryImages.push(imgPath)
      console.log(`   ✅ Image secondaire ${idx + 1} déjà migrée: ${imgPath}`)
    } else {
      // Copier l'image
      const relativePath = copyImage(imgPath, publicImagesDir)
      if (relativePath) {
        newSecondaryImages.push(relativePath)
        console.log(`   ✅ Image secondaire ${idx + 1} migrée: ${path.basename(imgPath)} → ${relativePath}`)
      } else {
        console.log(`   ⚠️  Image secondaire ${idx + 1} non trouvée, ignorée`)
      }
    }
  })

  // Mettre à jour le produit dans la base de données
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

  updated++
  console.log(`   ✅ Produit mis à jour dans la base de données`)
})

console.log('\n' + '='.repeat(80))
console.log(`\n📊 RÉSUMÉ:`)
console.log(`   ✅ Produits mis à jour: ${updated}`)
console.log(`   ❌ Erreurs: ${errors}`)
console.log(`   📁 Images dans: public/images/products`)

// Compter les fichiers dans le dossier
const imageFiles = fs.readdirSync(publicImagesDir).filter(file => {
  const ext = path.extname(file).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)
})
console.log(`   📸 Fichiers images: ${imageFiles.length}`)

db.close()
console.log('\n✅ Migration terminée!')

