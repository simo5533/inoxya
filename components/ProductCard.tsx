"use client"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Star, ShoppingCart } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { addToFavorites, removeFromFavorites, isFavorite, addToCart } from "@/lib/cart-favorites"
import { useLocale } from "next-intl"

import { getSafeImageSrc } from '@/lib/image-path'

/**
 * Convertit un chemin d'image en URL valide
 * Utilise le helper sécurisé de lib/image-path
 */
function convertToImageUrl(imagePath: string): string {
  return getSafeImageSrc(imagePath)
}

interface ProductCardProps {
  product: {
    id: string
    name: string
    name_ar?: string
    description?: string
    price: number
    original_price?: number
    image_url?: string
    main_image?: string
    images?: string[]
    rating?: number
    reviews_count?: number
    created_at?: string
    categories?: {
      name: string
      slug: string
    }
  }
}

// Fonction pour obtenir les étiquettes du produit
interface ProductBadge {
  text: string
  color: string
  textColor: string
}

const getProductBadges = (images: string[] | null = []): ProductBadge[] => {
  const badges: ProductBadge[] = []
  if (!images || !Array.isArray(images)) return badges
  
  if (images.includes("promo")) badges.push({ text: "Promo", color: "bg-red-500", textColor: "text-white" })
  if (images.includes("nouveau")) badges.push({ text: "Nouveau", color: "bg-green-500", textColor: "text-white" })
  if (images.includes("bestseller")) badges.push({ text: "Bestseller", color: "bg-blue-500", textColor: "text-white" })
  if (images.includes("premium")) badges.push({ text: "Premium", color: "bg-yellow-500", textColor: "text-black" })
  return badges
}

// Fonction pour formater le prix en MAD
const formatPrice = (price: number) => {
  return `${Math.round(price)} MAD`
}

// Génération d'une note réaliste basée sur l'ID du produit
const getProductRating = (productId: string, baseRating?: number, baseReviews?: number) => {
  if (baseRating && baseReviews) {
    return { rating: baseRating, reviews: baseReviews }
  }

  const seed = productId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rating = 4.0 + (seed % 10) / 10 // Entre 4.0 et 4.9
  const reviews = 15 + (seed % 200) // Entre 15 et 215 avis
  return { rating: Math.round(rating * 10) / 10, reviews }
}

