"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShoppingCart, MapPin, User, Phone } from "lucide-react"
import type { Product } from "@/lib/types"
import { useState } from "react"
import { logger } from "@/lib/logger"
import { useLocale } from "next-intl"
import { FavoriteButton } from "@/components/FavoriteButton"

interface BijouCardProps {
  bijou: Product
}

export default function BijouCard({ bijou }: BijouCardProps) {
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation des données
      if (!formData.name || !formData.address || !formData.phone) {
        alert('Veuillez remplir tous les champs obligatoires')
        setIsSubmitting(false)
        return
      }

      // Appel à l'API pour créer la commande
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bijou_id: bijou.id,
          customer_name: formData.name,
          customer_address: formData.address,
          customer_phone: formData.phone,
          quantity: 1,
          total_amount: bijou.price
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la commande')
      }

      const orderData = await response.json()
      
      // Notification de succès
      alert(`✅ Commande confirmée pour ${bijou.name} !\n\n📋 Numéro de commande: ${orderData.order_id}\n📞 Nous vous contacterons bientôt pour confirmer la livraison.`)
      
      // Reset du formulaire
      setIsOpen(false)
      setFormData({ name: "", address: "", phone: "" })
      
    } catch (error) {
      logger.error('Erreur commande:', error)
      alert('❌ Erreur lors de la création de la commande. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={bijou.image_url || "/placeholder.svg?height=300&width=300"}
          alt={bijou.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {!bijou.is_available && <Badge className="absolute top-4 left-4 bg-red-500 text-white">Épuisé</Badge>}

        {bijou.is_custom && <Badge className="absolute top-4 right-4 bg-purple-500 text-white">Sur Mesure</Badge>}

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex space-x-3">
            <FavoriteButton bijouId={bijou.id} variant="icon" />
            <Button
              size="icon"
              onClick={() => setIsOpen(true)}
              disabled={!bijou.is_available}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <Link href={`/${locale}/bijoux/${bijou.id}`}>
          <h3 className="font-semibold mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">
            {bijou.name}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{bijou.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-gray-900">{bijou.price.toFixed(2)}€</div>
        </div>

        {/* Bouton d'achat avec formulaire */}
        <div className="flex gap-2">
          <Link href={`/${locale}/bijoux/${bijou.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full bg-transparent">
              Voir détails
            </Button>
          </Link>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!bijou.is_available} className="bg-orange-500 hover:bg-orange-600 text-white">
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-bold">Commande: {bijou.name}</DialogTitle>
                <div className="text-center text-2xl font-bold text-orange-600 mb-4">{bijou.price.toFixed(2)}€</div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Votre nom complet"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse / Localisation *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Votre adresse complète"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Récapitulatif:</h4>
                  <div className="flex justify-between items-center">
                    <span>{bijou.name}</span>
                    <span className="font-bold">{bijou.price.toFixed(2)}€</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Livraison gratuite • Paiement à la livraison</div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Commande en cours..." : "Confirmer la Commande"}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  En commandant, vous acceptez nos conditions de vente. Nous vous contacterons pour confirmer votre
                  commande.
                </p>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
