import { NextRequest, NextResponse } from 'next/server'
import { getBijouById, createOrderFull } from '@/lib/database'
import { getPackById } from '@/lib/pack-management'
import { sendAdminEmail, renderPaymentEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { checkRateLimit, sanitizeInput, requireCSRF } from '@/lib/security'
import { checkoutSchema, validateWithSchema } from '@/lib/validations'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }
    
    // Rate limiting pour prévenir les abus
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const rateCheck = await checkRateLimit(`checkout_${clientIP}`)
    if (!rateCheck.allowed) {
      logger.warn(`[SECURITY] Checkout rate limit triggered for IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Trop de commandes. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(checkoutSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }

    const validatedData = validation.data
    
    // SÉCURITÉ: Sanitization des entrées (après validation Zod)
    const sanitizedPhone = sanitizeInput(validatedData.phone)
    const sanitizedCity = sanitizeInput(validatedData.city)
    const sanitizedAddress = sanitizeInput(validatedData.address)
    const sanitizedCustomerName = validatedData.customer_name ? sanitizeInput(validatedData.customer_name) : null
    
    // SÉCURITÉ CRITIQUE: Vérifier les prix depuis la base de données, PAS depuis le client
    let total = 0
    const verifiedItems: { id: string; price: number; quantity: number; name: string; isPack?: boolean }[] = []
    
    for (const item of validatedData.items) {
      // Quantité déjà validée par Zod
      const qty = item.quantity
      
      // SÉCURITÉ: Récupérer le prix RÉEL depuis la base de données
      // Vérifier d'abord si c'est un pack (pack_id présent) ou un bijou
      const productId = item.pack_id || item.bijou_id
      if (!productId) {
        return NextResponse.json({ error: 'ID produit/pack manquant' }, { status: 400 })
      }
      
      // Si pack_id est présent, c'est un pack
      if (item.pack_id) {
        // Essayer d'abord comme pack
        const pack = await getPackById(String(productId))
        if (pack) {
          // Utiliser le prix de la BDD, pas celui envoyé par le client
          const verifiedPrice = pack.price
          total += verifiedPrice * qty
          
          verifiedItems.push({
            id: productId.toString(),
            price: verifiedPrice,
            quantity: qty,
            name: pack.name,
            isPack: true
          })
          
      // Log si le prix client diffère du prix réel (tentative de fraude potentielle)
      if (Math.abs(item.price - verifiedPrice) > 0.01) {
        logger.warn(`[SECURITY] Prix manipulé détecté (pack): client=${item.price}, réel=${verifiedPrice}, pack=${productId}`)
      }
          continue
        }
      }
      
      // Sinon, traiter comme un bijou
      const product = await getBijouById(String(productId))
      if (!product) {
        return NextResponse.json({ error: `Produit ${productId} introuvable` }, { status: 404 })
      }
      
      if (!product.is_available) {
        return NextResponse.json({ error: `Produit "${product.name}" non disponible` }, { status: 400 })
      }
      
      // Utiliser le prix de la BDD, pas celui envoyé par le client
      const verifiedPrice = product.price
      total += verifiedPrice * qty
      
      verifiedItems.push({
        id: productId.toString(),
        price: verifiedPrice,
        quantity: qty,
        name: product.name,
        isPack: false
      })
      
      // Log si le prix client diffère du prix réel (tentative de fraude potentielle)
      if (Math.abs(item.price - verifiedPrice) > 0.01) {
        logger.warn(`[SECURITY] Prix manipulé détecté: client=${item.price}, réel=${verifiedPrice}, produit=${productId}`)
      }
    }

    // PHASE 3: Créer la commande complète en transaction (commande + lignes + paiement + notification)
    logger.info('[POST /api/checkout] Début création commande', {
      itemsCount: verifiedItems.length,
      total,
      phone: sanitizedPhone ? sanitizedPhone.substring(0, 4) + '****' : null,
      paymentMethod: validatedData.payment_method || 'cash_on_delivery'
    })
    
    // Récupérer l'utilisateur si connecté
    let userId = ''
    try {
      const { getCurrentUser } = await import('@/lib/auth')
      const user = await getCurrentUser()
      userId = user?.id || ''
    } catch {
      // Utilisateur non connecté, commande en guest
    }
    
    try {
      const result = await createOrderFull({
        user_id: userId,
        total: total,
        status: 'pending',
        shipping_address: `${sanitizedCity}, ${sanitizedAddress}`,
        shipping_phone: sanitizedPhone,
        shipping_name: sanitizedCustomerName || undefined,
        items: verifiedItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.name
        }))
      })
      
      // Créer notification séparément
      if (result?.orderId) {
        try {
          const { createNotification } = await import('@/lib/database')
          await createNotification({
            user_id: '',
            title: 'Nouvelle commande',
            message: `Client: ${sanitizedCustomerName || 'N/A'} - ${sanitizedPhone}\nCommande - ${total} MAD - ${validatedData.payment_method || 'cash_on_delivery'}`,
            type: 'info',
            link: `/admin/orders/${result.orderId}`
          })
        } catch (notifError) {
          logger.warn('Erreur création notification:', { error: notifError })
        }
      }

      if (!result) {
        logger.error('[POST /api/checkout] createOrderFull returned null - vérifier les logs de createOrderFull')
        return NextResponse.json({ error: 'Erreur lors de la création de la commande. Veuillez réessayer.' }, { status: 500 })
      }

      const orderId = result.orderId
      const paymentId = result.paymentId

      logger.info('[POST /api/checkout] Commande créée avec succès', { orderId, paymentId })

      // Email admin (si configuré)
      try {
        await sendAdminEmail(
          `Nouvelle commande ${orderId}`,
          renderPaymentEmail({ orderId, amount: total, method: validatedData.payment_method || 'cash_on_delivery', status: 'pending', transactionId: null })
        )
      } catch (emailError) {
        const emailErrorDetails = emailError instanceof Error ? {
          message: emailError.message,
          stack: emailError.stack
        } : { message: String(emailError) }
        logger.warn('[POST /api/checkout] Erreur envoi email admin (non bloquant):', emailErrorDetails)
      }

      return NextResponse.json({ success: true, order_id: orderId, payment_id: paymentId })
    } catch (orderError) {
      const errorDetails: Record<string, unknown> = orderError instanceof Error ? {
        message: orderError.message,
        stack: orderError.stack,
        name: orderError.name
      } : { message: String(orderError) }
      logger.error('[POST /api/checkout] Erreur lors de la création de la commande:', errorDetails)
      return NextResponse.json({ 
        error: 'Erreur lors de la création de la commande. Veuillez réessayer.',
        ...(process.env.NODE_ENV === 'development' ? { details: errorDetails } : {})
      }, { status: 500 })
    }
  } catch (error) {
    logger.error('[POST /api/checkout] Erreur checkout:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

