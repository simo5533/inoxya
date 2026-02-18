import { NextResponse } from 'next/server'
import { getAllCategories } from '@/lib/database'
import { logger } from '@/lib/logger'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function GET() {
  try {
    const categories = await getAllCategories()
    return NextResponse.json(categories)
  } catch (error) {
    logger.error('Erreur API categories', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
