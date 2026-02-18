/**
 * Script pour ajouter des images de produits INOXYA
 * Automatise la création des dossiers et la copie des images
 */

const fs = require('fs')
const path = require('path')

// Configuration des produits avec leurs images
const productsToAdd = [
  {
    id: "bijou-1",
    name: "Bague Berbère Or 18K",
    category: "bagues",
    folder: "bague-berbere-or-18k",
    images: {
      main: "main.jpg",
      gallery1: "gallery-1.jpg", 
      gallery2: "gallery-2.jpg",
      gallery3: "gallery-3.jpg",
      thumbnail: "thumbnail.jpg"
    }
  },
  {
    id: "bijou-2", 
    name: "Bague Alliance Diamantée",
    category: "bagues",
    folder: "bague-alliance-diamantee",
    images: {
      main: "main.jpg",
      gallery1: "gallery-1.jpg",
      gallery2: "gallery-2.jpg", 
      thumbnail: "thumbnail.jpg"
    }
  },
  {
    id: "bijou-3",
    name: "Bague Solitaire Premium", 
    category: "bagues",
    folder: "bague-solitaire-premium",
    images: {
      main: "main.jpg",
      gallery1: "gallery-1.jpg",
      gallery2: "gallery-2.jpg",
      gallery3: "gallery-3.jpg",
      thumbnail: "thumbnail.jpg"
    }
  },
  {
    id: "bijou-6",
    name: "Collier Filigrane Argent",
    category: "colliers", 
    folder: "collier-filigrane-argent",
    images: {
      main: "main.jpg",
      gallery1: "gallery-1.jpg",
      gallery2: "gallery-2.jpg",
      thumbnail: "thumbnail.jpg"
    }
  },
  {
    id: "bijou-8",
    name: "Bracelet Khomsa Protection",
    category: "bracelets",
    folder: "bracelet-khomsa-protection", 
    images: {
      main: "main.jpg",
      gallery1: "gallery-1.jpg",
      gallery2: "gallery-2.jpg",
      thumbnail: "thumbnail.jpg"
    }
  }
]

// Configuration des packs
const packsToAdd = [
  {
    id: "pack-1",
    name: "Pack Élégance Berbère",
    folder: "pack-elegance-berbere",
    images: {
      main: "main.jpg",
      composition: "composition.jpg", 
      packaging: "packaging.jpg",
      thumbnail: "thumbnail.jpg"
    }
  },
  {
    id: "pack-2",
    name: "Pack Moderne Chic",
    folder: "pack-moderne-chic",
    images: {
      main: "main.jpg",
      composition: "composition.jpg",
      thumbnail: "thumbnail.jpg"
    }
  },
  {
    id: "pack-3", 
    name: "Pack Mariée Royale",
    folder: "pack-mariee-royale",
    images: {
      main: "main.jpg",
      composition: "composition.jpg",
      packaging: "packaging.jpg", 
      thumbnail: "thumbnail.jpg"
    }
  }
]

/**
 * Créer un dossier s'il n'existe pas
 */
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`📁 Dossier créé: ${dirPath}`)
    } else {
      console.log(`📁 Dossier existe déjà: ${dirPath}`)
    }
  } catch (error) {
    console.error(`❌ Erreur création dossier: ${error.message}`)
  }
}

/**
 * Créer un fichier placeholder pour une image
 */
function createImagePlaceholder(imagePath, productName, imageType) {
  const placeholderContent = `Placeholder pour ${productName} - ${imageType}
Remplacez ce fichier par votre vraie image
Dimensions recommandées: ${getRecommendedDimensions(imageType)}
Format: JPG, qualité 85-90%`
  
  const txtPath = imagePath.replace('.jpg', '.txt')
  try {
    fs.writeFileSync(txtPath, placeholderContent)
    console.log(`📝 Placeholder créé: ${txtPath}`)
  } catch (error) {
    console.error(`❌ Erreur création placeholder: ${error.message}`)
  }
}

