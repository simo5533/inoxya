import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Crown, Package, Truck, Shield, RotateCcw } from 'lucide-react'
import { getPackByIdPublic } from '@/lib/database'
import OrderForm from '@/components/OrderForm'
import { BreadcrumbJsonLd } from '@/components/SEOJsonLd'
import { seoPageMetadata, SEO_MATERIAL, SEO_FREE_SHIPPING_THRESHOLD, SEO_RETURN_DAYS, SEO_BRAND, SEO_CURRENCY } from '@/lib/seo/config'
import { buildMerchantOffer, absoluteProductImages } from '@/lib/seo/merchant-offer'
import { getSiteUrlSafe } from '@/lib/site-url'
import { getTranslations } from 'next-intl/server'
import {
  extractPackItemsCount,
  stripPackItemsCountMarker,
} from '@/lib/pack-items-count'
import { ShareButton } from '@/components/ShareButton'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const dynamicParams = true

function formatMad(price: number) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(price)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}): Promise<Metadata> {
  try {
    const siteUrl = getSiteUrlSafe()
    const { id, locale } = await params
    const pack = await getPackByIdPublic(id)
    const t = await getTranslations({ locale, namespace: 'packs.detail' })

    if (!pack) {
      return {
        title: t('notFound.title'),
        description: t('notFound.description'),
        robots: { index: false, follow: false },
      }
    }

    const description =
      stripPackItemsCountMarker(pack.description).slice(0, 160) ||
      t('default.description')
    const rawImage = pack.image_url || ''
    let imageUrl = `${siteUrl}/images/default-product.jpg`
    if (rawImage.startsWith('http')) imageUrl = rawImage
    else if (rawImage.startsWith('/')) imageUrl = `${siteUrl}${rawImage}`
    else if (rawImage) imageUrl = `${siteUrl}/${rawImage}`

    const pathId = pack.slug || pack.id
    return seoPageMetadata({
      title: `${pack.name} | ${SEO_BRAND}`,
      description,
      path: `/packs/${pathId}`,
      locale,
      ogImage: imageUrl,
      keywords: [pack.name, 'pack bijoux', 'cadeau bijoux Maroc', SEO_BRAND],
    })
  } catch {
    try {
      const { locale } = await params
      const t = await getTranslations({ locale, namespace: 'packs.detail' })
      return { title: t('default.title'), description: t('default.description') }
    } catch {
      return { title: 'Pack | INOXYA BIJOUX', description: 'Découvrez nos packs bijoux.' }
    }
  }
}

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const siteUrl = getSiteUrlSafe()
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'packs.detail' })
  const tp = await getTranslations({ locale, namespace: 'packs' })

  const pack = await getPackByIdPublic(id)
  if (!pack) notFound()

  const pathId = pack.slug || pack.id
  const description = stripPackItemsCountMarker(pack.description)
  const itemsCount =
    typeof pack.items_count === 'number' && pack.items_count > 0
      ? pack.items_count
      : extractPackItemsCount(pack.description)

  const pageUrl = `${siteUrl}/${locale}/packs/${pathId}`
  const images = absoluteProductImages(siteUrl, [pack.image_url || ''], `${siteUrl}/images/default-product.jpg`)
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pack.name,
    description:
      description ||
      `${pack.name} — pack bijoux en ${SEO_MATERIAL}, ${SEO_BRAND}, livraison Maroc.`,
    image: images,
    sku: pack.id,
    brand: { '@type': 'Brand', name: SEO_BRAND },
    offers: buildMerchantOffer({ url: pageUrl, price: pack.price, inStock: true }),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-white to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Accueil', url: `${siteUrl}/${locale}` },
          { name: tp('title'), url: `${siteUrl}/${locale}/packs` },
          { name: pack.name, url: pageUrl },
        ]}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <nav className="text-sm text-gray-500 mb-4 flex flex-wrap gap-1">
          <Link href={`/${locale}`} className="hover:text-luxury-gold">
            Accueil
          </Link>
          <span>/</span>
          <Link href={`/${locale}/packs`} className="hover:text-luxury-gold">
            {tp('title')}
          </Link>
          <span>/</span>
          <span className="text-gray-800 truncate max-w-[12rem] sm:max-w-none">{pack.name}</span>
        </nav>

        <Link
          href={`/${locale}/packs`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-luxury-gold transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('backToPacks')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="relative w-full aspect-square max-h-[520px] overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
            <Image
              src={pack.image_url || '/placeholder.svg'}
              alt={pack.name}
              fill
              priority
              quality={90}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain object-center p-4"
            />
            {pack.is_featured && (
              <Badge className="absolute top-4 left-4 bg-luxury-gold text-luxury-black border-0 shadow-md">
                <Crown className="w-3 h-3 mr-1" />
                Vedette
              </Badge>
            )}
          </div>

          <div className="space-y-6 min-w-0">
            <div>
              <Badge variant="outline" className="mb-3 border-gray-300 text-gray-700">
                Pack
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight break-words">
                {pack.name}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4 text-luxury-gold shrink-0" />
                <span>
                  {itemsCount} {itemsCount > 1 ? tp('pieces') : tp('piece')} {tp('inThisPack')}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-luxury-gold tabular-nums">
                {formatMad(pack.price)}
              </span>
              <span className="text-sm text-gray-500">{SEO_CURRENCY}</span>
            </div>

            {description ? (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {description}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-luxury-gold mt-0.5 shrink-0" />
                <span>
                  {t('shipping', { threshold: SEO_FREE_SHIPPING_THRESHOLD })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-luxury-gold mt-0.5 shrink-0" />
                <span>{t('material', { material: SEO_MATERIAL })}</span>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="w-4 h-4 text-luxury-gold mt-0.5 shrink-0" />
                <span>{t('returns', { days: SEO_RETURN_DAYS })}</span>
              </div>
            </div>

            <ShareButton productName={pack.name} productUrl={pageUrl} />

            <div id="commander" className="scroll-mt-24">
              <OrderForm
                productName={pack.name}
                price={pack.price}
                productId={pack.id}
                isPack
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
