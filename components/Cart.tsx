"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { categoryDbValueToDisplayName } from "@/lib/category-mapping"
import { Plus, Minus, Trash2 } from "lucide-react"
import { 
  getCartItems, 
  updateCartQuantity, 
  removeFromCart,
  type CartItem as CartItemType
} from "@/lib/cart-favorites"
import type { Product } from "@/lib/types"
import Image from "next/image"

interface CartItem extends CartItemType {
  name_ar?: string
  original_price?: number
  category?: string
  description?: string
}

interface CartProps {
  onCheckout?: () => void
  showCheckoutButton?: boolean
  compact?: boolean
}

export default function Cart({ onCheckout, showCheckoutButton = true, compact = false }: CartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    const items = getCartItems()
    
    fetch('/api/products', { cache: 'no-store' })
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
      .then((productsData: Product[]) => {
        // Filtrer les produits qui existent encore et sont disponibles
        const validItems = items.filter(item => {
          const product = productsData.find((p: Product) => p.id === item.id)
          return product && product.is_available !== false
        })
        
        // Nettoyer le localStorage si des produits ont été supprimés
        if (validItems.length !== items.length) {
          const validItemsJson = JSON.stringify(validItems)
          localStorage.setItem("inoxya_cart", validItemsJson)
        }
        
        const enrichedItems = validItems.map(item => {
          const product = productsData.find((p: Product) => p.id === item.id)
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
      })
      .catch(() => {
        const enrichedItems = items.map(item => ({
          ...item,
          image_url: item.image_url || '/placeholder.svg',
          category: 'Général'
        }))
        setCartItems(enrichedItems)
        setLoading(false)
      })
  }


  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }
    
    updateCartQuantity(id, newQuantity)
    loadCart()
  }

  const removeItem = (id: string) => {
    removeFromCart(id)
    loadCart()
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

  const subtotal = calculateSubtotal()
  const total = subtotal

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Votre panier est vide</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <div className="w-12 h-12 bg-gray-100 rounded relative overflow-hidden flex-shrink-0">
              <Image 
                src={item.image_url || '/placeholder.svg'} 
                alt={item.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-gray-600">{formatCurrency(item.price)} x {item.quantity}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(item.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {cartItems.map((item) => (
        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0">
            <Image 
              src={item.image_url || '/placeholder.svg'} 
              alt={item.name}
              fill
              className="object-cover rounded-lg"
              sizes="64px"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
            {item.name_ar && (
              <p className="text-sm text-gray-600 mb-1">{item.name_ar}</p>
            )}
            <Badge variant="outline" className="text-xs">
              {categoryDbValueToDisplayName(item.category ?? '')}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-bold text-gray-900">
                {formatCurrency(item.price)}
              </div>
              {item.original_price && item.original_price > item.price && (
                <div className="text-sm text-gray-500 line-through">
                  {formatCurrency(item.original_price)}
                </div>
              )}
            </div>

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
      ))}

      <div className="border-t pt-4">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        
        {showCheckoutButton && onCheckout && (
          <Button 
            className="w-full bg-orange-600 hover:bg-orange-700"
            onClick={onCheckout}
          >
            Passer la commande
          </Button>
        )}
      </div>
    </div>
  )
}

