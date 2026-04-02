"use client"

// Force dynamic so build can collect page data (avoids PageNotFoundError on Vercel)
export const dynamic = "force-dynamic"

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
import { getCustomPackSnapshot, isCustomPackLineId } from "@/lib/custom-pack"
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
  }, [router, locale])

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
          items: cartItems.map((item) => {
            if (item.lineType === "custom_pack" || isCustomPackLineId(item.id)) {
              const snap = getCustomPackSnapshot(item.id)
              if (!snap || !snap.items.length) {
                throw new Error(
                  "Détail du pack personnalisé introuvable. Videz le panier et recréez votre pack."
                )
              }
              return {
                quantity: 1,
                price: snap.total,
                custom_pack_lines: snap.items.map((line) => ({
                  bijou_id: Number(line.productId),
                  quantity: line.quantity,
                })),
              }
            }
            return {
              bijou_id: item.id,
              product_id: item.id,
              price: item.price,
              quantity: item.quantity,
            }
          }),
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
        <div className="min-h-screen bg-gray-50 w-full max-w-full min-w-0 overflow-x-hidden flex items-center justify-center px-4 py-8">
          <Card className="max-w-md w-full min-w-0 overflow-hidden">
            <CardContent className="p-6 sm:p-8 text-center min-w-0">
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
    <div className="min-h-screen bg-gray-50 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="w-full min-w-0 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 sm:mb-8 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">{t('title')}</h1>
          <p className="text-gray-700 leading-relaxed break-words">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 min-w-0">
          {/* Formulaire */}
          <div className="lg:col-span-2 min-w-0">
            <Card className="w-full max-w-full min-w-0 overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl break-words">
                  <CreditCard className="w-5 h-5 shrink-0" />
                  {t('shippingInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 min-w-0">
                <form onSubmit={handleSubmit} className="space-y-4 min-w-0 max-w-full">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Votre nom et prénom"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      className="min-h-11 w-full max-w-full"
                    />
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="phone">Numéro de téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0612345678"
                      inputMode="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                      className="min-h-11 w-full max-w-full"
                    />
                  </div>

                  <div className="space-y-2 min-w-0 w-full">
                    <Label htmlFor="city">{t('city')} *</Label>
                    <div className="w-full min-w-0 max-w-full">
                      <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                        <SelectTrigger className="min-h-11 w-full max-w-full">
                          <SelectValue placeholder={t('selectCity')} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="address">{t('address')} *</Label>
                    <Textarea
                      id="address"
                      placeholder={t('address')}
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      required
                      className="min-h-[80px] w-full max-w-full"
                    />
                  </div>

                  <div className="space-y-2 min-w-0 w-full">
                    <Label htmlFor="payment_method">{t('paymentMethod')} *</Label>
                    <div className="w-full min-w-0 max-w-full">
                      <Select value={formData.payment_method} onValueChange={(value) => handleInputChange("payment_method", value)}>
                        <SelectTrigger className="min-h-11 w-full max-w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash_on_delivery">{t('cashOnDelivery')}</SelectItem>
                          <SelectItem value="bank_transfer">{t('bankTransfer')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="notes">{t('notes')}</Label>
                    <Textarea
                      id="notes"
                      placeholder={t('notesPlaceholder')}
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      className="w-full max-w-full"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className={`w-full min-h-12 bg-orange-600 hover:bg-orange-700 flex items-center justify-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('processing') : t('placeOrder')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Résumé */}
          <div className="lg:col-span-1 min-w-0">
            <Card className="sticky top-8 w-full max-w-full min-w-0 overflow-hidden">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl break-words">
                  <ShoppingCart className="w-5 h-5 shrink-0" />
                  {t('orderSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0 min-w-0">
                <div className="space-y-2 min-w-0">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between gap-2 text-sm min-w-0">
                      <span className="min-w-0 flex-1 break-words pr-2">{item.name} x{item.quantity}</span>
                      <span className="shrink-0 whitespace-nowrap tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 min-w-0">
                  <div className="flex justify-between gap-2 text-lg font-bold min-w-0">
                    <span className="min-w-0">{t('total')}</span>
                    <span className="shrink-0 whitespace-nowrap tabular-nums">{formatCurrency(total)}</span>
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

