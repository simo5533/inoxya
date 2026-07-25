/**
 * Composant pour ajouter des données structurées JSON-LD
 * Améliore le SEO et l'affichage dans les résultats de recherche
 */

interface OrganizationSchema {
  '@context': string
  '@type': string | string[]
  name: string
  url: string
  logo?: string
  description?: string
  contactPoint?: {
    '@type': string
    telephone?: string
    contactType: string
    areaServed: string
    availableLanguage: string
    email?: string
  }
  address?: {
    '@type': string
    addressLocality: string
    addressRegion: string
    addressCountry: string
    streetAddress: string
  }
  geo?: {
    '@type': string
    latitude: number
    longitude: number
  }
  sameAs?: string[]
}

interface ProductSchema {
  '@context': string
  '@type': string
  name: string
  description?: string
  image?: string | string[]
  sku?: string
  brand?: {
    '@type': string
    name: string
  }
  offers?: {
    '@type': string
    priceCurrency: string
    price: string
    availability: string
    url: string
  }
  aggregateRating?: {
    '@type': string
    ratingValue: string
    reviewCount: string
  }
}

interface BreadcrumbSchema {
  '@context': string
  '@type': string
  itemListElement: Array<{
    '@type': string
    position: number
    name: string
    item: string
  }>
}

/**
 * Schema Organization pour toutes les pages
 */
export function OrganizationSchema({ siteUrl }: { siteUrl: string }) {
  // Coordonnées GPS approximatives pour Rabat, Bab Melah
  const latitude = 34.0209
  const longitude = -6.8324

  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    name: 'INOXYA BIJOUX',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description: 'Bijoux en acier inoxydable de qualité premium. Durables, hypoallergéniques et élégants. Collection berbère authentique.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+212-7-17-58-19-40',
      contactType: 'Customer Service',
      areaServed: 'MA',
      availableLanguage: 'fr,ar',
      email: 'inoxya@gmail.ma',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rabat',
      addressRegion: 'Rabat-Salé-Kénitra',
      addressCountry: 'MA',
      streetAddress: 'Bab Melah — Solde Reda, étage en bas',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude,
      longitude,
    },
    sameAs: [
      'https://www.instagram.com/inoxya_accesoires',
      'https://www.tiktok.com/@inoxya2',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  )
}

/**
 * Schema Product pour les pages produits
 */
export function ProductSchema({
  product,
  siteUrl,
}: {
  product: {
    id: string
    name: string
    description?: string
    price: number
    main_image?: string
    images?: string[]
    rating?: number
    reviews_count?: number
  }
  siteUrl: string
}) {
  const images = product.main_image
    ? [product.main_image, ...(product.images || [])].filter(Boolean)
    : product.images || []

  const resolvedImages =
    images.length > 0
      ? images.map((img) =>
          img.startsWith('http') ? img : `${siteUrl}${img.startsWith('/') ? img : `/${img}`}`
        )
      : [`${siteUrl}/logo-inoxya-icon.png`]

  const schema: ProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Bijou en acier inoxydable premium`,
    image: resolvedImages,
    brand: {
      '@type': 'Brand',
      name: 'INOXYA BIJOUX',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'MAD',
      price: product.price.toString(),
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/bijoux/${product.id}`,
    },
  }

  if (product.rating && product.reviews_count) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toString(),
      reviewCount: product.reviews_count.toString(),
    }
  }

  // Ajouter SKU si disponible
  if (product.id) {
    schema.sku = product.id
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  )
}

/**
 * Schema BreadcrumbList pour navigation
 */
export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; url: string }>
}) {
  const schema: BreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  )
}

