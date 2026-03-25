'use client'

import { useCallback, useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addToFavorites, getFavorites } from '@/lib/cart-favorites'

interface ProductDetailFavoriteButtonProps {
  productId: string
  name: string
  price: number
  imageUrl: string
  name_ar?: string
  labelAdd: string
  labelRemove: string
  className?: string
}

function isStoredFavorite(productId: string): boolean {
  return getFavorites().some((item) => String(item.id) === String(productId))
}

function removeFavoriteById(productId: string): void {
  const favorites = getFavorites()
  const updated = favorites.filter((item) => String(item.id) !== String(productId))
  localStorage.setItem('inoxya_favorites', JSON.stringify(updated))
}

/**
 * Même logique que la page /favoris et ProductCard : localStorage via cart-favorites.
 */
export function ProductDetailFavoriteButton({
  productId,
  name,
  price,
  imageUrl,
  name_ar,
  labelAdd,
  labelRemove,
  className = '',
}: ProductDetailFavoriteButtonProps) {
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    setIsFav(isStoredFavorite(productId))
  }, [productId])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (isFav) {
        removeFavoriteById(productId)
        setIsFav(false)
      } else {
        addToFavorites({
          id: String(productId),
          name,
          price,
          image_url: imageUrl || '/placeholder.svg',
          name_ar,
        })
        setIsFav(true)
      }

      window.dispatchEvent(new CustomEvent('favorites-updated'))
    },
    [productId, name, price, imageUrl, name_ar, isFav]
  )

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={handleClick}
      aria-label={isFav ? labelRemove : labelAdd}
      className={`w-full sm:flex-1 min-h-[44px] border-luxury-gold/30 hover:bg-luxury-gold/10 hover:border-luxury-gold ${className}`}
    >
      <Heart
        className={`w-5 h-5 mr-2 shrink-0 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
      />
      {isFav ? labelRemove : labelAdd}
    </Button>
  )
}
