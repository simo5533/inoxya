// Forcer le rendu dynamique pour toutes les pages [locale] pour éviter les erreurs next-intl
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const dynamicParams = true

 
import { NextIntlClientProvider } from 'next-intl'
 
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type React from "react"
import type { Metadata } from 'next'
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import JewelryBanner from "@/components/JewelryBanner"
import LocaleHtmlAttributes from "@/components/LocaleHtmlAttributes"
import { Toaster } from "@/components/ui/toaster"
import { ClientProviders } from "@/components/ClientProviders"

export const metadata: Metadata = {
  title: {
    default: 'INOXYA BIJOUX — Bijoux acier inoxydable Maroc',
    template: '%s | INOXYA BIJOUX',
  },
  description:
    'Bijoux en acier inoxydable 316L premium. Artisanat marocain authentique. Livraison gratuite dès 200 MAD.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://inoxya.ma'
  ),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'INOXYA Bijoux',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Désactiver complètement la génération statique pour éviter l'erreur dynamicAccess
// Retourner un tableau vide force Next.js à rendre toutes les pages dynamiquement
export function generateStaticParams() {
  // Retourner un tableau vide désactive le prerendering
  // Toutes les pages seront rendues à la demande (SSR uniquement)
  return []
}

async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Valider la locale
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  // OPTIMISATION: Charger les messages avec timeout et fallback
  let messages
  try {
    messages = await getMessages({ locale })
  } catch (error) {
    // Fallback si erreur de chargement des messages
    console.error(`[LocaleLayout] Erreur chargement messages pour ${locale}:`, error)
    // Utiliser un objet vide pour éviter de bloquer le rendu
    messages = {}
  }

  // Déterminer la direction (RTL pour l'arabe)
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const lang = locale === 'ar' ? 'ar' : 'fr'

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <LocaleHtmlAttributes />
      <ClientProviders>
        <div dir={dir} lang={lang} className={locale === 'ar' ? 'rtl' : 'ltr'}>
          <Header />
          <JewelryBanner />
          <main className="min-h-screen w-full max-w-full overflow-x-hidden">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </ClientProviders>
    </NextIntlClientProvider>
  )
}

LocaleLayout.displayName = 'LocaleLayout'

export default LocaleLayout

