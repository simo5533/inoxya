/**
 * Utilitaires pour la gestion des images INOXYA
 * Fonctions de génération de slugs, chemins, etc.
 */

/**
 * Génère un slug à partir d'un nom de produit
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Obtient le nom du dossier de catégorie à partir de category_id
 */
export function getCategoryFolder(categoryId: string): string {
  const categoryMap: Record<string, string> = {
    'cat-bagues': 'bagues',
    'cat-colliers': 'colliers',
    'cat-bracelets': 'bracelets',
    'cat-boucles': 'boucles-oreilles',
    'cat-broches': 'broches'
  }
  return categoryMap[categoryId] || 'general'
}

/**
 * Génère le chemin complet pour les images d'un produit
 */
export function getProductImagePath(
  _productId: string,
  productName: string,
  categoryId: string,
  imageType: 'main' | 'gallery' | 'thumbnail' = 'main',
  galleryIndex?: number
): string {
  const categoryFolder = getCategoryFolder(categoryId)
  const productSlug = generateSlug(productName)
  
  let filename = 'main.webp'
  if (imageType === 'thumbnail') {
    filename = 'thumbnail.webp'
  } else if (imageType === 'gallery' && galleryIndex !== undefined) {
    filename = `gallery-${galleryIndex + 1}.webp`
  }
  
  return `/images/bijoux/${categoryFolder}/${productSlug}/${filename}`
}

/**
 * Génère tous les chemins d'images pour un produit
 */
export function generateProductImagePaths(
  _productId: string,
  productName: string,
  categoryId: string,
  galleryCount: number = 3
): {
  main: string
  thumbnail: string
  gallery: string[]
} {
  const categoryFolder = getCategoryFolder(categoryId)
  const productSlug = generateSlug(productName)
  const basePath = `/images/bijoux/${categoryFolder}/${productSlug}`
  
  return {
    main: `${basePath}/main.webp`,
    thumbnail: `${basePath}/thumbnail.webp`,
    gallery: Array.from({ length: galleryCount }, (_, i) => 
      `${basePath}/gallery-${i + 1}.webp`
    )
  }
}

/**
 * Génère le chemin pour les images de pack
 */
export function getPackImagePath(
  packSlug: string,
  imageType: 'main' | 'composition' | 'packaging' | 'thumbnail' = 'main'
): string {
  let filename = 'main.webp'
  if (imageType === 'composition') filename = 'composition.webp'
  else if (imageType === 'packaging') filename = 'packaging.webp'
  else if (imageType === 'thumbnail') filename = 'thumbnail.webp'
  
  return `/images/packs/${packSlug}/${filename}`
}

/**
 * Génère le chemin pour les images de catégorie
 */
export function getCategoryImagePath(categorySlug: string): string {
  return `/images/categories/${categorySlug}-category.webp`
}

