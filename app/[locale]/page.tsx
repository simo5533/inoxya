import HeroBanner from "@/components/HeroBanner"
import ProductGrid from "@/components/ProductGrid"
import FilterableProductSection from "@/components/FilterableProductSection"
import HomeCategorySection from "@/components/HomeCategorySection"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getBijouxVedettes, getAllCategories, getAllBijoux } from "@/lib/database"
import { getCategoryCoverImage } from "@/lib/category-images-mapping"
import Link from "next/link"
import type { Metadata } from "next"
import { Star, Shield, Truck, Heart, Crown, Sparkles, Gem, Instagram } from "lucide-react"
import { TikTokIcon } from "@/components/ui/tiktok-icon"
import { socialLinks } from "@/lib/social-links"
import { getSiteUrlSafe } from '@/lib/site-url'
import { getTranslations } from 'next-intl/server'
import type { Category } from "@/lib/types"

const siteUrl = getSiteUrlSafe()

export const metadata: Metadata = {
  title: "Accueil | INOXYA BIJOUX",
  description: "Découvrez notre collection exclusive de bijoux en acier inoxydable premium. Bagues, colliers, bracelets et montres berbères authentiques. Embellie ton âme avec INOXYA BIJOUX.",
  keywords: ["bijoux", "acier inoxydable", "bijoux berbères", "bijoux maroc", "bijoux premium", "colliers", "bagues", "bracelets", "montres"],
  openGraph: {
    title: "INOXYA BIJOUX - Embellie ton âme",
    description: "Collection exclusive de bijoux en acier inoxydable premium. Bijoux berbères authentiques.",
    url: siteUrl,
    siteName: "INOXYA BIJOUX",
    images: [
      {
        url: `${siteUrl}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "INOXYA BIJOUX - Collection de bijoux",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "INOXYA BIJOUX - Embellie ton âme",
    description: "Collection exclusive de bijoux en acier inoxydable premium",
    images: [`${siteUrl}/images/og-image.jpg`],
  },
  alternates: {
    canonical: siteUrl,
  },
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  let locale = 'fr'
  // Type pour la fonction de traduction
  type TranslationFunction = (key: string) => string
  let t: TranslationFunction = (key: string) => key // Fallback par défaut
  
  try {
    const resolvedParams = await params
    locale = resolvedParams.locale || 'fr'
    try {
      t = await getTranslations('home')
    } catch (translationError) {
      console.error('[HomePage] Erreur lors de la récupération des traductions:', translationError)
      // Fallback: fonction qui retourne la clé
      t = (key: string) => key
    }
  } catch (error) {
    console.error('[HomePage] Erreur lors de la récupération des paramètres:', error)
    // Utiliser des valeurs par défaut pour éviter le crash
    locale = 'fr'
    t = (key: string) => key // Fallback: retourner la clé
  }
  
  // OPTIMISATION: Récupérer les bijoux vedettes avec timeout pour éviter les blocages
  // Type Product local pour cette page
  type LocalProduct = {
    id: string | number
    name: string
    price: number
    image_url?: string | null
    is_available?: boolean
    is_featured?: boolean
    [key: string]: unknown
  }
  let featuredProducts: LocalProduct[] = []
  try {
    // Timeout de 5 secondes pour éviter les blocages infinis
     
    // Timeout de 10 secondes pour éviter les blocages (augmenté de 5s à 10s)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timeoutPromise = new Promise<any[]>((resolve) => {
      setTimeout(() => {
        // Only log timeout in development mode
        if (process.env['NODE_ENV'] === 'development') {
          console.warn('[HomePage] Timeout récupération produits vedettes (10s)')
        }
        resolve([])
      }, 10000)
    })
    
    const dbPromise = getBijouxVedettes(9).then((products) => {
      // S'assurer que featuredProducts est toujours un tableau
      if (!Array.isArray(products)) {
        return []
      }
      return products
    }).catch((error) => {
      console.error('[HomePage] Erreur récupération produits vedettes:', error)
      return []
    })
    
    // Race entre la requête DB et le timeout
    const productsFromRace = await Promise.race([dbPromise, timeoutPromise])
    // Convertir en LocalProduct[]
    featuredProducts = productsFromRace.map((p): LocalProduct => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.image_url || p.main_image || undefined,
      is_available: p.is_available !== false,
      is_featured: p.is_featured || false
    }))
  } catch (error) {
    // Logger l'erreur mais ne pas la propager pour éviter les redirections
    console.error('[HomePage] Erreur lors de la récupération des produits vedettes:', error)
    featuredProducts = []
  }
  
  // FALLBACK: UNIQUEMENT si explicitement activé via ENABLE_FALLBACK=1
  // En production, fallback JAMAIS activé
  const isProduction = process.env['NODE_ENV'] === 'production'
  const enableFallback = process.env['ENABLE_FALLBACK'] === '1'
  
  if ((!featuredProducts || featuredProducts.length === 0) && enableFallback && !isProduction) {
    try {
      const { testConnection } = await import('@/lib/sqlite')
      const dbWasAccessible = testConnection()
      
      // Utiliser fallback UNIQUEMENT en développement avec flag explicite
      if (!dbWasAccessible || featuredProducts.length === 0) {
        const { getAllFallbackProducts } = await import('@/lib/fallback-products')
        const fallbackProducts = getAllFallbackProducts()
        // Prendre les 9 premiers produits comme vedettes
        featuredProducts = fallbackProducts.slice(0, 9).map((p) => ({
          id: String(p.id),
          name: p.name,
          description: p.description,
          price: p.price,
          original_price: p.original_price,
          image_url: p.image_url,
          category_id: p.category_id,
          is_available: p.is_available,
          is_featured: p.is_featured,
          images: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits fallback:', error)
      featuredProducts = []
    }
  }
  
  // Récupérer les catégories avec gestion d'erreur et timeout
  let categories: Category[] = []
  try {
    // Timeout de 8 secondes pour éviter les blocages (augmenté de 3s à 8s)
    const categoriesTimeout = new Promise<Category[]>((resolve) => {
      setTimeout(() => {
        // Only log timeout in development mode
        if (process.env['NODE_ENV'] === 'development') {
          console.warn('[HomePage] Timeout récupération catégories (8s)')
        }
        resolve([])
      }, 8000)
    })
    
    const categoriesPromise = getAllCategories().then((cats) => {
      if (!Array.isArray(cats)) {
        return []
      }
      return cats
    }).catch((error) => {
      console.error('[HomePage] Erreur récupération catégories:', error)
      return []
    })
    
    categories = await Promise.race([categoriesPromise, categoriesTimeout])
  } catch (error) {
    // Logger l'erreur mais ne pas la propager pour éviter les redirections
    if (process.env.NODE_ENV === 'development') {
      console.error('[HomePage] Erreur lors de la récupération des catégories:', error)
    }
    categories = []
  }
  
  // Enrichir les catégories avec les images de couverture (produits réels)
  // Gérer les erreurs silencieusement pour éviter les Internal Server Error
  let categoriesWithCoverImages = categories
  if (categories.length > 0) {
    try {
      categoriesWithCoverImages = await Promise.all(
        categories.map(async (category: Category) => {
          try {
            const coverImage = await getCategoryCoverImage(category.slug)
            return {
              ...category,
              coverImage: coverImage || undefined
            }
          } catch (error) {
            // En cas d'erreur, retourner la catégorie sans image de couverture
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[HomePage] Erreur lors de la récupération de l'image pour ${category.slug}:`, error)
            }
            return {
              ...category,
              coverImage: undefined
            }
          }
        })
      )
      // S'assurer que categoriesWithCoverImages est toujours un tableau
      if (!Array.isArray(categoriesWithCoverImages)) {
        categoriesWithCoverImages = categories
      }
    } catch (error) {
      // Logger l'erreur mais ne pas la propager
      if (process.env.NODE_ENV === 'development') {
        console.error('[HomePage] Erreur lors de l\'enrichissement des catégories:', error)
      }
      // Utiliser les catégories sans images en cas d'erreur
      categoriesWithCoverImages = categories
    }
  }

  // Récupérer tous les produits pour la section filtrée
  let allProducts: LocalProduct[] = []
  try {
    const productsFromDb = await getAllBijoux()
    // S'assurer que allProducts est toujours un tableau
    if (!Array.isArray(productsFromDb)) {
      allProducts = []
    } else {
      // Convertir en LocalProduct[]
      allProducts = productsFromDb.map((p): LocalProduct => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_url || p.main_image || undefined,
        is_available: p.is_available !== false,
        is_featured: p.is_featured || false
      }))
    }
    // Filtrer uniquement les produits disponibles
    allProducts = allProducts.filter((p) => p.is_available === true)
  } catch (error) {
    // Logger l'erreur mais ne pas la propager
    if (process.env.NODE_ENV === 'development') {
      console.error('[HomePage] Erreur lors de la récupération de tous les produits:', error)
    }
    allProducts = []
  }

  return (
    <div>
      {/* Hero Banner */}
      <HeroBanner />

      {/* Section Bijoux Vedettes avec grille selon votre spécification */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className={`mb-4 bg-luxury-black text-luxury-gold border border-luxury-gold/30 px-4 py-2 font-semibold flex items-center ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Crown className={`w-4 h-4 ${locale === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t('featured.badge')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 tracking-tight leading-tight">{t('featured.title')}</h2>
            <div className="text-gray-700 max-w-2xl mx-auto text-lg leading-relaxed">
              {t('featured.subtitle')}
            </div>
          </div>

          {/* Grille de produits optimisée */}
          <ProductGrid products={featuredProducts} />

          {/* Message si pas de produits */}
          {featuredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💎</div>
              <div className="text-gray-600 text-lg mb-4">Aucun bijou vedette disponible pour le moment</div>
              <div className="text-sm text-gray-500">Les produits vedettes apparaîtront ici une fois disponibles</div>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href={`/${locale}/bijoux`}>
              <Button
                size="lg"
                className="bg-luxury-black hover:bg-luxury-charcoal text-luxury-gold border border-luxury-gold/30 hover:border-luxury-gold px-8 py-3 text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {t('featured.viewAll')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section Catégories Premium - Design Luxe */}
      <section className="py-20 bg-white relative overflow-hidden border-t border-gray-100">
        {/* Texture subtile */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#000_1px,_transparent_1px)] bg-[length:60px_60px]"></div>
        </div>
        
        {/* Accents dorés subtils */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-luxury-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-luxury-gold/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-10 h-10 bg-luxury-gold/10 rounded-full flex items-center justify-center mr-4 border border-luxury-gold/20">
                <Sparkles className="w-5 h-5 text-luxury-gold" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-luxury-black tracking-tight">{t('categories.title')}</h2>
              <div className={`w-10 h-10 bg-luxury-gold/10 rounded-full flex items-center justify-center ${locale === 'ar' ? 'mr-4' : 'ml-4'} border border-luxury-gold/20`}>
                <Gem className="w-5 h-5 text-luxury-gold" />
              </div>
            </div>
            <div className="text-gray-700 max-w-2xl mx-auto text-lg leading-relaxed">
              {t('categories.subtitle')}
            </div>
          </div>

          {/* Grille de catégories premium - Wrapper client pour le filtrage */}
          <HomeCategorySection 
            categories={categoriesWithCoverImages}
          />
        </div>
      </section>

      {/* Section Produits Filtrés - Après "Notre Collection" */}
      <FilterableProductSection 
        products={allProducts}
        categories={categoriesWithCoverImages}
      />

      {/* Section Avantages - Design Premium */}
      <section className="py-20 bg-luxury-ivory relative overflow-hidden">
        {/* Texture subtile */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#000_1px,_transparent_1px)] bg-[length:40px_40px]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-luxury-black tracking-tight">{t('features.title')}</h2>
            <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">{t('features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group bg-white rounded-xl p-8 border border-gray-200 hover:border-luxury-gold/30 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-luxury-gold/10 rounded-full flex items-center justify-center border-2 border-luxury-gold/20 group-hover:border-luxury-gold group-hover:bg-luxury-gold/20 transition-all duration-300">
                <Shield className="w-8 h-8 text-luxury-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-luxury-black">{t('features.premium.title')}</h3>
              <p className="text-gray-700 leading-relaxed">{t('features.premium.description')}</p>
            </div>

            <div className="text-center group bg-white rounded-xl p-8 border border-gray-200 hover:border-luxury-gold/30 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-luxury-gold/10 rounded-full flex items-center justify-center border-2 border-luxury-gold/20 group-hover:border-luxury-gold group-hover:bg-luxury-gold/20 transition-all duration-300">
                <Truck className="w-8 h-8 text-luxury-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-luxury-black">{t('features.shipping.title')}</h3>
              <p className="text-gray-700 leading-relaxed">{t('features.shipping.description')}</p>
            </div>

            <div className="text-center group bg-white rounded-xl p-8 border border-gray-200 hover:border-luxury-gold/30 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-luxury-gold/10 rounded-full flex items-center justify-center border-2 border-luxury-gold/20 group-hover:border-luxury-gold group-hover:bg-luxury-gold/20 transition-all duration-300">
                <Heart className="w-8 h-8 text-luxury-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-luxury-black">{t('features.warranty.title')}</h3>
              <p className="text-gray-700 leading-relaxed">{t('features.warranty.description')}</p>
            </div>

            <div className="text-center group bg-white rounded-xl p-8 border border-gray-200 hover:border-luxury-gold/30 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-luxury-gold/10 rounded-full flex items-center justify-center border-2 border-luxury-gold/20 group-hover:border-luxury-gold group-hover:bg-luxury-gold/20 transition-all duration-300">
                <Star className="w-8 h-8 text-luxury-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-luxury-black">{t('features.support.title')}</h3>
              <p className="text-gray-700 leading-relaxed">{t('features.support.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Instagram - Design Premium */}
      <section className="py-20 bg-gradient-to-b from-luxury-ivory via-white to-luxury-ivory relative overflow-hidden">
        {/* Effet de texture subtil */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#000_1px,_transparent_1px)] bg-[length:50px_50px]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-luxury-gold/10 rounded-full flex items-center justify-center mr-4">
                <Instagram className="w-6 h-6 text-luxury-gold" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-luxury-black tracking-tight">
                Suivez-nous sur Instagram
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {socialLinks.instagram.description}
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Link 
              href={socialLinks.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-luxury-gold/20 to-luxury-gold-light/10 rounded-full flex items-center justify-center border-2 border-luxury-gold/30 group-hover:border-luxury-gold transition-colors">
                    <Instagram className="w-10 h-10 text-luxury-gold" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-luxury-black mb-3 text-center">{socialLinks.instagram.handle}</h3>
                <p className="text-gray-600 mb-8 text-center leading-relaxed">
                  Collection exclusive de bijoux en acier inoxydable premium
                </p>
                
                <div className="flex items-center justify-center space-x-8 mb-8 pb-8 border-b border-gray-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-luxury-black">{socialLinks.instagram.stats.followers}</div>
                    <div className="text-gray-500 text-sm mt-1">Abonnés</div>
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-luxury-black">{socialLinks.instagram.stats.posts}</div>
                    <div className="text-gray-500 text-sm mt-1">Publications</div>
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-luxury-black">{socialLinks.instagram.stats.rating}</div>
                    <div className="text-gray-500 text-sm mt-1">Note</div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-luxury-black hover:bg-luxury-charcoal text-white font-semibold py-6 rounded-lg transition-all duration-300 border border-luxury-gold/20 hover:border-luxury-gold/40 group-hover:shadow-lg"
                >
                  <Instagram className="w-5 h-5 mr-2" />
                  Suivre sur Instagram
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Section TikTok - Design Premium */}
      <section className="py-20 bg-luxury-black relative overflow-hidden">
        {/* Effet de lumière subtil */}
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-charcoal via-luxury-black to-luxury-charcoal"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-luxury-gold/20 rounded-full flex items-center justify-center mr-4 border border-luxury-gold/30">
                <TikTokIcon className="w-6 h-6 text-luxury-gold" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Suivez-nous sur TikTok
              </h2>
            </div>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
              {socialLinks.tiktok.description}
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Link 
              href={socialLinks.tiktok.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="bg-luxury-charcoal/80 backdrop-blur-sm rounded-2xl p-8 border border-luxury-gold/20 hover:border-luxury-gold/40 shadow-2xl hover:shadow-luxury-gold/10 transition-all duration-500 transform hover:-translate-y-1">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 bg-luxury-gold/10 rounded-full flex items-center justify-center border-2 border-luxury-gold/30 group-hover:border-luxury-gold transition-colors">
                    <TikTokIcon className="w-10 h-10 text-luxury-gold" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3 text-center">{socialLinks.tiktok.handle}</h3>
                <p className="text-gray-300 mb-8 text-center leading-relaxed">
                  Vidéos créatives et tendances bijoux INOXYA
                </p>
                
                <div className="flex items-center justify-center space-x-8 mb-8 pb-8 border-b border-luxury-gold/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{socialLinks.tiktok.stats.followers}</div>
                    <div className="text-gray-400 text-sm mt-1">Abonnés</div>
                  </div>
                  <div className="w-px h-12 bg-luxury-gold/20"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{socialLinks.tiktok.stats.posts}</div>
                    <div className="text-gray-400 text-sm mt-1">Vidéos</div>
                  </div>
                  <div className="w-px h-12 bg-luxury-gold/20"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{socialLinks.tiktok.stats.rating}</div>
                    <div className="text-gray-400 text-sm mt-1">Note</div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-luxury-gold hover:bg-luxury-gold-dark text-luxury-black font-semibold py-6 rounded-lg transition-all duration-300 border border-luxury-gold hover:border-luxury-gold-dark group-hover:shadow-lg shadow-luxury-gold/20"
                >
                  <TikTokIcon className="w-5 h-5 mr-2" />
                  Suivre sur TikTok
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

HomePage.displayName = 'HomePage'

export default HomePage
