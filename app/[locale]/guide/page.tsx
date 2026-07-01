import type { Metadata } from 'next'
import Link from 'next/link'
import { getSeoFooterGroups, SEO_CONTENT_SLUGS, SEO_CONTENT_PAGES } from '@/lib/seo/content/registry'
import { seoPageMetadata } from '@/lib/seo/config'
import { ItemListJsonLd } from '@/components/SEOJsonLd'
import { seoLocalePath } from '@/lib/seo/config'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return seoPageMetadata({
    title: 'Guides bijoux acier inoxydable Maroc',
    description:
      'Guides INOXYA : entretien 316L, choix bagues, livraison, cadeaux et bijoux hypoallergéniques au Maroc.',
    path: '/guide',
    locale,
  })
}

export default async function GuideIndexPage({ params }: Props) {
  const { locale } = await params
  const groups = getSeoFooterGroups()

  const listItems = SEO_CONTENT_SLUGS.map((slug, i) => ({
    name: SEO_CONTENT_PAGES[slug].title,
    url: seoLocalePath(locale, `/guide/${slug}`),
    position: i + 1,
  }))

  return (
    <div className="bg-gray-50 min-h-screen">
      <ItemListJsonLd items={listItems} />
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        <nav className="text-sm text-gray-600 mb-6">
          <Link href={`/${locale}`} className="hover:text-luxury-gold">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Guides</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Guides bijoux en acier inoxydable
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            Conseils INOXYA pour choisir, entretenir et acheter vos bijoux en acier 316L au Maroc :
            livraison, paiement à la livraison, cadeaux et entretien.
          </p>
        </header>

        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.cluster}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                {group.label}
              </h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {group.pages.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/${locale}/guide/${p.slug}`}
                      className="block p-4 rounded-xl bg-white border border-gray-100 hover:border-luxury-gold/40 hover:shadow-sm transition-all text-gray-800"
                    >
                      <span className="font-medium line-clamp-2">
                        {SEO_CONTENT_PAGES[p.slug].title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-white border border-gray-100 text-center">
          <p className="text-gray-700 mb-4">Prêt à découvrir la collection ?</p>
          <Link
            href={`/${locale}/bijoux`}
            className="inline-flex px-6 py-3 rounded-xl bg-luxury-gold text-luxury-black font-semibold hover:bg-luxury-gold/90"
          >
            Voir les bijoux INOXYA
          </Link>
        </div>
      </div>
    </div>
  )
}
