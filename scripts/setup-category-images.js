/**
 * Script pour configurer les vraies images de catégories
 * Sélectionne les meilleures images de produits pour représenter chaque catégorie
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images')
const categoriesDir = path.join(publicImagesDir, 'categories')
const productsDir = path.join(publicImagesDir, 'products')

// Créer le dossier categories s'il n'existe pas
if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true })
}

const db = new Database(dbPath)

console.log('🖼️  Configuration des images de catégories avec de vraies images...\n')
console.log('='.repeat(80))

try {
  // 1. Récupérer les catégories
  console.log('\n1️⃣ Récupération des catégories...')
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all()
  console.log(`   📦 ${categories.length} catégories trouvées\n`)

  // 2. Pour chaque catégorie, trouver le meilleur produit représentatif
  console.log('2️⃣ Sélection des images représentatives...\n')

  const categoryImageMap = {
    'Bagues': null,
    'Colliers': null,
    'Bracelets': null,
    'Boucles d\'oreilles': null,
    'Parures': null,
    'Broches': null
  }

  categories.forEach(category => {
    console.log(`   🔍 Catégorie: ${category.name}`)
    
    // Trouver les produits de cette catégorie
    const products = db.prepare(`
      SELECT id, name, image_url, images
      FROM products 
      WHERE category = ? AND is_active = 1
      ORDER BY id DESC
      LIMIT 5
    `).all(category.name)

    if (products.length > 0) {
      // Prendre le premier produit avec une image valide
      let selectedImage = null
      
      for (const product of products) {
        const imagePath = product.image_url
        
        if (imagePath && imagePath.startsWith('/images/products/')) {
          // Extraire le nom du fichier
          const fileName = path.basename(imagePath)
          const sourcePath = path.join(productsDir, fileName)
          
          if (fs.existsSync(sourcePath)) {
            selectedImage = {
              productId: product.id,
              productName: product.name,
              sourcePath: sourcePath,
              fileName: fileName
            }
            break
          }
        }
      }

      if (selectedImage) {
        categoryImageMap[category.name] = selectedImage
        console.log(`      ✅ Image trouvée: ${selectedImage.productName} (${selectedImage.fileName})`)
      } else {
        console.log(`      ⚠️  Aucune image valide trouvée pour ${category.name}`)
      }
    } else {
      console.log(`      ⚠️  Aucun produit trouvé pour ${category.name}`)
    }
    console.log('')
  })

  // 3. Copier les images vers le dossier categories
  console.log('3️⃣ Copie des images vers public/images/categories...\n')

  let successCount = 0
  let errorCount = 0

  categories.forEach(category => {
    const imageInfo = categoryImageMap[category.name]
    
    if (imageInfo) {
      try {
        // Créer un nom de fichier pour la catégorie
        const categorySlug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-')
        const ext = path.extname(imageInfo.fileName) || '.jpeg'
        const categoryImageName = `${categorySlug}-category${ext}`
        const destPath = path.join(categoriesDir, categoryImageName)
        
        // Copier l'image
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(imageInfo.sourcePath, destPath)
          console.log(`   ✅ ${category.name}: ${categoryImageName}`)
        } else {
          console.log(`   ℹ️  ${category.name}: ${categoryImageName} (déjà existe)`)
        }

        // Mettre à jour la base de données
        const imageUrl = `/images/categories/${categoryImageName}`
        db.prepare(`
          UPDATE categories 
          SET image_url = ? 
          WHERE id = ?
        `).run(imageUrl, category.id)

        console.log(`      📝 Base de données mise à jour: ${imageUrl}`)
        successCount++
      } catch (error) {
        console.error(`      ❌ Erreur pour ${category.name}:`, error.message)
        errorCount++
      }
    } else {
      console.log(`   ⚠️  ${category.name}: Pas d'image disponible`)
    }
  })

  // 4. Vérification finale
  console.log('\n4️⃣ Vérification finale...')
  const updatedCategories = db.prepare(`
    SELECT name, image_url 
    FROM categories 
    WHERE image_url IS NOT NULL
  `).all()

  console.log(`\n   📊 Résumé:`)
  console.log(`      ✅ Images configurées: ${successCount}`)
  console.log(`      ❌ Erreurs: ${errorCount}`)
  console.log(`      📦 Catégories avec images: ${updatedCategories.length}/${categories.length}`)

  console.log(`\n   📋 Catégories configurées:`)
  updatedCategories.forEach(cat => {
    const imageExists = cat.image_url ? fs.existsSync(path.join(__dirname, '..', 'public', cat.image_url)) : false
    console.log(`      ${imageExists ? '✅' : '❌'} ${cat.name}: ${cat.image_url || 'Aucune'}`)
  })

  // 5. Vérifier les fichiers dans le dossier
  const categoryFiles = fs.existsSync(categoriesDir)
    ? fs.readdirSync(categoriesDir).filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
      })
    : []

  console.log(`\n   📸 Images dans public/images/categories: ${categoryFiles.length}`)
  if (categoryFiles.length > 0) {
    categoryFiles.forEach(file => {
      console.log(`      - ${file}`)
    })
  }

  db.close()

  console.log('\n' + '='.repeat(80))
  if (successCount === categories.length) {
    console.log('\n✅ Toutes les catégories ont maintenant de vraies images!')
  } else {
    console.log(`\n⚠️  ${successCount}/${categories.length} catégories configurées`)
    if (errorCount > 0) {
      console.log(`   ${errorCount} erreur(s) rencontrée(s)`)
    }
  }

  console.log('\n✅ Terminé!')
  
} catch (error) {
  console.error('\n❌ Erreur fatale:', error)
  db.close()
  process.exit(1)
}

