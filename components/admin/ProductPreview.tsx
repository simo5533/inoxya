"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ShoppingCart, Heart, Share2 } from "lucide-react"

interface ProductPreviewProps {
  product: {
    name: string
    name_ar?: string
    description?: string
    price: number
    original_price?: number
    image_url?: string
    images?: string[]
    rating?: number
    reviews_count?: number
    is_available: boolean
    is_featured: boolean
    is_custom: boolean
  }
}

export default function ProductPreview({ product }: ProductPreviewProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  
  const images = product.images && Array.isArray(product.images) 
    ? product.images 
    : product.image_url 
      ? [product.image_url] 
      : []

  const rating = product.rating || 4.5
  const reviews = product.reviews_count || 0

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Aperçu du produit</h3>
        <p className="text-sm text-gray-600">Voici comment votre produit apparaîtra aux clients</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          {/* Image principale */}
          <div className="relative w-full h-0 pb-[100%] rounded-lg overflow-hidden bg-gray-100 mb-4">
            {images[selectedImage] ? (
              <Image
                src={images[selectedImage]}
                alt={product.name || 'Produit'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                  <div className="text-sm">Aucune image</div>
                </div>
              </div>
            )}
          </div>

          {/* Miniatures */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-full h-0 pb-[100%] rounded overflow-hidden ${
                    selectedImage === index ? 'ring-2 ring-orange-500' : ''
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - Vue ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {product.images?.includes("promo") && <Badge className="bg-red-500 text-white text-xs">Promo</Badge>}
            {product.images?.includes("nouveau") && <Badge className="bg-green-500 text-white text-xs">Nouveau</Badge>}
            {product.images?.includes("bestseller") && <Badge className="bg-blue-500 text-white text-xs">Bestseller</Badge>}
            {product.images?.includes("premium") && <Badge className="bg-yellow-500 text-black text-xs">Premium</Badge>}
          </div>

          {/* Nom du produit */}
          <h4 className="font-semibold text-lg mb-1">{product.name || "Nom du produit"}</h4>
          {product.name_ar && (
            <div className="text-sm text-gray-600 mb-2 font-arabic">{product.name_ar}</div>
          )}

          {/* Note */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {rating} ({reviews} avis)
            </span>
          </div>

          {/* Prix */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl font-bold text-orange-600">
              {product.price ? `${Math.round(product.price)} MAD` : "Prix"}
            </span>
            {product.original_price && product.original_price !== product.price && (
              <span className="text-sm line-through text-gray-400">
                {Math.round(product.original_price)} MAD
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {product.description || "Description du produit..."}
          </p>

          {/* Actions */}
          <div className="space-y-2">
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-600 text-white"
              disabled={!product.is_available}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.is_available ? "Procéder au paiement" : "Indisponible"}
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Heart className="w-4 h-4 mr-1" />
                Favoris
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="w-4 h-4 mr-1" />
                Partager
              </Button>
            </div>
          </div>

          {/* Statut */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Statut:</span>
              <div className="flex gap-2">
                {product.is_available && <Badge variant="secondary" className="text-xs">Disponible</Badge>}
                {product.is_featured && <Badge className="bg-yellow-500 text-black text-xs">Vedette</Badge>}
                {product.is_custom && <Badge className="bg-purple-500 text-white text-xs">Sur mesure</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu mobile */}
      <div className="text-center">
        <h4 className="text-sm font-medium mb-2">Aperçu mobile</h4>
        <div className="max-w-xs mx-auto">
          <Card className="scale-75 origin-top">
            <CardContent className="p-4">
              <div className="relative w-full h-0 pb-[100%] rounded-lg overflow-hidden bg-gray-100 mb-3">
                {images[0] ? (
                  <Image
                    src={images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <span className="text-2xl">📷</span>
                  </div>
                )}
              </div>
              
              <h5 className="font-medium text-sm mb-1 line-clamp-2">
                {product.name || "Nom du produit"}
              </h5>
              
              <div className="flex items-center justify-between">
                <span className="text-orange-600 font-bold text-sm">
                  {product.price ? `${Math.round(product.price)} MAD` : "Prix"}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600">{rating}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
