/**
 * Utilitaire pour obtenir l'URL du site avec fallback intelligent
 * - Utilise NEXT_PUBLIC_SITE_URL si défini (origine seule, sans /fr)
 * - En production Vercel: toujours https://inoxya.ma (évite les URLs preview)
 * - Fallback sur headers de requête si disponible
 */

/** Domaine canonique public (SEO, sitemap, robots, Open Graph). */
export const PRODUCTION_SITE_URL = 'https://inoxya.ma'

function isProductionDeploy(): boolean {
  return (
    process.env['VERCEL_ENV'] === 'production' ||
    (typeof process.env['NODE_ENV'] === 'string' && process.env['NODE_ENV'].trim() === 'production')
  )
}

/** Ne garde que le schéma + host (corrige NEXT_PUBLIC_SITE_URL=.../fr). */
export function normalizeSiteOrigin(raw: string): string {
  const value = raw.trim()
  if (!value) return PRODUCTION_SITE_URL
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    const url = new URL(withProtocol)
    return `${url.protocol}//${url.host}`.replace(/\/$/, '')
  } catch {
    return value.replace(/\/$/, '').split('/').slice(0, 3).join('/') || PRODUCTION_SITE_URL
  }
}

function resolveConfiguredSiteUrl(): string | null {
  const fromEnv = process.env['NEXT_PUBLIC_SITE_URL']
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    const origin = normalizeSiteOrigin(fromEnv)
    // Preview Vercel.app ne doit jamais être le domaine SEO en production
    if (isProductionDeploy() && origin.includes('.vercel.app')) {
      return PRODUCTION_SITE_URL
    }
    if (origin.includes('inoxya.ma')) return PRODUCTION_SITE_URL
    return origin
  }
  return null
}

/**
 * Obtient l'URL du site depuis l'environnement ou les headers
 * @param request - Request Next.js (optionnel, pour fallback sur headers)
 * @returns URL du site (sans trailing slash)
 */
export function getSiteUrl(request?: Request): string {
  const configured = resolveConfiguredSiteUrl()
  if (configured) return configured

  if (isProductionDeploy()) {
    return PRODUCTION_SITE_URL
  }

  const productionUrl = process.env['VERCEL_PROJECT_PRODUCTION_URL']
  if (productionUrl && typeof productionUrl === 'string') {
    return normalizeSiteOrigin(productionUrl)
  }

  const vercelUrl = process.env['VERCEL_URL']
  if (vercelUrl && typeof vercelUrl === 'string') {
    return normalizeSiteOrigin(`https://${vercelUrl}`)
  }

  if (request) {
    const protocol =
      request.headers.get('x-forwarded-proto') ||
      (request.url.startsWith('https') ? 'https' : 'http')
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')

    if (host) {
      return normalizeSiteOrigin(`${protocol}://${host}`)
    }
  }

  const port = process.env['PORT'] || process.env['NEXT_PUBLIC_PORT'] || '3000'
  return `http://localhost:${port}`
}

/**
 * Obtient l'URL du site de manière synchrone (sans request)
 */
export function getSiteUrlSync(): string {
  const configured = resolveConfiguredSiteUrl()
  if (configured) return configured

  if (isProductionDeploy()) {
    return PRODUCTION_SITE_URL
  }

  const productionUrl = process.env['VERCEL_PROJECT_PRODUCTION_URL']
  if (productionUrl && typeof productionUrl === 'string') {
    return normalizeSiteOrigin(productionUrl)
  }

  const vercelUrl = process.env['VERCEL_URL']
  if (vercelUrl && typeof vercelUrl === 'string') {
    return normalizeSiteOrigin(`https://${vercelUrl}`)
  }

  const port = process.env['PORT'] || process.env['NEXT_PUBLIC_PORT'] || '3000'
  return `http://localhost:${port}`
}

/**
 * Version sécurisée qui ne lance jamais : à utiliser dans les Server Components
 * (generateMetadata, pages) pour éviter les 500 en prod (Vercel).
 */
export function getSiteUrlSafe(): string {
  try {
    const url = getSiteUrlSync()
    if (url && typeof url === 'string') return url.trim() || PRODUCTION_SITE_URL
    return PRODUCTION_SITE_URL
  } catch {
    try {
      const env = process.env['NEXT_PUBLIC_SITE_URL']
      if (env && typeof env === 'string') {
        return normalizeSiteOrigin(env) || PRODUCTION_SITE_URL
      }
    } catch {
      /* ignore */
    }
    return PRODUCTION_SITE_URL
  }
}
