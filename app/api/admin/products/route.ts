import { NextRequest, NextResponse } from 'next/server'
import { getAllBijoux } from '@/lib/database'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

/**
 * API Admin pour la gestion des produits
 * Protection admin obligatoire
 */

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

// GET - Récupérer tous les produits (admin)
export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    const products = await getAllBijoux()
    return NextResponse.json({ products })
  } catch (error) {
    logger.error('Erreur GET /api/admin/products:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

