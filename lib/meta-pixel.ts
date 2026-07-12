/**
 * Meta (Facebook) Pixel — tracking Ads / Events Manager
 */

export const META_PIXEL_ID =
  (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_META_PIXEL_ID']?.trim()) ||
  '144661971293405'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

export function trackMetaEvent(
  event: string,
  params?: Record<string, string | number | string[] | undefined>
): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  if (params) {
    window.fbq('track', event, params)
  } else {
    window.fbq('track', event)
  }
}

export function trackMetaPageView(): void {
  trackMetaEvent('PageView')
}

export function trackMetaPurchase(opts: {
  value: number
  currency?: string
  orderId?: string | null
}): void {
  trackMetaEvent('Purchase', {
    value: opts.value,
    currency: opts.currency ?? 'MAD',
    content_ids: opts.orderId ? [String(opts.orderId)] : undefined,
  })
}

export function trackMetaInitiateCheckout(opts?: {
  value?: number
  currency?: string
}): void {
  trackMetaEvent('InitiateCheckout', {
    value: opts?.value,
    currency: opts?.currency ?? 'MAD',
  })
}

export function trackMetaAddToCart(opts?: {
  value?: number
  currency?: string
  contentName?: string
}): void {
  trackMetaEvent('AddToCart', {
    value: opts?.value,
    currency: opts?.currency ?? 'MAD',
    content_name: opts?.contentName,
  })
}
