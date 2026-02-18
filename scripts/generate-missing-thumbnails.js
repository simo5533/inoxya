/**
 * Script pour générer les thumbnails manquants
 * À partir des images main existantes
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const THUMBNAIL_SIZE = { width: 200, height: 200, quality: 80 }

/**
 * Génère un thumbnail à partir d'une image main
 */
async function generateThumbnail(mainPath, thumbPath) {
  try {
    await sharp(mainPath)
      .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: THUMBNAIL_SIZE.quality })
      .toFile(thumbPath)
    
    return true
  } catch (error) {
    console.error(`❌ Erreur génération thumbnail:`, error.message)
    return false
  }
}

/**
 * Parcourt les dossiers et génère les thumbnails manquants
 */
async function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return
  }
  
  const items = fs.readdirSync(dirPath, { withFileTypes: true })
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item.name)
    
    if (item.isDirectory()) {
      await processDirectory(itemPath)
    } else if (item.isFile() && item.name === 'main.webp') {
      // Trouvé une image main, vérifier si thumbnail existe
      const dir = path.dirname(itemPath)
      const thumbPath = path.join(dir, 'thumbnail.webp')
      
      if (!fs.existsSync(thumbPath)) {
        console.log(`📸 Génération thumbnail: ${dir}`)
        await generateThumbnail(itemPath, thumbPath)
        console.log(`✅ Thumbnail créé: ${thumbPath}`)
      }
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Génération des thumbnails manquants...\n')
  
  const baseDir = path.join(__dirname, '..', 'public', 'images')
  
  // Traiter bijoux
  const bijouxDir = path.join(baseDir, 'bijoux')
  if (fs.existsSync(bijouxDir)) {
    console.log('📂 Traitement des bijoux...')
    await processDirectory(bijouxDir)
  }
  
  // Traiter packs
  const packsDir = path.join(baseDir, 'packs')
  if (fs.existsSync(packsDir)) {
    console.log('📂 Traitement des packs...')
    await processDirectory(packsDir)
  }
  
  console.log('\n✨ Génération terminée !')
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { generateThumbnail, processDirectory }

