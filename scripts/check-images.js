/**
 * Script de vérification des images INOXYA
 * Vérifie que toutes les images référencées existent bien
 */

const fs = require('fs')
const path = require('path')

// Chemins des dossiers d'images
const imagePaths = {
  bijoux: 'public/images/bijoux',
  packs: 'public/images/packs',
  categories: 'public/images/categories'
}

// Images attendues (basées sur product-images.ts)
const expectedImages = {
  // Bagues
  'bijou-1': [
    'public/images/bijoux/bagues/bague-berbere-or-18k/main.jpg',
    'public/images/bijoux/bagues/bague-berbere-or-18k/gallery-1.jpg',
    'public/images/bijoux/bagues/bague-berbere-or-18k/gallery-2.jpg',
    'public/images/bijoux/bagues/bague-berbere-or-18k/gallery-3.jpg',
    'public/images/bijoux/bagues/bague-berbere-or-18k/thumbnail.jpg'
  ],
  'bijou-2': [
    'public/images/bijoux/bagues/bague-alliance-diamantee/main.jpg',
    'public/images/bijoux/bagues/bague-alliance-diamantee/gallery-1.jpg',
    'public/images/bijoux/bagues/bague-alliance-diamantee/gallery-2.jpg',
    'public/images/bijoux/bagues/bague-alliance-diamantee/thumbnail.jpg'
  ],
  'bijou-3': [
    'public/images/bijoux/bagues/bague-solitaire-premium/main.jpg',
    'public/images/bijoux/bagues/bague-solitaire-premium/gallery-1.jpg',
    'public/images/bijoux/bagues/bague-solitaire-premium/gallery-2.jpg',
    'public/images/bijoux/bagues/bague-solitaire-premium/gallery-3.jpg',
    'public/images/bijoux/bagues/bague-solitaire-premium/thumbnail.jpg'
  ],
  // Colliers
  'bijou-6': [
    'public/images/bijoux/colliers/collier-filigrane-argent/main.jpg',
    'public/images/bijoux/colliers/collier-filigrane-argent/gallery-1.jpg',
    'public/images/bijoux/colliers/collier-filigrane-argent/gallery-2.jpg',
    'public/images/bijoux/colliers/collier-filigrane-argent/thumbnail.jpg'
  ],
  // Bracelets
  'bijou-10': [
    'public/images/bijoux/bracelets/bracelet-khomsa-protection/main.jpg',
    'public/images/bijoux/bracelets/bracelet-khomsa-protection/gallery-1.jpg',
    'public/images/bijoux/bracelets/bracelet-khomsa-protection/gallery-2.jpg',
    'public/images/bijoux/bracelets/bracelet-khomsa-protection/thumbnail.jpg'
  ],
  // Packs
  'pack-1': [
    'public/images/packs/pack-elegance-berbere/main.jpg',
    'public/images/packs/pack-elegance-berbere/composition.jpg',
    'public/images/packs/pack-elegance-berbere/packaging.jpg',
    'public/images/packs/pack-elegance-berbere/thumbnail.jpg'
  ],
  'pack-2': [
    'public/images/packs/pack-moderne-chic/main.jpg',
    'public/images/packs/pack-moderne-chic/composition.jpg',
    'public/images/packs/pack-moderne-chic/thumbnail.jpg'
  ],
  'pack-3': [
    'public/images/packs/pack-mariee-royale/main.jpg',
    'public/images/packs/pack-mariee-royale/composition.jpg',
    'public/images/packs/pack-mariee-royale/packaging.jpg',
    'public/images/packs/pack-mariee-royale/thumbnail.jpg'
  ]
}

/**
 * Vérifie si un fichier existe
 */
function fileExists(filePath) {
  return fs.existsSync(filePath)
}

/**
 * Vérifie les images d'un produit
 */
function checkProductImages(productId, imageList) {
  const results = {
    productId,
    total: imageList.length,
    existing: 0,
    missing: [],
    existingFiles: []
  }

  imageList.forEach(imagePath => {
    if (fileExists(imagePath)) {
      results.existing++
      results.existingFiles.push(imagePath)
    } else {
      results.missing.push(imagePath)
    }
  })

  return results
}

/**
 * Vérifie la structure des dossiers
 */
function checkFolderStructure() {
  const results = {
    existing: [],
    missing: []
  }

  Object.values(imagePaths).forEach(folderPath => {
    if (fs.existsSync(folderPath)) {
      results.existing.push(folderPath)
    } else {
      results.missing.push(folderPath)
    }
  })

  return results
}

/**
 * Génère un rapport de vérification
 */
function generateReport() {
  console.log('🔍 Vérification des images INOXYA...\n')

  // Vérifier la structure des dossiers
  const folderCheck = checkFolderStructure()
  
  console.log('📁 Structure des dossiers:')
  folderCheck.existing.forEach(folder => {
    console.log(`  ✅ ${folder}`)
  })
  folderCheck.missing.forEach(folder => {
    console.log(`  ❌ ${folder}`)
  })
  console.log('')

  // Vérifier les images des produits
  console.log('🖼️ Images des produits:')
  let totalImages = 0
  let totalExisting = 0
  let totalMissing = 0

  Object.entries(expectedImages).forEach(([productId, imageList]) => {
    const result = checkProductImages(productId, imageList)
    totalImages += result.total
    totalExisting += result.existing
    totalMissing += result.missing.length

    console.log(`\n  📦 ${productId}:`)
    console.log(`    Total: ${result.total} | Existantes: ${result.existing} | Manquantes: ${result.missing.length}`)
    
    if (result.missing.length > 0) {
      console.log(`    ❌ Images manquantes:`)
      result.missing.forEach(image => {
        console.log(`      - ${image}`)
      })
    }
    
    if (result.existing.length > 0) {
      console.log(`    ✅ Images existantes:`)
      result.existingFiles.forEach(image => {
        console.log(`      - ${image}`)
      })
    }
  })

  // Résumé global
  console.log('\n📊 Résumé global:')
  console.log(`  Total d'images attendues: ${totalImages}`)
  console.log(`  Images existantes: ${totalExisting}`)
  console.log(`  Images manquantes: ${totalMissing}`)
  console.log(`  Pourcentage de complétude: ${Math.round((totalExisting / totalImages) * 100)}%`)

  // Recommandations
  console.log('\n💡 Recommandations:')
  if (totalMissing > 0) {
    console.log('  1. Ajoutez les images manquantes dans les dossiers correspondants')
    console.log('  2. Suivez la convention de nommage définie dans README-IMAGES.md')
    console.log('  3. Utilisez le script d\'optimisation: node scripts/optimize-images.js')
  } else {
    console.log('  🎉 Toutes les images sont présentes !')
    console.log('  Vous pouvez maintenant utiliser le système d\'images complet.')
  }

  return {
    totalImages,
    totalExisting,
    totalMissing,
    completeness: Math.round((totalExisting / totalImages) * 100)
  }
}

/**
 * Fonction principale
 */
function main() {
  try {
    const report = generateReport()
    
    // Code de sortie basé sur le résultat
    if (report.totalMissing > 0) {
      console.log('\n⚠️  Des images sont manquantes. Vérifiez le rapport ci-dessus.')
      process.exit(1)
    } else {
      console.log('\n✅ Toutes les images sont présentes !')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message)
    process.exit(1)
  }
}

// Exécuter le script
if (require.main === module) {
  main()
}

module.exports = { checkProductImages, checkFolderStructure, generateReport }