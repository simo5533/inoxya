import { NextRequest, NextResponse } from 'next/server'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { generateSlug, getCategoryFolder } from '@/lib/image-utils'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { checkRateLimit, requireCSRF } from '@/lib/security'
import { uploadImage, generateBlobFilename } from '@/lib/storage-adapter'

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

// Types MIME autorisés (whitelist stricte)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
// Vercel (Blob + function) : rester < ~4,5 Mo côté requête / put serveur
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 Mo

export async function POST(request: NextRequest) {
  try {
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) return csrfCheck.error

    // SÉCURITÉ: Vérification authentification admin obligatoire
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      logger.warn('[SECURITY] Upload attempt without admin auth')
      return NextResponse.json(
        { error: 'Accès non autorisé. Seuls les administrateurs peuvent uploader des images.' },
        { status: 403 }
      )
    }

    // SÉCURITÉ: Rate limiting pour prévenir les abus d'upload
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const rateCheck = await checkRateLimit(`upload_${clientIP}`)
    if (!rateCheck.allowed) {
      logger.warn(`[SECURITY] Upload rate limit triggered for IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Trop de tentatives d\'upload. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    // productId kept for API compatibility but not used
    formData.get('productId')
    const productName = formData.get('productName') as string
    const categoryId = formData.get('categoryId') as string
    const imageType = (formData.get('imageType') as string) || 'main'
    const galleryIndex = formData.get('galleryIndex') ? parseInt(formData.get('galleryIndex') as string) : undefined

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (!productName || !categoryId) {
      return NextResponse.json({ error: 'Nom produit et catégorie requis' }, { status: 400 })
    }

    // SÉCURITÉ: Validation stricte du type MIME (whitelist)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      logger.warn(`[SECURITY] Rejected file upload with MIME type: ${file.type}`)
      return NextResponse.json({ error: 'Type de fichier non autorisé. Formats acceptés: JPEG, PNG, WebP, GIF' }, { status: 400 })
    }

    // SÉCURITÉ: Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'Fichier trop volumineux (max 4 Mo) — Vercel limite les gros envois; compressez l’image.',
        },
        { status: 400 }
      )
    }

    // Générer les chemins
    const categoryFolder = getCategoryFolder(categoryId)
    const productSlug = generateSlug(productName)
    const productDir = join(process.cwd(), 'public', 'images', 'bijoux', categoryFolder, productSlug)

    // Créer le dossier si nécessaire (pour dev fallback)
    await mkdir(productDir, { recursive: true }).catch(() => {
      // Ignorer l'erreur si le dossier existe déjà ou si on est en prod avec Blob
    })

    // Déterminer le nom du fichier
    let filename = 'main.webp'
    if (imageType === 'thumbnail') {
      filename = 'thumbnail.webp'
    } else if (imageType === 'gallery' && galleryIndex !== undefined) {
      filename = `gallery-${galleryIndex + 1}.webp`
    }

    const filePath = join(productDir, filename)
    const blobFilename = generateBlobFilename(categoryFolder, productSlug, imageType as 'main' | 'gallery' | 'thumbnail', galleryIndex)

    // Lire le fichier et valider le contenu
    const fileBytes = await file.arrayBuffer()
    const imageBuffer = Buffer.from(fileBytes)
    
    // SÉCURITÉ: Validation du contenu via sharp (vérifie que c'est une vraie image)
    try {
      const metadata = await sharp(imageBuffer).metadata()
      if (!metadata.format || !['jpeg', 'png', 'webp', 'gif'].includes(metadata.format)) {
        logger.warn(`[SECURITY] Invalid image format detected: ${metadata.format}`)
        return NextResponse.json({ error: 'Format d\'image non valide' }, { status: 400 })
      }
    } catch {
      logger.warn('[SECURITY] File is not a valid image (sharp validation failed)')
      return NextResponse.json({ error: 'Le fichier n\'est pas une image valide' }, { status: 400 })
    }

    // Configuration selon le type
    const configs = {
      main: { width: 800, height: 800, quality: 90 },
      gallery: { width: 600, height: 600, quality: 85 },
      thumbnail: { width: 200, height: 200, quality: 80 }
    }

    const config = configs[imageType as keyof typeof configs] || configs.main

    // Upload via storage adapter (Blob en prod, filesystem en dev)
    const uploadResult = await uploadImage(
      imageBuffer,
      blobFilename,
      filePath,
      config
    )

    // Miniature (2e put Blob) : ne pas faire échouer tout l’upload si celui-ci seul échoue
    if (imageType === 'main') {
      const thumbBlobFilename = generateBlobFilename(categoryFolder, productSlug, 'thumbnail')
      const thumbPath = join(productDir, 'thumbnail.webp')
      try {
        await uploadImage(
          imageBuffer,
          thumbBlobFilename,
          thumbPath,
          { width: 200, height: 200, quality: 80 }
        )
      } catch (thumbErr) {
        logger.warn('[upload/product-image] Miniature non créée (image principale OK):', {
          err: thumbErr instanceof Error ? thumbErr.message : String(thumbErr),
        })
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.url,
      path: uploadResult.path // undefined en prod avec Blob
    })
  } catch (error: unknown) {
    const errorMessage = (() => {
      if (error instanceof Error) return error.message
      if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message)
      }
      return 'Erreur inconnue'
    })()
    logger.error('Erreur upload image:', { error: errorMessage, name: error instanceof Error ? error.name : undefined })
    let hint = ''
    if (/BLOB_READ_WRITE_TOKEN|vercel.*blob|@vercel\/blob/i.test(errorMessage)) {
      hint =
        ' Vérifiez Vercel → Projet → Storage (Blob) connecté, variable BLOB_READ_WRITE_TOKEN, puis Redeploy.'
    }
    return NextResponse.json(
      {
        error: "Erreur lors de l'upload de l'image",
        details: errorMessage + hint,
      },
      { status: 500 }
    )
  }
}

