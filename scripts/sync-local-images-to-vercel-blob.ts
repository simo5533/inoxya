/**
 * Synchronise les images « locales » (chemins /images/, /uploads/, localhost)
 * vers Vercel Blob et met à jour products, packs, categories dans Supabase.
 *
 * À lancer sur la machine où se trouve le dossier public/ (ton PC).
 *
 * Prérequis .env.local :
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   BLOB_READ_WRITE_TOKEN (hors --dry-run : la simulation n’en a pas besoin)
 *   BLOB_STORE_ACCESS = public | private (aligné sur le store Vercel)
 *   (Les URLs enregistrées sont relatives /api/shop-blob?... ; inutile de forcer NEXT_PUBLIC_SITE_URL pour ça.)
 *
 * Usage:
 *   npx tsx scripts/sync-local-images-to-vercel-blob.ts           # exécution
 *   npx tsx scripts/sync-local-images-to-vercel-blob.ts --dry-run # simulation
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { put } from '@vercel/blob'
import sharp from 'sharp'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const DRY = process.argv.includes('--dry-run')

function getBlobPutAccess(): 'public' | 'private' {
  const v = (process.env['BLOB_STORE_ACCESS'] || '').trim().toLowerCase()
  if (v === 'public' || v === 'private') return v
  return 'private'
}

function toShopImageUrl(blob: { url: string; pathname: string }): string {
  if (getBlobPutAccess() === 'public') return blob.url
  return `/api/shop-blob?pathname=${encodeURIComponent(blob.pathname)}`
}

function isLocalImageRef(s: string | null | undefined): boolean {
  if (!s || typeof s !== 'string') return false
  const t = s.trim()
  if (t.startsWith('blob:') || t.startsWith('data:')) return false
  if (/^https?:\/\//i.test(t)) {
    return /localhost|127\.0\.0\.1/i.test(t)
  }
  if (t.startsWith('//')) return false
  return t.startsWith('/images/') || t.startsWith('/uploads/')
}

function urlToPublicFilePath(ref: string): string | null {
  let p = ref.trim()
  try {
    if (/^https?:\/\//i.test(p)) {
      const u = new URL(p)
      if (!/localhost|127\.0\.0\.1/i.test(u.hostname)) return null
      p = u.pathname || '/'
    }
  } catch {
    return null
  }
  if (!p.startsWith('/')) return null
  const rel = p.replace(/^\/+/, '')
  const full = path.join(process.cwd(), 'public', rel)
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return full
  return null
}

async function uploadFileToBlob(
  filePath: string,
  objectKeyPrefix: string
): Promise<string> {
  const token = process.env['BLOB_READ_WRITE_TOKEN']
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN manquant')

  const ext = path.extname(filePath).toLowerCase()
  const buf = fs.readFileSync(filePath)
  const access = getBlobPutAccess()
  const baseName = `${objectKeyPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  if (ext === '.svg') {
    const key = `migration/local/${baseName}.svg`
    const blob = await put(key, buf, {
      access,
      contentType: 'image/svg+xml',
      token,
      addRandomSuffix: true,
    })
    return toShopImageUrl(blob)
  }

  const meta = await sharp(buf).metadata()
  if (!meta.format || !['jpeg', 'png', 'webp', 'gif'].includes(meta.format)) {
    throw new Error(`Format non supporté: ${filePath}`)
  }
  const webp = await sharp(buf)
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer()

  const key = `migration/local/${baseName}.webp`
  const blob = await put(key, webp, {
    access,
    contentType: 'image/webp',
    token,
    addRandomSuffix: true,
  })
  return toShopImageUrl(blob)
}

async function migrateUrl(ref: string | null, keyPrefix: string): Promise<string | null> {
  if (ref == null || ref === '') return null
  if (!isLocalImageRef(ref)) return ref
  const filePath = urlToPublicFilePath(ref)
  if (!filePath) {
    console.warn(`   ⚠️  Fichier introuvable pour: ${ref.slice(0, 80)}`)
    return ref
  }
  if (DRY) {
    console.log(`   [dry-run] upload ${filePath} → Blob`)
    return ref
  }
  const url = await uploadFileToBlob(filePath, keyPrefix)
  await new Promise((r) => setTimeout(r, 150))
  return url
}

async function migrateImagesArray(arr: unknown, keyPrefix: string): Promise<string[]> {
  let list: string[] = []
  if (Array.isArray(arr)) {
    list = arr.filter((x): x is string => typeof x === 'string')
  } else if (typeof arr === 'string') {
    try {
      const p = JSON.parse(arr)
      list = Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []
    } catch {
      list = []
    }
  }
  const out: string[] = []
  for (const u of list) {
    const m = await migrateUrl(u, `${keyPrefix}-g`)
    out.push(m ?? u)
  }
  return out
}

async function main() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!supabaseUrl || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local')
    process.exit(1)
  }
  if (!DRY && !process.env['BLOB_READ_WRITE_TOKEN']) {
    console.error('❌ BLOB_READ_WRITE_TOKEN requis (sauf en --dry-run)')
    process.exit(1)
  }
  const supabase = createClient(supabaseUrl, key)
  console.log(DRY ? '🔍 Mode --dry-run (aucune écriture Blob/Supabase)\n' : '🚀 Synchronisation images → Blob + Supabase\n')

  let productsUpdated = 0
  let packsUpdated = 0

  const pageSize = 100
  for (let from = 0; ; from += pageSize) {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, image_url, images')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('❌ Lecture products:', error.message)
      break
    }
    if (!products?.length) break

    for (const row of products) {
      const id = row.id
      const img = row.image_url as string | null
      const imagesCol = row.images

      const needMain = isLocalImageRef(img)
      let needGallery = false
      if (imagesCol != null) {
        const list = Array.isArray(imagesCol)
          ? imagesCol
          : typeof imagesCol === 'string'
            ? (() => {
                try {
                  const p = JSON.parse(imagesCol as string)
                  return Array.isArray(p) ? p : []
                } catch {
                  return []
                }
              })()
            : []
        needGallery = list.some((u) => typeof u === 'string' && isLocalImageRef(u))
      }

      if (!needMain && !needGallery) continue

      console.log(`📷 Produit id=${id}`)
      try {
        let newMain = img
        if (needMain) {
          newMain = (await migrateUrl(img, `p${id}`)) ?? img
        }
        let newImages = imagesCol
        if (needGallery) {
          newImages = await migrateImagesArray(imagesCol, `p${id}`)
        }
        if (!DRY) {
          const { error: upErr } = await supabase
            .from('products')
            .update({
              image_url: newMain,
              images: newImages,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
          if (upErr) console.error('   ❌ Update:', upErr.message)
          else productsUpdated++
        } else {
          productsUpdated++
        }
      } catch (e) {
        console.error('   ❌', e instanceof Error ? e.message : e)
      }
    }
  }

  for (let from = 0; ; from += pageSize) {
    const { data: packs, error } = await supabase
      .from('packs')
      .select('id, image_url')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('❌ Lecture packs:', error.message)
      break
    }
    if (!packs?.length) break

    for (const row of packs) {
      const id = row.id
      const img = row.image_url as string | null
      if (!isLocalImageRef(img)) continue
      console.log(`📦 Pack id=${id}`)
      try {
        const newUrl = (await migrateUrl(img, `pack${id}`)) ?? img
        if (!DRY) {
          const { error: upErr } = await supabase.from('packs').update({ image_url: newUrl }).eq('id', id)
          if (upErr) console.error('   ❌ Update:', upErr.message)
          else packsUpdated++
        } else {
          packsUpdated++
        }
      } catch (e) {
        console.error('   ❌', e instanceof Error ? e.message : e)
      }
    }
  }

  let categoriesUpdated = 0
  for (let from = 0; ; from += pageSize) {
    const { data: cats, error } = await supabase
      .from('categories')
      .select('id, image_url')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      // Table absente / hors cache schéma PostgREST
      const msg = error.message || ''
      const code = (error as { code?: string }).code
      if (
        /schema cache|could not find the table|42P01|relation .* does not exist/i.test(msg) ||
        code === 'PGRST205'
      ) {
        break
      }
      console.error('❌ Lecture categories:', error.message)
      break
    }
    if (!cats?.length) break

    for (const row of cats) {
      const id = row.id
      const img = row.image_url as string | null
      if (!isLocalImageRef(img)) continue
      console.log(`📁 Catégorie id=${id}`)
      try {
        const newUrl = (await migrateUrl(img, `cat${id}`)) ?? img
        if (!DRY) {
          const { error: upErr } = await supabase.from('categories').update({ image_url: newUrl }).eq('id', id)
          if (upErr) console.error('   ❌ Update:', upErr.message)
          else categoriesUpdated++
        } else {
          categoriesUpdated++
        }
      } catch (e) {
        console.error('   ❌', e instanceof Error ? e.message : e)
      }
    }
  }

  console.log(
    `\n✅ Terminé. ${DRY ? '(simulation) ' : ''}Produits: ${productsUpdated}, packs: ${packsUpdated}, catégories: ${categoriesUpdated}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
