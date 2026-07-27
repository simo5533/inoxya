"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Crown, Package, Eye, ShoppingCart, Heart } from "lucide-react"
import { logger } from "@/lib/logger"
import { addToFavorites as addToFavoritesLib } from "@/lib/cart-favorites"
import { useTranslations, useLocale } from 'next-intl'
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Pack {
  id: string
  slug?: string
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

  useEffect(() => {
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

        try {
          data = await response.json()
        } catch (parseError) {
          logger.error('Erreur lors du parsing JSON:', parseError)
          setPacks([])
          setLoading(false)
          return
        }

        if (!response.ok) {
          if (response.status === 503) {
            logger.error('API /api/packs: Base de données indisponible (503)')
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

        if (data && typeof data === 'object' && data !== null && 'error' in data) {
          const errorData = data as Record<string, unknown>
          logger.warn('API /api/packs a retourné une erreur:', { error: errorData['error'] })
          toast({
            title: "Erreur",
            description: (errorData['message'] as string) || (errorData['error'] as string) || "Impossible de charger les packs",
            variant: "destructive",
          })
          setPacks([])
          setLoading(false)
          return
        }

        let packsArray: unknown[] = []
        if (Array.isArray(data)) {
          packsArray = data
        } else if (data && typeof data === 'object' && data !== null && 'packs' in data && Array.isArray((data as { packs: unknown[] }).packs)) {
          packsArray = (data as { packs: unknown[] }).packs
        } else {
          logger.warn('API /api/packs a retourné un format inattendu:', { dataType: typeof data, data })
          packsArray = []
        }

        const transformedPacks: Pack[] = packsArray.map((pack: unknown) => {
          const p = pack as Record<string, unknown>
          const id = (p['id'] as string | number | undefined)?.toString() || `pack-${Math.random()}`
          const name = (p['name'] as string) || 'Pack sans nom'
          return {
            id,
            slug: (p['slug'] as string) || name.toLowerCase().replace(/\s+/g, '-'),
            name,
            name_ar: (p['name_ar'] as string) || '',
            description: (p['description'] as string) || '',
            price: (p['price'] as number) || 0,
            original_price: p['original_price'] as number | undefined,
            image_url: (p['image_url'] as string) || '/placeholder.svg',
            items_count:
              typeof p['items_count'] === 'number' && p['items_count'] > 0
                ? (p['items_count'] as number)
                : Array.isArray(p['composition']) && (p['composition'] as unknown[]).length > 0
                  ? (p['composition'] as unknown[]).length
                  : 1,
            category: (p['category'] as string) || 'general',
            is_featured: (p['is_featured'] as boolean) || false
          }
        })

        setPacks(transformedPacks)
      } catch (error) {
        logger.error('Erreur lors du chargement des packs:', error)
        setPacks([])
      } finally {
        setLoading(false)
      }
    }

    fetchPacks()
  }, [toast])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const packHref = (pack: Pack) => `/${locale}/packs/${pack.slug || pack.id}`

  const addToFavorites = (pack: Pack, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('description')}</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">{t('loading')}</div>
        ) : packs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-900 text-lg mb-2">{t('noPacks')}</p>
            <p className="text-gray-600 text-sm">{t('noPacksSubtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {packs.map((pack, index) => (
              <Card
                key={`${pack.id}-${index}`}
                className={`group hover:shadow-xl transition-all duration-300 flex flex-col min-h-[600px] box-border overflow-hidden bg-white border border-gray-200 shadow-sm ${pack.is_featured ? 'ring-2 ring-luxury-gold/40 shadow-lg' : ''}`}
              >
                <CardContent className="p-0 flex flex-col flex-1 box-border">
                  <Link href={packHref(pack)} className="relative block w-full h-[320px] overflow-hidden rounded-t-lg bg-gray-50">
                    <Image
                      src={pack.image_url || '/placeholder.svg'}
                      alt={pack.name}
                      fill
                      quality={100}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain object-center"
                      loading="lazy"
                    />

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

                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => addToFavorites(pack, e)}
                        className="w-10 h-10 p-0 bg-white/90 hover:bg-white"
                        type="button"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </Link>

                  <div className="p-6 flex flex-col flex-1 justify-between box-border">
                    <div>
                      <div className="mb-4">
                        <Badge variant="outline" className="mb-2 break-words border-gray-300 text-gray-700">
                          {pack.category}
                        </Badge>
                        <Link href={packHref(pack)}>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2 break-words hover:text-luxury-gold transition-colors">
                            {pack.name}
                          </h3>
                        </Link>
                        {pack.name_ar && (
                          <p className="text-gray-600 mb-3 break-words">{pack.name_ar}</p>
                        )}
                      </div>

                      <p className="text-gray-700 mb-6 leading-relaxed break-words line-clamp-4">
                        {pack.description}
                      </p>

                      <div className="mb-6 box-border">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
                          <Package className="w-4 h-4 flex-shrink-0 text-luxury-gold" />
                          <span className="break-words">{pack.items_count} {pack.items_count > 1 ? t('pieces') : t('piece')} {t('inThisPack')}</span>
                        </div>

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

                    <div className="flex flex-col gap-3 mt-auto pt-4 box-border">
                      <Button asChild className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black">
                        <Link href={`${packHref(pack)}#commander`}>
                          <ShoppingCart className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="break-words">{t('proceedToPayment')}</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={packHref(pack)}>
                          <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="break-words">{t('viewPack')}</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="py-16 bg-gradient-to-br from-amber-50/50 to-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Besoin d&apos;un pack sur mesure ?
          </h2>
          <p className="text-gray-700 mb-4 max-w-2xl mx-auto">
            Nos experts peuvent créer un pack personnalisé selon vos goûts et votre budget.
            Contactez-nous pour une consultation gratuite.
          </p>
          <p className="text-sm md:text-base font-medium text-luxury-gold mb-8 max-w-xl mx-auto tracking-wide">
            {t('ctaPackLine')}
          </p>
          <Button asChild className="bg-luxury-gold hover:bg-luxury-gold/90 text-gray-900 shadow-md hover:shadow-lg transition-shadow">
            <Link href={`/${locale}/packs/creer`}>
              <Gift className="w-4 h-4 mr-2" />
              {t('ctaCreatePack')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
