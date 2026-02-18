/**
 * Mapping centralisé des images de catégories
 * Priorité: produit réel > image statique > fallback Unsplash spécifique
 * 
 * Règles:
 * - Noms/slug normalisés (lowercase, tirets)
 * - Aucun broken image
 * - Images optimisées (format webp/avif si possible)
 * - Alt text descriptif (important SEO)
 */

import { getProductsAsync } from './sqlite'
import { getSafeImageSrc } from './image-path'
import { slugToDbValue } from './category-mapping'
import { logger } from './logger'

/**
 * Images statiques de fallback pour chaque catégorie
 * Utilisées si aucun produit n'a d'image valide
 * Images haute qualité HD depuis Unsplash (licence libre) ou locales
 */
export const CATEGORY_STATIC_IMAGES: Record<string, string> = {
  bagues: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=1080&fit=crop&q=90',
  colliers: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1920&h=1080&fit=crop&q=90',
  bracelets: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1920&h=1080&fit=crop&q=90',
  'boucles-oreilles': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1920&h=1080&fit=crop&q=90',
  montres: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&h=1080&fit=crop&q=90', // Image spécifique de montre
  parures: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&h=1080&fit=crop&q=90', // Alias pour montres
  broches: '/images/packs/pack-prestige.jpg',
}

/**
 * Alt text descriptif pour chaque catégorie (SEO)
 */
export const CATEGORY_ALT_TEXTS: Record<string, string> = {
  bagues: 'Collection de bagues berbères en acier inoxydable premium',
  colliers: 'Collection de colliers traditionnels et contemporains en acier inoxydable',
  bracelets: 'Collection de bracelets élégants et résistants en acier inoxydable',
  'boucles-oreilles': 'Collection de boucles d\'oreilles traditionnelles et modernes en acier inoxydable',
  montres: 'Collection de montres élégantes et précises en acier inoxydable',
  parures: 'Collection de montres élégantes et précises en acier inoxydable',
  broches: 'Packs exclusifs de bijoux INOXYA à prix avantageux',
}

/**
 * Obtient l'image de couverture pour une catégorie (SERVER-SIDE ONLY)
 * Priorité: produit réel > image statique > fallback Unsplash
 * 
 * @param categorySlug - Slug de la catégorie (ex: "bracelets", "montres")
 * @returns URL de l'image garantie (jamais null)
 */
export async function getCategoryCoverImage(categorySlug: string): Promise<string> {
  try {
    // Normaliser le slug (lowercase, tirets)
    const normalizedSlug = categorySlug.toLowerCase().trim()
    
    // Essayer d'abord de récupérer une image depuis un produit réel
    const dbValue = slugToDbValue(normalizedSlug)
    if (dbValue) {
      try {
        const allProducts = await getProductsAsync()
        const categoryProducts = allProducts.filter(p => {
          return (p.category === dbValue) || (p.category_id === normalizedSlug)
        })

        if (categoryProducts.length > 0) {
          // Sélectionner le premier produit avec une image valide
          for (const product of categoryProducts) {
            const imageUrl = product.main_image || product.image_url
            if (imageUrl) {
              const safeImage = getSafeImageSrc(imageUrl)
              // Vérifier que ce n'est pas le placeholder
              if (safeImage && safeImage !== '/placeholder.svg') {
                return safeImage
              }
            }
          }
        }
      } catch (dbError) {
        // Si erreur DB, continuer vers fallback
        if (process.env.NODE_ENV === 'development') {
          const errorDetails = dbError instanceof Error ? { message: dbError.message } : { error: String(dbError) }
          logger.warn(`[getCategoryCoverImage] Erreur DB pour ${normalizedSlug}:`, errorDetails)
        }
      }
    }

    // Fallback 1: Image statique locale si disponible
    const staticImage = CATEGORY_STATIC_IMAGES[normalizedSlug]
    if (staticImage) {
      return staticImage
    }

    // Fallback 2: Image par défaut (bagues)
    return CATEGORY_STATIC_IMAGES['bagues'] || '/images/categories/bagues-category.jpeg'
  } catch (error) {
    logger.error(`[getCategoryCoverImage] Erreur pour ${categorySlug}:`, error)
    // Fallback final
    return CATEGORY_STATIC_IMAGES['bagues'] || '/images/categories/bagues-category.jpeg'
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
  
  // Fallback final
  return CATEGORY_STATIC_IMAGES['bagues'] || '/images/categories/bagues-category.jpeg'
}

