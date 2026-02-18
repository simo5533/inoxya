"use client"

import { useState, useEffect, useCallback } from "react"
import ProductGrid from "./ProductGrid"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { X, Crown } from "lucide-react"

interface FilterableProductSectionProps {
  products: any[]
  categories: any[]
}

/**
 * Composant client pour filtrer les produits par catégorie sur la page d'accueil
 */
export default function FilterableProductSection({ products, categories }: FilterableProductSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredProducts, setFilteredProducts] = useState(products)

  // Filtrer les produits quand la catégorie change
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredProducts(products)
      return
    }

    // Trouver la catégorie correspondante
    const category = categories.find((cat: any) => cat.slug === selectedCategory)
    if (!category) {
      setFilteredProducts(products)
      return
    }

    // Filtrer les produits par catégorie
    // category_id peut être le slug ou l'ID de la catégorie
    const filtered = products.filter((product: any) => {
      // Comparer avec le slug (format le plus courant)
      if (product.category_id === category.slug) return true
      // Comparer avec l'ID de la catégorie
      if (product.category_id === category.id) return true
      // Comparer avec le nom de la catégorie (fallback)
      if (product.category_id === category.name) return true
      return false
    })

    setFilteredProducts(filtered)
  }, [selectedCategory, products, categories])

  // Fonction pour filtrer par catégorie (appelée depuis CategoryCard)
  const handleCategoryFilter = useCallback((categorySlug: string) => {
    setSelectedCategory(categorySlug)
    // Scroll vers la section produits
    setTimeout(() => {
      const productsSection = document.getElementById('products-section')
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }, [])

  // Exposer la fonction globalement pour que CategoryCard puisse l'appeler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).filterProductsByCategory = handleCategoryFilter
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).filterProductsByCategory
      }
    }
  }, [handleCategoryFilter])

  const handleResetFilter = () => {
    setSelectedCategory(null)
    // Scroll vers la section produits
    setTimeout(() => {
      const productsSection = document.getElementById('products-section')
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Trouver le nom de la catégorie sélectionnée
  const selectedCategoryName = selectedCategory
    ? categories.find((cat: any) => cat.slug === selectedCategory)?.name || null
    : null

  // Ne rien afficher si aucune catégorie n'est sélectionnée
  if (!selectedCategory) {
    return null
  }

  return (
    <section id="products-section" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* En-tête avec filtre actif */}
        <div className="text-center mb-12">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge className="bg-luxury-black text-luxury-gold border border-luxury-gold/30 px-4 py-2 font-semibold">
                <Crown className="w-4 h-4 mr-2" />
                Catégorie: {selectedCategoryName}
              </Badge>
              <Button
                onClick={handleResetFilter}
                variant="outline"
                className="border-luxury-gold/30 text-luxury-black hover:bg-luxury-gold/10 hover:border-luxury-gold"
              >
                <X className="w-4 h-4 mr-2" />
                Tout afficher
              </Button>
            </div>
            <p className="text-gray-600 text-lg">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} dans cette catégorie
            </p>
          </div>
        </div>

        {/* Grille de produits filtrée */}
        <ProductGrid products={filteredProducts} />
      </div>
    </section>
  )
}

