import { NextRequest, NextResponse } from 'next/server'
import { getAllPayments, getOrderById, getPaymentsByOrderId, createPayment, createNotification } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { renderPaymentEmail, sendAdminEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { createPaymentSchema, validateWithSchema } from '@/lib/validations'
import { requireCSRF } from '@/lib/security'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const payments = await getAllPayments()
    return NextResponse.json({ payments })

  } catch (error) {
    logger.error('Erreur API paiements GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    // SÉCURITÉ: Vérifier l'authentification admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      logger.warn('[SECURITY] Tentative création paiement sans auth admin')
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(createPaymentSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    const { order_id, payment_method, transaction_id } = validation.data

    // Vérifier que la commande existe
    const order = await getOrderById(String(order_id))
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // SÉCURITÉ: Utiliser le montant de la commande, PAS celui du client
    const amount = order.total_amount
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant commande invalide' }, { status: 400 })
    }

    // SÉCURITÉ: Vérifier qu'il n'y a pas déjà un paiement complété pour cette commande
    const orderIdStr = String(order_id)
    const existingPayments = await getPaymentsByOrderId(orderIdStr)
    const hasCompletedPayment = existingPayments.some(p => p.status === 'completed')
    if (hasCompletedPayment) {
      return NextResponse.json({ error: 'Cette commande a déjà été payée' }, { status: 400 })
    }

    // Créer le paiement avec montant vérifié
    const payment = await createPayment({
      order_id: orderIdStr,
      amount: parseFloat(String(amount)),
      method: payment_method,
      status: 'pending',
      transaction_id: transaction_id || undefined
    })
    
    if (!payment) {
      return NextResponse.json({ 
        error: 'Erreur lors de la création du paiement' 
      }, { status: 500 })
    }

    // Notifier l'admin par email (silencieux si non configuré)
    try {
      await sendAdminEmail(
        `Nouveau paiement - Commande ${orderIdStr}`,
        renderPaymentEmail({
          orderId: orderIdStr,
          amount: payment.amount,
          method: payment.payment_method,
          orderStatus: typeof order.status === 'string' ? order.status : payment.status,
          transactionId: payment.transaction_id || null
        })
      )
    } catch (e) {
      logger.warn('Notification admin email échouée:', { error: e instanceof Error ? e.message : String(e) })
    }

    // Créer une notification en base pour l'admin
    try {
      await createNotification({
        user_id: null,
        title: 'Nouveau paiement',
        message: `Commande ${orderIdStr} - ${amount} MAD - ${payment_method}`,
        type: 'success',
        link: `/admin/paiements/${payment.id}`
      })
    } catch (e) {
      logger.warn('Création notification admin échouée:', { error: e instanceof Error ? e.message : String(e) })
    }

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      message: 'Paiement créé avec succès'
    })

  } catch (error) {
    logger.error('Erreur API paiements POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
