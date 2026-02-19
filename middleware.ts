// Middleware next-intl - Configuration avec protection robuste
// EDGE-SAFE: N'importe que des modules compatibles Edge Runtime
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// OPTION: Désactiver complètement le middleware pour diagnostic
// Mettre DISABLE_MIDDLEWARE=1 dans .env.local pour désactiver
const DISABLE_MIDDLEWARE = process.env['DISABLE_MIDDLEWARE'] === '1'

// Créer le middleware avec gestion d'erreur robuste
let intlMiddleware: ((request: NextRequest) => NextResponse | Promise<NextResponse>) | null = null

if (!DISABLE_MIDDLEWARE) {
  try {
    intlMiddleware = createMiddleware(routing)
  } catch (error) {
    console.error('[Middleware] Erreur lors de la création du middleware next-intl:', error)
    // Si la création échoue, on utilisera un fallback
  }
} else {
  console.warn('[Middleware] ⚠️ Middleware DÉSACTIVÉ (DISABLE_MIDDLEWARE=1) - Mode diagnostic')
}

// Wrapper avec try/catch pour éviter les crashes et blocages
export default function middleware(request: NextRequest) {
  // Si le middleware est désactivé, bypass complet
  if (DISABLE_MIDDLEWARE) {
    return NextResponse.next()
  }
  
  // Si le middleware next-intl n'a pas pu être créé, passer directement
  if (!intlMiddleware) {
    console.warn('[Middleware] intlMiddleware non disponible, bypass')
    return NextResponse.next()
  }

  // Exclure explicitement les routes API du middleware
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  try {
    // Exécuter le middleware next-intl
    const response = intlMiddleware(request)
    // Si c'est une Promise, la retourner directement
    if (response instanceof Promise) {
      return response.catch((error) => {
        console.error('[Middleware] Erreur dans next-intl middleware (async):', error)
        return NextResponse.next()
      })
    }
    return response
  } catch (error) {
    // En cas d'erreur, logger et continuer avec la requête originale
    // Ne pas bloquer la requête même si le middleware échoue
    console.error('[Middleware] Erreur dans next-intl middleware:', error)
    
    // Fallback: retourner la requête sans modification
    // Cela évite de bloquer complètement l'application
    return NextResponse.next()
  }
}

export const config = {
  // OPTIMISATION: Matcher très restrictif - exclure explicitement les APIs
  // Le middleware next-intl ne doit PAS traiter les routes /api/*
  // Cela évite les blocages sur les requêtes API
  matcher: [
    // Exclure explicitement:
    // - /api/* (routes API - CRITIQUE pour éviter les blocages)
    // - /_next/* (fichiers Next.js internes)
    // - /_vercel/* (Vercel)
    // - Fichiers avec extensions (images, fonts, JSON, etc.)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}

