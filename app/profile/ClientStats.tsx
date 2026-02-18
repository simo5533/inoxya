"use client"

import { useState, useEffect } from "react"
import { getCartCount, getFavorites } from "@/lib/cart-favorites"

interface ClientStatsProps {
  type: 'favorites' | 'cart'
}

export default function ClientStats({ type }: ClientStatsProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      if (type === 'favorites') {
        const favorites = getFavorites()
        setCount(favorites.length)
      } else {
        const cartCount = getCartCount()
        setCount(cartCount)
      }
    }
    
    updateCount()
    
    // Écouter les changements dans localStorage
    const handleStorageChange = () => {
      updateCount()
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Vérifier périodiquement (pour les changements dans le même onglet)
    const interval = setInterval(updateCount, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [type])

  return (
    <>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm text-gray-600">
        {type === 'favorites' ? 'Favoris' : 'Panier'}
      </div>
    </>
  )
}

