import { NextRequest, NextResponse } from 'next/server'
import { getOrderById } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'

    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Format invalide. Utilisez csv ou pdf' }, { status: 400 })
    }

    // Récupérer la commande
    const order = await getOrderById(id)
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    if (format === 'csv') {
      // Générer le CSV pour une commande spécifique
      const csvHeaders = 'ID,Client,Téléphone,Montant,Statut,Date Création,Adresse\n'
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
      const address = shippingAddress?.address || 'N/A'
      
      const csvRow = `${order.id},"${customerName}","${phone}",${amount},"${status}","${date}","${address}"`
      const csvContent = csvHeaders + csvRow

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="commande_${id}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Pour le PDF ou autre format, on retourne un JSON avec les données détaillées
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
    return NextResponse.json({ 
      success: true, 
      message: 'Export PDF de commande en cours de développement',
      order: {
        id: order.id,
        customer: shippingAddress?.name || 'N/A',
        phone: order.phone || 'N/A',
        address: shippingAddress?.address || 'N/A',
        amount: order.total_amount || 0,
        status: order.status || 'pending',
        date: new Date(order.created_at).toLocaleDateString('fr-FR'),
        items: []
      }
    })

  } catch (error) {
    logger.error('Erreur API export commande individuelle:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
