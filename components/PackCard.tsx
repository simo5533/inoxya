"use client"

import type React from "react"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Pack } from "@/lib/types"
import { logger } from "@/lib/logger"
import { getSafeImageSrc } from "@/lib/image-path"
import { useState, useEffect } from "react"
import { ShoppingCart, MapPin, User, Phone, Package, Check, Heart, Star } from "lucide-react"

interface PackCardProps {
  pack: Pack
}

// Images de bijoux pour chaque type
const getBijouImage = (type: string) => {
  const images = {
    montre: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=80&h=80&fit=crop&crop=center",
    bague: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=80&h=80&fit=crop&crop=center",
    collier: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=80&h=80&fit=crop&crop=center",
    bracelet: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=80&h=80&fit=crop&crop=center",
    boucles: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80&h=80&fit=crop&crop=center",
    manchette: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=80&h=80&fit=crop&crop=center",
  }
  return images[type as keyof typeof images] || images.bague
}

// Contenu détaillé de chaque pack avec images
const getPackContent = (slug: string) => {
  const contents = {
    "pack-elegance-or-rose": {
      items: [
        {
          image: getBijouImage("montre"),
          name: "1 Montre Élégante",
          description: "Cadran nacré, bracelet mesh or rose",
          price: "79.99€",
        },
        {
          image: getBijouImage("bague"),
          name: "1 Bague Solitaire",
          description: "Zirconium 1ct, finition or rose",
          price: "49.99€",
        },
        {
          image: getBijouImage("boucles"),
          name: "1 Paire Créoles",
          description: "Moyennes, finition or rose brillante",
          price: "29.99€",
        },
      ],
      totalValue: "159.97€",
      savings: "Économisez 40€",
      rating: 4.8,
      reviews: 127,
    },
    "pack-minimaliste-argent": {
      items: [
        {
          image: getBijouImage("bague"),
          name: "3 Bagues Fines",
          description: "Styles variés, empilables",
          price: "66.97€",
        },
        {
          image: getBijouImage("bracelet"),
          name: "1 Bracelet Délicat",
          description: "Chaîne fine, fermoir discret",
          price: "19.99€",
        },
        {
          image: getBijouImage("collier"),
          name: "1 Collier Simple",
          description: "45cm, style minimaliste",
          price: "24.99€",
        },
      ],
      totalValue: "111.95€",
      savings: "Économisez 22€",
      rating: 4.6,
      reviews: 89,
    },
    "pack-vintage-dore": {
      items: [
        {
          image: getBijouImage("montre"),
          name: "1 Montre Vintage",
          description: "Style rétro, finition dorée",
          price: "84.99€",
        },
        {
          image: getBijouImage("bracelet"),
          name: "1 Bracelet Chaîne",
          description: "Maillons dorés vieillis",
          price: "39.99€",
        },
        {
          image: getBijouImage("boucles"),
          name: "1 Paire Pendantes",
          description: "Style art déco, dorées",
          price: "34.99€",
        },
      ],
      totalValue: "159.97€",
      savings: "Économisez 25€",
      rating: 4.7,
      reviews: 156,
    },
    "pack-moderne-noir": {
      items: [
        {
          image: getBijouImage("bracelet"),
          name: "1 Bracelet Large",
          description: "Acier noir mat, design urbain",
          price: "49.99€",
        },
        {
          image: getBijouImage("bague"),
          name: "1 Bague Géométrique",
          description: "Design contemporain noir",
          price: "44.99€",
        },
        {
          image: getBijouImage("collier"),
          name: "1 Collier Ras de Cou",
          description: "35cm, style moderne",
          price: "39.99€",
        },
      ],
      totalValue: "134.97€",
      savings: "Économisez 15€",
      rating: 4.5,
      reviews: 73,
    },
    "pack-romantique-rose": {
      items: [
        {
          image: getBijouImage("collier"),
          name: "1 Collier Cœur",
          description: "Pendentif cœur, détails roses",
          price: "54.99€",
        },
        {
          image: getBijouImage("boucles"),
          name: "1 Paire Gouttes",
          description: "Boucles pendantes roses",
          price: "44.99€",
        },
        {
          image: getBijouImage("bracelet"),
          name: "1 Bracelet Tennis",
          description: "Cristaux roses, délicat",
          price: "69.99€",
        },
      ],
      totalValue: "169.97€",
      savings: "Économisez 20€",
      rating: 4.9,
      reviews: 203,
    },
    "pack-boheme-ethnique": {
      items: [
        {
          image: getBijouImage("manchette"),
          name: "1 Bracelet Manchette",
          description: "Motifs ethniques gravés",
          price: "49.99€",
        },
        {
          image: getBijouImage("boucles"),
          name: "1 Paire Ethniques",
          description: "Inspiration tribale",
          price: "34.99€",
        },
        {
          image: getBijouImage("bague"),
          name: "1 Bague Large",
          description: "Ornements traditionnels",
          price: "39.99€",
        },
      ],
      totalValue: "124.97€",
      savings: "Économisez 25€",
      rating: 4.4,
      reviews: 91,
    },
  }
  return contents[slug as keyof typeof contents] || { items: [], totalValue: "0€", savings: "", rating: 0, reviews: 0 }
}

