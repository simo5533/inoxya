"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

interface Order { id: string | number; total_amount: number; status: string; phone?: string; created_at: string }

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' })
        const data = await res.json()
        setOrders(data.orders || [])
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const reload = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' })
      if (!res.ok) throw new Error('Échec chargement commandes')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors du chargement des commandes", e)
      }
      alert("Impossible de charger les commandes (êtes-vous connecté en admin ?)")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id)
      const current = orders.find(o => o.id === id)
      if (current && current.status === status) {
        setUpdatingId(null)
        return
      }
      
      // Récupérer le token CSRF (OBLIGATOIRE)
      let csrfToken = ''
      try {
        const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' })
        if (!csrfRes.ok) {
          const csrfErrorText = await csrfRes.text().catch(() => '')
          console.error('[updateStatus] Erreur CSRF token:', csrfRes.status, csrfErrorText)
          throw new Error(`Impossible de récupérer le token CSRF (${csrfRes.status})`)
        }
        const csrfData = await csrfRes.json()
        csrfToken = csrfData.csrfToken
        if (!csrfToken) {
          console.error('[updateStatus] Token CSRF vide dans la réponse:', csrfData)
          throw new Error('Token CSRF vide')
        }
        console.log('[updateStatus] Token CSRF récupéré avec succès')
      } catch (err) {
        console.error('[updateStatus] Erreur récupération token CSRF:', err)
        alert('Erreur de sécurité. Veuillez rafraîchir la page et réessayer.')
        setUpdatingId(null)
        return
      }
      
      // Appel API avec token CSRF
      console.log('[updateStatus] Appel API:', { id, status, hasCsrfToken: !!csrfToken })
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include', // Important pour envoyer les cookies de session
        body: JSON.stringify({ status })
      })
      
      console.log('[updateStatus] Réponse API:', { status: res.status, statusText: res.statusText, ok: res.ok })
      
      if (!res.ok) {
        let errorMessage = 'Mise à jour échouée'
        let errorData: { error?: string; message?: string; details?: string | string[] } | null = null
        
        try {
          const text = await res.text()
          console.log('[updateStatus] Réponse texte:', text)
          if (text) {
            errorData = JSON.parse(text) as { error?: string; message?: string; details?: string | string[] }
            errorMessage = errorData?.error || errorData?.message || `Erreur ${res.status}: ${res.statusText}`
          }
        } catch (parseError) {
          console.error('[updateStatus] Erreur parsing JSON:', parseError)
          errorMessage = `Erreur ${res.status}: ${res.statusText}`
        }
        
        // Messages d'erreur plus clairs selon le code HTTP
        if (res.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.'
        } else if (res.status === 403) {
          if (errorData?.error === 'Token CSRF invalide ou manquant') {
            errorMessage = 'Token de sécurité invalide. Veuillez rafraîchir la page.'
          } else if (errorData?.error === 'Origine de la requête invalide') {
            errorMessage = 'Erreur de sécurité: origine invalide.'
          } else {
            errorMessage = 'Accès non autorisé. Vous devez être administrateur.'
          }
        } else if (res.status === 400) {
          errorMessage = errorData?.details ? `${errorData.error}: ${Array.isArray(errorData.details) ? errorData.details.join(', ') : errorData.details}` : errorMessage
        }
        
        console.error('[updateStatus] Erreur API:', { status: res.status, errorMessage, errorData })
        throw new Error(errorMessage)
      }
      
      // Vérifier que la réponse est valide
      const result = await res.json().catch(() => {
        console.error('[updateStatus] Erreur parsing JSON réponse')
        return { success: false }
      })
      
      console.log('[updateStatus] Résultat:', result)
      
      if (!result.success) {
        throw new Error(result?.error || 'Mise à jour échouée')
      }
      
      // Recharger depuis le serveur pour éviter l'état désync
      await reload()
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erreur lors de la mise à jour du statut'
      console.error("[updateStatus] Erreur complète:", e)
      alert(errorMessage)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des commandes...</p>
      </div>
    </div>
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300'
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Commandes</h1>
              <p className="text-gray-600">
                {orders.length} commande{orders.length > 1 ? 's' : ''} au total
              </p>
            </div>
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-white/50 backdrop-blur-sm">
              <p className="text-gray-500 text-lg">Aucune commande</p>
            </div>
          ) : (
            orders.map((o, index) => (
              <div 
                key={o.id} 
                className="border rounded-lg p-6 bg-white shadow-md hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-semibold text-lg">Commande #{String(o.id).slice(-8)}</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-orange-600 mb-1">{formatCurrency(o.total_amount)}</div>
                    {o.phone && (
                      <div className="text-sm text-gray-600">📞 {o.phone}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(o.created_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/admin/orders/${String(o.id)}`} className="inline-flex">
                      <Button variant="outline" className="hover:bg-gray-50">
                        Voir détail
                      </Button>
                    </Link>
                    <Button 
                      disabled={updatingId === String(o.id) || o.status === 'confirmed'} 
                      onClick={(e) => { e.preventDefault(); updateStatus(String(o.id), 'confirmed') }}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      Confirmer
                    </Button>
                    <Button 
                      disabled={updatingId === String(o.id) || o.status === 'shipped'} 
                      variant="outline" 
                      onClick={(e) => { e.preventDefault(); updateStatus(String(o.id), 'shipped') }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      Expédier
                    </Button>
                    <Button 
                      disabled={updatingId === String(o.id) || o.status === 'cancelled'} 
                      variant="destructive" 
                      onClick={(e) => { e.preventDefault(); updateStatus(String(o.id), 'cancelled') }}
                      className="disabled:opacity-50"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
