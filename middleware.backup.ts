// Middleware next-intl - Configuration simple et directe
// EDGE-SAFE: N'importe que des modules compatibles Edge Runtime
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Créer le middleware avec gestion d'erreur robuste
const intlMiddleware = createMiddleware(routing)

// Wrapper avec try/catch pour éviter les crashes et blocages
export default function middleware(request: NextRequest) {
  try {
    // Exécuter le middleware next-intl
    return intlMiddleware(request)
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
