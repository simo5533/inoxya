// Middleware next-intl — exclut impérativement /_vercel (Analytics, Speed Insights, etc.),
// sinon rewrites i18n cassent MIDDLEWARE_INVOCATION_FAILED sur Vercel.
// Voir: https://next-intl.dev/docs/routing/middleware#matcher-config
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  try {
    return intlMiddleware(request)
  } catch (err) {
    console.error('[middleware]', err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // api | trpc | _next | _vercel (interne Vercel) | fichiers avec extension | /admin (sans locale)
    '/((?!api|trpc|_next|_vercel|.*\\..*|admin).*)',
  ],
}

