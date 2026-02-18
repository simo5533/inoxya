/**
 * Script pour ajouter le produit "Montre Luxe Blgari"
 * et copier les images depuis le desktop
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

// Chemins des images source
const sourceImages = [
  {
    source: "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.11.22_e2061f38.jpg",
    dest: "main.jpg"
  },
  {
    source: "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.11.22_2066e0d7.jpg",
    dest: "second-1.jpg"
  },
  {
    source: "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.11.21_568931f4.jpg",
    dest: "second-2.jpg"
  }
]

// Chemin du dossier de destination
const productDir = path.join(__dirname, '..', 'public', 'images', 'products', 'montre-bvlgari')

// Connexion à la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

try {
  console.log('🚀 Ajout du produit "Montre Luxe Blgari"...\n')
  
  // 1. Vérifier/mettre à jour le schéma pour ajouter le champ images
  console.log('📋 Vérification du schéma de la base de données...')
  try {
    db.exec(`
      ALTER TABLE products ADD COLUMN images TEXT DEFAULT '[]'
    `)
    console.log('   ✅ Champ "images" ajouté à la table products')
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('   ℹ️  Champ "images" existe déjà')
    } else {
      throw error
    }
  }
  
  // 2. Créer la catégorie "Montres" si elle n'existe pas
  console.log('\n📂 Vérification de la catégorie "Montres"...')
  const categoryCheck = db.prepare('SELECT id FROM categories WHERE name = ?').get('Montres')
  
  if (!categoryCheck) {
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)
    `)
    insertCategory.run('Montres', 'montres', 'Montres de luxe et élégantes')
    console.log('   ✅ Catégorie "Montres" créée')
  } else {
    console.log('   ℹ️  Catégorie "Montres" existe déjà')
  }
  
  // 3. Créer le dossier pour les images
  console.log('\n📁 Création du dossier pour les images...')
  if (!fs.existsSync(productDir)) {
    fs.mkdirSync(productDir, { recursive: true })
    console.log(`   ✅ Dossier créé: ${productDir}`)
  } else {
    console.log(`   ℹ️  Dossier existe déjà: ${productDir}`)
  }
  
  // 4. Copier les images
  console.log('\n🖼️  Copie des images...')
  let imagesCopied = 0
  const imagePaths = []
  
  for (const img of sourceImages) {
    const sourcePath = img.source
    const destPath = path.join(productDir, img.dest)
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath)
      console.log(`   ✅ ${img.dest} copié`)
      imagesCopied++
      
      // Ajouter le chemin relatif
      if (img.dest === 'main.jpg') {
        imagePaths.push(`/images/products/montre-bvlgari/${img.dest}`)
      } else {
        imagePaths.push(`/images/products/montre-bvlgari/${img.dest}`)
      }
    } else {
      console.log(`   ⚠️  Image non trouvée: ${sourcePath}`)
      console.log(`   📝 Vous devrez copier cette image manuellement vers: ${destPath}`)
    }
  }
  
  // 5. Préparer les données du produit
  const mainImage = '/images/products/montre-bvlgari/main.jpg'
  const galleryImages = [
    '/images/products/montre-bvlgari/second-1.jpg',
    '/images/products/montre-bvlgari/second-2.jpg'
  ]
  const imagesJson = JSON.stringify(galleryImages)
  
  // 6. Vérifier si le produit existe déjà
  console.log('\n🔍 Vérification du produit existant...')
  const existingProduct = db.prepare('SELECT id FROM products WHERE name = ?').get('Montre Luxe Blgari')
  
  if (existingProduct) {
    // Mettre à jour le produit existant
    console.log('   ℹ️  Produit existe déjà, mise à jour...')
    const updateProduct = db.prepare(`
      UPDATE products 
      SET description = ?, price = ?, category = ?, stock = ?, image_url = ?, images = ?, updated_at = ?
      WHERE id = ?
    `)
    updateProduct.run(
      'Montre élégante de luxe Blgari, finition premium.',
      199,
      'Montres',
      25,
      mainImage,
      imagesJson,
      new Date().toISOString(),
      existingProduct.id
    )
    console.log(`   ✅ Produit mis à jour (ID: ${existingProduct.id})`)
  } else {
    // Créer le nouveau produit
    console.log('   ➕ Création du nouveau produit...')
    const insertProduct = db.prepare(`
      INSERT INTO products (name, description, price, category, stock, is_active, image_url, images, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = insertProduct.run(
      'Montre Luxe Blgari',
      'Montre élégante de luxe Blgari, finition premium.',
      199,
      'Montres',
      25,
      1,
      mainImage,
      imagesJson,
      new Date().toISOString(),
      new Date().toISOString()
    )
    console.log(`   ✅ Produit créé (ID: ${result.lastInsertRowid})`)
  }
  
  // 7. Afficher le résumé
  console.log('\n' + '='.repeat(60))
  console.log('✅ PRODUIT AJOUTÉ AVEC SUCCÈS!\n')
  console.log('📦 Informations du produit:')
  console.log('   Nom: Montre Luxe Blgari')
  console.log('   Prix: 199 DHS')
  console.log('   Catégorie: Montres')
  console.log('   Stock: 25')
  console.log(`\n🖼️  Images:`)
  console.log(`   Main: ${mainImage}`)
  console.log(`   Gallery: ${galleryImages.length} images`)
  galleryImages.forEach((img, i) => {
    console.log(`      ${i + 1}. ${img}`)
  })
  console.log(`\n📁 Dossier des images:`)
  console.log(`   ${productDir}`)
  console.log(`\n📊 Images copiées: ${imagesCopied}/${sourceImages.length}`)
  
  if (imagesCopied < sourceImages.length) {
    console.log('\n⚠️  Certaines images n\'ont pas été trouvées.')
    console.log('   Veuillez les copier manuellement dans le dossier ci-dessus.')
  }
  
  console.log('\n' + '='.repeat(60))
  
} catch (error) {
  console.error('❌ Erreur:', error)
  process.exit(1)
} finally {
  db.close()
}

