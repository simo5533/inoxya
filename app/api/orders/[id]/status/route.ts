import { NextRequest, NextResponse } from 'next/server'
import { updateOrderStatus } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { updateOrderStatusSchema, validateWithSchema, numericIdSchema } from '@/lib/validations'
import { requireCSRF } from '@/lib/security'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    logger.info('[API updateOrderStatus] Début de la requête', {})
    
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      logger.warn('[API updateOrderStatus] CSRF invalide', {})
      return csrfCheck.error
    }
    logger.info('[API updateOrderStatus] CSRF valide', {})

    const { id } = await params
    logger.info('[API updateOrderStatus] ID commande', { id })
    
    // SÉCURITÉ: Validation de l'ID avec Zod
    const idValidation = numericIdSchema.safeParse(id)
    if (!idValidation.success) {
      logger.warn('[API updateOrderStatus] ID invalide', { errors: idValidation.error.errors.map(e => ({ message: e.message, path: e.path })) })
      return NextResponse.json(
        { error: 'ID commande invalide', details: idValidation.error.errors.map(e => e.message) },
        { status: 400 }
      )
    }
    
    const user = await getCurrentUser()
    if (!user) {
      logger.warn('[API updateOrderStatus] Utilisateur non authentifié', {})
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (user.role !== 'admin') {
      logger.warn('[API updateOrderStatus] Utilisateur non admin', { userId: user.id, role: user.role })
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }
    logger.info('[API updateOrderStatus] Utilisateur admin vérifié', { userId: user.id })
    
    const body = await request.json()
    logger.info('[API updateOrderStatus] Body reçu', { status: body.status })
    
    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(updateOrderStatusSchema, body)
    if (!validation.success) {
      logger.warn('[API updateOrderStatus] Validation échouée', { errors: validation.errors })
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    const { status } = validation.data

    logger.info('[API updateOrderStatus] Mise à jour statut', { id, status })
    const ok = await updateOrderStatus(id, status)
    
    if (!ok) {
      logger.error(`[API updateOrderStatus] Échec mise à jour statut commande ${id}`, { id })
      return NextResponse.json({ error: 'Mise à jour échouée dans la base de données' }, { status: 500 })
    }

    logger.info('[API updateOrderStatus] Statut mis à jour avec succès', { id, status })
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error('[API updateOrderStatus] Erreur serveur', { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: 'Erreur serveur', message: e instanceof Error ? e.message : 'Erreur inconnue' }, { status: 500 })
  }
}
