"use client"

// Note: revalidate, dynamic, and dynamicParams are Server Component exports
// They cannot be used in Client Components. This is a Client Component ("use client"),
// so these exports are removed to prevent the runtime error.

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  ShoppingCart, 
  Eye,
  Sparkles
} from "lucide-react"
import {
  getFavorites,
  getCartItems,
  removeFromFavorites,
  type FavoriteItem as FavoriteItemType,
} from "@/lib/cart-favorites"
import type { Product } from "@/lib/types"
import { logger } from "@/lib/logger"
import { useToast } from "@/hooks/use-toast"
import { useTranslations, useLocale } from 'next-intl'

interface FavoriteItem extends FavoriteItemType {
  description?: string
  category?: string
  original_price?: number
}

async function fetchCartCsrfToken(): Promise<string | null> {
  const r = await fetch('/api/csrf-token')
  if (!r.ok) return null
  const d = (await r.json()) as { csrfToken?: string; token?: string }
  return d.csrfToken ?? d.token ?? null
}

/** Panier localStorage + POST /api/cart (product_id + CSRF), sans course parallèle sur le storage. */
async function addFavoriteItemToCart(
  item: FavoriteItem,
  products: Product[],
  csrfToken: string | null
): Promise<void> {
  const product = products.find((p) => String(p.id) === String(item.id)) || item
  const idStr = String(product.id)
  const name =
    'name' in product && product.name != null ? String(product.name) : String(item.name)
  const price = Number(
    'price' in product && product.price != null ? product.price : item.price
  )
  const image_url =
    (typeof (product as Product).image_url === 'string' && (product as Product).image_url) ||
    (typeof (product as { main_image?: string }).main_image === 'string' &&
      (product as { main_image?: string }).main_image) ||
    item.image_url ||
    ''

  const cartItems = getCartItems()
  const existingItem = cartItems.find((ci) => String(ci.id) === idStr)
  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cartItems.push({
      id: idStr,
      name,
      price,
      image_url,
      quantity: 1,
    })
  }
  localStorage.setItem('inoxya_cart', JSON.stringify(cartItems))

  if (csrfToken) {
    await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ product_id: idStr, quantity: 1 }),
    })
  }
}

