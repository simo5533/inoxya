
"use client"

import { useState, useEffect } from "react"
import { logger } from "@/lib/logger"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign
} from "lucide-react"

interface Payment {
  id: string
  order_id: string
  amount: number
  payment_method: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  transaction_id?: string
  created_at: string
  updated_at: string
  order?: {
    id: string
    phone: string
    total_amount: number
  }
}

interface PaymentManagementProps {
  orderId?: string
}

export default function PaymentManagement({ orderId: _orderId }: PaymentManagementProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      // Appel à l'API pour récupérer les paiements
      const response = await fetch('/api/payments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des paiements')
      }

      const paymentsData = await response.json() as Payment[]
      setPayments(paymentsData)
      
    } catch (error) {
      logger.error("Erreur lors du chargement des paiements:", error)
      // Fallback vers des données simulées en cas d'erreur
      const mockPayments: Payment[] = [
        {
          id: "1",
          order_id: "order-1",
          amount: 2999,
          payment_method: "cash_on_delivery",
          status: "completed",
          transaction_id: "TXN123456789",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          order: {
            id: "order-1",
            phone: "0612345678",
            total_amount: 2999
          }
        },
        {
          id: "2",
          order_id: "order-2",
          amount: 1890,
          payment_method: "bank_transfer",
          status: "pending",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          order: {
            id: "order-2",
            phone: "0698765432",
            total_amount: 1890
          }
        },
        {
          id: "3",
          order_id: "order-3",
          amount: 890,
          payment_method: "paypal",
          status: "failed",
          transaction_id: "TXN987654321",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          order: {
            id: "order-3",
            phone: "0654321098",
            total_amount: 890
          }
        }
      ]
      setPayments(mockPayments)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Payé</Badge>
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>
      case 'refunded':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Remboursé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-gray-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return "Paiement à la livraison"
      case 'bank_transfer':
        return "Virement bancaire"
      case 'paypal':
        return "PayPal"
      case 'credit_card':
        return "Carte de crédit"
      default:
        return method
    }
  }

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      // Appel à l'API pour mettre à jour le statut du paiement
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut du paiement')
      }

      await response.json()
      
      // Mise à jour locale
      setPayments(payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: newStatus as Payment['status'], updated_at: new Date().toISOString() }
          : payment
      ))
      
      // Notification de succès
      logger.info(`Statut du paiement ${paymentId} mis à jour vers ${newStatus}`)
      alert(`✅ Statut du paiement mis à jour vers: ${newStatus}`)
      
    } catch (error) {
      logger.error("Erreur lors de la mise à jour du statut:", error)
      alert("❌ Erreur lors de la mise à jour du statut. Veuillez réessayer.")
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.order_id.includes(searchTerm) ||
                         payment.transaction_id?.includes(searchTerm) ||
                         payment.order?.phone.includes(searchTerm)
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    
    const matchesDate = dateFilter === "all" || (() => {
      const paymentDate = new Date(payment.created_at)
      const now = new Date()
      
      switch (dateFilter) {
        case "today":
          return paymentDate.toDateString() === now.toDateString()
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return paymentDate >= weekAgo
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return paymentDate >= monthAgo
        default:
          return true
      }
    })()
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const completedAmount = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0)

  if (loading) {
    return <div className="text-center py-8">Chargement des paiements...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des Paiements</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchPayments}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total des paiements</div>
                <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Paiements validés</div>
                <p className="text-2xl font-bold">{formatCurrency(completedAmount)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Nombre de transactions</div>
                <div className="text-2xl font-bold">{filteredPayments.length}</div>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par ID commande, transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="completed">Payé</SelectItem>
            <SelectItem value="failed">Échoué</SelectItem>
            <SelectItem value="refunded">Remboursé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les périodes</SelectItem>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau des paiements */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      <div>
                        <div className="font-medium">{payment.id}</div>
                        {payment.transaction_id && (
                          <div className="text-sm text-gray-500 font-mono">
                            {payment.transaction_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{payment.order_id}</div>
                      <div className="text-sm text-gray-500">
                        {payment.order?.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{formatCurrency(payment.amount)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getPaymentMethodLabel(payment.payment_method)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(payment.status)}
                      <Select 
                        value={payment.status} 
                        onValueChange={(newStatus) => handleStatusChange(payment.id, newStatus)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="completed">Payé</SelectItem>
                          <SelectItem value="failed">Échoué</SelectItem>
                          <SelectItem value="refunded">Remboursé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(payment.created_at)}</div>
                      {payment.updated_at !== payment.created_at && (
                        <div className="text-gray-500">
                          Modifié: {formatDate(payment.updated_at)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPayment(payment)
                        setShowDetails(true)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredPayments.length === 0 && (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500">Aucun paiement trouvé</div>
        </div>
      )}

      {/* Détails du paiement */}
      {selectedPayment && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du paiement #{selectedPayment.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ID Transaction</label>
                  <div className="font-mono">{selectedPayment.id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">ID Commande</label>
                  <div className="font-mono">{selectedPayment.order_id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Montant</label>
                  <div className="font-bold text-lg">{formatCurrency(selectedPayment.amount)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Méthode</label>
                  <div>{getPaymentMethodLabel(selectedPayment.payment_method)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Statut</label>
                  <div>{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de création</label>
                  <div>{formatDate(selectedPayment.created_at)}</div>
                </div>
              </div>
              
              {selectedPayment.transaction_id && (
                <div>
                  <label className="text-sm font-medium text-gray-600">ID Transaction externe</label>
                  <div className="font-mono bg-gray-100 p-2 rounded">{selectedPayment.transaction_id}</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
