/**
 * Helpers env — évite NODE_ENV avec espace parasite ("production " → production)
 * Ne pas lire de secrets ici.
 */
function getNodeEnv(): string {
  const raw = process.env['NODE_ENV'] ?? ''
  return typeof raw === 'string' ? raw.trim() : ''
}

export const NODE_ENV = getNodeEnv()
export const IS_VERCEL = process.env['VERCEL'] === '1'
export const IS_PRODUCTION = NODE_ENV === 'production' || IS_VERCEL
export const IS_DEVELOPMENT = NODE_ENV === 'development'
