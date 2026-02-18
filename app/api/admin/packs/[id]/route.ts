import { NextRequest, NextResponse } from 'next/server'
import { getPackById, updatePack, deletePack } from '@/lib/pack-management'
import { createNotification } from '@/lib/database'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { updatePackSchema, validateWithSchema } from '@/lib/validations'
import { sanitizeInput, validateNumericId, requireCSRF } from '@/lib/security'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

// Type inféré du schéma Zod
type UpdatePackData = {
  name?: string
  slug?: string
  description?: string
  price?: number
  image_url?: string
  is_featured?: boolean
}

/**
 * API Admin pour gérer un pack spécifique (GET, PUT, DELETE)
 */

// GET - Récupérer un pack par ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    const pack = await getPackById(id)
    if (!pack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ pack })
  } catch (error) {
    logger.error('Erreur GET /api/admin/packs/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un pack
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }
    
    const { id } = await params
    
    // SÉCURITÉ: Validation de l'ID
    if (!validateNumericId(id)) {
      return NextResponse.json({ error: 'ID pack invalide' }, { status: 400 })
    }

    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    const { user } = auth

    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(updatePackSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }

    // Type guard: après la vérification success, TypeScript sait que data existe
    const validatedData = validation.data as UpdatePackData

    // Vérifier que le pack existe
    const existingPack = await getPackById(id)
    if (!existingPack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 })
    }

    // SÉCURITÉ: Sanitization des entrées (après validation Zod)
    const updateData: {
      name?: string
      slug?: string
      description?: string
      price?: number
      image_url?: string
      is_featured?: boolean
    } = {}

    if (validatedData.name) updateData.name = sanitizeInput(validatedData.name)
    if (validatedData.slug) updateData.slug = sanitizeInput(validatedData.slug)
    if (validatedData.description) updateData.description = sanitizeInput(validatedData.description)
    if (validatedData.price !== undefined) updateData.price = validatedData.price
    if (validatedData.image_url) updateData.image_url = validatedData.image_url
    if (validatedData.is_featured !== undefined) updateData.is_featured = validatedData.is_featured

    // Mettre à jour le pack (convertit les types côté updatePack, throw si aucune ligne modifiée)
    await updatePack(id, updateData)

    // Relire le pack après mise à jour
    const pack = await getPackById(id)

    // Notification admin
    try {
      await createNotification({
        user_id: '',
        title: 'Pack modifié',
        message: `Pack "${pack?.name ?? existingPack.name}" modifié par ${user.first_name || user.phone}`,
        type: 'info',
        link: `/admin/packs`
      })
    } catch (notifError) {
      logger.warn('Erreur création notification:', { error: notifError })
    }

    return NextResponse.json({ success: true, pack })
  } catch (error) {
    logger.error('Erreur PUT /api/admin/packs/[id]:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un pack
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }
    
    const { id } = await params
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    const { user } = auth

    // Vérifier que le pack existe
    const existingPack = await getPackById(id)
    if (!existingPack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 })
    }

    // Supprimer le pack (retourne void, lance une exception si échec)
    await deletePack(id)

    // Notification admin
    try {
      await createNotification({
        user_id: '',
        title: 'Pack supprimé',
        message: `Pack "${existingPack.name}" supprimé par ${user.first_name || user.phone}`,
        type: 'warning',
        link: `/admin/packs`
      })
    } catch (notifError) {
      logger.warn('Erreur création notification:', { error: notifError })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur DELETE /api/admin/packs/[id]:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

