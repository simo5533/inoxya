/**
 * Script de migration des images externes vers locales
 * Télécharge les images Unsplash et les convertit en WebP
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// Configuration
const IMAGE_SIZES = {
  main: { width: 800, height: 800, quality: 90 },
  gallery: { width: 600, height: 600, quality: 85 },
  thumbnail: { width: 200, height: 200, quality: 80 }
}

/**
 * Télécharge une image depuis une URL
 */
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(outputPath)
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        return
      }
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        resolve(outputPath)
      })
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {})
      reject(err)
    })
  })
}

/**
 * Génère un slug à partir d'un nom
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

/**
 * Obtient le dossier de catégorie
 */
function getCategoryFolder(categoryId) {
  const map = {
    'cat-bagues': 'bagues',
    'cat-colliers': 'colliers',
    'cat-bracelets': 'bracelets',
    'cat-boucles': 'boucles-oreilles',
    'cat-parures': 'parures',
    'cat-broches': 'broches'
  }
  return map[categoryId] || 'general'
}

/**
 * Traite et sauvegarde une image
 */
async function processImage(inputPath, outputPath, options) {
  try {
    await sharp(inputPath)
      .resize(options.width, options.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: options.quality })
      .toFile(outputPath)
    
    return true
  } catch (error) {
    console.error(`❌ Erreur traitement ${inputPath}:`, error.message)
    return false
  }
}

/**
 * Crée les variantes d'une image (main, gallery, thumbnail)
 */
async function createImageVariants(tempImagePath, productDir, productSlug) {
  const variants = []
  
  // Main image
  const mainPath = path.join(productDir, 'main.webp')
  await processImage(tempImagePath, mainPath, IMAGE_SIZES.main)
  variants.push(mainPath)
  
  // Thumbnail
  const thumbPath = path.join(productDir, 'thumbnail.webp')
  await processImage(tempImagePath, thumbPath, IMAGE_SIZES.thumbnail)
  variants.push(thumbPath)
  
  // Gallery images (générer 3 variantes à partir de la même image)
  for (let i = 1; i <= 3; i++) {
    const galleryPath = path.join(productDir, `gallery-${i}.webp`)
    await processImage(tempImagePath, galleryPath, IMAGE_SIZES.gallery)
    variants.push(galleryPath)
  }
  
  return variants
}

/**
 * Migre une image externe vers locale
 */
async function migrateProductImage(product) {
  const { id, name, category_id, image_url } = product
  
  // Vérifier si c'est une URL externe
  if (!image_url || !image_url.startsWith('http')) {
    console.log(`⏭️  ${name} - Déjà local ou pas d'image`)
    return null
  }
  
  try {
    console.log(`\n📥 Migration: ${name} (${id})`)
    
    // Créer les dossiers
    const categoryFolder = getCategoryFolder(category_id)
    const productSlug = generateSlug(name)
    const productDir = path.join(
      __dirname,
      '..',
      'public',
      'images',
      'bijoux',
      categoryFolder,
      productSlug
    )
    
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true })
      console.log(`📁 Dossier créé: ${productDir}`)
    }
    
    // Télécharger l'image temporairement
    const tempPath = path.join(__dirname, '..', 'temp-uploads', `temp-${id}.jpg`)
    const tempDir = path.dirname(tempPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    console.log(`⬇️  Téléchargement depuis: ${image_url}`)
    await downloadImage(image_url, tempPath)
    
    // Créer les variantes
    console.log(`🔄 Création des variantes...`)
    const variants = await createImageVariants(tempPath, productDir, productSlug)
    
    // Nettoyer le fichier temporaire
    fs.unlinkSync(tempPath)
    
    console.log(`✅ Migration réussie: ${variants.length} images créées`)
    
    return {
      productId: id,
      productName: name,
      productSlug,
      categoryFolder,
      mainImage: `/images/bijoux/${categoryFolder}/${productSlug}/main.webp`,
      thumbnail: `/images/bijoux/${categoryFolder}/${productSlug}/thumbnail.webp`,
      gallery: [
        `/images/bijoux/${categoryFolder}/${productSlug}/gallery-1.webp`,
        `/images/bijoux/${categoryFolder}/${productSlug}/gallery-2.webp`,
        `/images/bijoux/${categoryFolder}/${productSlug}/gallery-3.webp`
      ]
    }
  } catch (error) {
    console.error(`❌ Erreur migration ${name}:`, error.message)
    return null
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Migration des images externes vers locales...\n')
  
  // Lire les produits depuis sample-bijoux.ts
  const productsFile = path.join(__dirname, '..', 'data', 'sample-bijoux.ts')
  const content = fs.readFileSync(productsFile, 'utf-8')
  
  // Extraire les produits avec regex (approximation)
  const productMatches = content.matchAll(/id:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?category_id:\s*"([^"]+)",[\s\S]*?image_url:\s*"([^"]+)"/g)
  
  const products = []
  for (const match of productMatches) {
    products.push({
      id: match[1],
      name: match[2],
      category_id: match[3],
      image_url: match[4]
    })
  }
  
  console.log(`📦 ${products.length} produits trouvés\n`)
  
  const results = []
  for (const product of products) {
    const result = await migrateProductImage(product)
    if (result) {
      results.push(result)
    }
    // Pause pour éviter de surcharger
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\n\n✨ Migration terminée !`)
  console.log(`✅ ${results.length} produits migrés`)
  console.log(`\n📋 Résultats:`)
  results.forEach(r => {
    console.log(`  - ${r.productName}: ${r.mainImage}`)
  })
  
  return results
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { migrateProductImage, generateSlug, getCategoryFolder }

