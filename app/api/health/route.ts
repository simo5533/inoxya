import { NextResponse } from 'next/server'
import { getAllCategories } from '@/lib/database'
import { logger } from '@/lib/logger'
import { IS_PRODUCTION } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Health check endpoint - Vercel production ready
 * Tests database connection and returns status
 */
export async function GET() {
  try {
    // Test database connection with timeout
    const dbTest = await Promise.race([
      getAllCategories().then(() => ({ connected: true, error: null })),
      new Promise<{ connected: false; error: string }>((resolve) => {
        setTimeout(() => resolve({ connected: false, error: 'Database connection timeout' }), 3000)
      })
    ])

    const isHealthy = dbTest.connected
    const databaseUrl = process.env['DATABASE_URL']
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const dbType = supabaseUrl
      ? 'supabase'
      : databaseUrl?.startsWith('postgresql://') || databaseUrl?.startsWith('postgres://')
        ? 'postgresql'
        : 'sqlite'

    const health = {
      status: isHealthy ? 'ok' : 'error',
      db: isHealthy ? 'connected' : 'disconnected',
      dbType,
      timestamp: new Date().toISOString(),
      ...(dbTest.error ? { error: dbTest.error } : {})
    }

    logger.info('[GET /api/health]', health)

    return NextResponse.json(health, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('[GET /api/health] Erreur:', error)

    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        timestamp: new Date().toISOString(),
        ...(!IS_PRODUCTION && { error: error.message }),
      },
      { status: 503 }
    )
  }
}
