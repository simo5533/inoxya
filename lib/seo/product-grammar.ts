/**
 * Formes grammaticales FR pour les textes SEO produit
 * (évite « Ce montres », « montress », etc.)
 */

export type ProductGrammar = {
  /** Singulier : montre, collier, bague… */
  singular: string
  /** Déterminant démonstratif : cette / ce / ces */
  demonstrative: string
  /** Article indéfini : une / un / des */
  indefinite: string
  /** Accords verbe passé : fabriqué / fabriquée */
  pastParticiple: 'fabriqué' | 'fabriquée' | 'fabriqués' | 'fabriquées'
  /** « contrôlé » / « contrôlée » */
  checked: 'contrôlé' | 'contrôlée' | 'contrôlés' | 'contrôlées'
  /** « convient-il » / « conviennent-elles » */
  suitQuestion: string
}

const GRAMMAR_BY_KEY: Record<string, ProductGrammar> = {
  bagues: {
    singular: 'bague',
    demonstrative: 'cette',
    indefinite: 'une',
    pastParticiple: 'fabriquée',
    checked: 'contrôlée',
    suitQuestion: 'Cette bague convient-elle',
  },
  colliers: {
    singular: 'collier',
    demonstrative: 'ce',
    indefinite: 'un',
    pastParticiple: 'fabriqué',
    checked: 'contrôlé',
    suitQuestion: 'Ce collier convient-il',
  },
  bracelets: {
    singular: 'bracelet',
    demonstrative: 'ce',
    indefinite: 'un',
    pastParticiple: 'fabriqué',
    checked: 'contrôlé',
    suitQuestion: 'Ce bracelet convient-il',
  },
  boucles: {
    singular: 'paire de boucles d\'oreilles',
    demonstrative: 'cette',
    indefinite: 'une',
    pastParticiple: 'fabriquée',
    checked: 'contrôlée',
    suitQuestion: 'Ces boucles d\'oreilles conviennent-elles',
  },
  montres: {
    singular: 'montre',
    demonstrative: 'cette',
    indefinite: 'une',
    pastParticiple: 'fabriquée',
    checked: 'contrôlée',
    suitQuestion: 'Cette montre convient-elle',
  },
  ensemble: {
    singular: 'ensemble',
    demonstrative: 'cet',
    indefinite: 'un',
    pastParticiple: 'fabriqué',
    checked: 'contrôlé',
    suitQuestion: 'Cet ensemble convient-il',
  },
  default: {
    singular: 'bijou',
    demonstrative: 'ce',
    indefinite: 'un',
    pastParticiple: 'fabriqué',
    checked: 'contrôlé',
    suitQuestion: 'Ce bijou convient-il',
  },
}

export function getProductGrammar(categoryKey: string): ProductGrammar {
  return GRAMMAR_BY_KEY[categoryKey] || GRAMMAR_BY_KEY['default']!
}

/** Phrase courte : « cette montre », « ce collier » */
export function demonstrativeNoun(categoryKey: string): string {
  const g = getProductGrammar(categoryKey)
  return `${g.demonstrative} ${g.singular}`
}
