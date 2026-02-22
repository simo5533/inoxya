import type { Metadata } from "next"
import { getSiteUrlSafe } from '@/lib/site-url'

const siteUrl = getSiteUrlSafe()

export const metadata: Metadata = {
  title: "Packs Exclusifs | INOXYA BIJOUX",
  description: "Découvrez nos packs exclusifs de bijoux en acier inoxydable premium. Collections complètes à prix avantageux. Bagues, colliers, bracelets et plus.",
  keywords: ["packs bijoux", "collections bijoux", "bijoux pack", "bijoux acier inoxydable", "bijoux premium", "bijoux maroc"],
  openGraph: {
    title: "Packs Exclusifs | INOXYA BIJOUX",
    description: "Découvrez nos packs exclusifs de bijoux en acier inoxydable premium. Collections complètes à prix avantageux.",
    url: `${siteUrl}/packs`,
    siteName: "INOXYA BIJOUX",
    images: [
      {
        url: `${siteUrl}/icon.svg`,
        width: 1200,
        height: 630,
        alt: "INOXYA BIJOUX - Packs Exclusifs",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Packs Exclusifs | INOXYA BIJOUX",
    description: "Découvrez nos packs exclusifs de bijoux en acier inoxydable premium",
    images: [`${siteUrl}/icon.svg`],
  },
  alternates: {
    canonical: `${siteUrl}/packs`,
  },
}

export default function PacksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

