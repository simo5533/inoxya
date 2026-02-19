"use client"

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Package, CreditCard, User, MapPin, FileText } from 'lucide-react'

interface Order { id: string; total_amount: number; status: string; phone?: string; created_at: string; shipping_address?: unknown; notes?: string }
interface Item { id: string; order_id: string; bijou_id?: string; quantity: number; price: number }
interface Payment { id: string; amount: number; status: string; payment_method: string; created_at: string }

export default function AdminOrderDetailPage() {
  const params = useParams() as { id: string }
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders/${params.id}`, { 
        cache: 'no-store',
        credentials: 'include' // Important pour envoyer les cookies de session
      })
      
      if (!res.ok) {
        if (res.status === 404) {
          setOrder(null)
          return
        }
        if (res.status === 403) {
          alert('Accès non autorisé. Vous devez être administrateur.')
          return
        }
        throw new Error(`Erreur ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      if (data.error) {
        throw new Error(data.error)
      }
      
      setOrder(data.order)
      setItems(data.items || [])
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Erreur chargement commande:', error)
      setOrder(null)
    } finally { 
      setLoading(false) 
    }
  }, [params.id])

  useEffect(() => { 
    load()
    // Récupérer le token CSRF
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
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

  const updateStatus = async (status: string) => {
    if (!csrfToken) {
      alert('Token de sécurité manquant. Veuillez rafraîchir la page.')
      return
    }
    
    try {
      const res = await fetch(`/api/orders/${params.id}/status`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include', // Important pour envoyer les cookies de session
        body: JSON.stringify({ status }) 
      })
      
      if (!res.ok) {
        let errorMessage = 'Mise à jour échouée'
        try {
          const data = await res.json()
          errorMessage = data?.error || data?.message || `Erreur ${res.status}`
          
          if (res.status === 401) {
            errorMessage = 'Session expirée. Veuillez vous reconnecter.'
          } else if (res.status === 403) {
            errorMessage = 'Accès non autorisé. Vous devez être administrateur.'
          }
        } catch {
          errorMessage = `Erreur ${res.status}: ${res.statusText}`
        }
        alert(errorMessage)
        return
      }
      
      const result = await res.json().catch(() => ({ success: false }))
      if (!result.success) {
        alert(result?.error || 'Mise à jour échouée')
        return
      }
      
      await load()
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
      alert('Erreur lors de la mise à jour. Veuillez réessayer.')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>
  if (!order) return <div className="p-6">Commande introuvable.</div>

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300'
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Commande #{String(order.id).slice(-8)}</h1>
              <p className="text-gray-600 mt-1">Créée le {formatDate(order.created_at)}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => updateStatus('confirmed')}
              className="bg-green-600 hover:bg-green-700"
              disabled={order.status === 'confirmed'}
            >
              Confirmer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => updateStatus('shipped')}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
              disabled={order.status === 'shipped'}
            >
              Expédier
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => updateStatus('cancelled')}
              disabled={order.status === 'cancelled'}
            >
              Annuler
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <span className="text-2xl font-bold text-orange-600">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-lg">Informations Client</h2>
            </div>
            <div className="space-y-3 text-sm">
              {order.phone && (
                <div>
                  <span className="text-gray-500">Téléphone:</span>
                  <div className="font-medium">{order.phone}</div>
                </div>
              )}
              {Boolean(order.shipping_address) && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Adresse:</span>
                  </div>
                  <div className="font-medium">
                    {typeof order.shipping_address === 'string' 
                      ? order.shipping_address 
                      : JSON.stringify(order.shipping_address)}
                  </div>
                </div>
              )}
              {order.notes && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Notes:</span>
                  </div>
                  <div className="font-medium">{order.notes}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-lg">Résumé</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Montant total:</span>
                <span className="font-bold text-lg">{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Statut:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium">{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-lg">Articles ({items.length})</h2>
          </div>
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucun article</div>
            ) : (
              items.map(it => (
                <div key={it.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium">
                      {it.bijou_id ? (
                        <Link href={`/admin/produits/${it.bijou_id}`} className="text-blue-600 hover:underline">
                          Produit #{String(it.bijou_id).slice(-8)}
                        </Link>
                      ) : (
                        'Produit supprimé'
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Quantité: {it.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(it.price)}</div>
                    <div className="text-sm text-gray-500">Total: {formatCurrency(it.price * it.quantity)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-lg">Paiements ({payments.length})</h2>
          </div>
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucun paiement</div>
            ) : (
              payments.map(p => (
                <div key={p.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                  <div className="flex-1">
                    <div className="font-medium">{p.payment_method}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(p.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(p.amount)}</div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      p.status === 'completed' ? 'bg-green-100 text-green-800' :
                      p.status === 'failed' ? 'bg-red-100 text-red-800' :
                      p.status === 'refunded' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
