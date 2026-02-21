/**
 * En développement uniquement : sert un fichier image depuis le disque local.
 * Permet d'afficher les images des packs dont l'URL est un chemin Windows (C:\...).
 * Désactivé en production pour la sécurité.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import path from 'path'
import { promises as fs } from 'fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'])
const IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non disponible en production' }, { status: 404 })
  }

  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const pathParam = request.nextUrl.searchParams.get('path')
  if (!pathParam || typeof pathParam !== 'string') {
    return NextResponse.json({ error: 'Paramètre path requis' }, { status: 400 })
  }

  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(pathParam).trim()
  } catch {
    return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 })
  }

  if (decodedPath.startsWith('"') && decodedPath.endsWith('"')) {
    decodedPath = decodedPath.slice(1, -1)
  }

  const normalized = path.normalize(decodedPath)
  const ext = path.extname(normalized).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 })
  }

  // Whitelist : sous Windows USERPROFILE (ex. C:\Users\Basma), sous Unix HOME ou /Users, /home
  const userProfile = process.env['USERPROFILE'] || process.env['HOME'] || ''
  const allowedDirs = [
    userProfile,
    path.join(process.cwd(), 'public'),
  ].filter(Boolean)
  const resolved = path.resolve(normalized)
  const isAllowed = allowedDirs.some((dir) => {
    const allowed = path.resolve(path.normalize(dir))
    return resolved === allowed || resolved.startsWith(allowed + path.sep)
  })
  if (!isAllowed) {
    return NextResponse.json({ error: 'Chemin non autorisé' }, { status: 403 })
  }

  try {
    await fs.access(resolved)
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
  }

  const buffer = await fs.readFile(resolved)
  const contentType = IMAGE_TYPES[ext] || 'application/octet-stream'
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=60',
    },
  })
}
