import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductGrid from '@/components/ProductGrid'
import { GeoQaBlock } from '@/components/seo/GeoQaBlock'
import { BreadcrumbJsonLd, CollectionPageJsonLd } from '@/components/SEOJsonLd'
import { getAllBijoux } from '@/lib/database'
import { getCategorySeo } from '@/lib/seo/categories'
import { GEO_QA_COLLECTION } from '@/lib/seo/geo-qa'
import { seoLocalePath, seoPageMetadata, seoSiteUrl } from '@/lib/seo/config'
import { slugToDbValue } from '@/lib/category-mapping'
import { logger } from '@/lib/logger'

export async function generateCategoryMetadata(
  slug: string,
  locale: string
): Promise<Metadata> {
  const seo = getCategorySeo(slug)
  if (!seo) return { title: 'Catégorie | INOXYA BIJOUX' }
  return seoPageMetadata({
    title: seo.title,
    description: seo.description,
    path: `/bijoux/${slug}`,
    locale,
    keywords: [
      'bijoux acier inoxydable Maroc',
      seo.h1,
      'INOXYA',
      '316L',
    ],
  })
}

export default async function CategorySeoPage({
  slug,
  locale,
}: {
  slug: string
  locale: string
}) {
  const seo = getCategorySeo(slug)
  if (!seo) notFound()

  const filterSlug = seo.dbSlug
  let products: Awaited<ReturnType<typeof getAllBijoux>> = []
  try {
    products = await getAllBijoux(filterSlug)
  } catch (err) {
    logger.error('[CategorySeoPage] products:', err)
  }

  const pageUrl = seoLocalePath(locale, `/bijoux/${slug}`)
  const normalizedProducts = (products || []).map((p) => {
    const id = String(p.id)
    const img = p.main_image || p.image_url || '/placeholder.svg'
    return {
      id,
      name: p.name,
      price: Number(p.price) || 0,
      image_url: typeof img === 'string' ? img : '/placeholder.svg',
      main_image: typeof img === 'string' ? img : '/placeholder.svg',
      is_available: p.is_available !== false,
      is_featured: Boolean(p.is_featured),
      category_id: p.category_id || (p as { category?: string }).category || '',
      created_at: p.created_at || new Date().toISOString(),
      stock: typeof (p as { stock?: number }).stock === 'number' ? (p as { stock: number }).stock : 0,
    }
  })

  const siteUrl = seoSiteUrl()
  const listItems = normalizedProducts.slice(0, 48).map((p) => {
    const img = p.image_url || '/placeholder.svg'
    const absoluteImg = img.startsWith('http')
      ? img
      : `${siteUrl}${img.startsWith('/') ? img : `/${img}`}`
    return {
      name: p.name,
      url: seoLocalePath(locale, `/bijoux/${p.id}`),
      image: absoluteImg,
      price: p.price,
      sku: p.id,
      description: `${p.name} — bijou en acier inoxydable 316L INOXYA, livraison Maroc.`,
    }
  })

  const breadcrumbs = [
    { name: 'Accueil', url: seoLocalePath(locale, '') },
    { name: 'Bijoux', url: seoLocalePath(locale, '/bijoux') },
    { name: seo.h1.replace(/ au Maroc$/, ''), url: pageUrl },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <CollectionPageJsonLd
        name={seo.h1}
        description={seo.description}
        url={pageUrl}
        items={listItems}
      />

      <div className="container mx-auto px-4 py-16">
        <nav className="text-sm text-gray-600 mb-6" aria-label="Fil d'Ariane">
          <Link href={`/${locale}`} className="hover:text-orange-600">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/${locale}/bijoux`} className="hover:text-orange-600">
            Bijoux
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{seo.h1}</span>
        </nav>

        <header className="max-w-3xl mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            {seo.h1}
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">{seo.intro}</p>
          <p className="text-gray-600 leading-relaxed text-sm md:text-base whitespace-pre-line">
            {seo.body}
          </p>
        </header>

        <section aria-labelledby="category-products-heading">
          <h2 id="category-products-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Nos {slugToDbValue(slug) || seo.h1} — {normalizedProducts.length} modèle
            {normalizedProducts.length !== 1 ? 's' : ''}
          </h2>
          {normalizedProducts.length > 0 ? (
            <ProductGrid products={normalizedProducts} />
          ) : (
            <p className="text-gray-600">
              Nouveautés bientôt disponibles.{' '}
              <Link href={`/${locale}/bijoux`} className="text-orange-600 underline">
                Voir toute la collection
              </Link>
            </p>
          )}
        </section>

        <nav className="mt-10 flex flex-wrap gap-3 text-sm" aria-label="Autres catégories">
          {['bagues', 'colliers', 'bracelets', 'boucles-oreilles', 'montres'].map((s) =>
            s !== slug ? (
              <Link
                key={s}
                href={`/${locale}/bijoux/${s}`}
                className="rounded-full border border-gray-200 px-4 py-2 hover:border-orange-300 hover:text-orange-700"
              >
                {getCategorySeo(s)?.h1.replace(/ au Maroc$/, '') ?? s}
              </Link>
            ) : null
          )}
          <Link
            href={`/${locale}/packs`}
            className="rounded-full border border-gray-200 px-4 py-2 hover:border-orange-300 hover:text-orange-700"
          >
            Packs cadeaux
          </Link>
        </nav>

        <GeoQaBlock items={GEO_QA_COLLECTION} />
      </div>
    </div>
  )
}
