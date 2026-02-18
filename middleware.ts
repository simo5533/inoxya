// Middleware next-intl - Configuration simple et directe
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Configuration directe recommandée par next-intl
export default createMiddleware(routing)

export const config = {
  // Matcher compatible avec next-intl
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}

