import { MetadataRoute } from 'next'
import { getSiteUrlSync } from '@/lib/site-url'

const siteUrl = getSiteUrlSync()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/bijoux`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/packs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/a-propos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/sur-mesure`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Pages produits dynamiques (avec fallback)
  let productPages: MetadataRoute.Sitemap = []
  try {
    const { getAllBijoux } = await import('@/lib/database')
    const products = await getAllBijoux()
    type Product = {
      id: string | number
      is_active?: boolean
      is_available?: boolean
      updated_at?: string | null
      [key: string]: unknown
    }
    productPages = (products || [])
      .filter((p: Product) => p.is_active !== false && p.is_available !== false)
      .map((product: Product) => {
        const updatedAt = product['updated_at']
        const lastModified = (typeof updatedAt === 'string' && updatedAt) ? new Date(updatedAt) : new Date()
        return {
          url: `${siteUrl}/bijoux/${product.id}`,
          lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }
      })
  } catch (error) {
    // Silencieux: utiliser le fallback depuis les images si DB non disponible
    try {
      const { getAllFallbackProducts } = await import('@/lib/fallback-products')
      const fallbackProducts = getAllFallbackProducts()
      productPages = fallbackProducts.map((product) => ({
        url: `${siteUrl}/bijoux/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    } catch {
      // Si même le fallback échoue, continuer sans produits dynamiques
      // Logger l'erreur en développement seulement
      if (process.env.NODE_ENV === 'development') {
        console.warn('[sitemap] Impossible de récupérer les produits:', error)
      }
    }
  }

  // Pages packs dynamiques (avec fallback)
  let packPages: MetadataRoute.Sitemap = []
  try {
    const { getAllPacks } = await import('@/lib/database')
    const packs = await getAllPacks()
    type Pack = {
      id: string | number
      slug?: string
      [key: string]: unknown
    }
    packPages = (packs || []).map((pack: Pack) => {
      const updatedAt = pack['updated_at']
      const lastModified = (typeof updatedAt === 'string' && updatedAt) ? new Date(updatedAt) : new Date()
      return {
        url: `${siteUrl}/packs/${pack.id || pack.slug || ''}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })
  } catch (error) {
    // Silencieux: utiliser le fallback depuis les images si DB non disponible
    try {
      const { getFallbackPacks } = await import('@/lib/fallback-packs')
      const fallbackPacks = getFallbackPacks()
      packPages = fallbackPacks.map((pack) => ({
        url: `${siteUrl}/packs/${pack.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    } catch {
      // Si même le fallback échoue, continuer sans packs dynamiques
      // Logger l'erreur en développement seulement
      if (process.env.NODE_ENV === 'development') {
        console.warn('[sitemap] Impossible de récupérer les packs:', error)
      }
    }
  }
  
  // Ajouter les pages catégories importantes
  const categoryPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/bijoux?category=bagues`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/bijoux?category=colliers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/bijoux?category=bracelets`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/bijoux?category=boucles-oreilles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/bijoux?category=montres`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  return [...staticPages, ...categoryPages, ...productPages, ...packPages]
}
