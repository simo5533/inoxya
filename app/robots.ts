import { MetadataRoute } from 'next'
import { getSiteUrlSync } from '@/lib/site-url'

const siteUrl = getSiteUrlSync()

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
