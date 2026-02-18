import { NextResponse } from 'next/server'
import { getActiveDriver } from '@/lib/sqlite'
import { logger } from '@/lib/logger'
import * as fs from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * PHASE 3: Route /api/health pour diagnostic
 * Affiche le driver actif, le chemin DB, et l'état des tables
 */
export async function GET() {
  try {
    const { driver, dbPath } = getActiveDriver()
    
    // Vérifier si le fichier DB existe
    const dbExists = fs.existsSync(dbPath)
    let dbSize = 0
    let tables: string[] = []
    let error: string | null = null
    
    if (dbExists) {
      try {
        const stats = fs.statSync(dbPath)
        dbSize = stats.size
        
        // Essayer de lister les tables (nécessite une connexion DB)
        try {
          const { selectRows } = await import('@/lib/sqlite')
          const tableRows = selectRows(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
            []
          )
          tables = tableRows.map((row: any) => row.name as string)
        } catch (dbError) {
          error = `Erreur lecture tables: ${dbError instanceof Error ? dbError.message : String(dbError)}`
        }
      } catch (statError) {
        error = `Erreur stats DB: ${statError instanceof Error ? statError.message : String(statError)}`
      }
    } else {
      error = `Fichier DB non trouvé: ${dbPath}`
    }
    
    const health = {
      status: driver !== 'none' && dbExists && !error ? 'ok' : 'error',
      driver,
      dbPath,
      dbExists,
      dbSizeBytes: dbSize,
      dbSizeKB: Math.round(dbSize / 1024),
      tables: tables.length,
      tableNames: tables,
      error: error || null,
      timestamp: new Date().toISOString()
    }
    
    const statusCode = health.status === 'ok' ? 200 : 503
    
    logger.info('[GET /api/health]', health)
    
    return NextResponse.json(health, { status: statusCode })
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('[GET /api/health] Erreur:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
