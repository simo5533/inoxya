// Forcer le rendu dynamique pour éviter l'erreur dynamicAccess
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const dynamicParams = true

import { Metadata } from 'next'
import FAQWrapper from './FAQWrapper'
import { seoPageMetadata } from '@/lib/seo/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  try {
    const { locale } = await params
    return seoPageMetadata({
      title: 'FAQ bijoux acier inoxydable Maroc',
      description:
        'Livraison, paiement à la livraison, entretien 316L, retours 30 jours : réponses INOXYA BIJOUX sur vos commandes au Maroc.',
      path: '/faq',
      locale,
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

export default async function FAQPage() {
  return <FAQWrapper />
}
