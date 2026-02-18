const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicDir = path.join(__dirname, '..', 'public')

console.log('🔧 Correction de tous les chemins d\'images...\n')

if (!fs.existsSync(dbPath)) {
  console.error(`❌ Base de données non trouvée: ${dbPath}`)
  process.exit(1)
}

const db = new Database(dbPath)

try {
  // 1. Corriger les packs
  console.log('📦 Correction des packs...')
  const packs = db.prepare('SELECT id, name, image_url FROM packs').all()
  let packsFixed = 0
  
  packs.forEach(pack => {
    let newImageUrl = pack.image_url
    
    // Si le chemin est invalide ou absolu Windows
    if (!newImageUrl || newImageUrl.startsWith('C:\\') || (!newImageUrl.startsWith('/') && !newImageUrl.startsWith('http'))) {
      // Chercher une image correspondante
      const packName = pack.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const possiblePaths = [
        `/images/packs/pack-${packName}.jpg`,
        `/images/packs/pack-${packName}.jpeg`,
        `/images/packs/${packName}.jpg`,
        `/images/packs/${packName}.jpeg`
      ]
      
      for (const imgPath of possiblePaths) {
        const fullPath = path.join(publicDir, imgPath.substring(1))
        if (fs.existsSync(fullPath)) {
          newImageUrl = imgPath
          break
        }
      }
      
      // Si toujours rien, utiliser placeholder
      if (!newImageUrl || newImageUrl.startsWith('C:\\')) {
        newImageUrl = '/placeholder.svg'
      }
      
      // Mettre à jour
      if (newImageUrl !== pack.image_url) {
        db.prepare('UPDATE packs SET image_url = ? WHERE id = ?').run(newImageUrl, pack.id)
        console.log(`   ✅ ${pack.name}: ${pack.image_url || 'Aucune'} → ${newImageUrl}`)
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
    let updated = false
    
    // Corriger l'image principale
    if (!newImageUrl || newImageUrl.startsWith('C:\\') || (!newImageUrl.startsWith('/') && !newImageUrl.startsWith('http'))) {
      const productName = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      // Chercher dans différents dossiers
      const searchDirs = [
        'images/products',
        'images/bijoux/bagues',
        'images/bijoux/colliers',
        'images/bijoux/bracelets',
        'images/bijoux/boucles-oreilles'
      ]
      
      let found = false
      for (const dir of searchDirs) {
        const possiblePaths = [
          `${dir}/${productName}-main.jpeg`,
          `${dir}/${productName}-main.jpg`,
          `${dir}/${productName}/main.jpg`,
          `${dir}/${productName}/main.jpeg`,
          `${dir}/${productName}/thumbnail.jpg`
        ]
        
        for (const imgPath of possiblePaths) {
          const fullPath = path.join(publicDir, imgPath)
          if (fs.existsSync(fullPath)) {
            newImageUrl = '/' + imgPath.replace(/\\/g, '/')
            found = true
            break
          }
        }
        if (found) break
      }
      
      if (!found && (!newImageUrl || newImageUrl.startsWith('C:\\'))) {
        newImageUrl = '/placeholder.svg'
      }
      
      if (newImageUrl !== product.image_url) {
        db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(newImageUrl, product.id)
        console.log(`   ✅ ${product.name}: ${product.image_url || 'Aucune'} → ${newImageUrl}`)
        updated = true
        productsFixed++
      }
    }
    
    // Corriger les images secondaires
    if (product.images) {
      try {
        const imagesArray = JSON.parse(product.images)
        const correctedImages = imagesArray.map((img) => {
          if (img && img.startsWith('C:\\')) {
            // Chercher l'image correspondante
            const imgName = path.basename(img, path.extname(img)).toLowerCase()
            const searchDirs = ['images/products', 'images/bijoux']
            
            for (const dir of searchDirs) {
              const fullDir = path.join(publicDir, dir)
              if (fs.existsSync(fullDir)) {
                const files = fs.readdirSync(fullDir, { recursive: true })
                for (const file of files) {
                  if (file.toLowerCase().includes(imgName)) {
                    const relativePath = path.join(dir, file).replace(/\\/g, '/')
                    return '/' + relativePath
                  }
                }
              }
            }
            return '/placeholder.svg'
          }
          return img
        })
        
        if (JSON.stringify(correctedImages) !== product.images) {
          db.prepare('UPDATE products SET images = ? WHERE id = ?').run(JSON.stringify(correctedImages), product.id)
          if (!updated) {
            console.log(`   ✅ Images secondaires corrigées pour: ${product.name}`)
            productsFixed++
          }
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
  console.log('\n🔄 Actualisez les pages dans votre navigateur!')

} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
} finally {
  db.close()
}

