import { NextRequest, NextResponse } from 'next/server'
import { markNotificationAsRead } from '@/lib/database'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    
    const { id } = await params
    const ok = await markNotificationAsRead(id)
    if (!ok) return NextResponse.json({ error: 'Mise à jour échouée' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur POST /api/admin/notifications/[id]/read:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
