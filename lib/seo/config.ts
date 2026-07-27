import { getSiteUrlSafe } from '@/lib/site-url'
import { BRAND_LOGO } from '@/lib/brand'

export const SEO_BRAND = 'INOXYA BIJOUX'
export const SEO_SLOGAN = 'Embellie ton âme'
export const SEO_PHONE = '07 17 58 19 40'
export const SEO_PHONE_E164 = '+212717581940'
export const SEO_EMAIL = 'inoxya@gmail.ma'
export const SEO_ADDRESS =
  'Avenue, Rue Ziri Ibn Aatia, Rabat 10020, Maroc'
export const SEO_COUNTRY = 'Maroc'
export const SEO_CURRENCY = 'MAD'
export const SEO_MATERIAL = 'Acier inoxydable 316L'
export const SEO_FREE_SHIPPING_THRESHOLD = 200
export const SEO_RETURN_DAYS = 30

export const SEO_LOCALES = ['fr', 'ar'] as const
export type SeoLocale = (typeof SEO_LOCALES)[number]

export function seoSiteUrl(): string {
  return getSiteUrlSafe()
}

export function seoLocalePath(locale: string, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${seoSiteUrl()}/${locale}${clean === '/' ? '' : clean}`
}

export function seoAlternates(
  path: string,
  locale?: string
): { canonical: string; languages: Record<string, string> } {
  const base = seoSiteUrl()
  const clean = path.startsWith('/') ? path : `/${path}`
  const loc = locale === 'ar' ? 'ar' : 'fr'
  const frUrl = `${base}/fr${clean}`
  const arUrl = `${base}/ar${clean}`
  return {
    // Canonical auto-référent par langue
    canonical: `${base}/${loc}${clean}`,
    languages: {
      'fr-MA': frUrl,
      fr: frUrl,
      'ar-MA': arUrl,
      ar: arUrl,
      'x-default': frUrl,
    },
  }
}

export function seoPageMetadata(opts: {
  title: string
  description: string
  path: string
  locale?: string
  keywords?: string[]
  ogImage?: string
  noindex?: boolean
  ogType?: 'website' | 'article'
}): import('next').Metadata {
  const siteUrl = seoSiteUrl()
  const locale = opts.locale ?? 'fr'
  const path = opts.path.startsWith('/') ? opts.path : `/${opts.path}`
  const url = `${siteUrl}/${locale}${path}`
  const alt = seoAlternates(path, locale)
  const image = opts.ogImage ?? `${siteUrl}${BRAND_LOGO}`

  return {
    metadataBase: new URL(siteUrl),
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SEO_BRAND,
      locale: locale === 'ar' ? 'ar_MA' : 'fr_FR',
      type: opts.ogType ?? 'website',
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [image],
    },
    alternates: {
      canonical: alt.canonical,
      languages: alt.languages,
    },
    robots: opts.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}
