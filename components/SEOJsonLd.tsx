/**
 * JSON-LD réutilisable — données alignées sur le contenu visible.
 */
import {
  SEO_ADDRESS,
  SEO_BRAND,
  SEO_EMAIL,
  SEO_MATERIAL,
  SEO_PHONE_E164,
  SEO_SLOGAN,
  SEO_FREE_SHIPPING_THRESHOLD,
  SEO_CURRENCY,
  seoSiteUrl,
} from '@/lib/seo/config'
import { BRAND_LOGO, BRAND_LOGO_ICON } from '@/lib/brand'
import {
  absoluteProductImages,
  buildMerchantOffer,
  buildReturnPolicy,
  buildShippingDetails,
} from '@/lib/seo/merchant-offer'
import {
  buildProductStructuredData,
  safeJsonLdString,
} from '@/lib/seo/product-structured-data'

function JsonLdScript({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdString(data) }}
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
        hasMerchantReturnPolicy: buildReturnPolicy(siteUrl),
        shippingDetails: buildShippingDetails({
          siteUrl,
          productPrice: SEO_FREE_SHIPPING_THRESHOLD,
        }),
      }}
    />
  )
}

/** Boutique en ligne — une seule entité liée aux politiques @id */
export function OnlineStoreJsonLd() {
  const siteUrl = seoSiteUrl()
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'OnlineStore',
        '@id': `${siteUrl}/#store`,
        name: 'INOXYA',
        url: siteUrl,
        logo: `${siteUrl}${BRAND_LOGO}`,
        parentOrganization: { '@id': `${siteUrl}/#organization` },
        sameAs: [
          'https://www.instagram.com/inoxya_accesoires',
          'https://www.tiktok.com/@inoxya2',
        ],
        hasMerchantReturnPolicy: { '@id': `${siteUrl}/#return-policy` },
        currenciesAccepted: SEO_CURRENCY,
        paymentAccepted: 'Cash, Cash on Delivery',
        areaServed: { '@type': 'Country', name: 'Morocco' },
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
    seoDescription?: string
    price: number
    image?: string | string[]
    category?: string
    inStock?: boolean
    is_available?: boolean
    is_active?: boolean
    stock?: number | null
    rating?: number
    reviews_count?: number
    gtin?: string | null
  }
  locale?: string
}) {
  const data = buildProductStructuredData(
    {
      id: product.id,
      name: product.name,
      description: product.description,
      seoDescription: product.seoDescription,
      price: product.price,
      image: product.image,
      category: product.category,
      is_available: product.is_available ?? product.inStock,
      is_active: product.is_active,
      stock: product.stock,
      rating: product.rating,
      reviews_count: product.reviews_count,
      gtin: product.gtin,
    },
    locale
  )

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

/** Ensemble Organization + OnlineStore + WebSite pour le layout racine */
export function GlobalSeoJsonLd() {
  return (
    <>
      <OrganizationJsonLd />
      <OnlineStoreJsonLd />
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
