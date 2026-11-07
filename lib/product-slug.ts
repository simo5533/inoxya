/**
 * Slugs URL produits persistants — INOXYA
 * Format public : /{locale}/bijoux/{slug}
 * Les IDs internes (numériques / prod-*) restent inchangés.
 */

import { CATEGORY_SEO_SLUGS } from '@/lib/seo/categories'
import { generateSlug } from '@/lib/image-utils'

const RESERVED_PRODUCT_SLUGS = new Set<string>([
  ...(CATEGORY_SEO_SLUGS as string[]),
  'creer',
  'nouveau',
  'new',
  'search',
  'favoris',
  'packs',
])

export type ProductSlugSource = {
  id: string | number
  name?: string | null
  slug?: string | null
}

/** Slugifie un nom produit (sans accents, tirets). */
export function slugifyProductName(name: string): string {
  return generateSlug(String(name || '').trim())
}

/** Suffixe court stable dérivé de l’id (unicité). */
export function shortProductId(id: string | number): string {
  const raw = String(id ?? '').trim()
  if (!raw) return 'x'
  const alnum = raw.replace(/[^a-zA-Z0-9]/g, '')
  if (alnum.length <= 8) return alnum.toLowerCase() || 'x'
  return alnum.slice(-8).toLowerCase()
}

export function isReservedProductSlug(slug: string): boolean {
  const s = String(slug || '').trim().toLowerCase()
  if (!s) return true
  if (RESERVED_PRODUCT_SLUGS.has(s)) return true
  if (/^\d+$/.test(s)) return true
  return false
}

export function isLikelyProductIdParam(param: string): boolean {
  const p = String(param || '').trim()
  if (!p) return false
  if (/^\d+$/.test(p)) return true
  if (/^prod-/i.test(p)) return true
  return false
}

export function isValidStoredProductSlug(slug: string | null | undefined): boolean {
  if (!slug || typeof slug !== 'string') return false
  const s = slug.trim().toLowerCase()
  if (!s || s.length < 2 || s.length > 120) return false
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return false
  if (isReservedProductSlug(s)) return false
  return true
}

function uniqueCandidate(base: string, id: string | number, occupied: Set<string>): string {
  let root = base
  if (!root || isReservedProductSlug(root)) {
    root = `bijou-${shortProductId(id)}`
  }
  let candidate = root
  if (occupied.has(candidate) || isReservedProductSlug(candidate)) {
    candidate = `${root}-${shortProductId(id)}`
  }
  let n = 0
  while (occupied.has(candidate) || isReservedProductSlug(candidate)) {
    n += 1
    candidate = `${root}-${shortProductId(id)}-${n}`
    if (n > 80) {
      candidate = `bijou-${shortProductId(id)}-${n}`
      break
    }
  }
  return candidate
}

/**
 * Calcule le slug public d’un produit (hors catalogue).
 * Conserve `product.slug` s’il est valide.
 */
export function resolveProductSlug(product: ProductSlugSource): string {
  const stored = product.slug?.trim().toLowerCase()
  if (stored && isValidStoredProductSlug(stored)) return stored

  const base = slugifyProductName(product.name || '')
  return uniqueCandidate(base, product.id, new Set())
}

/**
 * Assigne des slugs uniques pour un catalogue entier.
 * Priorité aux slugs déjà stockés valides.
 */
export function assignProductSlugs(
  products: ProductSlugSource[]
): Map<string, string> {
  const result = new Map<string, string>()
  const occupied = new Set<string>()

  for (const p of products) {
    const id = String(p.id)
    if (isValidStoredProductSlug(p.slug)) {
      const s = String(p.slug).trim().toLowerCase()
      if (!occupied.has(s)) {
        occupied.add(s)
        result.set(id, s)
      }
    }
  }

  for (const p of products) {
    const id = String(p.id)
    if (result.has(id)) continue
    const base = slugifyProductName(p.name || '')
    const slug = uniqueCandidate(base, id, occupied)
    occupied.add(slug)
    result.set(id, slug)
  }

  return result
}

export function resolveProductSlugInCatalog(
  product: ProductSlugSource,
  catalog: ProductSlugSource[]
): string {
  const map = assignProductSlugs(catalog)
  return map.get(String(product.id)) || resolveProductSlug(product)
}

/** Path relatif SEO : `/bijoux/{slug}` */
export function productSeoPath(product: ProductSlugSource): string {
  return `/bijoux/${resolveProductSlug(product)}`
}

/** Lien app : `/{locale}/bijoux/{slug}` */
export function productHref(locale: string, product: ProductSlugSource): string {
  const loc = locale === 'ar' ? 'ar' : 'fr'
  return `/${loc}${productSeoPath(product)}`
}
