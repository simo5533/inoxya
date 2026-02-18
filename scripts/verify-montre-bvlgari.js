/**
 * Script pour vérifier le produit "Montre Luxe Blgari"
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)

try {
  console.log('🔍 Vérification du produit "Montre Luxe Blgari"...\n')
  
  // Récupérer le produit
  const product = db.prepare('SELECT * FROM products WHERE name = ?').get('Montre Luxe Blgari')
  
  if (!product) {
    console.log('❌ Produit non trouvé')
    process.exit(1)
  }
  
  // Parser les images
  let images = []
  if (product.images) {
    try {
      images = JSON.parse(product.images)
    } catch (e) {
      images = []
    }
  }
  
  console.log('✅ Produit trouvé!\n')
  console.log('📦 Informations:')
  console.log(`   ID: ${product.id}`)
  console.log(`   Nom: ${product.name}`)
  console.log(`   Description: ${product.description}`)
  console.log(`   Prix: ${product.price} DHS`)
  console.log(`   Catégorie: ${product.category}`)
  console.log(`   Stock: ${product.stock}`)
  console.log(`   Actif: ${product.is_active ? 'Oui' : 'Non'}`)
  console.log(`\n🖼️  Images:`)
  console.log(`   Main: ${product.image_url || 'Non définie'}`)
  console.log(`   Gallery: ${images.length} image(s)`)
  images.forEach((img, i) => {
    console.log(`      ${i + 1}. ${img}`)
  })
  
  // Vérifier les fichiers
  console.log(`\n📁 Vérification des fichiers:`)
  const productDir = path.join(__dirname, '..', 'public', 'images', 'products', 'montre-bvlgari')
  
  const expectedFiles = [
    'main.jpg',
    'second-1.jpg',
    'second-2.jpg'
  ]
  
  let filesExist = 0
  expectedFiles.forEach(file => {
    const filePath = path.join(productDir, file)
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`)
      filesExist++
    } else {
      console.log(`   ❌ ${file} (manquant)`)
    }
  })
  
  console.log(`\n📊 Résumé:`)
  console.log(`   Fichiers présents: ${filesExist}/${expectedFiles.length}`)
  
  if (filesExist === expectedFiles.length) {
    console.log('\n✅ Tout est en ordre!')
  } else {
    console.log('\n⚠️  Certains fichiers sont manquants.')
  }
  
} catch (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
} finally {
  db.close()
}

