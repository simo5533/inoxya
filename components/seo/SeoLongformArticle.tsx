'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArticleJsonLd,
  BreadcrumbJsonLd,
  FAQPageJsonLd,
} from '@/components/SEOJsonLd'
import { GeoQaBlock } from '@/components/seo/GeoQaBlock'
import type { SeoContentPage } from '@/lib/seo/content/types'
import { getRelatedPages } from '@/lib/seo/content/utils'
import { SEO_CONTENT_PAGES } from '@/lib/seo/content/registry'
import { seoLocalePath } from '@/lib/seo/config'

type SeoLongformArticleProps = {
  page: SeoContentPage
  locale: string
}

export function SeoLongformArticle({ page, locale }: SeoLongformArticleProps) {
  const pageUrl = seoLocalePath(locale, `/guide/${page.slug}`)
  const breadcrumbNav = [
    { name: 'Accueil', href: `/${locale}` },
    { name: 'Guides', href: `/${locale}/guide` },
    { name: page.h1, href: `/${locale}/guide/${page.slug}` },
  ]
  const breadcrumbItems = [
    { name: 'Accueil', url: seoLocalePath(locale, '') },
    { name: 'Guides', url: seoLocalePath(locale, '/guide') },
    { name: page.h1, url: pageUrl },
  ]

  const related = getRelatedPages(page, SEO_CONTENT_PAGES, 4)

  return (
    <article className="bg-white">
      <ArticleJsonLd
        headline={page.h1}
        description={page.metaDescription}
        url={pageUrl}
        image={page.sections.find((s) => s.image)?.image?.src}
        datePublished={page.publishedAt}
        dateModified={page.updatedAt}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <FAQPageJsonLd items={page.faq} />

      <div className="container mx-auto px-4 py-10 md:py-16 max-w-4xl">
        <nav aria-label="Fil d'Ariane" className="text-sm text-gray-600 mb-8 flex flex-wrap gap-1">
          {breadcrumbNav.map((item, i) => (
            <span key={item.href} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-400">/</span>}
              {i < breadcrumbNav.length - 1 ? (
                <Link href={item.href} className="hover:text-luxury-gold transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium line-clamp-1">{item.name}</span>
              )}
            </span>
          ))}
        </nav>

        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-luxury-gold mb-3">
            Guide INOXYA BIJOUX
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
            {page.h1}
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed">{page.intro}</p>
          <p className="mt-4 text-sm text-gray-500">
            Mis à jour le{' '}
            {new Date(page.updatedAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        {page.collectionLinks.length > 0 && (
          <aside className="mb-10 flex flex-wrap gap-2">
            {page.collectionLinks.map((link) => (
              <Link
                key={link.path}
                href={`/${locale}${link.path}`}
                className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:border-luxury-gold/50 hover:bg-luxury-gold/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </aside>
        )}

        <div className="prose prose-gray max-w-none">
          {page.sections.map((section) => (
            <section key={section.h2} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.h2}</h2>
              {section.intro && (
                <p className="text-gray-700 leading-relaxed mb-4 text-lg">{section.intro}</p>
              )}
              {section.paragraphs?.map((p) => (
                <p key={p.slice(0, 48)} className="text-gray-700 leading-relaxed mb-4">
                  {p}
                </p>
              ))}
              {section.image && (
                <figure className="my-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="relative aspect-[16/9] w-full bg-gray-100">
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 896px) 100vw, 896px"
                      loading="lazy"
                    />
                  </div>
                  {section.image.caption && (
                    <figcaption className="text-sm text-gray-500 px-4 py-3 bg-gray-50">
                      {section.image.caption}
                    </figcaption>
                  )}
                </figure>
              )}
              {section.subsections?.map((sub) => (
                <div key={sub.h3} className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{sub.h3}</h3>
                  {sub.paragraphs.map((p) => (
                    <p key={p.slice(0, 48)} className="text-gray-700 leading-relaxed mb-4">
                      {p}
                    </p>
                  ))}
                </div>
              ))}
              {section.table && (
                <div className="my-8 overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm text-left min-w-[320px]">
                    {section.table.caption && (
                      <caption className="px-4 py-3 text-left font-semibold text-gray-900 bg-gray-50">
                        {section.table.caption}
                      </caption>
                    )}
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        {section.table.headers.map((h) => (
                          <th key={h} className="px-4 py-3 font-semibold text-gray-900">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row.join('-')} className="border-b border-gray-100 last:border-0">
                          {row.map((cell) => (
                            <td key={cell} className="px-4 py-3 text-gray-700">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          {page.comparison && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{page.comparison.title}</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm min-w-[320px]">
                  <thead>
                    <tr className="bg-luxury-gold/10 border-b">
                      {page.comparison.headers.map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {page.comparison.rows.map((row) => (
                      <tr key={row.label} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                        <td className="px-4 py-3 text-gray-700">{row.acier316l}</td>
                        <td className="px-4 py-3 text-gray-700">{row.autre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <GeoQaBlock items={page.faq} title="Questions fréquentes" includeJsonLd={false} />

        {related.length > 0 && (
          <section className="mt-12 pt-10 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Guides associés</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {related.map((rel) => (
                <li key={rel.slug}>
                  <Link
                    href={`/${locale}/guide/${rel.slug}`}
                    className="block p-4 rounded-xl border border-gray-100 hover:border-luxury-gold/40 hover:bg-gray-50 transition-colors text-gray-800 font-medium"
                  >
                    {rel.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{page.cta.title}</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{page.cta.description}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${locale}${page.cta.primaryPath}`}
              className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-luxury-gold text-luxury-black font-semibold hover:bg-luxury-gold/90 transition-colors"
            >
              {page.cta.primaryLabel}
            </Link>
            {page.cta.secondaryPath && page.cta.secondaryLabel && (
              <Link
                href={`/${locale}${page.cta.secondaryPath}`}
                className="inline-flex justify-center items-center px-6 py-3 rounded-xl border border-gray-300 text-gray-800 font-medium hover:bg-white transition-colors"
              >
                {page.cta.secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
