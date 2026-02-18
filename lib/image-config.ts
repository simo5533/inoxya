/**
 * Configuration des images pour INOXYA
 * Définit les tailles, qualités et formats d'images
 */

export interface ImageConfig {
  width: number
  height: number
  quality: number
  format: 'jpeg' | 'webp' | 'png'
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export const imageConfigs = {
  // Images de produits
  product: {
    main: {
      width: 800,
      height: 800,
      quality: 90,
      format: 'jpeg' as const,
      fit: 'cover' as const
    },
    gallery: {
      width: 600,
      height: 600,
      quality: 85,
      format: 'jpeg' as const,
      fit: 'cover' as const
    },
    thumbnail: {
      width: 200,
      height: 200,
      quality: 80,
      format: 'jpeg' as const,
      fit: 'cover' as const
    }
  },
  
  // Images de packs
  pack: {
    main: {
      width: 1000,
      height: 750,
      quality: 90,
      format: 'jpeg' as const,
      fit: 'cover' as const
    },
    composition: {
      width: 800,
      height: 600,
      quality: 85,
      format: 'jpeg' as const,
      fit: 'cover' as const
    }
  },
  
  // Images de catégories
  category: {
    main: {
      width: 400,
      height: 300,
      quality: 85,
      format: 'jpeg' as const,
      fit: 'cover' as const
    }
  },
  
  // Images de bannières
  banner: {
    hero: {
      width: 1920,
      height: 1080,
      quality: 90,
      format: 'jpeg' as const,
      fit: 'cover' as const
    },
    section: {
      width: 1200,
      height: 600,
      quality: 85,
      format: 'jpeg' as const,
      fit: 'cover' as const
    }
  }
}

/**
 * Génère les tailles responsive pour Next.js Image
 */
export const responsiveSizes = {
  product: {
    main: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    gallery: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw",
    thumbnail: "(max-width: 768px) 25vw, 12vw"
  },
  pack: {
    main: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
  }
}

/**
 * Formats de fichiers supportés par ordre de priorité
 */
export const supportedFormats = ['webp', 'jpeg', 'png'] as const

/**
 * Tailles de breakpoints pour le responsive
 */
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
  large: 1920
} as const

/**
 * Configuration par défaut pour les images manquantes
 */
export const fallbackConfig = {
  placeholder: "/placeholder.svg",
  blurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
}

/**
 * Fonction utilitaire pour générer les props Next.js Image
 */
export function getImageProps(
  src: string,
  alt: string,
  type: 'main' | 'gallery' | 'thumbnail' | 'composition' = 'main'
) {
  const productConfig = imageConfigs.product[type as keyof typeof imageConfigs.product]
  const packConfig = imageConfigs.pack[type as keyof typeof imageConfigs.pack]
  const config = productConfig || packConfig || imageConfigs.product.main
  
  const productSizes = responsiveSizes.product[type as keyof typeof responsiveSizes.product]
  const packSizes = responsiveSizes.pack[type as keyof typeof responsiveSizes.pack]
  const sizes = productSizes || packSizes || responsiveSizes.product.main
  
  return {
    src,
    alt,
    width: config.width,
    height: config.height,
    quality: config.quality,
    placeholder: 'blur' as const,
    blurDataURL: fallbackConfig.blurDataURL,
    sizes
  }
}

/**
 * Fonction pour valider les dimensions d'une image
 */
export function validateImageDimensions(
  width: number,
  height: number,
  type: 'main' | 'gallery' | 'thumbnail' | 'composition' = 'main'
): boolean {
  const productConfig = imageConfigs.product[type as keyof typeof imageConfigs.product]
  const packConfig = imageConfigs.pack[type as keyof typeof imageConfigs.pack]
  const config = productConfig || packConfig || imageConfigs.product.main
  
  // Tolérance de 10% sur les dimensions
  const widthTolerance = config.width * 0.1
  const heightTolerance = config.height * 0.1
  
  return (
    Math.abs(width - config.width) <= widthTolerance &&
    Math.abs(height - config.height) <= heightTolerance
  )
}

/**
 * Fonction pour calculer le ratio d'aspect optimal
 */
export function getOptimalAspectRatio(type: 'main' | 'gallery' | 'thumbnail' | 'composition' = 'main'): number {
  const productConfig = imageConfigs.product[type as keyof typeof imageConfigs.product]
  const packConfig = imageConfigs.pack[type as keyof typeof imageConfigs.pack]
  const config = productConfig || packConfig || imageConfigs.product.main
  return config.width / config.height
}
