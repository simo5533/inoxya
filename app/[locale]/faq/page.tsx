// Forcer le rendu dynamique pour éviter l'erreur dynamicAccess
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const dynamicParams = true

import { Metadata } from 'next'
import FAQWrapper from './FAQWrapper'
import { FaqSeoContent } from './FaqSeoContent'
import { seoPageMetadata } from '@/lib/seo/config'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  try {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'faq' })
    return seoPageMetadata({
      title: t('title') || 'FAQ bijoux acier inoxydable Maroc',
      description:
        t('description') ||
        'Livraison, paiement à la livraison, entretien 316L, retours 30 jours : réponses INOXYA BIJOUX sur vos commandes au Maroc.',
      path: '/faq',
      locale,
      keywords: t('keywords')?.split(',') || undefined,
    })
  } catch {
    return seoPageMetadata({
      title: 'FAQ',
      description: 'Foire aux questions INOXYA BIJOUX.',
      path: '/faq',
      locale: 'fr',
    })
  }
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <>
      <FaqSeoContent locale={locale} />
      <FAQWrapper />
    </>
  )
}
