/**
 * Vercel Blob : un store « private » refuse access: 'public' sur put().
 * Par défaut on aligne le code sur un store private (défaut Vercel récent) ;
 * si ton store est public, mets BLOB_STORE_ACCESS=public sur Vercel.
 */
import 'server-only'

/**
 * Rôle côté put() : "public" = URL Vercel directe ; "private" = /api/shop-blob?pathname=…
 */
export function getBlobPutAccess(): 'public' | 'private' {
  const v = (process.env['BLOB_STORE_ACCESS'] || '').trim().toLowerCase()
  if (v === 'public' || v === 'private') {
    return v
  }
  return 'private'
}

/**
 * Base URL absolue pour construire l’URL du proxy d’images (store private).
 */
export function getServerOriginForBlobProxy(): string {
  const fromPublic = (process.env['NEXT_PUBLIC_SITE_URL'] || '').trim().replace(/\/$/, '')
  if (fromPublic) return fromPublic
  if (process.env['VERCEL_URL']) {
    return `https://${String(process.env['VERCEL_URL']).replace(/\/$/, '')}`
  }
  if (process.env['NODE_ENV'] === 'development') {
    return 'http://localhost:3000'
  }
  return ''
}

export type PutBlobLike = { url: string; pathname: string }

/**
 * URL à enregistrer en base : URL Vercel directe si public, sinon proxy app (lecture via get() + token).
 * Private : on enregistre une URL **relative** `/api/shop-blob?...` pour que l’aperçu / le site
 * fonctionnent sur n’importe quel domaine (vercel.app, custom) sans mélange d’hôtes.
 * Les metadata (OG) préfixent déjà avec `getSiteUrlSafe()` quand l’URL commence par `/`.
 */
export function toShopImageUrl(putResult: PutBlobLike): string {
  if (getBlobPutAccess() === 'public') {
    return putResult.url
  }
  return `/api/shop-blob?pathname=${encodeURIComponent(putResult.pathname)}`
}
