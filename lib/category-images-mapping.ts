/**
 * Mapping centralisé des images de catégories
 * Priorité: image statique par slug (assets locaux) > produit réel > fallback
 * Clés stables par slug (FR + AR), aucune image externe.
 */

import { getProductsAsync } from './sqlite'
import { getSafeImageSrc } from './image-path'
import { slugToDbValue } from './category-mapping'
import { logger } from './logger'

/**
 * Images statiques par slug (assets locaux /public/images/categories/)
 * Bagues, Ensemble et colliers, Bracelets, Boucles d'oreilles, Montres (parures), Nos packs (broches)
 */
export const CATEGORY_STATIC_IMAGES: Record<string, string> = {
  bagues: '/images/categories/bagues.jpg',
  colliers: '/images/categories/colliers.jpg',
  bracelets: '/images/categories/bracelets.jpg',
  'boucles-oreilles': '/images/categories/boucles-oreilles.jpg',
  montres: '/images/categories/montres.jpg',
  parures: '/images/categories/montres.jpg',
  broches: '/images/categories/packs.jpg',
  packs: '/images/categories/packs.jpg',
}

/**
 * Alt text descriptif pour chaque catégorie (SEO)
 */
export const CATEGORY_ALT_TEXTS: Record<string, string> = {
  bagues: 'Collection de bagues berbères en acier inoxydable premium',
  colliers: 'Collection d\'ensembles et de colliers traditionnels ou contemporains en acier inoxydable',
  bracelets: 'Collection de bracelets élégants et résistants en acier inoxydable',
  'boucles-oreilles': 'Collection de boucles d\'oreilles traditionnelles et modernes en acier inoxydable',
  montres: 'Collection de montres élégantes et précises en acier inoxydable',
  parures: 'Collection de montres élégantes et précises en acier inoxydable',
  broches: 'Packs exclusifs de bijoux INOXYA à prix avantageux',
}

/**
 * Obtient l'image de couverture pour une catégorie (SERVER-SIDE ONLY)
 * Priorité: image statique par slug (assets locaux) > produit réel > fallback
 *
 * @param categorySlug - Slug de la catégorie (ex: "bracelets", "parures")
 * @returns URL de l'image garantie (jamais null)
 */
export async function getCategoryCoverImage(categorySlug: string): Promise<string> {
  try {
    const normalizedSlug = categorySlug.toLowerCase().trim()

    // Priorité 1: Image statique locale (mapping par slug, FR + AR)
    const staticImage = CATEGORY_STATIC_IMAGES[normalizedSlug]
    if (staticImage) {
      return staticImage
    }

    // Priorité 2: Image depuis un produit réel (si pas de mapping)
    const dbValue = slugToDbValue(normalizedSlug)
    if (dbValue) {
      try {
        const allProducts = await getProductsAsync()
        const categoryProducts = allProducts.filter(p => {
          return (p.category === dbValue) || (p.category_id === normalizedSlug)
        })
        for (const product of categoryProducts) {
          const imageUrl = product.main_image || product.image_url
          if (imageUrl) {
            const safeImage = getSafeImageSrc(imageUrl)
            if (safeImage && safeImage !== '/placeholder.svg') return safeImage
          }
        }
      } catch (dbError) {
        if (process.env.NODE_ENV === 'development') {
          const errorDetails = dbError instanceof Error ? { message: dbError.message } : { error: String(dbError) }
          logger.warn(`[getCategoryCoverImage] Erreur DB pour ${normalizedSlug}:`, errorDetails)
        }
      }
    }

    return CATEGORY_STATIC_IMAGES['bagues'] || '/images/categories/bagues.jpg'
  } catch (error) {
    logger.error(`[getCategoryCoverImage] Erreur pour ${categorySlug}:`, error)
    return CATEGORY_STATIC_IMAGES['bagues'] || '/images/categories/bagues.jpg'
  }
}

/**
 * Obtient l'alt text descriptif pour une catégorie (SEO)
 * 
 * @param categorySlug - Slug de la catégorie
 * @returns Alt text descriptif
 */
export function getCategoryAltText(categorySlug: string): string {
  const normalizedSlug = categorySlug.toLowerCase().trim()
  return CATEGORY_ALT_TEXTS[normalizedSlug] || `Collection ${categorySlug} INOXYA BIJOUX`
}

/**
 * Obtient l'image de couverture avec fallback (version synchrone pour client)
 * Utilisé côté client quand on a déjà l'image depuis le serveur
 * 
 * @param categorySlug - Slug de la catégorie
 * @param coverImageFromServer - Image déjà récupérée depuis le serveur (optionnel)
 * @returns URL de l'image garantie
 */
export function getCategoryImageWithFallback(
  categorySlug: string,
  coverImageFromServer?: string | null
): string {
  const normalizedSlug = categorySlug.toLowerCase().trim()
  
  // Priorité 1: Image depuis serveur (produit réel)
  if (coverImageFromServer && coverImageFromServer !== '/placeholder.svg') {
    return coverImageFromServer
  }
  
  // Priorité 2: Image statique
  const staticImage = CATEGORY_STATIC_IMAGES[normalizedSlug]
  if (staticImage) {
    return staticImage
  }
  
  return CATEGORY_STATIC_IMAGES['bagues'] || '/images/categories/bagues.jpg'
}

