import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/csrf-token
 * Génère et retourne un token CSRF pour les formulaires
 */
export async function GET(_request: NextRequest) {
  try {
    const token = randomUUID()
    const response = NextResponse.json(
      {
        // compat: la majorité du code lit csrfToken
        csrfToken: token,
        // compat additionnelle éventuelle
        token,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    )

    // Cookie serveur utilisé par requireCSRF (lib/security.ts)
    response.cookies.set('csrf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    // Cookie lisible client (debug/interop); ne remplace pas le cookie serveur
    response.cookies.set('csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    
    return response
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la génération du token CSRF' },
      { status: 500 }
    )
  }
}

