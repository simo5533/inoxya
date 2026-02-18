const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicDir = path.join(__dirname, '..', 'public')

console.log('🔍 Vérification des photos et données...\n')

const db = new Database(dbPath)

try {
  // 1. Vérifier les packs
  console.log('📦 PACKS:')
  const packs = db.prepare('SELECT id, name, price, image_url FROM packs LIMIT 5').all()
  console.log(`   Total: ${db.prepare('SELECT COUNT(*) as count FROM packs').get().count} packs`)
  
  packs.forEach((pack, i) => {
    console.log(`\n   ${i + 1}. ${pack.name} (${pack.price} MAD)`)
    console.log(`      Image: ${pack.image_url || 'Aucune'}`)
    
    if (pack.image_url) {
      // Vérifier si l'image existe
      const imagePath = pack.image_url.startsWith('/') 
        ? path.join(publicDir, pack.image_url.substring(1))
        : pack.image_url
      
      if (fs.existsSync(imagePath)) {
        console.log(`      ✅ Image trouvée: ${imagePath}`)
      } else if (pack.image_url.startsWith('C:\\')) {
        console.log(`      ⚠️  Chemin absolu Windows: ${pack.image_url}`)
        console.log(`      💡 L'image doit être dans public/ pour être accessible`)
      } else {
        console.log(`      ❌ Image non trouvée: ${imagePath}`)
      }
    }
  })

  // 2. Vérifier les produits
  console.log('\n\n💎 PRODUITS:')
  const products = db.prepare('SELECT id, name, price, image_url, images FROM products WHERE is_active = 1 LIMIT 5').all()
  console.log(`   Total: ${db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count} produits actifs`)
  
  products.forEach((product, i) => {
    console.log(`\n   ${i + 1}. ${product.name} (${product.price} MAD)`)
    console.log(`      Image principale: ${product.image_url || 'Aucune'}`)
    
    if (product.image_url) {
      const imagePath = product.image_url.startsWith('/') 
        ? path.join(publicDir, product.image_url.substring(1))
        : product.image_url
      
      if (fs.existsSync(imagePath)) {
        console.log(`      ✅ Image trouvée: ${imagePath}`)
      } else if (product.image_url.startsWith('C:\\')) {
        console.log(`      ⚠️  Chemin absolu Windows: ${product.image_url}`)
        console.log(`      💡 L'image doit être dans public/ pour être accessible`)
      } else {
        console.log(`      ❌ Image non trouvée: ${imagePath}`)
      }
    }
    
    // Vérifier les images secondaires
    if (product.images) {
      try {
        const imagesArray = JSON.parse(product.images)
        if (imagesArray.length > 0) {
          console.log(`      Images secondaires: ${imagesArray.length}`)
          imagesArray.slice(0, 2).forEach((img, idx) => {
            if (img.startsWith('C:\\')) {
              console.log(`         ${idx + 1}. ⚠️  Chemin absolu: ${img}`)
            } else {
              console.log(`         ${idx + 1}. ${img}`)
            }
          })
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }
  })

  // 3. Vérifier les images dans public/
  console.log('\n\n📁 IMAGES DANS public/:')
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg']
  const findImages = (dir, baseDir = dir) => {
    let images = []
    try {
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          images = images.concat(findImages(fullPath, baseDir))
        } else {
          const ext = path.extname(item).toLowerCase()
          if (imageExtensions.includes(ext)) {
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
            images.push('/' + relativePath)
          }
        }
      }
    } catch (e) {
      // Ignorer les erreurs
    }
    return images
  }
  
  const publicImages = findImages(publicDir, publicDir)
  console.log(`   ${publicImages.length} image(s) trouvée(s) dans public/`)
  if (publicImages.length > 0) {
    console.log('   Premières images:')
    publicImages.slice(0, 10).forEach((img, i) => {
      console.log(`      ${i + 1}. ${img}`)
    })
  } else {
    console.log('   ⚠️  Aucune image trouvée dans public/')
  }

  // 4. Résumé
  console.log('\n\n📊 RÉSUMÉ:')
  const totalPacks = db.prepare('SELECT COUNT(*) as count FROM packs').get().count
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count
  console.log(`   - Packs dans la base: ${totalPacks}`)
  console.log(`   - Produits dans la base: ${totalProducts}`)
  console.log(`   - Images dans public/: ${publicImages.length}`)
  
  console.log('\n💡 RECOMMANDATIONS:')
  if (totalPacks === 0 && totalProducts === 0) {
    console.log('   ⚠️  Aucune donnée dans la base! Exécutez: node scripts/insert-sample-data.js')
  } else {
    console.log('   ✅ Des données existent dans la base')
  }
  
  if (publicImages.length === 0) {
    console.log('   ⚠️  Aucune image dans public/! Ajoutez vos images dans public/images/')
  } else {
    console.log('   ✅ Des images existent dans public/')
  }

} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
} finally {
  db.close()
}

