import type { Metadata } from 'next'
import type React from 'react'
import { getAllPacks } from '@/lib/database'
import { seoPageMetadata } from '@/lib/seo/config'
import { ItemListJsonLd } from '@/components/SEOJsonLd'
import { seoLocalePath } from '@/lib/seo/config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return seoPageMetadata({
    title: 'Packs bijoux acier inoxydable Maroc',
    description:
      'Packs cadeaux INOXYA en acier inoxydable 316L : ensembles à prix avantageux, livraison Maroc, paiement à la livraison.',
    path: '/packs',
    locale,
  })
}

export default async function PacksLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  let packs: Array<{
    id?: string | number
    name?: string
    description?: string
    price?: number
    original_price?: number
  }> = []
  try {
    packs = (await getAllPacks()) as typeof packs
  } catch {
    packs = []
  }

  const listItems = packs.map((p, i) => ({
    name: p.name || 'Pack INOXYA',
    url: seoLocalePath(locale, '/packs'),
    position: i + 1,
  }))

  return (
    <>
      {listItems.length > 0 ? <ItemListJsonLd items={listItems} /> : null}
      {packs.length > 0 ? (
        <section className="sr-only" aria-label="Catalogue packs INOXYA">
          <h1>Packs bijoux acier inoxydable INOXYA Maroc</h1>
          <ul>
            {packs.map((pack) => (
              <li key={String(pack.id)}>
                <h2>{pack.name}</h2>
                {pack.description ? <p>{pack.description}</p> : null}
                <p>
                  Prix : {pack.price} MAD
                  {pack.original_price && pack.original_price > (pack.price || 0)
                    ? ` (au lieu de ${pack.original_price} MAD)`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {children}
    </>
  )
}
