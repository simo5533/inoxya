/**
 * Rate limiting par action publique (checkout, avis, etc.)
 * Fenêtre fixe en mémoire — distincte de la logique login (tentatives échouées).
 * En prod multi-instances : préférer Upstash (voir lib/rate-limit-adapter.ts).
 */

type Bucket = { count: number; resetAt: number }
const store = new Map<string, Bucket>()

/** Premier hop client (Vercel / proxy) — évite de prendre toute la chaîne XFF comme clé */
function looksLikeIp(value: string): boolean {
  if (!value || value.length > 45) return false
  return /^[\d.:a-fA-F%-]+$/.test(value)
}

export function getClientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim()
  if (cf && looksLikeIp(cf)) return cf

  const xf = request.headers.get("x-forwarded-for")
  if (xf) {
    const first = xf.split(",")[0]?.trim()
    if (first && looksLikeIp(first)) return first
  }

  const real = request.headers.get("x-real-ip")?.trim()
  if (real && looksLikeIp(real)) return real

  return "unknown"
}

/**
 * Consomme 1 crédit pour la fenêtre ; refus si max atteint avant resetAt.
 */
export function consumePublicRateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now()
  const existing = store.get(key)
  if (!existing || now >= existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (existing.count >= max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) }
  }
  existing.count += 1
  return { ok: true }
}
