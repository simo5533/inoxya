import type { Metadata } from "next"
import { seoPageMetadata } from '@/lib/seo/config'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return seoPageMetadata({
    title: 'Bijoux Sur Mesure | INOXYA BIJOUX',
    description:
      "Créez le bijou de vos rêves avec notre service personnalisé. Nos maîtres artisans transforment votre vision en pièce unique d'exception. Design personnalisé, artisanat expert.",
    keywords: [
      'bijoux sur mesure',
      'bijoux personnalisés',
      'création bijoux',
      'bijoux uniques',
      'artisanat bijoux',
      'design bijoux',
    ],
    path: '/sur-mesure',
    locale,
  })
}

export default function SurMesureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

