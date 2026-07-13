import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { GlobalSeoJsonLd } from "@/components/SEOJsonLd"
import { MetaPixel } from "@/components/MetaPixel"

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
import { BRAND_LOGO_ICON } from '@/lib/brand'

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
        url: `${siteUrl}${BRAND_LOGO_ICON}`,
        width: 1024,
        height: 1024,
        alt: "INOXYA BIJOUX",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "INOXYA BIJOUX - Embellie ton âme",
    description: "Bijoux en acier inoxydable de qualité premium",
    images: [`${siteUrl}${BRAND_LOGO_ICON}`],
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
    google: 'google43cc1435106addd6',
  },
  icons: {
    icon: [
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { rel: 'mask-icon', url: '/favicon-192x192.png' },
    ],
  },
  manifest: '/site.webmanifest',
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
        <MetaPixel />
        {children}
      </body>
    </html>
  )
}
