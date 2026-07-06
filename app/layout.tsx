import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { GlobalSeoJsonLd } from "@/components/SEOJsonLd"

// Validation environnement au démarrage (serveur uniquement)
// TEMPORAIRE: Désactivé pour diagnostic - réactiver après fix
// if (typeof window === 'undefined') {
//   try {
//     const { ensureValidEnvironment } = require('@/lib/env-validator')
//     ensureValidEnvironment()
//   } catch (error) {
//     // En développement, on continue même si validation échoue
//     if (process.env['NODE_ENV'] === 'production') {
//       console.error('[CRITICAL] Environment validation failed:', error)
//     }
//   }
// }

const inter = Inter({ subsets: ["latin"], display: "swap", preload: true })

import { getSiteUrlSafe } from '@/lib/site-url'
import { BRAND_LOGO, BRAND_LOGO_ICON } from '@/lib/brand'

const siteUrl = getSiteUrlSafe()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "INOXYA BIJOUX — Embellie ton âme",
  description: "Bijoux en acier inoxydable de qualité premium. Durables, hypoallergéniques et élégants. Collection berbère authentique.",
  keywords: ["bijoux", "acier inoxydable", "bijoux berbères", "bijoux maroc", "bijoux premium", "colliers", "bagues", "bracelets"],
  authors: [{ name: "INOXYA BIJOUX" }],
  creator: "INOXYA BIJOUX",
  publisher: "INOXYA BIJOUX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "INOXYA BIJOUX",
    title: "INOXYA BIJOUX - Embellie ton âme",
    description: "Bijoux en acier inoxydable de qualité premium. Durables, hypoallergéniques et élégants.",
    images: [
      {
        url: `${siteUrl}${BRAND_LOGO}`,
        width: 512,
        height: 512,
        alt: "INOXYA BIJOUX",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "INOXYA BIJOUX - Embellie ton âme",
    description: "Bijoux en acier inoxydable de qualité premium",
    images: [`${siteUrl}${BRAND_LOGO}`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  icons: {
    icon: BRAND_LOGO_ICON,
    apple: BRAND_LOGO_ICON,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ce layout gère toutes les routes (admin, API, et [locale])
  // Le layout [locale] est imbriqué dans celui-ci
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <GlobalSeoJsonLd />
      </head>
      <body className={`${inter.className} overflow-x-hidden max-w-[100vw]`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
