import { MetadataRoute } from 'next'
import { seoSiteUrl } from '@/lib/seo/config'

const siteUrl = seoSiteUrl()

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
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: DISALLOW },
      { userAgent: 'GPTBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'Googlebot', allow: '/', disallow: DISALLOW },
      { userAgent: 'Google-Extended', allow: '/', disallow: DISALLOW },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
