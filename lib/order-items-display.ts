import { getBijouById, getPackByIdPublic } from '@/lib/database'
import { normalizeImageUrl, PLACEHOLDER_IMAGE } from '@/lib/image-path'

export type OrderItemRow = {
  id: string
  order_id?: string
  bijou_id?: string | null
  pack_id?: string | null
  quantity: number
  price: number
  product_name?: string | null
}

export type EnrichedOrderItem = OrderItemRow & {
  display_name: string
  image_url: string
  is_pack: boolean
}

function cleanRef(id?: string | null): string | null {
  if (id == null) return null
  const s = String(id).trim()
  if (!s || s === 'null' || s === 'undefined') return null
  return s
}

export async function enrichOrderItemsForDisplay(
  items: OrderItemRow[]
): Promise<EnrichedOrderItem[]> {
  const needsPriceFallback = items.some((item) => {
    const bijouId = cleanRef(item.bijou_id)
    const packId = cleanRef(item.pack_id)
    const storedName = item.product_name?.trim() || null
    return !bijouId && !packId && !storedName
  })

  let packsByPrice: Map<number, { name: string; image_url?: string | null }> | null = null
  let productsByPrice: Map<number, { name: string; image_url?: string | null }> | null = null

  if (needsPriceFallback) {
    const { getAllPacks, getAllBijoux } = await import('@/lib/database')
    const [packs, products] = await Promise.all([getAllPacks(), getAllBijoux()])
    packsByPrice = new Map()
    for (const p of packs) {
      const key = Math.round(Number(p.price) * 100)
      if (!packsByPrice.has(key)) {
        packsByPrice.set(key, { name: p.name, image_url: p.image_url })
      }
    }
    productsByPrice = new Map()
    for (const p of products) {
      const key = Math.round(Number(p.price) * 100)
      if (!productsByPrice.has(key)) {
        productsByPrice.set(key, {
          name: p.name,
          image_url: p.main_image || p.image_url,
        })
      }
    }
  }

  return Promise.all(
    items.map(async (item) => {
      const bijouId = cleanRef(item.bijou_id)
      const packId = cleanRef(item.pack_id)
      const storedName = item.product_name?.trim() || null
      let display_name = storedName || 'Article inconnu'
      let image_url = PLACEHOLDER_IMAGE
      let is_pack = Boolean(packId)

      if (packId) {
        const pack = await getPackByIdPublic(packId)
        if (pack) {
          display_name = storedName || pack.name
          image_url = normalizeImageUrl(pack.image_url)
          is_pack = true
        } else if (!storedName) {
          display_name = `Pack #${packId.slice(-8)}`
        }
      } else if (bijouId) {
        const product = await getBijouById(bijouId)
        if (product) {
          display_name = storedName || product.name
          image_url = normalizeImageUrl(product.main_image || product.image_url)
        } else if (!storedName) {
          display_name = `Produit #${bijouId.slice(-8)}`
        }
      } else if (storedName) {
        display_name = storedName
      } else {
        const priceKey = Math.round(Number(item.price) * 100)
        const packHit = packsByPrice?.get(priceKey)
        if (packHit) {
          display_name = packHit.name
          image_url = normalizeImageUrl(packHit.image_url)
          is_pack = true
        } else {
          const productHit = productsByPrice?.get(priceKey)
          if (productHit) {
            display_name = productHit.name
            image_url = normalizeImageUrl(productHit.image_url)
          } else {
            display_name = `Article (${Number(item.price).toFixed(0)} MAD)`
          }
        }
      }

      return {
        ...item,
        bijou_id: bijouId ?? undefined,
        pack_id: packId ?? undefined,
        display_name,
        image_url,
        is_pack,
      }
    })
  )
}