export default function FavorisPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('favorites')
  const locale = useLocale()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    loadFavorites()
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // loadFavorites and loadProducts are stable functions, no need to include them

  const loadFavorites = () => {
    const items = getFavorites()
    
    // Enrichir avec les détails des produits depuis l'API
    // PHASE 3: no-store pour éviter le cache Next.js
    fetch('/api/products', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          // Si la réponse n'est pas OK, essayer de parser le JSON d'erreur
          try {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Erreur serveur')
          } catch {
            // Si ce n'est pas du JSON, retourner un tableau vide
            return []
          }
        }
        return res.json()
      })
      .then(productsData => {
        setProducts(productsData)
        
        // Filtrer les produits qui existent encore et sont disponibles
        const validItems = items.filter(item => {
          const product = productsData.find((p: Product) => p?.id === item.id)
          return product && product.is_available !== false
        })
        
        // Nettoyer le localStorage si des produits ont été supprimés
        if (validItems.length !== items.length) {
          const validItemsJson = JSON.stringify(validItems)
          localStorage.setItem("inoxya_favorites", validItemsJson)
          if (validItems.length === 0) {
            toast({
              title: "Favoris mis à jour",
              description: "Certains produits ne sont plus disponibles et ont été retirés de vos favoris.",
            })
          }
        }
        
        const enrichedItems = validItems.map(item => {
          const product = productsData.find((p: Product) => p?.id === item.id)
          return {
            ...item,
            name: product?.name || item.name,
            name_ar: product?.name_ar || item.name_ar,
            description: product?.description || '',
            price: product?.price || item.price,
            original_price: product?.original_price,
            category: product?.category || 'Général',
            image_url: product?.image_url || item.image_url || '/placeholder.svg',
            is_favorite: true
          }
        })
        setFavorites(enrichedItems)
        setLoading(false)
      })
      .catch(() => {
        // Fallback si l'API échoue
        const enrichedItems = items.map(item => ({
          ...item,
          description: '',
          category: 'Général',
          image_url: item.image_url || '/placeholder.svg',
          is_favorite: true
        }))
        setFavorites(enrichedItems)
        setLoading(false)
      })
  }

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Erreur lors du chargement des produits')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      logger.error('Erreur chargement produits:', error)
    }
  }

  const handleRemoveFavorite = (id: string) => {
    const item = favorites.find(f => f.id === id)
    removeFromFavorites(id)
    loadFavorites()
    // Rafraîchir le compteur des favoris dans le header
    window.dispatchEvent(new CustomEvent('favorites-updated'))
    toast({
      title: t('removedFromFavorites'),
      description: item ? t('removedFromFavoritesDesc', { name: item.name }) : t('itemRemoved'),
    })
  }

  const handleAddToCart = async (item: FavoriteItem) => {
    try {
      const csrf = await fetchCartCsrfToken()
      await addFavoriteItemToCart(item, products, csrf)
      toast({
        title: t('addedToCart'),
        description: t('addedToCartDesc', { name: item.name }),
      })
      window.dispatchEvent(new CustomEvent('cart-updated'))
    } catch (err) {
      logger.error('Erreur ajout panier (favoris):', err)
      toast({
        title: t('error'),
        description: t('errorAddToCart'),
        variant: "destructive",
      })
    }
  }

  const handleViewProduct = (id: string) => {
    router.push(`/${locale}/bijoux/${id}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  // Calculer le total des favoris
  const calculateFavoritesTotal = () => {
    return favorites.reduce((sum, item) => sum + item.price, 0)
  }

  // Calculer les économies totales
  const calculateFavoritesSavings = () => {
    return favorites.reduce((sum, item) => {
      if (item.original_price && item.original_price > item.price) {
        return sum + (item.original_price - item.price)
      }
      return sum
    }, 0)
  }

  const favoritesTotal = calculateFavoritesTotal()
  const favoritesSavings = calculateFavoritesSavings()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos favoris...</p>
        </div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('noFavorites')}</h1>
          <p className="text-gray-600 mb-8">
            {t('noFavoritesDesc')}
          </p>
          <Link href={`/${locale}/bijoux`}>
            <Button className="bg-orange-600 hover:bg-orange-700">
              {t('viewCollection')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          </div>
          <p className="text-gray-600">
            {t('itemsCount', { count: favorites.length, plural: favorites.length > 1 ? 'x' : '' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Image du produit */}
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <Image 
                    src={item.image_url || '/placeholder.svg'} 
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Badge de réduction */}
                  {item.original_price && item.original_price > item.price && (
                    <Badge className="absolute top-3 left-3 bg-red-500">
                      -{Math.round(((item.original_price - item.price) / item.original_price) * 100)}%
                    </Badge>
                  )}
                  
                  {/* Bouton favori */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFavorite(item.id)}
                    className="absolute top-3 right-3 w-10 h-10 p-0 bg-white/90 hover:bg-white"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </Button>
                </div>

                {/* Détails du produit */}
                <div className="p-4">
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  
                  {item.name_ar && (
                    <p className="text-sm text-gray-600 mb-2">{item.name_ar}</p>
                  )}
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Prix */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(item.price)}
                      </span>
                      {item.original_price && item.original_price > item.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrency(item.original_price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className={`w-4 h-4 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {t('addToCart')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-3"
                      onClick={() => handleViewProduct(item.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Résumé des favoris */}
        {favorites.length > 0 && (
          <div className="mt-8 mb-8">
            <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Résumé de vos favoris
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Nombre d'articles :</span>
                        <span className="font-medium">{favorites.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valeur totale :</span>
                        <span className="font-bold text-lg text-orange-600">
                          {formatCurrency(favoritesTotal)}
                        </span>
                      </div>
                      {favoritesSavings > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Économies potentielles :</span>
                          <span className="font-semibold">
                            -{formatCurrency(favoritesSavings)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const csrf = await fetchCartCsrfToken()
                          for (const item of favorites) {
                            // Séquentiel : évite les courses sur localStorage (Promise.all écrasait le panier).
                            // eslint-disable-next-line no-await-in-loop
                            await addFavoriteItemToCart(item, products, csrf)
                          }
                          toast({
                            title: "✅ Articles ajoutés",
                            description: `${favorites.length} article(s) ajouté(s) au panier avec succès.`,
                          })
                          window.dispatchEvent(new CustomEvent('cart-updated'))
                        } catch (err) {
                          logger.error('Erreur tout ajouter au panier:', err)
                          toast({
                            title: "❌ Erreur",
                            description: "Impossible d'ajouter tous les articles au panier.",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Tout ajouter au panier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions globales */}
        <div className="mt-12 text-center">
          <Card className="inline-block">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Besoin d'inspiration ?
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Découvrez nos nouvelles collections et trouvez le bijou parfait.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href={`/${locale}/bijoux`}>
                  <Button variant="outline">
                    Voir les nouveautés
                  </Button>
                </Link>
                <Link href={`/${locale}/bijoux`}>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Toute la collection
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}