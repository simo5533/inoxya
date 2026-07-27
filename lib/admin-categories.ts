/**
 * Catégories du formulaire admin produit (création / édition / filtres).
 * `dbValue` = valeur stockée dans products.category (historique DB croisé).
 */
export type AdminCategoryOption = {
  id: string
  name: string
  slug: string
  dbValue: string
}

export const ADMIN_PRODUCT_CATEGORIES: AdminCategoryOption[] = [
  { id: 'cat-bagues', name: 'Bagues', slug: 'bagues', dbValue: 'Bagues' },
  { id: 'cat-colliers', name: 'Colliers', slug: 'colliers', dbValue: 'Montres' },
  { id: 'cat-montres', name: 'Montres', slug: 'montres', dbValue: 'Parures' },
  { id: 'cat-parures', name: 'Parures', slug: 'parures', dbValue: 'Colliers' },
  { id: 'cat-bracelets', name: 'Bracelets', slug: 'bracelets', dbValue: 'Bracelets' },
  { id: 'cat-boucles', name: "Boucles d'oreilles", slug: 'boucles-oreilles', dbValue: "Boucles d'oreilles" },
  { id: 'cat-broches', name: 'Nos packs', slug: 'broches', dbValue: 'Nos packs' },
]

export const ADMIN_CATEGORY_ID_TO_DB: Record<string, string> = Object.fromEntries(
  ADMIN_PRODUCT_CATEGORIES.map((c) => [c.id, c.dbValue])
)

export const ADMIN_DB_TO_CATEGORY_ID: Record<string, string> = Object.fromEntries(
  ADMIN_PRODUCT_CATEGORIES.map((c) => [c.dbValue, c.id])
)

export function adminCategoryIdToDbValue(categoryId: string): string {
  return ADMIN_CATEGORY_ID_TO_DB[categoryId] ?? categoryId
}

export function adminDbValueToCategoryId(dbValue: string): string {
  return ADMIN_DB_TO_CATEGORY_ID[dbValue] ?? 'cat-bagues'
}
