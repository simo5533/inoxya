import { describe, expect, it } from 'vitest'
import {
  assignProductSlugs,
  isLikelyProductIdParam,
  isValidStoredProductSlug,
  productHref,
  resolveProductSlug,
  slugifyProductName,
} from '@/lib/product-slug'

describe('product-slug', () => {
  it('slugifies accents and spaces', () => {
    expect(slugifyProductName('Auréa Luxe')).toBe('aurea-luxe')
    expect(slugifyProductName('Fleur de Grâce')).toBe('fleur-de-grace')
  })

  it('keeps stored slug stable when name changes', () => {
    expect(
      resolveProductSlug({ id: '18', name: 'Nouveau Nom', slug: 'fleur-de-grace' })
    ).toBe('fleur-de-grace')
  })

  it('avoids reserved category slugs', () => {
    const slug = resolveProductSlug({ id: '99', name: 'Bagues' })
    expect(slug).not.toBe('bagues')
    expect(slug).toContain('99')
  })

  it('assigns unique slugs in a catalog', () => {
    const map = assignProductSlugs([
      { id: '1', name: 'Luna' },
      { id: '2', name: 'Luna' },
      { id: '18', name: 'Fleur de Grâce' },
    ])
    expect(map.get('18')).toBe('fleur-de-grace')
    expect(map.get('1')).toBe('luna')
    expect(map.get('2')).not.toBe(map.get('1'))
  })

  it('builds locale href', () => {
    expect(productHref('fr', { id: '40', name: 'Bague Glamour' })).toBe(
      '/fr/bijoux/bague-glamour'
    )
    expect(productHref('ar', { id: '40', name: 'Bague Glamour' })).toBe(
      '/ar/bijoux/bague-glamour'
    )
  })

  it('detects id-like params', () => {
    expect(isLikelyProductIdParam('18')).toBe(true)
    expect(isLikelyProductIdParam('prod-1782845038534-rn3ou6d')).toBe(true)
    expect(isLikelyProductIdParam('aurea-luxe')).toBe(false)
  })

  it('rejects reserved stored slugs', () => {
    expect(isValidStoredProductSlug('bagues')).toBe(false)
    expect(isValidStoredProductSlug('aurea-luxe')).toBe(true)
  })
})
