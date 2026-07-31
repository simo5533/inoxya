import { describe, expect, it } from 'vitest'
import { getSchemaAvailability } from '@/lib/seo/availability'
import {
  buildProductStructuredData,
  safeJsonLdString,
} from '@/lib/seo/product-structured-data'
import { getProductGrammar, demonstrativeNoun } from '@/lib/seo/product-grammar'
import { buildMerchantOffer } from '@/lib/seo/merchant-offer'
import { seoAlternates } from '@/lib/seo/config'

describe('getSchemaAvailability', () => {
  it('marks InStock when available and stock > 0', () => {
    expect(
      getSchemaAvailability({ is_available: true, stock: 3 })
    ).toBe('https://schema.org/InStock')
  })

  it('marks OutOfStock when stock is 0', () => {
    expect(
      getSchemaAvailability({ is_available: true, stock: 0 })
    ).toBe('https://schema.org/OutOfStock')
  })

  it('marks OutOfStock when is_available is false', () => {
    expect(
      getSchemaAvailability({ is_available: false, stock: 10 })
    ).toBe('https://schema.org/OutOfStock')
  })

  it('marks PreOrder when flagged', () => {
    expect(
      getSchemaAvailability({ is_preorder: true, stock: 0 })
    ).toBe('https://schema.org/PreOrder')
  })

  it('marks Discontinued when flagged', () => {
    expect(
      getSchemaAvailability({ is_discontinued: true })
    ).toBe('https://schema.org/Discontinued')
  })

  it('treats negative stock as OutOfStock', () => {
    expect(
      getSchemaAvailability({ stock: -1 })
    ).toBe('https://schema.org/OutOfStock')
  })
})

describe('buildProductStructuredData', () => {
  it('builds Product with Offer, brand, sku, no fake GTIN', () => {
    const data = buildProductStructuredData(
      {
        id: '42',
        name: 'Porte Al-Medina',
        description: 'Collier élégant en acier 316L.',
        price: 89,
        image: '/images/test.jpg',
        is_available: true,
        stock: 5,
        category: 'Colliers',
      },
      'fr',
      'https://inoxya.ma/fr/bijoux/42'
    )

    expect(data['@type']).toBe('Product')
    expect(data['@id']).toBe('https://inoxya.ma/fr/bijoux/42#product')
    expect(data['sku']).toBe('42')
    expect(data['description']).toContain('Collier')
    expect(data['gtin13']).toBeUndefined()
    expect(data['gtin']).toBeUndefined()

    const brand = data['brand'] as { name: string }
    expect(brand.name).toContain('INOXYA')

    const offers = data['offers'] as Record<string, unknown>
    expect(offers['availability']).toBe('https://schema.org/InStock')
    expect(offers['priceCurrency']).toBe('MAD')
    expect(offers['price']).toBe('89.00')
    expect(offers['hasMerchantReturnPolicy']).toBeTruthy()
    expect(offers['shippingDetails']).toBeTruthy()

    const returns = offers['hasMerchantReturnPolicy'] as Record<string, unknown>
    expect(returns['returnFees']).toBe('https://schema.org/ReturnShippingFees')
  })

  it('omits AggregateRating when no reviews', () => {
    const data = buildProductStructuredData(
      {
        id: '1',
        name: 'Test',
        price: 100,
        reviews_count: 0,
        rating: 4.5,
      },
      'fr'
    )
    expect(data['aggregateRating']).toBeUndefined()
  })

  it('includes AggregateRating only with authentic reviews', () => {
    const data = buildProductStructuredData(
      {
        id: '1',
        name: 'Test',
        price: 100,
        reviews_count: 3,
        rating: 4.2,
      },
      'fr'
    )
    const ar = data['aggregateRating'] as Record<string, string>
    expect(ar['reviewCount']).toBe('3')
    expect(ar['ratingValue']).toBe('4.2')
  })

  it('rejects invalid rating for AggregateRating', () => {
    const data = buildProductStructuredData(
      {
        id: '1',
        name: 'Test',
        price: 100,
        reviews_count: 2,
        rating: 9,
      },
      'fr'
    )
    expect(data['aggregateRating']).toBeUndefined()
  })

  it('uses fallback description when empty', () => {
    const data = buildProductStructuredData(
      { id: '1', name: 'Bijou X', price: 50, description: '' },
      'fr'
    )
    expect(String(data['description'])).toContain('Bijou X')
    expect(String(data['description']).length).toBeGreaterThan(10)
  })

  it('adds real GTIN13 when provided', () => {
    const data = buildProductStructuredData(
      {
        id: '1',
        name: 'Test',
        price: 10,
        gtin: '4006381333931',
      },
      'fr'
    )
    expect(data['gtin13']).toBe('4006381333931')
  })

  it('safeJsonLdString escapes angle brackets', () => {
    const s = safeJsonLdString({ a: '</script><b>x</b>' })
    expect(s).not.toContain('</script>')
    expect(s).toContain('\\u003c')
  })

  it('JSON has no undefined values after stringify', () => {
    const data = buildProductStructuredData(
      { id: '9', name: 'Y', price: 0, is_available: false, stock: 0 },
      'ar'
    )
    const parsed = JSON.parse(safeJsonLdString(data)) as Record<string, unknown>
    expect(JSON.stringify(parsed).includes('undefined')).toBe(false)
    const offers = parsed['offers'] as Record<string, unknown>
    expect(offers['availability']).toBe('https://schema.org/OutOfStock')
  })
})

describe('product grammar', () => {
  it('uses singular forms for montres/colliers', () => {
    expect(demonstrativeNoun('montres')).toBe('cette montre')
    expect(demonstrativeNoun('colliers')).toBe('ce collier')
    expect(getProductGrammar('montres').suitQuestion).toContain('montre')
    expect(demonstrativeNoun('montres')).not.toContain('montres')
  })
})

describe('merchant offer shipping', () => {
  it('mentions free shipping threshold in shipping name', () => {
    const offer = buildMerchantOffer({
      url: 'https://inoxya.ma/fr/bijoux/1',
      price: 250,
      inStock: true,
    })
    const shipping = offer['shippingDetails'] as Record<string, unknown>
    expect(String(shipping['name'])).toMatch(/200/)
  })
})

describe('seoAlternates', () => {
  it('uses locale-self canonical', () => {
    const fr = seoAlternates('/bijoux/10', 'fr')
    expect(fr.canonical).toContain('/fr/bijoux/10')
    expect(fr.canonical.endsWith('/')).toBe(false)
    const ar = seoAlternates('/bijoux/10', 'ar')
    expect(ar.canonical).toContain('/ar/bijoux/10')
    expect(ar.languages['x-default']).toContain('/fr/')
    expect(ar.languages['fr-MA']).toContain('/fr/')
    expect(ar.languages['ar-MA']).toContain('/ar/')
  })

  it('home canonical has no trailing slash', () => {
    const home = seoAlternates('', 'fr')
    expect(home.canonical.endsWith('/fr')).toBe(true)
    expect(home.canonical.endsWith('/fr/')).toBe(false)
  })
})
