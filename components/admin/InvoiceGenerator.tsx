"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  Printer, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone,
  Package
} from "lucide-react"
import type { Order } from "@/lib/types"
import { logger } from "@/lib/logger"

type ShippingAddress = {
  full_name?: string
  address_line1?: string
  address_line2?: string
  city?: string
  postal_code?: string
  country?: string
  phone?: string
}

interface InvoiceGeneratorProps {
  order: Order & {
    customer_name?: string
    customer_phone?: string
    customer_email?: string
    shipping_address?: string | ShippingAddress
    order_items?: Array<{
      bijou_id: string | number
      quantity: number
      price: number
      bijoux?: {
        name?: string
        image_url?: string
      }
    }>
    total_amount?: number
    phone?: string
    notes?: string
  }
  isOpen?: boolean
  onClose: () => void
}

function isShippingAddressObject(addr: string | ShippingAddress | undefined): addr is ShippingAddress {
  return addr !== undefined && typeof addr === 'object'
}

export default function InvoiceGenerator({ order, onClose }: InvoiceGeneratorProps) {
  const [loading, setLoading] = useState(false)

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
      year: 'numeric'
    })
  }

  const handleGeneratePDF = async () => {
    setLoading(true)
    try {
      // Appel à l'API pour générer le PDF
      const response = await fetch('/api/invoices/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            order_id: order.id,
            customer_info: {
              name: order.customer_name || 'Client',
              address: (() => {
                const addr = order.shipping_address
                if (typeof addr === 'string') return addr
                if (addr && typeof addr === 'object' && 'address_line1' in addr) {
                  return (addr as ShippingAddress).address_line1 || 'Adresse non spécifiée'
                }
                return 'Adresse non spécifiée'
              })(),
              phone: order.customer_phone || 'Téléphone non spécifié'
            },
            items: order.order_items || [],
            total_amount: order.total_amount || order.total
          })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF')
      }

      // Téléchargement du fichier PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `facture_${order.id}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Notification de succès
      logger.info('PDF de la facture généré avec succès')
      alert('✅ PDF de la facture généré avec succès')
      
    } catch (error) {
      logger.error("Erreur lors de la génération PDF:", error)
      alert("❌ Erreur lors de la génération de la facture. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmailInvoice = async () => {
    setLoading(true)
    try {
      // Appel à l'API pour envoyer la facture par email
      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          customer_email: order.customer_email || order.customer_phone,
          customer_name: order.customer_name || 'Client',
            invoice_data: {
              items: order.order_items || [],
              total_amount: order.total_amount || order.total,
              order_date: order.created_at
            }
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la facture par email')
      }

      await response.json()
      
      // Notification de succès
      logger.info('Facture envoyée par email avec succès')
      alert(`✅ Facture envoyée par email à ${order.customer_email || order.customer_phone}`)
      
    } catch (error) {
      logger.error("Erreur lors de l'envoi email:", error)
      alert("❌ Erreur lors de l'envoi de la facture par email. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8">
      {/* En-tête de la facture */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">INOXYA BIJOUX</h1>
          <div className="text-gray-600">Bijoux d'exception du Maroc</div>
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Casablanca, Maroc</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+212 6 12 34 56 78</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>contact@inoxya-bijoux.ma</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900">FACTURE</h2>
          <div className="text-gray-600">N° {order.id}</div>
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Date: {order.created_at ? formatDate(String(order.created_at)) : 'Non spécifiée'}</span>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-sm">
                {order.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Informations client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Facturer à</h3>
          <div className="space-y-2 text-sm">
            <div className="font-medium">Client #{order.user_id}</div>
            {isShippingAddressObject(order.shipping_address) && (
              <>
                <div>{order.shipping_address.full_name || "Nom non renseigné"}</div>
                <div>{order.shipping_address.address_line1}</div>
                {order.shipping_address.address_line2 && (
                  <div>{order.shipping_address.address_line2}</div>
                )}
                <div>{order.shipping_address.city}, {order.shipping_address.postal_code}</div>
                <div>{order.shipping_address.country}</div>
                {order.shipping_address.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.shipping_address.phone}
                  </div>
                )}
              </>
            )}
            {order.shipping_address && typeof order.shipping_address === 'string' && (
              <div>{order.shipping_address}</div>
            )}
            {order.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {order.phone}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Livrer à</h3>
          <div className="space-y-2 text-sm">
            {isShippingAddressObject(order.shipping_address) ? (
              <>
                <div>{order.shipping_address.full_name || "Nom non renseigné"}</div>
                <div>{order.shipping_address.address_line1}</div>
                {order.shipping_address.address_line2 && (
                  <div>{order.shipping_address.address_line2}</div>
                )}
                <div>{order.shipping_address.city}, {order.shipping_address.postal_code}</div>
                <div>{order.shipping_address.country}</div>
              </>
            ) : order.shipping_address && typeof order.shipping_address === 'string' ? (
              <div>{order.shipping_address}</div>
            ) : (
              <div className="text-gray-500">Adresse de livraison non renseignée</div>
            )}
          </div>
        </div>
      </div>

      {/* Détails des articles */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Articles commandés</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Article</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantité</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Prix unitaire</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.bijoux?.image_url ? (
                            <Image 
                              src={item.bijoux.image_url} 
                              alt={item.bijoux.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{item.bijoux?.name || "Produit supprimé"}</div>
                          <div className="text-sm text-gray-500">Référence: {item.bijou_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{item.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium">{formatCurrency(item.price)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Aucun article trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sous-total</span>
              <span>{formatCurrency(order.total_amount || order.total || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frais de livraison</span>
              <span>Gratuit</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount || order.total || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Notes</h3>
          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            {order.notes}
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div className="text-center text-sm text-gray-500 border-t pt-6">
        <p>Merci pour votre confiance !</p>
        <p className="mt-2">INOXYA BIJOUX - Bijoux d'exception du Maroc</p>
        <p>www.inoxya-bijoux.ma | contact@inoxya-bijoux.ma</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t">
        <Button 
          onClick={handleGeneratePDF} 
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Télécharger PDF
        </Button>
        
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimer
        </Button>
        
        <Button variant="outline" onClick={handleEmailInvoice} disabled={loading}>
          <Mail className="w-4 h-4 mr-2" />
          Envoyer par email
        </Button>
        
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  )
}