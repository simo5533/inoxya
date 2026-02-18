/**
 * Script pour mettre à jour le produit avec les chemins absolus Windows
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)

try {
  console.log('🔄 Mise à jour du produit avec les chemins absolus...\n')
  
  // Nouveaux chemins
  const mainImage = "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.10.52_8230efab.jpg"
  const images = [
    "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.10.52_78f2ff3a.jpg",
    "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.10.52_7e6833fe.jpg"
  ]
  
  // Vérifier que les fichiers existent
  console.log('📁 Vérification des fichiers:')
  const allPaths = [mainImage, ...images]
  let allExist = true
  
  allPaths.forEach((filePath, index) => {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      console.log(`   ✅ ${index === 0 ? 'Main' : `Image ${index}`}: ${(stats.size / 1024).toFixed(2)} KB`)
    } else {
      console.log(`   ❌ ${index === 0 ? 'Main' : `Image ${index}`}: Fichier non trouvé`)
      allExist = false
    }
  })
  
  if (!allExist) {
    console.log('\n⚠️  Certains fichiers n\'existent pas. Mise à jour annulée.')
    process.exit(1)
  }
  
  // Mettre à jour le produit
  console.log('\n💾 Mise à jour de la base de données...')
  
  const imagesJson = JSON.stringify(images)
  
  db.prepare(`
    UPDATE products 
    SET name = ?, 
        price = ?,
        image_url = ?,
        images = ?,
        updated_at = ?
    WHERE id = 1
  `).run(
    "D&W",
    199,
    mainImage,
    imagesJson,
    new Date().toISOString()
  )
  
  // Vérifier la mise à jour
  const product = db.prepare('SELECT * FROM products WHERE id = 1').get()
  
  console.log('\n✅ Produit mis à jour:')
  console.log(`   ID: ${product.id}`)
  console.log(`   Nom: ${product.name}`)
  console.log(`   Prix: ${product.price}`)
  console.log(`   Main image: ${product.image_url}`)
  console.log(`   Images: ${product.images}`)
  
  // Parser les images pour vérification
  const parsedImages = JSON.parse(product.images)
  console.log(`\n📋 Images parsées:`)
  console.log(`   Main: ${product.image_url}`)
  parsedImages.forEach((img, i) => {
    console.log(`   ${i + 1}. ${img}`)
  })
  
  console.log('\n✅ Mise à jour terminée avec succès!')
  
} catch (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
} finally {
  db.close()
}

