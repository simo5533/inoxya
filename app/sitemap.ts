import { MetadataRoute } from 'next'
import { CATEGORY_SEO_SLUGS } from '@/lib/seo/categories'
import { SEO_CONTENT_SLUGS } from '@/lib/seo/content/registry'
import { PRODUCTION_SITE_URL } from '@/lib/site-url'

/** Sitemap pré-généré : réponse rapide pour Googlebot (évite timeouts cold start). */
export const dynamic = 'force-static'
export const revalidate = 3600

const LOCALES = ['fr', 'ar'] as const

const STATIC_PATHS = [
  { path: '', priority: 1, changeFrequency: 'daily' as const },
  { path: '/bijoux', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/packs', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/packs/creer', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/a-propos', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/guide', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/sur-mesure', priority: 0.7, changeFrequency: 'monthly' as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = PRODUCTION_SITE_URL
  const now = new Date()

  const entries: MetadataRoute.Sitemap = []

  for (const locale of LOCALES) {
    for (const page of STATIC_PATHS) {
      entries.push({
        url: `${siteUrl}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }

    for (const slug of CATEGORY_SEO_SLUGS) {
      entries.push({
        url: `${siteUrl}/${locale}/bijoux/${slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.85,
      })
    }

    for (const slug of SEO_CONTENT_SLUGS) {
      entries.push({
        url: `${siteUrl}/${locale}/guide/${slug}`,
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
        const updatedAt = product.updated_at
        entries.push({
          url: `${siteUrl}/${locale}/bijoux/${product.id}`,
          lastModified: updatedAt ? new Date(updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }

    const packs = await getAllPacks()
    for (const locale of LOCALES) {
      for (const pack of packs || []) {
        const id = (pack as { id?: string | number; slug?: string }).id ?? (pack as { slug?: string }).slug
        if (!id) continue
        entries.push({
          url: `${siteUrl}/${locale}/packs`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.75,
        })
        break
      }
    }
  } catch {
    // DB indisponible au build — pages statiques suffisent
  }

  return entries
}
