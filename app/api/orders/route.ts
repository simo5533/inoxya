import { NextRequest, NextResponse } from 'next/server'
import { getBijouById, createOrder, createOrderItem, getAllOrders } from '@/lib/database'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { sanitizeInput, requireCSRF } from '@/lib/security'
import { createOrderSchema, validateWithSchema } from '@/lib/validations'

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
    const validation = validateWithSchema(createOrderSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    const validatedData = validation.data

    const { 
      bijou_id, 
      pack_id, 
      customer_name, 
      customer_address, 
      customer_phone, 
      quantity = 1
    } = validatedData

    // SÉCURITÉ: Sanitization des entrées utilisateur (après validation Zod)
    const sanitizedName = sanitizeInput(customer_name)
    const sanitizedAddress = sanitizeInput(customer_address)
    const sanitizedPhone = sanitizeInput(customer_phone)

    const qty = quantity

    // SÉCURITÉ: Vérifier le prix réel du produit depuis la BDD
    let verifiedAmount = 0
    let product: Awaited<ReturnType<typeof getBijouById>> = null
    let pack: { id: string; name: string; price: number } | null = null
    
    if (bijou_id) {
      product = await getBijouById(String(bijou_id))
      if (!product) {
        return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
      }
      verifiedAmount = product.price * qty
    } else if (pack_id) {
      const { getPackById } = await import('@/lib/pack-management')
      pack = await getPackById(String(pack_id))
      if (!pack) {
        return NextResponse.json({ error: 'Pack introuvable' }, { status: 404 })
      }
      verifiedAmount = pack.price * qty
    }

    // SÉCURITÉ: Créer la commande EN BASE DE DONNÉES avec données sanitizées
    const order = await createOrder({
      user_id: '',
      total: verifiedAmount,
      status: 'pending',
      shipping_address: `${sanitizedName}, ${sanitizedAddress}`,
      shipping_phone: sanitizedPhone,
      shipping_name: sanitizedName
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 })
    }

    // Créer les items de commande EN BASE DE DONNÉES
    if (bijou_id && product) {
      await createOrderItem({
        order_id: order.id,
        product_id: String(bijou_id),
        quantity: qty,
        price: product.price,
        product_name: product.name
      })
    } else if (pack_id && pack) {
      await createOrderItem({
        order_id: order.id,
        product_id: String(pack_id),
        quantity: qty,
        price: pack.price,
        product_name: pack.name
      })
    }

    return NextResponse.json({ 
      success: true, 
      order_id: order.id,
      message: 'Commande créée avec succès' 
    })

  } catch (error) {
    logger.error('Erreur API commandes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    const orders = await getAllOrders()
    return NextResponse.json({ orders })
  } catch (error) {
    logger.error('Erreur API commandes GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
