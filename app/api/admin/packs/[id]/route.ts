import { NextRequest, NextResponse } from 'next/server'
import { getPackById, updatePack, deletePack } from '@/lib/pack-management'
import { createNotification } from '@/lib/database'
import { getDatabaseAdapter } from '@/lib/db'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { updatePackSchema, validateWithSchema } from '@/lib/validations'
import { sanitizeInput, validateProductId, requireCSRF } from '@/lib/security'

/** Utiliser l'adapter pour getPackById si disponible (évite better-sqlite3) */
async function getPackByIdSafe(id: string): Promise<{ name: string; id: string } | null> {
  try {
    const adapter = await getDatabaseAdapter()
    if (typeof adapter.getPackById === 'function') {
      const pack = await adapter.getPackById(id)
      return pack ? { id: String(pack.id), name: pack.name } : null
    }
  } catch {
    // Ignorer, fallback ci-dessous
  }
  const pack = await getPackById(id)
  return pack ? { id: pack.id, name: pack.name } : null
}

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
    
    // SÉCURITÉ: Validation de l'ID (entier, UUID ou slug-safe)
    if (!validateProductId(id)) {
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
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
        ? sanitizeInput(validatedData.description)
        : ''
    }
    if (validatedData.price !== undefined) updateData.price = validatedData.price
    if (validatedData.image_url !== undefined && validatedData.image_url !== null) {
      updateData.image_url = validatedData.image_url
    }
    if (validatedData.is_featured !== undefined) updateData.is_featured = validatedData.is_featured

    let existingPack: { name: string } | null = null
    let pack: { id: string; name: string } | null = null

    // Priorité 1 : adapter (Supabase / Postgres / SQLite via adapter)
    try {
      const adapter = await getDatabaseAdapter()
      if (typeof adapter.getPackById === 'function' && typeof adapter.updatePack === 'function') {
        const existing = await adapter.getPackById(id)
        if (!existing) {
          return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 })
        }
        existingPack = { name: existing.name }
        const updated = await adapter.updatePack(id, updateData)
        if (!updated) {
          logger.error('[PUT /api/admin/packs/[id]] updatePack a échoué via adapter', {
            id,
            fields: Object.keys(updateData),
          })
          return NextResponse.json(
            { error: 'Échec de la mise à jour du pack (base de données)' },
            { status: 500 }
          )
        }
        const updatedPack = await adapter.getPackById(id)
        pack = updatedPack
          ? { id: String(updatedPack.id), name: updatedPack.name }
          : { id: String(existing.id), name: existing.name }
        try {
          await createNotification({
            user_id: null,
            title: 'Pack modifié',
            message: `Pack "${pack.name}" modifié par ${user.first_name || user.phone}`,
            type: 'info',
            link: `/admin/packs`,
          })
        } catch (notifError) {
          logger.warn('Erreur création notification:', { error: notifError })
        }
        return NextResponse.json({ success: true, pack: updatedPack ?? pack })
      }
    } catch (adapterError) {
      logger.warn('[PUT /api/admin/packs/[id]] Adapter failed, fallback pack-management:', {
        error: adapterError instanceof Error ? adapterError.message : String(adapterError),
      })
    }

    // Fallback : pack-management (better-sqlite3, local uniquement)
    existingPack = await getPackByIdSafe(id)
    if (!existingPack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 })
    }
    try {
      await updatePack(id, updateData)
    } catch (sqliteError) {
      logger.error('[PUT /api/admin/packs/[id]] Fallback SQLite failed:', sqliteError)
      return NextResponse.json(
        {
          error: 'Échec de la mise à jour du pack',
          details:
            sqliteError instanceof Error ? sqliteError.message : 'Erreur base de données',
        },
        { status: 500 }
      )
    }
    pack = await getPackByIdSafe(id)

    // Notification admin
    try {
      await createNotification({
        user_id: null,
        title: 'Pack modifié',
        message: `Pack "${pack?.name ?? existingPack.name}" modifié par ${user.first_name || user.phone}`,
        type: 'info',
        link: `/admin/packs`,
      })
    } catch (notifError) {
      logger.warn('Erreur création notification:', { error: notifError })
    }

    return NextResponse.json({ success: true, pack })
  } catch (error) {
    logger.error('Erreur PUT /api/admin/packs/[id]:', error, {})
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un pack
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    const { id } = await params
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    const { user } = auth

    let existingPack: { name: string } | null = null

    // PRIORITÉ 1: Utiliser l'adapter (Supabase) pour supprimer
    try {
      const adapter = await getDatabaseAdapter()
      if (typeof adapter.getPackById === 'function' && typeof adapter.deletePack === 'function') {
        const pack = await adapter.getPackById(id)
        if (pack) {
          existingPack = { name: pack.name }
          const deleted = await adapter.deletePack(id)
          if (deleted) {
            logger.info(`[DELETE /api/admin/packs/${id}] Pack supprimé via adapter`)
            try {
              await createNotification({
                user_id: null,
                title: 'Pack supprimé',
                message: `Pack "${existingPack.name}" supprimé par ${user.first_name || user.phone}`,
                type: 'warning',
                link: `/admin/packs`
              })
            } catch (notifError) {
              logger.warn('Erreur création notification:', { error: notifError })
            }
            return NextResponse.json({ success: true })
          }
        }
      }
    } catch (adapterError) {
      logger.warn('[DELETE /api/admin/packs/[id]] Adapter failed, fallback pack-management:', { error: adapterError instanceof Error ? adapterError.message : String(adapterError) })
    }

    // FALLBACK: pack-management (SQLite)
    existingPack = await getPackById(id)
    if (!existingPack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 })
    }

    await deletePack(id)

    try {
      await createNotification({
        user_id: null,
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

