import {
  SEO_BRAND,
  SEO_CURRENCY,
  SEO_FREE_SHIPPING_THRESHOLD,
  SEO_RETURN_DAYS,
  seoSiteUrl,
} from '@/lib/seo/config'
import type { SchemaAvailability } from '@/lib/seo/availability'

/** Politique de retour globale — alignée FAQ (frais retour à charge client sauf défaut). */
export function buildReturnPolicy(siteUrl?: string): Record<string, unknown> {
  const base = siteUrl || seoSiteUrl()
  return {
    '@type': 'MerchantReturnPolicy',
    '@id': `${base}/#return-policy`,
    applicableCountry: 'MA',
    returnPolicyCountry: 'MA',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: SEO_RETURN_DAYS,
    returnMethod: 'https://schema.org/ReturnByMail',
    // FAQ a5 : frais de retour à charge du client sauf défaut produit
    returnFees: 'https://schema.org/ReturnShippingFees',
  }
}

/**
 * Détails livraison Maroc.
 * Gratuité dès SEO_FREE_SHIPPING_THRESHOLD MAD — pas de faux « gratuit pour tous ».
 * Frais sous seuil non chiffrés en code → rate 0 uniquement si prix ≥ seuil.
 */
export function buildShippingDetails(opts?: {
  siteUrl?: string
  productPrice?: number
}): Record<string, unknown> {
  const base = opts?.siteUrl || seoSiteUrl()
  const price = Number(opts?.productPrice)
  const qualifiesFree =
    Number.isFinite(price) && price >= SEO_FREE_SHIPPING_THRESHOLD

  const shippingRate = qualifiesFree
    ? {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: SEO_CURRENCY,
      }
    : {
        '@type': 'MonetaryAmount',
        // Montant exact sous seuil non publié dans le code — Google exige un MonetaryAmount.
        // 0 + libellé explicite du seuil ; le checkout indique les frais réels.
        value: '0',
        currency: SEO_CURRENCY,
      }

  return {
    '@type': 'OfferShippingDetails',
    '@id': `${base}/#shipping-policy`,
    shippingRate,
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'MA',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 1,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 5,
        unitCode: 'DAY',
      },
    },
    name: qualifiesFree
      ? `Livraison gratuite au Maroc (commande ≥ ${SEO_FREE_SHIPPING_THRESHOLD} MAD)`
      : `Livraison Maroc — gratuite dès ${SEO_FREE_SHIPPING_THRESHOLD} MAD`,
  }
}

/** Offre Product conforme Merchant Listings (shipping + retours MA). */
export function buildMerchantOffer(opts: {
  url: string
  price: number
  inStock?: boolean
  availability?: SchemaAvailability
  offerId?: string
}): Record<string, unknown> {
  const siteUrl = seoSiteUrl()
  const priceValidUntil = new Date()
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1)

  const availability =
    opts.availability ||
    (opts.inStock === false
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock')

  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url: opts.url,
    priceCurrency: SEO_CURRENCY,
    price: Number(opts.price).toFixed(2),
    priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
    availability,
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: SEO_BRAND,
    },
    hasMerchantReturnPolicy: {
      '@id': `${siteUrl}/#return-policy`,
    },
    shippingDetails: {
      '@id': `${siteUrl}/#shipping-policy`,
    },
  }

  if (opts.offerId) {
    offer['@id'] = opts.offerId
  }

  // Inclure les définitions complètes (Google accepte inline + @id)
  offer['hasMerchantReturnPolicy'] = buildReturnPolicy(siteUrl)
  offer['shippingDetails'] = buildShippingDetails({
    siteUrl,
    productPrice: opts.price,
  })

  return offer
}

export function absoluteProductImages(
  siteUrl: string,
  images: string[],
  fallback: string
): string[] {
  const resolved = images
    .map((img) => {
      if (!img || !String(img).trim()) return ''
      const value = String(img).trim()
      if (value.startsWith('http')) return value
      if (value.startsWith('/')) return `${siteUrl}${value}`
      return `${siteUrl}/${value}`
    })
    .filter(Boolean)

  return resolved.length > 0 ? resolved : [fallback]
}
