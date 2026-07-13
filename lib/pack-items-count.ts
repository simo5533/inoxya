/**
 * Nombre de pièces d’un pack — stocké sans migration DB via marqueur dans la description.
 * Marqueur: [[pieces:N]] (non visible côté client après nettoyage).
 */

const PIECES_RE = /\[\[pieces:(\d{1,3})\]\]/i

export function extractPackItemsCount(description?: string | null): number {
  if (!description) return 1
  const match = description.match(PIECES_RE)
  if (!match?.[1]) return 1
  const n = parseInt(match[1], 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, 99)
}

export function stripPackItemsCountMarker(description?: string | null): string {
  if (!description) return ''
  return description.replace(PIECES_RE, '').replace(/\n{3,}/g, '\n\n').trim()
}

export function withPackItemsCountMarker(
  description: string | null | undefined,
  itemsCount: number
): string {
  const clean = stripPackItemsCountMarker(description)
  const n = Math.max(1, Math.min(99, Math.floor(Number(itemsCount) || 1)))
  const marker = `[[pieces:${n}]]`
  return clean ? `${clean}\n${marker}` : marker
}
