"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Truck,
  Shield,
  Heart
} from "lucide-react"
import { 
  getCartItems, 
  updateCartQuantity, 
  removeFromCart,
  type CartItem as CartItemType
} from "@/lib/cart-favorites"
import { getCustomPackSnapshot, isCustomPackLineId } from "@/lib/custom-pack"
import type { Product } from "@/lib/types"
import { useTranslations, useLocale } from 'next-intl'

interface CartItem extends CartItemType {
  name_ar?: string
  original_price?: number
  category?: string
  description?: string
  lineType?: 'standard' | 'custom_pack'
}

export default function PanierPage() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('cart')
  const locale = useLocale()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  /** Évite que useCallback([t]) change à chaque rendu → boucle infinie useEffect + spam /api/csrf-token */
  const tRef = useRef(t)
  tRef.current = t

  const loadCart = useCallback(async () => {
    try {
      const items = getCartItems()
      
      // Si pas d'items, arrêter ici
      if (items.length === 0) {
        setCartItems([])
        setLoading(false)
        return
      }
      
      // Enrichir avec les détails des produits depuis l'API
      // PHASE 3: no-store pour éviter le cache Next.js
      try {
        const res = await fetch('/api/products', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        
        if (!res.ok) {
          // Si erreur 503 (DB indisponible) ou autre, utiliser fallback
          const errorData = await res.json().catch(() => ({}))
          if (process.env.NODE_ENV === 'development') {
            console.warn(`API products retourne ${res.status}:`, errorData)
          }
          throw new Error(`API returned ${res.status}`)
        }
        
        const raw = await res.json()
        const productsArray: Product[] = Array.isArray(raw) ? raw : (raw?.products ?? [])
        
        const enrichedItems = items.map(item => {
          if (item.lineType === 'custom_pack' || isCustomPackLineId(item.id)) {
            return {
              ...item,
              category: tRef.current('customPackCategory'),
            }
          }
          const product = productsArray.find((p: Product) => String(p.id) === String(item.id))
          return {
            ...item,
            name: product?.name || item.name,
            name_ar: product?.name_ar,
            original_price: product?.original_price,
            category: product?.category || 'Général',
            description: product?.description,
            image_url: product?.image_url || item.image_url || '/placeholder.svg'
          }
        })
        setCartItems(enrichedItems)
        setLoading(false)
      } catch (apiError) {
        // Fallback si l'API échoue
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur API products dans loadCart:', apiError)
        }
        const enrichedItems = items.map(item => ({
          ...item,
          image_url: item.image_url || '/placeholder.svg',
          category: 'Général'
        }))
        setCartItems(enrichedItems)
        setLoading(false)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur loadCart:', error)
      }
      setCartItems([])
      setLoading(false)
    }
    // t via tRef (stable) ; locale change remonte en général la page via next-intl
  }, [])

  useEffect(() => {
    void loadCart()
  }, [loadCart])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch('/api/csrf-token', { credentials: 'same-origin' })
        if (!cancelled && response.ok) {
          const data = await response.json()
          setCsrfToken(data.csrfToken ?? null)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors de la récupération du token CSRF:', err)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(id)
      return
    }
    
    try {
      await updateCartQuantity(id, newQuantity)
      loadCart()
      window.dispatchEvent(new CustomEvent('cart-updated'))
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur mise à jour quantité:', error)
      }
      toast({
        title: t('error'),
        description: t('errorUpdateQuantity'),
        variant: "destructive",
      })
    }
  }

  const removeItem = async (id: string) => {
    const item = cartItems.find(i => i.id === id)
    try {
      await removeFromCart(id)
      loadCart()
      window.dispatchEvent(new CustomEvent('cart-updated'))
      toast({
        title: t('removedFromCart'),
        description: item ? t('removedFromCartDesc', { name: item.name }) : t('itemRemoved'),
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur suppression article:', error)
      }
      toast({
        title: t('error'),
        description: t('errorRemoveItem'),
        variant: "destructive",
      })
    }
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: t('empty'),
        description: t('emptyDesc'),
        variant: "destructive",
      })
      return
    }
    
    // Vérifier que le token CSRF est disponible
    if (!csrfToken) {
      toast({
        title: t('securityError'),
        description: t('securityErrorDesc'),
        variant: "destructive",
      })
      // Essayer de récupérer le token
      try {
        const response = await fetch('/api/csrf-token', { credentials: 'same-origin' })
        if (response.ok) {
          const data = await response.json()
          setCsrfToken(data.csrfToken)
          // Réessayer après avoir obtenu le token
          setTimeout(() => handleCheckout(), 500)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur récupération token CSRF:', err)
        }
      }
      return
    }
    
    try {
      // Rediriger vers la page checkout (qui gère le formulaire complet)
      router.push(`/${locale}/panier/checkout`)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur redirection checkout:', error)
      }
      toast({
        title: t('error'),
        description: t('errorRedirectError'),
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateSavings = () => {
    return cartItems.reduce((sum, item) => {
      if (isCustomPackLineId(item.id)) {
        const snap = getCustomPackSnapshot(item.id)
        if (snap) return sum + snap.discountAmount
        return sum
      }
      if (item.original_price) {
        return sum + ((item.original_price - item.price) * item.quantity)
      }
      return sum
    }, 0)
  }

  const subtotal = calculateSubtotal()
  const savings = calculateSavings()
  const total = subtotal

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre panier...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('empty')}</h1>
          <p className="text-gray-600 mb-8">{t('emptyDesc')}</p>
          <Link href={`/${locale}/bijoux`}>
            <Button className="bg-orange-600 hover:bg-orange-700">
              {t('continueShopping')}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{cartItems.length} {cartItems.length > 1 ? t('items') : t('item')} {t('inYourCart')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles du panier */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const snap = isCustomPackLineId(item.id) ? getCustomPackSnapshot(item.id) : null
              const isPackLine = item.lineType === 'custom_pack' || isCustomPackLineId(item.id)
              return (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Image du produit */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden mx-auto sm:mx-0">
                      <Image 
                        src={item.image_url || '/placeholder.svg'} 
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                        sizes="80px"
                      />
                    </div>

                    {/* Détails du produit */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      {item.name_ar && (
                        <p className="text-sm text-gray-600 mb-2">{item.name_ar}</p>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      {isPackLine && snap && snap.items.length > 0 && (
                        <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50/40 px-3 py-2 text-sm">
                          <p className="text-xs font-medium text-amber-900/90 mb-1.5">{t('packContents')}</p>
                          <ul className="space-y-1 text-gray-700 text-xs sm:text-sm">
                            {snap.items.map((line) => (
                              <li key={line.productId} className="flex justify-between gap-2">
                                <span className="truncate">{line.name}</span>
                                <span className="flex-shrink-0 text-gray-600">
                                  {(line.price * line.quantity).toFixed(0)} MAD
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 pt-2 border-t border-amber-200/50 flex justify-between text-xs text-gray-600">
                            <span>{t('subtotal')}</span>
                            <span>{snap.subtotal.toFixed(2)} MAD</span>
                          </div>
                          <div className="flex justify-between text-xs text-emerald-700">
                            <span>−20 %</span>
                            <span>−{snap.discountAmount.toFixed(2)} MAD</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Prix et quantité */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 flex-wrap">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        {item.original_price && item.original_price > item.price && !isPackLine && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatCurrency(item.original_price)}
                          </div>
                        )}
                      </div>

                      {!isPackLine ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 w-8 text-center">×1</span>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>

          {/* Résumé de la commande */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('subtotal')}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t('savings')}</span>
                      <span>-{formatCurrency(savings)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>{t('shipping')}</span>
                    <span className="text-green-600">{t('free')}</span>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>{t('total')}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className={`w-full bg-orange-600 hover:bg-orange-700 flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
                  onClick={handleCheckout}
                >
                  <CreditCard className={`w-4 h-4 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('checkout')}
                </Button>

                {/* Avantages */}
                <div className="space-y-3 pt-4 border-t">
                  <div className={`flex items-center gap-3 text-sm text-gray-600 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Truck className="w-4 h-4 text-green-600" />
                    <span>{t('trust.freeShipping')}</span>
                  </div>
                  <div className={`flex items-center gap-3 text-sm text-gray-700 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>{t('trust.qualityGuarantee')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span>Retour sous 30 jours</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <span>Paiement sécurisé</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}