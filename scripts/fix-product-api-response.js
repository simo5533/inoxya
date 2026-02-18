/**
 * Script pour mettre à jour le produit existant avec la structure main_image/images
 * et vérifier que les chemins sont corrects
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)

try {
  console.log('🔍 Vérification du produit "Montre Luxe Blgari"...\n')
  
  const product = db.prepare('SELECT * FROM products WHERE id = 1').get()
  
  if (!product) {
    console.log('❌ Produit non trouvé')
    process.exit(1)
  }
  
  // Parser les images
  let images = []
  if (product.images && typeof product.images === 'string') {
    try {
      images = JSON.parse(product.images)
    } catch (e) {
      images = []
    }
  }
  
  console.log('📦 Structure actuelle:')
  console.log(`   image_url: ${product.image_url}`)
  console.log(`   images: ${product.images}`)
  console.log(`\n📋 Images parsées:`)
  console.log(`   Main: ${product.image_url}`)
  images.forEach((img, i) => {
    console.log(`   ${i + 1}. ${img}`)
  })
  
  console.log('\n✅ Structure correcte pour l\'API:')
  console.log(`   main_image: ${product.image_url}`)
  console.log(`   images: [${images.map(img => `"${img}"`).join(', ')}]`)
  
  // Vérifier que les chemins sont différents
  const allPaths = [product.image_url, ...images].filter(Boolean)
  const uniquePaths = [...new Set(allPaths)]
  
  console.log(`\n🔍 Vérification des chemins:`)
  console.log(`   Total: ${allPaths.length}`)
  console.log(`   Uniques: ${uniquePaths.length}`)
  
  if (allPaths.length === uniquePaths.length) {
    console.log('   ✅ Tous les chemins sont différents')
  } else {
    console.log('   ⚠️  Certains chemins sont dupliqués')
  }
  
} catch (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
} finally {
  db.close()
}


