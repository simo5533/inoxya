"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface Notification { id: string; title: string; message: string; type: string; is_read: boolean; created_at: string }

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
    const data = await res.json()
    setNotifications(data.notifications || [])
    setLoading(false)
  }

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
  }, [])

  const markRead = async (id: string) => {
    if (!csrfToken) {
      alert('Token de sécurité manquant. Veuillez rafraîchir la page.')
      return
    }
    await fetch(`/api/admin/notifications/${id}/read`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      }
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des notifications...</p>
      </div>
    </div>
  )

  const reload = async () => {
    setLoading(true)
    await load()
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-gray-600">
                {notifications.filter(n => !n.is_read).length} notification{notifications.filter(n => !n.is_read).length > 1 ? 's' : ''} non lue{notifications.filter(n => !n.is_read).length > 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-white/50 backdrop-blur-sm">
              <p className="text-gray-500 text-lg">Aucune notification</p>
            </div>
          ) : (
            notifications.map((n, index) => (
              <div 
                key={n.id} 
                className={`border rounded-lg p-6 flex items-center justify-between transition-all duration-300 hover:shadow-lg ${
                  n.is_read ? 'opacity-60 bg-gray-50' : 'bg-white shadow-md border-orange-200'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${n.is_read ? 'bg-gray-300' : 'bg-orange-500 animate-pulse'}`}></div>
                    <div className="font-semibold text-lg">{n.title}</div>
                    {!n.is_read && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-line ml-5">{n.message}</div>
                  <div className="text-xs text-gray-500 mt-2 ml-5">
                    {new Date(n.created_at).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="ml-4">
                  {!n.is_read && (
                    <Button 
                      onClick={() => markRead(n.id)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Marquer comme lue
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
