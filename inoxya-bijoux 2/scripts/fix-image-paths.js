const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicDir = path.join(__dirname, '..', 'public')

console.log('🔧 Correction des chemins d\'images...\n')

const db = new Database(dbPath)

// Fonction pour trouver une image correspondante dans public/
function findImageInPublic(imageName) {
  if (!imageName) return null
  
  // Nettoyer le nom de l'image
  const cleanName = imageName
    .replace(/^.*[\\\/]/, '') // Enlever le chemin
    .replace(/\.[^.]*$/, '') // Enlever l'extension
    .toLowerCase()
  
  // Chercher dans public/images/
  const searchDirs = [
    path.join(publicDir, 'images', 'packs'),
    path.join(publicDir, 'images', 'products'),
    path.join(publicDir, 'images', 'bijoux')
  ]
  
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue
    
    const findRecursive = (currentDir) => {
      try {
        const items = fs.readdirSync(currentDir)
        for (const item of items) {
          const fullPath = path.join(currentDir, item)
          const stat = fs.statSync(fullPath)
          
          if (stat.isDirectory()) {
            const found = findRecursive(fullPath)
            if (found) return found
          } else {
            const itemName = item.replace(/\.[^.]*$/, '').toLowerCase()
            if (itemName.includes(cleanName) || cleanName.includes(itemName)) {
              const relativePath = path.relative(publicDir, fullPath).replace(/\\/g, '/')
              return '/' + relativePath
            }
          }
        }
      } catch (e) {
        // Ignorer les erreurs
      }
      return null
    }
    
    const found = findRecursive(dir)
    if (found) return found
  }
  
  return null
}

try {
  // 1. Corriger les packs
  console.log('📦 Correction des packs...')
  const packs = db.prepare('SELECT id, name, image_url FROM packs').all()
  
  let packsFixed = 0
  packs.forEach(pack => {
    let newImageUrl = pack.image_url
    
    // Si le chemin est absolu Windows ou invalide
    if (!pack.image_url || pack.image_url.startsWith('C:\\') || !pack.image_url.startsWith('/')) {
      // Chercher une image correspondante
      const foundImage = findImageInPublic(pack.name)
      
      if (foundImage) {
        newImageUrl = foundImage
      } else {
        // Chercher dans les images de packs
        const packImages = [
          `/images/packs/pack-${pack.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          `/images/packs/pack-${pack.name.toLowerCase().replace(/\s+/g, '-')}.jpeg`,
          `/images/packs/${pack.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
        ]
        
        for (const imgPath of packImages) {
          if (fs.existsSync(path.join(publicDir, imgPath.substring(1)))) {
            newImageUrl = imgPath
            break
          }
        }
        
        // Si toujours rien, utiliser placeholder
        if (!newImageUrl || newImageUrl.startsWith('C:\\')) {
          newImageUrl = '/placeholder.svg'
        }
      }
      
      // Mettre à jour si différent
      if (newImageUrl !== pack.image_url) {
        db.prepare('UPDATE packs SET image_url = ? WHERE id = ?').run(newImageUrl, pack.id)
        console.log(`   ✅ Pack "${pack.name}": ${pack.image_url || 'Aucune'} → ${newImageUrl}`)
        packsFixed++
      }
    }
  })
  
  console.log(`   ${packsFixed} pack(s) corrigé(s)\n`)

  // 2. Corriger les produits
  console.log('💎 Correction des produits...')
  const products = db.prepare('SELECT id, name, image_url, images FROM products WHERE is_active = 1').all()
  
  let productsFixed = 0
  products.forEach(product => {
    let newImageUrl = product.image_url
    let newImages = product.images
    
    // Corriger l'image principale
    if (!product.image_url || product.image_url.startsWith('C:\\') || !product.image_url.startsWith('/')) {
      const foundImage = findImageInPublic(product.name)
      
      if (foundImage) {
        newImageUrl = foundImage
      } else {
        // Chercher dans les images de produits
        const productSlug = product.name.toLowerCase().replace(/\s+/g, '-')
        const possiblePaths = [
          `/images/products/${productSlug}-main.jpeg`,
          `/images/products/${productSlug}-main.jpg`,
          `/images/bijoux/bagues/${productSlug}/main.jpg`,
          `/images/bijoux/colliers/${productSlug}/main.jpg`,
          `/images/bijoux/bracelets/${productSlug}/main.jpg`
        ]
        
        for (const imgPath of possiblePaths) {
          if (fs.existsSync(path.join(publicDir, imgPath.substring(1)))) {
            newImageUrl = imgPath
            break
          }
        }
        
        if (!newImageUrl || newImageUrl.startsWith('C:\\')) {
          newImageUrl = '/placeholder.svg'
        }
      }
      
      if (newImageUrl !== product.image_url) {
        db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(newImageUrl, product.id)
        console.log(`   ✅ Produit "${product.name}": ${product.image_url || 'Aucune'} → ${newImageUrl}`)
        productsFixed++
      }
    }
    
    // Corriger les images secondaires
    if (product.images) {
      try {
        const imagesArray = JSON.parse(product.images)
        let updated = false
        const correctedImages = imagesArray.map(img => {
          if (img && img.startsWith('C:\\')) {
            updated = true
            const found = findImageInPublic(img)
            return found || '/placeholder.svg'
          }
          return img
        })
        
        if (updated) {
          db.prepare('UPDATE products SET images = ? WHERE id = ?').run(JSON.stringify(correctedImages), product.id)
          console.log(`   ✅ Images secondaires corrigées pour "${product.name}"`)
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }
  })
  
  console.log(`   ${productsFixed} produit(s) corrigé(s)\n`)

  // 3. Résumé
  console.log('📊 RÉSUMÉ:')
  const totalPacks = db.prepare('SELECT COUNT(*) as count FROM packs').get().count
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count
  console.log(`   - Packs: ${totalPacks}`)
  console.log(`   - Produits: ${totalProducts}`)
  console.log(`   - Packs corrigés: ${packsFixed}`)
  console.log(`   - Produits corrigés: ${productsFixed}`)
  
  console.log('\n✅ Correction terminée!')
  console.log('\n🔄 Actualisez la page dans votre navigateur pour voir les changements!')

} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
} finally {
  db.close()
}

