/**
 * Normalisation des chemins d'images pour la production - INOXYA BIJOUX
 * Remplace les chemins absolus Windows (C:\...) par un chemin web sûr.
 * Utilisé côté serveur (API, SSR) pour que les réponses JSON ne contiennent jamais de chemins locaux.
 */

/** Placeholder affiché quand l'image n'est pas disponible (chemin invalide ou fichier manquant). */
export const PLACEHOLDER_IMAGE = '/placeholder.svg'

/**
 * Indique si la chaîne ressemble à un chemin absolu Windows.
 */
export function isAbsoluteWindowsPath(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false
  const t = value.trim()
  return (
    t.includes(':\\') ||
    /^[A-Za-z]:\\/.test(t) ||
    t.startsWith('C:\\') ||
    t.startsWith('D:\\')
  )
}

/**
 * Normalise une URL ou chemin d'image pour la production.
 * - Chemins absolus Windows → placeholder (non utilisables en production).
 * - Chaîne vide / null / undefined → placeholder.
 * - Déjà relatif (/) ou URL (http/https) → inchangé.
 */
export function normalizeImageUrl(value: string | null | undefined): string {
  if (value == null || value === '') return PLACEHOLDER_IMAGE
  const s = value.trim()
  if (!s) return PLACEHOLDER_IMAGE
  if (isAbsoluteWindowsPath(s)) return PLACEHOLDER_IMAGE
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('/')) return s
  return `/${s}`.replace(/\/+/g, '/')
}

/**
 * Normalise un tableau d'URLs d'images (ex: gallery).
 */
export function normalizeImageUrls(values: (string | null | undefined)[] | string | null | undefined): string[] {
  if (values == null) return []
  const arr = Array.isArray(values) ? values : [values]
  return arr.map(normalizeImageUrl).filter((u) => u !== PLACEHOLDER_IMAGE || arr.length === 1)
}

/**
 * Helper sécurisé pour obtenir une source d'image valide
 * Vérifie si l'image existe et retourne un placeholder si nécessaire
 * Utilisable côté client et serveur
 * IMPORTANT: Retourne toujours la même valeur côté serveur et client pour éviter les erreurs d'hydratation
 */
export function getSafeImageSrc(src: string | null | undefined): string {
  if (!src) return PLACEHOLDER_IMAGE
  
  // Normaliser d'abord
  const normalized = normalizeImageUrl(src)
  
  // Si c'est déjà le placeholder, le retourner
  if (normalized === PLACEHOLDER_IMAGE) return PLACEHOLDER_IMAGE
  
  // Pour éviter les erreurs d'hydratation, on ne vérifie PAS l'existence du fichier
  // côté serveur. Next.js Image gérera les erreurs de chargement automatiquement.
  // On retourne toujours la valeur normalisée pour garantir la cohérence serveur/client.
  return normalized
}