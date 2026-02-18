/**
 * Utilitaire pour obtenir l'URL du site avec fallback intelligent
 * - Utilise NEXT_PUBLIC_SITE_URL si défini
 * - Fallback sur headers de requête (host + protocol) si disponible
 * - Fallback final sur placeholder (pour développement/preview)
 */

/**
 * Obtient l'URL du site depuis l'environnement ou les headers
 * @param request - Request Next.js (optionnel, pour fallback sur headers)
 * @returns URL du site (sans trailing slash)
 */
export function getSiteUrl(request?: Request): string {
  // 1. Priorité: NEXT_PUBLIC_SITE_URL (défini par l'utilisateur)
  if (process.env['NEXT_PUBLIC_SITE_URL']) {
    return process.env['NEXT_PUBLIC_SITE_URL'].replace(/\/$/, '')
  }

  // 2. Fallback: Headers de requête (si disponible)
  if (request) {
    const protocol = request.headers.get('x-forwarded-proto') || 
                     (request.url.startsWith('https') ? 'https' : 'http')
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    
    if (host) {
      return `${protocol}://${host}`
    }
  }

  // 3. Fallback final: Placeholder (pour dev/preview)
  // En production, ceci ne devrait jamais être utilisé car NEXT_PUBLIC_SITE_URL sera défini
  const isProduction = process.env['NODE_ENV'] === 'production'
  if (isProduction) {
    // En production, utiliser un placeholder générique
    // L'utilisateur devra définir NEXT_PUBLIC_SITE_URL
    return 'https://your-domain.vercel.app'
  }

  // En développement, localhost
  return 'http://localhost:3000'
}

/**
 * Obtient l'URL du site de manière synchrone (sans request)
 * Utilise uniquement NEXT_PUBLIC_SITE_URL ou placeholder
 */
export function getSiteUrlSync(): string {
  if (process.env['NEXT_PUBLIC_SITE_URL']) {
    return process.env['NEXT_PUBLIC_SITE_URL'].replace(/\/$/, '')
  }

  const isProduction = process.env['NODE_ENV'] === 'production'
  if (isProduction) {
    return 'https://your-domain.vercel.app'
  }

  return 'http://localhost:3000'
}

