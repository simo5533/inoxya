/**
 * Architecture SEO longue traîne — types partagés.
 * Ajoutez une page : créez l'entrée dans lib/seo/content/pages/ puis enregistrez-la dans registry.ts
 */

export type SeoContentCluster =
  | 'pillar'
  | 'matiere'
  | 'entretien'
  | 'categorie'
  | 'achat'
  | 'local'

export type SeoTable = {
  caption?: string
  headers: string[]
  rows: string[][]
}

export type SeoSubsection = {
  h3: string
  paragraphs: string[]
}

export type SeoSection = {
  h2: string
  intro?: string
  paragraphs?: string[]
  subsections?: SeoSubsection[]
  table?: SeoTable
  image?: {
    src: string
    alt: string
    caption?: string
  }
}

export type SeoComparisonRow = {
  label: string
  acier316l: string
  autre: string
}

export type SeoContentPage = {
  slug: string
  cluster: SeoContentCluster
  /** Mot-clé principal ciblé */
  keyword: string
  title: string
  metaDescription: string
  h1: string
  intro: string
  sections: SeoSection[]
  comparison?: {
    title: string
    headers: [string, string, string]
    rows: SeoComparisonRow[]
  }
  faq: Array<{ question: string; answer: string }>
  /** Slugs de pages liées (maillage interne) */
  relatedSlugs: string[]
  /** Liens vers collections / packs */
  collectionLinks: Array<{ label: string; path: string }>
  cta: {
    title: string
    description: string
    primaryPath: string
    primaryLabel: string
    secondaryPath?: string
    secondaryLabel?: string
  }
  publishedAt: string
  updatedAt: string
}

export type SeoContentFooterGroup = {
  cluster: SeoContentCluster
  label: string
  pages: Array<{ slug: string; label: string }>
}
