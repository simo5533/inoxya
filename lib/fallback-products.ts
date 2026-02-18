/**
 * Système de fallback pour afficher les produits depuis les images disponibles
 * Utilisé quand la base de données SQLite n'est pas accessible
 */

import fs from 'fs'
import path from 'path'

export interface FallbackProduct {
  id: string
  name: string
  description?: string
  price: number
  original_price?: number
  image_url: string
  category_id?: string
  is_available: boolean
  is_featured: boolean
}

/**
 * Récupère tous les produits depuis les images disponibles dans public/images/products/
 */
export function getFallbackProducts(): FallbackProduct[] {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    const productsDir = path.join(publicDir, 'images', 'products')
    
    if (!fs.existsSync(productsDir)) {
      return []
    }
    
    const products: FallbackProduct[] = []
    const files = fs.readdirSync(productsDir)
    
    // Filtrer uniquement les fichiers images
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
    })
    
    // Créer un produit pour chaque image
    imageFiles.forEach((file, index) => {
      const baseName = path.parse(file).name
      const imagePath = '/images/products/' + file
      
      // Générer un nom de produit basé sur le nom du fichier
      const productName = baseName
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      products.push({
        id: `fallback-product-${index + 1}`,
        name: productName || `Produit ${index + 1}`,
        description: `Bijou élégant et raffiné, qualité premium.`,
        price: 99.99 + (index % 10) * 20, // Prix variés entre 99.99 et 299.99
        original_price: 149.99 + (index % 10) * 30,
        image_url: imagePath,
        category_id: 'bagues', // Par défaut, peut être amélioré
        is_available: true,
        is_featured: index < 8 // Les 8 premiers sont featured
      })
    })
    
    return products
  } catch (error) {
    console.error('[getFallbackProducts] Erreur:', error)
    return []
  }
}

/**
 * Récupère les produits depuis les dossiers organisés dans public/images/bijoux/
 */
export function getFallbackProductsFromBijoux(): FallbackProduct[] {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    const bijouxDir = path.join(publicDir, 'images', 'bijoux')
    
    if (!fs.existsSync(bijouxDir)) {
      return []
    }
    
    const products: FallbackProduct[] = []
    const categories = fs.readdirSync(bijouxDir, { withFileTypes: true })
    
    // Mapping des dossiers vers les slugs de catégories
    const categoryMapping: Record<string, string> = {
      'bagues': 'bagues',
      'colliers': 'colliers',
      'bracelets': 'bracelets',
      'boucles-oreilles': 'boucles-oreilles',
      'parures': 'parures',
      'broches': 'broches'
    }
    
    let productIndex = 0
    
    for (const categoryDir of categories) {
      if (!categoryDir.isDirectory()) continue
      
      const categorySlug = categoryMapping[categoryDir.name] || categoryDir.name
      const categoryPath = path.join(bijouxDir, categoryDir.name)
      const productDirs = fs.readdirSync(categoryPath, { withFileTypes: true })
      
      for (const productDir of productDirs) {
        if (!productDir.isDirectory()) continue
        
        const productPath = path.join(categoryPath, productDir.name)
        const files = fs.readdirSync(productPath)
        
        // Chercher main.jpg, thumbnail.jpg, ou la première image
        let imageFile = files.find(f => f === 'main.jpg') ||
                       files.find(f => f === 'thumbnail.jpg') ||
                       files.find(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        
        if (imageFile) {
          const imagePath = `/images/bijoux/${categoryDir.name}/${productDir.name}/${imageFile}`
          const productName = productDir.name
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          products.push({
            id: `fallback-bijou-${productIndex + 1}`,
            name: productName || `Bijou ${productIndex + 1}`,
            description: `Bijou élégant de la catégorie ${categoryDir.name}, qualité premium.`,
            price: 79.99 + (productIndex % 15) * 15,
            original_price: 119.99 + (productIndex % 15) * 25,
            image_url: imagePath,
            category_id: categorySlug,
            is_available: true,
            is_featured: productIndex < 12
          })
          
          productIndex++
        }
      }
    }
    
    return products
  } catch (error) {
    console.error('[getFallbackProductsFromBijoux] Erreur:', error)
    return []
  }
}

/**
 * Combine les produits depuis products/ et bijoux/
 */
export function getAllFallbackProducts(): FallbackProduct[] {
  const productsFromProducts = getFallbackProducts()
  const productsFromBijoux = getFallbackProductsFromBijoux()
  
  // Combiner et dédupliquer par image_url
  const allProducts = [...productsFromBijoux, ...productsFromProducts]
  const uniqueProducts = Array.from(
    new Map(allProducts.map(p => [p.image_url, p])).values()
  )
  
  return uniqueProducts
}

