/**
 * Mapping canonique des catégories
 * Garantit la cohérence entre DB, API et Frontend
 */

export interface CategoryDefinition {
  label: string
  dbValue: string // Valeur stockée dans products.category
  slug: string // Slug utilisé dans les URLs
  subtitle?: string
}

/**
 * Mapping canonique des catégories
 * ID → Nom → Slug
 */
export const CATEGORIES: Record<string, CategoryDefinition> = {
  bagues: {
    label: 'Bagues',
    dbValue: 'Bagues',
    slug: 'bagues',
    subtitle: 'Collection de bagues berbères et modernes'
  },
  colliers: {
    label: 'Ensemble',
    dbValue: 'Colliers',
    slug: 'colliers',
    subtitle: 'Ensembles assortis de bijoux en acier inoxydable'
  },
  bracelets: {
    label: 'Bracelets',
    dbValue: 'Bracelets',
    slug: 'bracelets',
    subtitle: 'Bracelets élégants et résistants'
  },
  'boucles-oreilles': {
    label: "Boucles d'oreilles",
    dbValue: "Boucles d'oreilles",
    slug: 'boucles-oreilles',
    subtitle: "Boucles d'oreilles traditionnelles et modernes"
  },
  parures: {
    label: 'Montres',
    dbValue: 'Parures',
    slug: 'parures',
    subtitle: 'Montres élégantes et précises'
  },
  montres: {
    label: 'Colliers',
    dbValue: 'Montres',
    slug: 'montres',
    subtitle: 'Colliers traditionnels et contemporains'
  },
  broches: {
    label: 'Nos packs',
    dbValue: 'Nos packs',
    slug: 'broches',
    subtitle: 'Packs exclusifs de bijoux à prix avantageux'
  }
}

/**
 * Mapping ID → Nom (pour migration)
 */
export const CATEGORY_ID_TO_NAME: Record<number, string> = {
  1: 'Bagues',
  2: 'Colliers',
  3: 'Bracelets',
  4: "Boucles d'oreilles",
  5: 'Nos packs',
  55: 'Montres'
}

/**
 * Convertit un slug en valeur DB
 */
export function slugToDbValue(slug: string): string | null {
  const category = CATEGORIES[slug]
  return category ? category.dbValue : null
}

/**
 * Convertit une valeur DB en slug
 */
export function dbValueToSlug(dbValue: string): string | null {
  // Parures (ensembles) → carte Montres ; produits « Montres » → slug montres (carte Colliers)
  if (dbValue === 'Parures') return 'parures'
  for (const [slug, category] of Object.entries(CATEGORIES)) {
    if (category.dbValue === dbValue && slug !== 'parures') {
      return slug
    }
  }
  return null
}

/**
 * Convertit un ID numérique en valeur DB
 */
export function idToDbValue(id: number | string): string | null {
  const numId = typeof id === 'string' ? parseFloat(id) : id
  return CATEGORY_ID_TO_NAME[Math.floor(numId)] || null
}

/**
 * Normalise une valeur de catégorie (ID numérique, nom, ou slug) vers la valeur DB canonique
 */
export function normalizeCategoryValue(value: string | number): string | null {
  if (typeof value === 'number' || (!isNaN(parseFloat(value)))) {
    // C'est un ID numérique
    return idToDbValue(parseFloat(String(value)))
  }

  // Vérifier si c'est déjà une valeur DB
  for (const category of Object.values(CATEGORIES)) {
    if (category.dbValue === value) {
      return category.dbValue
    }
  }

  // Vérifier si c'est un slug
  const category = CATEGORIES[value]
  if (category) {
    return category.dbValue
  }

  return null
}

/**
 * Liste de toutes les catégories (pour itération)
 */
export const ALL_CATEGORIES = Object.values(CATEGORIES)

/** Libellé affiché pour une valeur stockée en base (products.category, panier, etc.) */
export function categoryDbValueToDisplayName(dbValue: string): string {
  for (const cat of Object.values(CATEGORIES)) {
    if (cat.dbValue === dbValue) {
      return cat.label
    }
  }
  return dbValue
}

/**
 * Titre + sous-titre des cartes catégorie : mapping canonique prioritaire sur la ligne DB
 * (évite « Colliers » / textes seed obsolètes si Supabase/SQLite n’a pas été migré).
 */
export function resolveCategoryCardDisplay(
  slug: string,
  dbName: string,
  dbDescription?: string
): { name: string; description?: string } {
  const def = CATEGORIES[slug]
  if (def) {
    return { name: def.label, description: def.subtitle }
  }
  return { name: dbName, description: dbDescription }
}

