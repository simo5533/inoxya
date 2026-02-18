/**
 * Script pour insérer un produit en copiant automatiquement les images vers public/images/products
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Chemins
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true })
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

// Fonction pour copier une image et retourner le chemin relatif
function copyImageToPublic(sourcePath) {
  if (!sourcePath) return '/placeholder.svg'
  
  // Si c'est déjà un chemin relatif, le retourner tel quel
  if (sourcePath.startsWith('/images/')) {
    return sourcePath
  }
  
  // Si c'est un chemin absolu, le copier
  if (fs.existsSync(sourcePath)) {
    const filename = generateUniqueFilename(sourcePath)
    const targetPath = path.join(publicImagesDir, filename)
    
    try {
      fs.copyFileSync(sourcePath, targetPath)
      return `/images/products/${filename}`
    } catch (error) {
      console.error(`❌ Erreur lors de la copie: ${error.message}`)
      return '/placeholder.svg'
    }
  } else {
    console.warn(`⚠️  Image non trouvée: ${sourcePath}`)
    return '/placeholder.svg'
  }
}

// Fonction pour insérer un produit
function insertProduct(productData) {
  console.log(`🚀 Insertion du produit: ${productData.name}\n`)
  
  // Copier l'image principale
  const mainImage = copyImageToPublic(productData.main_image)
  console.log(`   📸 Image principale: ${mainImage}`)
  
  // Copier les images secondaires
  const secondaryImages = (productData.secondary_images || []).map((img, idx) => {
    const copied = copyImageToPublic(img)
    console.log(`   📸 Image secondaire ${idx + 1}: ${copied}`)
    return copied
  }).filter(img => img !== '/placeholder.svg') // Filtrer les placeholders
  
  const imagesJson = JSON.stringify(secondaryImages)
  
  // Insérer le produit
  const result = db.prepare(`
    INSERT INTO products (name, name_ar, description, price, original_price, category, stock, is_active, image_url, images, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    productData.name,
    productData.name_ar || null,
    productData.description || null,
    productData.price,
    productData.original_price || null,
    productData.category,
    productData.stock || 0,
    1,
    mainImage,
    imagesJson,
    new Date().toISOString(),
    new Date().toISOString()
  )
  
  console.log(`\n✅ Produit inséré avec succès (ID: ${result.lastInsertRowid})`)
  return result.lastInsertRowid
}

// Exporter pour utilisation dans d'autres scripts
module.exports = { insertProduct, copyImageToPublic }

// Si appelé directement, utiliser les données d'exemple
if (require.main === module) {
  const productData = {
    name: "Exemple Produit",
    price: 199,
    category: "MONTRE",
    stock: 10,
    main_image: "",
    secondary_images: []
  }
  
  insertProduct(productData)
  db.close()
}

