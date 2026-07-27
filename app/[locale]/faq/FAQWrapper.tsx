'use client'

import FAQClient from './FAQClient'

/**
 * Wrapper client — le contenu FAQ est rendu côté serveur via FAQClient (SSR activé).
 * Les interactions (accordéon, recherche) restent client.
 */
export default function FAQWrapper() {
  return <FAQClient />
}
