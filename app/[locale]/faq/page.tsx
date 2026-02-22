// Forcer le rendu dynamique pour éviter l'erreur dynamicAccess
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const dynamicParams = true

import { Metadata } from 'next'
import FAQWrapper from './FAQWrapper'
import { getSiteUrlSafe } from '@/lib/site-url'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const siteUrl = getSiteUrlSafe()
  try {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'faq' })
    return {
      title: t('title'),
      description: t('description'),
      keywords: t('keywords').split(','),
      openGraph: {
        title: t('title'),
        description: t('description'),
        url: `${siteUrl}/${locale}/faq`,
        siteName: "INOXYA BIJOUX",
        images: [{ url: `${siteUrl}/images/packs/pack-elegancia.jpg`, width: 1200, height: 630, alt: t('title') }],
        locale: locale === 'ar' ? 'ar_MA' : 'fr_FR',
        type: "website",
      },
      twitter: { card: "summary_large_image", title: t('title'), description: t('description'), images: [`${siteUrl}/images/packs/pack-elegancia.jpg`] },
      alternates: { canonical: `${siteUrl}/${locale}/faq`, languages: { fr: `${siteUrl}/fr/faq`, ar: `${siteUrl}/ar/faq` } },
    }
  } catch {
    return { title: 'FAQ | INOXYA BIJOUX', description: 'Foire aux questions.', metadataBase: new URL(siteUrl) }
  }
}

export default async function FAQPage() {
  return <FAQWrapper />
}