export default function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale()
  const [isProductFavorite, setIsProductFavorite] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [imageError, setImageError] = useState(false)
  const badges = getProductBadges(product.images)
  const { rating, reviews } = getProductRating(product.id, product.rating, product.reviews_count)
  
  // Convertir le chemin d'image en URL API si nécessaire - Enhanced fallback chain
  const imageUrl = useMemo(() => {
    // Priority: main_image > image_url > first item in images[] > placeholder
    let imagePath: string | undefined = product.main_image || product.image_url
    
    // If no main image, try first item in images array (if it's a valid image path)
    if (!imagePath && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0]
      // Only use if it's a string and looks like an image path (not a badge tag)
      if (typeof firstImage === 'string' && (firstImage.startsWith('/') || firstImage.startsWith('http'))) {
        imagePath = firstImage
      }
    }
    
    // Final fallback to placeholder
    return convertToImageUrl(imagePath || "/placeholder.svg")
  }, [product.main_image, product.image_url, product.images])

  // Réinitialiser l'erreur d'image si l'URL change
  useEffect(() => {
    setImageError(false)
  }, [imageUrl])

  // Calcul de la promotion
  const hasPromo = product.images?.includes("promo")
  const originalPrice = product.original_price || (hasPromo ? Math.round(product.price * 1.3) : null)
  const discountPercent = originalPrice && originalPrice > product.price
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : null

  // Vérifier si le produit est en favoris au chargement
  useEffect(() => {
    setIsProductFavorite(isFavorite(product.id))
  }, [product.id])

  const handleFavoriteToggle = () => {
    if (isProductFavorite) {
      removeFromFavorites(product.id)
      setIsProductFavorite(false)
    } else {
      // Ensure image_url is provided for ProductInput
      addToFavorites({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: imageUrl, // Use the resolved imageUrl
        name_ar: product.name_ar,
        categories: product.categories,
      })
      setIsProductFavorite(true)
    }
  }

  const handleAddToCart = () => {
    setIsAddingToCart(true)
    // Ensure image_url is provided for ProductInput
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: imageUrl, // Use the resolved imageUrl
    }, 1)

    // Animation de feedback
    setTimeout(() => {
      setIsAddingToCart(false)
    }, 1000)
  }

  // Vérifier si le produit est nouveau (créé dans les 7 derniers jours)
  const isNew = useMemo(() => {
    if (!product.created_at) return false
    const createdDate = new Date(product.created_at)
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceCreation <= 7
  }, [product.created_at])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200/50 shadow-lg bg-white relative max-w-sm mx-auto hover:scale-[1.02] hover:-translate-y-1 hover:border-luxury-gold/30">
      {/* 🏷️ Étiquettes en haut à gauche */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {isNew && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <Badge className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 shadow-md animate-pulse">
              ✨ Nouveau
            </Badge>
          </motion.div>
        )}
        {discountPercent !== null && (
          <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-md">
            -{discountPercent}%
          </Badge>
        )}
        {badges.map((badge, index) => (
          <Badge key={index} className={`${badge.color} ${badge.textColor} text-xs font-bold px-2 py-1 shadow-md`}>
            {badge.text}
          </Badge>
        ))}
      </div>

      {/* ❤️ Bouton Favoris en haut à droite */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleFavoriteToggle}
        className={`absolute top-3 right-3 z-10 rounded-full ${
          isProductFavorite ? "bg-red-100 text-red-500" : "bg-white/90 text-gray-600"
        } hover:scale-110 transition-all duration-200 shadow-md cursor-pointer`}
      >
        <Heart className={`w-4 h-4 ${isProductFavorite ? "fill-current" : ""}`} />
      </Button>

      {/* 🖼️ Image du produit - Luxury wrapper with explicit dimensions */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-t-xl bg-neutral-100/40 min-h-[300px]">
        {!imageError && imageUrl !== "/placeholder.svg" ? (
          <Image
            src={imageUrl}
            alt={`${product.name} - Bijou en acier inoxydable premium INOXYA${product.categories ? ` - ${product.categories.name}` : ''}`}
            fill
            loading="lazy"
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            onError={() => setImageError(true)}
          />
        ) : (
          <Image
            src="/placeholder.svg"
            alt={`${product.name} - Bijou en acier inoxydable premium INOXYA${product.categories ? ` - ${product.categories.name}` : ''}`}
            fill
            loading="lazy"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        {/* Overlay premium au hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        {/* Effet de brillance subtil avec or */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-luxury-gold/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out opacity-0 group-hover:opacity-100 pointer-events-none" />
      </div>

      <CardContent className="p-4 space-y-3">
        {/* 📝 Nom du bijou */}
        <div className="space-y-1">
          <Link href={`/${locale}/bijoux/${product.id}`}>
            <h3 className="font-bold text-luxury-black group-hover:text-luxury-gold transition-colors line-clamp-1 text-base">
              {product.name}
            </h3>
          </Link>

          {/* Nom en arabe si disponible */}
          {product.name_ar && <p className="text-sm text-gray-500 font-arabic text-right">{product.name_ar}</p>}
        </div>

        {/* ⭐ Note avec étoiles et nombre d'avis */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-luxury-gold text-luxury-gold" : "text-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {rating} ({reviews})
          </span>
        </div>

        {/* 💰 Prix */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold text-luxury-black">{formatPrice(product.price)}</div>
            {originalPrice && originalPrice !== product.price && (
              <div className="text-sm text-gray-500 line-through">{formatPrice(originalPrice)}</div>
            )}
          </div>

          {/* Catégorie en petit */}
          {product.categories && (
            <Badge variant="outline" className="text-xs text-gray-600 border-gray-300/50">
              {product.categories.name}
            </Badge>
          )}
        </div>

        {/* 🔥 Indicateur de promotion si applicable */}
        {hasPromo && originalPrice && (
          <div className="text-center">
            <Badge className="bg-red-100 text-red-700 text-xs">
              Économisez {formatPrice(originalPrice - product.price)}
            </Badge>
          </div>
        )}

        {/* 🛒 Boutons d'action */}
        <div className="flex gap-2 pt-2">
          <Link href={`/${locale}/bijoux/${product.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm" 
              className="w-full h-9 border-luxury-gold/30 text-luxury-black hover:bg-luxury-gold/10 hover:border-luxury-gold bg-transparent text-sm font-medium cursor-pointer transition-all duration-300"
            >
              Voir
            </Button>
          </Link>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="h-9 w-9 flex-shrink-0 bg-luxury-black hover:bg-luxury-charcoal text-luxury-gold border border-luxury-gold/30 hover:border-luxury-gold p-0 flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <ShoppingCart className={`w-4 h-4 ${isAddingToCart ? "animate-bounce" : ""}`} />
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  )
}



