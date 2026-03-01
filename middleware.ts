// Middleware next-intl - Configuration propre pour production
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  try {
    return intlMiddleware(request)
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[middleware]', err)
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next|admin).*)'
  ]
}

