import type { Metadata } from 'next'

/** Métadonnées noindex pour panier, checkout, auth, favoris, admin. */
export function privatePageMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false, nocache: true },
  }
}
