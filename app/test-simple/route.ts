import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Route de test ultra-simple qui ne passe PAS par le middleware
 * Accessible directement sans i18n
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Route test-simple fonctionne',
    timestamp: new Date().toISOString(),
  }, { status: 200 })
}

