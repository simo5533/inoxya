#!/usr/bin/env node
/**
 * Script d'optimisation complète des images pour production
 * - Convertit en WebP
 * - Optimise la compression
 * - Génère plusieurs tailles
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Configuration d'optimisation
const OPTIMIZATION_CONFIG = {
  quality: 85, // Production: 85, Dev: 90
  effort: 6, // Compression effort (0-6)
  formats: ['webp'], // Formats à générer
  sizes: {
    thumbnail: { width: 200, height: 200 },
    small: { width: 400, height: 400 },
    medium: { width: 800, height: 800 },
    large: { width: 1200, height: 1200 }
  }
}

// Dossiers à traiter
const IMAGE_DIRS = [
  'public/images/bijoux',
  'public/images/packs',
  'public/images/categories',
  'public/images/products'
]

// Extensions supportées
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']

async function optimizeImage(inputPath, outputPath, options) {
  try {
    const stats = fs.statSync(inputPath)
    const originalSize = stats.size
    
    await sharp(inputPath)
      .resize(options.width, options.height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true // Ne pas agrandir les petites images
      })
      .webp({
        quality: OPTIMIZATION_CONFIG.quality,
        effort: OPTIMIZATION_CONFIG.effort,
        nearLossless: false
      })
      .toFile(outputPath)
    
    const newStats = fs.statSync(outputPath)
    const newSize = newStats.size
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1)
    
    log(`   ✅ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${savings}% économisé)`, 'green')
    return { originalSize, newSize, savings: parseFloat(savings) }
  } catch (error) {
    log(`   ❌ Erreur avec ${inputPath}: ${error.message}`, 'red')
    return null
  }
}

async function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return { processed: 0, totalSize: 0, saved: 0 }
  }
  
  const files = fs.readdirSync(dirPath, { withFileTypes: true })
  let processed = 0
  let totalOriginalSize = 0
  let totalNewSize = 0
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name)
    
    if (file.isDirectory()) {
      const subResult = await processDirectory(fullPath)
      processed += subResult.processed
      totalOriginalSize += subResult.totalSize
      totalNewSize += subResult.saved
      continue
    }
    
    const ext = path.extname(file.name).toLowerCase()
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      continue
    }
    
    // Ne pas traiter les fichiers déjà optimisés
    if (file.name.endsWith('.webp') || file.name.includes('-optimized')) {
      continue
    }
    
    const nameWithoutExt = path.basename(file.name, ext)
    const outputPath = path.join(dirPath, `${nameWithoutExt}.webp`)
    
    // Utiliser la taille medium par défaut
    const result = await optimizeImage(fullPath, outputPath, OPTIMIZATION_CONFIG.sizes.medium)
    
    if (result) {
      processed++
      totalOriginalSize += result.originalSize
      totalNewSize += result.newSize
      
      // Optionnel: supprimer l'original après optimisation
      // fs.unlinkSync(fullPath)
    }
  }
  
  return { processed, totalSize: totalOriginalSize, saved: totalNewSize }
}

async function main() {
  log('\n🖼️  Optimisation des Images - Production', 'magenta')
  log('='.repeat(60), 'cyan')
  
  log('\n📋 Configuration:', 'blue')
  log(`   Qualité: ${OPTIMIZATION_CONFIG.quality}%`, 'blue')
  log(`   Effort: ${OPTIMIZATION_CONFIG.effort}/6`, 'blue')
  log(`   Format: ${OPTIMIZATION_CONFIG.formats.join(', ')}`, 'blue')
  
  let totalProcessed = 0
  let totalOriginalSize = 0
  let totalNewSize = 0
  
  for (const dir of IMAGE_DIRS) {
    const dirPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(dirPath)) {
      log(`\n⏭️  ${dir} n'existe pas`, 'yellow')
      continue
    }
    
    log(`\n📁 Traitement de ${dir}...`, 'cyan')
    const result = await processDirectory(dirPath)
    
    totalProcessed += result.processed
    totalOriginalSize += result.totalSize
    totalNewSize += result.saved
    
    if (result.processed > 0) {
      const savings = ((result.totalSize - result.saved) / result.totalSize * 100).toFixed(1)
      log(`   📊 ${result.processed} images traitées (${savings}% économisé)`, 'green')
    } else {
      log(`   ℹ️  Aucune image à traiter`, 'blue')
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan')
  log('📊 RÉSUMÉ\n', 'magenta')
  
  if (totalProcessed > 0) {
    const totalSavings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1)
    const originalMB = (totalOriginalSize / 1024 / 1024).toFixed(2)
    const newMB = (totalNewSize / 1024 / 1024).toFixed(2)
    const savedMB = ((totalOriginalSize - totalNewSize) / 1024 / 1024).toFixed(2)
    
    log(`   Images traitées: ${totalProcessed}`, 'green')
    log(`   Taille originale: ${originalMB} MB`, 'blue')
    log(`   Taille optimisée: ${newMB} MB`, 'blue')
    log(`   Économisé: ${savedMB} MB (${totalSavings}%)`, 'green')
  } else {
    log('   ℹ️  Aucune image à optimiser', 'blue')
  }
  
  log('\n💡 Astuce:', 'cyan')
  log('   Les images sont converties en WebP pour une meilleure compression', 'blue')
  log('   Les originaux sont conservés (décommentez fs.unlinkSync pour les supprimer)', 'blue')
  
  log('\n' + '='.repeat(60) + '\n', 'cyan')
}

main().catch((error) => {
  log(`\n❌ Erreur: ${error.message}`, 'red')
  process.exit(1)
})

