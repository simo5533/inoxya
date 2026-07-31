import Image from "next/image"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react"
import { getBijouById, getAllBijoux } from "@/lib/database"
import OrderForm from "@/components/OrderForm"
import ProductImageGallery from "@/components/ProductImageGallery"
import ProductReviewsSection from "@/components/ProductReviewsSection"
import ProductStarRating from "@/components/ProductStarRating"
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/SEOJsonLd"
import { ProductPremiumContent } from "@/components/seo/ProductPremiumContent"
import { buildProductSeo } from "@/lib/seo/product"
import { SEO_MATERIAL, SEO_FREE_SHIPPING_THRESHOLD, SEO_RETURN_DAYS } from "@/lib/seo/config"
import { dbValueToSlug, categoryDbValueToDisplayName } from "@/lib/category-mapping"
import { seoPageMetadata } from "@/lib/seo/config"
import { getProductRatingStats } from "@/lib/reviews"
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
        robots: { index: false, follow: false },
        alternates: {
          canonical: `${siteUrl}/${locale}/bijoux/${encodeURIComponent(id)}`,
        },
      }
    }

    const productId = String(bijou.id)
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
    
    const displayName =
      locale === 'ar' && bijou.name_ar
        ? String(bijou.name_ar)
        : String(bijou.name)

    const seo = buildProductSeo({
      id: productId,
      name: displayName,
      name_ar: bijou.name_ar,
      description: bijou.description,
      price: Number(bijou.price) || 0,
      original_price: bijou.original_price,
      category_id: bijou.category_id,
      category: bijou.category,
      is_available: bijou.is_available,
      main_image: bijou.main_image || bijou.image_url,
    })

    return seoPageMetadata({
      title: seo.seoTitle.length > 60 ? seo.seoTitle.slice(0, 57) + '…' : seo.seoTitle.replace(/\s*\|\s*INOXYA BIJOUX\s*$/i, ''),
      description: seo.metaDescription,
      // Canonical toujours sur l’id réel du produit (évite doublons prod-* / param)
      path: `/bijoux/${productId}`,
      locale,
      ogImage: imageUrl,
      keywords: [...seo.keywords.primary, ...seo.keywords.secondary, ...seo.keywords.searchVariants],
      noindex: false,
    })
  } catch {
    try {
      const { locale } = await params
      const t = await getTranslations({ locale, namespace: 'bijoux.detail' })
      return {
        title: t('default.title'),
        description: t('default.description'),
        robots: { index: false, follow: false },
      }
    } catch {
      return {
        title: 'Produit | INOXYA BIJOUX',
        description: 'Découvrez nos bijoux.',
        robots: { index: false, follow: false },
      }
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

  const productId = String(bijou.id)
  // Unifier l’URL canonique si l’utilisateur / Google arrive avec un autre identifiant
  if (productId !== String(id)) {
    permanentRedirect(`/${locale}/bijoux/${productId}`)
  }

  // Normaliser les champs pour éviter erreurs en production (données DB variables)
  const product = {
    ...bijou,
    id: productId,
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

  const ratingStats = await getProductRatingStats(String(product.id))
  const rating = ratingStats.reviewsCount > 0 ? ratingStats.rating : 0
  const reviews = ratingStats.reviewsCount

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
  /** Au plus 6 visuels au total (1 principal + miniatures) pour la galerie premium */
  const cappedGallery = allImages.slice(0, 6)
  const galleryMain = cappedGallery[0] || mainImage || '/placeholder.svg'
  const galleryThumbs = cappedGallery.slice(1)
  
  // Normaliser les URLs d'images pour le schema (aligné sur la galerie ≤ 6 visuels)
  const normalizedImages = cappedGallery.map((img: string) => {
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
  const categoryName = (typeof productWithCategory.category === 'string' ? productWithCategory.category : null) 
    || (typeof productWithCategory.category_id === 'string' ? productWithCategory.category_id : null)
    || t('breadcrumb.jewelry')
  const categorySlug = dbValueToSlug(categoryName) || (typeof productWithCategory.category_id === 'string' ? productWithCategory.category_id : '')
  const categoryDisplay = categoryDbValueToDisplayName(categoryName)
  const productSeo = buildProductSeo({
    id: product.id,
    name: product.name,
    name_ar: product.name_ar,
    description: product.description,
    price: product.price,
    original_price: product.original_price,
    category_id: productCategory,
    category: (productWithCategory.category as string | undefined) || productCategory,
    is_available: product.is_available,
    is_featured: product.is_featured,
    rating,
    reviews_count: reviews,
    images: cappedGallery,
    main_image: galleryMain,
  })

  const h1Title = productSeo.h1
  const breadcrumbNav = [
    { name: t('breadcrumb.home'), href: `/${locale}` },
    { name: t('breadcrumb.jewelry'), href: `/${locale}/bijoux` },
    ...(categoryName !== t('breadcrumb.jewelry') && categorySlug
      ? [{ name: categoryDisplay, href: `/${locale}/bijoux/${categorySlug}` }]
      : []),
    { name: product.name, href: `/${locale}/bijoux/${product.id}` },
  ]
  const breadcrumbItems = breadcrumbNav.map((b) => ({
    name: b.name,
    url: `${siteUrl}${b.href}`,
  }))

  return (
    <>
      <ProductJsonLd
        product={{
          id: String(product.id),
          name: product.name,
          description:
            (product.description && String(product.description).trim()) ||
            productSeo.shortDescription,
          seoDescription: productSeo.shortDescription,
          price: product.price,
          image: normalizedImages,
          category: categoryDisplay,
          inStock: product.is_available !== false,
          is_available: product.is_available !== false,
          is_active: product.is_active !== false,
          stock: typeof product.stock === 'number' ? product.stock : undefined,
          ...(reviews > 0 ? { rating, reviews_count: reviews } : {}),
        }}
        locale={locale}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white w-full max-w-full min-w-0 overflow-x-hidden">
        <div className="container mx-auto min-w-0 max-w-full px-4 py-8 md:py-12">
        {/* Fil d'Ariane visible */}
        <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-gray-600 flex flex-wrap items-center gap-1">
          {breadcrumbNav.map((item, i) => (
            <span key={item.href} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-400">/</span>}
              {i < breadcrumbNav.length - 1 ? (
                <Link href={item.href} className="hover:text-luxury-gold transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{item.name}</span>
              )}
            </span>
          ))}
        </nav>
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
          <div className="min-w-0 w-full max-w-full space-y-4 overflow-visible">
            <ProductImageGallery
              mainImage={galleryMain || "/placeholder.svg"}
              images={cappedGallery}
              productName={product.name}
              imageAlts={productSeo.imageAlts}
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 tracking-tight leading-tight break-words">{h1Title}</h1>
              {product.name_ar && (
                <div className="font-arabic text-2xl text-gray-600 mb-4 text-right">{product.name_ar}</div>
              )}
            </div>

            {/* Notation client interactive */}
            <div className="mb-6">
              <ProductStarRating
                productId={String(product.id)}
                initialRating={rating}
                initialReviewsCount={reviews}
                rateLabel={t('tabs.leaveReview')}
              />
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

            <div className="text-gray-700 leading-relaxed mb-6 text-base sm:text-lg min-w-0 max-w-full break-words">
              {productSeo.shortDescription}
            </div>

            {/* Attributs produit visibles (SEO + AEO) */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-8 text-sm border border-gray-100 rounded-xl p-4 bg-white/80">
              <div><dt className="text-gray-500">Matière</dt><dd className="font-medium text-gray-900">{SEO_MATERIAL}</dd></div>
              <div><dt className="text-gray-500">Catégorie</dt><dd className="font-medium text-gray-900">{categoryDisplay}</dd></div>
              <div><dt className="text-gray-500">Hypoallergénique</dt><dd className="font-medium text-gray-900">Oui (acier 316L)</dd></div>
              <div><dt className="text-gray-500">Résistance à l&apos;eau</dt><dd className="font-medium text-gray-900">Oui, port quotidien</dd></div>
              <div><dt className="text-gray-500">Stock</dt><dd className="font-medium text-gray-900">{product.is_available ? 'En stock' : 'Rupture'}</dd></div>
              <div><dt className="text-gray-500">Livraison</dt><dd className="font-medium text-gray-900">Maroc — gratuite dès {SEO_FREE_SHIPPING_THRESHOLD} MAD</dd></div>
              <div><dt className="text-gray-500">Paiement</dt><dd className="font-medium text-gray-900">À la livraison</dd></div>
              <div><dt className="text-gray-500">Retour</dt><dd className="font-medium text-gray-900">Gratuit sous {SEO_RETURN_DAYS} jours</dd></div>
            </dl>

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
                  {locale === 'fr' ? (
                    <ProductPremiumContent
                      seo={productSeo}
                      productName={product.name}
                      locale={locale}
                      className="mt-0 border-0 pt-0"
                    />
                  ) : (
                    <>
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
                    </>
                  )}
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
              {similarProducts.map((similar) => (
                <Link key={similar.id} href={`/${locale}/bijoux/${similar.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="relative w-full h-0 pb-[100%] rounded-lg overflow-hidden bg-gray-100 mb-3">
                        <Image
                          src={similar.image_url || "/placeholder.svg"}
                          alt={`${similar.name} — bijou acier inoxydable 316L INOXYA Maroc`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{similar.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-luxury-gold font-bold">{Math.round(similar.price)} MAD</span>
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

