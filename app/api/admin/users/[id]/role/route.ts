import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { updateUserRole } from '@/lib/auth'
import { updateUserRoleSchema, validateWithSchema } from '@/lib/validations'
import { validateNumericId, requireCSRF } from '@/lib/security'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    
    const { id } = await params
    
    // SÉCURITÉ: Validation de l'ID
    if (!validateNumericId(id)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 })
    }
    
    const body = await request.json()
    
    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(updateUserRoleSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    
    // Type guard: après la vérification success, TypeScript sait que data existe
    const validatedData = validation.data as { role: 'user' | 'moderator' | 'admin' }
    const { role } = validatedData
    const result = await updateUserRole(id, role)
    return NextResponse.json({ success: result.success })
  } catch (error) {
    logger.error('Erreur API update role:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
