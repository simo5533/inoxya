import { MetadataRoute } from 'next'
import { getSiteUrlSafe } from '@/lib/site-url'

const siteUrl = getSiteUrlSafe()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/temp-uploads/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
