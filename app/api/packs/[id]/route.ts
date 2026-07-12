import { NextRequest, NextResponse } from 'next/server'
import { 
  getPackById, 
  updatePack, 
  deletePack 
} from '@/lib/pack-management'
import { logger } from '@/lib/logger'
import { sanitizeInput, requireCSRF, validateNumericId } from '@/lib/security'
import { getCurrentUser } from '@/lib/auth'
import { validateWithSchema, updatePackSchema } from '@/lib/validations'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

// GET /api/packs/[id] - Récupérer un pack par ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // SÉCURITÉ: Validation de l'ID
    if (!validateNumericId(id)) {
      return NextResponse.json(
        { error: 'ID pack invalide' },
        { status: 400 }
      )
    }
    
    const pack = await getPackById(id)

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(pack)
  } catch (error) {
    logger.error('Erreur lors de la récupération du pack:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du pack' },
      { status: 500 }
    )
  }
}

// PUT /api/packs/[id] - Mettre à jour un pack
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
      return NextResponse.json(
        { error: 'ID pack invalide' },
        { status: 400 }
      )
    }
    
    // SÉCURITÉ: Vérifier les permissions admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé. Seuls les administrateurs peuvent modifier des packs.' },
        { status: 403 }
      )
    }
    
    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(updatePackSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    
    const validatedData = validation.data

    // Vérifier que le pack existe
    const existingPack = await getPackById(id)
    if (!existingPack) {
      return NextResponse.json(
        { error: 'Pack non trouvé' },
        { status: 404 }
      )
    }

    // SÉCURITÉ: Préparer les données de mise à jour avec sanitization (utiliser les données validées par Zod)
    const updateData: Record<string, unknown> = {}
    
    if (validatedData.name !== undefined) updateData['name'] = sanitizeInput(validatedData.name)
    if (validatedData.slug !== undefined) updateData['slug'] = sanitizeInput(validatedData.slug)
    if (typeof validatedData.description === 'string') {
      updateData['description'] = sanitizeInput(validatedData.description)
    }
    if (validatedData.price !== undefined) {
      updateData['price'] = validatedData.price
    }
    if (typeof validatedData.image_url === 'string') {
      updateData['image_url'] = validatedData.image_url
    }
    if (validatedData.is_featured !== undefined) updateData['is_featured'] = validatedData.is_featured
    if (body['stock_quantity'] !== undefined) {
      const stockNum = parseInt(String(body['stock_quantity']))
      if (isNaN(stockNum) || stockNum < 0) {
        return NextResponse.json(
          { error: 'Le stock doit être un nombre positif ou nul' },
          { status: 400 }
        )
      }
      updateData['stock_quantity'] = stockNum
    }
    if (body['min_items'] !== undefined) {
      const minItems = parseInt(String(body['min_items']))
      if (isNaN(minItems) || minItems < 1) {
        return NextResponse.json(
          { error: 'Le nombre minimum d\'articles doit être au moins 1' },
          { status: 400 }
        )
      }
      updateData['min_items'] = minItems
    }
    if (body['max_items'] !== undefined) {
      const maxItems = parseInt(String(body['max_items']))
      if (isNaN(maxItems) || maxItems < 1) {
        return NextResponse.json(
          { error: 'Le nombre maximum d\'articles doit être au moins 1' },
          { status: 400 }
        )
      }
      updateData['max_items'] = maxItems
    }
    if (body['discount_type'] || body['discount_value'] !== undefined) {
      const discountValue = body['discount_value'] !== undefined ? parseFloat(String(body['discount_value'])) : existingPack.discount.value
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        return NextResponse.json(
          { error: 'La valeur de remise doit être entre 0 et 100' },
          { status: 400 }
        )
      }
      updateData['discount'] = {
        type: body['discount_type'] || existingPack.discount.type,
        value: discountValue
      }
    }

    await updatePack(id, updateData)

    return NextResponse.json(
      { message: 'Pack mis à jour avec succès' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du pack:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du pack' },
      { status: 500 }
    )
  }
}

// DELETE /api/packs/[id] - Supprimer un pack
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
    
    // SÉCURITÉ: Validation de l'ID
    if (!validateNumericId(id)) {
      return NextResponse.json(
        { error: 'ID pack invalide' },
        { status: 400 }
      )
    }
    
    // SÉCURITÉ: Vérifier les permissions admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé. Seuls les administrateurs peuvent supprimer des packs.' },
        { status: 403 }
      )
    }

    // Vérifier que le pack existe
    const existingPack = await getPackById(id)
    if (!existingPack) {
      return NextResponse.json(
        { error: 'Pack non trouvé' },
        { status: 404 }
      )
    }

    await deletePack(id)

    return NextResponse.json(
      { message: 'Pack supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Erreur lors de la suppression du pack:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du pack' },
      { status: 500 }
    )
  }
}
