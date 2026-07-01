/**
 * Catégories du formulaire admin produit (création / édition / filtres).
 * `dbValue` = valeur stockée dans products.category
 */
export type AdminCategoryOption = {
  id: string
  name: string
  slug: string
  dbValue: string
}

export const ADMIN_PRODUCT_CATEGORIES: AdminCategoryOption[] = [
  { id: 'cat-bagues', name: 'Bagues', slug: 'bagues', dbValue: 'Bagues' },
  { id: 'cat-colliers', name: 'Ensemble', slug: 'colliers', dbValue: 'Colliers' },
  { id: 'cat-montres', name: 'Colliers', slug: 'montres', dbValue: 'Montres' },
  { id: 'cat-parures', name: 'Montres', slug: 'parures', dbValue: 'Parures' },
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
