/**
 * Route API de test pour vérifier les packs dans la base de données
 * Aide au débogage
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllPacks } from '@/lib/database'
import { logger } from '@/lib/logger'
import { select } from '@/lib/sqlite'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin()
    
    // Test 1: Récupérer via l'adaptateur
    const packsFromAdapter = await getAllPacks()
    
    // Test 2: Récupérer directement depuis SQLite
    let packsFromSQLite: unknown[] = []
    try {
      packsFromSQLite = select('SELECT * FROM packs ORDER BY created_at DESC')
    } catch (error) {
      logger.error('Erreur SQLite direct:', error)
    }
    
    // Test 3: Compter les packs
    let count = 0
    try {
      const countResult = select('SELECT COUNT(*) as count FROM packs') as Array<{ count: number }>
      count = countResult[0]?.count || 0
    } catch (error) {
      logger.error('Erreur count:', error)
    }
    
    return NextResponse.json({
      success: true,
      viaAdapter: packsFromAdapter.length,
      viaSQLite: packsFromSQLite.length,
      count: count,
      packsFromAdapter: packsFromAdapter,
      packsFromSQLite: packsFromSQLite,
      message: `Adapter: ${packsFromAdapter.length} packs, SQLite direct: ${packsFromSQLite.length} packs, Count: ${count}`
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error('Erreur test packs:', error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

