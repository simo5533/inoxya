import type { SeoContentPage, SeoContentFooterGroup } from './types'
import { pillarPages } from './pages/pillar'
import { matierePages } from './pages/matiere'
import { categoryPages } from './pages/categories'
import { achatPages } from './pages/achat'
import { entretienPages } from './pages/entretien'

/** Registre central — source unique pour routes /guide/[slug] */
export const SEO_CONTENT_PAGES: Record<string, SeoContentPage> = {
  ...pillarPages,
  ...matierePages,
  ...categoryPages,
  ...achatPages,
  ...entretienPages,
}

export const SEO_CONTENT_SLUGS = Object.keys(SEO_CONTENT_PAGES)

export function getSeoContentPage(slug: string): SeoContentPage | null {
  return SEO_CONTENT_PAGES[slug] ?? null
}

const CLUSTER_LABELS: Record<SeoContentPage['cluster'], string> = {
  pillar: 'Guides essentiels',
  matiere: 'Matière & qualité',
  entretien: 'Entretien',
  categorie: 'Par catégorie',
  achat: 'Achat & livraison',
  local: 'Maroc',
}

/** Groupes pour le footer « Ressources » */
export function getSeoFooterGroups(): SeoContentFooterGroup[] {
  const byCluster = new Map<SeoContentPage['cluster'], SeoContentFooterGroup>()
  for (const page of Object.values(SEO_CONTENT_PAGES)) {
    let group = byCluster.get(page.cluster)
    if (!group) {
      group = {
        cluster: page.cluster,
        label: CLUSTER_LABELS[page.cluster],
        pages: [],
      }
      byCluster.set(page.cluster, group)
    }
    group.pages.push({ slug: page.slug, label: page.h1.slice(0, 52) })
  }
  const order: SeoContentPage['cluster'][] = [
    'pillar',
    'matiere',
    'categorie',
    'entretien',
    'achat',
    'local',
  ]
  return order
    .filter((c) => byCluster.has(c))
    .map((c) => {
      const group = byCluster.get(c)
      if (!group) {
        throw new Error(`SEO cluster manquant: ${c}`)
      }
      return group
    })
}

/** Liens footer plats (affichage compact mobile) */
export function getSeoFooterLinks(limit = 12): Array<{ slug: string; label: string }> {
  return SEO_CONTENT_SLUGS.slice(0, limit).map((slug) => ({
    slug,
    label: SEO_CONTENT_PAGES[slug].title,
  }))
}
