/**
 * Disponibilité Schema.org pour Merchant Listings — basée sur les vrais flags produit.
 * Ne marque jamais InStock si l’UI indique une rupture.
 */
export type SchemaAvailability =
  | 'https://schema.org/InStock'
  | 'https://schema.org/OutOfStock'
  | 'https://schema.org/PreOrder'
  | 'https://schema.org/Discontinued'

export type AvailabilityProductInput = {
  is_available?: boolean | null
  is_active?: boolean | null
  stock?: number | null
  /** Précommande explicite (optionnel) */
  is_preorder?: boolean | null
  /** Arrêt de commercialisation (optionnel) */
  is_discontinued?: boolean | null
}

/**
 * Calcule offers.availability depuis stock + flags.
 */
export function getSchemaAvailability(product: AvailabilityProductInput): SchemaAvailability {
  if (product.is_discontinued === true) {
    return 'https://schema.org/Discontinued'
  }
  if (product.is_preorder === true) {
    return 'https://schema.org/PreOrder'
  }

  const flaggedUnavailable = product.is_available === false || product.is_active === false
  if (flaggedUnavailable) {
    return 'https://schema.org/OutOfStock'
  }

  if (typeof product.stock === 'number' && Number.isFinite(product.stock)) {
    if (product.stock <= 0) return 'https://schema.org/OutOfStock'
    return 'https://schema.org/InStock'
  }

  // Pas de stock numérique : se fier à is_available (défaut en stock si non false)
  return product.is_available === false
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock'
}

export function isSchemaInStock(availability: SchemaAvailability): boolean {
  return availability === 'https://schema.org/InStock' || availability === 'https://schema.org/PreOrder'
}
