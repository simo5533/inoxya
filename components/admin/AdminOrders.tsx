"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Search, RefreshCw, Eye, Package } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string | number
  user_id?: string | null
  total_amount: number
  status: string
  created_at: string
  order_items?: any[]
  phone?: string
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders', { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert("Vous devez être connecté en tant qu'admin pour voir les commandes")
          return
        }
        throw new Error('Erreur lors du chargement des commandes')
      }
      const data = await res.json()
      const ordersList = Array.isArray(data.orders) ? data.orders : []
      setOrders(ordersList)
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error)
      alert("Erreur lors du chargement des commandes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Terminée</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">En attente</Badge>
      case 'shipped':
        return <Badge className="bg-blue-500 text-white">Expédiée</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Annulée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = String(order.id).includes(searchTerm) || 
                         String(order.user_id).includes(searchTerm)
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="text-center py-8">Chargement des commandes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des Commandes</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="shipped">Expédiée</SelectItem>
            <SelectItem value="completed">Terminée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">#{String(order.id).slice(-6)}</div>
                    <div className="text-sm text-gray-500">ID: {order.id}</div>
                  </TableCell>
                  <TableCell>
                    {order.phone ? (
                      <>
                        <div className="font-medium">📞 {order.phone}</div>
                        {order.user_id && (
                          <div className="text-sm text-gray-500">ID: {order.user_id}</div>
                        )}
                      </>
                    ) : order.user_id ? (
                      <>
                        <div className="font-medium">Client {String(order.user_id).slice(-4)}</div>
                        <div className="text-sm text-gray-500">ID: {order.user_id}</div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">Client anonyme</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Package className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">
                            {item.bijoux?.name} (x{item.quantity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{formatCurrency(order.total_amount)}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm" title="Voir les détails">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Select 
                        value={order.status} 
                        onValueChange={async (newStatus) => {
                          try {
                            const res = await fetch(`/api/orders/${order.id}/status`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus })
                            })
                            if (!res.ok) {
                              const error = await res.json()
                              throw new Error(error.error || 'Erreur lors de la mise à jour')
                            }
                            await fetchOrders()
                          } catch (error) {
                            console.error("Erreur lors de la mise à jour du statut:", error)
                            alert(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
                          }
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="confirmed">Confirmée</SelectItem>
                          <SelectItem value="shipped">Expédiée</SelectItem>
                          <SelectItem value="completed">Terminée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune commande trouvée</p>
        </div>
      )}
    </div>
  )
}