import { NextRequest, NextResponse } from 'next/server'
import { markNotificationAsRead, updateOrderStatus } from '@/lib/database'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SÉCURITÉ: Validation CSRF
    const { requireCSRF } = await import('@/lib/security')
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    // SÉCURITÉ: Vérifier les permissions admin
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    
    const { id } = await params
    let body: { orderId?: string } = {}
    try {
      body = await request.json()
    } catch {
      // body optionnel
    }
    const orderId = body.orderId && String(body.orderId).trim() ? String(body.orderId).trim() : null

    const ok = await markNotificationAsRead(id)
    if (!ok) return NextResponse.json({ error: 'Mise à jour échouée' }, { status: 500 })

    if (orderId) {
      try {
        const updated = await updateOrderStatus(orderId, 'confirmed')
        if (updated) logger.info('[notifications/read] Commande confirmée', { orderId })
      } catch (e) {
        logger.warn('[notifications/read] Erreur confirmation commande (non bloquant)', { orderId, error: e })
      }
    }
    return NextResponse.json({ success: true, orderConfirmed: !!orderId })
  } catch (error) {
    logger.error('Erreur POST /api/admin/notifications/[id]/read:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
