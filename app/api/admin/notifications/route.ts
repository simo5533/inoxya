import { NextRequest, NextResponse } from 'next/server'
import { getNotifications } from '@/lib/database'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    
    const notifications = await getNotifications(null) // null = notifications admin (user_id IS NULL)
    return NextResponse.json({ notifications })
  } catch (error) {
    logger.error('Erreur GET /api/admin/notifications:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
