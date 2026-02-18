/**
 * Storage Adapter pour uploads d'images
 * Dev: Filesystem local (public/images/)
 * Prod: Vercel Blob Storage (persistant, CDN)
 */

import { logger } from './logger'
import { serializeError } from './sqlite'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import sharp from 'sharp'

interface UploadResult {
  url: string
  path?: string // Chemin local en dev, undefined en prod
}

interface ImageConfig {
  width: number
  height: number
  quality: number
}

/**
 * Upload vers Vercel Blob (production)
 */
async function uploadToBlob(
  buffer: Buffer,
  filename: string,
  config: ImageConfig
): Promise<UploadResult> {
  const blobReadWriteToken = process.env['BLOB_READ_WRITE_TOKEN']
  
  if (!blobReadWriteToken) {
    throw new Error('BLOB_READ_WRITE_TOKEN non configuré')
  }

  try {
    // Lazy import de @vercel/blob (optionnel, seulement si installé)
    // Utiliser require() directement au lieu de Function constructor pour éviter eval
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const blobModule = require('@vercel/blob')
    const { put } = blobModule

    // Traiter l'image avec sharp
    const processedBuffer = await sharp(buffer)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: config.quality })
      .toBuffer()

    // Upload vers Vercel Blob
    const blob = await put(filename, processedBuffer, {
      access: 'public',
      contentType: 'image/webp',
      token: blobReadWriteToken,
    })

    logger.info(`[STORAGE] Image uploadée vers Vercel Blob: ${blob.url}`)
    return {
      url: blob.url,
    }
  } catch (error) {
    logger.error('[STORAGE] Erreur upload Vercel Blob:', serializeError(error))
    throw error
  }
}

/**
 * Upload vers filesystem local (développement)
 */
async function uploadToFilesystem(
  buffer: Buffer,
  filePath: string,
  config: ImageConfig
): Promise<UploadResult> {
  try {
    // Créer le dossier si nécessaire
    const dir = join(filePath, '..')
    await mkdir(dir, { recursive: true })

    // Traiter et sauvegarder l'image
    await sharp(buffer)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: config.quality })
      .toFile(filePath)

    // Générer l'URL relative (depuis public/)
    const publicPath = filePath.replace(join(process.cwd(), 'public'), '')
    const url = publicPath.replace(/\\/g, '/') // Normaliser les slashes pour Windows

    logger.info(`[STORAGE] Image sauvegardée localement: ${url}`)
    return {
      url,
      path: filePath,
    }
  } catch (error) {
    logger.error('[STORAGE] Erreur upload filesystem:', serializeError(error))
    throw error
  }
}

/**
 * Adapter principal : choisit automatiquement le storage selon l'environnement
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  filePath: string, // Chemin local complet (pour dev)
  config: ImageConfig
): Promise<UploadResult> {
  const isProduction = process.env['NODE_ENV'] === 'production'
  const hasBlobToken = !!process.env['BLOB_READ_WRITE_TOKEN']
  const isVercel = !!process.env['VERCEL']

  // En production sur Vercel avec token: utiliser Blob
  if (isProduction && (isVercel || hasBlobToken)) {
    try {
      return await uploadToBlob(buffer, filename, config)
    } catch (error) {
      logger.warn('[STORAGE] Échec upload Blob, fallback filesystem:', serializeError(error))
      // Fallback vers filesystem si Blob échoue
      return uploadToFilesystem(buffer, filePath, config)
    }
  }

  // Dev ou pas de token: utiliser filesystem
  return uploadToFilesystem(buffer, filePath, config)
}

/**
 * Générer le nom de fichier pour Vercel Blob
 * Format: bijoux/{category}/{productSlug}/{type}.webp
 */
export function generateBlobFilename(
  categoryFolder: string,
  productSlug: string,
  imageType: 'main' | 'gallery' | 'thumbnail',
  galleryIndex?: number
): string {
  let filename = 'main.webp'
  if (imageType === 'thumbnail') {
    filename = 'thumbnail.webp'
  } else if (imageType === 'gallery' && galleryIndex !== undefined) {
    filename = `gallery-${galleryIndex + 1}.webp`
  }

  return `bijoux/${categoryFolder}/${productSlug}/${filename}`
}

