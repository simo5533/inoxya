import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

/**
 * API route pour récupérer l'utilisateur actuel
 * Utilisé par les composants client (Header, etc.)
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    logger.error('Erreur API /api/auth/me', error)
    return NextResponse.json(
      { error: 'Erreur serveur', user: null },
      { status: 500 }
    )
  }
}

