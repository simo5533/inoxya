/**
 * Script pour compléter les images de catégories manquantes
 * Utilise des images de produits similaires ou des images représentatives
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images')
const categoriesDir = path.join(publicImagesDir, 'categories')
const productsDir = path.join(publicImagesDir, 'products')

const db = new Database(dbPath)

console.log('🖼️  Complétion des images de catégories manquantes...\n')
console.log('='.repeat(80))

try {
  // 1. Récupérer toutes les catégories
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all()
  
  // 2. Mapping des catégories sans produits vers des images similaires
  const fallbackMapping = {
    'Boucles d\'oreilles': ['Bracelets', 'Colliers'], // Utiliser des images de bracelets ou colliers
    'Parures': ['Bagues', 'Colliers'], // Utiliser des images de bagues ou colliers
    'Broches': ['Bagues', 'Colliers'], // Utiliser des images de bagues ou colliers
    'Montres': ['Bracelets', 'Bagues'] // Utiliser des images de bracelets ou bagues
  }

  console.log('\n1️⃣ Recherche d\'images pour les catégories manquantes...\n')

  let addedCount = 0

  categories.forEach(category => {
    const categoryImagePath = category.image_url 
      ? path.join(__dirname, '..', 'public', category.image_url)
      : null
    
    // Si la catégorie n'a pas d'image
    if (!categoryImagePath || !fs.existsSync(categoryImagePath)) {
      console.log(`   🔍 ${category.name}: Recherche d'image...`)
      
      let foundImage = null
      
      // Essayer de trouver dans les catégories de fallback
      if (fallbackMapping[category.name]) {
        for (const fallbackCategory of fallbackMapping[category.name]) {
          const fallbackCat = categories.find(c => c.name === fallbackCategory)
          if (fallbackCat && fallbackCat.image_url) {
            const fallbackImagePath = path.join(__dirname, '..', 'public', fallbackCat.image_url)
            if (fs.existsSync(fallbackImagePath)) {
              foundImage = fallbackImagePath
              console.log(`      ✅ Image trouvée depuis "${fallbackCategory}"`)
              break
            }
          }
        }
      }
      
      // Si toujours pas trouvé, prendre n'importe quelle image de produit
      if (!foundImage) {
        const allProducts = db.prepare(`
          SELECT image_url 
          FROM products 
          WHERE image_url IS NOT NULL AND image_url LIKE '/images/products/%'
          LIMIT 10
        `).all()
        
        for (const product of allProducts) {
          const productImagePath = path.join(__dirname, '..', 'public', product.image_url)
          if (fs.existsSync(productImagePath)) {
            foundImage = productImagePath
            console.log(`      ✅ Image trouvée depuis les produits`)
            break
          }
        }
      }
      
      // Copier l'image si trouvée
      if (foundImage) {
        try {
          const categorySlug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-')
          const ext = path.extname(foundImage) || '.jpeg'
          const categoryImageName = `${categorySlug}-category${ext}`
          const destPath = path.join(categoriesDir, categoryImageName)
          
          if (!fs.existsSync(destPath)) {
            fs.copyFileSync(foundImage, destPath)
            console.log(`      📁 Copié: ${categoryImageName}`)
          }
          
          // Mettre à jour la base de données
          const imageUrl = `/images/categories/${categoryImageName}`
          db.prepare(`
            UPDATE categories 
            SET image_url = ? 
            WHERE id = ?
          `).run(imageUrl, category.id)
          
          console.log(`      ✅ ${category.name}: ${imageUrl}`)
          addedCount++
        } catch (error) {
          console.error(`      ❌ Erreur: ${error.message}`)
        }
      } else {
        console.log(`      ⚠️  Aucune image trouvée pour ${category.name}`)
      }
    } else {
      console.log(`   ✅ ${category.name}: Image déjà configurée`)
    }
  })

  // 3. Vérification finale
  console.log('\n2️⃣ Vérification finale...')
  const allCategories = db.prepare('SELECT name, image_url FROM categories').all()
  
  console.log(`\n   📊 Résumé:`)
  console.log(`      ✅ Nouvelles images ajoutées: ${addedCount}`)
  console.log(`      📦 Total catégories avec images: ${allCategories.filter(c => c.image_url).length}/${allCategories.length}`)
  
  console.log(`\n   📋 Toutes les catégories:`)
  allCategories.forEach(cat => {
    const imageExists = cat.image_url ? fs.existsSync(path.join(__dirname, '..', 'public', cat.image_url)) : false
    console.log(`      ${imageExists ? '✅' : '❌'} ${cat.name}: ${cat.image_url || 'AUCUNE'}`)
  })

  const categoryFiles = fs.existsSync(categoriesDir)
    ? fs.readdirSync(categoriesDir).filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
      })
    : []

  console.log(`\n   📸 Images dans public/images/categories: ${categoryFiles.length}`)
  categoryFiles.forEach(file => console.log(`      - ${file}`))

  db.close()

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Terminé!')
  
} catch (error) {
  console.error('\n❌ Erreur fatale:', error)
  db.close()
  process.exit(1)
}

