import { NextRequest, NextResponse } from 'next/server'
import { updatePaymentStatus } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { updatePaymentStatusSchema, validateWithSchema, numericIdSchema } from '@/lib/validations'
import { requireCSRF } from '@/lib/security'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    const { id } = await params
    
    // SÉCURITÉ: Validation de l'ID avec Zod
    const idValidation = numericIdSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID paiement invalide', details: idValidation.error.errors.map(e => e.message) },
        { status: 400 }
      )
    }
    
    // SÉCURITÉ: Vérifier l'authentification admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      logger.warn(`[SECURITY] Tentative mise à jour paiement ${id} sans auth admin`)
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }
    
    const body = await request.json()
    
    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(updatePaymentStatusSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    const { status } = validation.data

    const ok = await updatePaymentStatus(id, status)
    if (!ok) {
      logger.error(`Échec mise à jour statut paiement ${id}`)
      return NextResponse.json({ error: 'Mise à jour échouée' }, { status: 500 })
    }

    logger.info(`Statut paiement ${id} mis à jour: ${status}`)
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error('Erreur API mise à jour statut paiement:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
