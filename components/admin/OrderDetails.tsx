"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Package, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar,
  ShoppingCart,
  X
} from "lucide-react"

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  price: number
  total: number
}

interface Order {
  id: string
  phone: string
  first_name?: string
  last_name?: string
  email?: string
  address?: string
  city?: string
  postal_code?: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  payment_method: string
  payment_status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  items: OrderItem[]
}

interface OrderDetailsProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onStatusChange?: (orderId: string, newStatus: string) => void
}

export default function OrderDetails({ order, isOpen, onClose, onStatusChange: _onStatusChange }: OrderDetailsProps) {

  if (!order) return null

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
      case 'confirmed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Confirmée</Badge>
      case 'shipped':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Expédiée</Badge>
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Livrée</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Payé</Badge>
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  // handleStatusChange disponible pour utilisation future si nécessaire
  // const handleStatusChange = async (newStatus: string) => {
  //   if (!onStatusChange) return
  //   
  //   setLoading(true)
  //   try {
  //     await onStatusChange(order.id, newStatus)
  //   } catch (error) {
  //     logger.error("Erreur lors du changement de statut:", error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Commande #{order.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations client */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informations client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Téléphone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">{order.phone}</span>
                  </div>
                </div>
                
                {(order.first_name || order.last_name) && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nom complet</label>
                    <div>{order.first_name} {order.last_name}</div>
                  </div>
                )}
                
                {order.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div>{order.email}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Adresse de livraison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.address ? (
                  <div className="space-y-2">
                    <div>{order.address}</div>
                    {order.city && <div>{order.city}</div>}
                    {order.postal_code && <div>Code postal: {order.postal_code}</div>}
                  </div>
                ) : (
                  <div className="text-gray-500">Aucune adresse fournie</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statut et paiement */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Statut de la commande</div>
                    <div className="mt-1">{getStatusBadge(order.status)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Paiement</div>
                    <div className="mt-1">{getPaymentStatusBadge(order.payment_status)}</div>
                  </div>
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Méthode de paiement</div>
                    <div className="mt-1 text-sm">{getPaymentMethodLabel(order.payment_method)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Articles commandés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Articles commandés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total de la commande</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Date de commande</div>
                    <div className="font-medium">{formatDate(order.created_at)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.updated_at !== order.created_at && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Dernière mise à jour</div>
                      <div className="font-medium">{formatDate(order.updated_at)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}