/**
 * Upload d’image admin (page *modifier* produit, etc.).
 * En local : fichiers dans public/ ; sur Vercel : Vercel Blob (public/ n’est pas persistant / écriture refusée).
 */
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import sharp from 'sharp'
import { requireAdminApi } from '@/lib/admin-auth'
import { requireCSRF } from '@/lib/security'
import { uploadImage, generateAdminUploadBlobKey } from '@/lib/storage-adapter'
import { getBlobPutAccess, toShopImageUrl, isBlobConfigured, getBlobSdkAuthOptions, getBlobConfigErrorHint } from '@/lib/blob-helpers'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RASTER_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_TYPES = [...RASTER_TYPES, 'image/svg+xml']
const MAX_SIZE_BYTES = 4 * 1024 * 1024 // aligné Vercel Blob / function

function sanitizeBase(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'image'
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

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 4 Mo).' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base = sanitizeBase(file.name.replace(/\.[^.]+$/, ''))

    // SVG : pas de sharp ; Blob en prod, disque en dev
    if (file.type === 'image/svg+xml') {
      const isVercel = process.env.VERCEL === '1'
      const isProd = process.env.NODE_ENV === 'production'
      if (isProd && isVercel) {
        if (!isBlobConfigured()) {
          return NextResponse.json(
            { error: `SVG en prod: ${getBlobConfigErrorHint()}` },
            { status: 500 }
          )
        }
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { put } = require('@vercel/blob') as {
          put: (name: string, data: Buffer, o: object) => Promise<{ url: string; pathname: string }>
        }
        const key = `admin/shop/${Date.now()}-${base}.svg`
        const blob = await put(key, buffer, {
          access: getBlobPutAccess(),
          contentType: 'image/svg+xml',
          addRandomSuffix: true,
          ...getBlobSdkAuthOptions(),
        })
        return NextResponse.json({ url: toShopImageUrl(blob) })
      }
      const fileName = `${base}-${Date.now()}.svg`
      const dir = join(process.cwd(), 'public', 'uploads')
      await fs.mkdir(dir, { recursive: true })
      const filePath = join(dir, fileName)
      await fs.writeFile(filePath, buffer)
      return NextResponse.json({ url: `/uploads/${fileName}` })
    }

    // Raster : validation sharp + uploadImage (Blob ou disque)
    const meta = await sharp(buffer).metadata()
    if (!meta.format || !['jpeg', 'png', 'webp', 'gif'].includes(meta.format)) {
      return NextResponse.json({ error: "Fichier image invalide" }, { status: 400 })
    }

    const blobKey = generateAdminUploadBlobKey(base)
    const localPath = join(process.cwd(), 'public', 'uploads', `${Date.now()}-admin.webp`)

    const { url } = await uploadImage(buffer, blobKey, localPath, {
      width: 1600,
      height: 1600,
      quality: 88,
    })
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        error: "Erreur lors de l'upload de l'image",
        details: message,
      },
      { status: 500 }
    )
  }
}