export default function PackCard({ pack }: PackCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    notes: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const packContent = getPackContent(pack.slug || '')

  const handleFavoriteToggle = async () => {
    try {
      const newFavoriteStatus = !isFavorite
      setIsFavorite(newFavoriteStatus)
      
      // Appel à l'API pour ajouter/retirer des favoris
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pack_id: pack.id,
          action: newFavoriteStatus ? 'add' : 'remove'
        })
      })
      
      if (!response.ok) {
        // Revert en cas d'erreur
        setIsFavorite(!newFavoriteStatus)
        throw new Error('Erreur lors de la mise à jour des favoris')
      }
      
      // Notification de succès
      if (newFavoriteStatus) {
        logger.info(`${pack.name} ajouté aux favoris`)
      } else {
        logger.info(`${pack.name} retiré des favoris`)
      }
    } catch (error) {
      logger.error('Erreur favoris:', error)
      // Optionnel: afficher une notification d'erreur à l'utilisateur
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
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
      // Validation des données
      if (!formData.name || !formData.address || !formData.phone || !formData.city) {
        alert('Veuillez remplir tous les champs obligatoires')
        setIsSubmitting(false)
        return
      }

      // Appel à l'API checkout (paiement manuel)
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
          payment_method: 'cod',
          items: [
            { pack_id: pack.id, price: pack.price, quantity: 1 }
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la commande')
      }

      const orderData = await response.json()
      
      // Notification de succès
      alert(
        `✅ Commande confirmée pour ${pack.name} !\n\n📋 Numéro de commande: ${orderData.order_id}\n📞 Nous vous contacterons dans les 24h pour confirmer votre commande et organiser la livraison.\n\n📦 Livraison gratuite à votre adresse !`,
      )
      
      // Reset du formulaire
      setIsOpen(false)
      setFormData({ name: "", phone: "", city: "", address: "", notes: "" })
      
    } catch (error) {
      logger.error('Erreur commande:', error)
      alert('❌ Erreur lors de la création de la commande. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white relative flex flex-col min-h-[600px] box-border">
      {/* Bouton Favoris */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleFavoriteToggle}
        className={`absolute top-4 right-4 z-10 rounded-full ${
          isFavorite ? "bg-red-100 text-red-500" : "bg-white/80 text-gray-600"
        } hover:scale-110 transition-all duration-200 shadow-md`}
      >
        <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
      </Button>

      <div className="relative w-full h-[320px] overflow-hidden pack-image-container bg-gray-50 rounded-t-lg p-0 box-border">
        <Image
          src={getSafeImageSrc(pack.image_url) || "/placeholder.svg"}
          alt={pack.name}
          fill
          quality={100}
          sizes="100vw"
          className="object-contain object-center block pack-image-optimized high-resolution-image"
          style={{
            imageRendering: 'crisp-edges',
            width: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            objectPosition: 'center'
          }}
        />
        {/* Badges positionnés en haut-gauche */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {pack.is_featured && (
            <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg border-0">
              Vedette 👑
            </Badge>
          )}
          {packContent.savings && (
            <Badge className="bg-red-600 text-white px-4 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg border-0">
              {packContent.savings}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-6 flex flex-col flex-1 justify-between box-border">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold group-hover:text-orange-600 transition-colors flex-1 break-words">{pack.name}</h3>
        </div>

        {/* Rating et avis */}
        {packContent.rating > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(packContent.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {packContent.rating} ({packContent.reviews} avis)
            </span>
          </div>
        )}

        {/* Contenu du pack avec photos */}
        <div className="mb-4 space-y-3 box-border">
          {packContent.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg box-border flex-wrap gap-2">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-800 text-sm break-words">{item.name}</div>
                  <div className="text-gray-600 text-xs break-words">{item.description}</div>
                </div>
              </div>
              <div className="text-sm font-medium text-orange-600 ml-2 flex-shrink-0 break-words">{item.price}</div>
            </div>
          ))}
        </div>

        <div className="text-gray-600 mb-4 text-sm leading-relaxed break-words">{pack.description}</div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 box-border">
          <div className="flex-shrink-0">
            <div className="text-2xl font-bold text-orange-600">{pack.price.toFixed(2)}€</div>
            {packContent.totalValue !== "0€" && (
              <div className="text-sm text-gray-500 line-through break-words">Valeur: {packContent.totalValue}</div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm text-green-600 font-medium">✓ Livraison Gratuite</div>
            <div className="text-sm text-gray-500 break-words">Paiement à la livraison</div>
          </div>
        </div>

        {/* Conteneur des boutons avec flex-wrap */}
        <div className="flex flex-col gap-3 mt-auto pt-4 box-border">
          {/* Bouton d'achat avec formulaire */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full max-w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 shadow-lg transform hover:scale-105 transition-all duration-200 box-border">
                <ShoppingCart className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="break-words">Procéder au paiement</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold text-gray-800">
                <Package className="w-6 h-6 inline mr-2 text-orange-500" />
                {pack.name}
              </DialogTitle>
            </DialogHeader>

            {/* Récapitulatif du pack avec photos */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg mb-4 border border-orange-200">
              <h4 className="font-semibold mb-3 text-gray-800">📦 Contenu de votre pack :</h4>
              <div className="space-y-3">
                {packContent.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-gray-600">{item.description}</div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-orange-600">{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between items-center">
                <span className="font-semibold">Prix total :</span>
                <span className="text-2xl font-bold text-orange-600">{pack.price.toFixed(2)}€</span>
              </div>
              {packContent.savings && (
                <div className="text-center text-green-600 font-medium text-sm mt-2">
                  🎉 {packContent.savings} par rapport à l'achat séparé !
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nom complet *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Votre nom complet"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  Ville *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Votre ville"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Adresse de livraison *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="address"
                    name="address"
                    placeholder="Votre adresse complète (rue, quartier, code postal)"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="pl-10 pr-3 py-3 border border-gray-300 rounded-md w-full focus:border-orange-500 focus:ring-orange-500 min-h-[80px]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Numéro de téléphone *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (optionnel)
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Instructions spéciales, préférences de livraison..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="border border-gray-300 rounded-md w-full focus:border-orange-500 focus:ring-orange-500 min-h-[60px]"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 text-gray-800">📋 Récapitulatif de commande :</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{pack.name}</span>
                    <span className="font-bold">{pack.price.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Livraison</span>
                    <span className="font-medium">Gratuite ✓</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total à payer</span>
                    <span className="text-orange-600">{pack.price.toFixed(2)}€</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  💳 Paiement à la livraison • 🚚 Livraison sous 2-3 jours
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Commande en cours...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Confirmer ma Commande
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center leading-relaxed">
                🔒 En commandant, vous acceptez nos conditions de vente.
                <br />📞 Nous vous contacterons sous 24h pour confirmer votre commande.
                <br />
                ↩️ Retour gratuit sous 30 jours si non satisfait.
              </p>
            </form>
          </DialogContent>
        </Dialog>

          {/* Bouton Voir détails (ouvre le dialogue) */}
          <Button variant="outline" className="w-full max-w-full box-border" onClick={() => setIsOpen(true)}>
            <span className="break-words">Voir détails</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
