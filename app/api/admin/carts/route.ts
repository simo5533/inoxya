import { NextRequest, NextResponse } from 'next/server'
import { getAllActiveCarts } from '@/lib/database'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * API pour que l'admin puisse voir tous les paniers actifs
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    const carts = await getAllActiveCarts()
    return NextResponse.json({ carts })
  } catch (error) {
    logger.error('Erreur GET /api/admin/carts:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

