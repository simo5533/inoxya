"use client"

import Image from "next/image"
import { useState, useMemo, useEffect } from "react"
import { getSafeImageSrc } from "@/lib/image-path"

interface ProductImageGalleryProps {
  mainImage: string
  images: string[]
  productName: string
}

export default function ProductImageGallery({ 
  mainImage, 
  images, 
  productName 
}: ProductImageGalleryProps) {
  // Convertir tous les chemins en URLs avec getSafeImageSrc
  const mainImageUrl = useMemo(() => getSafeImageSrc(mainImage || ""), [mainImage])
  const imagesUrls = useMemo(() => {
    if (!images || !Array.isArray(images)) return []
    // Filter out badge tags (strings like "promo", "nouveau", etc.)
    return images
      .filter(img => typeof img === 'string' && (img.startsWith('/') || img.startsWith('http')))
      .map(img => getSafeImageSrc(img))
      .filter(Boolean)
  }, [images])
  
  // État pour l'image principale affichée (commence par main_image)
  const [selectedMainImage, setSelectedMainImage] = useState(mainImageUrl)
  
  // Mettre à jour l'image principale quand mainImage change
  useEffect(() => {
    setSelectedMainImage(mainImageUrl)
  }, [mainImageUrl])
  
  // Fonction pour changer l'image principale quand on clique sur une miniature
  const handleThumbnailClick = (imageUrl: string) => {
    setSelectedMainImage(imageUrl)
  }
  
  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-hidden">
      {/* Image principale - Luxury wrapper with explicit dimensions */}
      <div className="main-image relative w-full min-w-0 max-w-full aspect-square sm:aspect-[4/5] rounded-xl overflow-hidden shadow-lg bg-neutral-100/40 min-h-0 sm:min-h-[400px]">
        <Image
          src={selectedMainImage || "/placeholder.svg"}
          alt={`${productName} - Bijou en acier inoxydable premium INOXYA - Vue principale`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={(e) => {
            // En cas d'erreur, utiliser le placeholder
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg"
          }}
        />
      </div>
      
      {/* Miniatures - affiche uniquement les images du tableau images[] */}
      {imagesUrls.length > 0 && (
        <div className="thumbnails flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0">
          {imagesUrls.map((image, index) => {
            const isSelected = image === selectedMainImage
            return (
              <button
                key={index}
                onClick={() => handleThumbnailClick(image)}
                className={`thumbnail relative flex-shrink-0 w-16 h-16 sm:w-full sm:h-auto sm:aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? "border-orange-500 shadow-lg"
                    : "border-gray-200 hover:border-orange-300"
                }`}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${productName} - Bijou en acier inoxydable premium INOXYA - Vue ${index + 1}`}
                  fill
                  className={`object-cover transition-opacity ${
                    isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
                  }`}
                  sizes="(max-width: 768px) 25vw, 12.5vw"
                  onError={(e) => {
                    // En cas d'erreur, utiliser le placeholder
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg"
                  }}
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-orange-500/10 pointer-events-none" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
