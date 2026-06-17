// Middleware next-intl — exclut impérativement /_vercel (Analytics, Speed Insights, etc.),
// sinon rewrites i18n cassent MIDDLEWARE_INVOCATION_FAILED sur Vercel.
// Voir: https://next-intl.dev/docs/routing/middleware#matcher-config
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

/** Évite les 500 Vercel sur en-têtes x-middleware-rewrite avec caractères non-ASCII */
function sanitizeRewriteHeader(response: NextResponse): NextResponse {
  const rewrite = response.headers.get('x-middleware-rewrite')
  if (!rewrite) return response

  try {
    const reEncoded = encodeURI(decodeURI(rewrite)).replace(/\+/g, '%20')
    response.headers.set('x-middleware-rewrite', reEncoded)
  } catch {
    // Laisser la réponse telle quelle si l'URL n'est pas décodable
  }
  return response
}

export default function middleware(request: NextRequest) {
  try {
    const response = handleI18nRouting(request)
    return sanitizeRewriteHeader(response)
  } catch (err) {
    console.error('[middleware]', err)
    return NextResponse.next()
  }
}

export const config = {
  // Node.js runtime : évite les crashs Edge (MIDDLEWARE_INVOCATION_FAILED) sur Vercel
  runtime: 'nodejs',
  matcher: [
    // api | trpc | _next | _vercel (interne Vercel) | fichiers avec extension | /admin (sans locale)
    '/((?!api|trpc|_next|_vercel|.*\\..*|admin).*)',
  ],
}
