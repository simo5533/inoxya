import { NextRequest, NextResponse } from 'next/server'
import { getOrderById, getOrderItems, getPaymentsByOrderId } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { enrichOrderItemsForDisplay } from '@/lib/order-items-display'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }
    const order = await getOrderById(id)
    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    const rawItems = await getOrderItems(id)
    const payments = await getPaymentsByOrderId(id)
    const items = await enrichOrderItemsForDisplay(rawItems)
    return NextResponse.json({ order, items, payments })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
