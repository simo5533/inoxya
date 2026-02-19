import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Route de test simple qui ne dépend pas de la DB
 * Pour vérifier que le serveur répond
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Serveur répond correctement',
    timestamp: new Date().toISOString(),
    server: 'Next.js',
  }, { status: 200 })
}

