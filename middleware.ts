// Redirect i18n léger — sans next-intl/middleware (crash MIDDLEWARE_INVOCATION_FAILED sur Vercel).
// La locale est lue depuis le segment [locale] ; NextIntlClientProvider est dans app/[locale]/layout.tsx.
import { NextRequest, NextResponse } from 'next/server'

const locales = ['fr', 'ar'] as const
const defaultLocale = 'fr'

function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathnameHasLocale(pathname)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    // api | trpc | _next | _vercel | routes de test | fichiers | admin (sans locale)
    '/((?!api|trpc|_next|_vercel|test-simple|.*\\..*|admin).*)',
  ],
}
