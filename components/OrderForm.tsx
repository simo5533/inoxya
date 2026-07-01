"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, User, CreditCard, CheckCircle } from "lucide-react"
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector"
import { PAYMENT_METHOD_COD } from "@/lib/config/payment"
import { ORDER_CONFIG } from "@/lib/order-config"
import { Confetti } from "@/components/Confetti"
import { useTranslations, useLocale } from "next-intl"
import type { CheckoutPaymentMethod } from "@/lib/config/payment"

interface OrderFormProps {
  productName: string
  price: number
  productId: string
}

export default function OrderForm({ productName, price, productId }: OrderFormProps) {
  const t = useTranslations('orderForm')
  const tc = useTranslations('checkout')
  const locale = useLocale()
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
    payment_method: PAYMENT_METHOD_COD as CheckoutPaymentMethod,
  })

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

  const cities = [
    "Casablanca", "Rabat", "Marrakech", "Fès", "Agadir", "Tanger", "Meknès", 
    "Oujda", "Kénitra", "Tétouan", "Safi", "Mohammedia", "Khouribga", "Beni Mellal",
    "El Jadida", "Taza", "Nador", "Settat", "Larache", "Ksar El Kebir", "Autre"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Vérifier que le token CSRF est disponible
    if (!csrfToken) {
      alert(t('errors.csrfMissing'))
      setIsSubmitting(false)
      return
    }

    try {
      // Appeler l'API checkout (paiement manuel)
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
          items: [
            { bijou_id: productId, price, quantity: 1 }
          ]
        })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const details = Array.isArray(data?.details) ? data.details.join('\n') : ''
        const message = details ? `${data?.error ?? t('errors.orderCreation')}\n${details}` : (data?.error || t('errors.orderCreation'))
        throw new Error(message)
      }
      const data = await response.json()
      setOrderId(data.order_id || null)

      setIsSubmitting(false)
      setIsSuccess(true)

      // Réinitialiser le formulaire après 5 secondes
      setTimeout(() => {
        setIsSuccess(false)
        setFormData({
          name: "",
          phone: "",
          city: "",
          address: "",
          notes: "",
          payment_method: PAYMENT_METHOD_COD,
        })
        setOrderId(null)
      }, 5000)
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la commande:', error)
      setIsSubmitting(false)
      const message = error instanceof Error ? error.message : t('errors.orderError')
      alert(message)
    }
  }

  const handleInputChange = (field: string, value: string | CheckoutPaymentMethod) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isSuccess) {
    return (
      <>
        <Confetti trigger={isSuccess} />
        <Card className="border-green-200 bg-green-50 w-full max-w-full min-w-0 overflow-hidden">
          <CardContent className="p-4 sm:p-6 text-center min-w-0">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-green-800 mb-2">{t('success.title')}</h3>
          <div className="text-green-700 mb-4">
            {t('success.message')}
          </div>
          <div className={`text-sm text-green-600 bg-white p-3 rounded-lg ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
            <div><strong>{t('success.order')}:</strong> {orderId || '—'}</div>
            <div><strong>{t('success.product')}:</strong> {productName}</div>
            <div><strong>{t('success.price')}:</strong> {price} MAD</div>
            <div><strong>{t('success.name')}:</strong> {formData.name}</div>
            <div><strong>{t('success.phone')}:</strong> {formData.phone}</div>
            <div><strong>{t('success.city')}:</strong> {formData.city}</div>
          </div>
          <div className="mt-4 text-xs text-green-600">
            <div>⏰ {t('success.responseTime', { time: ORDER_CONFIG.responseTime })}</div>
          </div>
        </CardContent>
      </Card>
      </>
    )
  }

  return (
    <Card className="border-orange-200 w-full max-w-full min-w-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 sm:p-6">
        <CardTitle className={`flex items-center gap-2 text-orange-800 break-words text-base sm:text-lg md:text-2xl ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
          <CreditCard className="w-5 h-5 shrink-0" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 min-w-0">
        <form onSubmit={handleSubmit} className="space-y-4 min-w-0 max-w-full">
          {/* Informations produit */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-6 min-w-0 max-w-full">
            <h4 className={`font-semibold text-gray-800 mb-2 ${locale === 'ar' ? 'text-right' : ''}`}>{t('order')}</h4>
            <div className={`flex justify-between items-start gap-2 min-w-0 max-w-full ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <span className={`text-gray-700 min-w-0 flex-1 text-sm sm:text-base ${locale === 'ar' ? 'text-right pl-2' : 'pr-2'} truncate`} title={productName}>
                {productName}
              </span>
              <span className="font-bold text-orange-600 shrink-0 whitespace-nowrap text-sm sm:text-base tabular-nums">{price} MAD</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <PaymentMethodSelector
              sectionLabel={tc('paymentModeHeading')}
              value={PAYMENT_METHOD_COD}
              onChange={() => {}}
              labelCod={tc('paymentCodLabel')}
              hintCod={tc('paymentCodHint')}
            />
          </div>

        {/* Nom complet */}
        <div className="space-y-2 min-w-0">
          <Label htmlFor="name" className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <User className="w-4 h-4" />
            {t('fullName')} *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder={t('fullNamePlaceholder')}
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
            className="border-orange-200 focus:border-orange-500 min-h-11 w-full max-w-full"
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

          {/* Numéro de téléphone */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="phone" className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Phone className="w-4 h-4" />
              {t('phone')} *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('phonePlaceholder')}
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              required
              className="border-orange-200 focus:border-orange-500 min-h-11 w-full max-w-full"
              dir="ltr"
              inputMode="tel"
            />
          </div>

          {/* Ville */}
          <div className="space-y-2 min-w-0 w-full">
            <Label htmlFor="city" className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <MapPin className="w-4 h-4" />
              {t('city')} *
            </Label>
            <div className="w-full min-w-0 max-w-full">
            <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
              <SelectTrigger className="border-orange-200 focus:border-orange-500 min-h-11 w-full max-w-full">
                <SelectValue placeholder={t('selectCity')} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="address" className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <MapPin className="w-4 h-4" />
              {t('address')} *
            </Label>
            <Textarea
              id="address"
              placeholder={t('addressPlaceholder')}
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              required
              className="border-orange-200 focus:border-orange-500 min-h-[80px] w-full max-w-full"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Notes optionnelles */}
          <div className="space-y-2 min-w-0">
            <Label htmlFor="notes" className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <User className="w-4 h-4" />
              {t('notes')}
            </Label>
            <Textarea
              id="notes"
              placeholder={t('notesPlaceholder')}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="border-orange-200 focus:border-orange-500 min-h-[60px] w-full max-w-full"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Bouton de soumission */}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.phone || !formData.city || !formData.address}
            className={`w-full min-h-12 bg-gradient-to-r from-orange-500 to-yellow-600 text-white hover:from-orange-600 hover:to-yellow-700 py-3 text-lg font-semibold flex items-center justify-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {t('processing')}
              </>
            ) : (
              <>
                <CreditCard className={`w-5 h-5 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {tc('submitOrderCod')}
              </>
            )}
          </Button>

          {/* Informations de livraison */}
          <div className={`text-sm text-gray-600 bg-blue-50 p-3 rounded-lg ${locale === 'ar' ? 'text-right' : ''}`}>
            <p className="font-semibold text-blue-800 mb-1">{t('delivery.title')}:</p>
            <p>• {t('delivery.freeFrom', { amount: ORDER_CONFIG.delivery.freeFrom })}</p>
            <p>• {t('delivery.delay', { delay: ORDER_CONFIG.delivery.delay })}</p>
            <p>• {t('delivery.payment')}</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
