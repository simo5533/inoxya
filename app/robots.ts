import { MetadataRoute } from 'next'
import { PRODUCTION_SITE_URL } from '@/lib/site-url'

const siteUrl = PRODUCTION_SITE_URL

/**
 * /api/ bloqué sauf /api/shop-blob (images produits publiques pour Googlebot Images).
 * Les autres routes API restent protégées.
 */
const DISALLOW = [
  '/admin/',
  '/api/',
  '/_next/',
  '/temp-uploads/',
  '/fr/panier',
  '/fr/panier/checkout',
  '/fr/login',
  '/fr/inscription',
  '/fr/favoris',
  '/fr/mot-de-passe-oublie',
  '/ar/panier',
  '/ar/panier/checkout',
  '/ar/login',
  '/ar/inscription',
  '/ar/favoris',
  '/ar/mot-de-passe-oublie',
  // URLs junk historiques (GSC)
  '/&',
  '/%26',
  '/%26/',
]

const ALLOW_EXCEPTIONS = ['/api/shop-blob']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', ...ALLOW_EXCEPTIONS],
        disallow: DISALLOW,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', ...ALLOW_EXCEPTIONS],
        disallow: DISALLOW,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/', ...ALLOW_EXCEPTIONS],
        disallow: DISALLOW,
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: ['/', ...ALLOW_EXCEPTIONS],
        disallow: DISALLOW,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', ...ALLOW_EXCEPTIONS],
        disallow: DISALLOW,
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', ...ALLOW_EXCEPTIONS],
        disallow: DISALLOW,
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', ...ALLOW_EXCEPTIONS],
        disallow: DISALLOW,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
