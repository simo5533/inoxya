import type { Metadata } from 'next'
import { getSiteUrlSafe } from '@/lib/site-url'

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrlSafe()
  return {
    title: 'Créer mon pack | INOXYA BIJOUX',
    description:
      'Composez votre pack personnalisé en acier inoxydable : sélection de bijoux éligibles et −20 % sur le total.',
    alternates: { canonical: `${siteUrl}/packs/creer` },
    openGraph: {
      title: 'Créer mon pack | INOXYA BIJOUX',
      description: 'Pack personnalisé avec remise −20 % sur le total.',
      url: `${siteUrl}/packs/creer`,
      siteName: 'INOXYA BIJOUX',
      type: 'website',
      locale: 'fr_FR',
    },
  }
}

export default function CreerPackLayout({ children }: { children: React.ReactNode }) {
  return children
}
