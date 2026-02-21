import { NextRequest, NextResponse } from 'next/server'
import { getOrderById, getOrderItems, getPaymentsByOrderId, getBijouById } from '@/lib/database'
import { getPackById } from '@/lib/pack-management'
import { getCurrentUser } from '@/lib/auth'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

type OrderItemRow = { id: string; order_id?: string; bijou_id?: string; pack_id?: string; quantity: number; price: number }
type EnrichedItem = OrderItemRow & { product_name?: string; pack_name?: string }

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }
    const order = await getOrderById(id)
    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    const rawItems = await getOrderItems(id) as OrderItemRow[]
    const payments = await getPaymentsByOrderId(id)
    const items: EnrichedItem[] = await Promise.all(
      rawItems.map(async (item) => {
        const enriched: EnrichedItem = { ...item }
        if (item.pack_id) {
          try {
            const pack = await getPackById(item.pack_id)
            if (pack) enriched.pack_name = pack.name
          } catch {
            enriched.pack_name = `Pack #${item.pack_id}`
          }
        }
        if (item.bijou_id) {
          try {
            const product = await getBijouById(item.bijou_id)
            if (product) enriched.product_name = product.name
          } catch {
            enriched.product_name = `Produit #${item.bijou_id}`
          }
        }
        return enriched
      })
    )
    return NextResponse.json({ order, items, payments })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
