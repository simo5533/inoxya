"use client"
import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Sparkles, Crown, Gem } from "lucide-react"
import { useTranslations } from 'next-intl'

export default function JewelryBanner() {
  const t = useTranslations('home')
  const [currentImage, setCurrentImage] = useState(0)
  
  // Recréer bannerImages quand les traductions changent (locale change)
  const bannerImages = useMemo(() => [
    {
      url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=300&fit=crop",
      title: t('banner.title1'),
      subtitle: t('banner.subtitle1'),
    },
    {
      url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&h=300&fit=crop",
      title: t('banner.title2'),
      subtitle: t('banner.subtitle2'),
    },
    {
      url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&h=300&fit=crop",
      title: t('banner.title3'),
      subtitle: t('banner.subtitle3'),
    },
  ], [t])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % bannerImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [bannerImages.length])

  return (
    <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-r from-orange-500 to-yellow-600">
      {/* Images de fond avec transition */}
      <div className="absolute inset-0">
        {bannerImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImage ? "opacity-30" : "opacity-0"
            }`}
          >
            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-yellow-600/80" />

      {/* Contenu */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <Crown className="w-8 h-8 text-white animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-300 animate-bounce" />
            <Gem className="w-7 h-7 text-white animate-pulse delay-300" />
          </div>

          <div className="text-white">
            <h2 className="text-lg md:text-2xl font-bold mb-1">{bannerImages[currentImage]?.title || ''}</h2>
            <p className="text-sm md:text-base opacity-90">{bannerImages[currentImage]?.subtitle || ''}</p>
          </div>
        </div>

        {/* Indicateurs */}
        <div className="flex space-x-2">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                index === currentImage ? "bg-white scale-125" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Effet de particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-60" />
        <div className="absolute top-8 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-6 left-1/2 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-bounce delay-500" />
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white rounded-full animate-ping delay-700" />
      </div>
    </div>
  )
}
