"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Payment { id: string | number; order_id: string | number; amount: number; status: string; payment_method: string; created_at: string }

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/payments', { cache: 'no-store' })
        const data = await res.json()
        setPayments(data.payments || [])
      } finally { setLoading(false) }
    }
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
  }, [])

  const reload = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments', { cache: 'no-store' })
      const data = await res.json()
      setPayments(data.payments || [])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    if (!csrfToken) {
      alert('Token de sécurité manquant. Veuillez rafraîchir la page.')
      return
    }
    await fetch(`/api/payments/${id}/status`, { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      }, 
      body: JSON.stringify({ status }) 
    })
    await reload()
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des paiements...</p>
      </div>
    </div>
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'failed': return 'bg-red-100 text-red-800 border-red-300'
      case 'refunded': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
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
              <h1 className="text-3xl font-bold mb-2">Paiements</h1>
              <p className="text-gray-600">
                {payments.length} paiement{payments.length > 1 ? 's' : ''} au total
              </p>
            </div>
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-white/50 backdrop-blur-sm">
              <p className="text-gray-500 text-lg">Aucun paiement</p>
            </div>
          ) : (
            payments.map((p, index) => (
              <div 
                key={p.id} 
                className="border rounded-lg p-6 bg-white shadow-md hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-semibold text-lg">Paiement #{String(p.id).slice(-8)}</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-orange-600 mb-1">{formatCurrency(p.amount)}</div>
                    <div className="text-sm text-gray-600 mb-1">
                      📦 <Link href={`/admin/orders/${p.order_id}`} className="text-blue-600 hover:underline font-medium">Commande: {String(p.order_id).slice(-8)}</Link> • 💳 {p.payment_method}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      onClick={() => updateStatus(String(p.id), 'completed')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={p.status === 'completed'}
                    >
                      Marquer payé
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => updateStatus(String(p.id), 'failed')}
                      disabled={p.status === 'failed'}
                    >
                      Échec
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => updateStatus(String(p.id), 'refunded')}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      disabled={p.status === 'refunded'}
                    >
                      Remboursé
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
