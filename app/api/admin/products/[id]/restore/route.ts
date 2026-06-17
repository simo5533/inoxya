/**
 * Restaurer un produit supprimé (soft delete → is_active = true)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseAdapter } from '@/lib/db'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { requireCSRF, validateProductId } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) return csrfCheck.error

    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    const { id } = await params
    if (!validateProductId(id)) {
      return NextResponse.json({ error: 'ID produit invalide' }, { status: 400 })
    }

    const adapter = await getDatabaseAdapter()
    const updated = await adapter.updateProduct(id, { is_active: true })
    if (!updated) {
      return NextResponse.json(
        { error: 'Impossible de restaurer le produit. Vérifiez qu\'il existe.' },
        { status: 400 }
      )
    }
    logger.info(`[POST /api/admin/products/${id}/restore] Produit ${id} restauré`)
    return NextResponse.json({ success: true, message: 'Produit restauré' })
  } catch (error) {
    logger.error('Erreur POST /api/admin/products/[id]/restore:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
