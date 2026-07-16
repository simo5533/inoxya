import type { Metadata } from "next"
import { getSiteUrlSafe } from '@/lib/site-url'
import { BRAND_LOGO } from '@/lib/brand'

const siteUrl = getSiteUrlSafe()

export const metadata: Metadata = {
  title: "Bijoux Sur Mesure | INOXYA BIJOUX",
  description: "Créez le bijou de vos rêves avec notre service personnalisé. Nos maîtres artisans transforment votre vision en pièce unique d'exception. Design personnalisé, artisanat expert.",
  keywords: ["bijoux sur mesure", "bijoux personnalisés", "création bijoux", "bijoux uniques", "artisanat bijoux", "design bijoux"],
  openGraph: {
    title: "Bijoux Sur Mesure | INOXYA BIJOUX",
    description: "Créez le bijou de vos rêves avec notre service personnalisé. Pièces uniques d'exception.",
    url: `${siteUrl}/sur-mesure`,
    siteName: "INOXYA BIJOUX",
    images: [
      {
        url: `${siteUrl}${BRAND_LOGO}`,
        width: 512,
        height: 512,
        alt: "INOXYA BIJOUX - Bijoux Sur Mesure",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bijoux Sur Mesure | INOXYA BIJOUX",
    description: "Créez le bijou de vos rêves avec notre service personnalisé",
    images: [`${siteUrl}${BRAND_LOGO}`],
  },
  alternates: {
    canonical: `${siteUrl}/fr/sur-mesure`,
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function SurMesureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

