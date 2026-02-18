// Middleware next-intl - Configuration simple et directe
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Configuration directe recommandée par next-intl
export default createMiddleware(routing)

export const config = {
  // Matcher optimisé pour next-intl avec localePrefix: 'always'
  // Plus restrictif pour éviter de compiler toutes les pages en même temps
  matcher: [
    // Match seulement les routes qui ne sont pas des fichiers statiques ou API
    // Exclure explicitement les fichiers avec extensions
    '/((?!api|_next|_vercel|.*\\.(?:ico|png|jpg|jpeg|svg|webp|woff|woff2|ttf|eot|json|xml|txt|pdf)).*)',
    // Inclure explicitement la racine pour la redirection
    '/',
  ],
}

