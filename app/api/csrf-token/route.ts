import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFToken } from '@/lib/security'

export const runtime = 'nodejs'

/**
 * GET /api/csrf-token
 * Génère et retourne un token CSRF pour les formulaires
 */
export async function GET(_request: NextRequest) {
  try {
    const token = generateCSRFToken()
    await setCSRFToken(token)
    
    return NextResponse.json({ 
      csrfToken: token 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la génération du token CSRF' },
      { status: 500 }
    )
  }
}

