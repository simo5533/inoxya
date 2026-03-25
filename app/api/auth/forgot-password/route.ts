import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const schema = z.object({
  phone: z.string().min(8).max(20).trim(),
})

/**
 * Réinitialisation mot de passe : stub métier (pas d’énumération — réponse uniforme).
 * TODO: token + SMS/email si le produit le prévoit.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Numéro invalide' }, { status: 422 })
    }

    logger.info('[Auth] Demande de réinitialisation mot de passe (traitement différé / non implémenté)')

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.error('[forgot-password]', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}
