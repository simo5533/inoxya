import { MetadataRoute } from 'next'
import { CATEGORY_SEO_SLUGS } from '@/lib/seo/categories'
import { SEO_CONTENT_SLUGS } from '@/lib/seo/content/registry'
import { PRODUCTION_SITE_URL } from '@/lib/site-url'

/**
 * Sitemap dynamique : liste complète des URLs canoniques indexables.
 * Évite les trous « détectée, non indexée » dus à un sitemap figé au build.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 3600

const LOCALES = ['fr', 'ar'] as const

const STATIC_PATHS = [
  { path: '', priority: 1, changeFrequency: 'daily' as const },
  { path: '/bijoux', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/packs', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/packs/creer', priority: 0.6, changeFrequency: 'weekly' as const },
  { path: '/a-propos', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/faq', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/guide', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/sur-mesure', priority: 0.6, changeFrequency: 'monthly' as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = PRODUCTION_SITE_URL
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []
  const seen = new Set<string>()

  const push = (url: string, rest: Omit<MetadataRoute.Sitemap[number], 'url'>) => {
    if (seen.has(url)) return
    seen.add(url)
    entries.push({ url, ...rest })
  }

  for (const locale of LOCALES) {
    for (const page of STATIC_PATHS) {
      push(`${siteUrl}/${locale}${page.path}`, {
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }

    for (const slug of CATEGORY_SEO_SLUGS) {
      push(`${siteUrl}/${locale}/bijoux/${slug}`, {
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.85,
      })
    }

    for (const slug of SEO_CONTENT_SLUGS) {
      push(`${siteUrl}/${locale}/guide/${slug}`, {
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  try {
    const { getAllBijoux, getAllPacks } = await import('@/lib/database')
    const products = await getAllBijoux()
    type Product = {
      id: string | number
      is_active?: boolean
      is_available?: boolean
      updated_at?: string | null
    }
    for (const locale of LOCALES) {
      for (const product of (products || []) as Product[]) {
        if (product.is_active === false || product.is_available === false) continue
        const id = String(product.id || '').trim()
        if (!id) continue
        // Ne pas indexer les IDs qui collisionnent avec des slugs catégorie
        if ((CATEGORY_SEO_SLUGS as string[]).includes(id)) continue
        const updatedAt = product.updated_at
        push(`${siteUrl}/${locale}/bijoux/${id}`, {
          lastModified: updatedAt ? new Date(updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }

    const packs = await getAllPacks()
    for (const locale of LOCALES) {
      for (const pack of packs || []) {
        const p = pack as { id?: string | number; slug?: string }
        const pathId = p.slug || p.id
        if (!pathId) continue
        push(`${siteUrl}/${locale}/packs/${pathId}`, {
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.75,
        })
      }
    }
  } catch {
    // DB indisponible — pages statiques suffisent
  }

  return entries
}
