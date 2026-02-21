import { NextRequest, NextResponse } from 'next/server'
import { getOrderById } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { requireCSRF } from '@/lib/security'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) return csrfCheck.error

    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      order_id, 
      customer_info, 
      items, 
      total_amount 
    } = body

    // Validation des données
    if (!order_id || !customer_info || !items || !total_amount) {
      return NextResponse.json({ 
        error: 'Données de facture incomplètes' 
      }, { status: 400 })
    }

    // Vérifier que la commande existe
    const order = await getOrderById(order_id)
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Générer un ID de facture unique
    const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Créer les données de la facture
    const invoiceData = {
      invoice_id: invoiceId,
      order_id: order_id,
      customer_info: customer_info,
      items: items,
      total_amount: parseFloat(total_amount),
      status: 'generated',
      created_at: new Date().toISOString(),
      created_by: user.id
    }

    // Pour l'instant, on retourne les données de la facture
    // L'implémentation complète nécessiterait une base de données pour stocker les factures
    logger.info('Facture générée:', invoiceData)

    return NextResponse.json({ 
      success: true, 
      invoice_id: invoiceId,
      invoice: invoiceData,
      message: 'Facture générée avec succès' 
    })

  } catch (error) {
    logger.error('Erreur API génération facture:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
