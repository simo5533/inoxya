import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /fr/admin ou /ar/admin → /admin (l’admin n’est pas localisé)
  const adminLocaleMatch = pathname.match(/^\/(fr|ar)\/admin(\/.*)?$/)
  if (adminLocaleMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/admin${adminLocaleMatch[2] || ''}`
    return NextResponse.redirect(url, 308)
  }

  // Fausse locale (ex: /%26/bijoux → locale "&") → rediriger vers /fr
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  if (
    firstSegment &&
    !routing.locales.includes(firstSegment as (typeof routing.locales)[number]) &&
    !firstSegment.startsWith('_') &&
    firstSegment !== 'api' &&
    firstSegment !== 'admin'
  ) {
    const rest = pathname.replace(/^\/[^/]+/, '') || ''
    const url = request.nextUrl.clone()
    url.pathname = `/${routing.defaultLocale}${rest}`
    return NextResponse.redirect(url, 308)
  }

  try {
    return intlMiddleware(request)
  } catch (error) {
    console.error('[Middleware] Erreur next-intl:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
}
