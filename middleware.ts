import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

/** Segments invalides / junk crawlés par Google (&, %26, etc.) */
function isJunkSegment(segment: string | undefined): boolean {
  if (!segment) return false
  const decoded = (() => {
    try {
      return decodeURIComponent(segment)
    } catch {
      return segment
    }
  })()
  if (decoded === '&' || decoded === '%26') return true
  // Un seul caractère non alphanumérique / trop exotique
  if (decoded.length <= 2 && !/^[a-z0-9_-]+$/i.test(decoded)) return true
  if (/^[&?=]+$/.test(decoded)) return true
  return false
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split('/').filter(Boolean)

  // URLs parasites : /&, /%26, /%26/bijoux → 410 Gone (réduit l’indexation junk)
  if (segments.some((s) => isJunkSegment(s))) {
    return new NextResponse('Gone', {
      status: 410,
      headers: {
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }

  // /fr/admin ou /ar/admin → /admin (l’admin n’est pas localisé)
  const adminLocaleMatch = pathname.match(/^\/(fr|ar)\/admin(\/.*)?$/)
  if (adminLocaleMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/admin${adminLocaleMatch[2] || ''}`
    return NextResponse.redirect(url, 308)
  }

  // Fausse locale (ex: /xx/bijoux) → rediriger vers /fr…
  const firstSegment = segments[0]
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
