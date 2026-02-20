"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ShoppingCart, Gift, Sparkles, Crown, Gem, Package, Star, Eye } from "lucide-react"
import { Heart } from "lucide-react"
import { logger } from "@/lib/logger"
import { addToFavorites as addToFavoritesLib } from "@/lib/cart-favorites"
import { useTranslations, useLocale } from 'next-intl'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

interface Pack {
  id: string
  name: string
  name_ar?: string
  description: string
  price: number
  original_price?: number
  image_url: string
  items_count: number
  category: string
  is_featured?: boolean
}

export default function PacksPage() {
  const { toast } = useToast()
  const t = useTranslations('packs')
  const locale = useLocale()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", notes: "" })
  const [submitting, setSubmitting] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
        const data = await response.json()
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken)
        }
      } catch (error) {
        logger.error('Erreur lors de la récupération du token CSRF:', error)
      }
    }
    fetchCsrfToken()
  }, [])

  useEffect(() => {
    // Charger les packs depuis l'API
    const fetchPacks = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/packs', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        
        let data: unknown = null
        
        // Parser la réponse JSON
        try {
          data = await response.json()
        } catch (parseError) {
          logger.error('Erreur lors du parsing JSON:', parseError)
          setPacks([])
          setLoading(false)
          return
        }
        
        // PHASE 5: Vérifier le status HTTP et afficher une erreur explicite si 503
        if (!response.ok) {
          if (response.status === 503) {
            logger.error('API /api/packs: Base de données indisponible (503)')
            // Afficher un message d'erreur explicite au lieu de "Aucun pack disponible"
            toast({
              title: "Erreur de connexion",
              description: "La base de données est temporairement indisponible. Veuillez réessayer plus tard.",
              variant: "destructive",
            })
          } else {
            logger.error(`API /api/packs: Erreur HTTP ${response.status}`)
          }
          setPacks([])
          setLoading(false)
          return
        }
        
        // Vérifier si c'est une erreur (objet avec propriété 'error')
        if (data && typeof data === 'object' && data !== null && 'error' in data) {
          const errorData = data as Record<string, unknown>
          const errorMsg = errorData['error'] || errorData['message']
          logger.warn('API /api/packs a retourné une erreur:', { error: errorMsg })
          // PHASE 5: Afficher un message d'erreur explicite
          toast({
            title: "Erreur",
            description: (errorData['message'] as string) || (errorData['error'] as string) || "Impossible de charger les packs",
            variant: "destructive",
          })
          setPacks([])
          setLoading(false)
          return
        }
        
        // S'assurer que data est un tableau
        let packsArray: unknown[] = []
        if (Array.isArray(data)) {
          packsArray = data
        } else if (data && typeof data === 'object' && data !== null && 'packs' in data && Array.isArray((data as { packs: unknown[] }).packs)) {
          // Si l'API retourne { packs: [...] }
          packsArray = (data as { packs: unknown[] }).packs
        } else {
          logger.warn('API /api/packs a retourné un format inattendu:', { dataType: typeof data, data })
          packsArray = []
        }
        
        // Transformer les packs pour correspondre à l'interface Pack
        const transformedPacks: Pack[] = packsArray.map((pack: unknown) => {
          const p = pack as Record<string, unknown>
          return {
            id: (p['id'] as string | number | undefined)?.toString() || `pack-${Math.random()}`,
            name: (p['name'] as string) || 'Pack sans nom',
            name_ar: (p['name_ar'] as string) || '',
            description: (p['description'] as string) || '',
            price: (p['price'] as number) || 0,
            original_price: p['original_price'] as number | undefined,
            image_url: (p['image_url'] as string) || '/placeholder.svg',
            items_count: Array.isArray(p['composition']) ? p['composition'].length : 0,
            category: (p['category'] as string) || 'general',
            is_featured: (p['is_featured'] as boolean) || false
          }
        })
        
        setPacks(transformedPacks)
      } catch (error) {
        logger.error('Erreur lors du chargement des packs:', error)
        // En cas d'erreur, ne pas mettre un tableau vide mais essayer de récupérer les données
        setPacks([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchPacks()
  }, [toast])

  const addToFavorites = (pack: Pack) => {
    try {
      addToFavoritesLib({
        id: pack.id,
        name: pack.name,
        price: pack.price,
        image_url: pack.image_url,
        name_ar: pack.name_ar,
      })
      toast({
        title: t('addedToFavorites'),
        description: t('addedToFavoritesDesc', { name: pack.name }),
      })
      window.dispatchEvent(new CustomEvent('favorites-updated'))
    } catch (error) {
      logger.error('Erreur ajout aux favoris:', error)
      toast({
        title: t('error'),
        description: t('errorAddToFavorites'),
        variant: "destructive",
      })
    }
  }
  const submitOrder = async (pack: Pack) => {
    try {
      setSubmitting(true)
      if (!csrfToken) {
        toast({
          title: "Erreur de sécurité",
          description: "Veuillez rafraîchir la page et réessayer.",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }
      if (!form.name || !form.phone || !form.city || !form.address) {
        toast({
          title: t('missingFields'),
          description: t('fillAllFields'),
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          customer_name: form.name,
          phone: form.phone,
          city: form.city,
          address: form.address,
          notes: form.notes,
          payment_method: 'cash_on_delivery',
          items: [ { id: pack.id, pack_id: pack.id, price: pack.price, quantity: 1 } ]
        })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Erreur lors de la commande')
      }
      const data = await res.json()
      toast({
        title: t('orderCreated'),
        description: t('orderCreatedDesc', { orderId: data.order_id || 'N/A' }),
        duration: 5000,
      })
      
      // Déclencher un événement pour le confetti (si nécessaire)
      window.dispatchEvent(new CustomEvent('order-success', { detail: { orderId: data.order_id } }))
      setOpenId(null)
      setForm({ name: "", phone: "", city: "", address: "", notes: "" })
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erreur lors de la commande'
      logger.error('Erreur commande pack:', e)
      toast({
        title: t('orderError'),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luxury-gold mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Header Luxueux */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/30 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.08),transparent_70%)]"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Crown className="w-8 h-8 text-luxury-gold" />
              <Badge className={`bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30 hover:bg-luxury-gold/20 shadow-sm flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Sparkles className={`w-3 h-3 ${locale === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {t('premiumCollections')}
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
              {t('title')}
            </h1>
            
            <p className="text-xl text-gray-700 leading-relaxed mb-8 max-w-2xl mx-auto">
              {t('description')}
            </p>
            
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600 flex-wrap">
              <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Gem className="w-4 h-4 text-luxury-gold" />
                <span>{t('matchedPieces')}</span>
              </div>
              <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Gift className="w-4 h-4 text-luxury-gold" />
                <span>{t('guaranteedSavings')}</span>
              </div>
              <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Star className="w-4 h-4 text-luxury-gold" />
                <span>{t('qualityAssured')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des packs */}
      <div className="container mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-luxury-gold mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-luxury-gold/50 mb-4" />
            <p className="text-gray-900 text-lg mb-2">{t('noPacks')}</p>
            <p className="text-gray-600 text-sm">{t('noPacksSubtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {packs.map((pack, index) => (
            <Card key={`${pack.id}-${index}`} className={`group hover:shadow-xl transition-all duration-300 flex flex-col min-h-[600px] box-border overflow-hidden bg-white border border-gray-200 shadow-sm ${pack.is_featured ? 'ring-2 ring-luxury-gold/40 shadow-lg' : ''}`}>
              <CardContent className="p-0 flex flex-col flex-1 box-border">
                {/* Image du pack */}
                <div className="relative w-full h-[320px] overflow-hidden rounded-t-lg pack-image-container bg-gray-50 p-0 box-border">
                  <Image 
                    src={pack.image_url || '/placeholder.svg'} 
                    alt={pack.name}
                    fill
                    quality={100}
                    sizes="100vw"
                    className="object-contain object-center block pack-image-optimized high-resolution-image"
                    loading="lazy"
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
                      <Badge className="bg-luxury-gold text-luxury-black px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg border-0">
                        <Crown className="w-3 h-3 mr-1 inline" />
                        Vedette
                      </Badge>
                    )}
                    {pack.original_price && pack.original_price > pack.price && (
                      <Badge className="bg-red-600 text-white px-4 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg border-0">
                        -{Math.round(((pack.original_price - pack.price) / pack.original_price) * 100)}%
                      </Badge>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToFavorites(pack)}
                      className="w-10 h-10 p-0 bg-white/90 hover:bg-white"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Contenu du pack */}
                <div className="p-6 flex flex-col flex-1 justify-between box-border">
                  <div>
                    <div className="mb-4">
                      <Badge variant="outline" className="mb-2 break-words border-gray-300 text-gray-700">
                        {pack.category}
                      </Badge>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 break-words">
                        {pack.name}
                      </h3>
                      {pack.name_ar && (
                        <p className="text-gray-600 mb-3 break-words">{pack.name_ar}</p>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-6 leading-relaxed break-words">
                      {pack.description}
                    </p>

                    {/* Informations du pack */}
                    <div className="mb-6 box-border">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
                        <Package className="w-4 h-4 flex-shrink-0 text-luxury-gold" />
                        <span className="break-words">{pack.items_count} {pack.items_count > 1 ? t('pieces') : t('piece')} {t('inThisPack')}</span>
                      </div>
                      
                      {/* Prix */}
                      <div className="flex items-center gap-3 mb-4 flex-wrap box-border">
                        <span className="text-3xl font-bold text-luxury-gold break-words">
                          {formatCurrency(pack.price)}
                        </span>
                        {pack.original_price && pack.original_price > pack.price && (
                          <span className="text-lg text-gray-400 line-through break-words">
                            {formatCurrency(pack.original_price)}
                          </span>
                        )}
                      </div>
                      
                      {pack.original_price && pack.original_price > pack.price && (
                        <div className="text-sm text-emerald-600 font-medium break-words">
                          {t('youSave')} {formatCurrency(pack.original_price - pack.price)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conteneur des boutons avec flex-wrap */}
                  <div className="flex flex-col gap-3 mt-auto pt-4 box-border">
                    <Dialog open={openId === pack.id} onOpenChange={(o) => { if (!o) setOpenId(null) }}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 max-w-full bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black box-border" onClick={() => setOpenId(pack.id)}>
                          <ShoppingCart className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="break-words">{t('proceedToPayment')}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>{t('order')}: {pack.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm">{t('fullName')} *</label>
                            <Input name="name" value={form.name} onChange={onChange} required />
                          </div>
                          <div>
                            <label className="text-sm">{t('phone')} *</label>
                            <Input name="phone" value={form.phone} onChange={onChange} required />
                          </div>
                          <div>
                            <label className="text-sm">{t('city')} *</label>
                            <Input name="city" value={form.city} onChange={onChange} required />
                          </div>
                          <div>
                            <label className="text-sm">{t('address')} *</label>
                            <textarea name="address" value={form.address} onChange={onChange} className="border rounded w-full p-2 min-h-[80px]" required />
                          </div>
                          <div>
                            <label className="text-sm">{t('notes')}</label>
                            <textarea name="notes" value={form.notes} onChange={onChange} className="border rounded w-full p-2 min-h-[60px]" />
                          </div>
                          <Button disabled={submitting} onClick={() => submitOrder(pack)} className={`w-full bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                            {submitting ? t('ordering') : t('submitOrder')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Dialog pour voir les détails */}
                    <Dialog open={detailsId === pack.id} onOpenChange={(o) => { if (!o) setDetailsId(null) }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full max-w-full box-border" onClick={() => setDetailsId(pack.id)}>
                          <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="break-words">{t('viewPack')}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">{pack.name}</DialogTitle>
                          {pack.name_ar && (
                            <p className="text-gray-600 mt-1">{pack.name_ar}</p>
                          )}
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Image du pack */}
                          <div className="relative w-full h-[320px] overflow-hidden rounded-lg pack-image-container bg-gray-50 p-0 box-border">
                            <Image 
                              src={pack.image_url || '/placeholder.svg'} 
                              alt={pack.name}
                              fill
                              quality={100}
                              sizes="100vw"
                              className="object-contain object-center block pack-image-optimized high-resolution-image"
                              loading="lazy"
                              style={{
                                imageRendering: 'crisp-edges',
                                width: '100%',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                objectPosition: 'center'
                              }}
                            />
                            {pack.is_featured && (
                              <Badge className="absolute top-2 right-2 bg-luxury-gold text-luxury-black border-0">
                                <Crown className="w-3 h-3 mr-1" />
                                Vedette
                              </Badge>
                            )}
                          </div>
                          
                          {/* Description */}
                          <div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-900">Description</h3>
                            <p className="text-gray-700 leading-relaxed">{pack.description || 'Aucune description disponible.'}</p>
                          </div>
                          
                          {/* Informations */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Catégorie</p>
                              <Badge variant="outline" className="border-luxury-gold/30 text-luxury-gold">{pack.category}</Badge>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Nombre d'articles</p>
                              <p className="font-medium text-gray-900">{pack.items_count || 0} pièce(s)</p>
                            </div>
                          </div>
                          
                          {/* Prix */}
                          <div className="border-t border-gray-200 pt-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl font-bold text-luxury-gold">
                                {formatCurrency(pack.price)}
                              </span>
                              {pack.original_price && pack.original_price > pack.price && (
                                <>
                                  <span className="text-lg text-gray-400 line-through">
                                    {formatCurrency(pack.original_price)}
                                  </span>
                                  <Badge className="bg-red-500 text-white">
                                    -{Math.round(((pack.original_price - pack.price) / pack.original_price) * 100)}%
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Bouton pour commander */}
                          <Button 
                            className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black" 
                            onClick={() => {
                              setDetailsId(null)
                              setOpenId(pack.id)
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {t('orderNow')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>

      {/* Section d'inspiration */}
      <div className="py-16 bg-gradient-to-br from-amber-50/50 to-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Besoin d'un pack sur mesure ?
          </h2>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
            Nos experts peuvent créer un pack personnalisé selon vos goûts et votre budget. 
            Contactez-nous pour une consultation gratuite.
          </p>
          <Button className="bg-luxury-gold hover:bg-luxury-gold/90 text-gray-900 shadow-md hover:shadow-lg transition-shadow">
            <Gift className="w-4 h-4 mr-2" />
            Créer mon pack
          </Button>
        </div>
      </div>
    </div>
  )
}