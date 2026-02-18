"use client"

// Gestion du panier et des favoris en localStorage
// Note: logger remplacé par console pour compatibilité client

export interface CartItem {
  id: string
  name: string
  price: number
  image_url: string
  quantity: number
}

export interface FavoriteItem {
  id: string
  name: string
  price: number
  image_url: string
  name_ar?: string
  categories?: {
    name: string
    slug: string
  }
}

// Interface pour les produits en entrée
export interface ProductInput {
  id: string
  name: string
  price: number
  image_url: string
  name_ar?: string
  categories?: {
    name: string
    slug: string
  }
}

// ==================== FAVORIS ====================

export const getFavorites = (): FavoriteItem[] => {
  if (typeof window === "undefined") return []
  const favorites = localStorage.getItem("inoxya_favorites")
  return favorites ? JSON.parse(favorites) : []
}

export const addToFavorites = (product: ProductInput): void => {
  const favorites = getFavorites()
  const favoriteItem: FavoriteItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    name_ar: product.name_ar,
    categories: product.categories,
  }

  const exists = favorites.find((item) => item.id === product.id)
  if (!exists) {
    favorites.push(favoriteItem)
    localStorage.setItem("inoxya_favorites", JSON.stringify(favorites))
  }
}

export const removeFromFavorites = (productId: string): void => {
  const favorites = getFavorites()
  const updatedFavorites = favorites.filter((item) => item.id !== productId)
  localStorage.setItem("inoxya_favorites", JSON.stringify(updatedFavorites))
}

export const isFavorite = (productId: string): boolean => {
  const favorites = getFavorites()
  return favorites.some((item) => item.id === productId)
}

// ==================== PANIER ====================

export const getCartItems = (): CartItem[] => {
  if (typeof window === "undefined") return []
  const cart = localStorage.getItem("inoxya_cart")
  return cart ? JSON.parse(cart) : []
}

export const addToCart = async (product: ProductInput, quantity = 1): Promise<void> => {
  const cartItems = getCartItems()
  const cartItem: CartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    quantity,
  }

  const existingItem = cartItems.find((item) => item.id === product.id)
  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cartItems.push(cartItem)
  }

  localStorage.setItem("inoxya_cart", JSON.stringify(cartItems))
  
  // Synchroniser avec le serveur pour les notifications admin
  try {
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        quantity,
        action: 'add'
      })
    })
  } catch (error) {
    console.warn('Erreur synchronisation panier:', error)
  }
}

export const removeFromCart = async (productId: string): Promise<void> => {
  const cartItems = getCartItems()
  const updatedCart = cartItems.filter((item) => item.id !== productId)
  localStorage.setItem("inoxya_cart", JSON.stringify(updatedCart))
  
  // Synchroniser avec le serveur pour les notifications admin
  try {
    await fetch(`/api/cart?product_id=${productId}`, {
      method: 'DELETE'
    })
  } catch (error) {
    console.warn('Erreur synchronisation panier:', error)
  }
}

export const updateCartQuantity = async (productId: string, quantity: number): Promise<void> => {
  const cartItems = getCartItems()
  const item = cartItems.find((item) => item.id === productId)
  if (item) {
    if (quantity <= 0) {
      await removeFromCart(productId)
    } else {
      item.quantity = quantity
      localStorage.setItem("inoxya_cart", JSON.stringify(cartItems))
      
      // Synchroniser avec le serveur pour les notifications admin
      try {
        await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            quantity
          })
        })
      } catch (error) {
        console.warn('Erreur synchronisation panier:', error)
      }
    }
  }
}

export const getCartTotal = (): number => {
  const cartItems = getCartItems()
  return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
}

export const getCartCount = (): number => {
  const cartItems = getCartItems()
  return cartItems.reduce((total, item) => total + item.quantity, 0)
}

export const clearCart = (): void => {
  localStorage.removeItem("inoxya_cart")
}
