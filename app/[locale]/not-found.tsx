import Link from 'next/link'
import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Page introuvable | INOXYA BIJOUX',
  robots: { index: false, follow: false },
}

export default async function LocaleNotFound() {
  const locale = await getLocale()
  const href = locale === 'ar' ? '/ar' : '/fr'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Page introuvable
        </h2>
        <p className="text-gray-500 mb-8">
          La page que vous cherchez n&apos;existe pas ou a ete deplacee.
        </p>
        <Link
          href={href}
          className="inline-flex items-center justify-center h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
        >
          Retour a l&apos;accueil
        </Link>
      </div>
    </div>
  )
}

