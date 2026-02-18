/**
 * Script complet pour corriger tout le système d'images
 * - Crée les dossiers manquants
 * - Génère les chemins pour tous les produits
 * - Prépare la migration
 */

const fs = require('fs')
const path = require('path')

/**
 * Génère un slug
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
 * Crée tous les dossiers nécessaires
 */
function createMissingFolders() {
  console.log('📁 Création des dossiers manquants...\n')
  
  const baseDir = path.join(__dirname, '..', 'public', 'images')
  
  // Dossiers de catégories
  const categories = ['boucles-oreilles', 'parures', 'broches']
  categories.forEach(cat => {
    const dir = path.join(baseDir, 'bijoux', cat)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✅ Créé: ${dir}`)
    }
  })
  
  // Dossier categories
  const categoriesDir = path.join(baseDir, 'categories')
  if (!fs.existsSync(categoriesDir)) {
    fs.mkdirSync(categoriesDir, { recursive: true })
    console.log(`✅ Créé: ${categoriesDir}`)
  }
  
  // Dossier products
  const productsDir = path.join(baseDir, 'products')
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true })
    console.log(`✅ Créé: ${productsDir}`)
  }
  
  console.log('\n✨ Dossiers créés !\n')
}

/**
 * Génère les chemins d'images pour tous les produits
 */
function generateImagePaths() {
  console.log('🖼️  Génération des chemins d\'images...\n')
  
  // Produits depuis sample-bijoux.ts
  const products = [
    { id: 'bijou-1', name: 'Bague Berbère Or 18K', category: 'cat-bagues' },
    { id: 'bijou-2', name: 'Bague Alliance Diamantée', category: 'cat-bagues' },
    { id: 'bijou-3', name: 'Bague Solitaire Premium', category: 'cat-bagues' },
    { id: 'bijou-4', name: 'Bague Vintage Art Déco', category: 'cat-bagues' },
    { id: 'bijou-5', name: 'Bague Éternité Diamants', category: 'cat-bagues' },
    { id: 'bijou-6', name: 'Collier Filigrane Argent', category: 'cat-colliers' },
    { id: 'bijou-7', name: 'Collier Pendentif Lune', category: 'cat-colliers' },
    { id: 'bijou-8', name: 'Collier Ras de Cou Moderne', category: 'cat-colliers' },
    { id: 'bijou-9', name: 'Collier Perles de Culture', category: 'cat-colliers' },
    { id: 'bijou-10', name: 'Bracelet Khomsa Protection', category: 'cat-bracelets' },
    { id: 'bijou-11', name: 'Bracelet Tennis Luxe', category: 'cat-bracelets' },
    { id: 'bijou-12', name: 'Bracelet Chaîne Gourmette', category: 'cat-bracelets' },
    { id: 'bijou-13', name: 'Bracelet Élastique Perles', category: 'cat-bracelets' },
    { id: 'bijou-14', name: 'Boucles Créoles Berbères', category: 'cat-boucles' },
    { id: 'bijou-15', name: 'Boucles Pendantes Cascade', category: 'cat-boucles' },
    { id: 'bijou-16', name: 'Boucles Clous Diamants', category: 'cat-boucles' },
    { id: 'bijou-17', name: 'Parure Mariée Royale', category: 'cat-parures' },
    { id: 'bijou-18', name: 'Parure Berbère Authentique', category: 'cat-parures' },
    { id: 'bijou-19', name: 'Parure Soirée Élégante', category: 'cat-parures' },
    { id: 'bijou-20', name: 'Broche Papillon Doré', category: 'cat-broches' },
    { id: 'bijou-21', name: 'Broche Fleur Émaillée', category: 'cat-broches' },
    { id: 'bijou-22', name: 'Bague Cœur Romantique', category: 'cat-bagues' },
    { id: 'bijou-23', name: 'Collier Chaine Maille', category: 'cat-colliers' },
    { id: 'bijou-24', name: 'Bracelet Perles Naturelles', category: 'cat-bracelets' },
    { id: 'bijou-25', name: 'Boucles Étoiles Dorées', category: 'cat-boucles' }
  ]
  
  const paths = {}
  
  products.forEach(product => {
    const categoryFolder = getCategoryFolder(product.category)
    const productSlug = generateSlug(product.name)
    const basePath = `/images/bijoux/${categoryFolder}/${productSlug}`
    
    paths[product.id] = {
      main: `${basePath}/main.webp`,
      thumbnail: `${basePath}/thumbnail.webp`,
      gallery: [
        `${basePath}/gallery-1.webp`,
        `${basePath}/gallery-2.webp`,
        `${basePath}/gallery-3.webp`
      ]
    }
    
    // Créer le dossier produit
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
      console.log(`📁 Dossier produit créé: ${productDir}`)
    }
  })
  
  console.log(`\n✅ ${products.length} produits traités`)
  return paths
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 Correction complète du système d\'images...\n')
  
  createMissingFolders()
  const paths = generateImagePaths()
  
  console.log('\n✨ Correction terminée !')
  console.log(`\n📋 Prochaines étapes:`)
  console.log(`1. Exécuter: node scripts/migrate-external-images.js`)
  console.log(`2. Vérifier: npm run images:check`)
  console.log(`3. Optimiser: npm run images:optimize`)
}

if (require.main === module) {
  main()
}

module.exports = { createMissingFolders, generateImagePaths }

