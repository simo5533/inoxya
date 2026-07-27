/**
 * Fonction pour obtenir l'image de couverture d'une catégorie
 * Utilise une vraie photo d'un produit de cette catégorie depuis la DB
 * 
 * NOTE: Cette fonction doit être appelée côté serveur uniquement
 */

import { getProductsAsync } from './sqlite'
import { getSafeImageSrc } from './image-path'
import { slugToDbValue } from './category-mapping'

/**
 * Obtient l'image de couverture pour une catégorie (SERVER-SIDE ONLY)
 * @param categorySlug - Slug de la catégorie (ex: "bracelets")
 * @returns URL de l'image ou null si aucune image trouvée
 */
export async function getCategoryCoverImage(categorySlug: string): Promise<string | null> {
  try {
    const dbValue = slugToDbValue(categorySlug)
    if (!dbValue) {
      return null
    }

    // Récupérer tous les produits de cette catégorie (version asynchrone)
    const allProducts = await getProductsAsync()
    const categoryProducts = allProducts.filter(p => {
      // Filtrer par la valeur DB de la catégorie (ex: "Bracelets", "Montres", "Boucles d'oreilles")
      // Vérifier à la fois category (valeur DB) et category_id (slug) pour compatibilité
      return (p.category === dbValue) || (p.category_id === categorySlug)
    })

    if (categoryProducts.length === 0) {
      return null
    }

    // Sélectionner le premier produit avec une image valide (priorité: main_image > image_url)
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

    return null
  } catch (error) {
    const { logger } = await import('./logger')
    logger.error(`[getCategoryCoverImage] Erreur pour ${categorySlug}:`, error)
    return null
  }
}

/**
 * @deprecated Utiliser lib/category-images-mapping.ts à la place
 * Conservé pour compatibilité ascendante
 */
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  bagues: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=1080&fit=crop&q=90',
  colliers: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1920&h=1080&fit=crop&q=90',
  bracelets: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1920&h=1080&fit=crop&q=90',
  'boucles-oreilles': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1920&h=1080&fit=crop&q=90',
  montres: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&h=1080&fit=crop&q=90', // Image spécifique de montre
  parures: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=1080&fit=crop&q=90', // Parures / ensembles
  broches: '/images/packs/pack-prestige.jpg',
}

/**
 * @deprecated Utiliser getCategoryCoverImage de lib/category-images-mapping.ts à la place
 * Conservé pour compatibilité ascendante
 */
export async function getCategoryCoverImageWithFallback(categorySlug: string): Promise<string> {
  // Utiliser le nouveau système centralisé
  const { getCategoryCoverImage } = await import('./category-images-mapping')
  return getCategoryCoverImage(categorySlug)
}

