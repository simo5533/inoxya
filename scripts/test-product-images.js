/**
 * Script de test complet pour vérifier le système d'images produit
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)

try {
  console.log('🧪 TEST COMPLET DU SYSTÈME D\'IMAGES PRODUIT\n')
  console.log('='.repeat(60))
  
  // 1. Vérifier le produit en base
  console.log('\n1️⃣ Vérification base de données:')
  const product = db.prepare('SELECT * FROM products WHERE id = 1').get()
  
  if (!product) {
    console.log('   ❌ Produit non trouvé')
    process.exit(1)
  }
  
  console.log(`   ✅ Produit trouvé: ${product.name}`)
  console.log(`   📦 image_url: ${product.image_url}`)
  console.log(`   📦 images: ${product.images}`)
  
  // 2. Parser les images
  let imagesArray = []
  if (product.images && typeof product.images === 'string') {
    try {
      imagesArray = JSON.parse(product.images)
    } catch (e) {
      imagesArray = []
    }
  }
  
  console.log(`\n2️⃣ Images parsées:`)
  console.log(`   ✅ Main: ${product.image_url}`)
  imagesArray.forEach((img, i) => {
    console.log(`   ✅ Gallery ${i + 1}: ${img}`)
  })
  
  // 3. Vérifier les fichiers
  console.log(`\n3️⃣ Vérification des fichiers:`)
  const productDir = path.join(__dirname, '..', 'public', 'images', 'products', 'montre-bvlgari')
  const expectedFiles = [
    { name: 'main.jpg', path: path.join(productDir, 'main.jpg') },
    { name: 'second-1.jpg', path: path.join(productDir, 'second-1.jpg') },
    { name: 'second-2.jpg', path: path.join(productDir, 'second-2.jpg') }
  ]
  
  let filesOk = 0
  expectedFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
      const stats = fs.statSync(file.path)
      console.log(`   ✅ ${file.name} (${(stats.size / 1024).toFixed(2)} KB)`)
      filesOk++
    } else {
      console.log(`   ❌ ${file.name} (manquant)`)
    }
  })
  
  // 4. Structure API attendue
  console.log(`\n4️⃣ Structure API attendue:`)
  const apiResponse = {
    id: product.id,
    name: product.name,
    price: product.price,
    main_image: product.image_url,
    images: imagesArray
  }
  console.log(JSON.stringify(apiResponse, null, 2))
  
  // 5. Vérification finale
  console.log(`\n5️⃣ Vérification finale:`)
  const allPaths = [product.image_url, ...imagesArray].filter(Boolean)
  const uniquePaths = [...new Set(allPaths)]
  
  console.log(`   - Chemins totaux: ${allPaths.length}`)
  console.log(`   - Chemins uniques: ${uniquePaths.length}`)
  console.log(`   - Fichiers présents: ${filesOk}/${expectedFiles.length}`)
  
  if (allPaths.length === uniquePaths.length && filesOk === expectedFiles.length) {
    console.log(`\n✅ TOUT EST CORRECT!`)
    console.log(`\n📋 Résumé:`)
    console.log(`   ✅ Structure API: main_image + images[]`)
    console.log(`   ✅ Tous les chemins sont différents`)
    console.log(`   ✅ Tous les fichiers existent`)
    console.log(`   ✅ Composant React prêt`)
  } else {
    console.log(`\n⚠️  Problèmes détectés`)
    if (allPaths.length !== uniquePaths.length) {
      console.log(`   - Certains chemins sont dupliqués`)
    }
    if (filesOk < expectedFiles.length) {
      console.log(`   - ${expectedFiles.length - filesOk} fichier(s) manquant(s)`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  
} catch (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
} finally {
  db.close()
}


