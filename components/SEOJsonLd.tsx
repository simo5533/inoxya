/**
 * JSON-LD réutilisable — données alignées sur le contenu visible.
 */
import {
  SEO_ADDRESS,
  SEO_BRAND,
  SEO_EMAIL,
  SEO_MATERIAL,
  SEO_PHONE_E164,
  SEO_RETURN_DAYS,
  SEO_SLOGAN,
  SEO_FREE_SHIPPING_THRESHOLD,
  SEO_CURRENCY,
  seoSiteUrl,
} from '@/lib/seo/config'
import { BRAND_LOGO, BRAND_LOGO_ICON } from '@/lib/brand'
import { absoluteProductImages, buildMerchantOffer } from '@/lib/seo/merchant-offer'

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      suppressHydrationWarning
    />
  )
}

export function OrganizationJsonLd() {
  const siteUrl = seoSiteUrl()
  const logoUrl = `${siteUrl}${BRAND_LOGO_ICON}`
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': ['Organization', 'JewelryStore'],
        '@id': `${siteUrl}/#organization`,
        name: SEO_BRAND,
        alternateName: 'INOXYA',
        slogan: SEO_SLOGAN,
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          '@id': `${siteUrl}/#logo`,
          url: logoUrl,
          contentUrl: logoUrl,
          width: 1024,
          height: 1024,
          caption: SEO_BRAND,
        },
        image: [
          logoUrl,
          `${siteUrl}/favicon-192x192.png`,
          `${siteUrl}/icon.png`,
        ],
        description:
          'Boutique marocaine de bijoux en acier inoxydable 316L : bagues, colliers, bracelets, boucles d’oreilles, montres et packs. Livraison Maroc.',
        telephone: SEO_PHONE_E164,
        email: SEO_EMAIL,
        address: {
          '@type': 'PostalAddress',
          streetAddress: SEO_ADDRESS,
          addressLocality: 'Rabat',
          postalCode: '10020',
          addressCountry: 'MA',
        },
        areaServed: { '@type': 'Country', name: 'Morocco' },
        priceRange: '$$',
        sameAs: [
          'https://www.instagram.com/inoxya_accesoires',
          'https://www.tiktok.com/@inoxya2',
        ],
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          '@id': `${siteUrl}/#return-policy`,
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
          '@id': `${siteUrl}/#shipping`,
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
          name: `Livraison Maroc — gratuite dès ${SEO_FREE_SHIPPING_THRESHOLD} MAD`,
        },
      }}
    />
  )
}

export function WebSiteJsonLd() {
  const siteUrl = seoSiteUrl()
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: SEO_BRAND,
        alternateName: 'INOXYA',
        url: siteUrl,
        publisher: { '@id': `${siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/fr/bijoux?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  )
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  )
}

export function FAQPageJsonLd({ items }: { items: Array<{ question: string; answer: string }> }) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }}
    />
  )
}

export function ProductJsonLd({
  product,
  locale = 'fr',
}: {
  product: {
    id: string
    name: string
    description?: string
    price: number
    image?: string | string[]
    category?: string
    inStock?: boolean
    rating?: number
    reviews_count?: number
  }
  locale?: string
}) {
  const siteUrl = seoSiteUrl()
  const url = `${siteUrl}/${locale}/bijoux/${product.id}`
  const fallbackImage = `${siteUrl}${BRAND_LOGO_ICON}`
  const rawImages = product.image
    ? Array.isArray(product.image)
      ? product.image
      : [product.image]
    : []
  // Google Merchant Listings : URLs d’images (pas ImageObject) — format officiel
  const images = absoluteProductImages(siteUrl, rawImages, fallbackImage)

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      product.description ||
      `${product.name} — bijou en ${SEO_MATERIAL}, ${SEO_BRAND}, livraison Maroc.`,
    image: images,
    sku: product.id,
    mpn: product.id,
    brand: { '@type': 'Brand', name: SEO_BRAND },
    material: SEO_MATERIAL,
    offers: buildMerchantOffer({
      url,
      price: product.price,
      inStock: product.inStock,
    }),
  }

  if (product.category) {
    data['category'] = product.category
  }

  if (
    product.rating != null &&
    product.reviews_count != null &&
    product.reviews_count > 0
  ) {
    data['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: String(product.rating),
      reviewCount: String(product.reviews_count),
    }
  }

  return <JsonLdScript data={data} />
}

export function CollectionPageJsonLd({
  name,
  description,
  url,
  items,
}: {
  name: string
  description: string
  url: string
  items: Array<{
    name: string
    url: string
    image?: string
    price?: number
    description?: string
    sku?: string
  }>
}) {
  const siteUrl = seoSiteUrl()
  const fallbackImage = `${siteUrl}${BRAND_LOGO_ICON}`

  const listItems = items.map((item, index) => {
    const images = absoluteProductImages(
      siteUrl,
      item.image ? [item.image] : [],
      fallbackImage
    )
    const productUrl = item.url
    const price = item.price ?? 0

    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `${productUrl}#product`,
        name: item.name,
        description:
          item.description ||
          `${item.name} — bijou en ${SEO_MATERIAL}, ${SEO_BRAND}, livraison Maroc.`,
        image: images,
        sku: item.sku || productUrl.split('/').pop() || item.name,
        mpn: item.sku || productUrl.split('/').pop() || item.name,
        url: productUrl,
        brand: { '@type': 'Brand', name: SEO_BRAND },
        material: SEO_MATERIAL,
        offers: buildMerchantOffer({
          url: productUrl,
          price,
          inStock: true,
        }),
      },
    }
  })

  return (
    <>
      <JsonLdScript
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name,
          description,
          url,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: listItems,
          },
        }}
      />
      <JsonLdScript
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name,
          numberOfItems: listItems.length,
          itemListElement: listItems,
        }}
      />
    </>
  )
}

export function ItemListJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string; position: number }>
}) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: items.map((item) => ({
          '@type': 'ListItem',
          position: item.position,
          name: item.name,
          url: item.url,
        })),
      }}
    />
  )
}

/** Ensemble Organization + WebSite pour le layout racine */
export function GlobalSeoJsonLd() {
  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
    </>
  )
}

export function ArticleJsonLd({
  headline,
  description,
  url,
  image,
  datePublished,
  dateModified,
}: {
  headline: string
  description: string
  url: string
  image?: string
  datePublished: string
  dateModified: string
}) {
  const siteUrl = seoSiteUrl()
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        description,
        url,
        image: image ?? `${siteUrl}${BRAND_LOGO}`,
        datePublished,
        dateModified,
        author: { '@type': 'Organization', name: SEO_BRAND },
        publisher: {
          '@type': 'Organization',
          name: SEO_BRAND,
          logo: { '@type': 'ImageObject', url: `${siteUrl}${BRAND_LOGO}` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      }}
    />
  )
}
