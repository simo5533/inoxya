import { NextRequest, NextResponse } from 'next/server'
import { getBijouById, createOrderFull, getPackForCheckoutOrder } from '@/lib/database'
import { sendAdminEmail, renderPaymentEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { sanitizeInput, requireCSRF } from '@/lib/security'
import { consumePublicRateLimit, getClientIp } from '@/lib/public-rate-limit'
import { checkoutSchema, validateWithSchema } from '@/lib/validations'
import {
  formatPaymentMethodLabelFr,
  normalizeCheckoutPaymentMethod,
  orderStatusForCheckoutPayment,
} from '@/lib/payment-methods'
import { STOCK_UNKNOWN } from '@/lib/custom-pack'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
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

    // Rate limiting public après validation (évite de consommer le quota sur JSON invalide)
    const clientIP = getClientIp(request)
    const checkoutRl = consumePublicRateLimit(`api:checkout:${clientIP}`, 12, 60 * 60 * 1000)
    if (!checkoutRl.ok) {
      logger.warn(`[SECURITY] Checkout rate limit triggered for IP: ${clientIP.slice(0, 8)}…`)
      return NextResponse.json(
        { error: 'Trop de commandes. Veuillez réessayer plus tard.' },
        {
          status: 429,
          headers: checkoutRl.retryAfterSec
            ? { 'Retry-After': String(checkoutRl.retryAfterSec) }
            : {},
        }
      )
    }

    const validatedData = validation.data
    const paymentMethod = normalizeCheckoutPaymentMethod(validatedData.payment_method as string | undefined)

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

      /** Pack personnalisé (−20 %) : prix recalculé côté serveur, plusieurs lignes commande */
      if (item.custom_pack_lines && item.custom_pack_lines.length > 0) {
        const lines = item.custom_pack_lines
        const resolved: { product: NonNullable<Awaited<ReturnType<typeof getBijouById>>>; qty: number; lineSub: number }[] = []
        let subtotal = 0
        for (const line of lines) {
          const pid = String(line.bijou_id)
          // eslint-disable-next-line no-await-in-loop
          const product = await getBijouById(pid)
          if (!product) {
            return NextResponse.json({ error: `Produit ${pid} introuvable` }, { status: 404 })
          }
          if (!product.is_available) {
            return NextResponse.json({ error: `Produit « ${product.name} » non disponible` }, { status: 400 })
          }
          const rawStock = (product as { stock?: number; stock_quantity?: number }).stock ?? (product as { stock_quantity?: number }).stock_quantity
          const unknownStock =
            rawStock === STOCK_UNKNOWN ||
            rawStock === undefined ||
            rawStock === null ||
            typeof rawStock !== 'number'
          const available = unknownStock ? 999 : rawStock
          if (available < line.quantity) {
            return NextResponse.json(
              { error: `Stock insuffisant pour « ${product.name} »` },
              { status: 400 }
            )
          }
          const p = Number(product.price) || 0
          const lineSub = p * line.quantity
          subtotal += lineSub
          resolved.push({ product, qty: line.quantity, lineSub })
        }
        const targetTotal = Math.round(subtotal * 0.8 * 100) / 100
        let allocated = 0
        for (let i = 0; i < resolved.length; i++) {
          const row = resolved[i]
          if (!row) continue
          const { product, qty, lineSub } = row
          const isLast = i === resolved.length - 1
          const lineTotal = isLast
            ? Math.round((targetTotal - allocated) * 100) / 100
            : Math.round((lineSub / subtotal) * targetTotal * 100) / 100
          allocated += lineTotal
          const unitPrice = qty > 0 ? lineTotal / qty : 0
          verifiedItems.push({
            id: String(product.id),
            price: unitPrice,
            quantity: qty,
            name: `${product.name} (pack −20 %)`,
            isPack: false,
          })
          total += lineTotal
        }
        if (Math.abs(item.price - targetTotal) > 0.02) {
          logger.warn(`[SECURITY] Prix pack perso: client=${item.price}, serveur=${targetTotal}`)
        }
        continue
      }
      
      // SÉCURITÉ: Récupérer le prix RÉEL depuis la base de données
      // Vérifier d'abord si c'est un pack (pack_id présent) ou un bijou
      const productId = item.pack_id || item.bijou_id || (item as { product_id?: string }).product_id
      if (!productId) {
        return NextResponse.json({ error: 'ID produit/pack manquant' }, { status: 400 })
      }
      
      // Si pack_id est présent, c'est un pack
      if (item.pack_id) {
        // Même source de vérité que /api/packs (adapter), pas seulement better-sqlite3 local
        // eslint-disable-next-line no-await-in-loop
        const pack = await getPackForCheckoutOrder(String(productId))
        if (pack) {
          const verifiedPrice = pack.price
          total += verifiedPrice * qty

          verifiedItems.push({
            id: pack.id,
            price: verifiedPrice,
            quantity: qty,
            name: pack.name,
            isPack: true,
          })

          if (Math.abs(item.price - verifiedPrice) > 0.01) {
            logger.warn(`[SECURITY] Prix manipulé détecté (pack): client=${item.price}, réel=${verifiedPrice}, pack=${productId}`)
          }
          continue
        }
      }
      
      // Sinon, traiter comme un bijou
      // eslint-disable-next-line no-await-in-loop
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
    const checkoutDebug = process.env['CHECKOUT_DEBUG'] === 'true'
    logger.info('[POST /api/checkout] Début création commande', {
      itemsCount: verifiedItems.length,
      total,
      phone: sanitizedPhone ? sanitizedPhone.substring(0, 4) + '****' : null,
      paymentMethod
    })
    if (checkoutDebug) {
      logger.debug('[POST /api/checkout] CHECKOUT_DEBUG payload (sanitized)', {
        itemsCount: verifiedItems.length,
        total,
        phonePrefix: sanitizedPhone ? sanitizedPhone.substring(0, 4) + '****' : null,
        cityLength: sanitizedCity?.length ?? 0,
        addressLength: sanitizedAddress?.length ?? 0,
        customerNameLength: sanitizedCustomerName?.length ?? 0,
        itemIds: verifiedItems.map((i) => i.id)
      })
    }

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
        payment_method: paymentMethod,
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
            user_id: null,
            title: 'Nouvelle commande',
            message: `Client: ${sanitizedCustomerName || 'N/A'} - ${sanitizedPhone}\nCommande - ${total} MAD - ${formatPaymentMethodLabelFr(paymentMethod)}`,
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
          renderPaymentEmail({
            orderId,
            amount: total,
            method: paymentMethod,
            orderStatus: orderStatusForCheckoutPayment(paymentMethod),
            transactionId: null
          })
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
    const errDetails = error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : { message: String(error) }
    logger.error('[POST /api/checkout] Erreur non gérée (hors création commande):', errDetails)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        ...(process.env.NODE_ENV === 'development' ? { details: errDetails } : {}),
      },
      { status: 500 }
    )
  }
}

