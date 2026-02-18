import { NextRequest, NextResponse } from 'next/server'
import { getCartItems, addToCart, getBijouById, createNotification, updateCartQuantity, removeFromCart } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { addToCartSchema, updateCartSchema, validateWithSchema, numericIdSchema } from '@/lib/validations'
import { requireCSRF } from '@/lib/security'

/**
 * API pour gérer le panier côté serveur
 * Synchronise le panier localStorage avec la base de données
 * Crée des notifications pour l'admin
 * 
 * SÉCURITÉ: Toutes les opérations sont liées à l'utilisateur authentifié
 * via getCurrentUser() - pas de paramètre user_id accepté du client
 */

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

// GET - Récupérer le panier d'un utilisateur
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    // Si pas d'utilisateur, retourner un panier vide
    if (!user) {
      return NextResponse.json({ items: [] })
    }

    // SÉCURITÉ: Récupérer UNIQUEMENT le panier de l'utilisateur authentifié
    const cartItems = await getCartItems(user.id)
    return NextResponse.json({ items: cartItems })
  } catch (error) {
    logger.error('Erreur GET /api/cart:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ items: [] })
  }
}

// POST - Ajouter ou mettre à jour un article dans le panier
export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    const user = await getCurrentUser()
    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(addToCartSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    const { product_id, quantity = 1 } = validation.data
    const qty = quantity

    // Si pas d'utilisateur connecté, on peut quand même tracker (session anonyme)
    const userId = user?.id || null

    // Ajouter au panier en base de données si utilisateur connecté
    if (userId) {
      await addToCart(userId, String(product_id), qty)
    }

    // Créer une notification pour l'admin
    try {
      const product = await getBijouById(String(product_id))
      const productName = product?.name || `Produit ${product_id}`
      const userName = user ? (user.first_name || user.phone || 'Utilisateur') : 'Visiteur'
      
      await createNotification({
        user_id: '', // Notification globale pour tous les admins
        title: 'Produit ajouté au panier',
        message: `${productName} (x${quantity}) a été ajouté au panier par ${userName}`,
        type: 'info',
        link: `/admin/paniers`
      })
    } catch (notifError) {
      logger.warn('Erreur création notification panier:', { error: notifError instanceof Error ? notifError.message : String(notifError) })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur POST /api/cart:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour la quantité d'un article
export async function PUT(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    const user = await getCurrentUser()
    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(updateCartSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    const { product_id, quantity } = validation.data

    if (quantity <= 0) {
      // Supprimer l'article
      return DELETE(request)
    }

    const userId = user?.id || null

    if (userId) {
      await updateCartQuantity(userId, String(product_id), quantity)
    }

    // Notification admin pour modification
    try {
      const product = await getBijouById(String(product_id))
      const productName = product?.name || `Produit ${product_id}`
      const userName = user ? (user.first_name || user.phone || 'Utilisateur') : 'Visiteur'
      
      await createNotification({
        user_id: '',
        title: 'Panier modifié',
        message: `Quantité de "${productName}" mise à jour: ${quantity} par ${userName}`,
        type: 'info',
        link: `/admin/paniers`
      })
    } catch (notifError) {
      logger.warn('Erreur notification modification panier:', { error: notifError instanceof Error ? notifError.message : String(notifError) })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur PUT /api/cart:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un article du panier
export async function DELETE(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const product_id = searchParams.get('product_id')

    // SÉCURITÉ: Validation avec Zod
    const idValidation = numericIdSchema.safeParse(product_id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID produit invalide', details: idValidation.error.errors.map(e => e.message) },
        { status: 400 }
      )
    }
    const validatedProductId = String(idValidation.data)

    const userId = user?.id || null

    if (userId) {
      await removeFromCart(userId, validatedProductId)
    }

    // Notification admin pour suppression
    try {
      const product = await getBijouById(validatedProductId)
      const productName = product?.name || `Produit ${validatedProductId}`
      const userName = user ? (user.first_name || user.phone || 'Utilisateur') : 'Visiteur'
      
      await createNotification({
        user_id: '',
        title: 'Produit retiré du panier',
        message: `"${productName}" a été retiré du panier par ${userName}`,
        type: 'info',
        link: `/admin/paniers`
      })
    } catch (notifError) {
      logger.warn('Erreur notification suppression panier:', { error: notifError instanceof Error ? notifError.message : String(notifError) })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur DELETE /api/cart:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

