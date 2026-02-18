// Forcer le rendu dynamique pour toutes les pages [locale] pour éviter les erreurs next-intl
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type React from "react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import JewelryBanner from "@/components/JewelryBanner"
import LocaleHtmlAttributes from "@/components/LocaleHtmlAttributes"
import { Toaster } from "@/components/ui/toaster"
import { ClientProviders } from "@/components/ClientProviders"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Valider la locale
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Charger les messages pour cette locale
  const messages = await getMessages({ locale })

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
          <main className="min-h-screen">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </ClientProviders>
    </NextIntlClientProvider>
  )
}

