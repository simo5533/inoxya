/**
 * Mapping complet des images pour tous les produits INOXYA
 * Structure organisée par catégories et produits
 * ✅ 25 produits mappés
 */

export interface ProductImageSet {
  main: string
  gallery: string[]
  thumbnail: string
  variants?: string[]
}

// Fonction utilitaire pour générer un slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

// Fonction pour obtenir le dossier de catégorie
function getCategoryFolder(categoryId: string): string {
  const map: Record<string, string> = {
    'cat-bagues': 'bagues',
    'cat-colliers': 'colliers',
    'cat-bracelets': 'bracelets',
    'cat-boucles': 'boucles-oreilles',
    'cat-broches': 'broches'
  }
  return map[categoryId] || 'general'
}

// Fonction pour générer les chemins d'images d'un produit
function generateProductPaths(productName: string, categoryId: string): ProductImageSet {
  const categoryFolder = getCategoryFolder(categoryId)
  const productSlug = generateSlug(productName)
  const basePath = `/images/bijoux/${categoryFolder}/${productSlug}`
  
  return {
    main: `${basePath}/main.webp`,
    gallery: [
      `${basePath}/gallery-1.webp`,
      `${basePath}/gallery-2.webp`,
      `${basePath}/gallery-3.webp`
    ],
    thumbnail: `${basePath}/thumbnail.webp`
  }
}

export const productImages: Record<string, ProductImageSet> = {
  // BAGUES (8 produits)
  "bijou-1": generateProductPaths("Bague Berbère Or 18K", "cat-bagues"),
  "bijou-2": generateProductPaths("Bague Alliance Diamantée", "cat-bagues"),
  "bijou-3": generateProductPaths("Bague Solitaire Premium", "cat-bagues"),
  "bijou-4": generateProductPaths("Bague Vintage Art Déco", "cat-bagues"),
  "bijou-5": generateProductPaths("Bague Éternité Diamants", "cat-bagues"),
  "bijou-22": generateProductPaths("Bague Cœur Romantique", "cat-bagues"),

  // COLLIERS (4 produits)
  "bijou-6": generateProductPaths("Collier Filigrane Argent", "cat-colliers"),
  "bijou-7": generateProductPaths("Collier Pendentif Lune", "cat-colliers"),
  "bijou-8": generateProductPaths("Collier Ras de Cou Moderne", "cat-colliers"),
  "bijou-9": generateProductPaths("Collier Perles de Culture", "cat-colliers"),
  "bijou-23": generateProductPaths("Collier Chaine Maille", "cat-colliers"),

  // BRACELETS (5 produits)
  "bijou-10": generateProductPaths("Bracelet Khomsa Protection", "cat-bracelets"),
  "bijou-11": generateProductPaths("Bracelet Tennis Luxe", "cat-bracelets"),
  "bijou-12": generateProductPaths("Bracelet Chaîne Gourmette", "cat-bracelets"),
  "bijou-13": generateProductPaths("Bracelet Élastique Perles", "cat-bracelets"),
  "bijou-24": generateProductPaths("Bracelet Perles Naturelles", "cat-bracelets"),

  // BOUCLES D'OREILLES (4 produits)
  "bijou-14": generateProductPaths("Boucles Créoles Berbères", "cat-boucles"),
  "bijou-15": generateProductPaths("Boucles Pendantes Cascade", "cat-boucles"),
  "bijou-16": generateProductPaths("Boucles Clous Diamants", "cat-boucles"),
  "bijou-25": generateProductPaths("Boucles Étoiles Dorées", "cat-boucles"),

  // BROCHES (2 produits)
  "bijou-20": generateProductPaths("Broche Papillon Doré", "cat-broches"),
  "bijou-21": generateProductPaths("Broche Fleur Émaillée", "cat-broches")
}

// Images des packs (tous les packs)
export const packImages: Record<string, ProductImageSet> = {
  "pack-1": {
    main: "/images/packs/pack-elegance-berbere/main.webp",
    gallery: [
      "/images/packs/pack-elegance-berbere/composition.webp",
      "/images/packs/pack-elegance-berbere/packaging.webp"
    ],
    thumbnail: "/images/packs/pack-elegance-berbere/thumbnail.webp"
  },
  "pack-2": {
    main: "/images/packs/pack-moderne-chic/main.webp",
    gallery: [
      "/images/packs/pack-moderne-chic/composition.webp"
    ],
    thumbnail: "/images/packs/pack-moderne-chic/thumbnail.webp"
  },
  "pack-3": {
    main: "/images/packs/pack-mariee-royale/main.webp",
    gallery: [
      "/images/packs/pack-mariee-royale/composition.webp",
      "/images/packs/pack-mariee-royale/packaging.webp"
    ],
    thumbnail: "/images/packs/pack-mariee-royale/thumbnail.webp"
  },
  "pack-4": {
    main: "/images/packs/pack-quotidien-premium/main.webp",
    gallery: [
      "/images/packs/pack-quotidien-premium/composition.webp"
    ],
    thumbnail: "/images/packs/pack-quotidien-premium/thumbnail.webp"
  },
  "pack-5": {
    main: "/images/packs/pack-soiree-elegante/main.webp",
    gallery: [
      "/images/packs/pack-soiree-elegante/composition.webp"
    ],
    thumbnail: "/images/packs/pack-soiree-elegante/thumbnail.webp"
  },
  "pack-6": {
    main: "/images/packs/pack-romantique/main.webp",
    gallery: [
      "/images/packs/pack-romantique/composition.webp"
    ],
    thumbnail: "/images/packs/pack-romantique/thumbnail.webp"
  }
}

// Images des catégories (toutes les catégories)
export const categoryImages: Record<string, string> = {
  "cat-bagues": "/images/categories/bagues-category.webp",
  "cat-colliers": "/images/categories/colliers-category.webp",
  "cat-bracelets": "/images/categories/bracelets-category.webp",
  "cat-boucles": "/images/categories/boucles-category.webp",
  "cat-broches": "/images/categories/broches-category.webp"
}

/**
 * Fonction utilitaire pour obtenir les images d'un produit
 */
export function getProductImages(productId: string): ProductImageSet | null {
  return productImages[productId] || null
}

/**
 * Fonction utilitaire pour obtenir les images d'un pack
 */
export function getPackImages(packId: string): ProductImageSet | null {
  return packImages[packId] || null
}

/**
 * Fonction utilitaire pour obtenir l'image d'une catégorie
 */
export function getCategoryImage(categoryId: string): string | null {
  return categoryImages[categoryId] || null
}

/**
 * Fonction pour obtenir l'image principale d'un produit
 */
export function getMainImage(productId: string): string {
  const images = getProductImages(productId) || getPackImages(productId)
  return images?.main || "/placeholder.svg"
}

/**
 * Fonction pour obtenir la galerie d'images d'un produit
 */
export function getImageGallery(productId: string): string[] {
  const images = getProductImages(productId) || getPackImages(productId)
  return images?.gallery || []
}

/**
 * Fonction pour obtenir le thumbnail d'un produit
 */
export function getThumbnail(productId: string): string {
  const images = getProductImages(productId) || getPackImages(productId)
  return images?.thumbnail || "/placeholder.svg"
}
