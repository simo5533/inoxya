"use client"

import Link from "next/link"
import Image from "next/image"
import { Crown } from "lucide-react"
import { useState } from "react"
import { useLocale } from "next-intl"

// Utiliser le mapping centralisé
import { getCategoryImageWithFallback, getCategoryAltText } from '@/lib/category-images-mapping'

interface CategoryCardProps {
  category: {
    id: string
    name: string
    slug: string
    description?: string
    image_url?: string
    coverImage?: string // Image de couverture passée depuis le serveur
  }
  index: number
  onFilter?: (categorySlug: string) => void // Callback optionnel pour filtrer les produits (page d'accueil)
}

/**
 * Obtient l'image source pour une catégorie
 * Utilise le mapping centralisé avec fallback robuste
 */
const getCategoryImageSrc = (slug: string, image_url?: string, coverImage?: string): string => {
  return getCategoryImageWithFallback(slug, coverImage || image_url)
}

/**
 * Composant CategoryCard Premium - Style Unifié
 * Toutes les cartes utilisent le même design : photo de fond + overlay sombre + texte en bas
 */
export default function CategoryCard({ category, index, onFilter }: CategoryCardProps) {
  const locale = useLocale()
  const [imageError, setImageError] = useState(false)
  
  // Obtenir l'image source garantie
  const imageSrc = getCategoryImageSrc(category.slug, category.image_url, category.coverImage)

  // Rediriger vers /packs si c'est la catégorie "Nos packs"
  const href = category.slug === "broches" || category.name === "Nos packs" 
    ? `/${locale}/packs` 
    : `/${locale}/bijoux?category=${category.slug}`

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si onFilter est fourni (via prop), filtrer au lieu de rediriger
    if (onFilter && category.slug !== "broches" && category.name !== "Nos packs") {
      e.preventDefault()
      onFilter(category.slug)
      return
    }
    
    // Si on est sur la page d'accueil (window.filterProductsByCategory existe), filtrer
    type WindowWithFilter = Window & {
      filterProductsByCategory?: (slug: string) => void
    }
    const windowWithFilter = typeof window !== 'undefined' ? (window as WindowWithFilter) : null
    if (windowWithFilter?.filterProductsByCategory && category.slug !== "broches" && category.name !== "Nos packs") {
      e.preventDefault()
      windowWithFilter.filterProductsByCategory(category.slug)
      return
    }
    
    // Comportement par défaut : redirection avec smooth scroll
    if (category.slug !== "broches" && category.name !== "Nos packs") {
      setTimeout(() => {
        const productsSection = document.getElementById('products-section')
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  return (
    <Link href={href} className="block" onClick={handleClick} aria-label={`Voir les ${category.name}`}>
      <div
        className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1"
        style={{ 
          animationDelay: `${index * 100}ms`
        }}
      >
        {/* Container image avec aspect ratio fixe (16/9) pour cohérence */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          {/* Image de fond - TOUJOURS une vraie image */}
          {!imageError ? (
            <Image
              src={imageSrc}
              alt={getCategoryAltText(category.slug)}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index < 3}
            />
          ) : (
            // Fallback élégant si l'image échoue
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
          )}

          {/* Overlay gradient sombre luxueux (fort contraste pour lisibilité) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 group-hover:from-black/95 group-hover:via-black/60 transition-all duration-500" />

          {/* Effet de brillance subtil au hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out opacity-0 group-hover:opacity-100 pointer-events-none" />

          {/* Contenu texte en bas à gauche - Style uniforme */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:text-luxury-gold transition-colors duration-300">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-sm md:text-base text-gray-200 opacity-95 group-hover:opacity-100 transition-opacity duration-300 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                {category.description}
              </p>
            )}
          </div>

          {/* Icône couronne premium en haut à droite - Position fixe pour toutes les cartes */}
          <div className="absolute top-5 right-5 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 group-hover:bg-luxury-gold/20 group-hover:border-luxury-gold/50 transition-all duration-300 z-10">
            <Crown className="w-6 h-6 text-white group-hover:text-luxury-gold transition-colors duration-300" />
          </div>

          {/* Bordure dorée subtile au hover - Accent luxe */}
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-luxury-gold/40 rounded-2xl transition-all duration-500 pointer-events-none ring-0 group-hover:ring-2 group-hover:ring-luxury-gold/20" />
          
          {/* Effet de glow doré subtil au hover */}
          <div className="absolute inset-0 bg-luxury-gold/0 group-hover:bg-luxury-gold/5 rounded-2xl transition-all duration-500 pointer-events-none" />
        </div>
      </div>
    </Link>
  )
}


