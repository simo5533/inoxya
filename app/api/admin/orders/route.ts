import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { getDatabaseAdapter } from '@/lib/db'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApi()
  if ('error' in auth) {
    return auth.error
  }

  try {
    const db = await getDatabaseAdapter()
    const orders = await db.getOrders()
    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    logger.error('[GET /api/admin/orders] Erreur serveur', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

