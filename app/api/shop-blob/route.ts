/**
 * Sert des fichiers hébergés sur Vercel Blob (store en accès **private**).
 * Les clients ne lisent pas directement l’URL *.private.blob… ; l’app enregistre
 * des URLs de la forme /api/shop-blob?pathname=…
 */
import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isSafePathname(p: string): boolean {
  if (!p || p.length > 2000) return false
  if (p.includes('..') || p.includes('\0') || p.startsWith('/')) return false
  // Uniquement les préfixes d’upload de cette app
  if (!p.startsWith('bijoux/') && !p.startsWith('admin/shop/')) {
    return false
  }
  return true
}

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get('pathname')
  if (!pathname) {
    return NextResponse.json({ error: 'Paramètre pathname requis' }, { status: 400 })
  }
  const decoded = decodeURIComponent(pathname)
  if (!isSafePathname(decoded)) {
    return NextResponse.json({ error: 'Pathname refusé' }, { status: 400 })
  }

  const token = process.env['BLOB_READ_WRITE_TOKEN']
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN manquant' }, { status: 500 })
  }

  try {
    const result = await get(decoded, { access: 'private', token })
    if (result == null) {
      return new NextResponse('Not found', { status: 404 })
    }
    if (result.statusCode === 304) {
      return new NextResponse(null, { status: 304 })
    }
    if (result.statusCode !== 200 || !result.stream) {
      return new NextResponse('Not found', { status: 404 })
    }
    const ct = result.blob?.contentType || 'image/webp'
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
