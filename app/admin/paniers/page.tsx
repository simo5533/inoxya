"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, User, Calendar, Eye } from 'lucide-react'
import Link from 'next/link'
import { logger } from '@/lib/logger'

interface CartItem {
  id: string
  user_id: string | null
  user_phone: string | null
  user_name: string | null
  bijou_id: string
  product_name: string
  price: number
  image_url: string | null
  quantity: number
  created_at: string
}

export default function AdminCartsPage() {
  const [carts, setCarts] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadCarts = async () => {
    try {
      const res = await fetch('/api/admin/carts', { cache: 'no-store' })
      const data = await res.json()
      setCarts(data.carts || [])
    } catch (error) {
      logger.error('Erreur chargement paniers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCarts()
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadCarts, 30000)
    return () => clearInterval(interval)
  }, [])

  // Grouper les paniers par utilisateur
  const groupedCarts = carts.reduce((acc, item) => {
    const key = item.user_id || 'visiteur'
    let group = acc[key]
    if (!group) {
      group = {
        user_id: item.user_id,
        user_phone: item.user_phone,
        user_name: item.user_name,
        items: [],
        total: 0,
        totalItems: 0,
        lastUpdate: item.created_at
      }
      acc[key] = group
    }
    group.items.push(item)
    group.total += item.price * item.quantity
    group.totalItems += item.quantity
    if (new Date(item.created_at) > new Date(group.lastUpdate)) {
      group.lastUpdate = item.created_at
    }
    return acc
  }, {} as Record<string, {
    user_id: string | null
    user_phone: string | null
    user_name: string | null
    items: CartItem[]
    total: number
    totalItems: number
    lastUpdate: string
  }>)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paniers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Paniers Actifs</h1>
            <p className="text-gray-600">
              {carts.length} article{carts.length > 1 ? 's' : ''} dans {Object.keys(groupedCarts).length} panier{Object.keys(groupedCarts).length > 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={loadCarts} variant="outline" className="hover:bg-gray-50">
            <Calendar className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

      {Object.keys(groupedCarts).length === 0 ? (
        <Card className="bg-white/50 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Aucun panier actif</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedCarts).map(([key, group], index) => (
            <Card key={key} className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50/30 border-b border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        {group.user_name || group.user_phone || 'Visiteur'}
                      </CardTitle>
                      {group.user_phone && group.user_phone !== 'Visiteur' && (
                        <p className="text-sm text-gray-600">📞 {group.user_phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {formatCurrency(group.total)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {group.totalItems} article{group.totalItems > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Dernière mise à jour: {formatDate(group.lastUpdate)}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {item.image_url && (
                        <Image
                          src={item.image_url}
                          alt={item.product_name || 'Produit'}
                          width={64}
                          height={64}
                          className="object-cover rounded-lg shadow-sm"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.product_name}</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-600">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        <Link href={`/admin/produits/${item.bijou_id}`}>
                          <Button variant="ghost" size="sm" className="mt-1 hover:bg-orange-50">
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

