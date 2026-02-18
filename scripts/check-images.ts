/**
 * Script pour vérifier et corriger les chemins d'images des produits et packs
 * Vérifie que les images existent dans public/images/ et corrige les chemins si nécessaire
 */

import { getProductsAsync, getPacksAsync } from '../lib/sqlite'
import fs from 'fs'
import path from 'path'

const publicDir = path.join(process.cwd(), 'public')

function checkImageExists(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false
  
  // Normaliser le chemin
  let normalizedPath = imagePath
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1)
  }
  
  const fullPath = path.join(publicDir, normalizedPath)
  return fs.existsSync(fullPath)
}

function findImageInPublic(imageName: string): string | null {
  // Chercher dans différents dossiers
  const searchDirs = [
    'images/products',
    'images/packs',
    'images/bijoux',
    'images'
  ]
  
  for (const dir of searchDirs) {
    const searchPath = path.join(publicDir, dir)
    if (!fs.existsSync(searchPath)) continue
    
    // Chercher récursivement
    function searchRecursive(currentPath: string): string | null {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)
        
        if (entry.isDirectory()) {
          const found = searchRecursive(fullPath)
          if (found) return found
        } else if (entry.isFile()) {
          // Vérifier si le nom correspond (sans extension)
          const entryName = path.parse(entry.name).name.toLowerCase()
          const searchName = path.parse(imageName).name.toLowerCase()
          
          if (entryName === searchName || entry.name.toLowerCase() === imageName.toLowerCase()) {
            // Retourner le chemin relatif depuis public
            return '/' + path.relative(publicDir, fullPath).replace(/\\/g, '/')
          }
        }
      }
      
      return null
    }
    
    const found = searchRecursive(searchPath)
    if (found) return found
  }
  
  return null
}

async function main() {
  console.log('🔍 Vérification des images des produits et packs...\n')

  // Vérifier les produits
  console.log('📦 PRODUITS:')
  const products = await getProductsAsync()
  let productsWithMissingImages = 0
  let productsWithValidImages = 0

  products.forEach((product: any) => {
  const imageUrl = product.image_url || (product as any).main_image
  if (!imageUrl) {
    console.log(`  ⚠️  ${product.name}: Pas d'image définie`)
    productsWithMissingImages++
    return
  }
  
  if (checkImageExists(imageUrl)) {
    console.log(`  ✅ ${product.name}: ${imageUrl}`)
    productsWithValidImages++
  } else {
    console.log(`  ❌ ${product.name}: Image manquante - ${imageUrl}`)
    
    // Essayer de trouver l'image
    const fileName = path.basename(imageUrl)
    const found = findImageInPublic(fileName)
    if (found) {
      console.log(`     💡 Image trouvée à: ${found}`)
    }
    
    productsWithMissingImages++
  }
})

  console.log(`\n📊 Résumé produits: ${productsWithValidImages} valides, ${productsWithMissingImages} manquantes\n`)

  // Vérifier les packs
  console.log('📦 PACKS:')
  const packs = await getPacksAsync()
  let packsWithMissingImages = 0
  let packsWithValidImages = 0

  packs.forEach((pack: any) => {
  const imageUrl = pack.image_url
  if (!imageUrl) {
    console.log(`  ⚠️  ${pack.name}: Pas d'image définie`)
    packsWithMissingImages++
    return
  }
  
  if (checkImageExists(imageUrl)) {
    console.log(`  ✅ ${pack.name}: ${imageUrl}`)
    packsWithValidImages++
  } else {
    console.log(`  ❌ ${pack.name}: Image manquante - ${imageUrl}`)
    
    // Essayer de trouver l'image
    const fileName = path.basename(imageUrl)
    const found = findImageInPublic(fileName)
    if (found) {
      console.log(`     💡 Image trouvée à: ${found}`)
    }
    
    packsWithMissingImages++
  }
})

  console.log(`\n📊 Résumé packs: ${packsWithValidImages} valides, ${packsWithMissingImages} manquantes`)

  console.log('\n💡 Pour corriger les chemins, utilisez le script scripts/fix-image-paths.ts')
}

main().catch(console.error)

