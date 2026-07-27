import {
  SEO_BRAND,
  SEO_CURRENCY,
  SEO_FREE_SHIPPING_THRESHOLD,
  SEO_RETURN_DAYS,
} from '@/lib/seo/config'

/** Offre Product conforme aux fiches marchand Google (shipping + retours MA). */
export function buildMerchantOffer(opts: {
  url: string
  price: number
  inStock?: boolean
}): Record<string, unknown> {
  const priceValidUntil = new Date()
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1)

  return {
    '@type': 'Offer',
    url: opts.url,
    priceCurrency: SEO_CURRENCY,
    price: Number(opts.price).toFixed(2),
    priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
    availability:
      opts.inStock === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: SEO_BRAND,
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'MA',
      returnPolicyCountry: 'MA',
      returnPolicyCategory:
        'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: SEO_RETURN_DAYS,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: '0',
        currency: SEO_CURRENCY,
      },
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
      // Aligné avec la promesse visible du site
      name: `Livraison Maroc — gratuite dès ${SEO_FREE_SHIPPING_THRESHOLD} MAD`,
    },
  }
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
