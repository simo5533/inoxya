/**
 * Upload d'image pour l'admin : reçoit un fichier, le sauvegarde dans public/uploads,
 * retourne l'URL publique pour l'affecter à l'image du produit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { requireCSRF } from '@/lib/security'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_SIZE_MB = 5
const UPLOAD_DIR = 'public/uploads'

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'image'
}

export async function POST(request: NextRequest) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) return csrfCheck.error

    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error

    const formData = await request.formData()
    const file = formData.get('image') as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier image envoyé (attendu: champ "image")' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Utilisez JPEG, PNG, GIF, WebP ou SVG.' },
        { status: 400 }
      )
    }

    const maxBytes = MAX_SIZE_MB * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).` },
        { status: 400 }
      )
    }

    const ext = path.extname(file.name) || (file.type === 'image/svg+xml' ? '.svg' : '.jpg')
    const baseName = sanitizeFileName(path.basename(file.name, ext))
    const fileName = `${baseName}-${Date.now()}${ext}`
    const dir = path.join(process.cwd(), UPLOAD_DIR)
    const filePath = path.join(dir, fileName)

    await fs.mkdir(dir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    const url = `/uploads/${fileName}`
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erreur lors de l'upload: ${message}` }, { status: 500 })
  }
}
