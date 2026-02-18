/**
 * Script d'optimisation des images pour INOXYA
 * Optimise et redimensionne les images de bijoux
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Configuration des tailles d'images
const imageSizes = {
  main: { width: 800, height: 800, quality: 90 },
  gallery: { width: 600, height: 600, quality: 85 },
  thumbnail: { width: 200, height: 200, quality: 80 },
  pack: { width: 1000, height: 750, quality: 90 }
}

// Dossiers à traiter
const imageFolders = [
  'public/images/bijoux',
  'public/images/packs',
  'public/images/categories'
]

/**
 * Optimise une image avec Sharp
 */
async function optimizeImage(inputPath, outputPath, options) {
  try {
    await sharp(inputPath)
      .resize(options.width, options.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: options.quality })
      .toFile(outputPath)
    
    console.log(`✅ Optimisé: ${outputPath}`)
  } catch (error) {
    console.error(`❌ Erreur avec ${inputPath}:`, error.message)
  }
}

/**
 * Traite un dossier d'images
 */
async function processImageFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.log(`📁 Dossier non trouvé: ${folderPath}`)
    return
  }

  const items = fs.readdirSync(folderPath, { withFileTypes: true })
  
  for (const item of items) {
    const itemPath = path.join(folderPath, item.name)
    
    if (item.isDirectory()) {
      // Traiter le sous-dossier
      await processImageFolder(itemPath)
    } else if (item.isFile() && /\.(jpg|jpeg|png)$/i.test(item.name)) {
      // Traiter l'image
      await processImageFile(itemPath)
    }
  }
}

/**
 * Traite un fichier image
 */
async function processImageFile(imagePath) {
  const dir = path.dirname(imagePath)
  const ext = path.extname(imagePath)
  const name = path.basename(imagePath, ext)
  
  // Déterminer le type d'image basé sur le nom
  let imageType = 'main'
  if (name.includes('gallery')) imageType = 'gallery'
  else if (name.includes('thumbnail')) imageType = 'thumbnail'
  else if (dir.includes('packs')) imageType = 'pack'
  
  const options = imageSizes[imageType]
  const outputPath = path.join(dir, `${name}-optimized${ext}`)
  
  await optimizeImage(imagePath, outputPath, options)
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Début de l\'optimisation des images INOXYA...\n')
  
  for (const folder of imageFolders) {
    console.log(`📂 Traitement du dossier: ${folder}`)
    await processImageFolder(folder)
    console.log('')
  }
  
  console.log('✨ Optimisation terminée !')
  console.log('\n📋 Instructions:')
  console.log('1. Vérifiez les images optimisées')
  console.log('2. Remplacez les images originales si satisfait')
  console.log('3. Supprimez les fichiers -optimized si nécessaire')
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { optimizeImage, processImageFolder }
