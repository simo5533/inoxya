"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RefreshCw, Package, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  action_url?: string
}

interface OrderItemEnriched {
  id: string
  quantity: number
  price: number
  display_name?: string
  product_name?: string
  pack_name?: string
  image_url?: string
  is_pack?: boolean
}

interface OrderDetails {
  order: { id: string; total_amount: number; status: string; phone?: string; notes?: string; shipping_address?: unknown }
  items: OrderItemEnriched[]
  payments: { payment_method: string; amount: number }[]
}

function parseOrderIdFromActionUrl(actionUrl: string | undefined): string | null {
  if (!actionUrl) return null
  const m = actionUrl.match(/\/admin\/orders\/(\d+)/)
  return m && m[1] ? m[1] : null
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [orderDetailsMap, setOrderDetailsMap] = useState<Record<string, OrderDetails>>({})
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set())
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const requestedOrderIdsRef = useRef<Set<string>>(new Set())

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/notifications', { cache: 'no-store', credentials: 'include' })
    if (res.status === 401 || res.status === 403) {
      setNotifications([])
      setLoading(false)
      return []
    }
    const data = await res.json()
    const list = data.notifications || []
    setNotifications(list)
    setLoading(false)
    return list as Notification[]
  }, [])

  const fetchOrderDetails = useCallback(async (orderId: string) => {
    setLoadingOrders(prev => new Set(prev).add(orderId))
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store', credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      if (data.order && data.items) {
        setOrderDetailsMap(prev => ({ ...prev, [orderId]: { order: data.order, items: data.items, payments: data.payments || [] } }))
      }
    } catch {
      // ignore
    } finally {
      setLoadingOrders(prev => { const s = new Set(prev); s.delete(orderId); return s })
    }
  }, [])

  useEffect(() => {
    load()
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setCsrfToken(data.csrfToken)
        }
      } catch (err) {
        console.error('Erreur récupération token CSRF:', err)
      }
    }
    fetchCsrfToken()
  }, [load])

  useEffect(() => {
    notifications.forEach((n) => {
      if (n.title === 'Nouvelle commande' && n.action_url) {
        const orderId = parseOrderIdFromActionUrl(n.action_url)
        if (orderId && !requestedOrderIdsRef.current.has(orderId)) {
          requestedOrderIdsRef.current.add(orderId)
          fetchOrderDetails(orderId)
        }
      }
    })
  }, [notifications, fetchOrderDetails])

  const markRead = async (id: string, orderId: string | null) => {
    if (!csrfToken) {
      alert('Token de sécurité manquant. Veuillez rafraîchir la page.')
      return
    }
    const body = orderId ? JSON.stringify({ orderId }) : '{}'
    const res = await fetch(`/api/admin/notifications/${id}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body
    })
    if (res.ok) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }
  }

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-stone-600">Chargement des notifications...</p>
      </div>
    </div>
  )

  const reload = async () => {
    setLoading(true)
    setOrderDetailsMap({})
    requestedOrderIdsRef.current = new Set()
    await load()
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900 mb-2">Notifications</h1>
              <p className="text-stone-600">
                {notifications.filter(n => !n.is_read).length} notification{notifications.filter(n => !n.is_read).length > 1 ? 's' : ''} non lue{notifications.filter(n => !n.is_read).length > 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="outline" onClick={reload} disabled={loading} className="border-amber-200 text-stone-700 hover:bg-amber-50">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 border border-stone-200 rounded-xl bg-amber-50/50">
              <p className="text-stone-500 text-lg">Aucune notification</p>
            </div>
          ) : (
            notifications.map((n, index) => {
              const orderId = n.title === 'Nouvelle commande' ? parseOrderIdFromActionUrl(n.action_url) : null
              const details = orderId ? orderDetailsMap[orderId] : null
              const loadingOrder = orderId ? loadingOrders.has(orderId) : false
              const expanded = orderId ? expandedOrders.has(orderId) : false

              return (
                <div
                  key={n.id}
                  className={`border rounded-xl p-6 transition-all duration-300 ${
                    n.is_read ? 'opacity-70 bg-stone-50 border-stone-200' : 'bg-white shadow-md border-amber-200'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${n.is_read ? 'bg-stone-300' : 'bg-amber-500 animate-pulse'}`} />
                        <div className="font-semibold text-lg text-stone-900">{n.title}</div>
                        {!n.is_read && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-stone-700 whitespace-pre-line ml-5">{n.message}</div>
                      <div className="text-xs text-stone-500 mt-2 ml-5">
                        {new Date(n.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      {/* Détails commande (produits + packs) */}
                      {n.title === 'Nouvelle commande' && orderId && (
                        <div className="mt-4 ml-5 border border-amber-100 rounded-lg bg-amber-50/50 overflow-hidden">
                          {loadingOrder ? (
                            <div className="p-4 text-center text-stone-500 text-sm">Chargement des détails...</div>
                          ) : details ? (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleExpanded(orderId)}
                                className="w-full flex items-center justify-between gap-2 p-3 text-left text-stone-800 font-medium hover:bg-amber-100/50 transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-amber-700" />
                                  Détails de la commande ({details.items.length} article{details.items.length > 1 ? 's' : ''})
                                </span>
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              {expanded && (
                                <div className="border-t border-amber-100 px-3 py-3 space-y-2">
                                  {details.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                                      <span className="flex items-center gap-2 text-stone-700 min-w-0">
                                        {item.image_url ? (
                                          <img
                                            src={item.image_url}
                                            alt={item.display_name || item.pack_name || item.product_name || 'Article'}
                                            className="w-10 h-10 rounded object-cover border border-amber-100 shrink-0"
                                          />
                                        ) : item.is_pack || item.pack_name ? (
                                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        ) : (
                                          <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        )}
                                        <span className="truncate">
                                          {item.display_name || item.pack_name || item.product_name || `Article #${item.id}`}
                                        </span>
                                      </span>
                                      <span className="text-stone-600 shrink-0">
                                        {item.quantity} × {Number(item.price).toFixed(0)} MAD = {(item.quantity * Number(item.price)).toFixed(0)} MAD
                                      </span>
                                    </div>
                                  ))}
                                  <div className="pt-2 mt-2 border-t border-amber-100 flex justify-between font-medium text-stone-800">
                                    <span>Total</span>
                                    <span>{Number(details.order.total_amount).toFixed(0)} MAD</span>
                                  </div>
                                  {details.payments[0] && (
                                    <p className="text-xs text-stone-500">
                                      Paiement : {details.payments[0].payment_method === 'cod' || details.payments[0].payment_method === 'cash_on_delivery' ? 'À la livraison' : details.payments[0].payment_method === 'bank_transfer' ? 'Virement bancaire' : details.payments[0].payment_method}
                                    </p>
                                  )}
                                  <Link
                                    href={`/admin/orders/${orderId}`}
                                    className="inline-block text-sm font-medium text-amber-700 hover:text-amber-800"
                                  >
                                    Voir la commande complète →
                                  </Link>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-3 text-sm text-stone-500">Impossible de charger les détails</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {!n.is_read && (
                        <Button
                          onClick={() => markRead(n.id, orderId)}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Marquer comme lue{n.title === 'Nouvelle commande' && orderId ? ' et confirmer la commande' : ''}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
