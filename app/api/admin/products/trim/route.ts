import { NextRequest, NextResponse } from 'next/server'
import { trimProductsToLimit } from '@/lib/database'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { requireCSRF } from '@/lib/security'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }
    
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    
    const body = await request.json().catch(() => ({}))
    const limit = Number(body?.limit ?? 100)
    const remaining = await trimProductsToLimit(limit)
    if (remaining < 0) return NextResponse.json({ error: 'Échec opération' }, { status: 500 })
    return NextResponse.json({ success: true, remaining })
  } catch (error) {
    logger.error('Erreur POST /api/admin/products/trim:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


