/**
 * Script pour corriger les images du produit Bulgari
 */

const { insertProduct, copyImageToPublic } = require('./insert-product-safe')
const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Chercher les images Bulgari dans Downloads
const downloadsPath = path.join(process.env.USERPROFILE || '', 'Downloads')
const desktopPath = path.join(process.env.USERPROFILE || '', 'Desktop')

function findBulgariImages() {
  const images = []
  
  // Chercher dans Downloads
  if (fs.existsSync(downloadsPath)) {
    const files = fs.readdirSync(downloadsPath)
    files.forEach(file => {
      if (file.toLowerCase().includes('bulgari') || 
          file.toLowerCase().includes('serpenti') ||
          file.toLowerCase().includes('18.11')) {
        images.push(path.join(downloadsPath, file))
      }
    })
  }
  
  // Chercher dans Desktop
  if (fs.existsSync(desktopPath)) {
    const files = fs.readdirSync(desktopPath)
    files.forEach(file => {
      if (file.toLowerCase().includes('bulgari') || 
          file.toLowerCase().includes('serpenti') ||
          (file.includes('18.11') && (file.endsWith('.jpeg') || file.endsWith('.jpg')))) {
        images.push(path.join(desktopPath, file))
      }
    })
  }
  
  return images
}

console.log('🔍 Recherche des images Bulgari...\n')
const bulgariImages = findBulgariImages()

if (bulgariImages.length === 0) {
  console.log('⚠️  Aucune image Bulgari trouvée')
  console.log('   Cherchant dans Downloads et Desktop...')
  
  // Lister toutes les images disponibles
  const allImages = []
  if (fs.existsSync(downloadsPath)) {
    const files = fs.readdirSync(downloadsPath)
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase()
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        allImages.push({ path: path.join(downloadsPath, file), name: file })
      }
    })
  }
  
  console.log(`\n📸 Images disponibles dans Downloads (${allImages.length}):`)
  allImages.slice(0, 10).forEach((img, idx) => {
    console.log(`   ${idx + 1}. ${img.name}`)
  })
} else {
  console.log(`✅ ${bulgariImages.length} image(s) Bulgari trouvée(s):`)
  bulgariImages.forEach((img, idx) => {
    console.log(`   ${idx + 1}. ${path.basename(img)}`)
  })
  
  // Mettre à jour le produit Bulgari
  const product = db.prepare('SELECT * FROM products WHERE name LIKE ?').get('%BULGARI%')
  
  if (product && bulgariImages.length >= 1) {
    const mainImage = copyImageToPublic(bulgariImages[0])
    const secondaryImages = bulgariImages.slice(1, 3).map(img => copyImageToPublic(img))
    
    db.prepare(`
      UPDATE products 
      SET image_url = ?, images = ?, updated_at = ?
      WHERE id = ?
    `).run(
      mainImage,
      JSON.stringify(secondaryImages),
      new Date().toISOString(),
      product.id
    )
    
    console.log(`\n✅ Produit Bulgari mis à jour!`)
    console.log(`   Image principale: ${mainImage}`)
    console.log(`   Images secondaires: ${secondaryImages.length}`)
  }
}

db.close()

