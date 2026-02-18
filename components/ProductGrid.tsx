"use client"
import ProductCard from "./ProductCard"
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Crown, Sparkles, Filter, SortAsc, Star } from "lucide-react"
import { logger } from "@/lib/logger"
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton"
import { useLocale } from "next-intl"

interface ProductGridProps {
  products: any[]
  categories?: any[]
  title?: string
  subtitle?: string
  showFilters?: boolean
  initialCategory?: string | null
}

function ProductGridContent({ products, categories = [], title, subtitle, showFilters = false, initialCategory }: ProductGridProps) {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams?.get('category') || initialCategory || null
  
  const [sortBy, setSortBy] = useState("newest")
  const [filterCategory, setFilterCategory] = useState("all")

  // Debug: Log des produits reçus (production: logger.info)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.info('[ProductGrid] 🔍 Analyse des produits reçus:')
      logger.info(`  - Total produits: ${products?.length || 0}`)
      logger.info(`  - Type: ${Array.isArray(products) ? 'Array' : typeof products}`)
      
      if (products && products.length > 0) {
        logger.info('[ProductGrid] ✅ Premier produit:', {
          id: products[0]?.id,
          name: products[0]?.name,
          price: products[0]?.price,
          image_url: products[0]?.image_url,
          main_image: products[0]?.main_image,
          is_available: products[0]?.is_available,
          category_id: products[0]?.category_id,
          images: Array.isArray(products[0]?.images) ? `${products[0].images.length} images` : typeof products[0]?.images
        })
        
        // Vérifier les produits invalides
        const invalidProducts = products.filter((p: any) => !p || !p.id || !p.name)
        if (invalidProducts.length > 0) {
          logger.warn(`[ProductGrid] ⚠️ ${invalidProducts.length} produit(s) invalide(s) détecté(s)`)
        }
      } else {
        logger.warn('[ProductGrid] ⚠️ Aucun produit reçu ou tableau vide!')
      }
    }
  }, [products])

  // Initialiser le filtre depuis l'URL si présent
  useEffect(() => {
    if (categoryFromUrl) {
      // Trouver la catégorie correspondante au slug
      const category = categories.find((cat: any) => cat.slug === categoryFromUrl)
      if (category) {
        setFilterCategory(category.slug) // Utiliser le slug au lieu de l'ID
      }
    }
  }, [categoryFromUrl, categories])

  // Tri des produits
  const sortedProducts = [...(products || [])].sort((a: any, b: any) => {
    switch (sortBy) {
      case "price-low":
        return (a.price || 0) - (b.price || 0)
      case "price-high":
        return (b.price || 0) - (a.price || 0)
      case "rating":
        return (b.rating || 4.5) - (a.rating || 4.5)
      case "newest":
      default:
        return new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime()
    }
  })

  // Filtrage par catégorie (par slug)
  const filteredProducts =
    filterCategory === "all"
      ? sortedProducts
      : sortedProducts.filter((product: any) => {
          // Les produits ont category_id qui est le slug de la catégorie
          return product.category_id === filterCategory
        })

  return (
    <div className="space-y-12">
      {/* En-tête luxueux avec titre et filtres */}
      {(title || showFilters) && (
        <div className="relative">
          {/* Fond avec effets de luxe */}
          <div className="absolute inset-0 bg-luxury-black rounded-3xl"></div>
          <div className="absolute inset-0 bg-luxury-gold/5 rounded-3xl"></div>

          {/* Contenu principal */}
          <div className="relative bg-luxury-charcoal/95 backdrop-blur-sm rounded-3xl border border-luxury-gold/20 p-8 md:p-12">
            {/* Effets subtils de lumière */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute top-8 left-12 w-32 h-32 bg-luxury-gold/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-8 right-12 w-40 h-40 bg-luxury-gold/5 rounded-full blur-3xl"></div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {title && (
                <div className="text-center lg:text-left">
                  {/* Badge premium */}
                  <Badge className="mb-6 bg-luxury-black text-luxury-gold border border-luxury-gold/30 font-semibold px-6 py-2 text-sm shadow-lg">
                    <Crown className="w-4 h-4 mr-2" />
                    Collection Exclusive
                  </Badge>

                  {/* Titre principal avec effet de luxe */}
                  <div className="relative">
                    <h2 className="text-4xl md:text-6xl font-bold mb-4 text-luxury-gold tracking-tight">
                      {title}
                    </h2>
                  </div>

                  {subtitle && (
                    <div className="text-xl text-luxury-ivory/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                      <Sparkles className="inline w-5 h-5 mr-2 text-luxury-gold" />
                      {subtitle}
                    </div>
                  )}
                </div>
              )}

              {showFilters && (
                <div className="flex flex-col sm:flex-row gap-4 lg:flex-col lg:gap-3">
                  {/* Filtre par catégorie avec style luxe */}
                  <div className="relative group">
                    <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-luxury-gold group-hover:text-luxury-gold-light transition-colors" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full sm:w-48 pl-12 pr-4 py-3 bg-luxury-black border border-luxury-gold/30 rounded-xl text-luxury-ivory focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all duration-300 hover:border-luxury-gold/50 cursor-pointer appearance-none"
                    >
                      <option value="all" className="bg-luxury-black text-luxury-ivory">
                        Toutes catégories
                      </option>
                      {categories.map((category: any) => (
                        <option key={category.id} value={category.slug} className="bg-luxury-black text-luxury-ivory">
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {/* Flèche personnalisée */}
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-luxury-gold"></div>
                    </div>
                  </div>

                  {/* Tri avec style luxe */}
                  <div className="relative group">
                    <SortAsc className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-luxury-gold group-hover:text-luxury-gold-light transition-colors" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full sm:w-48 pl-12 pr-4 py-3 bg-luxury-black border border-luxury-gold/30 rounded-xl text-luxury-ivory focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-all duration-300 hover:border-luxury-gold/50 cursor-pointer appearance-none"
                    >
                      <option value="newest" className="bg-luxury-black text-luxury-ivory">
                        Plus récents
                      </option>
                      <option value="price-low" className="bg-luxury-black text-luxury-ivory">
                        Prix croissant
                      </option>
                      <option value="price-high" className="bg-luxury-black text-luxury-ivory">
                        Prix décroissant
                      </option>
                      <option value="rating" className="bg-luxury-black text-luxury-ivory">
                        Mieux notés
                      </option>
                    </select>
                    {/* Flèche personnalisée */}
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-luxury-gold"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compteur de produits avec style luxe */}
            <div className="mt-8 flex items-center justify-center lg:justify-start">
              <div className="bg-luxury-black/50 backdrop-blur-sm border border-luxury-gold/30 rounded-full px-6 py-2">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-luxury-gold" />
                  <span className="text-luxury-ivory font-medium">
                    {filteredProducts.length} bijou{filteredProducts.length > 1 ? "x" : ""} d'exception
                  </span>
                  <Star className="w-4 h-4 text-luxury-gold" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📐 Grille responsive propre et organisée */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredProducts.map((product: any, index: number) => {
            // Vérifier que le produit est valide avant de l'afficher
            if (!product || !product.id || !product.name) {
              if (process.env.NODE_ENV === 'development') {
                logger.warn(`[ProductGrid] Produit invalide à l'index ${index}:`, product)
              }
              return null
            }
            
            return (
              <div key={`${product.id}-${index}`} className="w-full">
                <ProductCard product={product} />
              </div>
            )
          })}
        </div>
      ) : (
        // Afficher un message si aucun produit après filtrage mais qu'il y en a dans la liste totale
        products && products.length > 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              Aucun produit ne correspond aux filtres sélectionnés.
            </p>
            <button
              onClick={() => {
                setFilterCategory("all")
                setSortBy("newest")
              }}
              className="mt-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : null
      )}

              {/* Message si aucun produit avec style luxe */}
              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <div className="relative">
                    {/* Fond avec effets */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl blur-xl"></div>

                    <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-12">
                      <div className="text-8xl mb-6 animate-bounce">💎</div>
                      <h3 className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        {filterCategory === "all" ? "Aucun bijou trouvé" : "Aucun bijou dans cette catégorie"}
                      </h3>
                      <p className="text-gray-300 text-lg max-w-md mx-auto">
                        {filterCategory === "all" 
                          ? "Modifiez vos filtres pour découvrir nos créations exceptionnelles"
                          : "Cette catégorie ne contient pas encore de produits. Explorez nos autres collections !"
                        }
                      </p>
                      {/* Log de diagnostic (dev uniquement) */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 text-xs text-gray-500">
                          <p>Debug: {products.length} produit(s) total, filtre: {filterCategory}, catégorie URL: {categoryFromUrl || 'aucune'}</p>
                        </div>
                      )}

                      {/* Bouton de réinitialisation ou retour */}
                      <div className="mt-6 flex gap-4 justify-center">
                        {filterCategory !== "all" && (
                          <Link
                            href={`/${locale}/bijoux`}
                            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            <Sparkles className="inline w-5 h-5 mr-2" />
                            Voir tous les bijoux
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setFilterCategory("all")
                            setSortBy("newest")
                          }}
                          className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <Sparkles className="inline w-5 h-5 mr-2" />
                          Réinitialiser les filtres
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
    </div>
  )
}

export default function ProductGrid(props: ProductGridProps) {
  return (
    <Suspense fallback={<ProductGridSkeleton count={6} />}>
      <ProductGridContent {...props} />
    </Suspense>
  )
}
