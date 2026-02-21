import ProductGrid from "@/components/ProductGrid"
import CategoryCard from "@/components/CategoryCard"
import { getAllBijoux, getAllCategories } from "@/lib/database"
import { getCategoryCoverImage } from "@/lib/category-images-mapping"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import type { Metadata } from "next"
import Link from "next/link"
import { X } from "lucide-react"
import { CATEGORIES } from "@/lib/category-mapping"
import { getSiteUrlSync } from '@/lib/site-url'
import { getTranslations } from 'next-intl/server'

const siteUrl = getSiteUrlSync()

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'bijoux' })
  
  return {
    metadataBase: new URL(siteUrl),
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(','),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${siteUrl}/${locale}/bijoux`,
      siteName: "INOXYA BIJOUX",
      images: [
        {
          url: `${siteUrl}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: locale === 'ar' ? 'ar_MA' : 'fr_FR',
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
      images: [`${siteUrl}/images/og-image.jpg`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/bijoux`,
      languages: {
        'fr': `${siteUrl}/fr/bijoux`,
        'ar': `${siteUrl}/ar/bijoux`,
      },
    },
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

interface BijouxPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string; search?: string }>
}

export default async function BijouxPage({ params, searchParams }: BijouxPageProps) {
  const { locale } = await params
  const searchParamsResolved = await searchParams
  const categorySlug = searchParamsResolved.category
  const searchQuery = (searchParamsResolved.search || '').trim()
  const t = await getTranslations({ locale, namespace: 'bijoux' })

  // FORCER la connexion à la base de données
  const { forceConnection, initSqlJsAsync } = await import('@/lib/sqlite')
  
  // Forcer la connexion d'abord
  let isConnected = forceConnection()
  
  // Si forceConnection() retourne false, essayer initSqlJsAsync()
  if (!isConnected) {
    isConnected = await initSqlJsAsync()
    // Réessayer forceConnection après initSqlJsAsync
    if (isConnected) {
      isConnected = forceConnection()
    }
  }
  
  // Attendre un peu pour s'assurer que la DB est complètement chargée
  if (isConnected) {
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve()
      }, 100)
    })
  }
  
  // Récupérer les bijoux (filtrés par catégorie si slug fourni)
  let allBijoux = await getAllBijoux(categorySlug)
  
  // Vérifier que les produits sont bien récupérés
  if (!allBijoux || !Array.isArray(allBijoux)) {
    logger.error('[BijouxPage] Erreur: getAllBijoux() n\'a pas retourné un tableau')
    allBijoux = []
  }
  
  // Filtrer par recherche (nom, name_ar) si paramètre search présent
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    allBijoux = allBijoux.filter((p: { name?: string; name_ar?: string | null }) =>
      (typeof p.name === 'string' && p.name.toLowerCase().includes(q)) ||
      (typeof p.name_ar === 'string' && p.name_ar.toLowerCase().includes(q))
    )
  }

  // Normaliser les produits pour s'assurer qu'ils ont le bon format pour ProductCard
  type Product = {
    id: string | number
    name: string
    name_ar?: string | null | unknown
    description?: string | null | unknown
    price: number
    original_price?: number | null | unknown
    image_url?: string | null
    main_image?: string | null | unknown
    images?: string[] | string | null
    is_available?: boolean
    is_active?: boolean
    is_featured?: boolean
    category_id?: string | null | unknown
    category?: string | null | unknown
    created_at?: string | null | unknown
    [key: string]: unknown
  }
  allBijoux = allBijoux.map((product: Product) => {
    // Convertir images en tableau si nécessaire
    let imagesArray: string[] = []
    if (product.images) {
      if (Array.isArray(product.images)) {
        imagesArray = product.images
      } else if (typeof product.images === 'string' && product.images.trim() !== '' && product.images !== '[]') {
        try {
          const parsed = JSON.parse(product.images)
          imagesArray = Array.isArray(parsed) ? parsed : []
        } catch {
          imagesArray = []
        }
      }
    }
    
    // Déterminer l'image principale (priorité: main_image > image_url > première image du tableau > placeholder)
    const mainImageValue = product.main_image || product.image_url || (imagesArray.length > 0 ? imagesArray[0] : null) || '/placeholder.svg'
    const mainImage = typeof mainImageValue === 'string' ? mainImageValue : (typeof product.image_url === 'string' ? product.image_url : '/placeholder.svg')
    
    // Normaliser l'image principale
    const normalizedImage = mainImage && mainImage !== '/placeholder.svg' 
      ? (mainImage.startsWith('http') || mainImage.startsWith('/') ? mainImage : `/${mainImage}`)
      : '/placeholder.svg'
    
    // Convertir les valeurs unknown en types appropriés
    const nameAr = typeof product.name_ar === 'string' ? product.name_ar : undefined
    const description = typeof product.description === 'string' ? product.description : undefined
    const categoryId = typeof product.category_id === 'string' ? product.category_id : (typeof product.category === 'string' ? product.category : 'Général')
    const createdAt = typeof product.created_at === 'string' ? product.created_at : new Date().toISOString()
    const originalPrice = typeof product.original_price === 'number' ? product.original_price : (typeof product.original_price === 'string' ? Number(product.original_price) : undefined)
    
    return {
      id: String(product.id || ''),
      name: product.name || 'Produit sans nom',
      name_ar: nameAr,
      description: description,
      price: Number(product.price) || 0,
      original_price: originalPrice,
      // Images - format unifié (string JSON pour compatibilité avec ProductCard)
      image_url: normalizedImage,
      main_image: normalizedImage,
      images: imagesArray.length > 0 ? JSON.stringify(imagesArray) : undefined,
      // Disponibilité
      is_available: product.is_available !== undefined 
        ? Boolean(product.is_available) 
        : (product.is_active !== undefined ? Boolean(product.is_active) : true),
      is_featured: Boolean(product.is_featured),
      category_id: categoryId,
      created_at: createdAt,
    }
  })

  // Récupérer les catégories avec gestion d'erreur
  type Category = {
    id: string | number
    name: string
    slug: string
    description?: string
    image_url?: string
    coverImage?: string
    [key: string]: unknown
  }
  let categories: Category[] = []
  try {
    categories = (await getAllCategories()) as Category[]
  } catch (error) {
    logger.error('[BijouxPage] Erreur lors de la récupération des catégories:', error)
    categories = []
  }

  // Fallback: Si aucune catégorie n'est récupérée, utiliser le mapping CATEGORIES
  if (categories.length === 0) {
    categories = Object.entries(CATEGORIES).map(([slug, def]) => ({
      id: String(slug), // S'assurer que id est une string
      name: def.label,
      slug: def.slug,
      description: def.subtitle,
      image_url: undefined
    }))
  }

  // Enrichir les catégories avec leurs images de couverture
  // Gérer les erreurs silencieusement pour éviter que Promise.all échoue
  type CategoryWithCoverImage = {
    id: string
    name: string
    slug: string
    description?: string
    image_url?: string
    coverImage?: string
  }
  let categoriesWithCoverImages: CategoryWithCoverImage[] = categories.map(cat => ({
    id: String(cat.id),
    name: cat.name,
    slug: cat.slug,
    description: typeof cat.description === 'string' ? cat.description : undefined,
    image_url: typeof cat.image_url === 'string' ? cat.image_url : undefined
  }))
  
  if (categories.length > 0) {
    try {
      categoriesWithCoverImages = await Promise.all(
        categories.map(async (category) => {
          try {
            const coverImage = await getCategoryCoverImage(category.slug)
            return {
              id: String(category.id), // Convertir en string pour CategoryCard
              name: category.name,
              slug: category.slug,
              description: typeof category.description === 'string' ? category.description : undefined,
              image_url: typeof category.image_url === 'string' ? category.image_url : undefined,
              coverImage: coverImage || undefined
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : { error: String(error) }
              logger.warn(`[BijouxPage] Erreur lors de la récupération de l'image pour ${category.slug}:`, errorDetails)
            }
            return {
              id: String(category.id), // Convertir en string pour CategoryCard
              name: category.name,
              slug: category.slug,
              description: typeof category.description === 'string' ? category.description : undefined,
              image_url: typeof category.image_url === 'string' ? category.image_url : undefined,
              coverImage: undefined
            }
          }
        })
      )
      // S'assurer que categoriesWithCoverImages est toujours un tableau
      if (!Array.isArray(categoriesWithCoverImages)) {
        categoriesWithCoverImages = categories.map(cat => ({
          id: String(cat.id),
          name: cat.name,
          slug: cat.slug,
          description: typeof cat.description === 'string' ? cat.description : undefined,
          image_url: typeof cat.image_url === 'string' ? cat.image_url : undefined
        }))
      }
    } catch (error) {
      // En cas d'erreur globale, utiliser les catégories sans images
      if (process.env.NODE_ENV === 'development') {
        logger.error('[BijouxPage] Erreur lors de l\'enrichissement des catégories:', error)
      }
      categoriesWithCoverImages = categories.map(cat => ({
        id: String(cat.id),
        name: cat.name,
        slug: cat.slug,
        description: typeof cat.description === 'string' ? cat.description : undefined,
        image_url: typeof cat.image_url === 'string' ? cat.image_url : undefined
      }))
    }
  }

  // Trouver la catégorie active
  const activeCategory = categorySlug 
    ? categoriesWithCoverImages.find(cat => cat.slug === categorySlug)
    : null

  // Trouver le nom de la catégorie depuis le mapping
  const categoryName = categorySlug && CATEGORIES[categorySlug] 
    ? (CATEGORIES[categorySlug]?.label || null)
    : (activeCategory?.name || null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            {t('pageTitle')}
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Section Nos Catégories - Simple et élégante */}
        {categoriesWithCoverImages && categoriesWithCoverImages.length > 0 && (
          <section className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">{t('categoriesTitle')}</h2>
              <p className="text-gray-700 leading-relaxed">{t('categoriesSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesWithCoverImages.map((category, index) => {
                if (!category) return null
                const isActive = categorySlug === category.slug
                return (
                  <div key={category.id || index} className={isActive ? 'relative' : ''}>
                    <CategoryCard category={category} index={index} />
                    {isActive && (
                      <div className={`absolute ${locale === 'ar' ? '-top-2 -left-2' : '-top-2 -right-2'} z-20`}>
                        <Badge className="bg-luxury-gold text-gray-900 border-2 border-luxury-gold shadow-lg">
                          {t('active')}
                        </Badge>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Produits */}
        <div id="products-section">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {searchQuery ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('searchResultsFor', { query: searchQuery })}
                  </h2>
                  <Link href={`/${locale}/bijoux${categorySlug ? `?category=${categorySlug}` : ''}`}>
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 cursor-pointer px-3 py-1.5 flex items-center">
                      <X className={`w-3.5 h-3.5 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {t('clearFilter')}
                    </Badge>
                  </Link>
                </>
              ) : (
                <h2 className="text-2xl font-bold text-gray-900">
                  {categoryName ? categoryName : t('allProducts')}
                </h2>
              )}
              {!searchQuery && categorySlug && categoryName ? (
                <Link href={`/${locale}/bijoux`}>
                  <Badge 
                    variant="outline" 
                    className={`bg-luxury-gold/10 text-luxury-gold border-luxury-gold/40 hover:bg-luxury-gold/20 cursor-pointer transition-all duration-300 hover:scale-105 group px-3 py-1.5 flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
                  >
                    <span className={locale === 'ar' ? 'ml-2' : 'mr-2'}>Catégorie: {categoryName}</span>
                    <X className={`w-3.5 h-3.5 inline group-hover:rotate-90 transition-transform duration-300 ${locale === 'ar' ? 'mr-2' : ''}`} />
                  </Badge>
                </Link>
              ) : (
                allBijoux.length > 0 && (
                  <Badge className="bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30">
                    {allBijoux.length} {allBijoux.length === 1 ? t('product') : t('products')}
                  </Badge>
                )
              )}
            </div>
            {categorySlug && (
              <Link href={`/${locale}/bijoux`}>
                <Button 
                  variant="outline" 
                  className={`border-luxury-gold/40 text-luxury-gold hover:bg-luxury-gold/10 hover:border-luxury-gold transition-all duration-300 hover:scale-105 flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <X className={`w-4 h-4 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('clearFilter')}
                </Button>
              </Link>
            )}
          </div>

          {allBijoux.length > 0 ? (
            <ProductGrid products={allBijoux} />
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {categoryName ? t('noCategoryProducts') : t('noProducts')}
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {categoryName 
                    ? t('noCategoryProductsDesc') 
                    : t('noProductsDesc')}
                </p>
                {categorySlug ? (
                  <Link href={`/${locale}/bijoux`}>
                    <Button className="bg-luxury-gold hover:bg-luxury-gold/90 text-gray-900">
                      {t('allProducts')}
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/${locale}`}>
                    <Button className="bg-luxury-gold hover:bg-luxury-gold/90 text-gray-900">
                      {t('backToHome')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
