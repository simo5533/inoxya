/**
 * Pack personnalisé INOXYA : −20 % sur le sous-total, détail stocké par ligne panier.
 */

export const PACK_BUILDER_DISCOUNT = 0.2

/**
 * Stock non renvoyé par certains adapters — éligible au builder ; le checkout revalide en base.
 */
export const STOCK_UNKNOWN = -1

/** Nombre maximum de références produit distinctes dans un pack personnalisé */
export const PACK_BUILDER_MAX_ITEMS = 6

const SNAPSHOT_KEY = 'inoxya_custom_pack_snapshots'

export type PackBuilderLine = {
  productId: string
  name: string
  price: number
  image_url: string
  /** Quantité dans le pack (1 par défaut ; contrainte stock côté UI) */
  quantity: number
}

export type CustomPackSnapshot = {
  items: PackBuilderLine[]
  subtotal: number
  discountRate: number
  discountAmount: number
  total: number
  updatedAt: string
}

export function isCustomPackLineId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('custom-pack-')
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export function computePackTotals(items: PackBuilderLine[]): Pick<
  CustomPackSnapshot,
  'subtotal' | 'discountRate' | 'discountAmount' | 'total'
> {
  const subtotal = roundMoney(
    items.reduce((s, it) => s + it.price * it.quantity, 0)
  )
  const discountRate = PACK_BUILDER_DISCOUNT
  const discountAmount = roundMoney(subtotal * discountRate)
  const total = roundMoney(subtotal - discountAmount)
  return { subtotal, discountRate, discountAmount, total }
}

function readAllSnapshots(): Record<string, CustomPackSnapshot> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, CustomPackSnapshot>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAllSnapshots(map: Record<string, CustomPackSnapshot>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(map))
}

export function saveCustomPackSnapshot(lineId: string, snapshot: CustomPackSnapshot): void {
  const all = readAllSnapshots()
  all[lineId] = snapshot
  writeAllSnapshots(all)
}

export function getCustomPackSnapshot(lineId: string): CustomPackSnapshot | null {
  const all = readAllSnapshots()
  return all[lineId] ?? null
}

export function removeCustomPackSnapshot(lineId: string): void {
  const all = readAllSnapshots()
  if (all[lineId]) {
    delete all[lineId]
    writeAllSnapshots(all)
  }
}

export function clearAllCustomPackSnapshots(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SNAPSHOT_KEY)
}
