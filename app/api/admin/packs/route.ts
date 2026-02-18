import { NextRequest, NextResponse } from 'next/server'
import { getAllPacks, createNotification, getBijouById } from '@/lib/database'
import { createPack } from '@/lib/pack-management'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { createPackSchema, validateWithSchema } from '@/lib/validations'
import { sanitizeInput, requireCSRF } from '@/lib/security'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

// Type inféré du schéma Zod
type CreatePackData = {
  name: string
  slug: string
  description: string
  price: number
  image_url: string
  is_featured?: boolean
  composition?: Array<{
    bijou_id: number | string
    quantity?: number
    is_required?: boolean
    is_customizable?: boolean
  }>
}

/**
 * API Admin pour la gestion complète des packs
 * Protection admin obligatoire
 */

// GET - Récupérer tous les packs
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    const packs = await getAllPacks()
    return NextResponse.json({ packs })
  } catch (error) {
    logger.error('Erreur GET /api/admin/packs:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouveau pack
export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }
    
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    const { user } = auth

    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(createPackSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }

    // Type guard: après la vérification success, TypeScript sait que data existe
    const validatedData = validation.data as CreatePackData

    // SÉCURITÉ: Sanitization des entrées (après validation Zod)
    const sanitizedName = sanitizeInput(validatedData.name)
    const sanitizedSlug = sanitizeInput(validatedData.slug)
    const sanitizedDescription = sanitizeInput(validatedData.description || '')

    // Vérifier que les bijoux de la composition existent
    const composition = validatedData.composition || []
    if (composition.length > 0) {
      for (const item of composition) {
        const product = await getBijouById(String(item.bijou_id))
        if (!product) {
          return NextResponse.json(
            { error: `Produit avec l'ID "${item.bijou_id}" inexistant.` },
            { status: 400 }
          )
        }
      }
    }

    const mappedComposition = composition.map((item: { bijou_id: string | number; quantity?: number; is_required?: boolean; is_customizable?: boolean }) => ({
      id: '',
      pack_id: '',
      bijou_id: String(item.bijou_id),
      quantity: item.quantity || 1,
      is_required: item.is_required ?? true,
      is_customizable: item.is_customizable ?? false,
      created_at: ''
    }))

    // Créer le pack
    const packId = await createPack({
      name: sanitizedName,
      slug: sanitizedSlug,
      description: sanitizedDescription,
      price: validatedData.price,
      image_url: validatedData.image_url,
      images: [],
      category: 'general',
      tags: [],
      is_featured: validatedData.is_featured || false,
      is_active: true,
      stock_quantity: 100,
      min_items: 1,
      max_items: 5,
      discount: { type: 'percentage', value: 0 },
      composition: mappedComposition,
      rating: 4.5,
      reviews_count: 0
    } as Parameters<typeof createPack>[0])

    if (!packId) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du pack' },
        { status: 500 }
      )
    }

    // Notification admin
    try {
      await createNotification({
        user_id: '',
        title: 'Nouveau pack créé',
        message: `Pack "${sanitizedName}" créé par ${user.first_name || user.phone}`,
        type: 'success',
        link: `/admin/packs`
      })
    } catch (notifError) {
      logger.warn('Erreur création notification:', { error: notifError })
    }

    return NextResponse.json({ success: true, pack: { id: packId, name: sanitizedName, slug: sanitizedSlug } })
  } catch (error) {
    logger.error('Erreur POST /api/admin/packs:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

