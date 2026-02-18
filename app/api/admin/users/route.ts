import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { getAllUsers } from '@/lib/database'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function GET() {
  try {
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    
    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    logger.error('Erreur API admin/users:', error, {})
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
