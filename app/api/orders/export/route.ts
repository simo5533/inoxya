import { NextRequest, NextResponse } from 'next/server'
import { getAllOrders } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Format invalide. Utilisez csv ou pdf' }, { status: 400 })
    }

    // Récupérer toutes les commandes avec détails complets
    const orders = await getAllOrders()
    const { getOrderById } = await import('@/lib/database')
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const fullOrder = await getOrderById(order.id)
        // Type assertion pour inclure shipping_address et phone
        return (fullOrder || order) as { id: string; user_id: string | null; total_amount: number; status: string; created_at: string; shipping_address?: string; phone?: string }
      })
    )
    
    if (format === 'csv') {
      // Générer le CSV
      const csvHeaders = 'ID,Client,Téléphone,Montant,Statut,Date Création\n'
      const csvRows = ordersWithDetails.map(order => {
        // Parser shipping_address si c'est une string JSON
        let shippingAddress: { name?: string; address?: string } | null = null
        if (order.shipping_address) {
          try {
            shippingAddress = typeof order.shipping_address === 'string' 
              ? JSON.parse(order.shipping_address) 
              : order.shipping_address as { name?: string; address?: string }
          } catch {
            shippingAddress = null
          }
        }
        const customerName = shippingAddress?.name || 'N/A'
        const phone = order.phone || 'N/A'
        const amount = order.total_amount || 0
        const status = order.status || 'pending'
        const date = new Date(order.created_at).toLocaleDateString('fr-FR')
        
        return `${order.id},"${customerName}","${phone}",${amount},"${status}","${date}"`
      }).join('\n')

      const csvContent = csvHeaders + csvRows

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="commandes_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Pour le PDF ou autre format, on retourne un JSON avec les données
    return NextResponse.json({ 
      success: true, 
      message: 'Export PDF en cours de développement',
      orders: ordersWithDetails.map(order => {
        // Parser shipping_address si c'est une string JSON
        let shippingAddress: { name?: string; address?: string } | null = null
        if (order.shipping_address) {
          try {
            shippingAddress = typeof order.shipping_address === 'string' 
              ? JSON.parse(order.shipping_address) 
              : order.shipping_address as { name?: string; address?: string }
          } catch {
            shippingAddress = null
          }
        }
        return {
          id: order.id,
          customer: shippingAddress?.name || 'N/A',
          phone: order.phone || 'N/A',
          amount: order.total_amount || 0,
          status: order.status || 'pending',
          date: new Date(order.created_at).toLocaleDateString('fr-FR')
        }
      })
    })

  } catch (error) {
    logger.error('Erreur API export commandes:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
