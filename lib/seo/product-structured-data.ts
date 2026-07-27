/**
 * Construction JSON-LD Product typée pour Merchant Listings / Search.
 * Données réelles uniquement — aucun faux GTIN, aucun avis inventé.
 */
import { SEO_BRAND, SEO_MATERIAL, SEO_CURRENCY, seoSiteUrl } from '@/lib/seo/config'
import { BRAND_LOGO_ICON } from '@/lib/brand'
import { absoluteProductImages, buildMerchantOffer } from '@/lib/seo/merchant-offer'
import {
  getSchemaAvailability,
  type AvailabilityProductInput,
} from '@/lib/seo/availability'

export type ProductStructuredDataInput = AvailabilityProductInput & {
  id: string
  name: string
  /** Description réelle du produit (prioritaire) */
  description?: string | null
  /** Description SEO de secours si description vide */
  seoDescription?: string | null
  price: number
  image?: string | string[] | null
  category?: string | null
  /** GTIN réel uniquement (jamais inventé) */
  gtin?: string | null
  sku?: string | null
  mpn?: string | null
  rating?: number | null
  reviews_count?: number | null
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function cleanDescription(
  name: string,
  description?: string | null,
  seoDescription?: string | null
): string {
  const raw = (description && stripHtml(description)) || (seoDescription && stripHtml(seoDescription)) || ''
  if (raw.length >= 20) return raw.slice(0, 5000)
  return `${name} — bijou en ${SEO_MATERIAL}, ${SEO_BRAND}, livraison Maroc.`
}

function resolveGtinField(gtin: string): Record<string, string> {
  const digits = gtin.replace(/\D/g, '')
  if (digits.length === 8) return { gtin8: digits }
  if (digits.length === 12) return { gtin12: digits }
  if (digits.length === 13) return { gtin13: digits }
  if (digits.length === 14) return { gtin14: digits }
  return {}
}

/**
 * Sérialise le JSON-LD sans risque XSS (`</script>`).
 */
export function safeJsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/**
 * Construit un objet Product Schema.org valide pour une locale.
 */
export function buildProductStructuredData(
  product: ProductStructuredDataInput,
  locale: string,
  canonicalUrl?: string
): Record<string, unknown> {
  const siteUrl = seoSiteUrl()
  const loc = locale === 'ar' ? 'ar' : 'fr'
  const url =
    canonicalUrl ||
    `${siteUrl}/${loc}/bijoux/${encodeURIComponent(String(product.id))}`
  const fallbackImage = `${siteUrl}${BRAND_LOGO_ICON}`
  const rawImages = product.image
    ? Array.isArray(product.image)
      ? product.image
      : [product.image]
    : []
  const images = absoluteProductImages(siteUrl, rawImages.filter(Boolean) as string[], fallbackImage)

  const sku = String(product.sku || product.id).trim() || String(product.id)
  const availability = getSchemaAvailability(product)
  const price = Number(product.price)
  const safePrice = Number.isFinite(price) && price >= 0 ? price : 0

  const description = cleanDescription(product.name, product.description, product.seoDescription)

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description,
    image: images,
    url,
    sku,
    brand: {
      '@type': 'Brand',
      name: SEO_BRAND,
    },
    material: SEO_MATERIAL,
    offers: buildMerchantOffer({
      url,
      price: safePrice,
      availability,
      offerId: `${url}#offer`,
    }),
  }

  // MPN uniquement si distinct ou pas de GTIN — id produit crédible comme réf. fabricant interne
  if (product.mpn && String(product.mpn).trim()) {
    data['mpn'] = String(product.mpn).trim()
  } else if (!product.gtin) {
    data['mpn'] = sku
  }

  if (product.gtin && String(product.gtin).trim()) {
    Object.assign(data, resolveGtinField(String(product.gtin).trim()))
  }

  if (product.category) {
    data['category'] = product.category
  }

  const reviewsCount = Number(product.reviews_count) || 0
  const ratingValue = Number(product.rating)
  if (
    reviewsCount > 0 &&
    Number.isFinite(ratingValue) &&
    ratingValue >= 1 &&
    ratingValue <= 5
  ) {
    data['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: String(Math.round(ratingValue * 10) / 10),
      reviewCount: String(reviewsCount),
      bestRating: '5',
      worstRating: '1',
    }
  }

  return data
}

export { SEO_CURRENCY }
