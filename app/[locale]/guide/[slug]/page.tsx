import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SeoLongformArticle } from '@/components/seo/SeoLongformArticle'
import { getSeoContentPage, SEO_CONTENT_SLUGS } from '@/lib/seo/content/registry'
import { seoPageMetadata } from '@/lib/seo/config'

type Props = { params: Promise<{ locale: string; slug: string }> }

export function generateStaticParams() {
  return SEO_CONTENT_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const page = getSeoContentPage(slug)
  if (!page) return { title: 'Guide | INOXYA BIJOUX' }
  return seoPageMetadata({
    title: page.title,
    description: page.metaDescription,
    path: `/guide/${slug}`,
    locale,
    ogImage: page.sections.find((s) => s.image)?.image?.src,
  })
}

export default async function GuideSlugPage({ params }: Props) {
  const { locale, slug } = await params
  const page = getSeoContentPage(slug)
  if (!page) notFound()

  return <SeoLongformArticle page={page} locale={locale} />
}
