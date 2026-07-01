import type { SeoContentPage } from './types'

/** Compte les mots du contenu visible (hors métadonnées). */
export function countSeoPageWords(page: SeoContentPage): number {
  const chunks: string[] = [
    page.intro,
    ...page.sections.flatMap((s) => [
      s.h2,
      s.intro ?? '',
      ...(s.paragraphs ?? []),
      ...(s.subsections?.flatMap((sub) => [sub.h3, ...sub.paragraphs]) ?? []),
      ...(s.table?.rows.flat() ?? []),
    ]),
    ...(page.comparison?.rows.flatMap((r) => [r.label, r.acier316l, r.autre]) ?? []),
    ...page.faq.flatMap((f) => [f.question, f.answer]),
  ]
  return chunks
    .join(' ')
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}

export function getRelatedPages(
  page: SeoContentPage,
  all: Record<string, SeoContentPage>,
  limit = 4
): SeoContentPage[] {
  const seen = new Set<string>([page.slug])
  const out: SeoContentPage[] = []
  for (const slug of page.relatedSlugs) {
    if (seen.has(slug) || !all[slug]) continue
    seen.add(slug)
    out.push(all[slug])
    if (out.length >= limit) break
  }
  if (out.length < limit) {
    for (const p of Object.values(all)) {
      if (p.cluster === page.cluster && !seen.has(p.slug)) {
        seen.add(p.slug)
        out.push(p)
        if (out.length >= limit) break
      }
    }
  }
  return out
}