/**
 * Obtenir les dimensions recommandées
 */
function getRecommendedDimensions(imageType) {
  const dimensions = {
    main: "800x800px",
    gallery: "600x600px", 
    thumbnail: "200x200px",
    composition: "800x600px",
    packaging: "800x600px"
  }
  return dimensions[imageType] || "800x600px"
}

/**
 * Traiter les produits
 */
function processProducts() {
  console.log('🚀 Traitement des produits...\n')
  
  productsToAdd.forEach(product => {
    const productDir = path.join('public', 'images', 'bijoux', product.category, product.folder)
    
    console.log(`📦 Produit: ${product.name}`)
    console.log(`📁 Dossier: ${productDir}`)
    
    // Créer le dossier
    ensureDirectoryExists(productDir)
    
    // Créer les placeholders d'images
    Object.entries(product.images).forEach(([type, filename]) => {
      const imagePath = path.join(productDir, filename)
      createImagePlaceholder(imagePath, product.name, type)
    })
    
    console.log('')
  })
}

/**
 * Traiter les packs
 */
function processPacks() {
  console.log('🎁 Traitement des packs...\n')
  
  packsToAdd.forEach(pack => {
    const packDir = path.join('public', 'images', 'packs', pack.folder)
    
    console.log(`📦 Pack: ${pack.name}`)
    console.log(`📁 Dossier: ${packDir}`)
    
    // Créer le dossier
    ensureDirectoryExists(packDir)
    
    // Créer les placeholders d'images
    Object.entries(pack.images).forEach(([type, filename]) => {
      const imagePath = path.join(packDir, filename)
      createImagePlaceholder(imagePath, pack.name, type)
    })
    
    console.log('')
  })
}

/**
 * Générer les instructions
 */
function generateInstructions() {
  console.log('📋 INSTRUCTIONS POUR AJOUTER VOS IMAGES:\n')
  
  console.log('1️⃣ PRÉPARER VOS IMAGES:')
  console.log('   - Prenez des photos de vos bijoux')
  console.log('   - Utilisez un fond neutre (blanc/gris)')
  console.log('   - Assurez-vous d\'un bon éclairage')
  console.log('   - Prenez plusieurs angles\n')
  
  console.log('2️⃣ RENOMMER VOS FICHIERS:')
  console.log('   - main.jpg (image principale)')
  console.log('   - gallery-1.jpg, gallery-2.jpg (galerie)')
  console.log('   - thumbnail.jpg (miniature)')
  console.log('   - composition.jpg (pour les packs)')
  console.log('   - packaging.jpg (pour les packs)\n')
  
  console.log('3️⃣ COPIER DANS LES BONS DOSSIERS:')
  productsToAdd.forEach(product => {
    console.log(`   ${product.name}:`)
    console.log(`   → public/images/bijoux/${product.category}/${product.folder}/`)
  })
  
  packsToAdd.forEach(pack => {
    console.log(`   ${pack.name}:`)
    console.log(`   → public/images/packs/${pack.folder}/`)
  })
  
  console.log('\n4️⃣ VÉRIFIER:')
  console.log('   - Redémarrez le serveur: npm run dev')
  console.log('   - Vérifiez sur http://localhost:3001')
  console.log('   - Testez sur mobile et desktop\n')
}

/**
 * Fonction principale
 */
function main() {
  console.log('✨ SCRIPT D\'AJOUT D\'IMAGES INOXYA BIJOUX ✨\n')
  
  // Traiter les produits
  processProducts()
  
  // Traiter les packs  
  processPacks()
  
  // Générer les instructions
  generateInstructions()
  
  console.log('🎉 Script terminé ! Suivez les instructions ci-dessus pour ajouter vos images.')
}

// Exécuter le script
if (require.main === module) {
  main()
}

module.exports = { processProducts, processPacks, productsToAdd, packsToAdd }
