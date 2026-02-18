/**
 * Exemple d'utilisation du nouveau système d'images INOXYA
 * Ce fichier montre comment intégrer les images dans vos composants
 */

import Image from "next/image"
import { getProductImages, getMainImage, getImageGallery } from "@/lib/product-images"
import { getImageProps } from "@/lib/image-config"
import ProductImageGallery from "@/components/ProductImageGallery"

// Exemple 1: Utilisation basique avec image principale
export function BasicProductCard({ productId, productName }: { productId: string, productName: string }) {
  const mainImage = getMainImage(productId)
  
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg">
      <Image
        {...getImageProps(mainImage, productName, 'main')}
        className="object-cover hover:scale-105 transition-transform duration-300"
      />
    </div>
  )
}

// Exemple 2: Galerie complète avec navigation
export function FullProductGallery({ productId, productName }: { productId: string, productName: string }) {
  const mainImage = getMainImage(productId)
  const gallery = getImageGallery(productId)
  
  return (
    <ProductImageGallery 
      mainImage={mainImage}
      images={gallery}
      productName={productName}
    />
  )
}

// Exemple 3: Miniatures pour la galerie
export function ProductThumbnails({ productId, productName }: { productId: string, productName: string }) {
  const galleryImages = getImageGallery(productId)
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {galleryImages.map((image, index) => (
        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            {...getImageProps(image, `${productName} - Vue ${index + 1}`, 'thumbnail')}
            className="object-cover hover:opacity-80 transition-opacity"
          />
        </div>
      ))}
    </div>
  )
}

// Exemple 4: Image avec fallback et loading
export function ProductImageWithFallback({ 
  productId, 
  productName, 
  fallbackImage = "/placeholder.svg" 
}: { 
  productId: string
  productName: string
  fallbackImage?: string 
}) {
  const productImages = getProductImages(productId)
  const imageSrc = productImages?.main || fallbackImage
  
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
      <Image
        src={imageSrc}
        alt={productName}
        fill
        className="object-cover"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {/* Indicateur de chargement */}
      {!productImages && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-400 text-sm">Image en cours de chargement...</div>
        </div>
      )}
    </div>
  )
}

// Exemple 5: Image responsive avec différentes tailles
export function ResponsiveProductImage({ productId, productName }: { productId: string, productName: string }) {
  const mainImage = getMainImage(productId)
  
  return (
    <div className="w-full">
      {/* Version mobile */}
      <div className="block md:hidden">
        <Image
          src={mainImage}
          alt={productName}
          width={400}
          height={400}
          className="w-full h-auto rounded-lg"
          sizes="100vw"
        />
      </div>
      
      {/* Version desktop */}
      <div className="hidden md:block">
        <Image
          src={mainImage}
          alt={productName}
          width={800}
          height={800}
          className="w-full h-auto rounded-xl"
          sizes="(max-width: 1200px) 50vw, 33vw"
        />
      </div>
    </div>
  )
}

// Exemple 6: Image avec lazy loading et intersection observer
export function LazyProductImage({ productId, productName }: { productId: string, productName: string }) {
  const mainImage = getMainImage(productId)
  
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
      <Image
        src={mainImage}
        alt={productName}
        fill
        className="object-cover"
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
      />
    </div>
  )
}

/**
 * Instructions d'utilisation :
 * 
 * 1. Importez les fonctions nécessaires :
 *    import { getProductImages, getMainImage } from "@/lib/product-images"
 *    import { getImageProps } from "@/lib/image-config"
 * 
 * 2. Utilisez getMainImage() pour l'image principale :
 *    const mainImage = getMainImage(productId)
 * 
 * 3. Utilisez getImageGallery() pour la galerie :
 *    const galleryImages = getImageGallery(productId)
 * 
 * 4. Utilisez getImageProps() pour les props Next.js optimisées :
 *    <Image {...getImageProps(mainImage, productName, 'main')} />
 * 
 * 5. Ajoutez toujours un fallback :
 *    const imageSrc = getMainImage(productId) || "/placeholder.svg"
 * 
 * 6. Utilisez le composant ProductImageGallery pour une galerie complète :
 *    <ProductImageGallery productId={productId} productName={productName} />
 */
