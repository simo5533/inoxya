"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, ShoppingCart, CheckCircle, Truck, Shield } from "lucide-react"
import { getCartItems, clearCart, type CartItem } from "@/lib/cart-favorites"
import { Confetti } from "@/components/Confetti"
import { useTranslations, useLocale } from 'next-intl'

export default function CheckoutPage() {
  const router = useRouter()
  const t = useTranslations('checkout')
  const locale = useLocale()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
    payment_method: "cash_on_delivery"
  })

  const cities = [
    "Casablanca", "Rabat", "Marrakech", "Fès", "Agadir", "Tanger", "Meknès", 
    "Oujda", "Kénitra", "Tétouan", "Safi", "Mohammedia", "Khouribga", "Beni Mellal",
    "El Jadida", "Taza", "Nador", "Settat", "Larache", "Ksar El Kebir", "Autre"
  ]

  useEffect(() => {
    const items = getCartItems()
    if (items.length === 0) {
      router.push(`/${locale}/panier`)
      return
    }
    setCartItems(items)
  }, [router])

  // Récupérer le token CSRF au chargement
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
        if (response.ok) {
          const data = await response.json()
          setCsrfToken(data.csrfToken)
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du token CSRF:', err)
      }
    }
    fetchCsrfToken()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Vérifier que le token CSRF est disponible
    if (!csrfToken) {
      alert('Token de sécurité manquant. Veuillez rafraîchir la page.')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          customer_name: formData.name,
          phone: formData.phone,
          city: formData.city,
          address: formData.address,
          notes: formData.notes,
          payment_method: formData.payment_method,
          items: cartItems.map(item => ({
            bijou_id: item.id,
            price: item.price,
            quantity: item.quantity
          }))
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Erreur lors de la création de la commande')
      }

      const data = await response.json()
      setOrderId(data.order_id || null)
      setIsSubmitting(false)
      setIsSuccess(true)
      
      // Vider le panier
      clearCart()
      
      // Rediriger après 5 secondes
      setTimeout(() => {
        router.push(`/${locale}`)
      }, 5000)
      
    } catch (error: unknown) {
      console.error('Erreur checkout:', error)
      alert((error as Error)?.message || 'Erreur lors de la création de la commande')
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <>
        <Confetti trigger={isSuccess} />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold mb-2">{t('orderConfirmed')}</h2>
            {orderId && (
              <p className="text-gray-700 mb-4 font-medium">{t('orderNumber')}: {orderId}</p>
            )}
            <p className="text-gray-700 mb-6 leading-relaxed">
              {t('contactWithin24h')}
            </p>
            <Button onClick={() => router.push(`/${locale}`)} className="bg-orange-600 hover:bg-orange-700">
              {t('backToHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
      </>
    )
  }

  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-700 leading-relaxed">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('shippingInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Votre nom et prénom"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Numéro de téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0612345678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">{t('city')} *</Label>
                    <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCity')} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{t('address')} *</Label>
                    <Textarea
                      id="address"
                      placeholder={t('address')}
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method">{t('paymentMethod')} *</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => handleInputChange("payment_method", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash_on_delivery">{t('cashOnDelivery')}</SelectItem>
                        <SelectItem value="bank_transfer">{t('bankTransfer')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('notes')}</Label>
                    <Textarea
                      id="notes"
                      placeholder={t('notesPlaceholder')}
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className={`w-full bg-orange-600 hover:bg-orange-700 flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('processing') : t('placeOrder')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Résumé */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  {t('orderSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('total')}</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Badges de confiance */}
                <div className="space-y-3 pt-4 border-t">
                  <div className={`flex items-center gap-3 text-sm text-gray-700 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Truck className="w-4 h-4 text-green-600" />
                    <span>{t('trust.freeShipping')}</span>
                  </div>
                  <div className={`flex items-center gap-3 text-sm text-gray-700 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>{t('trust.qualityGuarantee')}</span>
                  </div>
                  <div className={`flex items-center gap-3 text-sm text-gray-700 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <span>{t('securePayment')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

