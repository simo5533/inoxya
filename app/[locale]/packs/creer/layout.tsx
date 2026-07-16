import type { Metadata } from 'next'
import { seoPageMetadata } from '@/lib/seo/config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return seoPageMetadata({
    title: 'Créer mon pack | INOXYA BIJOUX',
    description:
      'Composez votre pack personnalisé en acier inoxydable : sélection de bijoux éligibles et −20 % sur le total.',
    path: '/packs/creer',
    locale,
  })
}

export default function CreerPackLayout({ children }: { children: React.ReactNode }) {
  return children
}
