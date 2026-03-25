import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react"
import { getBijouById, getAllBijoux } from "@/lib/database"
import OrderForm from "@/components/OrderForm"
import ProductImageGallery from "@/components/ProductImageGallery"
import ProductReviewsSection from "@/components/ProductReviewsSection"
import { ProductSchema, BreadcrumbSchema } from "@/components/StructuredData"
import { selectRows } from "@/lib/sqlite"
import { getSiteUrlSafe } from '@/lib/site-url'
import { getTranslations } from 'next-intl/server'
import { ShareButton } from '@/components/ShareButton'

// Force dynamic rendering - do NOT prerender at build time
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Generate metadata for product page
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  try {
    const siteUrl = getSiteUrlSafe()
    const { id, locale } = await params
    const bijou = await getBijouById(id)
    const t = await getTranslations({ locale, namespace: 'bijoux.detail' })
    
    if (!bijou) {
      return {
        title: t('notFound.title'),
        description: t('notFound.description'),
      }
    }

    // Normaliser l'URL de l'image pour Open Graph
    const rawImageUrl = bijou.main_image || bijou.image_url || (Array.isArray(bijou.images) ? bijou.images[0] : '') || ''
    let imageUrl = `${siteUrl}/images/default-product.jpg`
    if (rawImageUrl) {
      if (rawImageUrl.startsWith('http')) {
        imageUrl = rawImageUrl
      } else if (rawImageUrl.startsWith('/')) {
        imageUrl = `${siteUrl}${rawImageUrl}`
      } else {
        imageUrl = `${siteUrl}/${rawImageUrl}`
      }
    }
    
    const price = bijou.price ? `${bijou.price} MAD` : ''
    const description = bijou.description || t('description', { name: bijou.name, price })

    return {
      metadataBase: new URL(siteUrl),
      title: `${bijou.name} | INOXYA BIJOUX`,
      description,
      keywords: [bijou.name, bijou.category_id || 'bijoux', 'acier inoxydable', 'bijoux berbères'],
      openGraph: {
        title: bijou.name,
        description,
        type: 'website',
        url: `${siteUrl}/${locale}/bijoux/${id}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: bijou.name,
          },
        ],
        siteName: 'INOXYA BIJOUX',
        locale: locale === 'ar' ? 'ar_MA' : 'fr_FR',
      },
      twitter: {
        card: 'summary_large_image',
        title: bijou.name,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: `${siteUrl}/${locale}/bijoux/${id}`,
        languages: {
          'fr': `${siteUrl}/fr/bijoux/${id}`,
          'ar': `${siteUrl}/ar/bijoux/${id}`,
        },
      },
    }
  } catch {
    try {
      const { locale } = await params
      const t = await getTranslations({ locale, namespace: 'bijoux.detail' })
      return { title: t('default.title'), description: t('default.description') }
    } catch {
      return { title: 'Produit | INOXYA BIJOUX', description: 'Découvrez nos bijoux.' }
    }
  }
}

/**
 * Dynamic page : /[locale]/bijoux/[id]
 */
export default async function BijouDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  try {
  const siteUrl = getSiteUrlSafe()
  const { id, locale } = await params
  let t!: Awaited<ReturnType<typeof getTranslations>>
  try {
    t = await getTranslations({ locale, namespace: 'bijoux.detail' })
  } catch {
    notFound()
  }

  // Récupérer le produit avec gestion d'erreur robuste
  let bijou: Awaited<ReturnType<typeof getBijouById>> | null = null
  try {
    bijou = await getBijouById(id)
  } catch {
    notFound()
  }

  // Si produit non trouvé → 404
  if (!bijou) {
    notFound()
  }

  // Normaliser les champs pour éviter erreurs en production (données DB variables)
  const product = {
    ...bijou,
    id: String(bijou.id ?? id),
    price: Number(bijou.price) || 0,
    original_price: bijou.original_price != null ? Number(bijou.original_price) : undefined,
    name: String(bijou.name ?? ''),
    description: bijou.description != null ? String(bijou.description) : '',
  }
  
  // Récupérer des produits similaires (ne pas faire échouer la page si erreur)
  let allBijoux: Awaited<ReturnType<typeof getAllBijoux>> = []
  try {
    allBijoux = await getAllBijoux()
  } catch {
    allBijoux = []
  }
  if (!allBijoux || !Array.isArray(allBijoux)) {
    allBijoux = []
  }
  const productCategory = product.category_id != null ? String(product.category_id) : ''
  const similarProducts = allBijoux
    .filter(b => String(b.id) !== String(id) && String(b.category_id || '') === productCategory)
    .slice(0, 4)

  const rating = product.rating ?? 4.5
  const reviews = (() => {
    const tableColumns = selectRows("PRAGMA table_info(reviews)") as Array<{ name?: string }>
    const hasProductId = tableColumns.some((col) => String(col.name || "").toLowerCase() === "product_id")
    const hasBijouId = tableColumns.some((col) => String(col.name || "").toLowerCase() === "bijou_id")
    const idColumn = hasProductId ? "product_id" : (hasBijouId ? "bijou_id" : "product_id")
    const countRows = selectRows(
      `SELECT COUNT(*) AS count FROM reviews WHERE CAST(${idColumn} AS TEXT) = ?`,
      [product.id]
    ) as Array<{ count?: number | string }>
    const count = Number(countRows[0]?.count || 0)
    return Number.isFinite(count) ? count : (product.reviews_count ?? 0)
  })()

  // Préparer les images pour le schema et la galerie
  // Gérer les images qui peuvent être un string JSON, un array, ou undefined
  let imagesArray: string[] = []
  if (product.images) {
    if (Array.isArray(product.images)) {
      // Filtrer les badges (promo, nouveau, etc.) et garder seulement les vraies images
      imagesArray = product.images.filter((img: unknown): img is string => 
        typeof img === 'string' && (img.startsWith('/') || img.startsWith('http'))
      )
    } else if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images)
        if (Array.isArray(parsed)) {
          imagesArray = parsed.filter((img: unknown): img is string => 
            typeof img === 'string' && (img.startsWith('/') || img.startsWith('http'))
          )
        }
      } catch {
        // Si ce n'est pas du JSON valide, ignorer
      }
    }
  }
  
  const mainImage = product.main_image || product.image_url || ''
  const allImages = mainImage 
    ? [mainImage, ...imagesArray].filter(Boolean).filter((img, index, arr) => arr.indexOf(img) === index) // Supprimer les doublons
    : imagesArray
  
  // Normaliser les URLs d'images pour le schema
  const normalizedImages = allImages.map((img: string) => {
    if (img.startsWith('http')) return img
    if (img.startsWith('/')) return `${siteUrl}${img}`
    return `${siteUrl}/${img}`
  })

  // Préparer le breadcrumb pour SEO
  type ProductWithCategory = {
    category_id?: string | null
    category?: string | null
    [key: string]: unknown
  }
  const productWithCategory = product as ProductWithCategory
  const categoryName = (typeof productWithCategory.category_id === 'string' ? productWithCategory.category_id : null) 
    || (typeof productWithCategory.category === 'string' ? productWithCategory.category : null)
    || t('breadcrumb.jewelry')
  const categorySlug = (typeof productWithCategory.category_id === 'string' ? productWithCategory.category_id : '') 
    || (typeof productWithCategory.category === 'string' ? productWithCategory.category : '')
  const breadcrumbItems = [
    { name: t('breadcrumb.home'), url: siteUrl },
    { name: t('breadcrumb.jewelry'), url: `${siteUrl}/${locale}/bijoux` },
    ...(categoryName !== t('breadcrumb.jewelry') && categorySlug ? [{ name: categoryName, url: `${siteUrl}/${locale}/bijoux?category=${categorySlug}` }] : []),
    { name: product.name, url: `${siteUrl}/${locale}/bijoux/${product.id}` },
  ]

  return (
    <>
      <ProductSchema
        product={{
          id: product.id,
          name: product.name,
          description: product.description || undefined,
          price: product.price,
          main_image: normalizedImages[0] || undefined,
          images: normalizedImages,
          rating: rating,
          reviews_count: reviews,
        }}
        siteUrl={siteUrl}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white w-full max-w-full min-w-0 overflow-x-hidden">
        <div className="container mx-auto min-w-0 max-w-full px-4 py-8 md:py-12">
        {/* back link */}
        <Link 
          href={`/${locale}/bijoux`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-luxury-gold transition-colors mb-6 group w-fit max-w-full min-w-0"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          {t('backToCatalog')}
        </Link>

        <div className="grid w-full min-w-0 max-w-full grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* image gallery */}
          <div className="min-w-0 w-full max-w-full space-y-4">
            <ProductImageGallery
              mainImage={mainImage || "/placeholder.svg"}
              images={imagesArray}
              productName={product.name}
            />
          </div>

          {/* details */}
          <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
            {/* badges (promo, nouveau, …) */}
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Extraire les tags depuis images (peut être array ou string JSON)
                let imageTags: string[] = []
                if (product.images) {
                  if (Array.isArray(product.images)) {
                    imageTags = product.images.filter((img: unknown): img is string => 
                      typeof img === 'string' && !img.startsWith('/') && !img.startsWith('http')
                    )
                  } else if (typeof product.images === 'string') {
                    try {
                      const parsed = JSON.parse(product.images)
                      if (Array.isArray(parsed)) {
                        imageTags = parsed.filter((img: unknown): img is string => 
                          typeof img === 'string' && !img.startsWith('/') && !img.startsWith('http')
                        )
                      }
                    } catch {
                      // Si ce n'est pas du JSON, vérifier si c'est une string simple avec des tags
                      if (product.images.includes('promo') || product.images.includes('nouveau')) {
                        imageTags = product.images.split(',').map((s: string) => s.trim())
                      }
                    }
                  }
                }
                return (
                  <>
                    {imageTags.includes("promo") && <Badge className="bg-red-500 text-white font-semibold px-3 py-1">{t('badges.promo')}</Badge>}
                    {imageTags.includes("nouveau") && <Badge className="bg-green-500 text-white font-semibold px-3 py-1">{t('badges.new')}</Badge>}
                    {imageTags.includes("bestseller") && <Badge className="bg-blue-500 text-white font-semibold px-3 py-1">{t('badges.bestseller')}</Badge>}
                    {imageTags.includes("premium") && <Badge className="bg-yellow-500 text-black font-semibold px-3 py-1">{t('badges.premium')}</Badge>}
                    {product.is_featured && <Badge className="bg-luxury-gold text-luxury-black font-semibold px-3 py-1 border border-luxury-gold/30">{t('badges.featured')}</Badge>}
                  </>
                )
              })()}
            </div>

            <div className="min-w-0 max-w-full">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 tracking-tight leading-tight break-words">{product.name}</h1>
              {product.name_ar && (
                <div className="font-arabic text-2xl text-gray-600 mb-4 text-right">{product.name_ar}</div>
              )}
            </div>

            {/* rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(rating) ? "fill-luxury-gold text-luxury-gold" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-base font-medium text-gray-700">
                {rating.toFixed(1)} <span className="text-gray-500">({reviews} {t('reviews')})</span>
              </span>
            </div>

            {/* price */}
            <div className="flex items-center gap-3 mb-6 flex-wrap min-w-0 max-w-full">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-luxury-gold shrink-0">{Math.round(product.price)} MAD</span>
              {product.original_price && product.original_price !== product.price && (
                <>
                  <span className="text-xl line-through text-gray-400">{Math.round(product.original_price)} MAD</span>
                  <Badge className="bg-red-500 text-white font-semibold">
                    -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                  </Badge>
                </>
              )}
            </div>

            {/* Stock status */}
            <div className="mb-6">
              {product.is_available ? (
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  {t('stock.inStock')}
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 border-red-300">
                  {t('stock.outOfStock')}
                </Badge>
              )}
            </div>

            <div className="text-gray-700 leading-relaxed mb-8 text-base sm:text-lg min-w-0 max-w-full break-words">
              {product.description || t('defaultDescription', { name: product.name })}
            </div>

            {/* Formulaire de commande */}
            <div className="mb-8 min-w-0 max-w-full overflow-x-hidden rounded-xl border border-gray-100 bg-white p-3 shadow-lg sm:p-4 md:p-6">
              <OrderForm 
                productName={product.name}
                price={Math.round(product.price)}
                productId={product.id}
              />
            </div>

            {/* Actions secondaires — partage uniquement */}
            <div className="flex flex-col sm:flex-row gap-3">
              <ShareButton
                productName={product.name}
                className="w-full sm:w-auto min-h-[44px] rounded-xl border border-luxury-gold/30 hover:bg-luxury-gold/10 transition-colors px-6 flex items-center justify-center"
              />
            </div>

            {/* Garanties et services */}
            <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">{t('guarantees.title')}</h3>
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('guarantees.shipping.title')}</p>
                    <p className="text-sm text-gray-600">{t('guarantees.shipping.description')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('guarantees.warranty.title')}</p>
                    <p className="text-sm text-gray-600">{t('guarantees.warranty.description')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-luxury-gold/20 rounded-lg">
                    <RotateCcw className="w-5 h-5 text-luxury-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('guarantees.return.title')}</p>
                    <p className="text-sm text-gray-600">{t('guarantees.return.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets avec informations détaillées */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full overflow-x-auto scrollbar-hide whitespace-nowrap justify-start rounded-md h-auto p-1">
              <TabsTrigger value="description" className="min-h-[44px] px-4">{t('tabs.description')}</TabsTrigger>
              <TabsTrigger value="specifications" className="min-h-[44px] px-4">{t('tabs.specifications')}</TabsTrigger>
              <TabsTrigger value="reviews" className="min-h-[44px] px-4">{t('tabs.reviews', { count: reviews })}</TabsTrigger>
              <TabsTrigger value="shipping" className="min-h-[44px] px-4">{t('tabs.shipping')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t('tabs.descriptionTitle')}</h3>
                  <div className="text-gray-700 leading-relaxed">
                    {product.description || t('defaultDescription', { name: product.name })}
                  </div>
                  <div className="mt-6 grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">{t('tabs.features')}</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• {t('tabs.feature1')}</li>
                        <li>• {t('tabs.feature2')}</li>
                        <li>• {t('tabs.feature3')}</li>
                        <li>• {t('tabs.feature4')}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">{t('tabs.maintenance')}</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• {t('tabs.maintenance1')}</li>
                        <li>• {t('tabs.maintenance2')}</li>
                        <li>• {t('tabs.maintenance3')}</li>
                        <li>• {t('tabs.maintenance4')}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t('tabs.specificationsTitle')}</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('tabs.material')}</span>
                        <span className="font-medium">{t('tabs.materialValue')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('tabs.finish')}</span>
                        <span className="font-medium">{t('tabs.finishValue')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('tabs.weight')}</span>
                        <span className="font-medium">{t('tabs.weightValue')}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('tabs.warranty')}</span>
                        <span className="font-medium">{t('tabs.warrantyValue')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('tabs.origin')}</span>
                        <span className="font-medium">{t('tabs.originValue')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('tabs.craftsmanship')}</span>
                        <span className="font-medium">{t('tabs.craftsmanshipValue')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <ProductReviewsSection
                    productId={product.id}
                    title={t('tabs.reviewsTitle')}
                    leaveReviewLabel={t('tabs.leaveReview')}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{t('tabs.shippingTitle')}</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">{t('tabs.shippingSection')}</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• {t('tabs.shipping1')}</li>
                        <li>• {t('tabs.shipping2')}</li>
                        <li>• {t('tabs.shipping3')}</li>
                        <li>• {t('tabs.shipping4')}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">{t('tabs.returnsSection')}</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• {t('tabs.returns1')}</li>
                        <li>• {t('tabs.returns2')}</li>
                        <li>• {t('tabs.returns3')}</li>
                        <li>• {t('tabs.returns4')}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Produits similaires */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('similarProducts')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((product) => (
                <Link key={product.id} href={`/${locale}/bijoux/${product.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="relative w-full h-0 pb-[100%] rounded-lg overflow-hidden bg-gray-100 mb-3">
                        <Image
                          src={product.image_url || "/placeholder.svg"}
                          alt={`${product.name} - Bijou en acier inoxydable premium INOXYA - Produit similaire`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-luxury-gold font-bold">{Math.round(product.price)} MAD</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">
                            {(() => {
                              const rating = (product as { rating?: number | string | unknown })['rating']
                              if (typeof rating === 'number') return rating.toFixed(1)
                              if (typeof rating === 'string') {
                                const numRating = Number(rating)
                                return isNaN(numRating) ? "0.0" : numRating.toFixed(1)
                              }
                              return "0.0"
                            })()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
  } catch {
    notFound()
  }
}

